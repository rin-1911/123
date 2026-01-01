"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  BarChart3,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info
} from "lucide-react";
import { formatNumber, centsToYuan, cn } from "@/lib/utils";

// 部门汇总数据类型
interface DepartmentSummary {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  userCount: number;
  submittedCount: number;
  completionRate: number;
  fields: FieldSummary[];
}

// 字段汇总数据类型
interface FieldSummary {
  fieldId: string;
  fieldLabel: string;
  total: number;
  count: number;
  average: number;
  isCustomField?: boolean;  // 是否为自定义字段
  category?: string;        // 智能分类
  sourceType?: string;      // 数据来源
}

// 组件属性
interface DataSummaryPanelProps {
  departments: DepartmentSummary[];
  storeFields: FieldSummary[];
  period: string;
  dateRange: { start: string; end: string };
}

// 字段分类 - 使用规范化后的字段ID
const FIELD_CATEGORIES: Record<string, { label: string; icon: typeof Users; color: string; fields: string[] }> = {
  revenue: {
    label: "业绩收入",
    icon: DollarSign,
    color: "emerald",
    fields: ["actualRevenue", "expectedRevenue", "firstVisitAmount", "returnVisitAmount", "teamCashInYuan", "actualExpense", "netRevenue", "业绩", "收入", "金额"],
  },
  visits: {
    label: "到院统计",
    icon: Users,
    color: "blue",
    fields: ["totalVisitors", "firstVisitCount", "returnVisitCount", "receptionTotal", "到院", "初诊", "复诊"],
  },
  deals: {
    label: "成交转化",
    icon: TrendingUp,
    color: "cyan",
    fields: ["dealCount", "noDealCount", "teamDealCount", "成交", "转化"],
  },
  leads: {
    label: "线索获取",
    icon: BarChart3,
    color: "purple",
    fields: ["newLeads", "validLeads", "wechatAdded", "implantIntention", "orthoIntention", "线索", "意向"],
  },
};

// 判断字段属于哪个分类
function getFieldCategory(fieldId: string, fieldLabel: string): string {
  for (const [category, config] of Object.entries(FIELD_CATEGORIES)) {
    if (config.fields.some(f => 
      fieldId.toLowerCase().includes(f.toLowerCase()) || 
      fieldLabel.includes(f)
    )) {
      return category;
    }
  }
  return "other";
}

// 判断是否为金额字段
// 规范化后的金额字段：actualRevenue, expectedRevenue, refundAmount, firstVisitAmount, 
// returnVisitAmount, marketingCost, teamCashInYuan, adSpend 等
function isMoneyField(fieldId: string, fieldLabel: string): boolean {
  const moneyFieldIds = [
    "actualrevenue", "expectedrevenue", "refundamount", "firstvisitamount",
    "returnvisitamount", "marketingcost", "teamcashinyuan", "adspend",
    "depositamount", "implant_amount", "ortho_amount", "restore_amount",
    "pediatric_amount", "other_amount", "actualexpense", "netrevenue"
  ];
  const moneyKeywords = ["金额", "业绩", "收入", "费用", "退费", "成交金额", "支出", "实收"];
  
  return moneyFieldIds.includes(fieldId.toLowerCase()) ||
    moneyKeywords.some(k => fieldLabel.includes(k));
}

// 格式化数值显示
// 注意：规范化后的金额字段已统一为元，不需要转换
function formatFieldValue(field: FieldSummary): string {
  if (isMoneyField(field.fieldId, field.fieldLabel)) {
    // 所有金额字段已规范化为元
    return `¥${formatNumber(field.total)}`;
  }
  return formatNumber(field.total);
}

// 完成率徽章
function CompletionBadge({ rate }: { rate: number }) {
  if (rate >= 80) {
    return (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
        <CheckCircle2 className="w-3 h-3 mr-1" />
        {rate}%
      </Badge>
    );
  } else if (rate >= 50) {
    return (
      <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
        <Minus className="w-3 h-3 mr-1" />
        {rate}%
      </Badge>
    );
  } else {
    return (
      <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
        <AlertCircle className="w-3 h-3 mr-1" />
        {rate}%
      </Badge>
    );
  }
}

// 数值趋势指示器
function TrendIndicator({ value }: { value: number }) {
  if (value > 0) {
    return <ArrowUpRight className="w-4 h-4 text-green-500" />;
  } else if (value < 0) {
    return <ArrowDownRight className="w-4 h-4 text-red-500" />;
  }
  return <Minus className="w-4 h-4 text-gray-400" />;
}

