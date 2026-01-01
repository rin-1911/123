import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./db";
import type { Role, UserSession, PermissionCheck } from "./types";
import { hasAnyRole } from "./types";

// 获取当前用户Session
export async function getCurrentUser(): Promise<UserSession | null> {
  const session = await getServerSession(authOptions);
  return session?.user ?? null;
}

// 检查用户是否有权限访问某门店
export async function canAccessStore(
  user: UserSession,
  storeId: string
): Promise<PermissionCheck> {
  // HQ_ADMIN 可以访问所有门店
  if (hasAnyRole(user.roles, ["HQ_ADMIN"])) {
    return { allowed: true };
  }

  // 用户所属门店
  if (user.storeId === storeId) {
    return { allowed: true };
  }

  // 检查多门店权限
  const access = await prisma.userStoreAccess.findFirst({
    where: {
      userId: user.id,
      storeId: storeId,
    },
  });

  if (access) {
    return { allowed: true };
  }

  return { allowed: false, reason: "您没有权限访问该门店" };
}

// 检查用户是否有权限访问某部门数据
export function canAccessDepartment(
  user: UserSession,
  departmentId: string
): PermissionCheck {
  // HQ_ADMIN, STORE_MANAGER, REGION_MANAGER 可以访问所有部门
  if (hasAnyRole(user.roles, ["HQ_ADMIN", "STORE_MANAGER", "REGION_MANAGER"])) {
    return { allowed: true };
  }

  // 财务部人员可以访问财务部
  if (user.departmentCode === "FINANCE_HR_ADMIN") {
    return { allowed: true };
  }

  // MEDICAL_QC 可以访问医疗相关
  if (hasAnyRole(user.roles, ["MEDICAL_QC"])) {
    return { allowed: true };
  }

  // DEPT_LEAD 可以访问自己部门
  if (hasAnyRole(user.roles, ["DEPT_LEAD"]) && user.departmentId === departmentId) {
    return { allowed: true };
  }

  // STAFF 只能访问自己
  if (hasAnyRole(user.roles, ["STAFF"]) && user.departmentId === departmentId) {
    return { allowed: true };
  }

  return { allowed: false, reason: "您没有权限访问该部门数据" };
}

// 检查用户是否有权限修改日报
export async function canEditReport(
  user: UserSession,
  reportUserId: string,
  storeId: string,
  reportDate: string
): Promise<PermissionCheck> {
  // 检查是否锁定
  const lock = await prisma.storeDayLock.findUnique({
    where: {
      storeId_reportDate: {
        storeId,
        reportDate,
      },
    },
  });

  if (lock?.isLocked) {
    // 只有店长可以在锁定后操作
    if (!hasAnyRole(user.roles, ["STORE_MANAGER", "HQ_ADMIN"])) {
      return { allowed: false, reason: "该日期数据已被锁定，请联系店长解锁" };
    }
  }

  // 只能修改自己的日报（店长和HQ_ADMIN除外）
  if (user.id !== reportUserId) {
    if (!hasAnyRole(user.roles, ["STORE_MANAGER", "HQ_ADMIN"])) {
      return { allowed: false, reason: "您只能修改自己的日报" };
    }
  }

  return { allowed: true };
}

// 检查用户是否有权限查看日报列表
export function canViewReportList(
  user: UserSession,
  targetStoreId: string,
  targetDepartmentId?: string
): PermissionCheck {
  // HQ_ADMIN 可以查看所有
  if (hasAnyRole(user.roles, ["HQ_ADMIN"])) {
    return { allowed: true };
  }

  // 只能查看自己门店
  if (user.storeId !== targetStoreId) {
    return { allowed: false, reason: "您只能查看自己门店的数据" };
  }

  // STORE_MANAGER 可以查看本店所有部门
  if (hasAnyRole(user.roles, ["STORE_MANAGER"])) {
    return { allowed: true };
  }

  // DEPT_LEAD 可以查看本部门
  if (hasAnyRole(user.roles, ["DEPT_LEAD"])) {
    if (!targetDepartmentId || user.departmentId === targetDepartmentId) {
      return { allowed: true };
    }
    return { allowed: false, reason: "您只能查看自己部门的数据" };
  }

  // STAFF 只能查看自己
  return { allowed: false, reason: "您没有权限查看团队数据" };
}

// 检查用户是否有权限锁定/解锁日期
export function canLockDate(user: UserSession): PermissionCheck {
  if (hasAnyRole(user.roles, ["STORE_MANAGER", "HQ_ADMIN"])) {
    return { allowed: true };
  }
  return { allowed: false, reason: "只有店长可以锁定/解锁日期" };
}

// 检查用户是否可以管理其他用户
export function canManageUsers(user: UserSession): PermissionCheck {
  if (hasAnyRole(user.roles, ["STORE_MANAGER", "HQ_ADMIN"])) {
    return { allowed: true };
  }
  return { allowed: false, reason: "只有店长或管理员可以管理用户" };
}

// 角色层级（用于判断权限高低）
const ROLE_HIERARCHY: Record<Role, number> = {
  STAFF: 1,
  DEPT_LEAD: 2,
  STORE_MANAGER: 3,
  REGION_MANAGER: 4,
  HQ_ADMIN: 5,
  FINANCE: 3,
  MEDICAL_QC: 3,
};

// 判断角色是否高于或等于目标角色
export function hasRoleAtLeast(userRole: Role, targetRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[targetRole];
}

// 获取用户最高权限等级
export function getHighestRoleLevel(roles: Role[]): number {
  return Math.max(...roles.map(role => ROLE_HIERARCHY[role] || 1));
}

// 获取用户可访问的门店ID列表
export async function getAccessibleStoreIds(user: UserSession): Promise<string[]> {
  if (hasAnyRole(user.roles, ["HQ_ADMIN", "REGION_MANAGER"])) {
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    return stores.map((s) => s.id);
  }

  const storeIds: string[] = [];

  if (user.storeId) {
    storeIds.push(user.storeId);
  }

  const accesses = await prisma.userStoreAccess.findMany({
    where: { userId: user.id },
    select: { storeId: true },
  });

  accesses.forEach((a) => {
    if (!storeIds.includes(a.storeId)) {
      storeIds.push(a.storeId);
    }
  });

  return storeIds;
}
