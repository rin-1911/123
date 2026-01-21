import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasAnyRole } from "@/lib/types";

const CONFIG_KEY = "DEPT_REPORT_ROLE_BY_DEPT_CODE";

function parseJsonObject(raw: unknown): Record<string, unknown> | null {
  if (!raw) return {};
  if (typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, unknown>;
  if (typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as Record<string, unknown>;
    return null;
  } catch {
    return null;
  }
}

function isAllowedRole(value: unknown): boolean {
  return (
    value === "AUTO" ||
    value === "STAFF" ||
    value === "DEPT_LEAD" ||
    value === "STORE_MANAGER" ||
    value === "REGION_MANAGER" ||
    value === "HQ_ADMIN" ||
    value === "MEDICAL_QC" ||
    value === "FINANCE"
  );
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  if (!hasAnyRole(session.user.roles, ["HQ_ADMIN"])) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const storeIdRaw = searchParams.get("storeId");
  const storeId = storeIdRaw && storeIdRaw !== "null" && storeIdRaw !== "undefined" && storeIdRaw !== "" ? storeIdRaw : null;
  const scope = (searchParams.get("scope") || (storeId ? "STORE" : "GLOBAL")) as "STORE" | "GLOBAL";

  const flag = await prisma.configFlag.findFirst({
    where: {
      key: CONFIG_KEY,
      scope,
      storeId: scope === "STORE" ? storeId : null,
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    config: flag
      ? {
          id: flag.id,
          scope: flag.scope,
          storeId: flag.storeId,
          isActive: flag.isActive,
          key: flag.key,
          value: flag.value,
          parsedValue: parseJsonObject(flag.value),
          description: flag.description,
          updatedAt: flag.updatedAt,
        }
      : null,
  });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "未登录" }, { status: 401 });
  if (!hasAnyRole(session.user.roles, ["HQ_ADMIN"])) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "无效 JSON" }, { status: 400 });

  const scope = (body.scope || (body.storeId ? "STORE" : "GLOBAL")) as "STORE" | "GLOBAL";
  const storeIdRaw = body.storeId ? String(body.storeId) : null;
  const storeId = storeIdRaw && storeIdRaw !== "null" && storeIdRaw !== "undefined" && storeIdRaw !== "" ? storeIdRaw : null;
  const isActive = body.isActive !== undefined ? Boolean(body.isActive) : true;
  const description = body.description !== undefined ? String(body.description) : "部门报表口径角色配置";
  const valueObj = parseJsonObject(body.value);

  if (scope !== "STORE" && scope !== "GLOBAL") {
    return NextResponse.json({ error: "scope 只能是 STORE 或 GLOBAL" }, { status: 400 });
  }
  if (scope === "STORE" && !storeId) {
    return NextResponse.json({ error: "STORE 级配置必须提供 storeId" }, { status: 400 });
  }
  if (!valueObj) {
    return NextResponse.json({ error: "value 必须是 JSON 对象或对象字符串" }, { status: 400 });
  }

  const dictRoles = await prisma.dictionaryItem.findMany({
    where: { category: "user_roles", isActive: true },
    select: { value: true, name: true },
  });
  const allowedRoleValues = new Set<string>([
    "AUTO",
    ...dictRoles.map((r) => String(r.value || r.name)),
    "STAFF",
    "DEPT_LEAD",
    "STORE_MANAGER",
    "REGION_MANAGER",
    "HQ_ADMIN",
    "MEDICAL_QC",
    "FINANCE",
  ]);

  for (const [k, v] of Object.entries(valueObj)) {
    if (k === "default" || k === "*") {
      if (v !== null && v !== undefined && !allowedRoleValues.has(String(v)) && !isAllowedRole(v)) {
        return NextResponse.json({ error: "default 只允许 AUTO 或系统角色" }, { status: 400 });
      }
      continue;
    }
    if (v !== null && v !== undefined && !allowedRoleValues.has(String(v)) && !isAllowedRole(v)) {
      return NextResponse.json({ error: `部门 ${k} 的角色值不合法` }, { status: 400 });
    }
  }

  const finalStoreId = scope === "STORE" ? storeId : null;
  const flag = await prisma.configFlag.upsert({
    where: {
      scope_storeId_key: {
        scope,
        storeId: finalStoreId as any,
        key: CONFIG_KEY,
      },
    },
    update: {
      isActive,
      value: JSON.stringify(valueObj),
      description,
    },
    create: {
      scope,
      storeId: finalStoreId,
      key: CONFIG_KEY,
      isActive,
      value: JSON.stringify(valueObj),
      description,
    },
  });

  return NextResponse.json({ success: true, configFlag: flag });
}
