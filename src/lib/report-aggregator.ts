/**
 * 智能报表数据汇总服务
 * 支持从 formData JSON 中提取并汇总各种字段数据
 * 
 * 核心功能：
 * 1. 字段规范化 - 将同义字段合并为统一的规范字段
 * 2. 金额单位统一 - 自动处理元/分转换
 * 3. 智能去重 - 避免同一数据被重复统计
 * 4. 双源合并 - 同时支持 formData 和固定表数据
 */

import { prisma } from "./db";
import {
  getSchemaForRole,
  type MarketingSubDept,
  MARKETING_SUB_DEPT_LABELS,
  type NursingRole,
  NURSING_ROLE_LABELS,
  DailyReportSchema,
  FormField,
} from "./schemas";
import type { DepartmentCode, Role } from "./types";
import { buildSchemaFromTemplateV2, isTemplateV2 } from "./templates/template-schema";

// ============================================================
// 字段规范化映射系统
// 将各种可能的字段名映射到统一的规范字段名
// ============================================================

interface NormalizedField {
  normalizedId: string;      // 规范化后的字段ID
  label: string;             // 中文标签
  type: "number" | "money";  // 字段类型
  isMoneyInCents?: boolean;  // 如果是金额，原值是否为分
}

// 字段规范化映射表：将各种字段名映射到统一的规范字段
const FIELD_NORMALIZATION: Record<string, NormalizedField> = {
  // ====== 到店/到诊人数 ======
  totalVisitors: { normalizedId: "totalVisitors", label: "总到院人数", type: "number" },
  totalArrival: { normalizedId: "totalVisitors", label: "总到院人数", type: "number" },
  
  // ====== 初诊人数 ======
  firstVisitCount: { normalizedId: "firstVisitCount", label: "初诊人数", type: "number" },
  initialTotal: { normalizedId: "firstVisitCount", label: "初诊人数", type: "number" },
  initialCount: { normalizedId: "firstVisitCount", label: "初诊人数", type: "number" },
  newVisits: { normalizedId: "firstVisitCount", label: "初诊人数", type: "number" },
  teamFirstVisit: { normalizedId: "teamFirstVisit", label: "团队首诊人数", type: "number" },
  
  // ====== 复诊人数 ======
  returnVisitCount: { normalizedId: "returnVisitCount", label: "复诊人数", type: "number" },
  returningVisits: { normalizedId: "returnVisitCount", label: "复诊人数", type: "number" },
  teamReturnVisit: { normalizedId: "teamReturnVisit", label: "团队复诊人数", type: "number" },
  
  // ====== 接诊人数 ======
  receptionTotal: { normalizedId: "receptionTotal", label: "接诊总数", type: "number" },
  receptionCount: { normalizedId: "receptionTotal", label: "接诊总数", type: "number" },
  teamReceptionTotal: { normalizedId: "teamReceptionTotal", label: "团队接诊总数", type: "number" },
  
  // ====== 成交人数 ======
  dealCount: { normalizedId: "dealCount", label: "成交人数", type: "number" },
  dealsTotal: { normalizedId: "dealCount", label: "成交人数", type: "number" },
  teamDealCount: { normalizedId: "teamDealCount", label: "团队成交人数", type: "number" },
  
  // ====== 未成交人数 ======
  noDealCount: { normalizedId: "noDealCount", label: "未成交人数", type: "number" },
  
  // ====== 实收金额（统一为元）======
  actualRevenue: { normalizedId: "actualRevenue", label: "实收业绩", type: "money" },
  cashInYuan: { normalizedId: "actualRevenue", label: "实收业绩", type: "money" },
  cashAmount: { normalizedId: "actualRevenue", label: "实收业绩", type: "money" },
  cashInCents: { normalizedId: "actualRevenue", label: "实收业绩", type: "money", isMoneyInCents: true },
  teamCashInYuan: { normalizedId: "teamCashInYuan", label: "团队成交金额", type: "money" },
  
  // ====== 应收业绩 ======
  expectedRevenue: { normalizedId: "expectedRevenue", label: "应收业绩", type: "money" },
  
  // ====== 退费 ======
  refundAmount: { normalizedId: "refundAmount", label: "今日退费", type: "money" },
  refundsInCents: { normalizedId: "refundAmount", label: "今日退费", type: "money", isMoneyInCents: true },
  refundInYuan: { normalizedId: "refundAmount", label: "今日退费", type: "money" },
  
  // ====== 初诊消费金额 ======
  firstVisitAmount: { normalizedId: "firstVisitAmount", label: "初诊消费金额", type: "money" },
  
  // ====== 复诊消费金额 ======
  returnVisitAmount: { normalizedId: "returnVisitAmount", label: "复诊消费金额", type: "money" },
  
  // ====== 线索相关 ======
  newLeads: { normalizedId: "newLeads", label: "新增线索", type: "number" },
  leadsNew: { normalizedId: "newLeads", label: "新增线索", type: "number" },
  newLeadsTotal: { normalizedId: "newLeads", label: "新增线索", type: "number" },
  validLeads: { normalizedId: "validLeads", label: "有效线索", type: "number" },
  leadsValid: { normalizedId: "validLeads", label: "有效线索", type: "number" },
  validInfoCollected: { normalizedId: "validLeads", label: "有效线索", type: "number" },
  wechatAdded: { normalizedId: "wechatAdded", label: "微信添加数", type: "number" },
  
  // ====== 预约相关 ======
  appointmentsMade: { normalizedId: "appointmentsMade", label: "预约成功", type: "number" },
  appointmentsBooked: { normalizedId: "appointmentsMade", label: "预约成功", type: "number" },
  newAppointments: { normalizedId: "newAppointments", label: "新增预约", type: "number" },
  followupAppointments: { normalizedId: "followupAppointments", label: "复诊预约", type: "number" },
  followupAppt: { normalizedId: "followupAppointments", label: "复诊预约", type: "number" },
  nextAppointment: { normalizedId: "followupAppointments", label: "复诊预约", type: "number" },
  
  // ====== 爽约相关 ======
  noShowTotal: { normalizedId: "noShowTotal", label: "爽约总数", type: "number" },
  noShowAppointments: { normalizedId: "noShowTotal", label: "爽约总数", type: "number" },
  
  // ====== 到店人数（市场）======
  arrivedCount: { normalizedId: "arrivedCount", label: "到店人数", type: "number" },
  visitsArrived: { normalizedId: "arrivedCount", label: "到店人数", type: "number" },
  
  // ====== 触点数 ======
  touchpoints: { normalizedId: "touchpoints", label: "触点数", type: "number" },
  
  // ====== 合作方拜访 ======
  partnerVisits: { normalizedId: "partnerVisits", label: "合作方拜访", type: "number" },
  partnershipsNew: { normalizedId: "partnerVisits", label: "合作方拜访", type: "number" },
  
  // ====== 外勤时长 ======
  fieldHours: { normalizedId: "fieldHours", label: "外勤时长", type: "number" },
  
  // ====== 优惠券发放 ======
  couponsDistributed: { normalizedId: "couponsDistributed", label: "优惠券发放", type: "number" },
  
  // ====== 人事相关 ======
  hireCount: { normalizedId: "hireCount", label: "入职人数", type: "number" },
  hiresCount: { normalizedId: "hireCount", label: "入职人数", type: "number" },
  resignCount: { normalizedId: "resignCount", label: "离职人数", type: "number" },
  resignationsCount: { normalizedId: "resignCount", label: "离职人数", type: "number" },
  traineeCount: { normalizedId: "traineeCount", label: "培训人数", type: "number" },
  traineesCount: { normalizedId: "traineeCount", label: "培训人数", type: "number" },
  
  // ====== 种植/正畸意向 ======
  implantIntention: { normalizedId: "implantIntention", label: "种植意向", type: "number" },
  implantLeads: { normalizedId: "implantIntention", label: "种植意向", type: "number" },
  orthoIntention: { normalizedId: "orthoIntention", label: "正畸意向", type: "number" },
  orthoLeads: { normalizedId: "orthoIntention", label: "正畸意向", type: "number" },
  
  // ====== 市场费用 ======
  marketingCost: { normalizedId: "marketingCost", label: "市场费用", type: "money" },
  costInCents: { normalizedId: "marketingCost", label: "市场费用", type: "money", isMoneyInCents: true },
  adSpendInCents: { normalizedId: "adSpend", label: "广告费用", type: "money", isMoneyInCents: true },
  
  // ====== 投诉相关 ======
  complaintsCount: { normalizedId: "complaintsCount", label: "投诉数", type: "number" },
  resolvedCount: { normalizedId: "resolvedCount", label: "已解决", type: "number" },

  // ====== 前台新指标 ======
  new_patients_count: { normalizedId: "newPatients", label: "新增患者", type: "number" },
  new_patients_created: { normalizedId: "newPatients", label: "新增患者", type: "number" },

  // ====== 网络部新指标 ======
  leads_today: { normalizedId: "newLeads", label: "今日建档", type: "number" },
  leads_month: { normalizedId: "leadsMonthly", label: "月建档", type: "number" },
  visits_today: { normalizedId: "totalVisitors", label: "今日到店", type: "number" },
  deals_today: { normalizedId: "dealCount", label: "到店成交", type: "number" },
  visits_month: { normalizedId: "visitsMonthly", label: "本月到店", type: "number" },
  followup_today: { normalizedId: "followUpCount", label: "今日回访", type: "number" },
  revenue_today: { normalizedId: "actualRevenue", label: "今日业绩", type: "money" },
  intentional_tomorrow: { normalizedId: "tomorrowIntentional", label: "明日意向顾客", type: "number" },
  
  // ====== 渠道指标 ======
  chan_douyin: { normalizedId: "leadsDouyin", label: "抖音线索", type: "number" },
  chan_gaode: { normalizedId: "leadsGaode", label: "高德线索", type: "number" },
  chan_referral: { normalizedId: "leadsReferral", label: "介绍线索", type: "number" },
  chan_ads: { normalizedId: "leadsAds", label: "信息流线索", type: "number" },
  chan_balance: { normalizedId: "revenueBalance", label: "补款金额", type: "money" },
  chan_respend: { normalizedId: "revenueRespend", label: "再消费金额", type: "money" },

  // ====== 财务对账 (综合报表) ======
  total_expense: { normalizedId: "actualExpense", label: "总支出", type: "money" },
  total_income: { normalizedId: "actualRevenue", label: "总收入", type: "money" },
  net_income: { normalizedId: "netRevenue", label: "净收入", type: "money" },
};

