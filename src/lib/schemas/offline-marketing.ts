// 线下市场日报 Schema
import { DailyReportSchema } from "./types";

// 市场专员日报
export const marketingStaffSchema: DailyReportSchema = {
  id: "marketing_staff",
  title: "市场专员日报",
  description: "市场专员每日必填 - 动作量=结果",
  sections: [
    {
      id: "actionVolume",
      title: "一、动作量",
      fields: [
        { id: "fieldHours", label: "地推/驻点时长（小时）", type: "number", required: true },
        { id: "touchpoints", label: "触达人数", type: "number", required: true, hint: "发单/讲解/扫码互动人数" },
        { id: "validInfoCollected", label: "采集有效信息数", type: "number", required: true, hint: "姓名电话+需求" },
        { id: "wechatAdded", label: "加企微数", type: "number", required: true, hint: "新增私域" },
        { id: "couponsDistributed", label: "派券/活动卡发放数", type: "number" },
        { id: "partnerVisits", label: "异业拜访家数", type: "number" },
        { id: "partnerVisitDetails", label: "异业拜访详情", type: "textarea", hint: "门店名单+结果：同意/拒绝/待跟进" },
      ],
    },
    {
      id: "leadQuality",
      title: "二、线索质量",
      fields: [
        { id: "validLeads", label: "有效线索数", type: "number", required: true, hint: "按统一口径" },
        { id: "invalidLeads", label: "无效线索数", type: "number", required: true },
        { id: "invalidLeadReason", label: "无效原因", type: "textarea", hint: "假号/无需求/重复/拒绝" },
        { id: "appointmentsBooked", label: "当日预约数", type: "number", required: true, hint: "市场引流" },
        { id: "visitsArrived", label: "当日到诊数", type: "number", required: true, hint: "市场归因" },
        { id: "dealCount", label: "当日成交数", type: "number", hint: "市场归因" },
        { id: "dealAmount", label: "当日成交金额", type: "money", hint: "市场归因" },
      ],
    },
    {
      id: "cost",
      title: "三、费用",
      fields: [
        { id: "dailyCost", label: "当日物料/场地/合作费用", type: "money" },
        { id: "costDetail", label: "费用明细与凭证", type: "textarea" },
      ],
    },
    {
      id: "review",
      title: "四、复盘",
      fields: [
        { id: "effectiveSpot", label: "今日最有效点位/合作方", type: "textarea", required: true },
        { id: "tomorrowPlan", label: "明日计划点位+目标", type: "textarea", required: true, hint: "线索X、到诊X" },
      ],
    },
  ],
};

// 市场组长日报
export const marketingLeadSchema: DailyReportSchema = {
  id: "marketing_lead",
  title: "市场组长日报",
  description: "市场组长每日必填 - 人效+渠道效率",
  sections: [
    {
      id: "teamSummary",
      title: "一、组动作汇总",
      fields: [
        { id: "teamTouchpoints", label: "触达总数", type: "number", required: true },
        { id: "teamValidInfo", label: "有效信息总数", type: "number", required: true },
        { id: "teamWechatAdded", label: "加微总数", type: "number", required: true },
        { id: "teamAppointments", label: "预约总数", type: "number", required: true },
        { id: "teamVisits", label: "到诊总数", type: "number", required: true },
        { id: "teamDeals", label: "成交总数", type: "number", required: true },
        { id: "teamDealAmount", label: "成交总金额", type: "money" },
      ],
    },
    {
      id: "channelRanking",
      title: "二、点位/渠道排行",
      fields: [
        { id: "top3Channels", label: "Top3渠道", type: "textarea", required: true, hint: "渠道名+数据+原因" },
        { id: "bottom3Channels", label: "Bottom3渠道", type: "textarea", required: true, hint: "渠道名+数据+原因" },
      ],
    },
    {
      id: "efficiency",
      title: "三、人效",
      fields: [
        { id: "leadsPerPerson", label: "每人有效线索", type: "number", required: true },
        { id: "visitsPerPerson", label: "每人到诊", type: "number", required: true },
      ],
    },
    {
      id: "costAnalysis",
      title: "四、成本",
      fields: [
        { id: "costPerLead", label: "单线索成本", type: "money" },
        { id: "costPerVisit", label: "单到诊成本", type: "money" },
      ],
    },
    {
      id: "tomorrowResource",
      title: "五、明日资源调度",
      fields: [
        { id: "resourcePlan", label: "资源调度计划", type: "textarea", required: true, hint: "谁去哪、带什么物料、预期产出" },
      ],
    },
  ],
};

// 市场总监日报
export const marketingDirectorSchema: DailyReportSchema = {
  id: "marketing_director",
  title: "市场总监日报",
  description: "市场总监每日必填 - 投放决策+结构优化",
  sections: [
    {
      id: "overview",
      title: "一、今日总览",
      fields: [
        { id: "totalLeads", label: "总线索", type: "number", required: true },
        { id: "totalVisits", label: "总到诊", type: "number", required: true },
        { id: "totalDeals", label: "总成交", type: "number", required: true },
        { id: "leadsFieldWork", label: "地推线索", type: "number" },
        { id: "leadsPartner", label: "异业线索", type: "number" },
        { id: "leadsCommunity", label: "社区线索", type: "number" },
        { id: "leadsEnterprise", label: "企业线索", type: "number" },
        { id: "leadsReferral", label: "老带新线索", type: "number" },
      ],
    },
    {
      id: "roi",
      title: "二、渠道ROI",
      fields: [
        { id: "channelROI", label: "渠道ROI分析", type: "textarea", required: true, hint: "有成本的必须算" },
      ],
    },
    {
      id: "gap",
      title: "三、目标差距",
      fields: [
        { id: "visitGap", label: "到诊差距", type: "number", hint: "差多少" },
        { id: "dealGap", label: "成交差距", type: "number", hint: "差多少" },
      ],
    },
    {
      id: "competitor",
      title: "四、竞品动态",
      fields: [
        { id: "competitorInfo", label: "竞品动态与应对", type: "textarea" },
      ],
    },
    {
      id: "tomorrowBudget",
      title: "五、明日预算/人力调整建议",
      fields: [
        { id: "budgetAdjustment", label: "调整建议", type: "textarea", required: true, hint: "明确到渠道与金额" },
      ],
    },
  ],
};

export const offlineMarketingSchemas = {
  staff: marketingStaffSchema,
  lead: marketingLeadSchema,
  director: marketingDirectorSchema,
};









