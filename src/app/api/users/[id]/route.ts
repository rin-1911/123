import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasAnyRole, parseRoles } from "@/lib/types";
import bcrypt from "bcryptjs";

// GET: 获取单个用户
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      store: true,
      department: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

// PUT: 更新用户
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const currentUser = session.user;

  // 检查权限
  if (!hasAnyRole(currentUser.roles, ["STORE_MANAGER", "HQ_ADMIN"])) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await request.json();
  const { name, password, roles, storeId, departmentId, isActive, nursingRole, customFormConfig } = body;

  // 获取要更新的用户
  const targetUser = await prisma.user.findUnique({
    where: { id: params.id },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const targetUserRoles = parseRoles(targetUser.roles);
  const isHQAdmin = hasAnyRole(currentUser.roles, ["HQ_ADMIN"]);

  // 店长只能编辑自己门店的用户
  if (!isHQAdmin) {
    if (targetUser.storeId !== currentUser.storeId) {
      return NextResponse.json({ error: "只能编辑本门店用户" }, { status: 403 });
    }
    
    // 店长不能编辑其他店长或更高级别的用户（除了自己）
    if (targetUser.id !== currentUser.id) {
      if (hasAnyRole(targetUserRoles, ["STORE_MANAGER", "REGION_MANAGER", "HQ_ADMIN"])) {
        return NextResponse.json({ error: "无权编辑该用户" }, { status: 403 });
      }
    }
    
    // 店长不能将用户提升为高权限
    if (roles) {
      const newRoles = Array.isArray(roles) ? roles : [roles];
      const hasHighRole = newRoles.some((r: string) => ["HQ_ADMIN", "REGION_MANAGER"].includes(r));
      if (hasHighRole) {
        return NextResponse.json({ error: "无权设置该角色" }, { status: 403 });
      }
    }
    
    // 店长不能将用户转移到其他门店
    if (storeId && storeId !== currentUser.storeId) {
      return NextResponse.json({ error: "不能转移到其他门店" }, { status: 403 });
    }
  }

  // 不能禁用自己
  if (targetUser.id === currentUser.id && isActive === false) {
    return NextResponse.json({ error: "不能禁用自己的账号" }, { status: 400 });
  }

  // 不能修改自己的角色
  if (targetUser.id === currentUser.id && roles !== undefined) {
    return NextResponse.json({ error: "不能修改自己的角色" }, { status: 400 });
  }

  try {
    const updateData: {
      name?: string;
      passwordHash?: string;
      roles?: string;
      storeId?: string | null;
      departmentId?: string | null;
      isActive?: boolean;
      nursingRole?: string | null;
      customFormConfig?: string | null;
    } = {};

    if (name !== undefined) updateData.name = name;
    if (storeId !== undefined) updateData.storeId = storeId || null;
    if (departmentId !== undefined) updateData.departmentId = departmentId || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (nursingRole !== undefined) updateData.nursingRole = nursingRole || null;
    if (customFormConfig !== undefined) updateData.customFormConfig = customFormConfig || null;

    // 角色更新（需要权限检查）
    if (roles !== undefined && targetUser.id !== currentUser.id) {
      const roleArray = Array.isArray(roles) ? roles : [roles];
      if (roleArray.length > 0) {
        updateData.roles = JSON.stringify(roleArray);
      }
    }

    // 如果提供了新密码，则更新密码
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      include: {
        store: true,
        department: true,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("更新用户失败:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

// DELETE: 删除用户
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const currentUser = session.user;

  // 检查权限
  if (!hasAnyRole(currentUser.roles, ["STORE_MANAGER", "HQ_ADMIN"])) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  // 获取要删除的用户
  const targetUser = await prisma.user.findUnique({
    where: { id: params.id },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  // 不能删除自己
  if (targetUser.id === currentUser.id) {
    return NextResponse.json({ error: "不能删除自己" }, { status: 400 });
  }

  const targetUserRoles = parseRoles(targetUser.roles);
  const isHQAdmin = hasAnyRole(currentUser.roles, ["HQ_ADMIN"]);

  // 店长只能删除自己门店的用户
  if (!isHQAdmin) {
    if (targetUser.storeId !== currentUser.storeId) {
      return NextResponse.json({ error: "只能删除本门店用户" }, { status: 403 });
    }
    // 店长不能删除其他店长或更高权限的用户
    if (hasAnyRole(targetUserRoles, ["STORE_MANAGER", "REGION_MANAGER", "HQ_ADMIN"])) {
      return NextResponse.json({ error: "无权删除该用户" }, { status: 403 });
    }
  }

  try {
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除用户失败:", error);
    return NextResponse.json({ error: "删除失败，可能存在关联数据" }, { status: 500 });
  }
}
