// 店长日报 Schema
import { DailyReportSchema } from "./types";

// 店长日报
export const storeManagerSchema: DailyReportSchema = {
  id: "store_manager",
  title: "店长经营日报",
  description: "店长每日必填 - 经营日报",
  sections: [
    {
      id: "businessResult",
      title: "一、经营结果",
      fields: [
        { id: "totalVisits", label: "当日总到诊", type: "number", required: true },
        { id: "firstVisits", label: "首诊人数", type: "number", required: true },
        { id: "returnVisits", label: "复诊人数", type: "number", required: true },
        { id: "dealCount", label: "当日成交人数", type: "number", required: true },
        { id: "cashInYuan", label: "实收金额", type: "money", required: true },
        { id: "avgTicket", label: "客单价", type: "money" },
        { id: "implantCount", label: "种植-人数", type: "number" },
        { id: "implantAmount", label: "种植-金额", type: "money" },
        { id: "orthoCount", label: "正畸-人数", type: "number" },
        { id: "orthoAmount", label: "正畸-金额", type: "money" },
        { id: "restoreCount", label: "综合-人数", type: "number" },
        { id: "restoreAmount", label: "综合-金额", type: "money" },
        { id: "pediatricCount", label: "儿牙-人数", type: "number" },
        { id: "pediatricAmount", label: "儿牙-金额", type: "money" },
        { id: "returnAppointment7Days", label: "复诊预约锁定人数", type: "number", required: true, hint: "未来7天" },
      ],
    },
    {
      id: "resourceEfficiency",
      title: "二、资源与效率",
      fields: [
        { id: "chairsOpen", label: "开诊椅位数", type: "number", required: true },
        { id: "chairsUsed", label: "使用椅位数", type: "number", required: true },
        { id: "chairUtilization", label: "椅位利用率", type: "calculated", formula: "chairsUsed / chairsOpen * 100", suffix: "%" },
        { id: "doctorOnDuty", label: "医生出诊情况", type: "textarea", required: true, hint: "谁出诊" },
        { id: "doctorAbsent", label: "缺诊情况", type: "textarea", hint: "缺诊原因" },
        { id: "waitTimeOverCount", label: "等候时间异常例数", type: "number", hint: ">X分钟" },
      ],
    },
    {
      id: "customerRisk",
      title: "三、客户与风险",
      fields: [
        { id: "complaintEvent", label: "客诉/医疗纠纷/退款", type: "textarea", hint: "事件描述" },
        { id: "complaintProgress", label: "处理节点", type: "textarea" },
        { id: "priceException", label: "价格异常/赠送异常", type: "textarea", hint: "是否超权限" },
      ],
    },
    {
      id: "tomorrowPlan",
      title: "四、明日计划",
      fields: [
        { id: "tomorrowVisitForecast", label: "明日到诊预测", type: "number", required: true, hint: "按预约" },
        { id: "keyCustomerList", label: "明日重点项目客户清单", type: "textarea", required: true, hint: "种植/正畸" },
        { id: "promotionPlan", label: "明日促销/活动执行点", type: "textarea", hint: "谁负责" },
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