// 字段名称获取辅助函数
function getFieldLabel(fieldId: string, schema: DailyReportSchema | null): string {
  if (!schema) return fieldId;
  for (const section of schema.sections) {
    const field = section.fields.find((f) => f.id === fieldId);
    if (field) return field.label;
  }
  return fieldId;
}

// ============================================================
// 汇总服务类型定义
// ============================================================

export interface FieldAggregation {
  fieldId: string;
  fieldLabel: string;
  fieldType: string;
  rowFields?: { id: string; label: string; type: string; dynamicOptionsKey?: string; fullWidth?: boolean }[];
  containerId?: string;
  containerTitle?: string;
  containerOrder?: number;
  fieldOrder?: number;
  total: number;
  count: number;
  average: number;
  values: { userId: string; userName: string; reportDate: string; value: unknown }[];
  // 智能分类信息
  isCustomField: boolean;     // 是否为自定义字段
  category: string;           // 字段类别：revenue/visits/deals/leads/appointments/other
  sourceType: "formData" | "fixedTable" | "mixed";  // 数据来源
  subCategory?: string;
}

export interface DepartmentAggregation {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  userCount: number;
  submittedCount: number;
  fields: FieldAggregation[];
}

export interface StoreAggregation {
  storeId: string;
  storeName: string;
  dateRange: { start: string; end: string };
  departments: DepartmentAggregation[];
  totals: Record<string, FieldAggregation>;
}

