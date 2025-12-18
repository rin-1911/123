"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import type { UserSession } from "@/lib/types";
import { getToday, centsToYuan, calcPercentage, formatNumber } from "@/lib/utils";
import { 
  ChevronLeft, 
  ChevronRight, 
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  Target,
  Phone,
  AlertTriangle,
  HelpCircle,
  BarChart3
} from "lucide-react";
import { DataSummaryPanel } from "./data-summary-panel";
import { CollapsibleCard, QuickSummary } from "@/components/ui/collapsible-card";

interface StoreReportViewProps {
  user: UserSession;
  stores: { id: string; code: string; name: string }[];
}

interface ReportData {
  period: string;
  dateRange: { start: string; end: string };
  summary: {
    totalAppointments: number;
    totalVisits: number;
    totalNewVisits: number;
    totalReturningVisits: number;
    totalInitial: number;
    totalDeals: number;
    totalInitialDeals: number;
    totalCashConsult: number;
    totalCashFinance: number;
    totalRefunds: number;
    totalFollowupAppts: number;
    totalComplaints: number;
    totalNoShows: number;
    totalLeadsOffline: number;
    totalLeadsOnline: number;
    totalLeadsValid: number;
    totalMarketingCost: number;
    totalImplantLeads: number;
    totalOrthoLeads: number;
  };
  rates: {
    initialConversionRate: string;
    visitRate: string;
    avgDealAmount: number;
    leadsValidRate: string;
  };
  dailyTrend: {
    date: string;
    visits: number;
    initial: number;
    deals: number;
    cash: number;
  }[];
  deptEfficiency: {
    consultation: {
      reports: number;
      avgReception: number;
      avgDeals: number;
      avgCash: number;
    };
    frontDesk: {
      reports: number;
      avgVisits: number;
      avgAppointments: number;
    };
    marketing: {
      reports: number;
      totalLeads: number;
      totalValid: number;
      totalCost: number;
      costPerLead: number;
    };
  };
}

// 自定义字段汇总数据
interface AggregateData {
  departments: {
    departmentId: string;
    departmentCode: string;
    departmentName: string;
    userCount: number;
    submittedCount: number;
    completionRate: number;
    fields: {
      fieldId: string;
      fieldLabel: string;
      total: number;
      count: number;
      average: number;
    }[];
  }[];
  storeFields: {
    fieldId: string;
    fieldLabel: string;
    total: number;
    count: number;
    average: number;
  }[];
}

// 字段 ID 映射：将报表指标映射到规范化后的字段 ID
// 注意：后端已做规范化处理，这里直接匹配规范化后的字段ID
const FIELD_MAPPINGS: Record<string, string[]> = {
  // 到店人数 - 规范化为 totalVisitors
  visits: ["totalVisitors"],
  // 初诊人数 - 规范化为 firstVisitCount
  newVisits: ["firstVisitCount"],
  // 复诊人数 - 规范化为 returnVisitCount
  returnVisits: ["returnVisitCount"],
  // 接诊人数 - 规范化为 receptionTotal
  initial: ["firstVisitCount", "receptionTotal"],
  // 初诊成交
  initialDeals: ["initialDealsTotal"],
  // 成交人数 - 规范化为 dealCount
  deals: ["dealCount"],
  // 实收业绩 - 规范化为 actualRevenue（已统一为元）
  cash: ["actualRevenue"],
  // 退费 - 规范化为 refundAmount
  refunds: ["refundAmount"],
  // 预约相关
  appointments: ["newAppointments", "appointmentsMade"],
  noShows: ["noShowTotal"],
  followups: ["followupAppointments"],
  // 线索相关
  leads: ["newLeads"],
  validLeads: ["validLeads"],
  // 意向相关
  implant: ["implantIntention"],
  ortho: ["orthoIntention"],
  // 投诉
  complaints: ["complaintsCount"],
  // 微信添加
  wechat: ["wechatAdded"],
  // 到店人数（市场）
  arrived: ["arrivedCount"],
};

