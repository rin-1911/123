// 网络新媒体日报 Schema
import { DailyReportSchema } from "./types";

// 网络客服日报
export const onlineStaffSchema: DailyReportSchema = {
  id: "online_staff",
  title: "网络客服日报",
  description: "网络客服每日必填 - 线索处理SOP",
  sections: [
    {
      id: "leadProcessing",
      title: "一、线索来源与处理",
      fields: [
        { id: "newLeadsTotal", label: "新线索数", type: "number", required: true },
        { id: "leadsDouyin", label: "抖音线索", type: "number" },
        { id: "leadsXiaohongshu", label: "小红书线索", type: "number" },
        { id: "leadsBaidu", label: "百度线索", type: "number" },
        { id: "leadsWechat", label: "企微线索", type: "number" },
        { id: "leadsOther", label: "其他平台线索", type: "number" },
        { id: "firstResponseCount", label: "首响及时数", type: "number", required: true, hint: "X分钟内响应" },
        { id: "firstResponseRate", label: "首响及时率", type: "calculated", formula: "firstResponseCount / newLeadsTotal * 100", suffix: "%" },
        { id: "validLeads", label: "有效线索数", type: "number", required: true },
        { id: "invalidLeads", label: "无效线索数", type: "number", required: true },
        { id: "invalidReason", label: "无效原因", type: "textarea" },
        { id: "followingLeads", label: "跟进中线索数", type: "number", required: true, hint: "未约到诊但可持续" },
        { id: "lostLeads", label: "丢单数", type: "number", required: true, hint: "明确不来/拉黑/去竞对" },
      ],
    },
    {
      id: "appointmentVisit",
      title: "二、预约与到诊",
      fields: [
        { id: "appointmentsBooked", label: "预约数", type: "number", required: true, hint: "已约时间" },
        { id: "appointmentsConfirmed", label: "已确认预约数", type: "number", required: true },
        { id: "visitsArrived", label: "当日到诊数", type: "number", required: true, hint: "网络归因" },
        { id: "noShowCount", label: "爽约数", type: "number", required: true, hint: "网络预约未到" },
      ],
    },
    {
      id: "scriptContent",
      title: "三、话术与内容",
      fields: [
        { id: "scriptVersion", label: "今日使用主话术版本", type: "text", hint: "编号" },
        { id: "topQuestions", label: "高频问题Top5", type: "textarea", required: true, hint: "用于内容迭代" },
        { id: "competitorInfo", label: "竞对咨询对比信息", type: "textarea", hint: "价格/活动/承诺" },
      ],
    },
  ],
};

// 网络主管日报
export const onlineLeadSchema: DailyReportSchema = {
  id: "online_lead",
  title: "网络主管日报",
  description: "网络主管每日必填",
  sections: [
    {
      id: "kpiSummary",
      title: "一、客服KPI汇总",
      fields: [
        { id: "teamFirstResponseRate", label: "首响及时率", type: "number", required: true, suffix: "%" },
        { id: "teamValidLeads", label: "有效线索数", type: "number", required: true },
        { id: "teamAppointments", label: "预约数", type: "number", required: true },
        { id: "teamVisits", label: "到诊数", type: "number", required: true },
        { id: "teamNoShow", label: "爽约数", type: "number", required: true },
      ],
    },
    {
      id: "funnelAnalysis",
      title: "二、线索漏斗断点分析",
      fields: [
        { id: "bottleneck", label: "卡在哪个环节", type: "select", required: true, options: [
          { value: "valid_check", label: "有效判定" },
          { value: "appointment", label: "预约" },
          { value: "confirm", label: "确认" },
          { value: "visit", label: "到诊" },
        ]},
        { id: "bottleneckDetail", label: "断点详情", type: "textarea", required: true },
      ],
    },
    {
      id: "improvement",
      title: "三、明日改进动作",
      fields: [
        { id: "scriptAdjustment", label: "话术调整", type: "textarea" },
        { id: "followupRhythm", label: "跟进节奏调整", type: "textarea" },
        { id: "followupList", label: "复访清单", type: "textarea" },
      ],
    },
    {
      id: "urgent",
      title: "四、紧急问题",
      fields: [
        { id: "urgentIssues", label: "平台差评/投诉/违规风险", type: "textarea", hint: "如广告用语" },
      ],
    },
  ],
};

// 网络总监日报
export const onlineDirectorSchema: DailyReportSchema = {
  id: "online_director",
  title: "网络总监日报",
  description: "网络总监每日必填",
  sections: [
    {
      id: "platformOverview",
      title: "一、平台维度总览",
      fields: [
        { id: "totalLeads", label: "总线索", type: "number", required: true },
        { id: "totalValid", label: "总有效", type: "number", required: true },
        { id: "totalVisits", label: "总到诊", type: "number", required: true },
        { id: "totalDeals", label: "总成交", type: "number", required: true },
        { id: "totalCost", label: "总成本", type: "money", hint: "若有投放" },
      ],
    },
    {
      id: "adStructure",
      title: "二、投放结构建议",
      fields: [
        { id: "budgetIncrease", label: "加预算渠道", type: "textarea", required: true },
        { id: "budgetDecrease", label: "减预算渠道", type: "textarea", required: true },
        { id: "adjustReason", label: "调整原因", type: "textarea", required: true },
      ],
    },
    {
      id: "contentNeeds",
      title: "三、素材/内容需求",
      fields: [
        { id: "contentPlan", label: "明日产出计划", type: "textarea", required: true, hint: "标题方向、案例方向" },
      ],
    },
    {
      id: "reputation",
      title: "四、品牌舆情",
      fields: [
        { id: "negativeReviewProgress", label: "差评处理进度", type: "textarea" },
        { id: "reputationOwner", label: "责任人", type: "text" },
      ],
    },
  ],
};

export const onlineGrowthSchemas = {
  staff: onlineStaffSchema,
  lead: onlineLeadSchema,
  director: onlineDirectorSchema,
};