// ============================================================
// 核心逻辑实现
// ============================================================

/**
 * 汇总一个部门在指定时间范围内的日报数据
 */
export async function aggregateDepartmentData(
  storeId: string,
  departmentId: string,
  dateRange: string[],
  roleMap?: Record<string, unknown>
): Promise<DepartmentAggregation | null> {
  // 获取部门信息
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
  });

  if (!department) return null;

  const defaultRoleForDept = (deptCode: string): string => {
    if (deptCode === "FRONT_DESK") return "DEPT_LEAD";
    if (deptCode === "FINANCE_HR_ADMIN" || deptCode === "FINANCE") return "FINANCE";
    if (deptCode === "MANAGEMENT") return "STORE_MANAGER";
    return "STAFF";
  };

  const resolveRoleFromConfig = (deptCode: string): string | null => {
    const specific = roleMap?.[deptCode];
    const fallback = roleMap?.default ?? roleMap?.["*"];
    const roleRaw = (typeof specific === "string" ? specific : typeof fallback === "string" ? fallback : null) as string | null;
    const role = roleRaw && roleRaw.trim() ? roleRaw.trim() : null;
    if (!role || role === "AUTO") return null;
    if ((deptCode === "FINANCE_HR_ADMIN" || deptCode === "FINANCE") && role === "STAFF") return "FINANCE";
    return role;
  };

  const roleFromConfig = resolveRoleFromConfig(department.code);
  const roleContains = roleFromConfig ? `"${roleFromConfig}"` : null;
  const roleForTemplate = roleFromConfig || defaultRoleForDept(department.code);

  const normalizeSchemaId = (raw: string): string => {
    const v = (raw || "").trim();
    if (!v) return "";
    if (department.code === "OFFLINE_MARKETING") {
      if (v === "expansion" || v === "marketing_expansion" || v === "marketingExpansion") return "expansion";
      if (v === "customerService" || v === "customer_service" || v === "customerServiceLead" || v === "customer_service_lead") return "customerService";
      return v;
    }
    if (department.code === "NURSING") {
      if (v === "assistant" || v === "assistantLead" || v === "hygienist" || v === "hygienistLead" || v === "headNurse") return v;
      return v;
    }
    return v;
  };

  const knownSchemaIds: string[] = (() => {
    if (department.code === "NURSING") {
      return ["assistant", "assistantLead", "hygienist", "hygienistLead", "headNurse"];
    }
    if (department.code === "OFFLINE_MARKETING") {
      return ["expansion", "customerService"];
    }
    return [""];
  })();

  const getSubCategoryLabel = (schemaId: string): string | undefined => {
    const sid = normalizeSchemaId(schemaId);
    if (!sid) return undefined;
    if (department.code === "NURSING") {
      const key = sid as NursingRole;
      return NURSING_ROLE_LABELS[key] || sid;
    }
    if (department.code === "OFFLINE_MARKETING") {
      const key = sid as MarketingSubDept;
      return MARKETING_SUB_DEPT_LABELS[key] || sid;
    }
    return sid;
  };

  // 获取该部门下的所有员工
  const users = await prisma.user.findMany({
    where: {
      storeId,
      departmentId,
      isActive: true,
      ...(roleContains ? { roles: { contains: roleContains } } : {}),
    },
    select: { id: true, name: true, roles: true, nursingRole: true, marketingSubDept: true, customFormConfig: true },
  });

  if (users.length === 0) {
    const enabledBySchemaId: Array<{ schemaId: string; fields: Array<{ id: string; label: string; type: string }> }> = [];

    for (const sid of knownSchemaIds) {
      const tpl = await prisma.dailyReportTemplate.findUnique({
        where: {
          role_departmentId_schemaId: {
            role: roleForTemplate,
            departmentId,
            schemaId: normalizeSchemaId(sid) || "",
          },
        },
      });
      let schema: DailyReportSchema | null = null;
      if (tpl) {
        const rawConfig = typeof (tpl as any).configJson === "string" ? JSON.parse((tpl as any).configJson) : (tpl as any).configJson;
        if (isTemplateV2(rawConfig)) {
          schema = buildSchemaFromTemplateV2(rawConfig, `tpl_v2_${roleForTemplate}_${departmentId}_${normalizeSchemaId(sid) || "default"}`);
        }
      }
      if (!schema) {
        if (department.code === "NURSING") {
          schema = getSchemaForRole(department.code, [roleForTemplate], (normalizeSchemaId(sid) as NursingRole), undefined);
        } else if (department.code === "OFFLINE_MARKETING") {
          schema = getSchemaForRole(department.code, [roleForTemplate], undefined, (normalizeSchemaId(sid) as MarketingSubDept));
        } else {
          schema = getSchemaForRole(department.code, [roleForTemplate]);
        }
      }
      const fields: Array<{ id: string; label: string; type: string }> = [];
      if (schema) {
        for (const sec of schema.sections) {
          for (const f of sec.fields) {
            if (f.type === "divider") continue;
            if (f.reportEnabled === false) continue;
            fields.push({ id: f.id, label: f.label, type: f.type });
          }
        }
      }
      enabledBySchemaId.push({ schemaId: normalizeSchemaId(sid), fields });
    }

    return {
      departmentId,
      departmentCode: department.code,
      departmentName: department.name,
      userCount: 0,
      submittedCount: 0,
      fields: enabledBySchemaId.flatMap(({ schemaId, fields }) =>
        fields.map((f) => ({
          fieldId: f.id,
          fieldLabel: f.label,
          fieldType: f.type,
          total: 0,
          count: 0,
          average: 0,
          values: [],
          isCustomField: false,
          category: inferFieldCategory(f.label, f.type),
          sourceType: "formData",
          subCategory: getSubCategoryLabel(schemaId),
        }))
      ),
    };
  }

  // 获取这些员工在时间范围内的所有已提交日报
  const reports = await prisma.dailyReport.findMany({
    where: {
      userId: { in: users.map((u) => u.id) },
      reportDate: { in: dateRange },
      status: "SUBMITTED",
    },
    include: {
      User: {
        select: { name: true, roles: true, nursingRole: true, marketingSubDept: true, customFormConfig: true },
      },
      // 包含所有固定表数据
      ConsultationReport: true,
      FrontDeskReport: true,
      OfflineMarketingReport: true,
      OnlineGrowthReport: true,
      MedicalReport: true,
      NursingReport: true,
      FinanceHrAdminReport: true,
    },
  });
  
  // 调试日志
  console.log(`[Aggregate] 部门 ${department.name}: 查询到 ${reports.length} 份日报`);

  const isFieldEnabledForReport = (field: FormField): boolean => {
    if (field.type === "divider") return false;
    const defaultEnabledTypes = new Set(["number", "money", "select", "dynamic_select", "calculated", "dynamic_rows"]);
    const defaultEnabled = defaultEnabledTypes.has(field.type);
    if (field.reportEnabled !== undefined) return !!field.reportEnabled;
    return defaultEnabled;
  };

  const buildEnabledFieldMap = (
    schema: DailyReportSchema | null
  ): Map<
    string,
    {
      label: string;
      type: string;
      rowFields?: { id: string; label: string; type: string; dynamicOptionsKey?: string; fullWidth?: boolean }[];
      containerId?: string;
      containerTitle?: string;
      containerOrder?: number;
      fieldOrder?: number;
    }
  > => {
    const inferContainer = (label: string, type: string) => {
      if (type === "dynamic_rows") return { id: "dynamic_list", title: "数据清单", order: 100 };
      const textKeywords = ["总结", "计划", "说明", "备注"];
      if (type === "text" || type === "textarea" || textKeywords.some((k) => (label || "").includes(k))) {
        return { id: "summary", title: "当日总结", order: 0 };
      }
      return { id: "details", title: "数据详情", order: 10 };
    };
    const map = new Map<
      string,
      {
        label: string;
        type: string;
        rowFields?: { id: string; label: string; type: string; dynamicOptionsKey?: string; fullWidth?: boolean }[];
        containerId?: string;
        containerTitle?: string;
        containerOrder?: number;
        fieldOrder?: number;
      }
    >();
    if (!schema) return map;
    for (let secIndex = 0; secIndex < schema.sections.length; secIndex++) {
      const sec = schema.sections[secIndex];
      for (let fIndex = 0; fIndex < sec.fields.length; fIndex++) {
        const f = sec.fields[fIndex];
        if (!isFieldEnabledForReport(f)) continue;
        if (f.type === "divider") continue;
        const fallback = inferContainer(f.label, f.type);
        map.set(f.id, {
          label: f.label,
          type: f.type,
          rowFields: f.type === "dynamic_rows" ? ((f as any).rowFields || undefined) : undefined,
          containerId: sec.id || fallback.id,
          containerTitle: sec.title || fallback.title,
          containerOrder: typeof secIndex === "number" ? secIndex : fallback.order,
          fieldOrder: fIndex,
        });
      }
    }
    if (map.size === 0) {
      const fallbackEnabledTypes = new Set(["number", "money", "select", "dynamic_select", "calculated", "dynamic_rows"]);
      for (let secIndex = 0; secIndex < schema.sections.length; secIndex++) {
        const sec = schema.sections[secIndex];
        for (let fIndex = 0; fIndex < sec.fields.length; fIndex++) {
          const f = sec.fields[fIndex];
          if (f.type === "divider") continue;
          if (!fallbackEnabledTypes.has(f.type)) continue;
          const fb = inferContainer(f.label, f.type);
          map.set(f.id, {
            label: f.label,
            type: f.type,
            rowFields: f.type === "dynamic_rows" ? ((f as any).rowFields || undefined) : undefined,
            containerId: sec.id || fb.id,
            containerTitle: sec.title || fb.title,
            containerOrder: typeof secIndex === "number" ? secIndex : fb.order,
            fieldOrder: fIndex,
          });
        }
      }
    }
    return map;
  };

  const loadSchemaForGroup = async (schemaId: string): Promise<DailyReportSchema | null> => {
    const normalizedSchemaId = normalizeSchemaId(schemaId);
    const tpl = await prisma.dailyReportTemplate.findUnique({
      where: {
        role_departmentId_schemaId: {
          role: roleForTemplate,
          departmentId,
          schemaId: normalizedSchemaId || "",
        },
      },
    });

    if (tpl) {
      const rawConfig = typeof (tpl as any).configJson === "string" ? JSON.parse((tpl as any).configJson) : (tpl as any).configJson;
      if (isTemplateV2(rawConfig)) {
        return buildSchemaFromTemplateV2(rawConfig, `tpl_v2_${roleForTemplate}_${departmentId}_${normalizedSchemaId || "default"}`);
      }
    }

    if (department.code === "NURSING") {
      return getSchemaForRole(department.code, [roleForTemplate], (normalizedSchemaId || undefined) as NursingRole | undefined, undefined);
    }
    if (department.code === "OFFLINE_MARKETING") {
      return getSchemaForRole(department.code, [roleForTemplate], undefined, (normalizedSchemaId || undefined) as MarketingSubDept | undefined);
    }
    return getSchemaForRole(department.code, [roleForTemplate]);
  };

  const reportGroups: Record<string, any[]> = {};
  for (const r of reports) {
    const key = normalizeSchemaId((r as any).schemaId || "");
    (reportGroups[key] ??= []).push(r);
  }
  for (const sid of knownSchemaIds.map((s) => normalizeSchemaId(s))) {
    (reportGroups[sid] ??= []);
  }
  if (Object.keys(reportGroups).length === 0) reportGroups[""] = [];

  // 2. 预先解析所有用户的自定义配置
  const userConfigMap = new Map<string, { 
    fieldLabels: Map<string, string>, 
    customFields: { id: string, label: string, type: string }[] 
  }>();
  
  for (const u of users) {
    if (u.customFormConfig) {
      try {
        const config = JSON.parse(u.customFormConfig);
        const labels = new Map<string, string>();
        if (config.fieldLabels) {
          Object.entries(config.fieldLabels).forEach(([id, label]) => labels.set(id, label as string));
        }
        userConfigMap.set(u.id, {
          fieldLabels: labels,
          customFields: config.customFields || [],
        });
      } catch (e) {
        // 忽略无效配置
      }
    }
  }

  // 3. 收集所有用户的自定义字段 - 智能分类和标签识别
  const allCustomFields = new Map<string, { 
    label: string; 
    type: string; 
    userIds: Set<string>;
    category: string;
  }>();
  
  for (const u of users) {
    const config = userConfigMap.get(u.id);
    if (config) {
      for (const cf of config.customFields) {
        const existing = allCustomFields.get(cf.id);
        if (existing) {
          existing.userIds.add(u.id);
        } else {
          const category = inferFieldCategory(cf.label, cf.type);
          allCustomFields.set(cf.id, { 
            label: cf.label, 
            type: cf.type, 
            userIds: new Set([u.id]),
            category,
          });
        }
      }
    }
  }

  const allFields: FieldAggregation[] = [];

  for (const [schemaId, groupReports] of Object.entries(reportGroups)) {
    const schema = await loadSchemaForGroup(schemaId);
    const enabledFieldMap = buildEnabledFieldMap(schema);
    const enabledFieldIds = new Set(enabledFieldMap.keys());

    const fieldAggMap = new Map<string, FieldAggregation>();
    enabledFieldMap.forEach((schemaInfo, id) => {
      const label = schemaInfo?.label || id;
      const type = schemaInfo?.type || "number";
      fieldAggMap.set(id, {
        fieldId: id,
        fieldLabel: label,
        fieldType: type,
        rowFields: schemaInfo?.rowFields,
        containerId: schemaInfo?.containerId,
        containerTitle: schemaInfo?.containerTitle,
        containerOrder: schemaInfo?.containerOrder,
        fieldOrder: schemaInfo?.fieldOrder,
        total: 0,
        count: 0,
        average: 0,
        values: [],
        isCustomField: false,
        category: inferFieldCategory(label, type),
        sourceType: "formData",
        subCategory: getSubCategoryLabel(schemaId),
      });
    });

    const userProcessedFields = new Map<string, Set<string>>();

    for (const report of groupReports) {
      const formData = parseFormData(report.formData as string | null);
      const userName = report.User?.name || "未知";

      if (!userProcessedFields.has(report.userId)) {
        userProcessedFields.set(report.userId, new Set());
      }
      const processedFields = userProcessedFields.get(report.userId)!;

      const dataToProcess: Record<string, unknown> = { ...formData };

      const fixedTableData = extractFixedTableData(report, department.code);
      for (const [key, value] of Object.entries(fixedTableData)) {
        if (dataToProcess[key] === undefined || dataToProcess[key] === null || dataToProcess[key] === "") {
          dataToProcess[key] = value;
        }
      }

      for (const [fieldId, value] of Object.entries(dataToProcess)) {
        if (value === null || value === undefined || value === "") continue;
        if (fieldId.startsWith("__")) continue;

        const normalized = normalizeField(fieldId, value);
        if (normalized) {
          if (!enabledFieldIds.has(normalized.normalizedId)) continue;
          if (processedFields.has(normalized.normalizedId)) continue;
          processedFields.add(normalized.normalizedId);
          const agg = fieldAggMap.get(normalized.normalizedId);
          if (agg) {
            agg.values.push({ userId: report.userId, userName, reportDate: report.reportDate, value: normalized.normalizedValue });
            agg.count++;
            if (isNumericField(agg.fieldType)) {
              agg.total += normalized.normalizedValue;
              agg.average = agg.total / agg.count;
            }
          }
          continue;
        }

        if (!enabledFieldIds.has(fieldId)) continue;
        if (processedFields.has(fieldId) && !Array.isArray(value)) continue;
        processedFields.add(fieldId);

        const agg = fieldAggMap.get(fieldId);
        if (!agg) continue;

        agg.values.push({ userId: report.userId, userName, reportDate: report.reportDate, value });
        agg.count++;

        if (agg.fieldType === "dynamic_rows" && Array.isArray(value)) {
          agg.total += value.length;
          agg.average = agg.count > 0 ? agg.total / agg.count : 0;
        } else if (isNumericField(agg.fieldType)) {
          const numValue = getNumericValue(value);
          agg.total += numValue;
          agg.average = agg.count > 0 ? agg.total / agg.count : 0;
        } else {
          agg.total = agg.count;
          agg.average = 0;
        }
      }
    }

    allFields.push(...Array.from(fieldAggMap.values()));
  }

  return {
    departmentId,
    departmentCode: department.code,
    departmentName: department.name,
    userCount: users.length,
    submittedCount: reports.length,
    fields: allFields,
  };
}

