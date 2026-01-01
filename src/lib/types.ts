// 角色类型
export type Role =
  | "STAFF"
  | "DEPT_LEAD"
  | "STORE_MANAGER"
  | "REGION_MANAGER"
  | "HQ_ADMIN"
  | "MEDICAL_QC"
  | "FINANCE";

// 部门代码
export type DepartmentCode =
  | "FRONT_DESK"
  | "CONSULTATION"
  | "MEDICAL"
  | "NURSING"
  | "OFFLINE_MARKETING"
  | "ONLINE_GROWTH"
  | "FINANCE_HR_ADMIN"
  | "HR"
  | "ADMIN"
  | "MANAGEMENT";

// 日报状态
export type ReportStatus = "DRAFT" | "SUBMITTED";

// 护理岗位类型
export type NursingWorkType = "CHAIR_ASSIST" | "STERILIZATION_IMAGING" | "HYGIENIST";

// 配置范围
export type ConfigScope = "GLOBAL" | "STORE";

// 角色显示名称
export const ROLE_LABELS: Record<Role, string> = {
  STAFF: "员工",
  DEPT_LEAD: "部门负责人",
  STORE_MANAGER: "店长",
  REGION_MANAGER: "区域经理",
  HQ_ADMIN: "总部管理员",
  MEDICAL_QC: "医疗质控",
  FINANCE: "财务人员",
};

// 部门显示名称
export const DEPARTMENT_LABELS: Record<DepartmentCode, string> = {
  FRONT_DESK: "前台客服",
  CONSULTATION: "咨询部",
  MEDICAL: "医疗部",
  NURSING: "护理部",
  OFFLINE_MARKETING: "线下市场",
  ONLINE_GROWTH: "网络新媒体",
  FINANCE_HR_ADMIN: "财务",
  HR: "人事部",
  ADMIN: "行政部",
  MANAGEMENT: "管理层",
};

// 日报状态显示名称
export const STATUS_LABELS: Record<ReportStatus, string> = {
  DRAFT: "草稿",
  SUBMITTED: "已提交",
};

// 护理岗位显示名称
export const NURSING_WORK_TYPE_LABELS: Record<NursingWorkType, string> = {
  CHAIR_ASSIST: "配台",
  STERILIZATION_IMAGING: "消毒/影像/供应",
  HYGIENIST: "洁牙/牙周基础",
};

// 用户Session类型
export interface UserSession {
  id: string;
  account: string;
  name: string;
  roles: Role[];           // 支持多角色
  primaryRole: Role;       // 主要角色（权限最高的）
  storeId: string | null;
  departmentId: string | null;
  departmentCode: DepartmentCode | null;
  storeName: string | null;
  departmentName: string | null;
  nursingRole: string | null;  // 护理岗位类型
  marketingSubDept: string | null;  // 线下市场子部门类型
  // 登录安全提示：弱密码（纯数字）提示用户尽快修改
  passwordWeak?: boolean;
}

// 线下市场子部门类型
export type MarketingSubDept = "expansion" | "customerService";

// 线下市场子部门标签
export const MARKETING_SUB_DEPT_LABELS: Record<MarketingSubDept, string> = {
  expansion: "市场拓展",
  customerService: "市场客服",
};

// 辅助函数：解析角色JSON
export function parseRoles(rolesJson: string): Role[] {
  try {
    const roles = JSON.parse(rolesJson);
    return Array.isArray(roles) ? roles : ["STAFF"];
  } catch {
    return ["STAFF"];
  }
}

// 辅助函数：获取主要角色（权限最高的）
export function getPrimaryRole(roles: Role[]): Role {
  const hierarchy: Role[] = [
    "HQ_ADMIN",
    "REGION_MANAGER", 
    "STORE_MANAGER",
    "MEDICAL_QC",
    "DEPT_LEAD",
    "STAFF",
  ];
  
  for (const role of hierarchy) {
    if (roles.includes(role)) {
      return role;
    }
  }
  return "STAFF";
}

// 辅助函数：检查用户是否有某个角色
export function hasRole(userRoles?: Role[] | null, targetRole?: Role | null): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  if (!targetRole) return false;
  return userRoles.includes(targetRole);
}

// 辅助函数：检查用户是否有任意一个角色
export function hasAnyRole(userRoles?: Role[] | null, targetRoles?: Role[] | null): boolean {
  if (!userRoles || userRoles.length === 0) return false;
  if (!targetRoles || targetRoles.length === 0) return false;
  return targetRoles.some((role) => userRoles.includes(role));
}

// 权限检查结果
export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
}

