import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasAnyRole } from "@/lib/types";
import { AlertCircle } from "lucide-react";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = session.user;

  // 检查权限：只有店长和总管理员可以访问
  if (!hasAnyRole(user.roles, ["STORE_MANAGER", "HQ_ADMIN"])) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="h-5 w-5" />
            无权限访问
          </CardTitle>
          <CardDescription>
            只有店长或管理员可以访问管理中心。
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // 获取统计数据
  const [
    userCount,
    storeCount,
    todayReportCount,
    consultationCount,
    permissionCount,
  ] = await Promise.all([
    prisma.user.count({
      where: user.storeId ? { storeId: user.storeId, isActive: true } : { isActive: true },
    }),
    hasAnyRole(user.roles, ["HQ_ADMIN"]) 
      ? prisma.store.count({ where: { isActive: true } })
      : Promise.resolve(1),
    prisma.dailyReport.count({
      where: {
        ...(user.storeId ? { storeId: user.storeId } : {}),
        reportDate: new Date().toISOString().split("T")[0],
        status: "SUBMITTED",
      },
    }),
    prisma.patientConsultation.count({
      where: user.storeId ? { storeId: user.storeId } : {},
    }),
    prisma.consultationViewPermission.count({
      where: user.storeId ? { storeId: user.storeId } : {},
    }),
  ]);

  // 获取门店列表（仅HQ_ADMIN）
  const stores = hasAnyRole(user.roles, ["HQ_ADMIN"])
    ? await prisma.store.findMany({
        where: { isActive: true },
        orderBy: { code: "asc" },
      })
    : user.storeId
      ? await prisma.store.findMany({ where: { id: user.storeId } })
      : [];

  // 获取部门列表
  const departments = await prisma.department.findMany({
    orderBy: { code: "asc" },
  });

  // 获取非咨询部用户（用于权限管理）
  const nonConsultUsers = await prisma.user.findMany({
    where: {
      ...(user.storeId ? { storeId: user.storeId } : {}),
      isActive: true,
      department: { code: { not: "CONSULTATION" } },
    },
    select: {
      id: true,
      name: true,
      account: true,
      department: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">管理中心</h1>
        <p className="text-gray-500 mt-1">
          系统配置与权限管理
        </p>
      </div>

      <AdminDashboard 
        user={user}
        stats={{
          userCount,
          storeCount,
          todayReportCount,
          consultationCount,
          permissionCount,
        }}
        stores={stores}
        departments={departments}
        nonConsultUsers={nonConsultUsers}
      />
    </div>
  );
}