/**
 * 汇总门店数据（主入口）
 */
export async function aggregateStoreData(
  storeId: string,
  startDate: string,
  endDate: string
): Promise<StoreAggregation> {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  const dateRange: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    dateRange.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  const departments = await prisma.department.findMany({
    orderBy: { code: "asc" },
  });

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
  
  const departmentAggregations: DepartmentAggregation[] = [];
  for (const dept of departments) {
    const agg = await aggregateDepartmentData(storeId, dept.id, dateRange, roleMap);
    if (agg) departmentAggregations.push(agg);
  }

  const totalsMap = new Map<string, FieldAggregation>();
  for (const deptAgg of departmentAggregations) {
    for (const field of deptAgg.fields) {
      let total = totalsMap.get(field.fieldId);
      if (!total) {
        total = { ...field, total: 0, count: 0, average: 0, values: [] };
        totalsMap.set(field.fieldId, total);
      }
      total.total += field.total;
      total.count += field.count;
      total.values.push(...field.values);
      if (total.count > 0) total.average = total.total / total.count;
    }
  }

  return {
    storeId,
    storeName: store?.name || "未知门店",
    dateRange: { start: startDate, end: endDate },
    departments: departmentAggregations,
    totals: Object.fromEntries(totalsMap),
  };
}

/**
 * 获取关键业务指标
 */
