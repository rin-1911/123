"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { formatNumber } from "@/lib/utils";
import { useState } from "react";

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
  fieldType?: string;
  isCustomField?: boolean;  // 是否为自定义字段
  category?: string;        // 智能分类
  subCategory?: string;     // 子部门/岗位分类
  sourceType?: string;      // 数据来源
  values?: { userId: string; userName: string; reportDate: string; value: unknown }[];
  rowFields?: { id: string; label: string; type: string; dynamicOptionsKey?: string; fullWidth?: boolean }[];
  containerId?: string;
  containerTitle?: string;
  containerOrder?: number;
  fieldOrder?: number;
}

// 组件属性
interface DataSummaryPanelProps {
  departments: DepartmentSummary[];
  storeFields: FieldSummary[];
  period: string;
  dateRange: { start: string; end: string };
  showDetails?: boolean;
}

const FIELD_CATEGORIES: Record<string, { label: string; icon: typeof Users; color: string }> = {
  CONSULTATION: { label: "咨询部", icon: Users, color: "emerald" },
  FINANCE: { label: "财务", icon: DollarSign, color: "yellow" },
  FINANCE_HR_ADMIN: { label: "人事行政", icon: Building2, color: "slate" },
  FRONT_DESK: { label: "前台客服", icon: Building2, color: "blue" },
  MANAGEMENT: { label: "管理层", icon: Building2, color: "indigo" },
  MEDICAL: { label: "医疗部", icon: Users, color: "cyan" },
  NURSING: { label: "护理部", icon: Users, color: "pink" },
  OFFLINE_MARKETING: { label: "线下市场", icon: Users, color: "orange" },
  ONLINE_GROWTH: { label: "网络新媒体", icon: BarChart3, color: "cyan" },
};

const FIELD_CATEGORY_ORDER = [
  "CONSULTATION",
  "FINANCE",
  "FRONT_DESK",
  "FINANCE_HR_ADMIN",
  "MANAGEMENT",
  "MEDICAL",
  "NURSING",
  "OFFLINE_MARKETING",
  "ONLINE_GROWTH",
] as const;

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
  if (field.fieldType && !["number", "money", "calculated"].includes(field.fieldType)) {
    if (field.fieldType === "dynamic_rows") {
      return formatNumber(field.total);
    }
    return formatNumber(field.count);
  }
  if (isMoneyField(field.fieldId, field.fieldLabel)) {
    // 所有金额字段已规范化为元
    return `¥${formatNumber(field.total)}`;
  }
  return formatNumber(field.total);
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function getRowObjects(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v) => v && typeof v === "object" && !Array.isArray(v)) as Record<string, unknown>[];
}

