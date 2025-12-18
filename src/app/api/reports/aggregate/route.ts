import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canAccessStore } from "@/lib/rbac";
import { formatDate } from "@/lib/utils";
import { aggregateStoreData, getKeyMetrics } from "@/lib/report-aggregator";

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

    // 获取智能汇总数据
    const [aggregation, keyMetrics] = await Promise.all([
      aggregateStoreData(storeId, startDateStr, endDateStr),
      getKeyMetrics(storeId, dateRange),
    ]);

    // 构建部门字段汇总（每个部门的关键字段）
    const departmentSummaries = aggregation.departments.map((dept) => {
      // 提取数值类型字段的汇总（包含智能分类信息）
      const numericFields = dept.fields
        .filter((f) => ["number", "money", "calculated"].includes(f.fieldType))
        .map((f) => ({
          fieldId: f.fieldId,
          fieldLabel: f.fieldLabel,
          total: f.total,
          count: f.count,
          average: Math.round(f.average * 100) / 100,
          isCustomField: f.isCustomField || false,
          category: f.category || "other",
        }));

      // 按分类和是否自定义排序：标准字段在前，自定义字段在后
      numericFields.sort((a, b) => {
        if (a.isCustomField !== b.isCustomField) {
          return a.isCustomField ? 1 : -1;
        }
        return b.total - a.total;
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
        fields: numericFields,
      };
    });

    // 构建全店字段汇总
    const storeFieldSummary = Object.values(aggregation.totals)
      .filter((f) => ["number", "money", "calculated"].includes(f.fieldType))
      .map((f) => ({
        fieldId: f.fieldId,
        fieldLabel: f.fieldLabel,
        total: f.total,
        count: f.count,
        average: Math.round(f.average * 100) / 100,
        isCustomField: f.isCustomField || false,
        category: f.category || "other",
        sourceType: f.sourceType || "formData",
      }))
      // 智能排序：按分类分组，标准字段在前，自定义字段在后，各组内按总数降序
      .sort((a, b) => {
        // 先按是否自定义分组
        if (a.isCustomField !== b.isCustomField) {
          return a.isCustomField ? 1 : -1;
        }
        // 再按分类排序
        const categoryOrder = ["revenue", "visits", "deals", "leads", "appointments", "other"];
        const catA = categoryOrder.indexOf(a.category);
        const catB = categoryOrder.indexOf(b.category);
        if (catA !== catB) {
          return catA - catB;
        }
        // 最后按总数降序
        return b.total - a.total;
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