export function DataSummaryPanel({ 
  departments, 
  storeFields, 
  period,
  dateRange 
}: DataSummaryPanelProps) {
  // 按分类整理字段
  const categorizedFields: Record<string, FieldSummary[]> = {
    revenue: [],
    visits: [],
    deals: [],
    leads: [],
    other: [],
  };

  for (const field of storeFields) {
    const category = getFieldCategory(field.fieldId, field.fieldLabel);
    if (!categorizedFields[category]) {
      categorizedFields[category] = [];
    }
    categorizedFields[category].push(field);
  }

  // 计算汇总统计
  const totalSubmitted = departments.reduce((sum, d) => sum + d.submittedCount, 0);
  const totalUsers = departments.reduce((sum, d) => sum + d.userCount, 0);
  const overallCompletionRate = totalUsers > 0 ? Math.round((totalSubmitted / totalUsers) * 100) : 0;
  const totalFields = storeFields.length;

  // 没有数据时的显示
  if (storeFields.length === 0 && departments.every(d => d.submittedCount === 0)) {
    return (
      <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50">
        <CardContent className="py-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">暂无数据汇总</h3>
          <p className="text-sm text-gray-400">
            当前日期范围内没有已提交的日报数据
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {dateRange.start === dateRange.end ? dateRange.start : `${dateRange.start} ~ ${dateRange.end}`}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* 顶部统计概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-600 font-medium">日报提交</p>
                  <p className="text-2xl font-bold text-blue-700">{totalSubmitted}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-blue-500 mt-2">共 {totalUsers} 人需提交</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-600 font-medium">完成率</p>
                  <p className="text-2xl font-bold text-emerald-700">{overallCompletionRate}%</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              <div className="w-full bg-emerald-100 rounded-full h-1.5 mt-2">
                <div 
                  className="bg-emerald-500 h-1.5 rounded-full transition-all" 
                  style={{ width: `${Math.min(overallCompletionRate, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-100">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-600 font-medium">统计部门</p>
                  <p className="text-2xl font-bold text-purple-700">{departments.filter(d => d.submittedCount > 0).length}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-purple-500 mt-2">共 {departments.length} 个部门</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-100">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-amber-600 font-medium">汇总字段</p>
                  <p className="text-2xl font-bold text-amber-700">{totalFields}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <p className="text-xs text-amber-500 mt-2">数据指标项</p>
            </CardContent>
          </Card>
        </div>

        {/* 分类数据展示 */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="all" className="text-xs sm:text-sm">全部</TabsTrigger>
            <TabsTrigger value="revenue" className="text-xs sm:text-sm">💰 收入</TabsTrigger>
            <TabsTrigger value="visits" className="text-xs sm:text-sm">👥 到院</TabsTrigger>
            <TabsTrigger value="deals" className="text-xs sm:text-sm">📈 成交</TabsTrigger>
            <TabsTrigger value="department" className="text-xs sm:text-sm">🏢 部门</TabsTrigger>
          </TabsList>

          {/* 全部数据 */}
          <TabsContent value="all" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-600" />
                  全店数据汇总
                  <Badge variant="outline" className="ml-auto font-normal">
                    {storeFields.length} 项指标
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* 所有指标字段 */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {storeFields.map((field) => (
                    <div
                      key={field.fieldId}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg transition-colors",
                        field.isCustomField 
                          ? "bg-purple-50/50 border border-purple-100 hover:bg-purple-100/50" 
                          : "bg-gray-50 hover:bg-gray-100"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className={cn(
                              "text-sm truncate cursor-help",
                              field.isCustomField ? "text-purple-700" : "text-gray-600"
                            )}>
                              {field.fieldLabel}
                              {field.isCustomField && <span className="ml-1 text-purple-400">★</span>}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent>
                            {field.isCustomField && <p className="text-purple-500 font-bold mb-1">自定义字段</p>}
                            <p>填报次数: {field.count}人</p>
                            <p>平均值: {field.average.toFixed(2)}</p>
                            <p className="text-[10px] text-gray-400 mt-1">ID: {field.fieldId}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="text-right ml-2">
                        <p className={cn(
                          "text-lg font-semibold",
                          isMoneyField(field.fieldId, field.fieldLabel) ? "text-emerald-600" : "text-gray-900"
                        )}>
                          {formatFieldValue(field)}
                        </p>
                        <p className="text-xs text-gray-400">{field.count}人</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 收入数据 */}
          <TabsContent value="revenue" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  业绩收入汇总
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categorizedFields.revenue.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {categorizedFields.revenue.map((field) => (
                      <div
                        key={field.fieldId}
                        className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-100"
                      >
                        <p className="text-sm text-emerald-600 mb-1">{field.fieldLabel}</p>
                        <p className="text-2xl font-bold text-emerald-700">
                          {formatFieldValue(field)}
                        </p>
                        <p className="text-xs text-emerald-500 mt-1">
                          {field.count} 人填报 · 均值 {isMoneyField(field.fieldId, field.fieldLabel) ? `¥${(field.average).toFixed(0)}` : field.average.toFixed(1)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>暂无收入类数据</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 到院数据 */}
          <TabsContent value="visits" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  到院统计汇总
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categorizedFields.visits.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {categorizedFields.visits.map((field) => (
                      <div
                        key={field.fieldId}
                        className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100"
                      >
                        <p className="text-sm text-blue-600 mb-1">{field.fieldLabel}</p>
                        <p className="text-2xl font-bold text-blue-700">
                          {formatNumber(field.total)}
                        </p>
                        <p className="text-xs text-blue-500 mt-1">
                          {field.count} 人填报 · 均值 {field.average.toFixed(1)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>暂无到院类数据</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 成交数据 */}
          <TabsContent value="deals" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-cyan-600" />
                  成交转化汇总
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(categorizedFields.deals.length > 0 || categorizedFields.leads.length > 0) ? (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {[...categorizedFields.deals, ...categorizedFields.leads].map((field) => (
                      <div
                        key={field.fieldId}
                        className="p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-100"
                      >
                        <p className="text-sm text-cyan-600 mb-1">{field.fieldLabel}</p>
                        <p className="text-2xl font-bold text-cyan-700">
                          {formatFieldValue(field)}
                        </p>
                        <p className="text-xs text-cyan-500 mt-1">
                          {field.count} 人填报 · 均值 {field.average.toFixed(1)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>暂无成交类数据</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 部门明细 */}
          <TabsContent value="department" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {departments.map((dept) => (
                <Card key={dept.departmentId} className={dept.submittedCount > 0 ? "" : "opacity-60"}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        {dept.departmentName}
                      </span>
                      <CompletionBadge rate={dept.completionRate} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-500 mb-3">
                      {dept.submittedCount} / {dept.userCount} 人提交
                    </p>
                    {dept.fields.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {dept.fields.slice(0, 8).map((field) => (
                          <div 
                            key={field.fieldId} 
                            className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-0"
                          >
                            <span className="text-gray-600 truncate max-w-[60%]">{field.fieldLabel}</span>
                            <span className={`font-medium ${isMoneyField(field.fieldId, field.fieldLabel) ? "text-emerald-600" : "text-gray-900"}`}>
                              {formatFieldValue(field)}
                            </span>
                          </div>
                        ))}
                        {dept.fields.length > 8 && (
                          <p className="text-xs text-gray-400 pt-1">
                            +{dept.fields.length - 8} 更多字段
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-4">暂无数据</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* 其他字段 - 默认折叠 */}
        {categorizedFields.other.length > 0 && (
          <details className="group">
            <summary className="list-none cursor-pointer">
              <Card className="hover:bg-gray-50/50 transition-colors">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="w-4 h-4 text-gray-500" />
                    其他统计数据
                    <Badge variant="outline" className="font-normal">
                      {categorizedFields.other.length} 项
                    </Badge>
                    <span className="ml-auto text-xs text-gray-400 group-open:hidden">点击展开 ▼</span>
                    <span className="ml-auto text-xs text-gray-400 hidden group-open:inline">点击收起 ▲</span>
                  </CardTitle>
                </CardHeader>
              </Card>
            </summary>
            <Card className="mt-[-1px] rounded-t-none border-t-0">
              <CardContent className="pt-2">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {categorizedFields.other.map((field) => (
                    <div
                      key={field.fieldId}
                      className="flex items-center justify-between p-2 rounded bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <span className="text-sm text-gray-600 truncate">{field.fieldLabel}</span>
                      <span className="font-medium text-gray-900 ml-2">
                        {formatFieldValue(field)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </details>
        )}
      </div>
    </TooltipProvider>
  );
}