function getContainerKey(field: FieldSummary): string {
  const rawTitle = (field.containerTitle || "").trim();
  if (rawTitle) return `title::${rawTitle}`;
  if (field.fieldType === "dynamic_rows") return "title::数据清单";
  const textKeywords = ["总结", "计划", "说明", "备注"];
  if (field.fieldType === "text" || field.fieldType === "textarea" || textKeywords.some((k) => (field.fieldLabel || "").includes(k))) {
    return "title::当日总结";
  }
  return "title::数据详情";
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
  dateRange,
  showDetails = true
}: DataSummaryPanelProps) {
  const [selectedSubCategoryByDept, setSelectedSubCategoryByDept] = useState<Record<string, string>>({});

  const deptCodeToName = new Map<string, string>();
  for (const d of departments) {
    if (d.departmentCode) deptCodeToName.set(d.departmentCode, d.departmentName);
  }

  const categorizedFields: Record<string, FieldSummary[]> = {};
  for (const dept of departments) {
    const deptKey = dept.departmentCode || "OTHER";
    (categorizedFields[deptKey] ??= []).push(...(dept.fields || []));
  }

  const availableTabCodes = [
    ...FIELD_CATEGORY_ORDER.filter((code) => deptCodeToName.has(code)),
    ...Object.keys(categorizedFields).filter(
      (code) => code !== "OTHER" && !FIELD_CATEGORY_ORDER.includes(code as any)
    ),
  ];

  // 3. 辅助函数：对字段进行分组（按子部门）
  const groupFieldsBySubCategory = (fields: FieldSummary[]) => {
    const groups: Record<string, FieldSummary[]> = {};
    const defaultGroupKey = "通用/其他";
    
    fields.forEach(field => {
      // 优先使用后端返回的 subCategory，如果没有则归为通用
      const subCat = field.subCategory || defaultGroupKey;
      if (!groups[subCat]) groups[subCat] = [];
      groups[subCat].push(field);
    });
    
    // 如果只有一个组且是通用组，或者所有字段都没有子分类，则直接返回列表（不分组显示）
    const groupKeys = Object.keys(groups);
    if (groupKeys.length === 1 && groupKeys[0] === defaultGroupKey) {
      return { hasGroups: false, items: fields };
    }
    
    return { hasGroups: true, groups, defaultGroupKey };
  };

  const groupFieldsByContainer = (fields: FieldSummary[]) => {
    const map = new Map<
      string,
      {
        containerId: string;
        containerTitle: string;
        containerOrder: number;
        fields: FieldSummary[];
      }
    >();

    for (const f of fields) {
      const key = getContainerKey(f);
      const containerTitle = key.startsWith("title::") ? key.slice("title::".length) : "未分组";
      const containerOrder =
        containerTitle === "当日总结" ? 0 :
        containerTitle === "数据详情" ? 10 :
        containerTitle === "数据清单" ? 100 :
        (typeof f.containerOrder === "number" ? f.containerOrder : 9999);
      const containerId = f.containerId || containerTitle;
      const bucket =
        map.get(key) ||
        (() => {
          const next = { containerId, containerTitle, containerOrder, fields: [] as FieldSummary[] };
          map.set(key, next);
          return next;
        })();
      bucket.fields.push(f);
    }

    const containers = Array.from(map.values()).sort((a, b) => {
      if (a.containerOrder !== b.containerOrder) return a.containerOrder - b.containerOrder;
      if (a.containerTitle !== b.containerTitle) return a.containerTitle.localeCompare(b.containerTitle);
      return a.containerId.localeCompare(b.containerId);
    });

    containers.forEach((c) => {
      c.fields.sort((a, b) => {
        const ao = typeof a.fieldOrder === "number" ? a.fieldOrder : 9999;
        const bo = typeof b.fieldOrder === "number" ? b.fieldOrder : 9999;
        if (ao !== bo) return ao - bo;
        return (a.fieldLabel || "").localeCompare(b.fieldLabel || "");
      });
    });

    return containers;
  };

  const renderContainerSections = (fields: FieldSummary[], color: string) => {
    const containers = groupFieldsByContainer(fields);
    return (
      <div className="space-y-8">
        {containers.map((c) => (
          <div key={`${c.containerId}::${c.containerTitle}`} className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-dashed border-gray-200">
              <Badge variant="secondary" className={`bg-${color}-100 text-${color}-700 border-none`}>
                {c.containerTitle}
              </Badge>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {c.fields.map((field) => (
                <div
                  key={`${field.fieldId}::${field.subCategory || ""}::${c.containerId}`}
                  className={`p-4 rounded-xl border bg-gradient-to-br from-${color}-50/50 to-white border-${color}-100 hover:shadow-md transition-all ${
                    field.fieldType === "dynamic_rows" ? "sm:col-span-2 lg:col-span-3 xl:col-span-4" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-sm text-${color}-600 mb-1 font-medium truncate`}>{field.fieldLabel}</p>
                      <p className={`text-2xl font-bold text-${color}-700`}>{formatFieldValue(field)}</p>
                    </div>

                    {Array.isArray(field.values) && field.values.length > 0 && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-8 shrink-0">
                            查看
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>{field.fieldLabel}</DialogTitle>
                          </DialogHeader>
                          {field.fieldType === "dynamic_rows" ? (
                            (() => {
                              const rows = field.values!.flatMap((v) =>
                                getRowObjects(v.value).map((row) => ({
                                  reportDate: v.reportDate,
                                  userName: v.userName,
                                  row,
                                }))
                              );
                              const colSet = new Set<string>();
                              rows.forEach((r) => Object.keys(r.row).forEach((k) => colSet.add(k)));
                              const cols = Array.from(colSet);
                              const colDefs =
                                field.rowFields && field.rowFields.length > 0
                                  ? field.rowFields.map((cc) => ({ id: cc.id, label: cc.label }))
                                  : cols.map((cc) => ({ id: cc, label: cc }));
                              return rows.length === 0 ? (
                                <div className="text-sm text-gray-500 py-6 text-center">暂无清单数据</div>
                              ) : (
                                <div className="max-h-[60vh] overflow-auto border rounded-md">
                                  <table className="w-full text-sm">
                                    <thead className="sticky top-0 bg-white border-b">
                                      <tr>
                                        <th className="text-left p-2 font-medium text-gray-500">日期</th>
                                        <th className="text-left p-2 font-medium text-gray-500">填报人</th>
                                        {colDefs.map((cc) => (
                                          <th key={cc.id} className="text-left p-2 font-medium text-gray-500">
                                            {cc.label}
                                          </th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {rows.map((r, idx) => (
                                        <tr key={idx} className="border-b">
                                          <td className="p-2 text-gray-600">{r.reportDate}</td>
                                          <td className="p-2 text-gray-600">{r.userName}</td>
                                          {colDefs.map((cc) => (
                                            <td key={cc.id} className="p-2 text-gray-800">
                                              {stringifyValue(r.row[cc.id])}
                                            </td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              );
                            })()
                          ) : (
                            <div className="max-h-[60vh] overflow-auto space-y-2">
                              {field.values!.map((v, idx) => (
                                <div key={idx} className="border rounded-md p-3">
                                  <div className="text-xs text-gray-500 mb-2">
                                    {v.reportDate} · {v.userName}
                                  </div>
                                  <div className="text-sm whitespace-pre-wrap break-words">{stringifyValue(v.value)}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>

                  {field.fieldType === "dynamic_rows" && (
                    <div className="mt-3">
                      {(() => {
                        const rows = (field.values || []).flatMap((v) => getRowObjects(v.value));
                        const preview = rows.slice(0, 5);
                        const colDefs =
                          field.rowFields && field.rowFields.length > 0
                            ? field.rowFields.map((cc) => ({ id: cc.id, label: cc.label }))
                            : preview.length > 0
                              ? Object.keys(preview[0]).map((k) => ({ id: k, label: k }))
                              : [];
                        if (!preview.length || !colDefs.length) {
                          return <div className="text-xs text-gray-500">暂无清单预览</div>;
                        }
                        return (
                          <div className="border rounded-md overflow-auto">
                            <table className="w-full text-xs">
                              <thead className="bg-white border-b">
                                <tr>
                                  {colDefs.map((cc) => (
                                    <th key={cc.id} className="text-left p-2 font-medium text-gray-500">
                                      {cc.label}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {preview.map((row, idx) => (
                                  <tr key={idx} className="border-b">
                                    {colDefs.map((cc) => (
                                      <td key={cc.id} className="p-2 text-gray-800">
                                        {stringifyValue((row as any)[cc.id])}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 计算汇总统计
  const totalSubmitted = departments.reduce((sum, d) => sum + d.submittedCount, 0);
  const totalUsers = departments.reduce((sum, d) => sum + d.userCount, 0);
  const overallCompletionRate = totalUsers > 0 ? Math.round((totalSubmitted / totalUsers) * 100) : 0;
  const totalFields = storeFields.length;
  const defaultTab =
    availableTabCodes.find((key) => (categorizedFields[key]?.length || 0) > 0) ||
    availableTabCodes[0] ||
    "FRONT_DESK";

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

        {showDetails && (
          <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="flex flex-wrap h-auto gap-1 bg-transparent p-0 mb-4">
              {availableTabCodes.map((key) => {
                const config = FIELD_CATEGORIES[key] || { label: key, icon: Users, color: "slate" };
                const label = deptCodeToName.get(key) || config.label;
                return (
                  <TabsTrigger 
                    key={key} 
                    value={key}
                    className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary border border-transparent data-[state=active]:border-gray-200"
                  >
                    <config.icon className={`w-4 h-4 mr-2 text-${config.color}-500`} />
                    {label}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {availableTabCodes.map((key) => {
              const config = FIELD_CATEGORIES[key] || { label: key, icon: Users, color: "slate" };
              const label = deptCodeToName.get(key) || config.label;
              return (
              <TabsContent key={key} value={key} className="mt-0">
                <Card>
                  <CardHeader className="pb-3 border-b bg-gray-50/50">
                    <CardTitle className="text-base flex items-center gap-2">
                      <config.icon className={`w-5 h-5 text-${config.color}-600`} />
                      {label}数据汇总
                      <Badge variant="outline" className="ml-2 font-normal">
                        {(() => {
                          const grouped = groupFieldsBySubCategory(categorizedFields[key] || []);
                          if (!grouped.hasGroups) return (categorizedFields[key]?.length || 0) + " 项指标";
                          const groups = (grouped as any).groups as Record<string, FieldSummary[]> | undefined;
                          const defaultGroupKey = (grouped as any).defaultGroupKey as string | undefined;
                          const groupKeys = Object.keys(groups || {});
                          const dk = defaultGroupKey || "通用/其他";
                          const sortedGroupKeys = [...groupKeys].sort((a, b) => {
                            if (a === dk && b !== dk) return 1;
                            if (b === dk && a !== dk) return -1;
                            return a.localeCompare(b);
                          });
                          const fallbackSelected = sortedGroupKeys.find((k) => k !== dk) || sortedGroupKeys[0] || dk;
                          const selectedSubCat = sortedGroupKeys.includes(selectedSubCategoryByDept[key] || "")
                            ? (selectedSubCategoryByDept[key] as string)
                            : fallbackSelected;
                          const selectedFields = (groups && groups[selectedSubCat]) || [];
                          return selectedFields.length + " 项指标";
                        })()}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {categorizedFields[key] && categorizedFields[key].length > 0 ? (
                      (() => {
                        const grouped = groupFieldsBySubCategory(categorizedFields[key]);
                        const hasGroups = grouped.hasGroups;
                        const groups = (grouped as any).groups as Record<string, FieldSummary[]> | undefined;
                        const items = (grouped as any).items as FieldSummary[] | undefined;
                        const defaultGroupKey = (grouped as any).defaultGroupKey as string | undefined;
                        
                        if (!hasGroups) {
                          return renderContainerSections(items || [], config.color);
                        } else {
                          const groupKeys = Object.keys(groups!);
                          const dk = defaultGroupKey || "通用/其他";
                          const sortedGroupKeys = [...groupKeys].sort((a, b) => {
                            if (a === dk && b !== dk) return 1;
                            if (b === dk && a !== dk) return -1;
                            return a.localeCompare(b);
                          });

                          const fallbackSelected =
                            sortedGroupKeys.find((k) => k !== dk) || sortedGroupKeys[0] || dk;
                          const selectedSubCat = sortedGroupKeys.includes(selectedSubCategoryByDept[key] || "")
                            ? (selectedSubCategoryByDept[key] as string)
                            : fallbackSelected;
                          const selectedFields = groups![selectedSubCat] || [];

                          return (
                            <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                <Badge variant="secondary" className={`bg-${config.color}-100 text-${config.color}-700 border-none`}>
                                  子部门
                                </Badge>
                                <div className="w-[220px]">
                                  <Select
                                    value={selectedSubCat}
                                    onValueChange={(v) => setSelectedSubCategoryByDept((prev) => ({ ...prev, [key]: v }))}
                                  >
                                    <SelectTrigger className="h-9">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {sortedGroupKeys.map((gk) => (
                                        <SelectItem key={gk} value={gk}>
                                          {gk}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                </Select>
                              </div>
                              </div>

                              {renderContainerSections(selectedFields, config.color)}
                            </div>
                          );
                        }
                      })()
                    ) : (
                      <div className="text-center py-12 text-gray-400">
                        <config.icon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>暂无{label}数据</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              );
            })}
          </Tabs>
        )}

        {/* 其他字段 - 已移除显示 */}
      </div>
    </TooltipProvider>
  );
}
