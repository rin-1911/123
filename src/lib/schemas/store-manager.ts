// 店长日报 Schema
import { DailyReportSchema } from "./types";

// 店长日报
export const storeManagerSchema: DailyReportSchema = {
  id: "store_manager",
  title: "店长经营日报",
  description: "店长每日必填 - 经营日报",
  sections: [
    {
      id: "daily",
      title: "店长经营日报",
      fields: [
        // 核心经营数据（尽量少但够用）
        { id: "totalVisits", label: "当日总到诊", type: "number", required: true },
        { id: "firstVisits", label: "首诊人数", type: "number", required: true },
        { id: "returnVisits", label: "复诊人数", type: "number", required: true },
        { id: "dealCount", label: "当日成交人数", type: "number", required: true },
        { id: "cashInYuan", label: "实收金额", type: "money", required: true },
        { id: "avgTicket", label: "客单价", type: "money" },
        { id: "restoreCount", label: "综合-人数", type: "number" },
        { id: "restoreAmount", label: "综合-金额", type: "money" },
        { id: "returnAppointment7Days", label: "复诊预约锁定人数", type: "number", required: true, hint: "未来7天" },

        // 运营备注（合并：客诉/退款/异常/需协调，避免重复填）
        { id: "todayIssues", label: "今日异常/风险/需协调", type: "textarea", hint: "请输入..." },

        // 明日安排（合并：重点事项+排班）
        { id: "tomorrowKeyFocus", label: "明日重点安排", type: "textarea", hint: "请输入..." },
      ],
    },
  ],
};

// 运营日报（连锁中台/运营经理）
export const operationsSchema: DailyReportSchema = {
  id: "operations",
  title: "运营日报",
  description: "运营经理每日必填 - 多店/单店都可用",
  sections: [
    {
      id: "coreMetrics",
      title: "一、门店核心指标总览",
      fields: [
        { id: "totalLeads", label: "总线索（市场+网电）", type: "number", required: true },
        { id: "totalVisits", label: "总到诊", type: "number", required: true },
        { id: "firstVisits", label: "首诊", type: "number", required: true },
        { id: "returnVisits", label: "复诊", type: "number", required: true },
        { id: "totalDeals", label: "总成交", type: "number", required: true },
        { id: "totalAmount", label: "总金额", type: "money", required: true },
        { id: "avgTicket", label: "客单价", type: "money" },
        { id: "conversionRate", label: "转化率", type: "number", suffix: "%" },
      ],
    },
    {
      id: "channelContribution",
      title: "二、分端口贡献",
      fields: [
        { id: "marketingVisits", label: "市场到诊", type: "number", required: true },
        { id: "onlineVisits", label: "网络到诊", type: "number", required: true },
        { id: "returnCustomerVisits", label: "老客复诊到诊", type: "number", required: true },
      ],
    },
    {
      id: "funnelHealth",
      title: "三、漏斗健康",
      fields: [
        { id: "leadToAppointment", label: "线索→预约转化", type: "number", suffix: "%" },
        { id: "appointmentToConfirm", label: "预约→确认转化", type: "number", suffix: "%" },
        { id: "confirmToVisit", label: "确认→到诊转化", type: "number", suffix: "%" },
        { id: "visitToDeal", label: "到诊→成交转化", type: "number", suffix: "%" },
      ],
    },
    {
      id: "returnSystem",
      title: "四、复诊体系",
      fields: [
        { id: "shouldFollowup", label: "今日应回访人数", type: "number", required: true },
        { id: "didFollowup", label: "已回访", type: "number", required: true },
        { id: "bookedReturn", label: "预约复诊", type: "number", required: true },
        { id: "lostContact", label: "失联", type: "number" },
      ],
    },
    {
      id: "alerts",
      title: "五、预警清单",
      fields: [
        { id: "alertVisitLow", label: "到诊低于目标", type: "boolean" },
        { id: "alertConversionLow", label: "成交转化低于目标", type: "boolean" },
        { id: "alertBigProjectZero", label: "大项目为0", type: "boolean" },
        { id: "alertNoShowHigh", label: "爽约率过高", type: "boolean" },
        { id: "alertComplaintUp", label: "客诉上升", type: "boolean" },
        { id: "alertDetail", label: "预警详情与原因", type: "textarea" },
      ],
    },
    {
      id: "tomorrowAction",
      title: "六、明日运营动作",
      fields: [
        { id: "morningMeetingTopic", label: "培训主题（10分钟晨会）", type: "textarea", required: true },
        { id: "auditPoints", label: "稽核点", type: "textarea", required: true, hint: "前台确认、客服首响、咨询复访" },
      ],
    },
  ],
};

export const storeManagerSchemas = {
  storeManager: storeManagerSchema,
  operations: operationsSchema,
};












