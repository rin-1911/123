"use client";

import { useState } from "react";
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
import { Building2, Plus, Pencil, Trash2, Power, PowerOff, Loader2 } from "lucide-react";

interface StoreCount {
  User: number;
  StoreDayLock: number;
  DailyReport: number;
  ChannelSource: number;
  ConfigFlag: number;
  UserStoreAccess: number;
}

interface Store {
  id: string;
  code: string;
  name: string;
  city: string | null;
  address: string | null;
  chairCnt: number;
  isActive: boolean;
  _count: StoreCount;
}

interface StoreManagementProps {
  initialStores: Store[];
}

type FormMode = "create" | "edit";

interface StoreFormData {
  code: string;
  name: string;
  city: string;
  address: string;
  chairCnt: number;
  isActive: boolean;
}

const emptyForm: StoreFormData = {
  code: "",
  name: "",
  city: "",
  address: "",
  chairCnt: 0,
  isActive: true,
};

export function StoreManagement({ initialStores }: StoreManagementProps) {
  const [stores, setStores] = useState<Store[]>(initialStores);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<StoreFormData>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const { toast } = useToast();

  const openCreate = () => {
    setFormMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (store: Store) => {
    setFormMode("edit");
    setEditingId(store.id);
    setForm({
      code: store.code,
      name: store.name,
      city: store.city || "",
      address: store.address || "",
      chairCnt: store.chairCnt,
      isActive: store.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast({ title: "门店编码和名称为必填项", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (formMode === "create") {
        const res = await fetch("/api/stores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "创建失败");
        setStores((prev) => [...prev, data.store]);
        toast({ title: "门店创建成功" });
      } else if (editingId) {
        const res = await fetch(`/api/stores/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.name,
            city: form.city,
            address: form.address,
            chairCnt: form.chairCnt,
            isActive: form.isActive,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "更新失败");
        setStores((prev) =>
          prev.map((s) => (s.id === editingId ? data.store : s))
        );
        toast({ title: "门店更新成功" });
      }
      setDialogOpen(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "操作失败";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (store: Store) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stores/${store.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !store.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "操作失败");
      setStores((prev) =>
        prev.map((s) => (s.id === store.id ? data.store : s))
      );
      toast({ title: store.isActive ? "门店已停用" : "门店已启用" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "操作失败";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (storeId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/stores/${storeId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "删除失败");
      setStores((prev) => prev.filter((s) => s.id !== storeId));
      toast({ title: "门店已删除" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "删除失败";
      toast({ title: msg, variant: "destructive" });
    } finally {
      setLoading(false);
      setDeleteConfirmId(null);
    }
  };

  const getTotalRefs = (store: Store) => {
    const c = store._count;
    return c.User + c.StoreDayLock + c.DailyReport + c.ChannelSource + c.ConfigFlag + c.UserStoreAccess;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                门店管理
                <Badge variant="secondary">{stores.length} 家</Badge>
              </CardTitle>
              <CardDescription>系统中的门店信息</CardDescription>
            </div>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 mr-1" />
              新增门店
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">门店编码</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">门店名称</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">城市</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">牙椅数</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">状态</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">关联数据</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {stores.map((store) => {
                  const refs = getTotalRefs(store);
                  return (
                    <tr key={store.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono">{store.code}</td>
                      <td className="py-3 px-4 font-medium">{store.name}</td>
                      <td className="py-3 px-4 text-gray-600">{store.city || "-"}</td>
                      <td className="py-3 px-4">{store.chairCnt}</td>
                      <td className="py-3 px-4">
                        <Badge variant={store.isActive ? "success" : "destructive"}>
                          {store.isActive ? "启用" : "停用"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <span className={refs > 0 ? "text-blue-600" : "text-gray-400"}>
                          {refs} 条
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEdit(store)}
                            title="编辑"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleActive(store)}
                            title={store.isActive ? "停用" : "启用"}
                          >
                            {store.isActive ? (
                              <PowerOff className="h-4 w-4 text-orange-500" />
                            ) : (
                              <Power className="h-4 w-4 text-green-500" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirmId(store.id)}
                            disabled={refs > 0}
                            title={refs > 0 ? "存在关联数据，无法删除" : "删除"}
                          >
                            <Trash2
                              className={`h-4 w-4 ${refs > 0 ? "text-gray-300" : "text-red-500"}`}
                            />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {stores.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-500">
                      暂无门店数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 新增/编辑对话框 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{formMode === "create" ? "新增门店" : "编辑门店"}</DialogTitle>
            <DialogDescription>
              {formMode === "create"
                ? "请填写门店信息，编码创建后不可修改"
                : "修改门店信息（编码不可更改）"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">
                门店编码 *
              </Label>
              <Input
                id="code"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                className="col-span-3"
                disabled={formMode === "edit"}
                placeholder="如 DF-CN"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                门店名称 *
              </Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="col-span-3"
                placeholder="如 德弗口腔城南店"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="city" className="text-right">
                城市
              </Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="col-span-3"
                placeholder="如 文山"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">
                地址
              </Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="col-span-3"
                placeholder="详细地址"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="chairCnt" className="text-right">
                牙椅数
              </Label>
              <Input
                id="chairCnt"
                type="number"
                min={0}
                value={form.chairCnt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, chairCnt: parseInt(e.target.value) || 0 }))
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">状态</Label>
              <div className="col-span-3 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="h-4 w-4"
                />
                <Label htmlFor="isActive" className="font-normal cursor-pointer">
                  启用
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={loading}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {formMode === "create" ? "创建" : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认对话框 */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除此门店吗？此操作不可撤销。
            </DialogDescription>
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
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}







