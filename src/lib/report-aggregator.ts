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
import { getSchemaForRole, DailyReportSchema, FormField } from "./schemas";
import type { DepartmentCode, Role } from "./types";

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
  // ====== 到店人数 (卡片1) ======
  totalVisitors: { normalizedId: "totalVisitors", label: "到店人数", type: "number" },
  totalArrival: { normalizedId: "totalVisitors", label: "到店人数", type: "number" },
  
  // ====== 新客/老客 (卡片1子指标) ======
  newVisitors: { normalizedId: "newVisitors", label: "新客人数", type: "number" },
  newCustomers: { normalizedId: "newVisitors", label: "新客人数", type: "number" },
  returningVisitors: { normalizedId: "returningVisitors", label: "老客人数", type: "number" },
  oldCustomers: { normalizedId: "returningVisitors", label: "老客人数", type: "number" },
  
  // ====== 初诊人数 (卡片2) ======
  firstVisitCount: { normalizedId: "firstVisitCount", label: "初诊人数", type: "number" },
  initialTotal: { normalizedId: "firstVisitCount", label: "初诊人数", type: "number" },
  initialCount: { normalizedId: "firstVisitCount", label: "初诊人数", type: "number" },
  newVisits: { normalizedId: "firstVisitCount", label: "初诊人数", type: "number" },
  teamFirstVisit: { normalizedId: "teamFirstVisit", label: "团队首诊人数", type: "number" },
  
  // ====== 初诊成交人数 (卡片2子指标) ======
  firstVisitDealCount: { normalizedId: "firstVisitDealCount", label: "初诊成交人数", type: "number" },
  initialDealCount: { normalizedId: "firstVisitDealCount", label: "初诊成交人数", type: "number" },
  
  // ====== 复诊人数 ======
  returnVisitCount: { normalizedId: "returnVisitCount", label: "复诊人数", type: "number" },
  returningVisits: { normalizedId: "returnVisitCount", label: "复诊人数", type: "number" },
  teamReturnVisit: { normalizedId: "teamReturnVisit", label: "团队复诊人数", type: "number" },
  
  // ====== 接诊总数 (咨询部人效) ======
  receptionTotal: { normalizedId: "receptionTotal", label: "接诊总数", type: "number" },
  receptionCount: { normalizedId: "receptionTotal", label: "接诊总数", type: "number" },
  teamReceptionTotal: { normalizedId: "teamReceptionTotal", label: "团队接诊总数", type: "number" },
  
  // ====== 成交人数 (卡片3) ======
  dealCount: { normalizedId: "dealCount", label: "成交人数", type: "number" },
  dealsTotal: { normalizedId: "dealCount", label: "成交人数", type: "number" },
  teamDealCount: { normalizedId: "teamDealCount", label: "团队成交人数", type: "number" },
  
  // ====== 未成交人数 ======
  noDealCount: { normalizedId: "noDealCount", label: "未成交人数", type: "number" },
  
  // ====== 实收金额 (卡片4) ======
  actualRevenue: { normalizedId: "actualRevenue", label: "实收金额", type: "money" },
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
  
  // ====== 线索获取 (卡片7) ======
  newLeads: { normalizedId: "newLeads", label: "线索获取", type: "number" },
  leadsNew: { normalizedId: "newLeads", label: "线索获取", type: "number" },
  newLeadsTotal: { normalizedId: "newLeads", label: "线索获取", type: "number" },
  
  // ====== 有效线索 (卡片7子指标) ======
  validLeads: { normalizedId: "validLeads", label: "有效线索", type: "number" },
  leadsValid: { normalizedId: "validLeads", label: "有效线索", type: "number" },
  validInfoCollected: { normalizedId: "validLeads", label: "有效线索", type: "number" },
  wechatAdded: { normalizedId: "wechatAdded", label: "微信添加数", type: "number" },
  
  // ====== 预约人数 (卡片5) ======
  appointmentsMade: { normalizedId: "appointmentsMade", label: "预约人数", type: "number" },
  appointmentsBooked: { normalizedId: "appointmentsMade", label: "预约人数", type: "number" },
  newAppointments: { normalizedId: "appointmentsMade", label: "预约人数", type: "number" },
  
  // ====== 爽约人数 (卡片5子指标) ======
  noShowCount: { normalizedId: "noShowCount", label: "爽约人数", type: "number" },
  noShowTotal: { normalizedId: "noShowCount", label: "爽约人数", type: "number" },
  noShowAppointments: { normalizedId: "noShowCount", label: "爽约人数", type: "number" },
  
  // ====== 复诊预约 (卡片6) ======
  followupAppointments: { normalizedId: "followupAppointments", label: "复诊预约", type: "number" },
  followupAppt: { normalizedId: "followupAppointments", label: "复诊预约", type: "number" },
  nextAppointment: { normalizedId: "followupAppointments", label: "复诊预约", type: "number" },
  
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

  // ====== 财务对账 (严格对应 UI) ======
  financeActualRevenue: { normalizedId: "financeActualRevenue", label: "财务实收", type: "money" },
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
  total: number;
  count: number;
  average: number;
  values: { userId: string; userName: string; value: unknown }[];
  // 智能分类信息
  isCustomField: boolean;     // 是否为自定义字段
  category: string;           // 字段类别：revenue/visits/deals/leads/appointments/other
  sourceType: "formData" | "fixedTable" | "mixed";  // 数据来源
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
  dateRange: string[]
): Promise<DepartmentAggregation | null> {
  // 获取部门信息
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
  });

  if (!department) return null;

  // 获取该部门下的所有员工
  const users = await prisma.user.findMany({
    where: {
      storeId,
      departmentId,
      isActive: true,
    },
    select: { id: true, name: true, roles: true, nursingRole: true, customFormConfig: true },
  });

  if (users.length === 0) {
    return {
      departmentId,
      departmentCode: department.code,
      departmentName: department.name,
      userCount: 0,
      submittedCount: 0,
      fields: [],
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
        select: { name: true, roles: true, nursingRole: true, customFormConfig: true },
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

  // 1. 获取该部门的默认 schema 来确定字段标签
  const sampleUser = users[0];
  let defaultSchema: DailyReportSchema | null = null;
  if (sampleUser) {
    const roles = JSON.parse(sampleUser.roles || '["STAFF"]') as Role[];
    defaultSchema = getSchemaForRole(
      department.code,
      roles,
      sampleUser.nursingRole as any || undefined
    );
  }
  const fieldLabelMap = buildFieldLabelMap(defaultSchema);

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

  // 4. 获取所有可能的字段 ID (Schema + 实际数据中出现的)
  const fieldIds = new Set<string>();
  if (defaultSchema) {
    defaultSchema.sections.forEach(s => s.fields.forEach(f => fieldIds.add(f.id)));
  }
  for (const report of reports) {
    const formData = parseFormData(report.formData as string | null);
    Object.keys(formData).forEach(id => {
      if (!id.startsWith("__")) fieldIds.add(id);
    });
  }

  // 5. 构建并预填充字段汇总 Map
  const fieldAggMap = new Map<string, FieldAggregation>();
  fieldIds.forEach(id => {
    const isCustom = isCustomField(id);
    const customInfo = allCustomFields.get(id);
    const schemaInfo = fieldLabelMap.get(id);
    
    const label = customInfo?.label || schemaInfo?.label || id;
    const type = customInfo?.type || schemaInfo?.type || "number";
    
    fieldAggMap.set(id, {
      fieldId: id,
      fieldLabel: label,
      fieldType: type,
      total: 0,
      count: 0,
      average: 0,
      values: [],
      isCustomField: isCustom,
      category: customInfo?.category || inferFieldCategory(label, type),
      sourceType: "formData",
    });
  });

  // 6. 处理每份日报
  const userProcessedFields = new Map<string, Set<string>>();
  
  for (const report of reports) {
    const formData = parseFormData(report.formData as string | null);
    const userName = report.User?.name || "未知";
    const userConfig = userConfigMap.get(report.userId);

    if (!userProcessedFields.has(report.userId)) {
      userProcessedFields.set(report.userId, new Set());
    }
    const processedFields = userProcessedFields.get(report.userId)!;

    let dataToProcess: Record<string, unknown> = { ...formData };
    
    // 特殊处理：dynamic_rows (展开为平铺字段以供统计)
    Object.entries(formData).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        const schemaInfo = fieldLabelMap.get(key);
        const parentLabel = schemaInfo?.label || key;

        value.forEach((row: any) => {
          Object.entries(row).forEach(([subKey, subVal]) => {
            if (typeof subVal === "number") {
              const flatKey = `${key}_${subKey}`;
              dataToProcess[flatKey] = (Number(dataToProcess[flatKey]) || 0) + subVal;
              
              if (!fieldAggMap.has(flatKey)) {
                fieldAggMap.set(flatKey, {
                  fieldId: flatKey,
                  fieldLabel: `${parentLabel}-${subKey}`,
                  fieldType: "number",
                  total: 0, count: 0, average: 0, values: [],
                  isCustomField: false,
                  category: inferFieldCategory(subKey, "number"),
                  sourceType: "formData",
                });
              }
            }
          });
        });
      }
    });
    
    const fixedTableData = extractFixedTableData(report, department.code);
    for (const [key, value] of Object.entries(fixedTableData)) {
      if (dataToProcess[key] === undefined || dataToProcess[key] === null || dataToProcess[key] === "") {
        dataToProcess[key] = value;
      }
    }

    for (const [fieldId, value] of Object.entries(dataToProcess)) {
      if (value === null || value === undefined || value === "") continue;
      
      const numValue = getNumericValue(value);
      if (numValue === 0 && typeof value !== 'number') continue;

      const schemaInfo = fieldLabelMap.get(fieldId);
      const normalized = normalizeField(fieldId, value, schemaInfo?.metricKey);
      let useFieldId: string;
      let useValue: number;
      
      if (normalized) {
        if (processedFields.has(normalized.normalizedId)) continue;
        processedFields.add(normalized.normalizedId);
        useFieldId = normalized.normalizedId;
        useValue = normalized.normalizedValue;
      } else {
        if (isCustomField(fieldId)) {
          if (processedFields.has(fieldId)) continue;
          processedFields.add(fieldId);
        }
        useFieldId = fieldId;
        useValue = numValue;
      }

      const agg = fieldAggMap.get(useFieldId);
      if (agg) {
        agg.values.push({ userId: report.userId, userName, value: useValue });
        agg.count++;
        if (isNumericField(agg.fieldType)) {
          agg.total += useValue;
          agg.average = agg.total / agg.count;
        }
      }
    }
  }

  return {
    departmentId,
    departmentCode: department.code,
    departmentName: department.name,
    userCount: users.length,
    submittedCount: reports.length,
    fields: Array.from(fieldAggMap.values()),
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
    where: { User: { some: { storeId, isActive: true } } },
  });
  
  const departmentAggregations: DepartmentAggregation[] = [];
  for (const dept of departments) {
    const agg = await aggregateDepartmentData(storeId, dept.id, dateRange);
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

    // V2：容器化存储（只展开非数组字段，数组/清单不参与报表列）
    if (parsed && typeof parsed === "object" && (parsed as any).version === 2 && (parsed as any).containers) {
      const flat: Record<string, unknown> = {};
      const containers = (parsed as any).containers || {};
      if (containers && typeof containers === "object") {
        for (const [cid, obj] of Object.entries(containers)) {
          if (!obj || typeof obj !== "object") continue;
          for (const [fid, val] of Object.entries(obj as any)) {
            if (Array.isArray(val)) continue; // 动态清单跳过（避免报表列爆炸）
            flat[`${cid}.${fid}`] = val;
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

function buildFieldLabelMap(schema: DailyReportSchema | null): Map<string, { label: string; type: string; metricKey?: string }> {
  const map = new Map<string, { label: string; type: string; metricKey?: string }>();
  if (!schema) return map;
  schema.sections.forEach((s) => s.fields.forEach((f) => {
    // 1. 添加顶级字段映射
    map.set(f.id, { label: f.label, type: f.type, metricKey: f.metricKey });
    
    // 2. 如果是清单字段，添加其内部子列的映射（用于扁平化统计）
    if (f.type === "dynamic_rows" && f.rowFields) {
      f.rowFields.forEach(rf => {
        const flatId = `${f.id}_${rf.id}`;
        map.set(flatId, { 
          label: `${f.label}-${rf.label}`, 
          type: rf.type, 
          metricKey: rf.metricKey 
        });
      });
    }
  }));
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

function normalizeField(
  fieldId: string, 
  value: unknown, 
  metricKey?: string
): { normalizedId: string; label: string; type: string; normalizedValue: number } | null {
  // 1. 优先使用显式绑定的标准指标
  if (metricKey && FIELD_NORMALIZATION[metricKey]) {
    const config = FIELD_NORMALIZATION[metricKey];
    let numVal = getNumericValue(value);
    if (config.isMoneyInCents) numVal = numVal / 100;
    return { normalizedId: config.normalizedId, label: config.label, type: config.type, normalizedValue: numVal };
  }

  // 2. 备选：使用字段 ID 映射
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
