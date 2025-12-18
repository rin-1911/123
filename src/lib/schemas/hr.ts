// 人事端日报 Schema
import { DailyReportSchema } from "./types";

// 人事专员日报
export const hrStaffSchema: DailyReportSchema = {
  id: "hr_staff",
  title: "人事专员日报",
  description: "每日必填 - 人力台账+考勤+招聘",
  sections: [
    {
      id: "staffChange",
      title: "一、人员异动",
      fields: [
        { id: "hireCount", label: "入职人数", type: "number", required: true },
        { id: "hireDetail", label: "入职详情", type: "textarea", hint: "岗位/到岗时间/试用期" },
        { id: "resignCount", label: "离职人数", type: "number", required: true },
        { id: "resignDetail", label: "离职详情", type: "textarea", hint: "岗位/离职原因（主动/被动）" },
        { id: "transferCount", label: "转岗/调薪人次", type: "number" },
        { id: "transferDetail", label: "转岗/调薪详情", type: "textarea", hint: "原因/生效日期" },
      ],
    },
    {
      id: "attendance",
      title: "二、考勤与排班",
      fields: [
        { id: "scheduledCount", label: "当日应出勤人数", type: "number", required: true },
        { id: "actualCount", label: "实到人数", type: "number", required: true },
        { id: "lateCount", label: "迟到人次", type: "number" },
        { id: "earlyLeaveCount", label: "早退人次", type: "number" },
        { id: "absentCount", label: "缺勤人次", type: "number" },
        { id: "leaveCount", label: "请假人次", type: "number" },
        { id: "leaveHours", label: "请假总时长（小时）", type: "number" },
        { id: "overtimeCount", label: "加班人次", type: "number" },
        { id: "overtimeHours", label: "加班总时长（小时）", type: "number" },
        { id: "gapPositions", label: "缺口岗位/缺口班次", type: "textarea", hint: "影响门诊必须标红" },
      ],
    },
    {
      id: "recruitFunnel",
      title: "三、招聘漏斗",
      fields: [
        { id: "newResumes", label: "新增简历数", type: "number", required: true },
        { id: "phoneInvites", label: "电话邀约数", type: "number", required: true },
        { id: "interviewCount", label: "到面数", type: "number", required: true },
        { id: "passCount", label: "通过数", type: "number", required: true },
        { id: "offerCount", label: "Offer发出数", type: "number", required: true },
        { id: "onboardCount", label: "入职数", type: "number", required: true },
        { id: "recruitProgress", label: "各岗位在招进度", type: "textarea", required: true, hint: "医生/护士/前台/咨询/市场/网客等" },
      ],
    },
    {
      id: "employeeRelations",
      title: "四、员工关系/纪律",
      fields: [
        { id: "complaintEvents", label: "客诉涉及员工事件", type: "textarea", hint: "时间-人员-事件-处理节点" },
        { id: "violationList", label: "违规/迟到多发名单", type: "textarea", hint: "用于主管面谈" },
      ],
    },
  ],
};

// 人事主管日报
export const hrLeadSchema: DailyReportSchema = {
  id: "hr_lead",
  title: "人事主管日报",
  description: "每日必填 - 人效与稳定性预警",
  sections: [
    {
      id: "headcount",
      title: "一、人力结构",
      fields: [
        { id: "doctorCount", label: "在岗人数-医生", type: "number", required: true },
        { id: "nurseCount", label: "在岗人数-护士", type: "number", required: true },
        { id: "frontDeskCount", label: "在岗人数-前台", type: "number", required: true },
        { id: "consultantCount", label: "在岗人数-咨询", type: "number", required: true },
        { id: "marketingCount", label: "在岗人数-市场", type: "number", required: true },
        { id: "onlineCount", label: "在岗人数-网客", type: "number", required: true },
        { id: "otherCount", label: "在岗人数-其他", type: "number" },
        { id: "headcountGap", label: "编制缺口", type: "textarea", required: true, hint: "缺几人、缺哪些岗、预计补齐日期" },
        { id: "newHireRatio", label: "新人占比", type: "number", suffix: "%", hint: "入职<30天人数占比" },
      ],
    },
    {
      id: "stability",
      title: "二、稳定性",
      fields: [
        { id: "turnoverRiskList", label: "7天离职预警名单", type: "textarea", required: true, hint: "高风险：连续缺勤、绩效低、投诉" },
        { id: "keyPositionBackup", label: "关键岗位备份情况", type: "textarea", required: true, hint: "例如：收银、护士长、主诊医生" },
      ],
    },
    {
      id: "training",
      title: "三、培训与上岗",
      fields: [
        { id: "trainingDone", label: "当日培训完成情况", type: "textarea", required: true, hint: "新员工/岗位认证" },
        { id: "trainingFailed", label: "未通过项", type: "textarea", hint: "谁、缺什么、补训时间" },
      ],
    },
    {
      id: "efficiency",
      title: "四、与经营挂钩的人效",
      fields: [
        { id: "revenuePerHead", label: "人均产值", type: "money", required: true, hint: "当日实收/当日出勤人数" },
        { id: "doctorEfficiency", label: "医生出诊人效", type: "textarea", hint: "每位医生接诊/产值/项目结构，可由运营/财务提供，HR只做汇总监控" },
      ],
    },
  ],
};

// 人力负责人/总监日报
export const hrDirectorSchema: DailyReportSchema = {
  id: "hr_director",
  title: "人力负责人/总监日报",
  description: "每日必看 - 组织健康",
  sections: [
    {
      id: "laborCost",
      title: "一、人力成本",
      fields: [
        { id: "laborCostToday", label: "当日人力成本", type: "money", required: true },
        { id: "laborCostMTD", label: "本月累计人力成本", type: "money", required: true },
        { id: "laborCostTrend", label: "成本趋势说明", type: "textarea" },
      ],
    },
    {
      id: "turnover",
      title: "二、离职率",
      fields: [
        { id: "turnoverDoctor", label: "本月离职率-医生", type: "number", suffix: "%" },
        { id: "turnoverNurse", label: "本月离职率-护士", type: "number", suffix: "%" },
        { id: "turnoverFrontDesk", label: "本月离职率-前台", type: "number", suffix: "%" },
        { id: "turnoverConsultant", label: "本月离职率-咨询", type: "number", suffix: "%" },
        { id: "turnoverMarketing", label: "本月离职率-市场", type: "number", suffix: "%" },
        { id: "turnoverOnline", label: "本月离职率-网客", type: "number", suffix: "%" },
        { id: "turnoverTotal", label: "本月离职率-总计", type: "number", suffix: "%", required: true },
      ],
    },
    {
      id: "coreRecruit",
      title: "三、核心岗位招聘进度",
      fields: [
        { id: "recruitDoctor", label: "医生招聘进度", type: "textarea", required: true },
        { id: "recruitNurse", label: "护士招聘进度", type: "textarea", required: true },
        { id: "recruitConsultLead", label: "咨询主管招聘进度", type: "textarea" },
        { id: "recruitMarketingCore", label: "市场骨干招聘进度", type: "textarea" },
      ],
    },
    {
      id: "risks",
      title: "四、关键风险",
      fields: [
        { id: "laborDispute", label: "劳动争议苗头", type: "textarea" },
        { id: "socialInsuranceIssue", label: "社保公积金异常", type: "textarea" },
        { id: "complianceIssue", label: "用工合规问题", type: "textarea", hint: "合同/试用期/加班" },
      ],
    },
  ],
};

export const hrSchemas = {
  staff: hrStaffSchema,
  lead: hrLeadSchema,
  director: hrDirectorSchema,
};







