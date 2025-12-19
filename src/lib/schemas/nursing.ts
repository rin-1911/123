// 护理部日报 Schema
import { DailyReportSchema } from "./types";

// ==================== 配台护士 ====================
export const nursingAssistantSchema: DailyReportSchema = {
  id: "nursing_assistant",
  title: "配台护士日报",
  description: "配台护士每日必填",
  sections: [
    {
      id: "assistWork",
      title: "一、配台工作",
      fields: [
        { id: "assistTotal", label: "今日配台总次数", type: "number", required: true },
        { id: "implantAssist", label: "种植配台次数", type: "number" },
        { id: "orthoAssist", label: "正畸配台次数", type: "number" },
        { id: "restoreAssist", label: "修复配台次数", type: "number" },
        { id: "pediatricAssist", label: "儿牙配台次数", type: "number" },
        { id: "rootCanalAssist", label: "根管配台次数", type: "number" },
        { id: "surgeryAssist", label: "外科手术配台次数", type: "number" },
        { id: "otherAssist", label: "其他配台次数", type: "number" },
      ],
    },
    {
      id: "sterilization",
      title: "二、消毒灭菌",
      fields: [
        { id: "sterilizerCycles", label: "灭菌锅运行次数", type: "number", required: true },
        { id: "instrumentPacks", label: "器械包处理数量", type: "number", required: true },
        { id: "sterilizationIssue", label: "灭菌异常情况", type: "textarea", hint: "如有异常请详细记录" },
      ],
    },
    {
      id: "materials",
      title: "三、器械与耗材",
      fields: [
        { id: "materialShortage", label: "物料短缺情况", type: "textarea", hint: "缺什么、影响哪些诊疗" },
        { id: "equipmentIssue", label: "设备异常情况", type: "textarea", hint: "设备名称、故障描述" },
        { id: "consumableIncidents", label: "耗材异常事件", type: "number", hint: "过期/污染/损坏等" },
      ],
    },
    {
      id: "workload",
      title: "四、工作量与加班",
      fields: [
        { id: "doctorsAssisted", label: "配合医生人数", type: "number", required: true },
        { id: "overtimeMinutes", label: "加班时长（分钟）", type: "number" },
        { id: "overtimeReason", label: "加班原因", type: "textarea" },
      ],
    },
  ],
};

// ==================== 配台护士组长 ====================
export const nursingAssistantLeadSchema: DailyReportSchema = {
  id: "nursing_assistant_lead",
  title: "配台护士组长日报",
  description: "配台护士组长每日必填",
  sections: [
    {
      id: "teamOverview",
      title: "一、团队工作汇总",
      fields: [
        { id: "teamMemberCount", label: "今日出勤人数", type: "number", required: true },
        { id: "absentCount", label: "缺勤人数", type: "number" },
        { id: "absentReason", label: "缺勤原因", type: "textarea" },
        { id: "totalAssistCount", label: "团队配台总次数", type: "number", required: true },
        { id: "avgAssistPerPerson", label: "人均配台次数", type: "number" },
      ],
    },
    {
      id: "assistDetail",
      title: "二、配台明细统计",
      fields: [
        { id: "implantTotal", label: "种植配台总次数", type: "number" },
        { id: "orthoTotal", label: "正畸配台总次数", type: "number" },
        { id: "restoreTotal", label: "修复配台总次数", type: "number" },
        { id: "pediatricTotal", label: "儿牙配台总次数", type: "number" },
        { id: "rootCanalTotal", label: "根管配台总次数", type: "number" },
        { id: "surgeryTotal", label: "外科手术配台总次数", type: "number" },
      ],
    },
    {
      id: "sterilization",
      title: "三、消毒灭菌汇总",
      fields: [
        { id: "sterilizerCyclesTotal", label: "灭菌锅运行总次数", type: "number", required: true },
        { id: "instrumentPacksTotal", label: "器械包处理总数量", type: "number", required: true },
        { id: "qualityCheckResult", label: "质量抽检结果", type: "textarea", hint: "是否合格、问题点" },
      ],
    },
    {
      id: "issues",
      title: "四、问题与改进",
      fields: [
        { id: "materialShortageList", label: "物料短缺汇总", type: "textarea", required: true },
        { id: "equipmentIssueList", label: "设备异常汇总", type: "textarea" },
        { id: "trainingNeed", label: "培训需求", type: "textarea", hint: "需要加强的技能/知识" },
        { id: "improvementAction", label: "明日改进动作", type: "textarea" },
      ],
    },
    {
      id: "workload",
      title: "五、工作负荷",
      fields: [
        { id: "overtimeTotal", label: "团队加班总时长（分钟）", type: "number" },
        { id: "workloadBalance", label: "工作量是否均衡", type: "select", options: [
          { value: "balanced", label: "均衡" },
          { value: "unbalanced", label: "不均衡" },
        ]},
        { id: "tomorrowArrangement", label: "明日人员安排", type: "textarea" },
      ],
    },
  ],
};

