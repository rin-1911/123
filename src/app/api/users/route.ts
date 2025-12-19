import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasAnyRole } from "@/lib/types";
import bcrypt from "bcryptjs";
import { isPasswordStrong } from "@/lib/password-policy";

// GET: 获取用户列表
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = session.user;

  // 检查权限
  if (!hasAnyRole(user.roles, ["STORE_MANAGER", "HQ_ADMIN"])) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId");

  const where: { storeId?: string } = {};
  
  // 店长只能查看自己门店的用户
  if (!hasAnyRole(user.roles, ["HQ_ADMIN"])) {
    where.storeId = user.storeId || undefined;
  } else if (storeId) {
    where.storeId = storeId;
  }

  const users = await prisma.user.findMany({
    where,
    include: {
      Store: true,
      Department: true,
    },
    orderBy: [{ Store: { code: "asc" } }, { Department: { code: "asc" } }, { name: "asc" }],
  });

  return NextResponse.json({ users });
}

// POST: 创建用户
// 🔒 生产环境安全控制：只有 HQ_ADMIN 可以创建用户
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const currentUser = session.user;

  // 🔒 严格权限控制：只有总部管理员 (HQ_ADMIN) 可以创建用户
  // 店长 (STORE_MANAGER) 需要联系管理员添加用户
  if (!hasAnyRole(currentUser.roles, ["HQ_ADMIN"])) {
    return NextResponse.json({ 
      error: "权限不足：只有管理员可以创建用户账号，请联系管理员" 
    }, { status: 403 });
  }

  const body = await request.json();
  const { account: accountRaw, name, password, roles, storeId, departmentId, nursingRole, customFormConfig } = body;
  const account = (accountRaw || "").trim();

  // 验证必填字段
  if (!account || !name || !password) {
    return NextResponse.json({ error: "账号、姓名和密码为必填项" }, { status: 400 });
  }

  // 密码强度验证（生产环境）
  if (!isPasswordStrong(password)) {
    return NextResponse.json(
      { error: "密码必须至少8位，且同时包含字母与数字" },
      { status: 400 }
    );
  }

  // 验证角色
  const roleArray: string[] = Array.isArray(roles) ? roles : ["STAFF"];
  if (roleArray.length === 0) {
    return NextResponse.json({ error: "至少需要一个角色" }, { status: 400 });
  }

  // 防止创建超级管理员（只能通过数据库直接操作）
  // 这样可以防止权限升级攻击
  // 注释掉这段如果需要管理员可以创建其他管理员
  // if (roleArray.includes("HQ_ADMIN")) {
  //   return NextResponse.json({ error: "无法通过此接口创建管理员账号" }, { status: 403 });
  // }

  // 检查账号是否已存在
  const existing = await prisma.user.findUnique({
    where: { account },
  });

  if (existing) {
    return NextResponse.json({ error: "账号已存在" }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        account,
        name,
        passwordHash,
        roles: JSON.stringify(roleArray),
        storeId: storeId || null,
        departmentId: departmentId || null,
        nursingRole: nursingRole || null,
        customFormConfig: customFormConfig || null,
        isActive: true,
      },
      include: {
        Store: true,
        Department: true,
      },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error("创建用户失败:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
