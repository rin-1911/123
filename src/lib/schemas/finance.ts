// 财务端日报 Schema
import { DailyReportSchema } from "./types";

// 出纳/收银日报
export const cashierSchema: DailyReportSchema = {
  id: "cashier",
  title: "出纳/收银日报",
  description: "每日必填 - 日结台账",
  sections: [
    {
      id: "paymentSummary",
      title: "一、当日收款汇总（按支付方式）",
      fields: [
        { id: "cashCount", label: "现金-笔数", type: "number", required: true },
        { id: "cashAmount", label: "现金-金额", type: "money", required: true },
        { id: "wechatCount", label: "微信-笔数", type: "number", required: true },
        { id: "wechatAmount", label: "微信-金额", type: "money", required: true },
        { id: "alipayCount", label: "支付宝-笔数", type: "number", required: true },
        { id: "alipayAmount", label: "支付宝-金额", type: "money", required: true },
        { id: "posCount", label: "刷卡/POS-笔数", type: "number", required: true },
        { id: "posAmount", label: "刷卡/POS-金额", type: "money", required: true },
        { id: "transferCount", label: "银联/转账-笔数", type: "number" },
        { id: "transferAmount", label: "银联/转账-金额", type: "money" },
        { id: "installmentApply", label: "分期/金融-申请数", type: "number" },
        { id: "installmentApproved", label: "分期/金融-通过数", type: "number" },
        { id: "installmentAmount", label: "分期/金融-放款金额", type: "money" },
        { id: "otherCount", label: "其他-笔数", type: "number" },
        { id: "otherAmount", label: "其他-金额", type: "money" },
      ],
    },
    {
      id: "refund",
      title: "二、当日退费/冲正",
      fields: [
        { id: "refundCount", label: "退款笔数", type: "number", required: true },
        { id: "refundAmount", label: "退款金额", type: "money", required: true },
        { id: "refundByMethod", label: "退款按支付方式拆分", type: "textarea", hint: "如：现金2笔500元，微信3笔800元" },
        { id: "adjustCount", label: "冲正/改价笔数", type: "number" },
        { id: "adjustDetail", label: "冲正/改价明细", type: "textarea", required: true, hint: "必须备注原因+审批人" },
      ],
    },
    {
      id: "prepaid",
      title: "三、预收/定金/储值",
      fields: [
        { id: "depositCount", label: "定金笔数", type: "number", required: true },
        { id: "depositAmount", label: "定金金额", type: "money", required: true },
        { id: "prepaidCount", label: "预收笔数", type: "number" },
        { id: "prepaidAmount", label: "预收金额", type: "money" },
        { id: "rechargeCount", label: "储值充值笔数", type: "number" },
        { id: "rechargeAmount", label: "储值充值金额", type: "money" },
        { id: "consumeFromBalance", label: "储值消费金额", type: "money" },
        { id: "newMemberCards", label: "当日新增会员卡数", type: "number" },
        { id: "memberCardIncome", label: "会员卡收入", type: "money" },
      ],
    },
    {
      id: "reconciliation",
      title: "四、当日对账",
      fields: [
        { id: "hisReceivable", label: "HIS应收总额", type: "money", required: true },
        { id: "actualReceived", label: "实收总额", type: "money", required: true },
        { id: "diffReason", label: "差额原因", type: "textarea", hint: "差额必须写原因" },
        { id: "posTotal", label: "POS小票合计", type: "money" },
        { id: "systemTotal", label: "系统合计", type: "money" },
        { id: "cashOpening", label: "现金期初余额", type: "money", required: true },
        { id: "cashClosing", label: "现金期末余额", type: "money", required: true },
        { id: "cashBalance", label: "现金盘点结果", type: "textarea", hint: "期初+收-支=期末" },
        { id: "exceptionList", label: "异常项清单", type: "textarea", hint: "单号/金额/原因/责任人/处理进度" },
      ],
    },
  ],
};