export async function getKeyMetrics(
  storeId: string,
  dateRange: string[]
): Promise<{
  totalCash: number;
  totalDeals: number;
  totalInitial: number;
  totalVisits: number;
  avgDealAmount: number;
  conversionRate: number;
}> {
  // 从咨询部报表获取关键指标
  const consultationReports = await prisma.consultationReport.findMany({
    where: {
      DailyReport: {
        storeId,
        reportDate: { in: dateRange },
        status: "SUBMITTED",
      },
    },
    select: {
      receptionTotal: true,
      initialTotal: true,
      dealsTotal: true,
      cashInCents: true,
    },
  });

  // 汇总指标
  let totalCash = 0;
  let totalDeals = 0;
  let totalInitial = 0;
  let totalVisits = 0;

  for (const report of consultationReports) {
    totalCash += report.cashInCents || 0;
    totalDeals += report.dealsTotal || 0;
    totalInitial += report.initialTotal || 0;
    totalVisits += report.receptionTotal || 0;
  }

  // 转换为元
  totalCash = totalCash / 100;

  // 计算平均成交金额
  const avgDealAmount = totalDeals > 0 ? Math.round(totalCash / totalDeals) : 0;

  // 计算转化率（成交/初诊）
  const conversionRate = totalInitial > 0 
    ? Math.round((totalDeals / totalInitial) * 100) 
    : 0;

  return {
    totalCash,
    totalDeals,
    totalInitial,
    totalVisits,
    avgDealAmount,
    conversionRate,
  };
}