// 从智能汇总数据中获取字段值
function getAggregateFieldValue(aggregateData: AggregateData | null, fieldIds: string[]): number {
  if (!aggregateData) return 0;
  let total = 0;
  const matchedFields = new Set<string>(); // 避免重复计算
  
  for (const field of aggregateData.storeFields) {
    // 精确匹配或包含匹配
    const isMatch = fieldIds.some(id => {
      const fieldIdLower = field.fieldId.toLowerCase();
      const idLower = id.toLowerCase();
      return fieldIdLower === idLower || 
             fieldIdLower.includes(idLower) || 
             idLower.includes(fieldIdLower) ||
             field.fieldLabel.includes(id);
    });
    
    if (isMatch && !matchedFields.has(field.fieldId)) {
      matchedFields.add(field.fieldId);
      total += field.total;
    }
  }
  return total;
}

export function StoreReportView({ user, stores }: StoreReportViewProps) {
  const { toast } = useToast();
  const [selectedStoreId, setSelectedStoreId] = useState(user.storeId || stores[0]?.id || "");
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [reportDate, setReportDate] = useState(getToday());
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<ReportData | null>(null);
  const [aggregateData, setAggregateData] = useState<AggregateData | null>(null);

  // 合并指标：优先使用智能汇总数据（已规范化），如果为0则回退到传统数据
  const getMergedValue = (traditionalValue: number, metricKey: string): number => {
    const fieldIds = FIELD_MAPPINGS[metricKey] || [metricKey];
    const aggregateValue = getAggregateFieldValue(aggregateData, fieldIds);
    // 优先使用智能汇总（已规范化去重）
    if (aggregateValue > 0) return aggregateValue;
    return traditionalValue;
  };
  
  // 获取金额值
  // 智能汇总数据已统一为元，传统数据是分
  const getMergedMoneyValue = (traditionalCents: number, metricKey: string): number => {
    const fieldIds = FIELD_MAPPINGS[metricKey] || [metricKey];
    const aggregateYuan = getAggregateFieldValue(aggregateData, fieldIds);
    // 智能汇总返回的是元，需要转成分以保持与传统数据一致
    if (aggregateYuan > 0) return aggregateYuan * 100;
    return traditionalCents;
  };

  // 加载报表数据（并行加载传统数据和智能汇总数据）
  useEffect(() => {
    async function loadReport() {
      if (!selectedStoreId) return;

      setIsLoading(true);
      try {
        // 并行请求两个 API
        const [storeRes, aggregateRes] = await Promise.all([
          fetch(`/api/reports/store?storeId=${selectedStoreId}&period=${period}&date=${reportDate}`),
          fetch(`/api/reports/aggregate?storeId=${selectedStoreId}&period=${period}&date=${reportDate}`),
        ]);

        const [storeResult, aggregateResult] = await Promise.all([
          storeRes.json(),
          aggregateRes.json(),
        ]);

        if (!storeRes.ok) {
          throw new Error(storeResult.error);
        }

        setData(storeResult);
        
        if (aggregateRes.ok && aggregateResult.success) {
          setAggregateData({
            departments: aggregateResult.departments || [],
            storeFields: aggregateResult.storeFields || [],
          });
          
          // 调试输出：查看智能汇总返回的数据
          console.log("智能汇总数据:", aggregateResult);
        } else {
          console.log("智能汇总API失败或无数据:", aggregateResult);
        }
      } catch {
        toast({
          title: "加载失败",
          description: "无法加载报表数据",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadReport();
  }, [selectedStoreId, period, reportDate, toast]);

  // 日期切换
  const changeDate = (days: number) => {
    const date = new Date(reportDate);
    date.setDate(date.getDate() + days);
    setReportDate(date.toISOString().split("T")[0]);
  };

  const selectedStore = stores.find((s) => s.id === selectedStoreId);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* 筛选栏 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center gap-4">
              {/* 门店选择 */}
              {stores.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">门店：</span>
                  <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {stores.map((store) => (
                        <SelectItem key={store.id} value={store.id}>
                          {store.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* 周期选择 */}
              <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
                <TabsList>
                  <TabsTrigger value="day">日报</TabsTrigger>
                  <TabsTrigger value="week">周报</TabsTrigger>
                  <TabsTrigger value="month">月报</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* 日期选择 */}
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => changeDate(period === "day" ? -1 : period === "week" ? -7 : -30)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="px-4 py-2 bg-gray-50 rounded-md font-medium min-w-[200px] text-center">
                  {data?.dateRange
                    ? period === "day"
                      ? reportDate
                      : `${data.dateRange.start} ~ ${data.dateRange.end}`
                    : reportDate}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => changeDate(period === "day" ? 1 : period === "week" ? 7 : 30)}
                  disabled={reportDate >= getToday()}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 智能数据汇总面板 */}
        {!isLoading && aggregateData && (
          <DataSummaryPanel
            departments={aggregateData.departments}
            storeFields={aggregateData.storeFields}
            period={period}
            dateRange={data?.dateRange || { start: reportDate, end: reportDate }}
          />
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600" />
          </div>
        ) : data ? (
          <>
            {/* 核心指标卡片 - 使用合并数据 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="到店人数"
                value={formatNumber(getMergedValue(data.summary.totalVisits, "visits"))}
                subValue={`新客 ${getMergedValue(data.summary.totalNewVisits, "newVisits")} / 老客 ${getMergedValue(data.summary.totalReturningVisits, "returnVisits")}`}
                icon={Users}
                hint="总到院人数（智能汇总）"
                trend={null}
              />

              <MetricCard
                title="初诊人数"
                value={formatNumber(getMergedValue(data.summary.totalInitial, "initial"))}
                subValue={`成交 ${getMergedValue(data.summary.totalInitialDeals, "initialDeals")} 人`}
                icon={Target}
                hint="首次到店就诊的患者数量"
                trend={null}
              />

              <MetricCard
                title="成交人数"
                value={formatNumber(getMergedValue(data.summary.totalDeals, "deals"))}
                subValue={`初诊成交率 ${data.rates.initialConversionRate}%`}
                icon={TrendingUp}
                hint="当日完成付费的患者数量"
                trend={null}
              />

              <MetricCard
                title="实收金额"
                value={`¥${centsToYuan(getMergedMoneyValue(data.summary.totalCashConsult, "cash"))}`}
                subValue={`客单 ¥${centsToYuan(data.rates.avgDealAmount)}`}
                icon={DollarSign}
                hint="实收业绩金额"
                trend={null}
                highlight
              />
            </div>

            {/* 第二行指标 - 使用合并数据 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="预约人数"
                value={formatNumber(getMergedValue(data.summary.totalAppointments, "appointments"))}
                subValue={`爽约 ${getMergedValue(data.summary.totalNoShows, "noShows")} 人`}
                icon={Calendar}
                hint="前台登记的新增预约数量"
                trend={null}
              />

              <MetricCard
                title="复诊预约"
                value={formatNumber(getMergedValue(data.summary.totalFollowupAppts, "followups"))}
                subValue="未来7天"
                icon={Phone}
                hint="咨询师预约的未来复诊人数"
                trend={null}
              />

              <MetricCard
                title="线索获取"
                value={formatNumber(getMergedValue(data.summary.totalLeadsOffline + data.summary.totalLeadsOnline, "leads"))}
                subValue={`有效 ${getMergedValue(data.summary.totalLeadsValid, "validLeads")} 条 (${data.rates.leadsValidRate}%)`}
                icon={Users}
                hint="线下市场 + 网络新媒体获取的线索"
                trend={null}
              />

              <MetricCard
                title="投诉/差评"
                value={formatNumber(getMergedValue(data.summary.totalComplaints, "complaints"))}
                subValue="需关注"
                icon={AlertTriangle}
                hint="前台登记的投诉和差评数量"
                trend={null}
                warning={getMergedValue(data.summary.totalComplaints, "complaints") > 0}
              />
            </div>

            {/* 意向统计 - 使用合并数据 */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    大项意向统计
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        咨询师统计的种植和正畸意向患者数量
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg">
                      <p className="text-sm text-gray-500">种植意向</p>
                      <p className="text-3xl font-bold text-cyan-600 mt-1">
                        {getMergedValue(data.summary.totalImplantLeads, "implant")}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                      <p className="text-sm text-gray-500">正畸意向</p>
                      <p className="text-3xl font-bold text-purple-600 mt-1">
                        {getMergedValue(data.summary.totalOrthoLeads, "ortho")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    财务对账
                    <Tooltip>
                      <TooltipTrigger>
                        <HelpCircle className="h-4 w-4 text-gray-400" />
                      </TooltipTrigger>
                      <TooltipContent>
                        财务部门统计的收款与退款数据
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                      <p className="text-sm text-gray-500">财务实收</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">
                        ¥{centsToYuan(getMergedMoneyValue(data.summary.totalCashFinance, "cash"))}
                      </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg">
                      <p className="text-sm text-gray-500">退款金额</p>
                      <p className="text-2xl font-bold text-red-600 mt-1">
                        ¥{centsToYuan(getMergedMoneyValue(data.summary.totalRefunds, "refunds"))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 智能数据统计面板 */}
            {aggregateData && aggregateData.departments && aggregateData.departments.length > 0 && (
              <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-cyan-50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="text-emerald-700">🧠 智能数据汇总</span>
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                      {aggregateData.storeFields?.length || 0} 项指标
                    </Badge>
                    {aggregateData.storeFields?.some((f: { fieldId: string; isCustomField?: boolean }) => f.isCustomField) && (
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                        含自定义字段
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* 显示前8个最重要的汇总指标 */}
                    {aggregateData.storeFields?.slice(0, 8).map((field: { 
                      fieldId: string; 
                      fieldLabel: string; 
                      total: number; 
                      count: number;
                      isCustomField?: boolean;
                      category?: string;
                    }) => (
                      <div 
                        key={field.fieldId}
                        className={`p-3 rounded-lg ${
                          field.isCustomField 
                            ? "bg-purple-100/50 border border-purple-200" 
                            : "bg-white/70 border border-emerald-100"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-xs ${field.isCustomField ? "text-purple-600" : "text-gray-500"}`}>
                            {field.fieldLabel}
                            {field.isCustomField && <span className="ml-1">★</span>}
                          </p>
                          <span className="text-xs text-gray-400">{field.count}人</span>
                        </div>
                        <p className={`text-xl font-bold ${
                          field.category === "revenue" ? "text-emerald-600" : 
                          field.isCustomField ? "text-purple-700" : "text-gray-900"
                        }`}>
                          {field.category === "revenue" ? `¥${formatNumber(field.total)}` : formatNumber(field.total)}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  {/* 部门提交情况 */}
                  <div className="mt-4 pt-4 border-t border-emerald-200">
                    <p className="text-sm font-medium text-emerald-700 mb-2">部门提交情况</p>
                    <div className="flex flex-wrap gap-2">
                      {aggregateData.departments.map((dept: {
                        departmentId: string;
                        departmentName: string;
                        userCount: number;
                        submittedCount: number;
                        completionRate: number;
                      }) => (
                        <div 
                          key={dept.departmentId}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                            dept.completionRate >= 80 
                              ? "bg-green-100 text-green-700" 
                              : dept.completionRate >= 50 
                                ? "bg-yellow-100 text-yellow-700" 
                                : "bg-red-100 text-red-700"
                          }`}
                        >
                          {dept.departmentName}: {dept.submittedCount}/{dept.userCount} ({dept.completionRate}%)
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 部门人效 - 默认折叠 */}
            <CollapsibleCard
              title="部门人效统计"
              icon={<BarChart3 className="h-4 w-4 text-gray-500" />}
              priority="low"
              summary={
                <QuickSummary items={[
                  { label: "咨询", value: `${data.deptEfficiency.consultation.reports}份` },
                  { label: "前台", value: `${data.deptEfficiency.frontDesk.reports}份` },
                  { label: "市场", value: `${data.deptEfficiency.marketing.reports}份` },
                ]} />
              }
            >
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    💬 咨询部
                    <Badge variant="outline" className="font-normal text-xs">
                      {data.deptEfficiency.consultation.reports}份
                    </Badge>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">人均接诊</span>
                      <span className="font-medium">{data.deptEfficiency.consultation.avgReception}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">人均成交</span>
                      <span className="font-medium">{data.deptEfficiency.consultation.avgDeals}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">人均实收</span>
                      <span className="font-medium text-green-600">¥{centsToYuan(data.deptEfficiency.consultation.avgCash)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    🏪 前台客服
                    <Badge variant="outline" className="font-normal text-xs">
                      {data.deptEfficiency.frontDesk.reports}份
                    </Badge>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">人均接待</span>
                      <span className="font-medium">{data.deptEfficiency.frontDesk.avgVisits}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">人均预约</span>
                      <span className="font-medium">{data.deptEfficiency.frontDesk.avgAppointments}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                  <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                    📢 市场推广
                    <Badge variant="outline" className="font-normal text-xs">
                      {data.deptEfficiency.marketing.reports}份
                    </Badge>
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">总线索</span>
                      <span className="font-medium">{data.deptEfficiency.marketing.totalLeads}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">有效线索</span>
                      <span className="font-medium text-green-600">{data.deptEfficiency.marketing.totalValid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">获客成本</span>
                      <span className="font-medium">¥{centsToYuan(data.deptEfficiency.marketing.costPerLead)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleCard>


            {/* 趋势图（简化版，用表格展示）- 默认折叠 */}
            {period !== "day" && data.dailyTrend.length > 1 && (
              <CollapsibleCard
                title="每日趋势明细"
                icon={<TrendingUp className="h-4 w-4 text-gray-500" />}
                priority="low"
                summary={
                  <span className="text-sm text-gray-500">
                    共 {data.dailyTrend.length} 天数据
                  </span>
                }
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left py-2.5 px-3 font-semibold text-gray-700">日期</th>
                        <th className="text-right py-2.5 px-3 font-semibold text-gray-700">到店</th>
                        <th className="text-right py-2.5 px-3 font-semibold text-gray-700">初诊</th>
                        <th className="text-right py-2.5 px-3 font-semibold text-gray-700">成交</th>
                        <th className="text-right py-2.5 px-3 font-semibold text-gray-700">实收</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.dailyTrend.map((day, index) => (
                        <tr key={day.date} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                          <td className="py-2.5 px-3 font-medium">{day.date}</td>
                          <td className="py-2.5 px-3 text-right">{day.visits}</td>
                          <td className="py-2.5 px-3 text-right">{day.initial}</td>
                          <td className="py-2.5 px-3 text-right">{day.deals}</td>
                          <td className="py-2.5 px-3 text-right font-medium text-green-600">¥{centsToYuan(day.cash)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CollapsibleCard>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="py-20 text-center text-gray-500">
              暂无数据
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}

// 指标卡片组件
function MetricCard({
  title,
  value,
  subValue,
  icon: Icon,
  hint,
  trend,
  highlight,
  warning,
}: {
  title: string;
  value: string;
  subValue: string;
  icon: React.ComponentType<{ className?: string }>;
  hint: string;
  trend: number | null;
  highlight?: boolean;
  warning?: boolean;
}) {
  return (
    <Card className={highlight ? "border-cyan-200 bg-gradient-to-br from-cyan-50 to-blue-50" : warning ? "border-orange-200" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-500 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Icon className={`h-4 w-4 ${warning ? "text-orange-500" : ""}`} />
            {title}
          </span>
          <Tooltip>
            <TooltipTrigger>
              <HelpCircle className="h-3.5 w-3.5 text-gray-400" />
            </TooltipTrigger>
            <TooltipContent>
              <p>{hint}</p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${highlight ? "text-cyan-600" : warning ? "text-orange-600" : ""}`}>
          {value}
        </div>
        <p className="text-xs text-gray-500 mt-1">{subValue}</p>
        {trend !== null && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${trend >= 0 ? "text-green-600" : "text-red-600"}`}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend)}% vs 上期
          </div>
        )}
      </CardContent>
    </Card>
  );
}





