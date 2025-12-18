// 咨询部日报 Schema
import { DailyReportSchema } from "./types";

// 咨询师日报（员工）
export const consultantStaffSchema: DailyReportSchema = {
  id: "consultation_staff",
  title: "咨询师日报",
  description: "咨询师每日必填 - 个人日报",
  sections: [
    {
      id: "reception",
      title: "一、接诊与转化",
      fields: [
        { id: "receptionTotal", label: "当日接诊人数", type: "number", required: true, hint: "到咨询台完成初诊沟通的总人数" },
        { id: "firstVisitCount", label: "首诊接诊人数", type: "number", required: true },
        { id: "returnVisitCount", label: "复诊接诊人数", type: "number", required: true },
        { id: "dealCount", label: "成交人数", type: "number", required: true, hint: "含定金/预付" },
        { id: "noDealCount", label: "未成交人数", type: "number", required: true },
        { id: "conversionRate", label: "到诊→成交转化率", type: "calculated", formula: "dealCount / receptionTotal * 100", suffix: "%" },
        { id: "cashInYuan", label: "当日实收金额", type: "money", required: true, hint: "个人贡献口径" },
      ],
    },
    {
      id: "projectStructure",
      title: "二、项目结构",
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
    {
      id: "keyProcess",
      title: "三、关键过程数据",
      fields: [
        { id: "planOutputCount", label: "方案输出数", type: "number", required: true, hint: "给出治疗方案的数量" },
        { id: "followupNeeded", label: "复访客户数", type: "number", required: true, hint: "当日需要跟进的未成交客户数" },
        { id: "followupDone", label: "当日完成回访次数", type: "number", required: true, hint: "电话/微信/面访" },
        { id: "nextAppointment", label: "预约下次复诊人数", type: "number", required: true, hint: "已锁定时间" },
        { id: "depositCount", label: "定金笔数", type: "number", required: true },
        { id: "depositAmount", label: "定金金额", type: "money", required: true },
        { id: "installmentApply", label: "分期申请数", type: "number" },
        { id: "installmentApproved", label: "分期通过数", type: "number" },
      ],
    },
    {
      id: "noDealReasons",
      title: "四、未成交原因",
      fields: [
        {
          id: "noDealReason",
          label: "主要未成交原因",
          type: "multiselect",
          required: true,
          options: [
            { value: "price", label: "价格/预算" },
            { value: "plan_hesitation", label: "方案犹豫" },
            { value: "time_family", label: "时间/家属未到" },
            { value: "trust", label: "信任不足（医生/机构）" },
            { value: "competitor", label: "竞对对比" },
            { value: "fear", label: "痛感/恐惧" },
            { value: "other", label: "其他" },
          ],
        },
        { id: "noDealReasonDetail", label: "原因补充说明", type: "textarea" },
      ],
    },
    {
      id: "dailyActions",
      title: "五、当日三件事动作",
      fields: [
        { id: "todayActions", label: "今日促成动作", type: "textarea", required: true, hint: "例：家属沟通、二次方案、医生二次会诊" },
        { id: "tomorrowTargets", label: "明日要约对象", type: "textarea", required: true, hint: "名单+预计到诊时间" },
        { id: "supportNeeded", label: "需要支持", type: "textarea", hint: "医生/价格/活动/资料" },
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
        { id: "teamConversionRate", label: "组转化率", type: "calculated", formula: "teamDealCount / teamReceptionTotal * 100", suffix: "%" },
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