// ============================================================
// 辅助工具函数
// ============================================================

function parseFormData(formData: string | null): Record<string, unknown> {
  if (!formData) return {};
  try {
    const parsed = JSON.parse(formData);

    // V2：容器化存储
    if (parsed && typeof parsed === "object" && (parsed as any).version === 2 && (parsed as any).containers) {
      const flat: Record<string, unknown> = {};
      const containers = (parsed as any).containers || {};
      if (containers && typeof containers === "object") {
        for (const [cid, obj] of Object.entries(containers)) {
          if (!obj || typeof obj !== "object") continue;
          for (const [fid, val] of Object.entries(obj as any)) {
            const key = `${cid}.${fid}`;
            const existing = flat[key];
            if (existing === undefined) {
              flat[key] = val;
            } else if (typeof existing === "number" && typeof val === "number") {
              flat[key] = existing + val;
            } else if (Array.isArray(existing) && Array.isArray(val)) {
              flat[key] = [...existing, ...val];
            }
          }
        }
      }
      return flat;
    }

    return parsed;
  } catch (e) {
    return {};
  }
}

function buildFieldLabelMap(schema: DailyReportSchema | null): Map<string, { label: string; type: string }> {
  const map = new Map<string, { label: string; type: string }>();
  if (!schema) return map;
  schema.sections.forEach((s) => s.fields.forEach((f) => map.set(f.id, { label: f.label, type: f.type })));
  return map;
}

