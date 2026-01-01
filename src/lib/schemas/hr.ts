// 人事端日报 Schema
import { DailyReportSchema } from "./types";

// 人事部综合日报 (根据人事反馈定制)
export const hrStaffSchema: DailyReportSchema = {
  id: "hr_staff",
  title: "人事部日报",
  description: "每日必填 - 考勤、招聘与人员管理",
  sections: [
    {
      id: "attendance_mgmt",
      title: "一、考勤管理",
      description: "当日全员出勤监控",
      fields: [
        { id: "att_expected", label: "应到人数", type: "number", required: true },
        { id: "att_actual", label: "实到人数", type: "number", required: true },
        { id: "att_rest", label: "休息人数", type: "number", required: true },
        { id: "att_late_early_count", label: "迟到/早退人数", type: "number", required: true },
        { 
          id: "att_late_early_details", 
          label: "迟到/早退明细", 
          type: "dynamic_rows",
          hint: "点击添加记录每位迟到/早退人员信息",
          rowFields: [
            { id: "name", label: "姓名", type: "text" },
            { id: "type", label: "类型", type: "text" },
            { id: "reason", label: "原因", type: "text" },
            { id: "duration", label: "时长", type: "text" }
          ]
        },
        { id: "att_absent", label: "旷工人数", type: "number", required: true },
        { id: "att_leave_count", label: "请假人数", type: "number", required: true },
        { 
          id: "att_leave_details", 
          label: "请假明细", 
          type: "dynamic_rows",
          hint: "点击添加记录每位请假人员信息",
          rowFields: [
            { id: "name", label: "姓名", type: "text" },
            { id: "reason", label: "请假原因", type: "text" },
            { id: "duration", label: "请假时长", type: "text" }
          ]
        },
        { id: "att_overtime_count", label: "加班人数", type: "number" },
        { 
          id: "att_overtime_details", 
          label: "加班明细", 
          type: "dynamic_rows",
          hint: "点击添加记录每位加班人员信息",
          rowFields: [
            { id: "name", label: "姓名", type: "text" },
            { id: "duration", label: "加班时长", type: "text" }
          ]
        },
        { id: "att_other", label: "其他说明", type: "textarea" },
      ],
    },
    {
      id: "recruit_board",
      title: "二、招聘看板",
      description: "招聘漏斗全流程监控",
      allowCustomFields: true,
      fields: [
        { id: "rec_greetings", label: "打招呼人数", type: "number" },
        { id: "rec_intentional", label: "意向人数", type: "number" },
        { id: "rec_positions", label: "招聘岗位", type: "text", hint: "例：医生、咨询、前台" },
        { id: "rec_results", label: "招聘结果", type: "textarea" },
        { id: "rec_interviews", label: "面试人数", type: "number" },
        { id: "rec_interview_results", label: "面试结果", type: "textarea" },
        { id: "rec_supplement", label: "其他补充", type: "textarea" },
      ],
    },
    {
      id: "personnel_mgmt",
      title: "三、人员管理",
      description: "入离职与合同管理",
      fields: [
        // ========== 入职管理 ==========
        { id: "onboard_divider", label: "【入职管理】", type: "divider" },
        { 
          id: "p_onboard_details", 
          label: "今日入职人员", 
          type: "dynamic_rows",
          hint: "记录今日入职的人员信息",
          rowFields: [
            { id: "name", label: "姓名", type: "text" },
            { id: "dept", label: "入职部门", type: "text" },
            { id: "time", label: "入职时间", type: "text" },
            { id: "process", label: "流程进度", type: "text" }
          ]
        },
        { id: "p_onboard_note", label: "入职备注", type: "textarea", hint: "其他需要说明的入职事项" },
        
        // ========== 合同签订（独立板块） ==========
        { id: "contract_divider", label: "【合同签订】", type: "divider" },
        { 
          id: "p_contract_details", 
          label: "今日合同签订", 
          type: "dynamic_rows",
          hint: "记录今日签订合同的人员（含试岗期、试用期、免责协议、劳动合同等）",
          rowFields: [
            { id: "name", label: "员工姓名", type: "text" },
            { id: "contract_type", label: "合同类型", type: "text" },
            { id: "note", label: "备注", type: "text" }
          ]
        },
        
        // ========== 离职管理 ==========
        { id: "resign_divider", label: "【离职管理】", type: "divider" },
        { 
          id: "p_resign_details", 
          label: "今日离职人员", 
          type: "dynamic_rows",
          hint: "记录离职人员及交接情况",
          rowFields: [
            { id: "name", label: "离职人员", type: "text" },
            { id: "dept", label: "离职部门", type: "text" },
            { id: "handover", label: "交接情况", type: "text" }
          ]
        },
        { id: "p_resign_note", label: "离职备注", type: "textarea", hint: "其他需要说明的离职事项" },
        
        // ========== 其他 ==========
        { id: "p_other", label: "其他人事事项", type: "textarea" },
      ],
    },
  ],
};

export const hrSchemas = {
  staff: hrStaffSchema,
  lead: hrStaffSchema,
  director: hrStaffSchema,
};
