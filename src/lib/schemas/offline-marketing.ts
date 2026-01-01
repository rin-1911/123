// 线下市场日报 Schema
import { DailyReportSchema } from "./types";

// ==========================================
// 线下市场拓展（原市场专员，地推/驻点）
// ==========================================

// 市场专员日报（拓展）
export const marketingStaffSchema: DailyReportSchema = {
  id: "marketing_staff",
  title: "市场专员日报",
  description: "市场专员每日必填 - 动作量=结果",
  sections: [
    {
      id: "daily",
      title: "市场拓展日报",
      fields: [
        // 多点位清单（Field Array）
        { id: "d_spots", label: "多点位清单", type: "divider" },
        {
          id: "spot_details",
          label: "点位明细",
          type: "dynamic_rows",
          addRowLabel: "+ 新增点位",
          rowFields: [
            { id: "spot_name", label: "点位名称", type: "dynamic_select", dynamicOptionsKey: "marketing_spots" },
            { id: "valid_leads_phone", label: "有效线索(电话)", type: "number" },
            { id: "direct_visits", label: "现场引流到诊", type: "number" },
            { id: "visit_deal", label: "到诊成交", type: "number" },
            { id: "cash_expected", label: "应收", type: "money" },
            { id: "cash_received", label: "实收", type: "money" },
            { id: "remark", label: "备注", type: "text", fullWidth: true },
          ],
        },

        // 计划
        { id: "d_plan", label: "计划", type: "divider" },
        { id: "today_plan", label: "今日计划", type: "textarea" },
        { id: "tomorrow_plan", label: "明日计划", type: "textarea" },
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

// ==========================================
// 线下市场客服（回访转化与电销）
// ==========================================

// 客服专员日报（精简整合版）
export const customerServiceStaffSchema: DailyReportSchema = {
  id: "customer_service_staff",
  title: "线下市场客服日报",
  description: "客服专员每日必填 - 回访转化与电销",
  sections: [
    {
      id: "dailyWork",
      title: "今日工作汇报",
      fields: [
        // === 通话数据 ===
        { id: "followUpCount", label: "今日回访量", type: "number", required: true, hint: "总拨打次数" },
        { id: "validCallCount", label: "有效通话数", type: "number", required: true, hint: "接通并有效沟通" },
        { id: "invalidCallCount", label: "无效通话数", type: "number", hint: "未接通/挂断" },
        { id: "appointmentCount", label: "预约人数", type: "number", required: true, hint: "成功预约到店" },
        
        // === 客户分类（新增） ===
        { id: "classACount", label: "A类高意向客户(新增)", type: "number", required: true, hint: "高意向、近期可转化" },
        { id: "classBCount", label: "B类普通客户(新增)", type: "number", hint: "有意向需跟进" },
        { id: "classCCount", label: "C类待培育客户(新增)", type: "number", hint: "长期跟进培育" },
        
        { id: "todayRecordsCount", label: "今日建档量", type: "number", required: true, hint: "新建客户档案数" },
        
        // === 业绩数据 ===
        { id: "dealCount", label: "成交人数", type: "number", required: true, hint: "今日成交客户数" },
        { id: "todayExpected", label: "当日应收", type: "money", required: true },
        { id: "todayActual", label: "当日实收", type: "money", required: true },
        
        // === 复盘 ===
        { id: "todayProblems", label: "今日遇到问题", type: "textarea", required: true, hint: "客户拒接、异议处理等" },
        { id: "tomorrowPlan", label: "明日工作计划", type: "textarea", required: true, hint: "重点客户跟进等" },
      ],
    },
  ],
};

// 客服组长日报（精简整合版）
export const customerServiceLeadSchema: DailyReportSchema = {
  id: "customer_service_lead",
  title: "客服组长日报",
  description: "客服组长每日必填 - 团队效率与转化",
  sections: [
    {
      id: "teamDailyWork",
      title: "团队工作汇报",
      fields: [
        // === 通话数据 ===
        { id: "teamFollowUpCount", label: "团队回访总量", type: "number", required: true },
        { id: "teamValidCallCount", label: "团队有效通话数", type: "number", required: true },
        { id: "teamAppointmentCount", label: "团队预约人数", type: "number", required: true },
        
        // === 客户分类 ===
        { id: "teamClassACount", label: "A类高意向客户", type: "number", required: true },
        { id: "teamClassBCount", label: "B类普通客户", type: "number" },
        { id: "teamClassCCount", label: "C类待培育客户", type: "number" },
        
        { id: "teamTodayRecordsCount", label: "团队今日建档量", type: "number", required: true },
        
        // === 业绩数据 ===
        { id: "teamDealCount", label: "团队成交人数", type: "number", required: true },
        { id: "teamTodayExpected", label: "当日应收", type: "money", required: true },
        { id: "teamTodayActual", label: "当日实收", type: "money", required: true },
        
        // === 复盘 ===
        { id: "todayProblems", label: "今日遇到问题", type: "textarea", required: true },
        { id: "tomorrowPlan", label: "明日工作计划", type: "textarea", required: true },
      ],
    },
  ],
};

// ==========================================
// 导出
// ==========================================

// 拓展子部门 Schemas
export const expansionSchemas = {
  staff: marketingStaffSchema,
  lead: marketingLeadSchema,
  director: marketingDirectorSchema,
};

// 客服子部门 Schemas
export const customerServiceSchemas = {
  staff: customerServiceStaffSchema,
  lead: customerServiceLeadSchema,
  director: customerServiceLeadSchema, // 客服总监暂用组长模板
};

// 兼容旧代码：默认导出拓展部门的 schemas
export const offlineMarketingSchemas = {
  staff: marketingStaffSchema,
  lead: marketingLeadSchema,
  director: marketingDirectorSchema,
  // 子部门 schemas
  expansionStaff: marketingStaffSchema,
  expansionLead: marketingLeadSchema,
  customerServiceStaff: customerServiceStaffSchema,
  customerServiceLead: customerServiceLeadSchema,
};