function isCustomField(fieldId: string): boolean {
  return fieldId.startsWith("custom_");
}

function isNumericField(type: string): boolean {
  return type === "number" || type === "money" || type === "calculated";
}

function getNumericValue(value: unknown): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function inferFieldCategory(label: string, type: string): string {
  const l = label.toLowerCase();
  if (l.includes("业绩") || l.includes("金额") || l.includes("收入") || l.includes("钱")) return "revenue";
  if (l.includes("到院") || l.includes("到诊") || l.includes("接诊") || l.includes("客")) return "visits";
  if (l.includes("成交") || l.includes("转化")) return "deals";
  if (l.includes("线索") || l.includes("意向") || l.includes("预约")) return "leads";
  return "other";
}

function normalizeField(fieldId: string, value: unknown): { normalizedId: string; label: string; type: string; normalizedValue: number } | null {
  const config = FIELD_NORMALIZATION[fieldId];
  if (!config) return null;
  let numVal = getNumericValue(value);
  if (config.isMoneyInCents) numVal = numVal / 100;
  return { normalizedId: config.normalizedId, label: config.label, type: config.type, normalizedValue: numVal };
}

function extractFixedTableData(report: any, departmentCode: string): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  const mapTable = (table: any, mapping: Record<string, string>) => {
    if (!table) return;
    Object.entries(mapping).forEach(([key, apiKey]) => {
      if (table[key] !== undefined) data[apiKey] = table[key];
    });
  };

  switch (departmentCode) {
    case "CONSULTATION":
      mapTable(report.ConsultationReport, { 
        receptionTotal: "receptionTotal", 
        initialTotal: "firstVisitCount",
        dealsTotal: "dealCount",
        cashInCents: "cashInCents"
      });
      break;
    case "FRONT_DESK":
      mapTable(report.FrontDeskReport, {
        newVisits: "firstVisitCount",
        returningVisits: "returnVisitCount",
        initialTriage: "initialTriage",
        new_patients_count: "new_patients_count"
      });
      break;
    case "ONLINE_GROWTH":
      mapTable(report.OnlineGrowthReport, {
        leads_today: "leads_today",
        leads_month: "leads_month",
        visits_today: "visits_today",
        deals_today: "deals_today",
        visits_month: "visits_month",
        deals_month: "deals_month",
        revenue_today: "revenue_today",
        followup_today: "followup_today",
        intentional_tomorrow: "intentional_tomorrow"
      });
      break;
  }
  return data;
}
