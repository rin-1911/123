// 行政部日报 Schema
import { DailyReportSchema } from "./types";

// 行政部日报 (根据行政反馈定制)
export const adminStaffSchema: DailyReportSchema = {
  id: "admin_staff",
  title: "行政部日报",
  description: "行政部每日必填",
  sections: [
    {
      id: "admin_work",
      title: "行政工作",
      fields: [
        { 
          id: "completed_today", 
          label: "今日办理事项", 
          type: "textarea", 
          required: true,
          hint: "今日完成的工作"
        },
        { 
          id: "pending_items", 
          label: "待办事项", 
          type: "textarea",
          hint: "待处理的事项"
        },
        { 
          id: "other_notes", 
          label: "其他", 
          type: "textarea",
          hint: "其他说明"
        },
      ],
    },
  ],
};

export const adminSchemas = {
  staff: adminStaffSchema,
  lead: adminStaffSchema,
  director: adminStaffSchema,
};
