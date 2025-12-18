import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasAnyRole } from "@/lib/types";

/**
 * GET: 获取咨询记录查看权限列表
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = session.user;

  // 只有管理员可以查看权限列表
  if (!hasAnyRole(user.roles, ["HQ_ADMIN", "STORE_MANAGER"])) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId") || user.storeId;

  if (!storeId) {
    return NextResponse.json({ error: "缺少门店参数" }, { status: 400 });
  }

  try {
    const permissions = await prisma.consultationViewPermission.findMany({
      where: { storeId },
      include: {
        User_ConsultationViewPermission_userIdToUser: {
          select: {
            id: true,
            name: true,
            account: true,
            Department: { select: { name: true } },
          },
        },
        User_ConsultationViewPermission_grantedByIdToUser: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ permissions });
  } catch (error) {
    console.error("获取权限列表失败:", error);
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

/**
 * POST: 创建/更新咨询记录查看权限
 */
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = session.user;

  // 只有管理员可以授权
  if (!hasAnyRole(user.roles, ["HQ_ADMIN", "STORE_MANAGER"])) {
    return NextResponse.json({ error: "只有管理员可以授权" }, { status: 403 });
  }

  try {
    const data = await request.json();

    if (!data.userId) {
      return NextResponse.json({ error: "请选择用户" }, { status: 400 });
    }

    const storeId = data.storeId || user.storeId;
    if (!storeId) {
      return NextResponse.json({ error: "缺少门店参数" }, { status: 400 });
    }

    // 创建或更新权限
    const permission = await prisma.consultationViewPermission.upsert({
      where: {
        userId_storeId: {
          userId: data.userId,
          storeId,
        },
      },
      update: {
        canViewAll: data.canViewAll ?? false,
        canViewStats: data.canViewStats ?? true,
        canExport: data.canExport ?? false,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        isActive: data.isActive ?? true,
        grantedById: user.id,
      },
      create: {
        userId: data.userId,
        storeId,
        grantedById: user.id,
        canViewAll: data.canViewAll ?? false,
        canViewStats: data.canViewStats ?? true,
        canExport: data.canExport ?? false,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
        isActive: data.isActive ?? true,
      },
      include: {
        User_ConsultationViewPermission_userIdToUser: {
          select: {
            id: true,
            name: true,
            Department: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      permission,
    });
  } catch (error) {
    console.error("创建权限失败:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}

/**
 * DELETE: 删除权限
 */
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = session.user;

  // 只有管理员可以删除权限
  if (!hasAnyRole(user.roles, ["HQ_ADMIN", "STORE_MANAGER"])) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const permissionId = searchParams.get("id");

  if (!permissionId) {
    return NextResponse.json({ error: "缺少权限ID" }, { status: 400 });
  }

  try {
    await prisma.consultationViewPermission.delete({
      where: { id: permissionId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除权限失败:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}



