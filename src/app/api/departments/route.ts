import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasAnyRole } from "@/lib/types";

// GET: 获取部门列表
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const departments = await prisma.department.findMany({
    orderBy: { code: "asc" },
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

  return NextResponse.json({ departments });
}

// POST: 创建部门
export async function POST(request: NextRequest) {
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
    const { code, name } = body;

    if (!code || !name) {
      return NextResponse.json({ error: "编码和名称为必填项" }, { status: 400 });
    }

    // 检查编码唯一性
    const existing = await prisma.department.findUnique({
      where: { code },
    });

    if (existing) {
      return NextResponse.json({ error: "部门编码已存在" }, { status: 400 });
    }

    const department = await prisma.department.create({
      data: {
        code,
        name,
      },
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
    console.error("创建部门失败:", error);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}













