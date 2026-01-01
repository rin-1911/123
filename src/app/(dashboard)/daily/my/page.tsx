import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MultiDeptReport } from "@/components/daily/multi-dept-report";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEPARTMENT_LABELS, type DepartmentCode, hasAnyRole } from "@/lib/types";
import { AlertCircle, FileText } from "lucide-react";
import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function MyDailyReportPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const user = session.user;

  // 店长和运营可以填写经营日报
  const isManager = hasAnyRole(user.roles, ["STORE_MANAGER", "REGION_MANAGER", "HQ_ADMIN"]);

  // 获取用户的完整信息（包含额外部门）
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      departmentId: true,
      extraDepartmentIds: true,
    }
  });

  // 解析用户的所有部门ID
  let userDepartmentIds: string[] = [];
  if (dbUser?.departmentId) {
    userDepartmentIds.push(dbUser.departmentId);
  }
  if (dbUser?.extraDepartmentIds) {
    try {
      const extraIds = JSON.parse(dbUser.extraDepartmentIds);
      if (Array.isArray(extraIds)) {
        userDepartmentIds.push(...extraIds);
      }
    } catch {
      // ignore parse error
    }
  }

  // 获取所有部门
  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" }
  });

  // 检查用户是否有部门
  if (userDepartmentIds.length === 0 && !isManager) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="h-5 w-5" />
            暂无日报表单
          </CardTitle>
          <CardDescription>
            您的账号未分配部门，无法填写日报。请联系管理员。
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // 为店长设置默认的部门代码
  const effectiveDepartmentCode = user.departmentCode || (isManager ? "MANAGEMENT" : null);
  const userWithDept = {
    ...user,
    departmentCode: effectiveDepartmentCode,
  };

  // 如果是店长且没有部门，添加管理层部门
  if (isManager && userDepartmentIds.length === 0) {
    const managementDept = departments.find(d => d.code === "MANAGEMENT");
    if (managementDept) {
      userDepartmentIds.push(managementDept.id);
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的日报</h1>
          <p className="text-gray-500 mt-1">
            {user.storeName || "总部"} · {DEPARTMENT_LABELS[effectiveDepartmentCode as DepartmentCode] || "管理层"}
            {userDepartmentIds.length > 1 && (
              <span className="ml-2 text-cyan-600">
                （共 {userDepartmentIds.length} 个部门）
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/daily/team">
            <span className="text-sm text-cyan-600 hover:text-cyan-700 flex items-center gap-1">
              <FileText className="h-4 w-4" />
              查看团队日报
            </span>
          </Link>
        </div>
      </div>

      <MultiDeptReport 
        user={userWithDept} 
        departments={departments}
        userDepartmentIds={userDepartmentIds}
      />
    </div>
  );
}
