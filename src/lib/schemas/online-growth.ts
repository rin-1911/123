// 网络部日报 Schema - 深度实战版
import { DailyReportSchema } from "./types";

export const onlineStaffSchema: DailyReportSchema = {
  id: "online_staff",
  title: "网络部日报",
  description: "网络部每日必填 - 核心转化与全渠道监控",
  sections: [
    {
      id: "core_metrics",
      title: "今日核心数据",
      description: "转化全链路监控",
      fields: [
        { id: "leads_today", label: "今日建档", type: "number", required: true },
        { id: "leads_month", label: "月建档", type: "number", required: true },
        { id: "visits_today", label: "今日到店", type: "number", required: true },
        { id: "visits_month", label: "本月到店", type: "number", required: true },
        { id: "deals_today", label: "到店成交", type: "number", required: true },
        { id: "deals_month", label: "本月成交", type: "number", required: true },
        { id: "revenue_today", label: "今日业绩", type: "money", required: true },
        { id: "followup_today", label: "今日回访", type: "number", required: true },
        { id: "intentional_tomorrow", label: "明日意向顾客", type: "number", required: true },
      ],
    },
    {
      id: "channel_performance",
      title: "渠道表现",
      description: "监控各渠道到店与成交质量",
      fields: [
        // 抖音
        { id: "dy_v", label: "抖音-到店", type: "number" },
        { id: "dy_d", label: "抖音-成交", type: "number" },
        { id: "dy_a", label: "抖音-金额", type: "money" },
        
        // 动态三方渠道行
        { 
          id: "third_party_channels", 
          label: "三方渠道明细", 
          type: "dynamic_rows",
          rowFields: [
            { id: "name", label: "渠道名称", type: "text" },
            { id: "visits", label: "到店人数", type: "number" },
            { id: "deals", label: "成交人数", type: "number" },
            { id: "amount", label: "成交金额", type: "money" },
          ]
        },

        // 高德
        { id: "gd_v", label: "高德-到店", type: "number" },
        { id: "gd_d", label: "高德-成交", type: "number" },
        { id: "gd_a", label: "高德-金额", type: "money" },
        
        // 介绍
        { id: "ref_v", label: "介绍-到店", type: "number" },
        { id: "ref_d", label: "介绍-成交", type: "number" },
        { id: "ref_a", label: "介绍-金额", type: "money" },
        
        // 信息流
        { id: "ads_v", label: "信息流-到店", type: "number" },
        { id: "ads_d", label: "信息流-成交", type: "number" },
        { id: "ads_a", label: "信息流-金额", type: "money" },
        
        // 补款/再消费
        { id: "chan_balance", label: "补款金额", type: "money" },
        { id: "chan_respend", label: "再消费金额", type: "money" },
      ],
    },
    {
      id: "work_summary",
      title: "工作总结",
      fields: [
        { id: "main_tasks", label: "主要工作", type: "textarea", required: true },
        { id: "main_issues", label: "主要问题", type: "textarea", required: true },
      ],
    },
    {
      id: "tomorrow_plan",
      title: "明日计划",
      fields: [
        { id: "primary_task", label: "首要任务", type: "textarea", required: true },
        { id: "core_goal", label: "核心目标", type: "textarea", required: true, hint: "请详细描述明日要达成的业务指标" },
        { id: "daily_notes", label: "备注", type: "textarea" },
      ],
    },
  ],
};

export const onlineGrowthSchemas = {
  staff: onlineStaffSchema,
  lead: onlineStaffSchema,
  director: onlineStaffSchema,
};
