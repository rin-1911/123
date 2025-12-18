"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
import type { UserSession, DepartmentCode } from "@/lib/types";
import { DEPARTMENT_LABELS, NURSING_WORK_TYPE_LABELS, hasAnyRole } from "@/lib/types";
import { getToday, formatDate } from "@/lib/utils";
import { getFieldHint } from "@/lib/schemas/field-hints";
import { Save, Send, Undo2, Lock, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react";

interface DailyReportFormProps {
  user: UserSession;
}

// 部门字段配置
const DEPARTMENT_FIELDS: Record<DepartmentCode, { key: string; type: "number" | "select" | "text"; options?: string[] }[]> = {
  CONSULTATION: [
    { key: "receptionTotal", type: "number" },
    { key: "initialTotal", type: "number" },
    { key: "dealsTotal", type: "number" },
    { key: "initialDealsTotal", type: "number" },
    { key: "cashInCents", type: "number" },
    { key: "implantLeads", type: "number" },
    { key: "orthoLeads", type: "number" },
    { key: "followupAppointments", type: "number" },
    { key: "followupCallsDone", type: "number" },
  ],
  FRONT_DESK: [
    { key: "newVisits", type: "number" },
    { key: "returningVisits", type: "number" },
    { key: "newAppointments", type: "number" },
    { key: "rescheduledAppointments", type: "number" },
    { key: "canceledAppointments", type: "number" },
    { key: "noShowAppointments", type: "number" },
    { key: "initialTriage", type: "number" },
    { key: "revisitTriage", type: "number" },
    { key: "paymentsCount", type: "number" },
    { key: "refundsCount", type: "number" },
    { key: "complaintsCount", type: "number" },
    { key: "resolvedCount", type: "number" },
  ],
  OFFLINE_MARKETING: [
    { key: "touchpoints", type: "number" },
    { key: "leadsNew", type: "number" },
    { key: "leadsValid", type: "number" },
    { key: "appointmentsBooked", type: "number" },
    { key: "visitsArrived", type: "number" },
    { key: "costInCents", type: "number" },
    { key: "partnershipsNew", type: "number" },
    { key: "partnershipsMaintained", type: "number" },
  ],
  ONLINE_GROWTH: [
    { key: "videosPublished", type: "number" },
    { key: "liveSessions", type: "number" },
    { key: "postsPublished", type: "number" },
    { key: "leadsNew", type: "number" },
    { key: "leadsValid", type: "number" },
    { key: "appointmentsBooked", type: "number" },
    { key: "visitsArrived", type: "number" },
    { key: "adSpendInCents", type: "number" },
    { key: "followupsDone", type: "number" },
    { key: "unreachableCount", type: "number" },
  ],
  MEDICAL: [
    { key: "patientsSeen", type: "number" },
    { key: "rootCanals", type: "number" },
    { key: "fillings", type: "number" },
    { key: "extractions", type: "number" },
    { key: "fixedProsthesisDelivered", type: "number" },
    { key: "removableProsthesisDeliv", type: "number" },
    { key: "implantSurgeries", type: "number" },
    { key: "orthoStarts", type: "number" },
    { key: "orthoFollowups", type: "number" },
    { key: "riskEvents", type: "number" },
  ],
  NURSING: [
    { key: "workType", type: "select", options: ["CHAIR_ASSIST", "STERILIZATION_IMAGING", "HYGIENIST"] },
    { key: "panoramicXrays", type: "number" },
    { key: "cbctScans", type: "number" },
    { key: "intraoralScansPhotos", type: "number" },
    { key: "sterilizerCycles", type: "number" },
    { key: "instrumentPacks", type: "number" },
    { key: "consumableIncidents", type: "number" },
    { key: "doctorsAssisted", type: "number" },
    { key: "overtimeMinutes", type: "number" },
    { key: "hygieneVisits", type: "number" },
    { key: "perioTherapies", type: "number" },
    { key: "referralsToDoctor", type: "number" },
  ],
  FINANCE_HR_ADMIN: [
    { key: "cashInCents", type: "number" },
    { key: "refundsInCents", type: "number" },
    { key: "cashPayInCents", type: "number" },
    { key: "cardPayInCents", type: "number" },
    { key: "onlinePayInCents", type: "number" },
    { key: "expenseTotalInCents", type: "number" },
    { key: "expenseMaterialInCents", type: "number" },
    { key: "expenseProcessingInCents", type: "number" },
    { key: "expenseMarketingInCents", type: "number" },
    { key: "expenseAdminInCents", type: "number" },
    { key: "reconciliationIssues", type: "number" },
    { key: "staffScheduled", type: "number" },
    { key: "staffPresent", type: "number" },
    { key: "staffAbsent", type: "number" },
    { key: "hiresCount", type: "number" },
    { key: "resignationsCount", type: "number" },
    { key: "trainingSessions", type: "number" },
    { key: "traineesCount", type: "number" },
  ],
  HR: [],
  MANAGEMENT: [],
};

export function DailyReportForm({ user }: DailyReportFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [reportDate, setReportDate] = useState(getToday());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [status, setStatus] = useState<"DRAFT" | "SUBMITTED" | null>(null);
  const [formData, setFormData] = useState<Record<string, string | number>>({});
  const [note, setNote] = useState("");

  const departmentCode = user.departmentCode as DepartmentCode;
  const fields = DEPARTMENT_FIELDS[departmentCode] || [];

  // 加载日报数据
  useEffect(() => {
    async function loadReport() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/daily?date=${reportDate}`);
        const data = await res.json();

        setIsLocked(data.isLocked);

        if (data.report) {
          setStatus(data.report.status);
          setNote(data.report.note || "");

          // 根据部门加载对应的明细数据
          const detailKey = getDetailKey(departmentCode);
          const detail = data.report[detailKey];

          if (detail) {
            const newFormData: Record<string, string | number> = {};
            fields.forEach((field) => {
              if (detail[field.key] !== undefined) {
                newFormData[field.key] = detail[field.key];
              }
            });
            setFormData(newFormData);
          } else {
            setFormData({});
          }
        } else {
          setStatus(null);
          setFormData({});
          setNote("");
        }
      } catch {
        toast({
          title: "加载失败",
          description: "无法加载日报数据",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadReport();
  }, [reportDate, departmentCode, fields, toast]);

  // 保存日报
  const handleSave = async (submitStatus: "DRAFT" | "SUBMITTED") => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportDate,
          status: submitStatus,
          data: formData,
          note,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "保存失败");
      }

      setStatus(submitStatus);
      toast({
        title: submitStatus === "SUBMITTED" ? "提交成功" : "保存成功",
        description: submitStatus === "SUBMITTED" ? "日报已提交" : "草稿已保存",
      });

      router.refresh();
    } catch (error) {
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 撤回日报
  const handleWithdraw = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportDate,
          status: "DRAFT",
          data: formData,
          note,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "撤回失败");
      }

      setStatus("DRAFT");
      toast({
        title: "撤回成功",
        description: "日报已撤回为草稿状态",
      });
    } catch (error) {
      toast({
        title: "撤回失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 日期切换
  const changeDate = (days: number) => {
    const date = new Date(reportDate);
    date.setDate(date.getDate() + days);
    setReportDate(formatDate(date));
  };

  const isDisabled = isLocked && !hasAnyRole(user.roles, ["STORE_MANAGER", "HQ_ADMIN"]);

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {DEPARTMENT_LABELS[departmentCode]}日报
                {status && (
                  <Badge variant={status === "SUBMITTED" ? "success" : "warning"}>
                    {status === "SUBMITTED" ? "已提交" : "草稿"}
                  </Badge>
                )}
                {isLocked && (
                  <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                    <Lock className="h-3 w-3 mr-1" />
                    已锁定
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                请认真填写今日工作数据，确保数据准确
              </CardDescription>
            </div>

            {/* 日期选择 */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeDate(-1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-4 py-2 bg-gray-50 rounded-md font-medium min-w-[120px] text-center">
                {reportDate}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeDate(1)}
                disabled={reportDate >= getToday()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
            </div>
          ) : (
            <div className={isDisabled ? "opacity-60 pointer-events-none" : ""}>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {fields.map((field) => {
                  const hint = getFieldHint(field.key);
                  return (
                    <div key={field.key} className="space-y-2">
                      <Label className="flex items-center gap-1.5">
                        {hint.label}
                        {hint.unit && (
                          <span className="text-xs text-gray-400">({hint.unit})</span>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs">
                            <p>{hint.hint}</p>
                          </TooltipContent>
                        </Tooltip>
                      </Label>

                      {field.type === "select" ? (
                        <Select
                          value={String(formData[field.key] || "")}
                          onValueChange={(value) =>
                            setFormData((prev) => ({ ...prev, [field.key]: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="请选择" />
                          </SelectTrigger>
                          <SelectContent>
                            {field.options?.map((option) => (
                              <SelectItem key={option} value={option}>
                                {NURSING_WORK_TYPE_LABELS[option as keyof typeof NURSING_WORK_TYPE_LABELS] || option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type="number"
                          min="0"
                          value={formData[field.key] ?? ""}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              [field.key]: e.target.value ? Number(e.target.value) : "",
                            }))
                          }
                          placeholder="0"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 备注 */}
              <div className="mt-6 space-y-2">
                <Label>备注（选填）</Label>
                <textarea
                  className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="如有特殊情况请在此说明（最多300字）"
                  maxLength={300}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              {/* 操作按钮 */}
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {isLocked ? (
                    <span className="text-orange-600">数据已锁定，无法修改</span>
                  ) : status === "SUBMITTED" ? (
                    <span>如需修改，请先撤回</span>
                  ) : (
                    <span>填写完成后请点击提交</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {status === "SUBMITTED" && !isDisabled && (
                    <Button
                      variant="outline"
                      onClick={handleWithdraw}
                      disabled={isSaving}
                    >
                      <Undo2 className="h-4 w-4 mr-2" />
                      撤回
                    </Button>
                  )}

                  {status !== "SUBMITTED" && !isDisabled && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleSave("DRAFT")}
                        disabled={isSaving}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        保存草稿
                      </Button>
                      <Button
                        onClick={() => handleSave("SUBMITTED")}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        提交
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}

// 获取部门明细表的key
function getDetailKey(departmentCode: DepartmentCode): string {
  const keyMap: Record<DepartmentCode, string> = {
    CONSULTATION: "consultation",
    FRONT_DESK: "frontDesk",
    OFFLINE_MARKETING: "offlineMarketing",
    ONLINE_GROWTH: "onlineGrowth",
    MEDICAL: "medical",
    NURSING: "nursing",
    FINANCE_HR_ADMIN: "financeHrAdmin",
    HR: "",
    MANAGEMENT: "",
  };
  return keyMap[departmentCode];
}

