import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ConsultationRecordsView } from "@/components/consultations/consultation-records-view";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasAnyRole } from "@/lib/types";
import { AlertCircle } from "lucide-react";

export default async function ConsultationsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = session.user;

  // 检查权限：咨询部、管理员、或有查看权限的用户
  const isConsultant = user.departmentId && 
    await prisma.department.findFirst({
      where: { id: user.departmentId, code: "CONSULTATION" }
    });

  const hasPermission = await prisma.consultationViewPermission.findFirst({
    where: {
      userId: user.id,
      isActive: true,
      OR: [
        { validUntil: null },
        { validUntil: { gte: new Date() } }
      ]
    }
  });

  const canAccess = isConsultant || 
    hasAnyRole(user.roles, ["HQ_ADMIN", "STORE_MANAGER"]) || 
    hasPermission;

  if (!canAccess) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="h-5 w-5" />
            无权限访问
          </CardTitle>
          <CardDescription>
            只有咨询部人员、店长或经授权的用户可以访问咨询记录。
            <br />
            如需查看，请联系管理员开通权限。
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // 获取咨询师列表（用于筛选）
  const consultants = await prisma.user.findMany({
    where: {
      storeId: user.storeId || undefined,
      department: { code: "CONSULTATION" },
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });

  // 判断用户角色
  const userRole = {
    isAdmin: hasAnyRole(user.roles, ["HQ_ADMIN", "STORE_MANAGER"]),
    isDeptLead: hasAnyRole(user.roles, ["DEPT_LEAD"]),
    isConsultant: !!isConsultant,
    canViewAll: hasAnyRole(user.roles, ["HQ_ADMIN", "STORE_MANAGER", "DEPT_LEAD"]) || hasPermission?.canViewAll,
    canExport: hasAnyRole(user.roles, ["HQ_ADMIN", "STORE_MANAGER"]) || hasPermission?.canExport,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">患者咨询记录</h1>
        <p className="text-gray-500 mt-1">
          {userRole.isConsultant ? "记录每位患者的咨询情况" : "查看咨询记录统计"}
        </p>
      </div>

      <ConsultationRecordsView 
        user={user} 
        consultants={consultants}
        userRole={userRole}
      />
    </div>
  );
}



