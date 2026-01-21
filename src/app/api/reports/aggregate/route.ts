import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessStore } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";
import { prisma } from "@/lib/db";
import { aggregateDepartmentData, aggregateStoreData, getKeyMetrics } from "@/lib/report-aggregator";

/**
 * GET: 获取智能汇总报表数据
 * 支持从 formData JSON 中提取并汇总各种字段数据
 */
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
  const departmentId = searchParams.get("departmentId");

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

    const startDateStr = formatDate(startDate);
    const endDateStr = formatDate(endDate);

    // 生成日期范围数组
    const dateRange: string[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      dateRange.push(formatDate(current));
      current.setDate(current.getDate() + 1);
    }

    if (departmentId && departmentId !== "all") {
      const store = await prisma.store.findUnique({ where: { id: storeId } });

      const deptReportRoleKey = "DEPT_REPORT_ROLE_BY_DEPT_CODE";
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
      const roleMap = parseJsonObject(storeCfg?.value ?? globalCfg?.value ?? null);

      const deptAgg = await aggregateDepartmentData(
        storeId,
        departmentId,
        dateRange,
        roleMap
      );

      if (!deptAgg) {
        return NextResponse.json({ error: "部门不存在" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        period,
        dateRange: { start: startDateStr, end: endDateStr },
        store: {
          id: storeId,
          name: store?.name || "未知门店",
        },
        department: {
          departmentId: deptAgg.departmentId,
          departmentCode: deptAgg.departmentCode,
          departmentName: deptAgg.departmentName,
          userCount: deptAgg.userCount,
          submittedCount: deptAgg.submittedCount,
          completionRate:
            deptAgg.userCount > 0 ? Math.round((deptAgg.submittedCount / deptAgg.userCount) * 100) : 0,
          fields: deptAgg.fields
            .map((f) => ({
              fieldId: f.fieldId,
              fieldLabel: f.fieldLabel,
              total: f.total,
              count: f.count,
              average: Math.round(f.average * 100) / 100,
              isCustomField: f.isCustomField || false,
              category: f.category || "other",
              sourceType: f.sourceType || "formData",
              fieldType: f.fieldType,
              subCategory: (f as any).subCategory || undefined,
              values: (f as any).values || [],
              rowFields: (f as any).rowFields || undefined,
              containerId: (f as any).containerId || undefined,
              containerTitle: (f as any).containerTitle || undefined,
              containerOrder: (f as any).containerOrder ?? undefined,
              fieldOrder: (f as any).fieldOrder ?? undefined,
            }))
            .sort((a, b) => {
              if (a.isCustomField !== b.isCustomField) {
                return a.isCustomField ? 1 : -1;
              }
              if ((a.total || 0) !== (b.total || 0)) {
                return (b.total || 0) - (a.total || 0);
              }
              return (a.fieldLabel || "").localeCompare(b.fieldLabel || "");
            }),
        },
      });
    }

    // 获取智能汇总数据
    const [aggregation, keyMetrics] = await Promise.all([
      aggregateStoreData(storeId, startDateStr, endDateStr),
      getKeyMetrics(storeId, dateRange),
    ]);

    // 构建部门字段汇总（每个部门的关键字段）
    const departmentSummaries = aggregation.departments.map((dept) => {
      const deptFields = dept.fields
        .map((f) => ({
        fieldId: f.fieldId,
        fieldLabel: f.fieldLabel,
        total: f.total,
        count: f.count,
        average: Math.round(f.average * 100) / 100,
        isCustomField: f.isCustomField || false,
        category: f.category || "other",
        sourceType: f.sourceType || "formData",
        fieldType: f.fieldType,
        subCategory: (f as any).subCategory || undefined,
        values: (f as any).values || [],
        rowFields: (f as any).rowFields || undefined,
        containerId: (f as any).containerId || undefined,
        containerTitle: (f as any).containerTitle || undefined,
        containerOrder: (f as any).containerOrder ?? undefined,
        fieldOrder: (f as any).fieldOrder ?? undefined,
      }));

      deptFields.sort((a, b) => {
        if (a.isCustomField !== b.isCustomField) {
          return a.isCustomField ? 1 : -1;
        }
        if ((a.total || 0) !== (b.total || 0)) {
          return (b.total || 0) - (a.total || 0);
        }
        return (a.fieldLabel || "").localeCompare(b.fieldLabel || "");
      });

      return {
        departmentId: dept.departmentId,
        departmentCode: dept.departmentCode,
        departmentName: dept.departmentName,
        userCount: dept.userCount,
        submittedCount: dept.submittedCount,
        completionRate: dept.userCount > 0 
          ? Math.round((dept.submittedCount / dept.userCount) * 100) 
          : 0,
        fields: deptFields,
      };
    });

    // 构建全店字段汇总（不再按类型过滤，保证所有开启字段都能返回）
    const storeFieldSummary = Object.values(aggregation.totals)
      .map((f) => ({
        fieldId: f.fieldId,
        fieldLabel: f.fieldLabel,
        total: f.total,
        count: f.count,
        average: Math.round(f.average * 100) / 100,
        isCustomField: f.isCustomField || false,
        category: f.category || "other",
        sourceType: f.sourceType || "formData",
        fieldType: f.fieldType,
        values: (f as any).values || [],
        rowFields: (f as any).rowFields || undefined,
        containerId: (f as any).containerId || undefined,
        containerTitle: (f as any).containerTitle || undefined,
        containerOrder: (f as any).containerOrder ?? undefined,
        fieldOrder: (f as any).fieldOrder ?? undefined,
      }))
      .sort((a, b) => {
        if (a.isCustomField !== b.isCustomField) {
          return a.isCustomField ? 1 : -1;
        }
        const categoryOrder = ["revenue", "visits", "deals", "leads", "appointments", "other"];
        const catA = categoryOrder.indexOf(a.category);
        const catB = categoryOrder.indexOf(b.category);
        if (catA !== catB) {
          return catA - catB;
        }
        if ((a.total || 0) !== (b.total || 0)) {
          return (b.total || 0) - (a.total || 0);
        }
        return (a.fieldLabel || "").localeCompare(b.fieldLabel || "");
      });

    // 字段来源统计
    const fieldSources = {
      fromFormData: 0,
      fromFixedTable: 0,
      total: storeFieldSummary.length,
    };
    
    // 判断字段来源
    const fixedTableFields = new Set([
      "receptionTotal", "initialTotal", "dealsTotal", "cashInCents",
      "newVisits", "returningVisits", "newAppointments",
      "leadsNew", "leadsValid", "costInCents",
    ]);
    
    for (const field of storeFieldSummary) {
      if (fixedTableFields.has(field.fieldId)) {
        fieldSources.fromFixedTable++;
      } else {
        fieldSources.fromFormData++;
      }
    }

    // 调试日志
    console.log(`[Aggregate API] 门店: ${storeId}, 日期范围: ${startDateStr} ~ ${endDateStr}`);
    console.log(`[Aggregate API] 部门数量: ${departmentSummaries.length}, 字段数量: ${storeFieldSummary.length}`);
    console.log(`[Aggregate API] 字段来源: formData=${fieldSources.fromFormData}, 固定表=${fieldSources.fromFixedTable}`);

    return NextResponse.json({
      success: true,
      period,
      dateRange: { start: startDateStr, end: endDateStr },
      store: {
        id: storeId,
        name: aggregation.storeName,
      },
      // 关键指标（兼容旧数据）
      keyMetrics: {
        totalCash: keyMetrics.totalCash,
        totalDeals: keyMetrics.totalDeals,
        totalInitial: keyMetrics.totalInitial,
        totalVisits: keyMetrics.totalVisits,
        avgDealAmount: keyMetrics.avgDealAmount,
        conversionRate: keyMetrics.conversionRate,
      },
      // 部门汇总
      departments: departmentSummaries,
      // 全店字段汇总
      storeFields: storeFieldSummary,
      // 原始详细数据（可选，用于调试或高级展示）
      _raw: aggregation,
      // 调试信息
      _debug: {
        dateRange,
        departmentCount: departmentSummaries.length,
        fieldsCount: storeFieldSummary.length,
      },
    });
  } catch (error) {
    console.error("获取汇总报表失败:", error);
    return NextResponse.json({ error: "获取数据失败" }, { status: 500 });
  }
}
