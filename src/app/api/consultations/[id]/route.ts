import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasAnyRole } from "@/lib/types";

/**
 * GET: 获取单条咨询记录详情
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = session.user;

  try {
    const record = await prisma.patientConsultation.findUnique({
      where: { id: params.id },
      include: {
        consultant: {
          select: { id: true, name: true }
        },
        store: {
          select: { id: true, name: true }
        }
      }
    });

    if (!record) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }

    // 检查权限
    const canViewAll = hasAnyRole(user.roles, ["HQ_ADMIN", "STORE_MANAGER"]);
    const isOwner = record.consultantId === user.id;
    const isDeptLead = hasAnyRole(user.roles, ["DEPT_LEAD"]) && 
      user.departmentId && 
      await prisma.department.findFirst({
        where: { id: user.departmentId, code: "CONSULTATION" }
      });

    if (!canViewAll && !isOwner && !isDeptLead) {
      // 检查是否有权限
      const permission = await prisma.consultationViewPermission.findFirst({
        where: {
          userId: user.id,
          storeId: record.storeId,
          isActive: true,
          canViewAll: true,
          OR: [
            { validUntil: null },
            { validUntil: { gte: new Date() } }
          ]
        }
      });

      if (!permission) {
        return NextResponse.json({ error: "无权限查看此记录" }, { status: 403 });
      }
    }

    return NextResponse.json({
      record: {
        ...record,
        dealAmountYuan: record.dealAmount / 100,
        depositAmountYuan: record.depositAmount / 100,
        toothPositions: record.toothPositions ? JSON.parse(record.toothPositions) : [],
        intendedProjects: record.intendedProjects ? JSON.parse(record.intendedProjects) : [],
        dealProjects: record.dealProjects ? JSON.parse(record.dealProjects) : [],
        followHistory: record.followHistory ? JSON.parse(record.followHistory) : [],
      }
    });
  } catch (error) {
    console.error("获取咨询记录失败:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

/**
 * PUT: 更新咨询记录
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = session.user;

  try {
    const record = await prisma.patientConsultation.findUnique({
      where: { id: params.id }
    });

    if (!record) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }

    // 检查权限：只有记录创建者或管理员可以修改
    const canEdit = record.consultantId === user.id || 
      hasAnyRole(user.roles, ["HQ_ADMIN", "STORE_MANAGER"]);

    if (!canEdit) {
      return NextResponse.json({ error: "无权限修改此记录" }, { status: 403 });
    }

    const data = await request.json();

    // 如果状态从 PENDING 变为 DEAL 或 NO_DEAL，添加跟进历史
    let followHistory = record.followHistory ? JSON.parse(record.followHistory) : [];
    if (data.dealStatus && data.dealStatus !== record.dealStatus) {
      followHistory.push({
        date: new Date().toISOString(),
        action: data.dealStatus === "DEAL" ? "成交" : data.dealStatus === "NO_DEAL" ? "标记未成交" : "更新状态",
        note: data.followNote || "",
        userId: user.id,
        userName: user.name
      });
    }

    const updated = await prisma.patientConsultation.update({
      where: { id: params.id },
      data: {
        patientName: data.patientName ?? record.patientName,
        patientPhone: data.patientPhone ?? record.patientPhone,
        patientAge: data.patientAge !== undefined ? parseInt(data.patientAge) : record.patientAge,
        patientGender: data.patientGender ?? record.patientGender,
        visitDate: data.visitDate ?? record.visitDate,
        visitType: data.visitType ?? record.visitType,
        source: data.source ?? record.source,
        referrer: data.referrer ?? record.referrer,
        toothPositions: data.toothPositions ? JSON.stringify(data.toothPositions) : record.toothPositions,
        chiefComplaint: data.chiefComplaint ?? record.chiefComplaint,
        diagnosis: data.diagnosis ?? record.diagnosis,
        intendedProjects: data.intendedProjects ? JSON.stringify(data.intendedProjects) : record.intendedProjects,
        intentionLevel: data.intentionLevel ?? record.intentionLevel,
        dealStatus: data.dealStatus ?? record.dealStatus,
        dealProjects: data.dealProjects ? JSON.stringify(data.dealProjects) : record.dealProjects,
        dealAmount: data.dealAmount !== undefined ? Math.round(parseFloat(data.dealAmount) * 100) : record.dealAmount,
        depositAmount: data.depositAmount !== undefined ? Math.round(parseFloat(data.depositAmount) * 100) : record.depositAmount,
        paymentMethod: data.paymentMethod ?? record.paymentMethod,
        noDealReason: data.noDealReason ?? record.noDealReason,
        noDealDetail: data.noDealDetail ?? record.noDealDetail,
        nextFollowDate: data.nextFollowDate ?? record.nextFollowDate,
        nextFollowNote: data.nextFollowNote ?? record.nextFollowNote,
        followHistory: JSON.stringify(followHistory),
        remark: data.remark ?? record.remark,
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
        ...updated,
        dealAmountYuan: updated.dealAmount / 100,
        depositAmountYuan: updated.depositAmount / 100,
      }
    });
  } catch (error) {
    console.error("更新咨询记录失败:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

/**
 * DELETE: 删除咨询记录
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = session.user;

  try {
    const record = await prisma.patientConsultation.findUnique({
      where: { id: params.id }
    });

    if (!record) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }

    // 只有管理员可以删除记录
    if (!hasAnyRole(user.roles, ["HQ_ADMIN", "STORE_MANAGER"])) {
      return NextResponse.json({ error: "只有管理员可以删除记录" }, { status: 403 });
    }

    await prisma.patientConsultation.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除咨询记录失败:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}



