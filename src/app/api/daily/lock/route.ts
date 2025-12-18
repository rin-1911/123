import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canLockDate } from "@/lib/rbac";

// POST: 锁定/解锁某日数据
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = session.user;

  // 检查权限
  const permCheck = canLockDate(user);
  if (!permCheck.allowed) {
    return NextResponse.json({ error: permCheck.reason }, { status: 403 });
  }

  if (!user.storeId) {
    return NextResponse.json({ error: "无门店权限" }, { status: 403 });
  }

  const body = await request.json();
  const { reportDate, isLocked, note } = body;

  if (!reportDate) {
    return NextResponse.json({ error: "参数不完整" }, { status: 400 });
  }

  try {
    const lock = await prisma.storeDayLock.upsert({
      where: {
        storeId_reportDate: {
          storeId: user.storeId,
          reportDate,
        },
      },
      update: {
        isLocked: isLocked ?? true,
        lockedAt: isLocked ? new Date() : null,
        lockedById: isLocked ? user.id : null,
        note,
      },
      create: {
        storeId: user.storeId,
        reportDate,
        isLocked: isLocked ?? true,
        lockedAt: isLocked ? new Date() : null,
        lockedById: isLocked ? user.id : null,
        note,
      },
    });

    return NextResponse.json({ success: true, lock });
  } catch (error) {
    console.error("锁定失败:", error);
    return NextResponse.json({ error: "操作失败" }, { status: 500 });
  }
}

// GET: 获取锁定状态
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId") || session.user.storeId;
  const reportDate = searchParams.get("date");

  if (!storeId || !reportDate) {
    return NextResponse.json({ error: "参数不完整" }, { status: 400 });
  }

  const lock = await prisma.storeDayLock.findUnique({
    where: {
      storeId_reportDate: {
        storeId,
        reportDate,
      },
    },
    include: {
      User: {
        select: { name: true },
      },
    },
  });

  return NextResponse.json({ lock });
}







