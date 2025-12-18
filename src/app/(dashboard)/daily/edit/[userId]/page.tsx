import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { EnhancedReportForm } from "@/components/daily/enhanced-report-form";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { hasAnyRole } from "@/lib/types";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { getSchemaForRole, NursingRole } from "@/lib/schemas";
import type { DepartmentCode, Role } from "@/lib/types";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PageProps {
  params: { userId: string };
  searchParams: { date?: string };
}

export default async function EditUserReportPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const currentUser = session.user;

  // 检查权限：只有店长和管理员可以编辑他人日报
  if (!hasAnyRole(currentUser.roles, ["STORE_MANAGER", "HQ_ADMIN"])) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="h-5 w-5" />
            无权限访问
          </CardTitle>
          <CardDescription>
            只有店长或管理员可以编辑他人日报。
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // 获取目标用户信息
  const targetUser = await prisma.user.findUnique({
    where: { id: params.userId },
    include: {
      Store: true,
      Department: true,
    },
  });

  if (!targetUser) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            用户不存在
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  // 店长只能编辑自己门店的用户
  if (!hasAnyRole(currentUser.roles, ["HQ_ADMIN"]) && targetUser.storeId !== currentUser.storeId) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="h-5 w-5" />
            无权限
          </CardTitle>
          <CardDescription>
            您只能编辑本门店用户的日报。
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const reportDate = searchParams.date || new Date().toISOString().split("T")[0];

  // 获取日报和锁定状态
  const [report, lock] = await Promise.all([
    prisma.dailyReport.findUnique({
      where: {
        userId_reportDate: {
          userId: targetUser.id,
          reportDate,
        },
      },
      include: {
        ConsultationReport: true,
        FrontDeskReport: true,
        OfflineMarketingReport: true,
        OnlineGrowthReport: true,
        MedicalReport: true,
        NursingReport: true,
        FinanceHrAdminReport: true,
      },
    }),
    targetUser.storeId
      ? prisma.storeDayLock.findUnique({
          where: {
            storeId_reportDate: {
              storeId: targetUser.storeId,
              reportDate,
            },
          },
        })
      : null,
  ]);

  // 获取表单 schema
  const roles = JSON.parse(targetUser.roles || '["STAFF"]') as Role[];
  const schema = targetUser.Department
    ? getSchemaForRole(
        targetUser.Department.code as DepartmentCode,
        roles,
        targetUser.nursingRole as NursingRole | undefined
      )
    : null;

  if (!schema) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="h-5 w-5" />
            无法获取表单
          </CardTitle>
          <CardDescription>
            该用户没有关联部门或表单配置。
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // 构建用户会话对象（用于表单组件）
  const targetUserSession = {
    id: targetUser.id,
    name: targetUser.name,
    account: targetUser.account,
    roles: roles,
    storeId: targetUser.storeId,
    storeName: targetUser.Store?.name || "",
    departmentId: targetUser.departmentId,
    departmentName: targetUser.Department?.name || "",
    departmentCode: targetUser.Department?.code as DepartmentCode | undefined,
    nursingRole: targetUser.nursingRole,
  };

  // 解析表单数据
  let formData = null;
  if (report?.formData) {
    try {
      formData = JSON.parse(report.formData);
    } catch {
      formData = null;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/daily/team">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回团队日报
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          编辑日报 - {targetUser.name}
        </h1>
        <p className="text-gray-500 mt-1">
          {targetUser.Department?.name} · {reportDate}
          {lock?.isLocked && (
            <span className="ml-2 text-orange-600">（日期已锁定，仅管理员可编辑）</span>
          )}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {schema.title}
          </CardTitle>
          <CardDescription>
            {schema.description}
          </CardDescription>
        </CardHeader>
      </Card>

      <EnhancedReportForm
        user={targetUserSession}
        schema={schema}
        initialData={formData || (report?.formData ? JSON.parse(report.formData) : null)}
        reportDate={reportDate}
        isLocked={false} // 管理员可以编辑锁定的日报
        status={report?.status || "DRAFT"}
        customFormConfig={targetUser.customFormConfig}
        isAdminEdit={true}
        targetUserId={targetUser.id}
      />
    </div>
  );
}



