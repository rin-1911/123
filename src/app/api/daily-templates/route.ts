import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasAnyRole } from "@/lib/types";

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") || "";
  const departmentId = searchParams.get("departmentId") || "";
  const subDept = searchParams.get("subDept") || "";

  if (!role) return badRequest("缺少 role");
  if (!departmentId) return badRequest("缺少 departmentId");

  const template = await prisma.dailyReportTemplate.findUnique({
    where: {
      role_departmentId_schemaId: {
        role,
        departmentId,
        schemaId: subDept, // 子部门作为 schemaId，没有则空字符串
      },
    },
  });

  return NextResponse.json({ template });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  // 🔒 只有 HQ_ADMIN 可以配置模板（中央集权）
  if (!hasAnyRole(session.user.roles, ["HQ_ADMIN"])) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return badRequest("无效 JSON");

  const role = String(body.role || "");
  const departmentId = String(body.departmentId || "");
  // 兼容两种传参方式：schemaId 或 subDept
  const schemaId = body.schemaId ? String(body.schemaId) : (body.subDept ? String(body.subDept) : "");
  const configJson = body.configJson; // 允许对象或字符串（兼容旧版本）

  if (!role) return badRequest("缺少 role");
  if (!departmentId) return badRequest("缺少 departmentId");
  if (!configJson) return badRequest("缺少 configJson");

  const parsedConfig =
    typeof configJson === "string" ? JSON.parse(configJson) : configJson;

  const template = await prisma.dailyReportTemplate.upsert({
    where: {
      role_departmentId_schemaId: {
        role,
        departmentId,
        schemaId,
      },
    },
    create: {
      role,
      departmentId,
      schemaId,
      configJson: parsedConfig,
    },
    update: {
      configJson: parsedConfig,
    },
  });

  return NextResponse.json({ template });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });

  if (!hasAnyRole(session.user.roles, ["HQ_ADMIN"])) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const role = searchParams.get("role") || "";
  const departmentId = searchParams.get("departmentId") || "";
  const subDept = searchParams.get("subDept") || "";

  if (!role) return badRequest("缺少 role");
  if (!departmentId) return badRequest("缺少 departmentId");

  await prisma.dailyReportTemplate.delete({
    where: {
      role_departmentId_schemaId: {
        role,
        departmentId,
        schemaId: subDept,
      },
    },
  });

  return NextResponse.json({ ok: true });
}


