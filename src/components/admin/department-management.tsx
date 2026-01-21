"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Users, Plus, Pencil, Trash2, Loader2, Info } from "lucide-react";

interface DeptCount {
  User: number;
  DailyReport: number;
  DailyReportTemplate: number;
}

interface Department {
  id: string;
  code: string;
  name: string;
  _count: DeptCount;
}

interface DepartmentManagementProps {
  initialDepartments: Department[];
  canManage?: boolean;
  onDepartmentsChanged?: (departments: Department[]) => void;
}

type FormMode = "create" | "edit";

interface DeptFormData {
  code: string;
  name: string;
}

const emptyForm: DeptFormData = {
  code: "",
  name: "",
};

export function DepartmentManagement({
  initialDepartments,
  canManage = true,
  onDepartmentsChanged,
}: DepartmentManagementProps) {
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<DeptFormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    setDepartments(initialDepartments);
  }, [initialDepartments]);

  const openCreate = () => {
    if (!canManage) return;
    setFormMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (dept: Department) => {
    if (!canManage) return;
    setFormMode("edit");
    setEditingId(dept.id);
    setForm({
      code: dept.code,
      name: dept.name,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!canManage) return;
    if (!form.code.trim() || !form.name.trim()) {
      toast({ title: "部门编码和名称为必填项", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (formMode === "create") {
        const res = await fetch("/api/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "创建失败");
        setDepartments((prev) => {
          const next = [...prev, data.department];
          onDepartmentsChanged?.(next);
          return next;
        });
        toast({ title: "部门创建成功" });
      } else if (editingId) {
        const res = await fetch(`/api/departments/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "更新失败");
        setDepartments((prev) => {
          const next = prev.map((d) => (d.id === editingId ? data.department : d));
          onDepartmentsChanged?.(next);
          return next;
        });
        toast({ title: "部门更新成功" });
      }
      setDialogOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "操作失败";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canManage) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/departments/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "删除失败");
      setDepartments((prev) => {
        const next = prev.filter((d) => d.id !== id);
        onDepartmentsChanged?.(next);
        return next;
      });
      toast({ title: "部门已删除" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "删除失败";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setLoading(false);
      setDeleteConfirmId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5" />
                部门管理
                <Badge variant="secondary">{departments.length} 个</Badge>
              </CardTitle>
              <CardDescription>系统中的部门架构信息</CardDescription>
            </div>
            {canManage && (
              <Button size="sm" onClick={openCreate}>
                <Plus className="h-4 w-4 mr-1" />
                新增部门
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">部门名称</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">部门编码</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">关联数据</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-900">{dept.name}</div>
                    </td>
                    <td className="py-3 px-4">
                      <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                        {dept.code}
                      </code>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                        <span title="用户数">👤 {dept._count.User}</span>
                        <span title="日报数">📄 {dept._count.DailyReport}</span>
                        <span title="模板数">🛠️ {dept._count.DailyReportTemplate}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600"
                          onClick={() => openEdit(dept)}
                          disabled={!canManage}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600"
                          onClick={() => setDeleteConfirmId(dept.id)}
                          disabled={!canManage}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg flex gap-3">
            <Info className="h-5 w-5 text-blue-500 shrink-0" />
            <div className="text-xs text-blue-700 space-y-1">
              <p className="font-medium">注意事项：</p>
              <p>1. 部门编码一旦设定，建议不要随意修改，因为部分报表统计逻辑可能依赖于特定的编码（如 NURSING, FRONT_DESK 等）。</p>
              <p>2. 只有在部门下没有任何用户、日报和报表模板时，才能删除该部门。</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formMode === "create" ? "新增部门" : "编辑部门"}</DialogTitle>
            <DialogDescription>请填写部门的基本信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">部门名称</Label>
              <Input
                id="name"
                placeholder="如：前台客服"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">部门编码</Label>
              <Input
                id="code"
                placeholder="如：FRONT_DESK"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                disabled={formMode === "edit"}
              />
              <p className="text-[10px] text-gray-500">编码通常用于代码逻辑识别，建议使用大写字母和下划线。</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={loading}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确定要删除该部门吗？</DialogTitle>
            <DialogDescription>此操作不可撤销。只有在部门下没有任何关联数据时才能成功删除。</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)} disabled={loading}>
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              确定删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
