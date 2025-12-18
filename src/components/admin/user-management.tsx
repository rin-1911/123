"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import type { UserSession, Role } from "@/lib/types";
import { ROLE_LABELS, hasAnyRole } from "@/lib/types";
import { 
  Users, 
  Plus, 
  Pencil, 
  Trash2, 
  X,
  Check,
  Eye,
  EyeOff,
  Shield,
  Settings2,
  Search,
  Filter,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { FormConfigModal, CustomFormConfig } from "./form-config-modal";

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

interface UserData {
  id: string;
  account: string;
  name: string;
  roles: string; // JSON字符串
  isActive: boolean;
  storeId: string | null;
  departmentId: string | null;
  nursingRole: string | null;
  customFormConfig: string | null; // JSON字符串
  Store: Store | null;
  Department: Department | null;
}

interface UserManagementProps {
  currentUser: UserSession;
  stores: Store[];
  departments: Department[];
}

const ALL_ROLES: { value: Role; label: string; level: number }[] = [
  { value: "STAFF", label: "员工", level: 1 },
  { value: "DEPT_LEAD", label: "部门负责人", level: 2 },
  { value: "FINANCE", label: "财务", level: 3 },
  { value: "MEDICAL_QC", label: "医疗质控", level: 3 },
  { value: "STORE_MANAGER", label: "店长", level: 3 },
  { value: "REGION_MANAGER", label: "区域经理", level: 4 },
  { value: "HQ_ADMIN", label: "总部管理员", level: 5 },
];

// 护理部岗位类型
type NursingRoleType = "assistant" | "assistantLead" | "hygienist" | "hygienistLead" | "headNurse";

const NURSING_ROLES: { value: NursingRoleType; label: string; description: string }[] = [
  { value: "assistant", label: "配台护士", description: "配台工作、消毒灭菌" },
  { value: "assistantLead", label: "配台护士组长", description: "管理配台团队" },
  { value: "hygienist", label: "洁牙师", description: "洁牙、牙周治疗" },
  { value: "hygienistLead", label: "洁牙师组长", description: "管理洁牙团队" },
  { value: "headNurse", label: "护士长", description: "护理部全面管理" },
];

// 咨询部表单类型
const CONSULTATION_FORM_TYPES = [
  { value: "staff", label: "咨询师", description: "日常咨询接待" },
  { value: "lead", label: "咨询主管", description: "团队管理汇总" },
];

// 财务部表单类型
const FINANCE_FORM_TYPES = [
  { value: "cashier", label: "出纳/收银", description: "收款收银" },
  { value: "accountant", label: "会计", description: "账务处理" },
  { value: "manager", label: "财务主管", description: "财务管理汇总" },
];

// 解析角色JSON
function parseRoles(rolesJson: string): Role[] {
  try {
    const roles = JSON.parse(rolesJson);
    return Array.isArray(roles) ? roles : ["STAFF"];
  } catch {
    return ["STAFF"];
  }
}

export function UserManagement({ currentUser, stores, departments }: UserManagementProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showFormConfig, setShowFormConfig] = useState(false);
  
  // 搜索和筛选
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [showFilters, setShowFilters] = useState(false);
  const [filterStore, setFilterStore] = useState("all");
  
  // 过滤后的用户列表
  const filteredUsers = users.filter((user) => {
    // 搜索匹配
    const matchSearch = searchQuery === "" || 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.account.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 部门匹配
    const matchDept = filterDept === "all" || user.departmentId === filterDept;

    // 门店匹配
    const matchStore =
      filterStore === "all" ||
      (filterStore === "HQ"
        ? !user.storeId
        : user.storeId === filterStore);
    
    // 状态匹配
    const matchStatus = filterStatus === "all" || 
      (filterStatus === "active" && user.isActive) ||
      (filterStatus === "inactive" && !user.isActive);
    
    return matchSearch && matchDept && matchStore && matchStatus;
  });

  // 表单数据
  const [formData, setFormData] = useState({
    account: "",
    name: "",
    password: "",
    roles: ["STAFF"] as Role[],
    storeId: "",
    departmentId: "",
    nursingRole: "" as string,  // 护理部岗位
    formType: "" as string,     // 通用表单类型（用于其他部门）
    customFormConfig: null as CustomFormConfig | null, // 自定义表单配置
    isActive: true,
  });

  // 当前用户是否可以管理其他用户
  // 🔒 生产环境：只有 HQ_ADMIN 可以创建/删除用户
  const canManage = hasAnyRole(currentUser.roles, ["HQ_ADMIN"]);
  const canView = hasAnyRole(currentUser.roles, ["STORE_MANAGER", "HQ_ADMIN"]);

  // 加载用户列表
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const qs = new URLSearchParams();
      if (hasAnyRole(currentUser.roles, ["HQ_ADMIN"])) {
        if (filterStore !== "all") {
          // HQ = 总部/未绑定门店用户（后端目前无专门参数，走前端筛选即可）
          // 这里仍然给出 storeId，方便按门店拉取
          if (filterStore !== "HQ") qs.set("storeId", filterStore);
        }
      }

      const url = qs.toString() ? `/api/users?${qs.toString()}` : "/api/users";
      const res = await fetch(url);
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch {
      toast({
        title: "加载失败",
        description: "无法加载用户列表",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser.roles, filterStore, toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // 打开新增弹窗
  const handleCreate = () => {
    setModalMode("create");
    setEditingUser(null);
    setFormData({
      account: "",
      name: "",
      password: "",
      roles: ["STAFF"],
      storeId: currentUser.storeId || "",
      departmentId: "",
      nursingRole: "",
      formType: "",
      customFormConfig: null,
      isActive: true,
    });
    setShowModal(true);
  };

  // 打开编辑弹窗
  const handleEdit = (user: UserData) => {
    setModalMode("edit");
    setEditingUser(user);
    
    // 解析已保存的自定义表单配置
    let parsedConfig: CustomFormConfig | null = null;
    if (user.customFormConfig) {
      try {
        parsedConfig = JSON.parse(user.customFormConfig);
      } catch {
        parsedConfig = null;
      }
    }
    
    setFormData({
      account: user.account,
      name: user.name,
      password: "",
      roles: parseRoles(user.roles),
      storeId: user.storeId || "",
      departmentId: user.departmentId || "",
      nursingRole: user.nursingRole || "",
      formType: "",
      customFormConfig: parsedConfig,
      isActive: user.isActive,
    });
    setShowModal(true);
  };

  // 切换角色选择
  const toggleRole = (role: Role) => {
    setFormData(prev => {
      const currentRoles = prev.roles;
      if (currentRoles.includes(role)) {
        // 至少保留一个角色
        if (currentRoles.length > 1) {
          return { ...prev, roles: currentRoles.filter(r => r !== role) };
        }
        return prev;
      } else {
        return { ...prev, roles: [...currentRoles, role] };
      }
    });
  };

  // 保存用户
  const handleSave = async () => {
    if (!formData.account || !formData.name) {
      toast({
        title: "请填写完整",
        description: "账号和姓名为必填项",
        variant: "destructive",
      });
      return;
    }

    if (modalMode === "create" && !formData.password) {
      toast({
        title: "请填写密码",
        description: "新建用户必须设置密码",
        variant: "destructive",
      });
      return;
    }

    if (formData.roles.length === 0) {
      toast({
        title: "请选择角色",
        description: "至少选择一个角色",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const url = modalMode === "create" 
        ? "/api/users" 
        : `/api/users/${editingUser?.id}`;
      
      const method = modalMode === "create" ? "POST" : "PUT";

      // 获取选中的部门代码
      const selectedDept = departments.find(d => d.id === formData.departmentId);
      const deptCode = selectedDept?.code || "";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account: formData.account,
          name: formData.name,
          password: formData.password || undefined,
          roles: formData.roles,
          storeId: formData.storeId || null,
          departmentId: formData.departmentId || null,
          nursingRole: deptCode === "NURSING" ? formData.nursingRole || null : null,
          customFormConfig: formData.customFormConfig ? JSON.stringify(formData.customFormConfig) : null,
          isActive: formData.isActive,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "操作失败");
      }

      toast({
        title: modalMode === "create" ? "创建成功" : "更新成功",
        description: `用户 ${formData.name} 已${modalMode === "create" ? "创建" : "更新"}`,
      });

      setShowModal(false);
      loadUsers();
    } catch (error) {
      toast({
        title: "操作失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 删除用户
  const handleDelete = async (user: UserData) => {
    if (!confirm(`确定要删除用户 "${user.name}" 吗？此操作不可恢复。`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "删除失败");
      }

      toast({
        title: "删除成功",
        description: `用户 ${user.name} 已删除`,
      });

      loadUsers();
    } catch (error) {
      toast({
        title: "删除失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    }
  };

  // 切换用户状态
  const handleToggleActive = async (user: UserData) => {
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isActive: !user.isActive,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "操作失败");
      }

      toast({
        title: user.isActive ? "已禁用" : "已启用",
        description: `用户 ${user.name} 已${user.isActive ? "禁用" : "启用"}`,
      });

      loadUsers();
    } catch (error) {
      toast({
        title: "操作失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    }
  };

  // 可用角色（根据当前用户权限过滤）
  const availableRoles = ALL_ROLES.filter((r) => {
    if (hasAnyRole(currentUser.roles, ["HQ_ADMIN"])) return true;
    // 店长不能创建区域经理和总部管理员
    return !["REGION_MANAGER", "HQ_ADMIN"].includes(r.value);
  });

  // 格式化角色显示
  const formatRoles = (rolesJson: string) => {
    const roles = parseRoles(rolesJson);
    return roles.map(r => ROLE_LABELS[r] || r).join(", ");
  };

  // 判断是否可以编辑某用户
  const canEditUser = (user: UserData) => {
    // 不能编辑自己的权限（但可以改密码等）
    // HQ_ADMIN可以编辑所有人
    if (hasAnyRole(currentUser.roles, ["HQ_ADMIN"])) return true;
    
    // 店长只能编辑本店用户
    if (hasAnyRole(currentUser.roles, ["STORE_MANAGER"])) {
      if (user.storeId !== currentUser.storeId) return false;
      // 不能编辑其他店长或更高级别
      const userRoles = parseRoles(user.roles);
      if (hasAnyRole(userRoles, ["STORE_MANAGER", "REGION_MANAGER", "HQ_ADMIN"])) {
        return user.id === currentUser.id; // 只能编辑自己
      }
      return true;
    }
    
    return false;
  };

  // 判断编辑时是否可以修改角色
  const canEditRoles = (user: UserData) => {
    // 不能修改自己的角色
    if (user.id === currentUser.id) return false;
    
    // HQ_ADMIN可以修改所有人角色
    if (hasAnyRole(currentUser.roles, ["HQ_ADMIN"])) return true;
    
    // 店长可以修改普通员工角色
    if (hasAnyRole(currentUser.roles, ["STORE_MANAGER"])) {
      const userRoles = parseRoles(user.roles);
      // 不能修改同级或更高级别用户的角色
      if (hasAnyRole(userRoles, ["STORE_MANAGER", "REGION_MANAGER", "HQ_ADMIN"])) {
        return false;
      }
      return true;
    }
    
    return false;
  };

  if (!canView) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>您没有权限查看用户管理</p>
          <p className="text-sm mt-2">只有管理员可以访问此功能</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4">
            {/* 标题行 */}
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5" />
                用户管理
                <Badge variant="secondary">{filteredUsers.length}/{users.length} 人</Badge>
              </CardTitle>
              {canManage ? (
                <Button onClick={handleCreate} className="bg-gradient-to-r from-cyan-500 to-blue-600">
                  <Plus className="h-4 w-4 mr-2" />
                  新增用户
                </Button>
              ) : (
                <Badge variant="outline" className="text-gray-500">
                  <Shield className="h-3 w-3 mr-1" />
                  只读模式
                </Badge>
              )}
            </div>
            
            {/* 搜索和筛选栏 */}
            <div className="flex flex-wrap items-center gap-3">
              {/* 搜索框 */}
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="搜索姓名或账号..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              {/* 筛选按钮 */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? "bg-gray-100" : ""}
              >
                <Filter className="h-4 w-4 mr-1" />
                筛选
                {showFilters ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
              </Button>
              
              {/* 快速状态筛选 */}
              <div className="flex gap-1">
                <Badge 
                  variant={filterStatus === "all" ? "default" : "outline"}
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => setFilterStatus("all")}
                >
                  全部
                </Badge>
                <Badge 
                  variant={filterStatus === "active" ? "success" : "outline"}
                  className="cursor-pointer hover:bg-green-50"
                  onClick={() => setFilterStatus("active")}
                >
                  启用
                </Badge>
                <Badge 
                  variant={filterStatus === "inactive" ? "destructive" : "outline"}
                  className="cursor-pointer hover:bg-red-50"
                  onClick={() => setFilterStatus("inactive")}
                >
                  禁用
                </Badge>
              </div>
            </div>
            
            {/* 展开的筛选选项 */}
            {showFilters && (
              <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-lg">
                {/* 门店筛选（HQ_ADMIN 才显示） */}
                {hasAnyRole(currentUser.roles, ["HQ_ADMIN"]) && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">门店：</span>
                    <Select value={filterStore} onValueChange={setFilterStore}>
                      <SelectTrigger className="w-[180px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">全部门店</SelectItem>
                        <SelectItem value="HQ">总部（无门店）</SelectItem>
                        {stores.map((store) => (
                          <SelectItem key={store.id} value={store.id}>
                            {store.name} ({store.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">部门：</span>
                  <Select value={filterDept} onValueChange={setFilterDept}>
                    <SelectTrigger className="w-[140px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部部门</SelectItem>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* 清除筛选 */}
                {(filterStore !== "all" || filterDept !== "all" || filterStatus !== "all" || searchQuery) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterStore("all");
                      setFilterDept("all");
                      setFilterStatus("all");
                    }}
                    className="text-gray-500"
                  >
                    <X className="h-3 w-3 mr-1" />
                    清除筛选
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {users.length === 0 ? (
                <>
                  <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>暂无用户数据</p>
                </>
              ) : (
                <>
                  <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>没有符合筛选条件的用户</p>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      setSearchQuery("");
                      setFilterStore("all");
                      setFilterDept("all");
                      setFilterStatus("all");
                    }}
                  >
                    清除筛选条件
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">用户</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 hidden md:table-cell">账号</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 hidden lg:table-cell">门店</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">部门</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 hidden xl:table-cell">日报类型</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 hidden md:table-cell">角色</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">状态</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.map((user) => {
                    const userRoles = parseRoles(user.roles);
                    const canEdit = canEditUser(user);
                    
                    return (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-sm font-medium">
                              {user.name.charAt(0)}
                            </div>
                            <span className="font-medium">{user.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-sm text-gray-600 hidden md:table-cell">
                          {user.account}
                        </td>
                        <td className="py-3 px-4 text-gray-600 hidden lg:table-cell">
                          <Badge variant="outline" className="font-normal">
                            {user.Store?.name || "总部"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="secondary" className="font-normal">
                            {user.Department?.name || "-"}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 hidden xl:table-cell">
                          {user.Department?.code === "NURSING" && user.nursingRole ? (
                            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                              {NURSING_ROLES.find(r => r.value === user.nursingRole)?.label || user.nursingRole}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4 hidden md:table-cell">
                          <div className="flex flex-wrap gap-1">
                            {userRoles.slice(0, 2).map((role) => (
                              <Badge
                                key={role}
                                variant={
                                  ["HQ_ADMIN", "STORE_MANAGER", "REGION_MANAGER"].includes(role)
                                    ? "default"
                                    : "secondary"
                                }
                                className="text-xs"
                              >
                                {ROLE_LABELS[role] || role}
                              </Badge>
                            ))}
                            {userRoles.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{userRoles.length - 2}
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleActive(user)}
                            disabled={user.id === currentUser.id || !canEdit}
                            className="disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Badge 
                              variant={user.isActive ? "success" : "destructive"}
                              className={canEdit ? "cursor-pointer hover:opacity-80" : ""}
                            >
                              {user.isActive ? "✓" : "✗"}
                            </Badge>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(user)}
                              disabled={!canEdit}
                              className="h-7 px-2 text-cyan-600 border-cyan-200 hover:bg-cyan-50"
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1" />
                              编辑
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(user)}
                              disabled={user.id === currentUser.id || !canEdit}
                              className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-30"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新增/编辑弹窗 */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">
                {modalMode === "create" ? "新增用户" : "编辑用户"}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account">账号 *</Label>
                <Input
                  id="account"
                  value={formData.account}
                  onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                  placeholder="输入数字账号"
                  disabled={modalMode === "edit"}
                />
                {modalMode === "edit" && (
                  <p className="text-xs text-gray-500">账号创建后不可修改</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">姓名 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="输入用户姓名"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  密码 {modalMode === "create" ? "*" : "(留空则不修改)"}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={modalMode === "create" ? "设置登录密码" : "留空则保持原密码"}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  角色 * <span className="text-gray-400 text-xs">（可多选）</span>
                </Label>
                {modalMode === "edit" && editingUser && !canEditRoles(editingUser) ? (
                  <div className="p-3 bg-gray-50 rounded-md">
                    <div className="flex flex-wrap gap-2">
                      {formData.roles.map((role) => (
                        <Badge key={role} variant="secondary">
                          {ROLE_LABELS[role] || role}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {editingUser.id === currentUser.id 
                        ? "不能修改自己的角色" 
                        : "没有权限修改该用户的角色"}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {availableRoles.map((role) => (
                      <label
                        key={role.value}
                        className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                          formData.roles.includes(role.value)
                            ? "border-cyan-500 bg-cyan-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData.roles.includes(role.value)}
                          onChange={() => toggleRole(role.value)}
                          className="rounded text-cyan-600"
                        />
                        <span className="text-sm">{role.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="store">所属门店</Label>
                <Select
                  value={formData.storeId || "none"}
                  onValueChange={(value) => setFormData({ ...formData, storeId: value === "none" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择门店" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">总部（无门店）</SelectItem>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name} ({store.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">所属部门</Label>
                <Select
                  value={formData.departmentId || "none"}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    departmentId: value === "none" ? "" : value,
                    nursingRole: "",  // 切换部门时清空岗位选择
                    formType: "",
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择部门" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">无</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 护理部岗位选择 */}
              {(() => {
                const selectedDept = departments.find(d => d.id === formData.departmentId);
                if (selectedDept?.code === "NURSING") {
                  return (
                    <div className="space-y-2">
                      <Label>
                        日报表单类型 * <span className="text-gray-400 text-xs">（决定填写哪种日报）</span>
                      </Label>
                      <div className="grid grid-cols-1 gap-2">
                        {NURSING_ROLES.map((role) => (
                          <label
                            key={role.value}
                            className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                              formData.nursingRole === role.value
                                ? "border-cyan-500 bg-cyan-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name="nursingRole"
                              checked={formData.nursingRole === role.value}
                              onChange={() => setFormData({ ...formData, nursingRole: role.value })}
                              className="text-cyan-600"
                            />
                            <div>
                              <span className="text-sm font-medium">{role.label}</span>
                              <p className="text-xs text-gray-500">{role.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* 自定义表单字段配置 */}
              {formData.departmentId && (
                <div className="space-y-2">
                  <Label>自定义表单字段</Label>
                  <div className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div>
                        {formData.customFormConfig ? (
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                              已自定义
                            </Badge>
                            <span className="text-sm text-gray-500">
                              启用 {formData.customFormConfig.enabledFields?.length || 0} 个字段
                              {(formData.customFormConfig.customFields?.length || 0) > 0 && (
                                <span>，{formData.customFormConfig.customFields.length} 个自定义字段</span>
                              )}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">使用默认表单配置</span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFormConfig(true)}
                      >
                        <Settings2 className="h-4 w-4 mr-1" />
                        配置字段
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {modalMode === "edit" && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    disabled={editingUser?.id === currentUser.id}
                    className="rounded"
                  />
                  <Label htmlFor="isActive" className="cursor-pointer">
                    账号启用
                  </Label>
                  {editingUser?.id === currentUser.id && (
                    <span className="text-xs text-gray-500">（不能禁用自己）</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t bg-gray-50">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                取消
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    保存中...
                  </span>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    保存
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 表单字段配置弹窗 */}
      <FormConfigModal
        isOpen={showFormConfig}
        onClose={() => setShowFormConfig(false)}
        onSave={(config) => {
          setFormData({ ...formData, customFormConfig: config });
        }}
        departmentCode={departments.find(d => d.id === formData.departmentId)?.code || ""}
        roles={formData.roles}
        nursingRole={formData.nursingRole}
        currentConfig={formData.customFormConfig}
        userName={formData.name || "新用户"}
      />
    </>
  );
}
