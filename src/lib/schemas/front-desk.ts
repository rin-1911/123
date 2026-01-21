// 前台日报 Schema - 最终清晰版
import { DailyReportSchema } from "./types";

export const frontDeskStaffSchema: DailyReportSchema = {
  id: "front_desk_staff",
  title: "前台日报",
  description: "前台每日必填",
  sections: [
    {
      id: "all_content",
      title: "数据明细汇总",
      fields: [
        // 一、业绩统计
        { id: "section_1", label: "一、业绩统计", type: "divider" },
        { id: "actualRevenue", label: "实收业绩", type: "money", required: true },
        { id: "expectedRevenue", label: "应收业绩", type: "money", required: true },
        { id: "refundAmount", label: "今日退费", type: "money", required: true },
        
        // 二、到院统计
        { id: "section_2", label: "二、到院统计", type: "divider" },
        { id: "new_patients_count", label: "新增患者", type: "number", required: true, hint: "今日新建立档案的患者数" },
        { id: "totalVisitors", label: "总到院人数", type: "number", required: true },
        { id: "firstVisitCount", label: "初诊人数", type: "number", required: true },
        { id: "returnVisitCount", label: "复诊人数", type: "number", required: true },
        { id: "firstVisitAmount", label: "初诊消费金额", type: "money", required: true },
        { id: "returnVisitAmount", label: "复诊消费金额", type: "money", required: true },
      ],
    },
  ],
};

export const frontDeskSchemas = {
  staff: frontDeskStaffSchema,
  lead: frontDeskStaffSchema,
};