// ==================== 洁牙师 ====================
export const hygienistSchema: DailyReportSchema = {
  id: "hygienist",
  title: "洁牙师日报",
  description: "洁牙师每日必填",
  sections: [
    {
      id: "cleaningWork",
      title: "一、洁牙工作",
      fields: [
        { id: "cleaningTotal", label: "今日洁牙人数", type: "number", required: true },
        { id: "deepCleaningCount", label: "深度洁牙人数", type: "number" },
        { id: "perioTherapyCount", label: "牙周治疗人数", type: "number" },
        { id: "polishingCount", label: "抛光人数", type: "number" },
        { id: "fluorideCount", label: "涂氟人数", type: "number" },
      ],
    },
    {
      id: "revenue",
      title: "二、业绩统计",
      fields: [
        { id: "revenueTotal", label: "今日业绩金额", type: "money", required: true },
        { id: "avgRevenuePerPatient", label: "人均消费", type: "money" },
      ],
    },
    {
      id: "referral",
      title: "三、转诊情况",
      fields: [
        { id: "referralToDoctor", label: "转诊给医生人数", type: "number", required: true, hint: "发现需要进一步治疗的患者" },
        { id: "referralReason", label: "转诊原因说明", type: "textarea", hint: "牙周病/龋齿/正畸需求等" },
        { id: "followupAppointment", label: "预约复诊人数", type: "number" },
      ],
    },
    {
      id: "patientFeedback",
      title: "四、患者反馈",
      fields: [
        { id: "satisfiedCount", label: "满意患者数", type: "number" },
        { id: "complaintCount", label: "不满/投诉数", type: "number" },
        { id: "complaintDetail", label: "投诉详情", type: "textarea" },
      ],
    },
  ],
};

// ==================== 洁牙师组长 ====================
export const hygienistLeadSchema: DailyReportSchema = {
  id: "hygienist_lead",
  title: "洁牙师组长日报",
  description: "洁牙师组长每日必填",
  sections: [
    {
      id: "teamOverview",
      title: "一、团队工作汇总",
      fields: [
        { id: "teamMemberCount", label: "今日出勤人数", type: "number", required: true },
        { id: "absentCount", label: "缺勤人数", type: "number" },
        { id: "totalCleaningCount", label: "团队洁牙总人数", type: "number", required: true },
        { id: "avgCleaningPerPerson", label: "人均洁牙人数", type: "number" },
      ],
    },
    {
      id: "cleaningDetail",
      title: "二、洁牙明细统计",
      fields: [
        { id: "deepCleaningTotal", label: "深度洁牙总人数", type: "number" },
        { id: "perioTherapyTotal", label: "牙周治疗总人数", type: "number" },
        { id: "polishingTotal", label: "抛光总人数", type: "number" },
        { id: "fluorideTotal", label: "涂氟总人数", type: "number" },
      ],
    },
    {
      id: "revenue",
      title: "三、业绩汇总",
      fields: [
        { id: "teamRevenueTotal", label: "团队今日业绩", type: "money", required: true },
        { id: "avgRevenuePerHygienist", label: "人均业绩", type: "money" },
        { id: "revenueTarget", label: "目标完成率", type: "number", suffix: "%" },
      ],
    },
    {
      id: "referral",
      title: "四、转诊汇总",
      fields: [
        { id: "totalReferral", label: "团队转诊总人数", type: "number", required: true },
        { id: "referralConversion", label: "转诊成交人数", type: "number", hint: "转诊后实际成交的" },
        { id: "referralAnalysis", label: "转诊分析", type: "textarea", hint: "主要转诊项目、成功率等" },
      ],
    },
    {
      id: "issues",
      title: "五、问题与改进",
      fields: [
        { id: "qualityIssue", label: "质量问题记录", type: "textarea" },
        { id: "patientComplaint", label: "患者投诉汇总", type: "textarea" },
        { id: "trainingNeed", label: "培训需求", type: "textarea" },
        { id: "improvementAction", label: "明日改进动作", type: "textarea" },
      ],
    },
  ],
};

