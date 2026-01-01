import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hasAnyRole } from "@/lib/types";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { DailyTemplateCenter } from "@/components/admin/daily-template-center";

export default async function DailyTemplatesPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const user = session.user;

  // 只有 HQ_ADMIN 可以管理全院模板
  if (!hasAnyRole(user.roles, ["HQ_ADMIN"])) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="h-5 w-5" />
            无权限访问
          </CardTitle>
          <CardDescription>只有总部管理员可以访问“统一日报配置中心”。</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const departments = await prisma.department.findMany({ orderBy: { code: "asc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">统一日报配置中心</h1>
        <p className="text-gray-500 mt-1">
          按“角色 + 部门（+ 子部门）”统一管理日报模板：新增/删除字段、拖拽排序、必填切换。
        </p>
      </div>

      <DailyTemplateCenter departments={departments} />
    </div>
  );
}


