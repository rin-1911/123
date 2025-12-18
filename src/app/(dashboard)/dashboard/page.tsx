import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, getToday, centsToYuan } from "@/lib/utils";
import { ROLE_LABELS, DEPARTMENT_LABELS, type DepartmentCode, hasAnyRole } from "@/lib/types";
import Link from "next/link";
import { 
  FileEdit, 
  Users, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Building2
} from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session!.user;
  const today = getToday();

  // 并行获取今日日报状态和锁定状态
  const [todayReport, todayLock] = await Promise.all([
    prisma.dailyReport.findUnique({
      where: {
        userId_reportDate: {
          userId: user.id,
          reportDate: today,
        },
      },
    }),
    user.storeId
      ? prisma.storeDayLock.findUnique({
          where: {
            storeId_reportDate: {
              storeId: user.storeId,
              reportDate: today,
            },
          },
        })
      : null,
  ]);

  // 获取门店今日提交统计（仅店长/管理员可见）
  let storeStats = null;
  if (hasAnyRole(user.roles, ["STORE_MANAGER", "HQ_ADMIN", "REGION_MANAGER"]) && user.storeId) {
    const [totalUsers, submittedReports] = await Promise.all([
      prisma.user.count({
        where: {
          storeId: user.storeId,
          isActive: true,
          department: {
            code: { not: "MANAGEMENT" },
          },
        },
      }),
      prisma.dailyReport.count({
        where: {
          storeId: user.storeId,
          reportDate: today,
          status: "SUBMITTED",
        },
      }),
    ]);
    storeStats = { totalUsers, submittedReports };
  }

  // 获取部门今日提交统计（仅部门负责人可见）
  let deptStats = null;
  if (hasAnyRole(user.roles, ["DEPT_LEAD"]) && user.storeId && user.departmentId) {
    const [totalUsers, submittedReports] = await Promise.all([
      prisma.user.count({
        where: {
          storeId: user.storeId,
          departmentId: user.departmentId,
          isActive: true,
        },
      }),
      prisma.dailyReport.count({
        where: {
          storeId: user.storeId,
          departmentId: user.departmentId,
          reportDate: today,
          status: "SUBMITTED",
        },
      }),
    ]);
    deptStats = { totalUsers, submittedReports };
  }

  // 获取最近7天的汇总数据（简化版）
  const recentDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return formatDate(d);
  });

  let recentSummary = null;
  if (hasAnyRole(user.roles, ["STORE_MANAGER", "HQ_ADMIN", "FINANCE"]) && user.storeId) {
    const consultReports = await prisma.consultationReport.findMany({
      where: {
        dailyReport: {
          storeId: user.storeId,
          reportDate: { in: recentDates },
          status: "SUBMITTED",
        },
      },
      include: {
        dailyReport: true,
      },
    });

    const totalCash = consultReports.reduce((sum, r) => sum + r.cashInCents, 0);
    const totalDeals = consultReports.reduce((sum, r) => sum + r.dealsTotal, 0);
    const totalInitial = consultReports.reduce((sum, r) => sum + r.initialTotal, 0);

    recentSummary = {
      totalCash,
      totalDeals,
      totalInitial,
      avgDailyCash: consultReports.length > 0 ? totalCash / 7 : 0,
    };
  }

  return (
    <div className="space-y-6">
      {/* 欢迎卡片 */}
      <Card className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">
                你好，{user.name}
              </CardTitle>
              <CardDescription className="text-cyan-100 mt-1">
                {user.storeName || "总部"} · {user.departmentName || "管理层"} · {ROLE_LABELS[user.primaryRole]}
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-cyan-100">今天是</p>
              <p className="text-xl font-semibold">{today}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 快捷操作 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* 今日日报状态 */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">今日日报</CardTitle>
            <FileEdit className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                {todayReport ? (
                  <Badge variant={todayReport.status === "SUBMITTED" ? "success" : "warning"}>
                    {todayReport.status === "SUBMITTED" ? "已提交" : "草稿"}
                  </Badge>
                ) : (
                  <Badge variant="outline">未填写</Badge>
                )}
              </div>
              {user.departmentCode && user.departmentCode !== "MANAGEMENT" && (
                <Link
                  href="/daily/my"
                  className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
                >
                  去填写 →
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 锁定状态 */}
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">数据锁定</CardTitle>
            {todayLock?.isLocked ? (
              <AlertCircle className="h-4 w-4 text-orange-500" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {todayLock?.isLocked ? (
                <span className="text-orange-600">已锁定</span>
              ) : (
                <span className="text-green-600">未锁定</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {todayLock?.isLocked ? "数据已锁定，无法修改" : "可正常填写和修改"}
            </p>
          </CardContent>
        </Card>

        {/* 部门提交情况（部门负责人可见） */}
        {deptStats && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">部门提交</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {deptStats.submittedReports}/{deptStats.totalUsers}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {DEPARTMENT_LABELS[user.departmentCode as DepartmentCode]}今日提交
              </p>
              <Link
                href="/daily/team"
                className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
              >
                查看详情 →
              </Link>
            </CardContent>
          </Card>
        )}

        {/* 门店提交情况（店长可见） */}
        {storeStats && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">门店提交</CardTitle>
              <Building2 className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {storeStats.submittedReports}/{storeStats.totalUsers}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {user.storeName}今日提交
              </p>
              <Link
                href="/daily/team"
                className="text-sm text-cyan-600 hover:text-cyan-700 font-medium"
              >
                查看详情 →
              </Link>
            </CardContent>
          </Card>
        )}

        {/* 最近7天业绩（店长/财务可见） */}
        {recentSummary && (
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">近7日实收</CardTitle>
              <TrendingUp className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-600">
                ¥{centsToYuan(recentSummary.totalCash)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                日均 ¥{centsToYuan(recentSummary.avgDailyCash)}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* 快捷入口 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {user.departmentCode && user.departmentCode !== "MANAGEMENT" && (
          <Link href="/daily/my">
            <Card className="hover:shadow-md hover:border-cyan-200 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center group-hover:bg-cyan-200 transition-colors">
                    <FileEdit className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">填写日报</CardTitle>
                    <CardDescription>填写今日工作数据</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        )}

        {hasAnyRole(user.roles, ["DEPT_LEAD", "STORE_MANAGER", "HQ_ADMIN"]) && (
          <Link href="/daily/team">
            <Card className="hover:shadow-md hover:border-cyan-200 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">团队日报</CardTitle>
                    <CardDescription>查看团队提交情况</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        )}

        {hasAnyRole(user.roles, ["STORE_MANAGER", "HQ_ADMIN", "FINANCE"]) && (
          <Link href="/reports/store">
            <Card className="hover:shadow-md hover:border-cyan-200 transition-all cursor-pointer group">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                    <TrendingUp className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base">门店报表</CardTitle>
                    <CardDescription>查看经营数据汇总</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        )}
      </div>

      {/* 系统公告 - 可折叠，默认折叠 */}
      <details className="group">
        <summary className="list-none cursor-pointer">
          <Card className="hover:bg-gray-50/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  使用提示
                </CardTitle>
                <span className="text-xs text-gray-400 group-open:hidden">点击展开</span>
                <span className="text-xs text-gray-400 hidden group-open:inline">点击收起</span>
              </div>
            </CardHeader>
          </Card>
        </summary>
        <Card className="mt-[-1px] rounded-t-none border-t-0">
          <CardContent className="text-sm text-gray-600 space-y-2 pt-0">
            <p>• 请每日下班前完成日报填写并提交</p>
            <p>• 店长锁定数据后，当日数据将无法修改</p>
            <p>• 如有数据异常，请联系店长或系统管理员</p>
            <p>• 系统不记录患者个人敏感信息，仅统计运营数据</p>
          </CardContent>
        </Card>
      </details>
    </div>
  );
}