// ==================== 护士长 ====================
export const headNurseSchema: DailyReportSchema = {
  id: "head_nurse",
  title: "护士长日报",
  description: "护士长每日必填 - 护理部全面管理",
  sections: [
    {
      id: "teamStatus",
      title: "一、团队人员状态",
      fields: [
        { id: "totalNurseCount", label: "护理部总人数", type: "number", required: true },
        { id: "onDutyCount", label: "今日出勤人数", type: "number", required: true },
        { id: "assistantNurseCount", label: "配台护士出勤", type: "number" },
        { id: "hygienistCount", label: "洁牙师出勤", type: "number" },
        { id: "absentDetail", label: "缺勤情况说明", type: "textarea" },
        { id: "tomorrowSchedule", label: "明日排班情况", type: "textarea", hint: "是否满足诊疗需求" },
      ],
    },
    {
      id: "workSummary",
      title: "二、工作量汇总",
      fields: [
        { id: "totalAssistCount", label: "配台总次数", type: "number", required: true },
        { id: "totalCleaningCount", label: "洁牙总人数", type: "number", required: true },
        { id: "totalPerioTherapy", label: "牙周治疗总人数", type: "number" },
        { id: "sterilizerCyclesTotal", label: "灭菌锅运行总次数", type: "number" },
        { id: "workloadAssessment", label: "工作负荷评估", type: "select", required: true, options: [
          { value: "light", label: "轻松" },
          { value: "normal", label: "正常" },
          { value: "busy", label: "繁忙" },
          { value: "overload", label: "超负荷" },
        ]},
      ],
    },
    {
      id: "revenue",
      title: "三、护理部业绩",
      fields: [
        { id: "nursingRevenue", label: "护理部今日业绩", type: "money", required: true },
        { id: "monthlyRevenue", label: "本月累计业绩", type: "money" },
        { id: "targetProgress", label: "月度目标完成率", type: "number", suffix: "%" },
      ],
    },
    {
      id: "quality",
      title: "四、质量管控",
      fields: [
        { id: "qualityCheckCount", label: "质量抽检次数", type: "number" },
        { id: "qualityIssueCount", label: "质量问题发现数", type: "number" },
        { id: "qualityIssueDetail", label: "质量问题详情", type: "textarea" },
        { id: "infectionControl", label: "感控检查情况", type: "textarea", hint: "消毒灭菌、无菌操作等" },
      ],
    },
    {
      id: "issues",
      title: "五、问题与风险",
      fields: [
        { id: "materialShortage", label: "物料短缺汇总", type: "textarea" },
        { id: "equipmentIssue", label: "设备异常汇总", type: "textarea" },
        { id: "patientComplaint", label: "患者投诉汇总", type: "textarea" },
        { id: "safetyIncident", label: "安全事件", type: "textarea", hint: "针刺伤、职业暴露等" },
      ],
    },
    {
      id: "training",
      title: "六、培训与发展",
      fields: [
        { id: "trainingDone", label: "今日培训完成", type: "textarea" },
        { id: "newStaffProgress", label: "新人带教进度", type: "textarea" },
        { id: "certificationProgress", label: "资质认证进度", type: "textarea" },
      ],
    },
    {
      id: "tomorrow",
      title: "七、明日计划",
      fields: [
        { id: "tomorrowPriority", label: "明日重点工作", type: "textarea", required: true },
        { id: "resourceNeed", label: "资源需求", type: "textarea" },
        { id: "coordinationNeed", label: "需要协调事项", type: "textarea" },
      ],
    },
  ],
};

export const nursingSchemas = {
  // 配台护士
  assistant: nursingAssistantSchema,
  // 配台护士组长
  assistantLead: nursingAssistantLeadSchema,
  // 洁牙师
  hygienist: hygienistSchema,
  // 洁牙师组长
  hygienistLead: hygienistLeadSchema,
  // 护士长
  headNurse: headNurseSchema,
};





