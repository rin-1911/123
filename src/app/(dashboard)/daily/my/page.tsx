import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EnhancedReportForm } from "@/components/daily/enhanced-report-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEPARTMENT_LABELS, type DepartmentCode, hasAnyRole } from "@/lib/types";
import { AlertCircle, FileText } from "lucide-react";
import Link from "next/link";

export default async function MyDailyReportPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const user = session.user;

  // 店长和运营可以填写经营日报
  const isManager = hasAnyRole(user.roles, ["STORE_MANAGER", "REGION_MANAGER", "HQ_ADMIN"]);

  // 检查用户是否有部门
  if (!user.departmentCode && !isManager) {
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的日报</h1>
          <p className="text-gray-500 mt-1">
            {user.storeName || "总部"} · {DEPARTMENT_LABELS[effectiveDepartmentCode as DepartmentCode] || "管理层"}
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

      <EnhancedReportForm user={userWithDept} />
    </div>
  );
}
