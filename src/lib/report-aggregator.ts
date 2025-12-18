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
};

/**
 * 规范化字段ID和值
 * 将各种可能的字段名统一为规范名称，并处理金额单位
 */
function normalizeField(fieldId: string, value: unknown): { normalizedId: string; label: string; type: string; normalizedValue: number } | null {
  const numValue = getNumericValue(value);
  if (numValue === 0) return null;
  
  const mapping = FIELD_NORMALIZATION[fieldId];
  if (mapping) {
    // 如果是分，转换为元
    const normalizedValue = mapping.isMoneyInCents ? numValue / 100 : numValue;
    return {
      normalizedId: mapping.normalizedId,
      label: mapping.label,
      type: mapping.type,
      normalizedValue,
    };
  }
  
  // 没有映射的字段，保持原样
  return null;
}

/**
 * 智能分类字段 - 根据字段名称和类型推断所属类别
 */
function inferFieldCategory(label: string, type: string): string {
  const labelLower = label.toLowerCase();
  
  // 业绩/金额类
  if (type === "money" || 
      labelLower.includes("金额") || labelLower.includes("业绩") || 
      labelLower.includes("收入") || labelLower.includes("费用") ||
      labelLower.includes("收款") || labelLower.includes("退费")) {
    return "revenue";
  }
  
  // 人数/到院类
  if (labelLower.includes("人数") || labelLower.includes("到院") ||
      labelLower.includes("初诊") || labelLower.includes("复诊") ||
      labelLower.includes("到店") || labelLower.includes("接诊")) {
    return "visits";
  }
  
  // 成交/转化类
  if (labelLower.includes("成交") || labelLower.includes("转化") ||
      labelLower.includes("成单") || labelLower.includes("签约")) {
    return "deals";
  }
  
  // 线索类
  if (labelLower.includes("线索") || labelLower.includes("意向") ||
      labelLower.includes("添加") || labelLower.includes("采集")) {
    return "leads";
  }
  
  // 预约类
  if (labelLower.includes("预约") || labelLower.includes("爽约") ||
      labelLower.includes("取消") || labelLower.includes("改约")) {
    return "appointments";
  }
  
  // 默认分类
  return "other";
}

/**
 * 判断是否为自定义字段（以 custom_ 开头）
 */
function isCustomField(fieldId: string): boolean {
  return fieldId.startsWith("custom_");
}

// 字段汇总结果类型
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

// 部门汇总结果
export interface DepartmentAggregation {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  userCount: number;
  submittedCount: number;
  fields: FieldAggregation[];
}

// 门店汇总结果
export interface StoreAggregation {
  storeId: string;
  storeName: string;
  dateRange: { start: string; end: string };
  departments: DepartmentAggregation[];
  totals: Record<string, FieldAggregation>;
}

/**
 * 从 formData JSON 中解析数据
 */
function parseFormData(formDataStr: string | null): Record<string, unknown> {
  if (!formDataStr) return {};
  try {
    return typeof formDataStr === "string" ? JSON.parse(formDataStr) : formDataStr;
  } catch {
    return {};
  }
}

/**
 * 判断字段是否为数值类型
 */
function isNumericField(fieldType: string): boolean {
  return ["number", "money", "calculated"].includes(fieldType);
}

/**
 * 获取字段的数值
 */
