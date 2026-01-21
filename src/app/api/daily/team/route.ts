import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewReportList } from "@/lib/rbac";
import { hasAnyRole } from "@/lib/types";
import { getToday } from "@/lib/utils";

// 强制不缓存，确保管理员看到的是实时数据
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const user = session.user;
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId") || user.storeId;
  const reportDate = searchParams.get("date") || getToday();
  const departmentId = searchParams.get("departmentId");

  if (!storeId) {
    return NextResponse.json({ error: "缺少门店参数" }, { status: 400 });
  }

  // 检查权限
  const permCheck = canViewReportList(
    user,
    storeId,
    departmentId !== "all" ? departmentId || undefined : undefined
  );
  if (!permCheck.allowed) {
    return NextResponse.json({ error: permCheck.reason }, { status: 403 });
  }

  try {
    const allDepartments = await prisma.department.findMany({
      orderBy: { code: "asc" },
    });
    const departmentById = new Map(allDepartments.map((d) => [d.id, d]));
    const departmentRankById = new Map(allDepartments.map((d, idx) => [d.id, idx]));

    const parseExtraDepartmentIds = (raw: string | null | undefined): string[] => {
      if (!raw) return [];
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
      } catch {
        return [];
      }
    };

    const effectiveDepartmentId =
      hasAnyRole(user.roles, ["DEPT_LEAD"]) &&
      !hasAnyRole(user.roles, ["STORE_MANAGER", "HQ_ADMIN"]) &&
      user.departmentId
        ? user.departmentId
        : departmentId && departmentId !== "all"
          ? departmentId
          : undefined;

    const where: any = {
      storeId,
      isActive: true,
    };

    if (effectiveDepartmentId) {
      where.OR = [
        { departmentId: effectiveDepartmentId },
        { extraDepartmentIds: { contains: `"${effectiveDepartmentId}"` } },
      ];
    }

    // 获取成员列表
    const members = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        account: true,
        departmentId: true,
        extraDepartmentIds: true,
        Department: {
          select: { id: true, code: true, name: true },
        },
        DailyReport: {
          where: { reportDate },
          select: {
            departmentId: true,
            status: true,
            submittedAt: true,
          },
        },
      },
      orderBy: [{ Department: { code: "asc" } }, { name: "asc" }],
    });

    const relevantMembers = members.filter((m) => {
      if (effectiveDepartmentId) return true;
      if (m.departmentId) return true;
      return parseExtraDepartmentIds(m.extraDepartmentIds).length > 0;
    });

    const formattedMembers = relevantMembers.map((m) => {
      const primaryDepartmentId = m.departmentId || m.Department?.id || null;
      const report =
        effectiveDepartmentId
          ? m.DailyReport.find((r) => r.departmentId === effectiveDepartmentId) || null
          : primaryDepartmentId
            ? m.DailyReport.find((r) => r.departmentId === primaryDepartmentId) || null
            : null;

      const departmentName =
        effectiveDepartmentId
          ? departmentById.get(effectiveDepartmentId)?.name || ""
          : primaryDepartmentId
            ? departmentById.get(primaryDepartmentId)?.name || m.Department?.name || ""
            : "";

      return {
        id: m.id,
        name: m.name,
        account: m.account,
        departmentName,
        report,
      };
    });

    // 计算部门汇总
    const deptMap = new Map<
      string,
      {
        departmentId: string;
        departmentCode: string;
        departmentName: string;
        totalUsers: number;
        submittedCount: number;
        draftCount: number;
      }
    >();

    if (!effectiveDepartmentId) {
      for (const dept of allDepartments) {
        deptMap.set(dept.id, {
          departmentId: dept.id,
          departmentCode: dept.code,
          departmentName: dept.name,
          totalUsers: 0,
          submittedCount: 0,
          draftCount: 0,
        });
      }
    }

    for (const m of relevantMembers) {
      const primaryId = m.departmentId || m.Department?.id || null;
      const extraIds = parseExtraDepartmentIds(m.extraDepartmentIds);
      const departmentIds = Array.from(new Set([primaryId, ...extraIds].filter(Boolean))) as string[];

      for (const deptId of departmentIds) {
        const dept = departmentById.get(deptId);
        if (!dept) continue;

        if (!deptMap.has(deptId)) {
          deptMap.set(deptId, {
            departmentId: dept.id,
            departmentCode: dept.code,
            departmentName: dept.name,
            totalUsers: 0,
            submittedCount: 0,
            draftCount: 0,
          });
        }

        const summary = deptMap.get(deptId)!;
        summary.totalUsers++;

        const report = m.DailyReport.find((r) => r.departmentId === deptId);
        if (report?.status === "SUBMITTED") {
          summary.submittedCount++;
        } else if (report?.status === "DRAFT") {
          summary.draftCount++;
        }
      }
    }

    const summaries = Array.from(deptMap.values()).sort((a, b) => {
      const aRank = departmentRankById.get(a.departmentId) ?? Number.MAX_SAFE_INTEGER;
      const bRank = departmentRankById.get(b.departmentId) ?? Number.MAX_SAFE_INTEGER;
      if (aRank !== bRank) return aRank - bRank;
      return a.departmentName.localeCompare(b.departmentName, "zh-CN");
    });

    return NextResponse.json({
      members: formattedMembers,
      summaries,
    });
  } catch (error) {
    console.error("获取团队数据失败:", error);
    return NextResponse.json({ error: "获取数据失败" }, { status: 500 });
  }
}
