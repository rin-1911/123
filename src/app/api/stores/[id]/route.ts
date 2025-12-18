import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasAnyRole } from "@/lib/types";

// PUT: 更新门店（仅 HQ_ADMIN）
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = session.user;
  if (!hasAnyRole(user.roles, ["HQ_ADMIN"])) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await request.json();
  const { name, city, address, chairCnt, isActive } = body ?? {};

  try {
    const store = await prisma.store.update({
      where: { id: params.id },
      data: {
        name: name !== undefined ? String(name).trim() : undefined,
        city: city !== undefined ? (city ? String(city).trim() : null) : undefined,
        address: address !== undefined ? (address ? String(address).trim() : null) : undefined,
        chairCnt:
          chairCnt !== undefined
            ? Math.max(0, Number.isFinite(Number(chairCnt)) ? Number(chairCnt) : 0)
            : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined,
      },
      include: {
        _count: {
          select: {
            users: true,
            locks: true,
            reports: true,
            channels: true,
            configs: true,
            storeAccess: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, store });
  } catch (e) {
    console.error("更新门店失败:", e);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

// DELETE: 删除门店（仅 HQ_ADMIN，且必须无关联数据）
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = session.user;
  if (!hasAnyRole(user.roles, ["HQ_ADMIN"])) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const store = await prisma.store.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            users: true,
            locks: true,
            reports: true,
            channels: true,
            configs: true,
            storeAccess: true,
          },
        },
      },
    });

    if (!store) {
      return NextResponse.json({ error: "门店不存在" }, { status: 404 });
    }

    const totalRefs =
      store._count.users +
      store._count.locks +
      store._count.reports +
      store._count.channels +
      store._count.configs +
      store._count.storeAccess;

    if (totalRefs > 0) {
      return NextResponse.json(
        { error: "该门店存在关联数据，无法删除。建议先停用（保留历史数据）。" },
        { status: 409 }
      );
    }

    await prisma.store.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("删除门店失败:", e);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}








