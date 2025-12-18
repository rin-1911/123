import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasAnyRole } from "@/lib/types";

// GET: 获取门店列表
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get("includeInactive") === "1";

  const stores = await prisma.store.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { code: "asc" },
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

  return NextResponse.json({ stores });
}

// POST: 创建门店（仅 HQ_ADMIN）
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = session.user;
  if (!hasAnyRole(user.roles, ["HQ_ADMIN"])) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await request.json();
  const { code, name, city, address, chairCnt, isActive } = body ?? {};

  if (!code || !name) {
    return NextResponse.json({ error: "门店编码与门店名称为必填项" }, { status: 400 });
  }

  try {
    const exists = await prisma.store.findUnique({ where: { code } });
    if (exists) {
      return NextResponse.json({ error: "门店编码已存在" }, { status: 400 });
    }

    const store = await prisma.store.create({
      data: {
        code: String(code).trim(),
        name: String(name).trim(),
        city: city ? String(city).trim() : null,
        address: address ? String(address).trim() : null,
        chairCnt: Number.isFinite(Number(chairCnt)) ? Math.max(0, Number(chairCnt)) : 0,
        isActive: isActive !== false,
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
    console.error("创建门店失败:", e);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}

