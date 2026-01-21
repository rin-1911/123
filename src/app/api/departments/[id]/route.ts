import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasAnyRole } from "@/lib/types";

// PUT: 更新部门
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  // 🔒 只有总部管理员可以操作
  if (!hasAnyRole(session.user.roles, ["HQ_ADMIN"])) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, code } = body;
    const { id } = params;

    const data: any = {};
    if (name) data.name = name;
    if (code) data.code = code;

    const department = await prisma.department.update({
      where: { id },
      data,
      include: {
        _count: {
          select: {
            User: true,
            DailyReport: true,
            DailyReportTemplate: true,
          },
        },
      },
    });

    return NextResponse.json({ department });
  } catch (error) {
    console.error("更新部门失败:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}

// DELETE: 删除部门
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  // 🔒 只有总部管理员可以操作
  if (!hasAnyRole(session.user.roles, ["HQ_ADMIN"])) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    const { id } = params;

    // 检查是否有引用
    const count = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            User: true,
            DailyReport: true,
            DailyReportTemplate: true,
          },
        },
      },
    });

    if (count && (count._count.User > 0 || count._count.DailyReport > 0 || count._count.DailyReportTemplate > 0)) {
      return NextResponse.json({ error: "该部门下已有用户、日报或模板，无法删除" }, { status: 400 });
    }

    await prisma.department.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("删除部门失败:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
