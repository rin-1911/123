import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { StoreReportView } from "@/components/reports/store-report-view";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasAnyRole } from "@/lib/types";
import { AlertCircle } from "lucide-react";
import type { Store } from "@prisma/client";

export default async function StoreReportPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = session.user;

  // 检查权限
  if (!hasAnyRole(user.roles, ["STORE_MANAGER", "REGION_MANAGER", "HQ_ADMIN", "FINANCE"])) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="h-5 w-5" />
            无权限访问
          </CardTitle>
          <CardDescription>
            只有店长、区域经理、总部管理员或财务可以查看门店报表。
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // 获取门店列表
  let stores: Store[] = [];
  try {
    if (hasAnyRole(user.roles, ["HQ_ADMIN", "REGION_MANAGER", "FINANCE"])) {
      stores = await prisma.store.findMany({
        where: {
          isActive: true,
          NOT: [{ code: "HQ" }, { name: { contains: "总部" } }],
        },
        orderBy: { code: "asc" },
      });
    } else if (user.storeId) {
      const store = await prisma.store.findUnique({
        where: { id: user.storeId },
      });
      if (store) {
        stores = [store];
      }
    }
  } catch {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            数据库连接失败
          </CardTitle>
          <CardDescription>
            当前无法连接数据库服务，请检查 DATABASE_URL 配置或数据库是否可访问。
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <StoreReportView user={user} stores={stores} />
    </div>
  );
}