function getNumericValue(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

/**
 * 获取部门的默认 Schema
 */
function getDepartmentSchema(
  departmentCode: string,
  roles: Role[],
  nursingRole?: string
): DailyReportSchema | null {
  return getSchemaForRole(
    departmentCode as DepartmentCode,
    roles,
    nursingRole as any
  );
}

// 所有字段的中文标签映射（包含 formData schema 字段和固定表字段）
// 确保所有可能的字段都有中文标签
const ALL_FIELD_LABELS: Record<string, { label: string; type: string }> = {
  // ====== 前台日报 schema 字段 ======
  actualRevenue: { label: "实收业绩", type: "money" },
  expectedRevenue: { label: "应收业绩", type: "money" },
  refundAmount: { label: "今日退费", type: "money" },
  totalVisitors: { label: "总到院人数", type: "number" },
  firstVisitCount: { label: "初诊人数", type: "number" },
  returnVisitCount: { label: "复诊人数", type: "number" },
  firstVisitAmount: { label: "初诊消费金额", type: "money" },
  returnVisitAmount: { label: "复诊消费金额", type: "money" },
  totalArrival: { label: "到诊总数", type: "number" },
  noShowTotal: { label: "爽约总数", type: "number" },
  appointmentRate: { label: "预约兑现率", type: "number" },
  firstVisitSource: { label: "初诊来源", type: "text" },
  firstVisitProject: { label: "初诊项目成交", type: "text" },
  noShowReason1: { label: "爽约原因Top1", type: "text" },
  noShowReason2: { label: "爽约原因Top2", type: "text" },
  noShowReason3: { label: "爽约原因Top3", type: "text" },
  noShowImproveAction: { label: "明日改善动作", type: "textarea" },
  complaintOwner: { label: "责任人", type: "text" },
  complaintDeadline: { label: "完成时间", type: "text" },
  complaintDetail: { label: "客诉详情与进度", type: "textarea" },
  resourceSufficient: { label: "资源是否满足预约量", type: "select" },
  resourceGap: { label: "缺口说明", type: "textarea" },
  
  // ====== 咨询部 schema 字段 ======
  receptionTotal: { label: "接诊人数", type: "number" },
  receptionCount: { label: "接诊人数", type: "number" },
  initialCount: { label: "初诊人数", type: "number" },
  dealCount: { label: "成交人数", type: "number" },
  noDealCount: { label: "未成交人数", type: "number" },
  conversionRate: { label: "到诊成交转化率", type: "calculated" },
  initialDealCount: { label: "初诊成交人数", type: "number" },
  cashAmount: { label: "实收金额", type: "money" },
  cashInYuan: { label: "当日实收金额", type: "money" },
  implantIntention: { label: "种植意向", type: "number" },
  orthoIntention: { label: "正畸意向", type: "number" },
  followupAppt: { label: "复诊预约数", type: "number" },
  // 项目结构字段
  implant_visit: { label: "种植-到诊", type: "number" },
  implant_deal: { label: "种植-成交", type: "number" },
  implant_amount: { label: "种植-金额", type: "money" },
  ortho_visit: { label: "正畸-到诊", type: "number" },
  ortho_deal: { label: "正畸-成交", type: "number" },
  ortho_amount: { label: "正畸-金额", type: "money" },
  restore_visit: { label: "修复/综合-到诊", type: "number" },
  restore_deal: { label: "修复/综合-成交", type: "number" },
  restore_amount: { label: "修复/综合-金额", type: "money" },
  pediatric_visit: { label: "儿牙-到诊", type: "number" },
  pediatric_deal: { label: "儿牙-成交", type: "number" },
  pediatric_amount: { label: "儿牙-金额", type: "money" },
  other_visit: { label: "其他-到诊", type: "number" },
  other_deal: { label: "其他-成交", type: "number" },
  other_amount: { label: "其他-金额", type: "money" },
  // 关键过程数据
  planOutputCount: { label: "方案输出数", type: "number" },
  followupNeeded: { label: "复访客户数", type: "number" },
  followupDone: { label: "当日完成回访次数", type: "number" },
  nextAppointment: { label: "预约下次复诊人数", type: "number" },
  depositCount: { label: "定金笔数", type: "number" },
  depositAmount: { label: "定金金额", type: "money" },
  installmentApply: { label: "分期申请数", type: "number" },
  installmentApproved: { label: "分期通过数", type: "number" },
  noDealReason: { label: "主要未成交原因", type: "multiselect" },
  noDealReasonDetail: { label: "原因补充说明", type: "textarea" },
  todayActions: { label: "今日促成动作", type: "textarea" },
  tomorrowTargets: { label: "明日要约对象", type: "textarea" },
  supportNeeded: { label: "需要支持", type: "textarea" },
  // 咨询主管团队汇总
  teamReceptionTotal: { label: "组到诊总数", type: "number" },
  teamFirstVisit: { label: "首诊人数", type: "number" },
  teamReturnVisit: { label: "复诊人数", type: "number" },
  teamDealCount: { label: "组成交人数", type: "number" },
  teamCashInYuan: { label: "组成交金额", type: "money" },
  teamAvgTicket: { label: "客单价", type: "money" },
  implantRatio: { label: "种植占比", type: "number" },
  orthoRatio: { label: "正畸占比", type: "number" },
  restoreRatio: { label: "综合占比", type: "number" },
  pediatricRatio: { label: "儿牙占比", type: "number" },
  teamConversionRate: { label: "组转化率", type: "calculated" },
  highIntentNoDeal: { label: "高意向未成交人数", type: "number" },
  midIntentNoDeal: { label: "中意向未成交人数", type: "number" },
  lowIntentNoDeal: { label: "低意向未成交人数", type: "number" },
  todayNewNoDeal: { label: "今日新增未成交", type: "number" },
  historyNoDealCleared: { label: "历史未成交清理", type: "number" },
  lowConversionReason: { label: "转化率低于目标原因", type: "textarea" },
  lowConversionAction: { label: "明日改进动作", type: "textarea" },
  bigProjectGapReason: { label: "大项目空白原因", type: "textarea" },
  bigProjectAction: { label: "大项目安排", type: "textarea" },
  complaintEvent: { label: "客诉/纠纷事件", type: "textarea" },
  complaintProgress: { label: "处理节点", type: "textarea" },
  keyCustomerList: { label: "明日重点客户清单", type: "textarea" },
  doctorConsultSchedule: { label: "医生会诊安排", type: "textarea" },
  
  // ====== 市场部 schema 字段 ======
  newLeads: { label: "新增线索", type: "number" },
  validLeads: { label: "有效线索", type: "number" },
  appointmentsMade: { label: "预约成功", type: "number" },
  arrivedCount: { label: "到店人数", type: "number" },
  marketingCost: { label: "市场费用", type: "money" },
  
  // ====== 网络/新媒体字段 ======
  wechatAdded: { label: "微信添加数", type: "number" },
  validInfoCollected: { label: "有效信息采集", type: "number" },
  couponsDistributed: { label: "优惠券发放", type: "number" },
  fieldHours: { label: "外勤时长", type: "number" },
  partnerVisits: { label: "合作方拜访", type: "number" },
  
  // ====== 人事/行政字段 ======
  hireCount: { label: "入职人数", type: "number" },
  resignCount: { label: "离职人数", type: "number" },
  attendanceRate: { label: "出勤率", type: "number" },
  traineeCount: { label: "培训人数", type: "number" },
  
  // ====== 财务字段 ======
  cardInYuan: { label: "刷卡收款", type: "money" },
  onlineInYuan: { label: "在线收款", type: "money" },
  refundInYuan: { label: "退款金额", type: "money" },
  expenseTotal: { label: "总支出", type: "money" },
  
  // ====== 固定表字段（旧系统兼容）======
  initialTotal: { label: "初诊人数", type: "number" },
  dealsTotal: { label: "成交人数", type: "number" },
  initialDealsTotal: { label: "初诊成交", type: "number" },
  cashInCents: { label: "实收金额", type: "money" },
  implantLeads: { label: "种植意向", type: "number" },
  orthoLeads: { label: "正畸意向", type: "number" },
  followupAppointments: { label: "复诊预约", type: "number" },
  followupCallsDone: { label: "回访完成", type: "number" },
  newVisits: { label: "新客到店", type: "number" },
  returningVisits: { label: "老客到店", type: "number" },
  newAppointments: { label: "新增预约", type: "number" },
  rescheduledAppointments: { label: "改约数", type: "number" },
  canceledAppointments: { label: "取消预约", type: "number" },
  noShowAppointments: { label: "爽约数", type: "number" },
  initialTriage: { label: "初诊分诊", type: "number" },
  revisitTriage: { label: "复诊分诊", type: "number" },
  paymentsCount: { label: "收款笔数", type: "number" },
  refundsCount: { label: "退款笔数", type: "number" },
  complaintsCount: { label: "投诉数", type: "number" },
  resolvedCount: { label: "已解决", type: "number" },
  touchpoints: { label: "触点数", type: "number" },
  leadsNew: { label: "新增线索", type: "number" },
  leadsValid: { label: "有效线索", type: "number" },
  appointmentsBooked: { label: "预约数", type: "number" },
  visitsArrived: { label: "到店数", type: "number" },
  costInCents: { label: "费用", type: "money" },
  partnershipsNew: { label: "新增合作", type: "number" },
  partnershipsMaintained: { label: "维护合作", type: "number" },
  videosPublished: { label: "发布视频", type: "number" },
  liveSessions: { label: "直播场次", type: "number" },
  postsPublished: { label: "发布文章", type: "number" },
  adSpendInCents: { label: "广告费用", type: "money" },
  followupsDone: { label: "跟进完成", type: "number" },
  unreachableCount: { label: "未接通", type: "number" },
  patientsSeen: { label: "接诊患者", type: "number" },
  patientsTotal: { label: "接诊患者总数", type: "number" },
  patientsFirst: { label: "初诊患者", type: "number" },
  patientsReturn: { label: "复诊患者", type: "number" },
  implantCases: { label: "种植手术台数", type: "number" },
  orthoCases: { label: "正畸调整人数", type: "number" },
  restoreCases: { label: "修复治疗人数", type: "number" },
  pediatricCases: { label: "儿牙治疗人数", type: "number" },
  emergencyCases: { label: "急诊处理人数", type: "number" },
  consultationCount: { label: "会诊次数", type: "number" },
  complicationCount: { label: "并发症/不良反应例数", type: "number" },
  complicationDetail: { label: "并发症详情", type: "textarea" },
  tomorrowSurgery: { label: "明日手术安排", type: "textarea" },
  tomorrowConsult: { label: "明日会诊安排", type: "textarea" },
  rootCanals: { label: "根管治疗", type: "number" },
  fillings: { label: "补牙", type: "number" },
  extractions: { label: "拔牙", type: "number" },
  fixedProsthesisDelivered: { label: "固定修复", type: "number" },
  removableProsthesisDeliv: { label: "活动修复", type: "number" },
  implantSurgeries: { label: "种植手术", type: "number" },
  orthoStarts: { label: "正畸开始", type: "number" },
  orthoFollowups: { label: "正畸复诊", type: "number" },
  riskEvents: { label: "风险事件", type: "number" },
  panoramicXrays: { label: "全景片", type: "number" },
  cbctScans: { label: "CBCT扫描", type: "number" },
  intraoralScansPhotos: { label: "口内照", type: "number" },
  sterilizerCycles: { label: "消毒锅次", type: "number" },
  instrumentPacks: { label: "器械包", type: "number" },
  consumableIncidents: { label: "耗材异常", type: "number" },
  doctorsAssisted: { label: "协助医生数", type: "number" },
  overtimeMinutes: { label: "加班分钟", type: "number" },
  hygieneVisits: { label: "洁牙人数", type: "number" },
  perioTherapies: { label: "牙周治疗", type: "number" },
  referralsToDoctor: { label: "转诊数", type: "number" },
  refundsInCents: { label: "退款金额", type: "money" },
  cashPayInCents: { label: "现金收款", type: "money" },
  cardPayInCents: { label: "刷卡收款", type: "money" },
  onlinePayInCents: { label: "在线收款", type: "money" },
  expenseTotalInCents: { label: "总支出", type: "money" },
  expenseMaterialInCents: { label: "材料支出", type: "money" },
  expenseProcessingInCents: { label: "加工支出", type: "money" },
  expenseMarketingInCents: { label: "市场支出", type: "money" },
  expenseAdminInCents: { label: "行政支出", type: "money" },
  reconciliationIssues: { label: "对账问题", type: "number" },
  staffScheduled: { label: "排班人数", type: "number" },
  staffPresent: { label: "出勤人数", type: "number" },
  staffAbsent: { label: "缺勤人数", type: "number" },
  hiresCount: { label: "入职人数", type: "number" },
  resignationsCount: { label: "离职人数", type: "number" },
  trainingSessions: { label: "培训场次", type: "number" },
  traineesCount: { label: "培训人数", type: "number" },
};

/**
 * 构建字段标签映射（fieldId -> label）
 */
function buildFieldLabelMap(schema: DailyReportSchema | null): Map<string, { label: string; type: string }> {
  const map = new Map<string, { label: string; type: string }>();
  
  // 先添加所有已知字段映射
  for (const [fieldId, info] of Object.entries(ALL_FIELD_LABELS)) {
    map.set(fieldId, info);
  }
  
  // 再从 schema 添加（会覆盖默认映射，使用更精确的定义）
  if (schema) {
    for (const section of schema.sections) {
      for (const field of section.fields) {
        map.set(field.id, { label: field.label, type: field.type });
      }
    }
  }
  
  return map;
}

/**
 * 解析用户自定义字段配置
 */
function parseCustomFormConfig(configStr: string | null): {
  fieldLabels: Map<string, string>;
  customFields: { id: string; label: string; type: string }[];
} {
  const fieldLabels = new Map<string, string>();
  const customFields: { id: string; label: string; type: string }[] = [];
  
  if (!configStr) return { fieldLabels, customFields };
  
  try {
    const config = JSON.parse(configStr);
    // 解析字段自定义标签
    if (config.fields) {
      for (const [fieldId, fieldConfig] of Object.entries(config.fields)) {
        const fc = fieldConfig as { customLabel?: string };
        if (fc.customLabel) {
          fieldLabels.set(fieldId, fc.customLabel);
        }
      }
    }
    // 解析自定义添加的字段
    if (config.customFields && Array.isArray(config.customFields)) {
      for (const cf of config.customFields) {
        customFields.push({
          id: cf.id,
          label: cf.label,
          type: cf.type || "number",
        });
      }
    }
  } catch {
    // ignore parse errors
  }
  
  return { fieldLabels, customFields };
}

/**
 * 从固定表提取数据（兼容旧数据）
 */
function extractFixedTableData(
  report: {
    consultation?: { receptionTotal: number; initialTotal: number; dealsTotal: number; initialDealsTotal: number; cashInCents: number; implantLeads: number; orthoLeads: number; followupAppointments: number; followupCallsDone: number } | null;
    frontDesk?: { newVisits: number; returningVisits: number; newAppointments: number; rescheduledAppointments: number; canceledAppointments: number; noShowAppointments: number; initialTriage: number; revisitTriage: number; paymentsCount: number; refundsCount: number; complaintsCount: number; resolvedCount: number } | null;
    offlineMarketing?: { touchpoints: number; leadsNew: number; leadsValid: number; appointmentsBooked: number; visitsArrived: number; costInCents: number; partnershipsNew: number; partnershipsMaintained: number } | null;
    onlineGrowth?: { videosPublished: number; liveSessions: number; postsPublished: number; leadsNew: number; leadsValid: number; appointmentsBooked: number; visitsArrived: number; adSpendInCents: number; followupsDone: number; unreachableCount: number } | null;
    medical?: { patientsSeen: number; rootCanals: number; fillings: number; extractions: number; fixedProsthesisDelivered: number; removableProsthesisDeliv: number; implantSurgeries: number; orthoStarts: number; orthoFollowups: number; riskEvents: number } | null;
    nursing?: { workType: string; panoramicXrays: number; cbctScans: number; intraoralScansPhotos: number; sterilizerCycles: number; instrumentPacks: number; consumableIncidents: number; doctorsAssisted: number; overtimeMinutes: number; hygieneVisits: number; perioTherapies: number; referralsToDoctor: number } | null;
    financeHrAdmin?: { cashInCents: number; refundsInCents: number; cashPayInCents: number; cardPayInCents: number; onlinePayInCents: number; expenseTotalInCents: number; expenseMaterialInCents: number; expenseProcessingInCents: number; expenseMarketingInCents: number; expenseAdminInCents: number; reconciliationIssues: number; staffScheduled: number; staffPresent: number; staffAbsent: number; hiresCount: number; resignationsCount: number; trainingSessions: number; traineesCount: number } | null;
  },
  departmentCode: string
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  switch (departmentCode) {
    case "CONSULTATION":
      if (report.consultation) {
        const c = report.consultation;
        data.receptionTotal = c.receptionTotal;
        data.initialTotal = c.initialTotal;
        data.dealsTotal = c.dealsTotal;
        data.initialDealsTotal = c.initialDealsTotal;
        data.cashInCents = c.cashInCents;
        data.implantLeads = c.implantLeads;
        data.orthoLeads = c.orthoLeads;
        data.followupAppointments = c.followupAppointments;
        data.followupCallsDone = c.followupCallsDone;
      }
      break;

    case "FRONT_DESK":
      if (report.frontDesk) {
        const f = report.frontDesk;
        data.newVisits = f.newVisits;
        data.returningVisits = f.returningVisits;
        data.newAppointments = f.newAppointments;
        data.rescheduledAppointments = f.rescheduledAppointments;
        data.canceledAppointments = f.canceledAppointments;
        data.noShowAppointments = f.noShowAppointments;
        data.initialTriage = f.initialTriage;
        data.revisitTriage = f.revisitTriage;
        data.paymentsCount = f.paymentsCount;
        data.refundsCount = f.refundsCount;
        data.complaintsCount = f.complaintsCount;
        data.resolvedCount = f.resolvedCount;
      }
      break;

    case "OFFLINE_MARKETING":
      if (report.offlineMarketing) {
        const o = report.offlineMarketing;
        data.touchpoints = o.touchpoints;
        data.leadsNew = o.leadsNew;
        data.leadsValid = o.leadsValid;
        data.appointmentsBooked = o.appointmentsBooked;
        data.visitsArrived = o.visitsArrived;
        data.costInCents = o.costInCents;
        data.partnershipsNew = o.partnershipsNew;
        data.partnershipsMaintained = o.partnershipsMaintained;
      }
      break;

    case "ONLINE_GROWTH":
      if (report.onlineGrowth) {
        const g = report.onlineGrowth;
        data.videosPublished = g.videosPublished;
        data.liveSessions = g.liveSessions;
        data.postsPublished = g.postsPublished;
        data.leadsNew = g.leadsNew;
        data.leadsValid = g.leadsValid;
        data.appointmentsBooked = g.appointmentsBooked;
        data.visitsArrived = g.visitsArrived;
        data.adSpendInCents = g.adSpendInCents;
        data.followupsDone = g.followupsDone;
        data.unreachableCount = g.unreachableCount;
      }
      break;

    case "MEDICAL":
      if (report.medical) {
        const m = report.medical;
        data.patientsSeen = m.patientsSeen;
        data.rootCanals = m.rootCanals;
        data.fillings = m.fillings;
        data.extractions = m.extractions;
        data.fixedProsthesisDelivered = m.fixedProsthesisDelivered;
        data.removableProsthesisDeliv = m.removableProsthesisDeliv;
        data.implantSurgeries = m.implantSurgeries;
        data.orthoStarts = m.orthoStarts;
        data.orthoFollowups = m.orthoFollowups;
        data.riskEvents = m.riskEvents;
      }
      break;

    case "NURSING":
      if (report.nursing) {
        const n = report.nursing;
        data.workType = n.workType;
        data.panoramicXrays = n.panoramicXrays;
        data.cbctScans = n.cbctScans;
        data.intraoralScansPhotos = n.intraoralScansPhotos;
        data.sterilizerCycles = n.sterilizerCycles;
        data.instrumentPacks = n.instrumentPacks;
        data.consumableIncidents = n.consumableIncidents;
        data.doctorsAssisted = n.doctorsAssisted;
        data.overtimeMinutes = n.overtimeMinutes;
        data.hygieneVisits = n.hygieneVisits;
        data.perioTherapies = n.perioTherapies;
        data.referralsToDoctor = n.referralsToDoctor;
      }
      break;

    case "FINANCE_HR_ADMIN":
      if (report.financeHrAdmin) {
        const fa = report.financeHrAdmin;
        data.cashInCents = fa.cashInCents;
        data.refundsInCents = fa.refundsInCents;
        data.cashPayInCents = fa.cashPayInCents;
        data.cardPayInCents = fa.cardPayInCents;
        data.onlinePayInCents = fa.onlinePayInCents;
        data.expenseTotalInCents = fa.expenseTotalInCents;
        data.expenseMaterialInCents = fa.expenseMaterialInCents;
        data.expenseProcessingInCents = fa.expenseProcessingInCents;
        data.expenseMarketingInCents = fa.expenseMarketingInCents;
        data.expenseAdminInCents = fa.expenseAdminInCents;
        data.reconciliationIssues = fa.reconciliationIssues;
        data.staffScheduled = fa.staffScheduled;
        data.staffPresent = fa.staffPresent;
        data.staffAbsent = fa.staffAbsent;
        data.hiresCount = fa.hiresCount;
        data.resignationsCount = fa.resignationsCount;
        data.trainingSessions = fa.trainingSessions;
        data.traineesCount = fa.traineesCount;
      }
      break;
  }

  return data;
}

/**
 * 汇总单个部门的数据
 */
async function aggregateDepartment(
  storeId: string,
  departmentId: string,
  dateRange: string[]
): Promise<DepartmentAggregation | null> {
  // 获取部门信息
  const department = await prisma.department.findUnique({
    where: { id: departmentId },
  });
  if (!department) return null;

  // 获取该部门该门店的所有用户
  const users = await prisma.user.findMany({
    where: {
      storeId,
      departmentId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      roles: true,
      nursingRole: true,
      customFormConfig: true,
    },
  });

  // 构建用户ID到自定义配置的映射
  const userConfigMap = new Map<string, ReturnType<typeof parseCustomFormConfig>>();
  for (const u of users) {
    userConfigMap.set(u.id, parseCustomFormConfig(u.customFormConfig));
  }

  // 获取日报数据 - 只统计已提交状态
  const reports = await prisma.dailyReport.findMany({
    where: {
      storeId,
      departmentId,
      reportDate: { in: dateRange },
      // 只统计已提交的日报
      status: "SUBMITTED",
    },
    select: {
      userId: true,
      formData: true,
      schemaId: true,
      status: true, // 添加状态字段用于调试
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
  for (const r of reports) {
    const formDataObj = parseFormData(r.formData as string | null);
    const formDataFields = Object.keys(formDataObj).length;
    const fixedTables = [
      r.ConsultationReport ? '咨询' : '',
      r.FrontDeskReport ? '前台' : '',
      r.NursingReport ? '护理' : '',
      r.OfflineMarketingReport ? '市场' : '',
      r.OnlineGrowthReport ? '网络' : '',
      r.MedicalReport ? '医疗' : '',
      r.FinanceHrAdminReport ? '财务' : '',
    ].filter(Boolean).join('/');
    console.log(`  - 用户: ${r.User?.name}, 状态: ${r.status}, formData字段: ${formDataFields}个, 固定表: ${fixedTables || '无'}`);
  }

  // 构建字段汇总
  const fieldAggMap = new Map<string, FieldAggregation>();

  // 获取该部门的默认 schema 来确定字段标签
  const sampleUser = users[0];
  let defaultSchema: DailyReportSchema | null = null;
  if (sampleUser) {
    const roles = JSON.parse(sampleUser.roles || '["STAFF"]') as Role[];
    defaultSchema = getDepartmentSchema(
      department.code,
      roles,
      sampleUser.nursingRole || undefined
    );
  }
  const fieldLabelMap = buildFieldLabelMap(defaultSchema);

  // 收集所有用户的自定义字段 - 智能分类和标签识别
  // 使用 fieldId -> { label, type, userIds, category } 结构
  const allCustomFields = new Map<string, { 
    label: string; 
    type: string; 
    userIds: Set<string>;  // 记录哪些用户定义了这个字段
    category: string;      // 智能分类
  }>();
  
  for (const u of users) {
    const config = userConfigMap.get(u.id);
    if (config) {
      for (const cf of config.customFields) {
        const existing = allCustomFields.get(cf.id);
        if (existing) {
          existing.userIds.add(u.id);
        } else {
          // 智能分类：根据字段名称和类型推断类别
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
  
  console.log(`[Aggregate] 自定义字段: ${allCustomFields.size}个`);

  // 处理每份日报 - 使用智能规范化系统
  // 用于跟踪每个用户已处理的规范化字段，避免同一用户的同义字段重复计算
  const userProcessedFields = new Map<string, Set<string>>();
  
  for (const report of reports) {
    const formData = parseFormData(report.formData as string | null);
    const userName = report.User?.name || "未知";
    const userConfig = report.User?.customFormConfig 
      ? parseCustomFormConfig(report.User.customFormConfig) 
      : null;

    // 初始化该用户的已处理字段集合
    if (!userProcessedFields.has(report.userId)) {
      userProcessedFields.set(report.userId, new Set());
    }
    const processedFields = userProcessedFields.get(report.userId)!;

    // 合并 formData 和固定表数据
    let dataToProcess: Record<string, unknown> = { ...formData };
    
    // 从固定表补充数据（如果 formData 中没有）
    const fixedTableData = extractFixedTableData(report, department.code);
    for (const [key, value] of Object.entries(fixedTableData)) {
      if (dataToProcess[key] === undefined || dataToProcess[key] === null || dataToProcess[key] === "") {
        dataToProcess[key] = value;
      }
    }

    // 遍历所有字段数据
    for (const [fieldId, value] of Object.entries(dataToProcess)) {
      if (value === null || value === undefined || value === "") continue;
      
      const numValue = getNumericValue(value);
      if (numValue === 0) continue;

      // 尝试规范化字段
      const normalized = normalizeField(fieldId, value);
      
      // 确定使用的字段ID和标签
      let useFieldId: string;
      let useLabel: string;
      let useType: string;
      let useValue: number;
      
      if (normalized) {
        // 检查该用户的这个规范化字段是否已经处理过
        // 如果已处理，跳过以避免重复计算（例如 formData 有 dealCount，固定表也有 dealsTotal）
        if (processedFields.has(normalized.normalizedId)) {
          continue;
        }
        processedFields.add(normalized.normalizedId);
        
        useFieldId = normalized.normalizedId;
        useLabel = normalized.label;
        useType = normalized.type;
        useValue = normalized.normalizedValue;
      } else {
        // 没有规范化映射的字段（自定义字段等）
        // 自定义字段不应该被规范化，保持原样
        if (isCustomField(fieldId)) {
          // 检查该用户的这个自定义字段是否已处理
          if (processedFields.has(fieldId)) {
            continue;
          }
          processedFields.add(fieldId);
        }
        
        useFieldId = fieldId;
        useValue = numValue;
        
        // 确定标签和类型
        const customFieldInfo = allCustomFields.get(fieldId);
        if (customFieldInfo) {
          useLabel = customFieldInfo.label;
          useType = customFieldInfo.type;
        } else if (userConfig?.fieldLabels.has(fieldId)) {
          useLabel = userConfig.fieldLabels.get(fieldId) || fieldId;
          const schemaInfo = fieldLabelMap.get(fieldId);
          useType = schemaInfo?.type || "number";
        } else {
          const schemaInfo = fieldLabelMap.get(fieldId);
          if (schemaInfo) {
            useLabel = schemaInfo.label;
            useType = schemaInfo.type;
          } else {
            useLabel = fieldId;
            useType = "number";
          }
        }
      }

      // 获取或创建字段汇总
      let agg = fieldAggMap.get(useFieldId);
      const isCustom = isCustomField(useFieldId);
      const customInfo = allCustomFields.get(useFieldId);
      
      if (!agg) {
        agg = {
          fieldId: useFieldId,
          fieldLabel: useLabel,
          fieldType: useType,
          total: 0,
          count: 0,
          average: 0,
          values: [],
          // 新增智能分类信息
          isCustomField: isCustom,
          category: isCustom && customInfo ? customInfo.category : inferFieldCategory(useLabel, useType),
          sourceType: normalized ? "formData" : (Object.keys(fixedTableData).includes(fieldId) ? "fixedTable" : "formData"),
        };
        fieldAggMap.set(useFieldId, agg);
      }

      // 记录值
      agg.values.push({
        userId: report.userId,
        userName,
        value: useValue,
      });
      agg.count++;

      // 数值类型求和
      if (isNumericField(agg.fieldType)) {
        agg.total += useValue;
        agg.average = agg.total / agg.count;
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
  // 获取门店信息
  const store = await prisma.store.findUnique({
    where: { id: storeId },
  });

  // 生成日期范围
  const dateRange: string[] = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  while (current <= end) {
    dateRange.push(current.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  // 获取该门店所有部门
  const departments = await prisma.department.findMany({
    where: {
      users: {
        some: { storeId, isActive: true },
      },
    },
  });
  
  console.log(`[Aggregate] 门店 ${storeId} 找到 ${departments.length} 个有效部门:`, departments.map(d => d.name));

  // 汇总每个部门
  const departmentAggregations: DepartmentAggregation[] = [];
  for (const dept of departments) {
    const agg = await aggregateDepartment(storeId, dept.id, dateRange);
    if (agg) {
      departmentAggregations.push(agg);
    }
  }

  // 计算门店总计（合并所有部门的相同字段）
  // 使用智能合并策略：相同规范化字段合并，自定义字段保持独立
  const totalsMap = new Map<string, FieldAggregation>();
  for (const deptAgg of departmentAggregations) {
    for (const field of deptAgg.fields) {
      let total = totalsMap.get(field.fieldId);
      if (!total) {
        total = {
          fieldId: field.fieldId,
          fieldLabel: field.fieldLabel,
          fieldType: field.fieldType,
          total: 0,
          count: 0,
          average: 0,
          values: [],
          isCustomField: field.isCustomField,
          category: field.category,
          sourceType: field.sourceType,
        };
        totalsMap.set(field.fieldId, total);
      }
      total.total += field.total;
      total.count += field.count;
      total.values.push(...field.values);
      // 更新数据来源类型
      if (total.sourceType !== field.sourceType) {
        total.sourceType = "mixed";
      }
      if (total.count > 0) {
        total.average = total.total / total.count;
      }
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
 * 获取字段汇总报表（按字段 ID 聚合）
 */
export async function getFieldSummary(
  storeId: string,
  dateRange: string[],
  fieldIds: string[]
): Promise<Record<string, FieldAggregation>> {
  const reports = await prisma.dailyReport.findMany({
    where: {
      storeId,
      reportDate: { in: dateRange },
      status: "SUBMITTED",
    },
    select: {
      userId: true,
      formData: true,
      User: { select: { name: true } },
    },
  });

  const result: Record<string, FieldAggregation> = {};

  for (const fieldId of fieldIds) {
    result[fieldId] = {
      fieldId,
      fieldLabel: fieldId,
      fieldType: "number",
      total: 0,
      count: 0,
      average: 0,
      values: [],
    };
  }

  for (const report of reports) {
    const formData = parseFormData(report.formData);
    const userName = report.User?.name || "未知";

    for (const fieldId of fieldIds) {
      const value = formData[fieldId];
      if (value !== null && value !== undefined && value !== "") {
        const agg = result[fieldId];
        agg.values.push({ userId: report.userId, userName, value });
        agg.count++;
        agg.total += getNumericValue(value);
        agg.average = agg.total / agg.count;
      }
    }
  }

  return result;
}

/**
 * 获取关键指标汇总（兼容旧数据和新 formData）
 */
export async function getKeyMetrics(
  storeId: string,
  dateRange: string[]
): Promise<Record<string, number>> {
  // 先尝试从固定表获取数据
  const [consultReports, frontDeskReports, financeReports] = await Promise.all([
    prisma.consultationReport.findMany({
      where: {
        DailyReport: {
          storeId,
          reportDate: { in: dateRange },
          status: "SUBMITTED",
        },
      },
    }),
    prisma.frontDeskReport.findMany({
      where: {
        DailyReport: {
          storeId,
          reportDate: { in: dateRange },
          status: "SUBMITTED",
        },
      },
    }),
    prisma.financeHrAdminReport.findMany({
      where: {
        DailyReport: {
          storeId,
          reportDate: { in: dateRange },
          status: "SUBMITTED",
        },
      },
    }),
  ]);

  // 从固定表计算
  let totalCash = consultReports.reduce((sum, r) => sum + r.cashInCents, 0);
  let totalDeals = consultReports.reduce((sum, r) => sum + r.dealsTotal, 0);
  let totalInitial = consultReports.reduce((sum, r) => sum + r.initialTotal, 0);
  let totalVisits = frontDeskReports.reduce((sum, r) => sum + r.newVisits + r.returningVisits, 0);

  // 再从 formData 获取补充数据
  const allReports = await prisma.dailyReport.findMany({
    where: {
      storeId,
      reportDate: { in: dateRange },
      status: "SUBMITTED",
      formData: { not: null },
    },
    select: {
      formData: true,
      departmentId: true,
    },
  });

  // 关键字段映射
  const keyFieldMappings: Record<string, string[]> = {
    cash: ["cashInCents", "revenueTotal", "成交总金额", "实收金额"],
    deals: ["dealsTotal", "成交总数", "成交人数"],
    initial: ["initialTotal", "初诊总数", "初诊人数"],
    visits: ["totalVisits", "到店总数", "到店人数", "newVisits"],
  };

  // 从 formData 中提取数据
  for (const report of allReports) {
    const formData = parseFormData(report.formData);
    
    for (const [key, value] of Object.entries(formData)) {
      // 检查是否为关键指标字段
      for (const [metricKey, fieldNames] of Object.entries(keyFieldMappings)) {
        if (fieldNames.some(name => key.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(key.toLowerCase()))) {
          const numValue = getNumericValue(value);
          if (numValue > 0) {
            switch (metricKey) {
              case "cash":
                // 避免重复计算（如果固定表已有数据）
                if (consultReports.length === 0) totalCash += numValue;
                break;
              case "deals":
                if (consultReports.length === 0) totalDeals += numValue;
                break;
              case "initial":
                if (consultReports.length === 0) totalInitial += numValue;
                break;
              case "visits":
                if (frontDeskReports.length === 0) totalVisits += numValue;
                break;
            }
          }
        }
      }
    }
  }

  return {
    totalCash,
    totalDeals,
    totalInitial,
    totalVisits,
    avgDealAmount: totalDeals > 0 ? Math.round(totalCash / totalDeals) : 0,
    conversionRate: totalInitial > 0 ? Math.round((totalDeals / totalInitial) * 100) : 0,
  };
}

