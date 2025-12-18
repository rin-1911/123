import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasAnyRole } from "@/lib/types";
import { formatDate } from "@/lib/utils";

/**
 * GET: 获取患者咨询记录列表
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = session.user;
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId") || user.storeId;
  const startDate = searchParams.get("startDate") || formatDate(new Date());
  const endDate = searchParams.get("endDate") || formatDate(new Date());
  const status = searchParams.get("status"); // PENDING, DEAL, NO_DEAL
  const consultantId = searchParams.get("consultantId");

  if (!storeId) {
    return NextResponse.json({ error: "缺少门店参数" }, { status: 400 });
  }

  try {
    // 检查权限
    const canViewAll = hasAnyRole(user.roles, ["HQ_ADMIN", "STORE_MANAGER"]);
    const isConsultant = user.departmentId && 
      await prisma.department.findFirst({
        where: { id: user.departmentId, code: "CONSULTATION" }
      });

    // 如果不是管理员且不是咨询部，检查是否有查看权限
    if (!canViewAll && !isConsultant) {
      const permission = await prisma.consultationViewPermission.findFirst({
        where: {
          userId: user.id,
          storeId,
          isActive: true,
          OR: [
            { validUntil: null },
            { validUntil: { gte: new Date() } }
          ]
        }
      });

      if (!permission) {
        return NextResponse.json({ 
          error: "您没有权限查看咨询记录，请联系管理员授权" 
        }, { status: 403 });
      }

      if (!permission.canViewAll) {
        // 只能查看统计，不能查看详情
        return NextResponse.json({ 
          error: "您只有查看统计的权限，无法查看详细记录" 
        }, { status: 403 });
      }
    }

    // 构建查询条件
    const where: {
      storeId: string;
      visitDate: { gte: string; lte: string };
      dealStatus?: string;
      consultantId?: string;
    } = {
      storeId,
      visitDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    // 咨询师只能看自己的记录（除非是主管）
    if (isConsultant && !hasAnyRole(user.roles, ["DEPT_LEAD", "STORE_MANAGER", "HQ_ADMIN"])) {
      where.consultantId = user.id;
    } else if (consultantId) {
      where.consultantId = consultantId;
    }

    if (status) {
      where.dealStatus = status;
    }

    // 获取记录
    const records = await prisma.patientConsultation.findMany({
      where,
      include: {
        consultant: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { visitDate: "desc" },
        { createdAt: "desc" }
      ]
    });

    // 计算统计数据
    const stats = {
      total: records.length,
      pending: records.filter(r => r.dealStatus === "PENDING").length,
      deal: records.filter(r => r.dealStatus === "DEAL").length,
      noDeal: records.filter(r => r.dealStatus === "NO_DEAL").length,
      totalDealAmount: records.filter(r => r.dealStatus === "DEAL")
        .reduce((sum, r) => sum + r.dealAmount, 0),
      totalDeposit: records.reduce((sum, r) => sum + r.depositAmount, 0),
      initialVisits: records.filter(r => r.visitType === "INITIAL").length,
      returnVisits: records.filter(r => r.visitType === "RETURN").length,
    };

    // 格式化记录（转换金额为元）
    const formattedRecords = records.map(r => ({
      ...r,
      dealAmountYuan: r.dealAmount / 100,
      depositAmountYuan: r.depositAmount / 100,
      toothPositions: r.toothPositions ? JSON.parse(r.toothPositions) : [],
      intendedProjects: r.intendedProjects ? JSON.parse(r.intendedProjects) : [],
      dealProjects: r.dealProjects ? JSON.parse(r.dealProjects) : [],
      followHistory: r.followHistory ? JSON.parse(r.followHistory) : [],
    }));

    return NextResponse.json({
      records: formattedRecords,
      stats,
      dateRange: { startDate, endDate },
    });
  } catch (error) {
    console.error("获取咨询记录失败:", error);
    return NextResponse.json({ error: "获取数据失败" }, { status: 500 });
  }
}

/**
 * POST: 创建新的患者咨询记录
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = session.user;

  // 检查是否是咨询部或管理员
  const isConsultant = user.departmentId && 
    await prisma.department.findFirst({
      where: { id: user.departmentId, code: "CONSULTATION" }
    });

  if (!isConsultant && !hasAnyRole(user.roles, ["HQ_ADMIN", "STORE_MANAGER"])) {
    return NextResponse.json({ error: "只有咨询师可以填写咨询记录" }, { status: 403 });
  }

  if (!user.storeId) {
    return NextResponse.json({ error: "用户未关联门店" }, { status: 400 });
  }

  try {
    const data = await request.json();

    // 验证必填字段
    if (!data.patientName) {
      return NextResponse.json({ error: "患者姓名不能为空" }, { status: 400 });
    }
    if (!data.visitDate) {
      return NextResponse.json({ error: "就诊日期不能为空" }, { status: 400 });
    }

    // 创建记录
    const record = await prisma.patientConsultation.create({
      data: {
        patientName: data.patientName,
        patientPhone: data.patientPhone || null,
        patientAge: data.patientAge ? parseInt(data.patientAge) : null,
        patientGender: data.patientGender || null,
        visitDate: data.visitDate,
        visitType: data.visitType || "INITIAL",
        source: data.source || null,
        referrer: data.referrer || null,
        toothPositions: data.toothPositions ? JSON.stringify(data.toothPositions) : null,
        chiefComplaint: data.chiefComplaint || null,
        diagnosis: data.diagnosis || null,
        intendedProjects: data.intendedProjects ? JSON.stringify(data.intendedProjects) : null,
        intentionLevel: data.intentionLevel || null,
        dealStatus: data.dealStatus || "PENDING",
        dealProjects: data.dealProjects ? JSON.stringify(data.dealProjects) : null,
        dealAmount: data.dealAmount ? Math.round(parseFloat(data.dealAmount) * 100) : 0,
        depositAmount: data.depositAmount ? Math.round(parseFloat(data.depositAmount) * 100) : 0,
        paymentMethod: data.paymentMethod || null,
        noDealReason: data.noDealReason || null,
        noDealDetail: data.noDealDetail || null,
        nextFollowDate: data.nextFollowDate || null,
        nextFollowNote: data.nextFollowNote || null,
        remark: data.remark || null,
        consultantId: user.id,
        storeId: user.storeId,
      },
      include: {
        consultant: {
          select: { id: true, name: true }
        }
      }
    });

    return NextResponse.json({
      success: true,
      record: {
        ...record,
        dealAmountYuan: record.dealAmount / 100,
        depositAmountYuan: record.depositAmount / 100,
      }
    });
  } catch (error) {
    console.error("创建咨询记录失败:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}



