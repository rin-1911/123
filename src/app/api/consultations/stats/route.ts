import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasAnyRole } from "@/lib/types";
import { formatDate } from "@/lib/utils";

/**
 * GET: 获取咨询记录统计数据（总账号专用）
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = session.user;

  // 检查权限
  const canViewAll = hasAnyRole(user.roles, ["HQ_ADMIN", "STORE_MANAGER"]);
  const isConsultantLead = hasAnyRole(user.roles, ["DEPT_LEAD"]) && 
    user.departmentId && 
    await prisma.department.findFirst({
      where: { id: user.departmentId, code: "CONSULTATION" }
    });

  if (!canViewAll && !isConsultantLead) {
    // 检查是否有统计权限
    const permission = await prisma.consultationViewPermission.findFirst({
      where: {
        userId: user.id,
        isActive: true,
        canViewStats: true,
        OR: [
          { validUntil: null },
          { validUntil: { gte: new Date() } }
        ]
      }
    });

    if (!permission) {
      return NextResponse.json({ error: "无权限查看统计" }, { status: 403 });
    }
  }

  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId") || user.storeId;
  const period = searchParams.get("period") || "day"; // day, week, month
  const dateParam = searchParams.get("date") || formatDate(new Date());

  if (!storeId) {
    return NextResponse.json({ error: "缺少门店参数" }, { status: 400 });
  }

  try {
    // 计算日期范围
    const endDate = new Date(dateParam);
    const startDate = new Date(dateParam);

    if (period === "week") {
      startDate.setDate(endDate.getDate() - 6);
    } else if (period === "month") {
      startDate.setDate(endDate.getDate() - 29);
    }

    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    // 获取所有记录
    const records = await prisma.patientConsultation.findMany({
      where: {
        storeId,
        visitDate: {
          gte: startDateStr,
          lte: endDateStr,
        },
      },
      include: {
        User: {
          select: { id: true, name: true },
        },
      },
    });

    // 总体统计
    const totalStats = {
      total: records.length,
      initialVisits: records.filter(r => r.visitType === "INITIAL").length,
      returnVisits: records.filter(r => r.visitType === "RETURN").length,
      pending: records.filter(r => r.dealStatus === "PENDING").length,
      deal: records.filter(r => r.dealStatus === "DEAL").length,
      noDeal: records.filter(r => r.dealStatus === "NO_DEAL").length,
      totalDealAmount: records.filter(r => r.dealStatus === "DEAL")
        .reduce((sum, r) => sum + r.dealAmount, 0),
      totalDeposit: records.reduce((sum, r) => sum + r.depositAmount, 0),
      conversionRate: records.length > 0 
        ? Math.round(records.filter(r => r.dealStatus === "DEAL").length / records.length * 100) 
        : 0,
      avgDealAmount: records.filter(r => r.dealStatus === "DEAL").length > 0
        ? Math.round(records.filter(r => r.dealStatus === "DEAL")
            .reduce((sum, r) => sum + r.dealAmount, 0) / 
            records.filter(r => r.dealStatus === "DEAL").length)
        : 0,
    };

    // 按咨询师分组统计
    const consultantMap = new Map<string, {
      id: string;
      name: string;
      total: number;
      deal: number;
      noDeal: number;
      pending: number;
      totalAmount: number;
      conversionRate: number;
    }>();

    for (const r of records) {
      const key = r.consultantId;
      if (!consultantMap.has(key)) {
        consultantMap.set(key, {
          id: r.consultantId,
          name: r.User?.name || "未知",
          total: 0,
          deal: 0,
          noDeal: 0,
          pending: 0,
          totalAmount: 0,
          conversionRate: 0,
        });
      }
      const stat = consultantMap.get(key)!;
      stat.total++;
      if (r.dealStatus === "DEAL") {
        stat.deal++;
        stat.totalAmount += r.dealAmount;
      } else if (r.dealStatus === "NO_DEAL") {
        stat.noDeal++;
      } else {
        stat.pending++;
      }
    }

    // 计算转化率
    for (const stat of consultantMap.values()) {
      stat.conversionRate = stat.total > 0 
        ? Math.round(stat.deal / stat.total * 100) 
        : 0;
    }

    const consultantStats = Array.from(consultantMap.values())
      .sort((a, b) => b.totalAmount - a.totalAmount);

    // 按项目统计
    const projectStats: Record<string, { count: number; dealCount: number; amount: number }> = {};
    for (const r of records) {
      // 意向项目
      if (r.intendedProjects) {
        const projects = JSON.parse(r.intendedProjects) as string[];
        for (const p of projects) {
          if (!projectStats[p]) {
            projectStats[p] = { count: 0, dealCount: 0, amount: 0 };
          }
          projectStats[p].count++;
        }
      }
      // 成交项目
      if (r.dealStatus === "DEAL" && r.dealProjects) {
        const projects = JSON.parse(r.dealProjects) as string[];
        for (const p of projects) {
          if (!projectStats[p]) {
            projectStats[p] = { count: 0, dealCount: 0, amount: 0 };
          }
          projectStats[p].dealCount++;
          // 平均分配金额到每个项目
          projectStats[p].amount += Math.round(r.dealAmount / projects.length);
        }
      }
    }

    // 按意向程度统计
    const intentionStats = {
      high: records.filter(r => r.intentionLevel === "HIGH").length,
      medium: records.filter(r => r.intentionLevel === "MEDIUM").length,
      low: records.filter(r => r.intentionLevel === "LOW").length,
      unset: records.filter(r => !r.intentionLevel).length,
    };

    // 未成交原因统计
    const noDealReasons: Record<string, number> = {};
    for (const r of records.filter(r => r.dealStatus === "NO_DEAL" && r.noDealReason)) {
      if (!noDealReasons[r.noDealReason!]) {
        noDealReasons[r.noDealReason!] = 0;
      }
      noDealReasons[r.noDealReason!]++;
    }

    // 日期趋势（仅周/月统计）
    const dailyTrend: { date: string; total: number; deal: number; amount: number }[] = [];
    if (period !== "day") {
      const dateMap = new Map<string, { total: number; deal: number; amount: number }>();
      for (const r of records) {
        if (!dateMap.has(r.visitDate)) {
          dateMap.set(r.visitDate, { total: 0, deal: 0, amount: 0 });
        }
        const d = dateMap.get(r.visitDate)!;
        d.total++;
        if (r.dealStatus === "DEAL") {
          d.deal++;
          d.amount += r.dealAmount;
        }
      }
      
      // 填充所有日期
      const current = new Date(startDate);
      while (current <= endDate) {
        const dateStr = formatDate(current);
        const data = dateMap.get(dateStr) || { total: 0, deal: 0, amount: 0 };
        dailyTrend.push({ date: dateStr, ...data });
        current.setDate(current.getDate() + 1);
      }
    }

    return NextResponse.json({
      period,
      dateRange: { start: startDateStr, end: endDateStr },
      totalStats,
      consultantStats,
      projectStats,
      intentionStats,
      noDealReasons,
      dailyTrend,
    });
  } catch (error) {
    console.error("获取统计数据失败:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}



