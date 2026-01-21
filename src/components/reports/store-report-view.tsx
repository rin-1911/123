"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import type { UserSession } from "@/lib/types";
import { getToday } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { DataSummaryPanel } from "./data-summary-panel";

interface StoreReportViewProps {
  user: UserSession;
  stores: { id: string; code: string; name: string }[];
}

type AggregateFieldSummary = {
  fieldId: string;
  fieldLabel: string;
  total: number;
  count: number;
  average: number;
  fieldType?: string;
  isCustomField?: boolean;
  category?: string;
  subCategory?: string;
  sourceType?: string;
  values?: { userId: string; userName: string; reportDate: string; value: unknown }[];
  rowFields?: { id: string; label: string; type: string; dynamicOptionsKey?: string; fullWidth?: boolean }[];
  containerId?: string;
  containerTitle?: string;
  containerOrder?: number;
  fieldOrder?: number;
};

type AggregateDepartmentSummary = {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  userCount: number;
  submittedCount: number;
  completionRate: number;
  fields: AggregateFieldSummary[];
};

type AggregateResponse = {
  success: boolean;
  period: string;
  dateRange: { start: string; end: string };
  departments: AggregateDepartmentSummary[];
  storeFields: AggregateFieldSummary[];
  error?: string;
};

function toIsoDateString(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toISOString().split("T")[0];
}

export function StoreReportView({ user, stores }: StoreReportViewProps) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialStoreId = searchParams.get("storeId") || user.storeId || stores[0]?.id || "";
  const initialPeriod = (searchParams.get("period") as "day" | "week" | "month" | null) || "day";
  const initialDate = searchParams.get("date") || getToday();

  const [selectedStoreId, setSelectedStoreId] = useState(initialStoreId);
  const [period, setPeriod] = useState<"day" | "week" | "month">(initialPeriod);
  const [reportDate, setReportDate] = useState(initialDate);
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<AggregateResponse | null>(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedStoreId) params.set("storeId", selectedStoreId);
    params.set("period", period);
    params.set("date", reportDate);
    router.replace(`/reports/store?${params.toString()}`, { scroll: false });
  }, [selectedStoreId, period, reportDate, router]);

  useEffect(() => {
    async function loadReport() {
      if (!selectedStoreId) return;
      setIsLoading(true);
      try {
        const qs = new URLSearchParams({
          storeId: selectedStoreId,
          period,
          date: reportDate,
        });
        const res = await fetch(`/api/reports/aggregate?${qs.toString()}`);
        const json = (await res.json()) as AggregateResponse;
        if (!res.ok || !json?.success) {
          toast({
            title: "加载失败",
            description: json?.error || "无法获取门店报表数据",
            variant: "destructive",
          });
          setData(null);
          return;
        }
        setData(json);
      } catch {
        toast({
          title: "加载失败",
          description: "无法获取门店报表数据",
          variant: "destructive",
        });
        setData(null);
      } finally {
        setIsLoading(false);
      }
    }
    loadReport();
  }, [period, reportDate, selectedStoreId, toast]);

  const changeDate = (days: number) => {
    const date = new Date(reportDate);
    date.setDate(date.getDate() + days);
    setReportDate(date.toISOString().split("T")[0]);
  };

  const end = toIsoDateString(reportDate);
  const start = (() => {
    if (period === "day") return end;
    const endDate = new Date(end);
    if (Number.isNaN(endDate.getTime())) return end;
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - (period === "week" ? 6 : 29));
    return toIsoDateString(startDate.toISOString());
  })();

  const dateLabel = period === "day" ? end : `${start} ~ ${end}`;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
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

            <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
              <TabsList>
                <TabsTrigger value="day">日报</TabsTrigger>
                <TabsTrigger value="week">周报</TabsTrigger>
                <TabsTrigger value="month">月报</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeDate(period === "day" ? -1 : period === "week" ? -7 : -30)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-4 py-2 bg-gray-50 rounded-md font-medium min-w-[200px] text-center">
                {dateLabel}
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

      {isLoading && (
        <Card>
          <CardContent className="py-10 flex items-center justify-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在加载门店报表…
          </CardContent>
        </Card>
      )}

      {!isLoading && data?.success && (
        <DataSummaryPanel
          departments={data.departments || []}
          storeFields={data.storeFields || []}
          period={data.period}
          dateRange={data.dateRange}
          showDetails
        />
      )}

      {!isLoading && !data && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">暂无数据</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">请切换门店或日期后重试。</CardContent>
        </Card>
      )}
    </div>
  );
}
