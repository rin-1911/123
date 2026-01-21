import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canAccessStore } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = session.user;
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId") || user.storeId;
  const period = searchParams.get("period") || "day"; // day, week, month
  const dateParam = searchParams.get("date") || formatDate(new Date());

  if (!storeId) {
    return NextResponse.json({ error: "缺少门店参数" }, { status: 400 });
  }

  // 检查权限
  const permCheck = await canAccessStore(user, storeId);
  if (!permCheck.allowed) {
    return NextResponse.json({ error: permCheck.reason }, { status: 403 });
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

    const dateRange: string[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      dateRange.push(formatDate(current));
      current.setDate(current.getDate() + 1);
    }

    const deptReportRoleKey = "DEPT_REPORT_ROLE_BY_DEPT_CODE";
    const parseJsonObject = (raw: string | null | undefined): Record<string, unknown> => {
      if (!raw) return {};
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
        return {};
      } catch {
        return {};
      }
    };

    const storeCfg = await prisma.configFlag.findFirst({
      where: { scope: "STORE", storeId, key: deptReportRoleKey, isActive: true },
      select: { value: true },
    });
    const globalCfg = storeCfg
      ? null
      : await prisma.configFlag.findFirst({
          where: { scope: "GLOBAL", storeId: null, key: deptReportRoleKey, isActive: true },
          select: { value: true },
        });
    const roleMap = parseJsonObject(storeCfg?.value ?? globalCfg?.value ?? null);
    const getRoleContains = (deptCode: string): string | null => {
      const specific = roleMap[deptCode];
      const fallback = roleMap.default ?? roleMap["*"];
      const role = (typeof specific === "string" ? specific : typeof fallback === "string" ? fallback : null) as string | null;
      if (!role || !role.trim() || role === "AUTO") return null;
      return `"${role.trim()}"`;
    };

    const consultRole = getRoleContains("CONSULTATION");
    const frontDeskRole = getRoleContains("FRONT_DESK");
    const marketingRole = getRoleContains("OFFLINE_MARKETING");
    const onlineRole = getRoleContains("ONLINE_GROWTH");
    const financeRole = getRoleContains("FINANCE_HR_ADMIN");

    // 获取咨询部数据
    const consultReports = await prisma.consultationReport.findMany({
      where: {
        DailyReport: {
          storeId,
          reportDate: { in: dateRange },
          status: "SUBMITTED",
          ...(consultRole ? { User: { roles: { contains: consultRole } } } : {}),
        },
      },
      include: {
        DailyReport: {
          select: { reportDate: true, User: { select: { name: true } } },
        },
      },
    });

    // 获取前台数据
    const frontDeskReports = await prisma.frontDeskReport.findMany({
      where: {
        DailyReport: {
          storeId,
          reportDate: { in: dateRange },
          status: "SUBMITTED",
          ...(frontDeskRole ? { User: { roles: { contains: frontDeskRole } } } : {}),
        },
      },
      include: {
        DailyReport: {
          select: { reportDate: true, User: { select: { name: true } } },
        },
      },
    });

    // 获取线下市场数据
    const marketingReports = await prisma.offlineMarketingReport.findMany({
      where: {
        DailyReport: {
          storeId,
          reportDate: { in: dateRange },
          status: "SUBMITTED",
          ...(marketingRole ? { User: { roles: { contains: marketingRole } } } : {}),
        },
      },
      include: {
        DailyReport: {
          select: { reportDate: true, User: { select: { name: true } } },
        },
      },
    });

    // 获取网络新媒体数据
    const onlineReports = await prisma.onlineGrowthReport.findMany({
      where: {
        DailyReport: {
          storeId,
          reportDate: { in: dateRange },
          status: "SUBMITTED",
          ...(onlineRole ? { User: { roles: { contains: onlineRole } } } : {}),
        },
      },
      include: {
        DailyReport: {
          select: { reportDate: true, User: { select: { name: true } } },
        },
      },
    });

    // 获取财务数据
    const financeReports = await prisma.financeHrAdminReport.findMany({
      where: {
        DailyReport: {
          storeId,
          reportDate: { in: dateRange },
          status: "SUBMITTED",
          ...(financeRole ? { User: { roles: { contains: financeRole } } } : {}),
        },
      },
      include: {
        DailyReport: {
          select: { reportDate: true, User: { select: { name: true } } },
        },
      },
    });

    // 汇总计算
    const summary = {
      // 预约数（前台）
      totalAppointments: frontDeskReports.reduce((sum, r) => sum + r.newAppointments, 0),
      // 到店数（前台）
      totalVisits: frontDeskReports.reduce((sum, r) => sum + r.newVisits + r.returningVisits, 0),
      totalNewVisits: frontDeskReports.reduce((sum, r) => sum + r.newVisits, 0),
      totalReturningVisits: frontDeskReports.reduce((sum, r) => sum + r.returningVisits, 0),
      // 初诊数（咨询）
      totalInitial: consultReports.reduce((sum, r) => sum + r.initialTotal, 0),
      // 成交数（咨询）
      totalDeals: consultReports.reduce((sum, r) => sum + r.dealsTotal, 0),
      // 初诊成交数（咨询）
      totalInitialDeals: consultReports.reduce((sum, r) => sum + r.initialDealsTotal, 0),
      // 实收（咨询）
      totalCashConsult: consultReports.reduce((sum, r) => sum + r.cashInCents, 0),
      // 实收（财务）
      totalCashFinance: financeReports.reduce((sum, r) => sum + r.cashInCents, 0),
      // 退款（财务）
      totalRefunds: financeReports.reduce((sum, r) => sum + r.refundsInCents, 0),
      // 复诊预约（咨询）
      totalFollowupAppts: consultReports.reduce((sum, r) => sum + r.followupAppointments, 0),
      // 投诉数（前台）
      totalComplaints: frontDeskReports.reduce((sum, r) => sum + r.complaintsCount, 0),
      // 爽约数（前台）
      totalNoShows: frontDeskReports.reduce((sum, r) => sum + r.noShowAppointments, 0),
      // 市场线索（线下+线上）
      totalLeadsOffline: marketingReports.reduce((sum, r) => sum + r.leadsNew, 0),
      totalLeadsOnline: onlineReports.reduce((sum, r) => sum + r.leads_today, 0),
      totalLeadsValid: 
        marketingReports.reduce((sum, r) => sum + r.leadsValid, 0),
      // 市场费用
      totalMarketingCost:
        marketingReports.reduce((sum, r) => sum + r.costInCents, 0),
      // 种植意向
      totalImplantLeads: consultReports.reduce((sum, r) => sum + r.implantLeads, 0),
      // 正畸意向
      totalOrthoLeads: consultReports.reduce((sum, r) => sum + r.orthoLeads, 0),
    };

    // 计算转化率
    const rates = {
      // 初诊成交率
      initialConversionRate: summary.totalInitial > 0
        ? (summary.totalInitialDeals / summary.totalInitial * 100).toFixed(2)
        : "0.00",
      // 到店转化率（预约到到店）
      visitRate: summary.totalAppointments > 0
        ? ((summary.totalNewVisits + summary.totalReturningVisits) / summary.totalAppointments * 100).toFixed(2)
        : "0.00",
      // 客单价
      avgDealAmount: summary.totalDeals > 0
        ? Math.round(summary.totalCashConsult / summary.totalDeals)
        : 0,
      // 线索有效率
      leadsValidRate: (summary.totalLeadsOffline + summary.totalLeadsOnline) > 0
        ? (summary.totalLeadsValid / (summary.totalLeadsOffline + summary.totalLeadsOnline) * 100).toFixed(2)
        : "0.00",
    };

    // 按日期分组的趋势数据
    const dailyTrend = dateRange.map((date) => {
      const dayConsult = consultReports.filter((r) => r.DailyReport.reportDate === date);
      const dayFront = frontDeskReports.filter((r) => r.DailyReport.reportDate === date);

      return {
        date,
        visits: dayFront.reduce((sum, r) => sum + r.newVisits + r.returningVisits, 0),
        initial: dayConsult.reduce((sum, r) => sum + r.initialTotal, 0),
        deals: dayConsult.reduce((sum, r) => sum + r.dealsTotal, 0),
        cash: dayConsult.reduce((sum, r) => sum + r.cashInCents, 0),
      };
    });

    // 部门人效统计
    const deptEfficiency = {
      consultation: {
        reports: consultReports.length,
        avgReception: consultReports.length > 0
          ? Math.round(consultReports.reduce((sum, r) => sum + r.receptionTotal, 0) / consultReports.length)
          : 0,
        avgDeals: consultReports.length > 0
          ? Math.round(consultReports.reduce((sum, r) => sum + r.dealsTotal, 0) / consultReports.length)
          : 0,
        avgCash: consultReports.length > 0
          ? Math.round(consultReports.reduce((sum, r) => sum + r.cashInCents, 0) / consultReports.length)
          : 0,
      },
      frontDesk: {
        reports: frontDeskReports.length,
        avgVisits: frontDeskReports.length > 0
          ? Math.round(frontDeskReports.reduce((sum, r) => sum + r.newVisits + r.returningVisits, 0) / frontDeskReports.length)
          : 0,
        avgAppointments: frontDeskReports.length > 0
          ? Math.round(frontDeskReports.reduce((sum, r) => sum + r.newAppointments, 0) / frontDeskReports.length)
          : 0,
      },
      marketing: {
        reports: marketingReports.length + onlineReports.length,
        totalLeads: summary.totalLeadsOffline + summary.totalLeadsOnline,
        totalValid: summary.totalLeadsValid,
        totalCost: summary.totalMarketingCost,
        costPerLead: summary.totalLeadsValid > 0
          ? Math.round(summary.totalMarketingCost / summary.totalLeadsValid)
          : 0,
      },
    };

    return NextResponse.json({
      period,
      dateRange: { start: formatDate(startDate), end: formatDate(endDate) },
      summary,
      rates,
      dailyTrend,
      deptEfficiency,
    });
  } catch (error) {
    console.error("获取报表数据失败:", error);
    return NextResponse.json({ error: "获取数据失败" }, { status: 500 });
  }
}






