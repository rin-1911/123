// 字段口径说明字典
// 每个字段都有统一的定义，避免各部门理解不一致

export const FIELD_HINTS: Record<string, { label: string; hint: string; unit?: string }> = {
  // 咨询部
  receptionTotal: {
    label: "总接诊人数",
    hint: "当日所有接诊的患者数量，包括初诊和复诊",
  },
  initialTotal: {
    label: "初诊人数",
    hint: "首次到店就诊的患者数量（第一次来本店）",
  },
  dealsTotal: {
    label: "成交人数",
    hint: "当日完成付费的患者数量（含初诊和复诊）",
  },
  initialDealsTotal: {
    label: "初诊成交人数",
    hint: "初诊患者中当日完成付费的人数",
  },
  cashInCents: {
    label: "当日实收",
    hint: "实际收到的现金/转账金额，不含欠款和预存",
    unit: "元",
  },
  implantLeads: {
    label: "种植意向数",
    hint: "明确表达种植牙意向的患者数量",
  },
  orthoLeads: {
    label: "正畸意向数",
    hint: "明确表达正畸意向的患者数量",
  },
  followupAppointments: {
    label: "复诊预约人数",
    hint: "预约未来7天内复诊的患者数量",
  },
  followupCallsDone: {
    label: "回访完成数",
    hint: "当日完成电话回访的患者数量",
  },

  // 前台
  newVisits: {
    label: "新客到店",
    hint: "首次到店的患者数量（以系统无历史记录为准）",
  },
  returningVisits: {
    label: "老客到店",
    hint: "非首次到店的患者数量（复诊）",
  },
  newAppointments: {
    label: "新增预约",
    hint: "当日新登记的预约数量（含电话、网络、到店预约）",
  },
  rescheduledAppointments: {
    label: "改期预约",
    hint: "当日改期的预约数量",
  },
  canceledAppointments: {
    label: "取消预约",
    hint: "当日取消的预约数量",
  },
  noShowAppointments: {
    label: "爽约数",
    hint: "预约但未到店、未提前取消的患者数量",
  },
  initialTriage: {
    label: "初诊分诊数",
    hint: "分诊给医生的初诊患者数量",
  },
  revisitTriage: {
    label: "复诊分诊数",
    hint: "分诊给医生的复诊患者数量",
  },
  paymentsCount: {
    label: "收款笔数",
    hint: "当日收款的笔数（一个患者可能有多笔）",
  },
  refundsCount: {
    label: "退款笔数",
    hint: "当日退款的笔数",
  },
  complaintsCount: {
    label: "投诉/差评件数",
    hint: "当日收到的投诉和差评数量（含电话、现场、网络）",
  },
  resolvedCount: {
    label: "当日处理件数",
    hint: "当日处理完成的投诉件数",
  },

  // 线下市场
  touchpoints: {
    label: "触达量",
    hint: "地推/活动触达的人数（发传单、扫码等）",
  },
  leadsNew: {
    label: "新增线索数",
    hint: "获取的新线索数量（留下联系方式）",
  },
  leadsValid: {
    label: "有效线索数",
    hint: "经电话确认有就诊意向的线索数量",
  },
  appointmentsBooked: {
    label: "预约数",
    hint: "线索转化为预约的数量",
  },
  visitsArrived: {
    label: "到店数",
    hint: "预约后实际到店的数量",
  },
  costInCents: {
    label: "当日费用",
    hint: "当日市场活动的费用支出（物料、人工等）",
    unit: "元",
  },
  partnershipsNew: {
    label: "新增合作点数",
    hint: "新开发的合作点数量（企业、社区等）",
  },
  partnershipsMaintained: {
    label: "维护合作点数",
    hint: "维护的现有合作点数量",
  },

  // 网络新媒体
  videosPublished: {
    label: "视频数",
    hint: "当日发布的短视频数量（抖音、小红书等）",
  },
  liveSessions: {
    label: "直播场次",
    hint: "当日直播的场次",
  },
  postsPublished: {
    label: "图文/帖子数",
    hint: "当日发布的图文内容数量",
  },
  adSpendInCents: {
    label: "投放费用",
    hint: "广告投放费用（信息流、搜索等）",
    unit: "元",
  },
  followupsDone: {
    label: "跟进数",
    hint: "当日完成的线索跟进数量",
  },
  unreachableCount: {
    label: "未接通数",
    hint: "电话未接通的线索数量",
  },

  // 医疗部
  patientsSeen: {
    label: "当日接诊人数",
    hint: "当日诊治的患者总数",
  },
  rootCanals: {
    label: "根管数",
    hint: "完成的根管治疗数量（按牙位计）",
  },
  fillings: {
    label: "补牙数",
    hint: "完成的补牙数量（按牙位计）",
  },
  extractions: {
    label: "拔牙数",
    hint: "完成的拔牙数量（按牙位计）",
  },
  fixedProsthesisDelivered: {
    label: "固定修复交付数",
    hint: "交付的固定修复体数量（冠、桥等）",
  },
  removableProsthesisDeliv: {
    label: "活动修复交付数",
    hint: "交付的活动修复体数量（活动假牙）",
  },
  implantSurgeries: {
    label: "种植手术数",
    hint: "完成的种植手术数量（按颗计）",
  },
  orthoStarts: {
    label: "正畸初戴/启动数",
    hint: "正畸开始治疗的患者数量",
  },
  orthoFollowups: {
    label: "正畸复诊数",
    hint: "正畸复诊的患者数量",
  },
  riskEvents: {
    label: "返工/并发/投诉触发数",
    hint: "需要返工或产生并发症、引起投诉的病例数",
  },

  // 护理部
  workType: {
    label: "岗位类型",
    hint: "选择您当日主要工作岗位",
  },
  panoramicXrays: {
    label: "全景片数",
    hint: "拍摄的全景X光片数量",
  },
  cbctScans: {
    label: "CBCT数",
    hint: "拍摄的CBCT数量",
  },
  intraoralScansPhotos: {
    label: "口扫/口内照次数",
    hint: "口腔扫描和口内拍照的次数",
  },
  sterilizerCycles: {
    label: "消毒锅次",
    hint: "消毒锅运行的次数",
  },
  instrumentPacks: {
    label: "器械包数量",
    hint: "准备的器械包数量",
  },
  consumableIncidents: {
    label: "耗材异常次数",
    hint: "耗材问题发生的次数（缺货、过期、损坏等）",
  },
  doctorsAssisted: {
    label: "配台医生数",
    hint: "配合的医生数量",
  },
  overtimeMinutes: {
    label: "加班分钟",
    hint: "加班的时间（分钟）",
  },
  hygieneVisits: {
    label: "洁牙人次",
    hint: "完成的洁牙服务人次",
  },
  perioTherapies: {
    label: "牙周基础治疗人次",
    hint: "完成的牙周基础治疗人次",
  },
  referralsToDoctor: {
    label: "转诊医生/咨询人数",
    hint: "发现问题后转诊给医生或咨询的人数",
  },

  // 财务人资行政
  refundsInCents: {
    label: "当日退款",
    hint: "财务确认的退款金额",
    unit: "元",
  },
  cashPayInCents: {
    label: "现金",
    hint: "现金收款金额",
    unit: "元",
  },
  cardPayInCents: {
    label: "刷卡",
    hint: "刷卡收款金额（含信用卡、储蓄卡）",
    unit: "元",
  },
  onlinePayInCents: {
    label: "线上",
    hint: "线上支付金额（微信、支付宝等）",
    unit: "元",
  },
  expenseTotalInCents: {
    label: "当日费用总额",
    hint: "各项支出总额",
    unit: "元",
  },
  expenseMaterialInCents: {
    label: "材料设备",
    hint: "材料和设备采购支出",
    unit: "元",
  },
  expenseProcessingInCents: {
    label: "加工外协",
    hint: "外协加工费用（技工所等）",
    unit: "元",
  },
  expenseMarketingInCents: {
    label: "市场投放",
    hint: "市场推广费用",
    unit: "元",
  },
  expenseAdminInCents: {
    label: "行政日常",
    hint: "行政日常支出（水电、办公等）",
    unit: "元",
  },
  reconciliationIssues: {
    label: "对账异常笔数",
    hint: "对账发现异常的笔数",
  },
  staffScheduled: {
    label: "应到人数",
    hint: "当日应到岗人数（按排班）",
  },
  staffPresent: {
    label: "实到人数",
    hint: "当日实际到岗人数",
  },
  staffAbsent: {
    label: "缺勤人数",
    hint: "当日缺勤人数（请假、旷工等）",
  },
  hiresCount: {
    label: "入职人数",
    hint: "当日入职的员工数量",
  },
  resignationsCount: {
    label: "离职人数",
    hint: "当日离职的员工数量",
  },
  trainingSessions: {
    label: "培训场次",
    hint: "当日举办的培训场次",
  },
  traineesCount: {
    label: "参训人数",
    hint: "参加培训的员工人数",
  },

  // 通用
  note: {
    label: "备注",
    hint: "补充说明（选填，最多300字）",
  },
};

// 获取字段提示
export function getFieldHint(fieldName: string) {
  return FIELD_HINTS[fieldName] ?? { label: fieldName, hint: "" };
}









