import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewReportList } from "@/lib/rbac";
import { hasAnyRole } from "@/lib/types";
import { getToday } from "@/lib/utils";

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
    // 构建查询条件
    const where: {
      storeId: string;
      isActive: boolean;
      department?: { code: { not: string } };
      departmentId?: string;
    } = {
      storeId,
      isActive: true,
      department: { code: { not: "MANAGEMENT" } },
    };

    // 部门负责人只能看自己部门
    if (hasAnyRole(user.roles, ["DEPT_LEAD"]) && !hasAnyRole(user.roles, ["STORE_MANAGER", "HQ_ADMIN"]) && user.departmentId) {
      where.departmentId = user.departmentId;
    } else if (departmentId && departmentId !== "all") {
      where.departmentId = departmentId;
    }

    // 获取成员列表
    const members = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        account: true,
        department: {
          select: { id: true, code: true, name: true },
        },
        reports: {
          where: { reportDate },
          select: {
            status: true,
            submittedAt: true,
          },
        },
      },
      orderBy: [{ department: { code: "asc" } }, { name: "asc" }],
    });

    const formattedMembers = members.map((m) => ({
      id: m.id,
      name: m.name,
      account: m.account,
      departmentName: m.department?.name || "",
      report: m.reports[0] || null,
    }));

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

    for (const m of members) {
      if (!m.department) continue;

      const key = m.department.id;
      if (!deptMap.has(key)) {
        deptMap.set(key, {
          departmentId: m.department.id,
          departmentCode: m.department.code,
          departmentName: m.department.name,
          totalUsers: 0,
          submittedCount: 0,
          draftCount: 0,
        });
      }

      const summary = deptMap.get(key)!;
      summary.totalUsers++;

      const report = m.reports[0];
      if (report?.status === "SUBMITTED") {
        summary.submittedCount++;
      } else if (report?.status === "DRAFT") {
        summary.draftCount++;
      }
    }

    const summaries = Array.from(deptMap.values());

    return NextResponse.json({
      members: formattedMembers,
      summaries,
    });
  } catch (error) {
    console.error("获取团队数据失败:", error);
    return NextResponse.json({ error: "获取数据失败" }, { status: 500 });
  }
}

