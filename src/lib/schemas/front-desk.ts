// 前台日报 Schema
import { DailyReportSchema } from "./types";

// 前台日报（员工）
export const frontDeskStaffSchema: DailyReportSchema = {
  id: "front_desk_staff",
  title: "前台日报",
  description: "前台每日必填",
  sections: [
    {
      id: "performance",
      title: "一、业绩统计",
      fields: [
        { id: "actualRevenue", label: "实收业绩", type: "money", required: true, hint: "当日实际收款金额" },
        { id: "expectedRevenue", label: "应收业绩", type: "money", required: true, hint: "当日应收款金额" },
        { id: "refundAmount", label: "今日退费", type: "money", required: true },
      ],
    },
    {
      id: "visitStats",
      title: "二、到院统计",
      fields: [
        { id: "totalVisitors", label: "总到院人数", type: "number", required: true },
        { id: "firstVisitCount", label: "初诊人数", type: "number", required: true },
        { id: "returnVisitCount", label: "复诊人数", type: "number", required: true },
        { id: "firstVisitAmount", label: "初诊消费金额", type: "money", required: true },
        { id: "returnVisitAmount", label: "复诊消费金额", type: "money", required: true },
      ],
    },
    {
      id: "firstVisitDetail",
      title: "三、初诊详情",
      fields: [
        { id: "firstVisitSource", label: "初诊来源", type: "dynamic_select", required: true, dynamicOptionsKey: "first_visit_sources", hint: "选择患者来源渠道" },
        { id: "firstVisitProject", label: "初诊项目成交", type: "dynamic_select", required: true, dynamicOptionsKey: "treatment_projects", hint: "选择成交项目" },
      ],
    },
  ],
};

// 前台主管日报
export const frontDeskLeadSchema: DailyReportSchema = {
  id: "front_desk_lead",
  title: "前台主管日报",
  description: "前台主管每日必填",
  sections: [
    {
      id: "summary",
      title: "一、到店与预约关键指标汇总",
      fields: [
        { id: "totalArrival", label: "到诊总数", type: "number", required: true },
        { id: "noShowTotal", label: "爽约总数", type: "number", required: true },
        { id: "appointmentRate", label: "预约兑现率", type: "number", required: true, suffix: "%" },
      ],
    },
    {
      id: "noShowAnalysis",
      title: "二、爽约分析",
      fields: [
        { id: "noShowReason1", label: "爽约原因Top1", type: "text", required: true },
        { id: "noShowReason2", label: "爽约原因Top2", type: "text", required: true },
        { id: "noShowReason3", label: "爽约原因Top3", type: "text", required: true },
        { id: "noShowImproveAction", label: "明日改善动作", type: "textarea", required: true },
      ],
    },
    {
      id: "complaintProgress",
      title: "三、客诉闭环进度",
      fields: [
        { id: "complaintOwner", label: "责任人", type: "text" },
        { id: "complaintDeadline", label: "完成时间", type: "text" },
        { id: "complaintDetail", label: "客诉详情与进度", type: "textarea" },
      ],
    },
    {
      id: "tomorrowResource",
      title: "四、明日资源",
      fields: [
        { id: "resourceSufficient", label: "资源是否满足预约量", type: "select", required: true, options: [
          { value: "yes", label: "是" },
          { value: "no", label: "否" },
        ]},
        { id: "resourceGap", label: "缺口说明", type: "textarea", hint: "诊室/医生/椅位/洁牙师排班缺口" },
      ],
    },
  ],
};

export const frontDeskSchemas = {
  staff: frontDeskStaffSchema,
  lead: frontDeskLeadSchema,
};





