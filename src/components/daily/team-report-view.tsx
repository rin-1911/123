"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import type { UserSession, DepartmentCode } from "@/lib/types";
import { DEPARTMENT_LABELS, STATUS_LABELS, hasAnyRole } from "@/lib/types";
import { getToday, formatDate } from "@/lib/utils";
import { 
  ChevronLeft, 
  ChevronRight, 
  Lock, 
  Unlock, 
  Users,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";

interface TeamReportViewProps {
  user: UserSession;
  stores: { id: string; code: string; name: string }[];
  departments: { id: string; code: string; name: string }[];
}

interface TeamMember {
  id: string;
  name: string;
  account: string;
  departmentName: string;
  report: {
    status: string;
    submittedAt: string | null;
  } | null;
}

interface DeptSummary {
  departmentId: string;
  departmentCode: string;
  departmentName: string;
  totalUsers: number;
  submittedCount: number;
  draftCount: number;
}

export function TeamReportView({ user, stores, departments }: TeamReportViewProps) {
  const { toast } = useToast();
  const [reportDate, setReportDate] = useState(getToday());
  const [selectedStoreId, setSelectedStoreId] = useState(user.storeId || stores[0]?.id || "");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [deptSummaries, setDeptSummaries] = useState<DeptSummary[]>([]);

  // 加载团队数据
  useEffect(() => {
    async function loadTeamData() {
      if (!selectedStoreId) return;

      setIsLoading(true);
      try {
        // 获取锁定状态
        const lockRes = await fetch(`/api/daily/lock?storeId=${selectedStoreId}&date=${reportDate}`);
        const lockData = await lockRes.json();
        setIsLocked(lockData.lock?.isLocked ?? false);

        // 获取团队数据
        const teamRes = await fetch(
          `/api/daily/team?storeId=${selectedStoreId}&date=${reportDate}&departmentId=${selectedDeptId}`
        );
        const teamData = await teamRes.json();

        setTeamMembers(teamData.members || []);
        setDeptSummaries(teamData.summaries || []);
      } catch {
        toast({
          title: "加载失败",
          description: "无法加载团队数据",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadTeamData();
  }, [selectedStoreId, selectedDeptId, reportDate, toast]);

  // 锁定/解锁
  const handleToggleLock = async () => {
    try {
      const res = await fetch("/api/daily/lock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportDate,
          isLocked: !isLocked,
        }),
      });

      if (!res.ok) {
        throw new Error("操作失败");
      }

      setIsLocked(!isLocked);
      toast({
        title: isLocked ? "已解锁" : "已锁定",
        description: isLocked ? "员工可以修改该日数据" : "该日数据已锁定",
      });
    } catch {
      toast({
        title: "操作失败",
        description: "请稍后重试",
        variant: "destructive",
      });
    }
  };

  // 日期切换
  const changeDate = (days: number) => {
    const date = new Date(reportDate);
    date.setDate(date.getDate() + days);
    setReportDate(formatDate(date));
  };

  // 计算统计
  const totalMembers = teamMembers.length;
  const submittedCount = teamMembers.filter((m) => m.report?.status === "SUBMITTED").length;
  const draftCount = teamMembers.filter((m) => m.report?.status === "DRAFT").length;
  const notFilledCount = totalMembers - submittedCount - draftCount;

  return (
    <div className="space-y-5">
      {/* 筛选栏 */}
      <Card className="border-0 shadow-sm bg-white">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* 门店选择 */}
            {stores.length > 1 && (
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                <span className="text-sm font-medium text-gray-600">🏪 门店</span>
                <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                  <SelectTrigger className="w-[160px] border-0 bg-white shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 部门选择 */}
            {hasAnyRole(user.roles, ["STORE_MANAGER", "HQ_ADMIN"]) && (
              <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                <span className="text-sm font-medium text-gray-600">🏢 部门</span>
                <Select value={selectedDeptId} onValueChange={setSelectedDeptId}>
                  <SelectTrigger className="w-[140px] border-0 bg-white shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">📋 全部部门</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 日期选择 */}
            <div className="flex items-center gap-1 ml-auto bg-gray-50 rounded-lg p-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => changeDate(-1)}
                className="hover:bg-white rounded-md"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-4 py-1.5 bg-white rounded-md font-semibold min-w-[130px] text-center shadow-sm">
                📅 {reportDate}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => changeDate(1)}
                disabled={reportDate >= getToday()}
                className="hover:bg-white rounded-md"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* 锁定状态与按钮 */}
            {hasAnyRole(user.roles, ["STORE_MANAGER", "HQ_ADMIN"]) && (
              <Button
                variant={isLocked ? "destructive" : "outline"}
                onClick={handleToggleLock}
                className={isLocked 
                  ? "bg-red-500 hover:bg-red-600 border-0" 
                  : "border-gray-200 hover:bg-gray-50"
                }
              >
                {isLocked ? (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    已锁定（点击解锁）
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4 mr-2" />
                    锁定日期
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 统计概览 */}
      <Card className="bg-gradient-to-r from-slate-50 to-blue-50 border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="grid gap-6 md:grid-cols-4">
            {/* 总人数 */}
            <div className="text-center p-4 bg-white rounded-xl shadow-sm">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{totalMembers}</div>
              <div className="text-sm text-gray-500 mt-1">总人数</div>
            </div>

            {/* 已提交 */}
            <div className="text-center p-4 bg-white rounded-xl shadow-sm">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-3">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-green-600">{submittedCount}</div>
              <div className="text-sm text-gray-500 mt-1">已提交</div>
              {totalMembers > 0 && (
                <div className="text-xs text-green-600 mt-1">
                  {Math.round(submittedCount / totalMembers * 100)}%
                </div>
              )}
            </div>

            {/* 草稿 */}
            <div className="text-center p-4 bg-white rounded-xl shadow-sm">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mb-3">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="text-3xl font-bold text-yellow-600">{draftCount}</div>
              <div className="text-sm text-gray-500 mt-1">草稿中</div>
            </div>

            {/* 未填写 */}
            <div className="text-center p-4 bg-white rounded-xl shadow-sm">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-3">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="text-3xl font-bold text-red-600">{notFilledCount}</div>
              <div className="text-sm text-gray-500 mt-1">未填写</div>
              {notFilledCount > 0 && (
                <div className="text-xs text-red-600 mt-1">需催促</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 部门汇总 */}
      {selectedDeptId === "all" && deptSummaries.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              📊 部门提交情况
              <Badge variant="outline" className="ml-2 font-normal">
                {deptSummaries.length} 个部门
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {deptSummaries.map((summary) => {
                const rate = summary.totalUsers > 0
                  ? Math.round((summary.submittedCount / summary.totalUsers) * 100)
                  : 0;
                const bgColor = rate === 100 ? "bg-green-50 border-green-200" 
                  : rate >= 50 ? "bg-yellow-50 border-yellow-200" 
                  : "bg-red-50 border-red-200";
                const textColor = rate === 100 ? "text-green-600" 
                  : rate >= 50 ? "text-yellow-600" 
                  : "text-red-600";
                
                return (
                  <div
                    key={summary.departmentId}
                    className={`p-4 rounded-xl border-2 ${bgColor} transition-all hover:shadow-md cursor-pointer`}
                    onClick={() => setSelectedDeptId(summary.departmentId)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-800">{summary.departmentName}</span>
                      <span className={`text-2xl font-bold ${textColor}`}>{rate}%</span>
                    </div>
                    {/* 进度条 */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          rate === 100 ? "bg-green-500" : rate >= 50 ? "bg-yellow-500" : "bg-red-500"
                        }`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>已提交 {summary.submittedCount}</span>
                      <span>共 {summary.totalUsers} 人</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 成员列表 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              👥 成员提交明细
              <Badge variant="secondary" className="ml-2 font-normal">
                {teamMembers.length} 人
              </Badge>
            </CardTitle>
            {/* 快速筛选 */}
            <div className="flex gap-2">
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-green-50 transition-colors"
                onClick={() => {/* 可添加筛选逻辑 */}}
              >
                ✓ 已提交 {submittedCount}
              </Badge>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-red-50 transition-colors"
                onClick={() => {/* 可添加筛选逻辑 */}}
              >
                ✗ 未填写 {notFilledCount}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
            </div>
          ) : teamMembers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>暂无成员数据</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-y">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">员工</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">所属部门</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">提交状态</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">提交时间</th>
                    {hasAnyRole(user.roles, ["STORE_MANAGER", "HQ_ADMIN"]) && (
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">操作</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {teamMembers.map((member, index) => {
                    const isSubmitted = member.report?.status === "SUBMITTED";
                    const isDraft = member.report?.status === "DRAFT";
                    const rowBg = isSubmitted ? "bg-green-50/50" : isDraft ? "bg-yellow-50/50" : "";
                    
                    return (
                      <tr 
                        key={member.id} 
                        className={`${rowBg} hover:bg-gray-100/50 transition-colors`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold shadow-sm ${
                              isSubmitted ? "bg-gradient-to-br from-green-400 to-green-600" :
                              isDraft ? "bg-gradient-to-br from-yellow-400 to-orange-500" :
                              "bg-gradient-to-br from-gray-300 to-gray-400"
                            }`}>
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <span className="font-medium text-gray-900">{member.name}</span>
                              <div className="text-xs text-gray-400">{member.account}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline" className="font-normal">
                            {member.departmentName}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {member.report ? (
                            <Badge
                              className={`${
                                isSubmitted 
                                  ? "bg-green-100 text-green-700 border-green-200" 
                                  : "bg-yellow-100 text-yellow-700 border-yellow-200"
                              }`}
                            >
                              {isSubmitted ? "✓ 已提交" : "📝 草稿"}
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-500 border-gray-200">
                              ○ 未填写
                            </Badge>
                          )}
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-sm">
                          {member.report?.submittedAt
                            ? new Date(member.report.submittedAt).toLocaleString("zh-CN", {
                                month: "2-digit",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit"
                              })
                            : <span className="text-gray-300">-</span>}
                        </td>
                        {hasAnyRole(user.roles, ["STORE_MANAGER", "HQ_ADMIN"]) && (
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {member.report ? (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      window.location.href = `/daily/edit/${member.id}?date=${reportDate}&readonly=true`;
                                    }}
                                    className="text-cyan-600 border-cyan-200 hover:bg-cyan-50 h-8"
                                  >
                                    📄 查看
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      window.location.href = `/daily/edit/${member.id}?date=${reportDate}`;
                                    }}
                                    className="text-gray-500 hover:text-cyan-600 h-8"
                                  >
                                    ✏️ 编辑
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => {
                                    window.location.href = `/daily/edit/${member.id}?date=${reportDate}`;
                                  }}
                                  className="bg-cyan-600 hover:bg-cyan-700 text-white h-8"
                                >
                                  ✏️ 代填
                                </Button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

