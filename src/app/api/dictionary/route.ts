import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasAnyRole } from "@/lib/types";

// GET: 获取字典项列表
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const where: { category?: string; isActive?: boolean } = {};
  
  if (category) {
    where.category = category;
  }

  // 非管理员只能看到启用的选项
  if (!hasAnyRole(session.user.roles, ["HQ_ADMIN"])) {
    where.isActive = true;
  }

  const items = await prisma.dictionaryItem.findMany({
    where,
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });

  return NextResponse.json({ items });
}

// POST: 创建字典项（仅管理员）
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  if (!hasAnyRole(session.user.roles, ["HQ_ADMIN"])) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await request.json();
  const { category, name, value, sortOrder } = body;

  if (!category || !name) {
    return NextResponse.json({ error: "类别和名称为必填项" }, { status: 400 });
  }

  try {
    const item = await prisma.dictionaryItem.create({
      data: {
        category,
        name,
        value: value || name,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "该选项已存在" }, { status: 400 });
    }
    console.error("创建字典项失败:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}

// PUT: 更新字典项（仅管理员）
export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  if (!hasAnyRole(session.user.roles, ["HQ_ADMIN"])) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await request.json();
  const { id, name, value, isActive, sortOrder } = body;

  if (!id) {
    return NextResponse.json({ error: "ID为必填项" }, { status: 400 });
  }

  try {
    const item = await prisma.dictionaryItem.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(value !== undefined && { value }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("更新字典项失败:", error);
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

// DELETE: 删除字典项（仅管理员）
export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  if (!hasAnyRole(session.user.roles, ["HQ_ADMIN"])) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID为必填项" }, { status: 400 });
  }

  try {
    await prisma.dictionaryItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除字典项失败:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}





