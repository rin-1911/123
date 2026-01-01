// 咨询部日报 Schema
import { DailyReportSchema } from "./types";

// 咨询师日报（员工）
export const consultantStaffSchema: DailyReportSchema = {
  id: "consultation_staff",
  title: "咨询师日报",
  description: "咨询师每日必填 - 个人日报",
  sections: [
    {
      id: "daily_data",
      title: "当日总结",
      description: "包含接诊转化、未成交原因及计划",
      fields: [
        { id: "receptionTotal", label: "当日接诊人数", type: "number", required: true, hint: "到咨询台完成初诊沟通的总人数" },
        { id: "firstVisitCount", label: "首诊接诊人数", type: "number", required: true },
        { id: "returnVisitCount", label: "复诊接诊人数", type: "number", required: true },
        { id: "dealCount", label: "成交人数", type: "number", required: true, hint: "含定金/预付" },
        { id: "noDealCount", label: "未成交人数", type: "number", required: true },
        { id: "cashInYuan", label: "当日实收金额", type: "money", required: true, hint: "个人贡献口径" },
        {
          id: "noDealReason",
          label: "未成交原因说明",
          type: "textarea",
          required: true,
          hint: "请详细填写未成交的具体原因，如价格、方案、信任度等"
        },
        { id: "today_plan", label: "今日总结", type: "textarea", required: true, hint: "今日工作完成情况总结" },
        { id: "tomorrow_plan", label: "明日计划", type: "textarea", required: true, hint: "明日重点跟进客户及工作安排" },
        { id: "daily_data_remark", label: "备注", type: "textarea", hint: "针对今日数据的特殊说明" },
      ],
    },
    {
      id: "data_detail",
      title: "数据详细",
      description: "各项目明细统计",
      fields: [
        { id: "implant_visit", label: "种植-到诊", type: "number", required: true },
        { id: "implant_deal", label: "种植-成交", type: "number", required: true },
        { id: "implant_amount", label: "种植-金额", type: "money", required: true },
        { id: "ortho_visit", label: "正畸-到诊", type: "number", required: true },
        { id: "ortho_deal", label: "正畸-成交", type: "number", required: true },
        { id: "ortho_amount", label: "正畸-金额", type: "money", required: true },
        { id: "restore_visit", label: "修复/综合-到诊", type: "number", required: true },
        { id: "restore_deal", label: "修复/综合-成交", type: "number", required: true },
        { id: "restore_amount", label: "修复/综合-金额", type: "money", required: true },
        { id: "pediatric_visit", label: "儿牙-到诊", type: "number", required: true },
        { id: "pediatric_deal", label: "儿牙-成交", type: "number", required: true },
        { id: "pediatric_amount", label: "儿牙-金额", type: "money", required: true },
        { id: "other_visit", label: "其他-到诊", type: "number", required: true },
        { id: "other_deal", label: "其他-成交", type: "number", required: true },
        { id: "other_amount", label: "其他-金额", type: "money", required: true },
      ],
    },
  ],
};

// 咨询主管日报
export const consultantLeadSchema: DailyReportSchema = {
  id: "consultation_lead",
  title: "咨询主管日报",
  description: "咨询主管每日必填 - 组汇总+问题闭环",
  sections: [
    {
      id: "teamSummary",
      title: "一、团队汇总",
      fields: [
        { id: "teamReceptionTotal", label: "组到诊总数", type: "number", required: true },
        { id: "teamFirstVisit", label: "首诊人数", type: "number", required: true },
        { id: "teamReturnVisit", label: "复诊人数", type: "number", required: true },
        { id: "teamDealCount", label: "组成交人数", type: "number", required: true },
        { id: "teamCashInYuan", label: "组成交金额", type: "money", required: true },
        { id: "teamAvgTicket", label: "客单价", type: "money" },
        { id: "implantRatio", label: "种植占比", type: "number", suffix: "%" },
        { id: "orthoRatio", label: "正畸占比", type: "number", suffix: "%" },
        { id: "restoreRatio", label: "综合占比", type: "number", suffix: "%" },
        { id: "pediatricRatio", label: "儿牙占比", type: "number", suffix: "%" },
      ],
    },
    {
      id: "funnelLayers",
      title: "二、漏斗分层",
      fields: [
        { id: "highIntentNoDeal", label: "高意向未成交人数", type: "number", required: true, hint: "可约二次面谈" },
        { id: "midIntentNoDeal", label: "中意向未成交人数", type: "number", required: true, hint: "需内容教育" },
        { id: "lowIntentNoDeal", label: "低意向未成交人数", type: "number", required: true, hint: "仅维护" },
        { id: "todayNewNoDeal", label: "今日新增未成交", type: "number", required: true },
        { id: "historyNoDealCleared", label: "历史未成交清理", type: "number", required: true },
      ],
    },
    {
      id: "alerts",
      title: "三、异常预警",
      fields: [
        { id: "lowConversionReason", label: "转化率低于目标原因", type: "textarea", hint: "至少1条" },
        { id: "lowConversionAction", label: "明日改进动作", type: "textarea", hint: "至少2条" },
        { id: "bigProjectGapReason", label: "大项目空白原因", type: "textarea" },
        { id: "bigProjectAction", label: "大项目安排", type: "textarea", hint: "谁负责、何时会诊" },
        { id: "complaintEvent", label: "客诉/纠纷事件", type: "textarea" },
        { id: "complaintProgress", label: "处理节点", type: "textarea" },
      ],
    },
    {
      id: "tomorrowPlan",
      title: "四、明日排班与重点战役",
      fields: [
        { id: "keyCustomerList", label: "明日重点客户清单", type: "textarea", required: true, hint: "姓名/项目/金额/阻力点/责任人/约见时间" },
        { id: "doctorConsultSchedule", label: "医生会诊安排", type: "textarea", hint: "医生/时段/客户" },
      ],
    },
  ],
};

export const consultationSchemas = {
  staff: consultantStaffSchema,
  lead: consultantLeadSchema,
};