// 会计日报
export const accountantSchema: DailyReportSchema = {
  id: "accountant",
  title: "会计日报",
  description: "每日必填 - 收入成本与应收应付",
  sections: [
    {
      id: "revenueStructure",
      title: "一、收入结构（按项目/科室）",
      fields: [
        { id: "revenueImplant", label: "种植收入", type: "money", required: true },
        { id: "revenueOrtho", label: "正畸收入", type: "money", required: true },
        { id: "revenueRestore", label: "修复收入", type: "money", required: true },
        { id: "revenueGeneral", label: "综合收入", type: "money", required: true },
        { id: "revenuePediatric", label: "儿牙收入", type: "money", required: true },
        { id: "revenueOther", label: "其他收入", type: "money" },
        { id: "revenueByDoctor", label: "医生/咨询归属收入", type: "textarea", hint: "如按人核算，列明每人收入" },
      ],
    },
    {
      id: "receivablePayable",
      title: "二、应收应付",
      fields: [
        { id: "arrearsNewCount", label: "欠费/挂账新增-人数", type: "number", required: true },
        { id: "arrearsNewAmount", label: "欠费/挂账新增-金额", type: "money", required: true },
        { id: "arrearsCollectCount", label: "欠费回款-人数", type: "number" },
        { id: "arrearsCollectAmount", label: "欠费回款-金额", type: "money" },
        { id: "apNewAmount", label: "供应商应付新增", type: "money" },
        { id: "paymentAmount", label: "当日付款金额", type: "money" },
        { id: "paymentDetail", label: "付款明细", type: "textarea", hint: "对象/用途/审批人" },
      ],
    },
    {
      id: "inventory",
      title: "三、库存与耗材",
      description: "每日关键",
      fields: [
        { id: "inventoryIn", label: "当日入库金额", type: "money", required: true },
        { id: "inventoryOut", label: "当日出库金额", type: "money", required: true },
        { id: "inventoryDetail", label: "入库/出库明细", type: "textarea", hint: "种植体、正畸材料、修复加工等" },
        { id: "highValueUsage", label: "高值耗材使用记录", type: "textarea", required: true, hint: "品名/数量/患者/医生/单号" },
        { id: "inventoryException", label: "异常：盘亏/过期/报损", type: "textarea", hint: "数量/金额/原因" },
      ],
    },
  ],
};

// 财务主管/财务经理日报
export const financeManagerSchema: DailyReportSchema = {
  id: "finance_manager",
  title: "财务主管/财务经理日报",
  description: "每日必填 - 经营现金流与风险",
  sections: [
    {
      id: "coreMetrics",
      title: "一、日报核心",
      fields: [
        { id: "totalReceived", label: "当日实收总额", type: "money", required: true },
        { id: "totalRefund", label: "退款总额", type: "money", required: true },
        { id: "netCashFlow", label: "净现金流", type: "money", required: true },
        { id: "prepaidNet", label: "预收/定金/储值净增", type: "money", required: true },
        { id: "arrearsBalance", label: "欠费余额（累计）", type: "money", required: true },
        { id: "arrearsAge030", label: "账龄0-30天", type: "money" },
        { id: "arrearsAge3160", label: "账龄31-60天", type: "money" },
        { id: "arrearsAge60Plus", label: "账龄60+天", type: "money" },
        { id: "costMaterial", label: "成本支出-材料", type: "money" },
        { id: "costProcessing", label: "成本支出-加工", type: "money" },
        { id: "costLabor", label: "成本支出-人工", type: "money" },
        { id: "costMarketing", label: "成本支出-营销", type: "money" },
        { id: "costRentUtility", label: "成本支出-房租水电", type: "money" },
        { id: "costOther", label: "成本支出-其他", type: "money" },
      ],
    },
    {
      id: "riskControl",
      title: "二、风险控制",
      fields: [
        { id: "adjustExceptionTop", label: "改价/赠送/冲正异常TOP", type: "textarea", required: true, hint: "单号+原因+审批链是否齐全" },
        { id: "largeRefund", label: "大额退款与原因", type: "textarea" },
        { id: "highValueException", label: "高值耗材异常使用", type: "textarea", hint: "超标医生/项目" },
      ],
    },
    {
      id: "tomorrowPlan",
      title: "三、明日安排",
      fields: [
        { id: "paymentPlan", label: "明日付款计划", type: "textarea", required: true, hint: "供应商/金额/是否到期" },
        { id: "inventoryAlert", label: "库存预警", type: "textarea", hint: "低于安全库存项" },
      ],
    },
  ],
};

export const financeSchemas = {
  cashier: cashierSchema,
  accountant: accountantSchema,
  manager: financeManagerSchema,
};









