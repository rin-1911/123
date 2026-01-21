"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import type { Role } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";
import { Loader2, Save, SlidersHorizontal } from "lucide-react";

type Scope = "GLOBAL" | "STORE";

type StoreLite = {
  id: string;
  code: string;
  name: string;
};

type DepartmentLite = {
  code: string;
  name: string;
};

const ALL_ROLES: Role[] = ["STAFF", "DEPT_LEAD", "STORE_MANAGER", "REGION_MANAGER", "HQ_ADMIN", "MEDICAL_QC", "FINANCE"];

function normalizeRoleValue(raw: unknown): string {
  if (typeof raw !== "string") return "AUTO";
  const trimmed = raw.trim();
  if (!trimmed) return "AUTO";
  return trimmed;
}

export function DeptReportRoleConfig({
  stores,
  departments,
}: {
  stores: StoreLite[];
  departments: DepartmentLite[];
}) {
  const { toast } = useToast();
  const [scope, setScope] = useState<Scope>("GLOBAL");
  const [storeId, setStoreId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [roleMap, setRoleMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const storeOptions = useMemo(() => stores.filter((s) => s.code !== "HQ" && !s.name.includes("总部")), [stores]);

  const sortedDepartments = useMemo(() => {
    const order = [
      "FRONT_DESK",
      "OFFLINE_MARKETING",
      "CONSULTATION",
      "ONLINE_GROWTH",
      "MEDICAL",
      "NURSING",
      "FINANCE_HR_ADMIN",
      "HR",
      "ADMIN",
      "MANAGEMENT",
    ];
    const rank = new Map(order.map((c, i) => [c, i]));
    return [...departments].sort((a, b) => {
      const ra = rank.has(a.code) ? (rank.get(a.code) as number) : 9999;
      const rb = rank.has(b.code) ? (rank.get(b.code) as number) : 9999;
      if (ra !== rb) return ra - rb;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [departments]);

  const loadConfig = useCallback(async (nextScope: Scope, nextStoreId: string) => {
    setIsLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("scope", nextScope);
      if (nextScope === "STORE") qs.set("storeId", nextStoreId);
      const res = await fetch(`/api/admin/dept-report-role?${qs.toString()}`);
      const data = await res.json();
      const parsed = data?.config?.parsedValue;
      const nextRoleMap: Record<string, string> = {};
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
          nextRoleMap[k] = normalizeRoleValue(v);
        }
      }
      setRoleMap(nextRoleMap);
      setIsActive(Boolean(data?.config?.isActive ?? true));
    } catch {
      toast({
        title: "加载失败",
        description: "无法加载汇总口径配置",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (scope !== "STORE") return;
    if (storeId) return;
    const nextStoreId = storeOptions[0]?.id || "";
    if (!nextStoreId) return;
    setStoreId(nextStoreId);
  }, [scope, storeId, storeOptions]);

  useEffect(() => {
    if (scope === "STORE" && !storeId) return;
    loadConfig(scope, scope === "STORE" ? storeId : "");
  }, [scope, storeId, loadConfig]);

  const updateRole = (deptCode: string, role: string) => {
    setRoleMap((prev) => ({ ...prev, [deptCode]: role }));
  };

  const saveConfig = async () => {
    if (scope === "STORE" && !storeId) {
      toast({ title: "请选择门店", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        scope,
        storeId: scope === "STORE" ? storeId : undefined,
        isActive,
        description: "部门报表口径角色配置",
        value: roleMap,
      };
      const res = await fetch("/api/admin/dept-report-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "保存失败");
      toast({ title: "保存成功" });
      await loadConfig(scope, scope === "STORE" ? storeId : "");
    } catch (e: any) {
      toast({
        title: "保存失败",
        description: String(e?.message || "保存失败"),
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5" />
          门店报表汇总口径（按角色）
        </CardTitle>
        <CardDescription>
          设置每个部门汇总时只取某一类角色的数据；AUTO 表示使用系统默认口径。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label>范围</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as Scope)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GLOBAL">全局</SelectItem>
                <SelectItem value="STORE">门店</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {scope === "STORE" && (
            <div className="space-y-2">
              <Label>门店</Label>
              <Select value={storeId} onValueChange={setStoreId}>
                <SelectTrigger className="w-[260px]">
                  <SelectValue placeholder="选择门店" />
                </SelectTrigger>
                <SelectContent>
                  {storeOptions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div>
              <Label>启用</Label>
              <div className="text-xs text-gray-500 mt-1">关闭后不生效</div>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          <div className="flex-1" />

          <Button onClick={saveConfig} disabled={isSaving || isLoading}>
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            保存配置
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            加载中...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">部门</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">口径角色</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-gray-800">默认（未配置部门使用这里）</td>
                  <td className="py-3 px-4">
                    <Select
                      value={normalizeRoleValue(roleMap.default)}
                      onValueChange={(v) => updateRole("default", v)}
                    >
                      <SelectTrigger className="w-[240px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AUTO">AUTO（系统默认）</SelectItem>
                        {ALL_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROLE_LABELS[r] || r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>

                {sortedDepartments.map((d) => (
                  <tr key={d.code} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-800">{d.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{d.code}</div>
                    </td>
                    <td className="py-3 px-4">
                      <Select
                        value={normalizeRoleValue(roleMap[d.code])}
                        onValueChange={(v) => updateRole(d.code, v)}
                      >
                        <SelectTrigger className="w-[240px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AUTO">AUTO（系统默认）</SelectItem>
                          {ALL_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                              {ROLE_LABELS[r] || r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
