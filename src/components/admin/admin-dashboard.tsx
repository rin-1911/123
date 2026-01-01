"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import type { UserSession } from "@/lib/types";
import { hasAnyRole } from "@/lib/types";
import { 
  Users, 
  Building2, 
  FileText, 
  ClipboardList,
  Shield,
  Settings,
  Plus,
  Trash2,
  Edit,
  Eye,
  Download,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";

interface Store {
  id: string;
  code: string;
  name: string;
}

interface Department {
  id: string;
  code: string;
  name: string;
}

interface NonConsultUser {
  id: string;
  name: string;
  account: string;
  Department: { name: string } | null;
}

interface Permission {
  id: string;
  userId: string;
  canViewAll: boolean;
  canViewStats: boolean;
  canExport: boolean;
  isActive: boolean;
  validUntil: string | null;
  User_ConsultationViewPermission_userIdToUser: {
    id: string;
    name: string;
    account: string;
    Department: { name: string } | null;
  };
  User_ConsultationViewPermission_grantedByIdToUser: {
    id: string;
    name: string;
  };
  createdAt: string;
}

interface AdminDashboardProps {
  user: UserSession;
  stats: {
    userCount: number;
    storeCount: number;
    todayReportCount: number;
    consultationCount: number;
    permissionCount: number;
  };
  stores: Store[];
  departments: Department[];
  nonConsultUsers: NonConsultUser[];
}

export function AdminDashboard({
  user,
  stats,
  stores,
  departments,
  nonConsultUsers,
}: AdminDashboardProps) {
  const { toast } = useToast();
  const isHQAdmin = hasAnyRole(user.roles, ["HQ_ADMIN"]);

  // 权限管理状态
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [showAddPermission, setShowAddPermission] = useState(false);
  const [savingPermission, setSavingPermission] = useState(false);
  const [newPermission, setNewPermission] = useState({
    userId: "",
    canViewAll: false,
    canViewStats: true,
    canExport: false,
  });

  // 加载权限列表
  const fetchPermissions = async () => {
    setLoadingPermissions(true);
    try {
      const res = await fetch(`/api/consultations/permissions?storeId=${user.storeId || ""}`);
      const data = await res.json();
      if (res.ok) {
        setPermissions(data.permissions || []);
      }
    } catch (error) {
      console.error("加载权限失败:", error);
    } finally {
      setLoadingPermissions(false);
    }
  };

  useEffect(() => {
    fetchPermissions();
  }, []);

  // 添加权限
  const handleAddPermission = async () => {
    if (!newPermission.userId) {
      toast({ title: "请选择用户", variant: "destructive" });
      return;
    }

    setSavingPermission(true);
    try {
      const res = await fetch("/api/consultations/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newPermission,
          storeId: user.storeId,
        }),
      });

      if (res.ok) {
        toast({ title: "权限添加成功" });
        setShowAddPermission(false);
        setNewPermission({
          userId: "",
          canViewAll: false,
          canViewStats: true,
          canExport: false,
        });
        fetchPermissions();
      } else {
        const data = await res.json();
        toast({ title: "添加失败", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "网络错误", variant: "destructive" });
    } finally {
      setSavingPermission(false);
    }
  };

  // 删除权限
  const handleDeletePermission = async (id: string) => {
    if (!confirm("确定要删除该权限吗？")) return;

    try {
      const res = await fetch(`/api/consultations/permissions?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        toast({ title: "权限已删除" });
        fetchPermissions();
      } else {
        toast({ title: "删除失败", variant: "destructive" });
      }
    } catch {
      toast({ title: "网络错误", variant: "destructive" });
    }
  };

  // 切换权限状态
  const handleTogglePermission = async (permission: Permission) => {
    try {
      const res = await fetch("/api/consultations/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: permission.userId,
          storeId: user.storeId,
          canViewAll: permission.canViewAll,
          canViewStats: permission.canViewStats,
          canExport: permission.canExport,
          isActive: !permission.isActive,
        }),
      });

      if (res.ok) {
        toast({ title: permission.isActive ? "权限已禁用" : "权限已启用" });
        fetchPermissions();
      }
    } catch {
      toast({ title: "操作失败", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">用户总数</p>
                <p className="text-2xl font-bold">{stats.userCount}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        {isHQAdmin && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">门店数量</p>
                  <p className="text-2xl font-bold">{stats.storeCount}</p>
                </div>
                <Building2 className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">今日日报</p>
                <p className="text-2xl font-bold">{stats.todayReportCount}</p>
              </div>
              <FileText className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">咨询记录</p>
                <p className="text-2xl font-bold">{stats.consultationCount}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">权限授权</p>
                <p className="text-2xl font-bold">{stats.permissionCount}</p>
              </div>
              <Shield className="h-8 w-8 text-cyan-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 快捷入口 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/users">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                用户管理
              </CardTitle>
              <CardDescription>
                添加、编辑、删除用户，配置用户权限
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        {isHQAdmin && (
          <Link href="/admin/daily-templates">
            <Card className="hover:bg-gray-50 transition-colors cursor-pointer h-full border-cyan-200 bg-cyan-50/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-5 w-5 text-cyan-600" />
                  日报配置中心
                </CardTitle>
                <CardDescription>
                  统一管理全院日报字段：新增/删除/排序
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        )}

        <Link href="/consultations">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-orange-500" />
                咨询记录管理
              </CardTitle>
              <CardDescription>
                查看和管理所有咨询师的患者记录
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/reports/store">
          <Card className="hover:bg-gray-50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-500" />
                门店报表
              </CardTitle>
              <CardDescription>
                查看门店数据汇总和统计报表
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      {/* 权限管理 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-cyan-500" />
                咨询记录查看权限
              </CardTitle>
              <CardDescription>
                授权其他部门人员查看咨询记录
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddPermission(true)}>
              <Plus className="h-4 w-4 mr-2" />
              添加授权
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingPermissions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : permissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>暂无授权记录</p>
              <p className="text-sm">点击"添加授权"为其他部门人员开通查看权限</p>
            </div>
          ) : (
            <div className="space-y-3">
              {permissions.map(perm => (
                <div
                  key={perm.id}
                  className={`p-4 border rounded-lg ${perm.isActive ? "bg-white" : "bg-gray-50 opacity-60"}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{perm.User_ConsultationViewPermission_userIdToUser?.name}</p>
                        <p className="text-sm text-gray-500">
                          {perm.User_ConsultationViewPermission_userIdToUser?.Department?.name || "未分配部门"} · {perm.User_ConsultationViewPermission_userIdToUser?.account}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {perm.canViewAll && (
                          <Badge className="bg-green-100 text-green-700">
                            <Eye className="h-3 w-3 mr-1" />
                            查看详情
                          </Badge>
                        )}
                        {perm.canViewStats && (
                          <Badge className="bg-blue-100 text-blue-700">
                            查看统计
                          </Badge>
                        )}
                        {perm.canExport && (
                          <Badge className="bg-purple-100 text-purple-700">
                            <Download className="h-3 w-3 mr-1" />
                            可导出
                          </Badge>
                        )}
                        {!perm.isActive && (
                          <Badge variant="secondary">已禁用</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTogglePermission(perm)}
                      >
                        {perm.isActive ? (
                          <XCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePermission(perm.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    由 {perm.User_ConsultationViewPermission_grantedByIdToUser.name} 授权于 {new Date(perm.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 添加权限对话框 */}
      <Dialog open={showAddPermission} onOpenChange={setShowAddPermission}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加查看权限</DialogTitle>
            <DialogDescription>
              授权其他部门人员查看咨询记录
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label>选择用户</Label>
              <Select
                value={newPermission.userId}
                onValueChange={(v) => setNewPermission(prev => ({ ...prev, userId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="请选择用户" />
                </SelectTrigger>
                <SelectContent>
                  {nonConsultUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name} ({u.Department?.name || "未分配"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>查看统计数据</Label>
                  <p className="text-xs text-gray-500">允许查看咨询记录的汇总统计</p>
                </div>
                <Switch
                  checked={newPermission.canViewStats}
                  onCheckedChange={(v) => setNewPermission(prev => ({ ...prev, canViewStats: v }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>查看详细记录</Label>
                  <p className="text-xs text-gray-500">允许查看每条咨询记录的详情</p>
                </div>
                <Switch
                  checked={newPermission.canViewAll}
                  onCheckedChange={(v) => setNewPermission(prev => ({ ...prev, canViewAll: v }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>导出数据</Label>
                  <p className="text-xs text-gray-500">允许导出咨询记录数据</p>
                </div>
                <Switch
                  checked={newPermission.canExport}
                  onCheckedChange={(v) => setNewPermission(prev => ({ ...prev, canExport: v }))}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowAddPermission(false)}>
              取消
            </Button>
            <Button onClick={handleAddPermission} disabled={savingPermission}>
              {savingPermission && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              确认授权
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}



