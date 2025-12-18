import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasAnyRole } from "@/lib/types";
import { AlertCircle } from "lucide-react";
import { UserManagement } from "@/components/admin/user-management";
import type { Store } from "@prisma/client";

export default async function UsersPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = session.user;

  // 检查权限
  if (!hasAnyRole(user.roles, ["STORE_MANAGER", "HQ_ADMIN"])) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="h-5 w-5" />
            无权限访问
          </CardTitle>
          <CardDescription>
            只有店长或总部管理员可以管理用户。
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // 获取门店列表
  let stores: Store[] = [];
  if (hasAnyRole(user.roles, ["HQ_ADMIN"])) {
    stores = await prisma.store.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
    });
  } else if (user.storeId) {
    const store = await prisma.store.findUnique({
      where: { id: user.storeId },
    });
    if (store) stores = [store];
  }

  // 获取部门列表
  const departments = await prisma.department.findMany({
    orderBy: { code: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">用户管理</h1>
        <p className="text-gray-500 mt-1">
          管理系统用户、角色和权限
        </p>
      </div>

      <UserManagement 
        currentUser={user} 
        stores={stores} 
        departments={departments} 
      />
    </div>
  );
}
