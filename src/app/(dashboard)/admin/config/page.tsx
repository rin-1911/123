import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { hasAnyRole } from "@/lib/types";
import { AlertCircle, Settings, ToggleLeft, ToggleRight, Hash } from "lucide-react";
import { StoreManagement } from "@/components/admin/store-management";
import { DictionaryManagement } from "@/components/admin/dictionary-management";

export default async function ConfigPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = session.user;

  // 检查权限 - 只有HQ_ADMIN可以访问
  if (!hasAnyRole(user.roles, ["HQ_ADMIN"])) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="h-5 w-5" />
            无权限访问
          </CardTitle>
          <CardDescription>
            只有总部管理员可以访问系统配置。
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // 获取配置列表
  const configs = await prisma.configFlag.findMany({
    include: {
      Store: true,
    },
    orderBy: [{ scope: "asc" }, { key: "asc" }],
  });

  // 获取门店列表（带计数，供"能否删除"判断）
  const stores = await prisma.store.findMany({
    orderBy: { code: "asc" },
    include: {
      _count: {
        select: {
          User: true,
          StoreDayLock: true,
          DailyReport: true,
          ChannelSource: true,
          ConfigFlag: true,
          UserStoreAccess: true,
        },
      },
    },
  });

  // 获取渠道来源
  const channels = await prisma.channelSource.findMany({
    include: {
      Store: true,
    },
    orderBy: [{ storeId: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">系统配置</h1>
          <p className="text-gray-500 mt-1">
            管理系统开关、字典和配置项
          </p>
        </div>
      </div>

      {/* 门店信息 */}
      <StoreManagement initialStores={stores} />

      {/* 字典管理 */}
      <DictionaryManagement />

      {/* 功能开关配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-5 w-5" />
            功能开关
            <Badge variant="secondary">{configs.length} 项</Badge>
          </CardTitle>
          <CardDescription>
            系统功能开关配置，支持"可降档、可停"
          </CardDescription>
        </CardHeader>
        <CardContent>
          {configs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无配置项
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-500">配置键</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">范围</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">门店</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">状态</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">描述</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-500">配置值</th>
                  </tr>
                </thead>
                <tbody>
                  {configs.map((config) => (
                    <tr key={config.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm">{config.key}</td>
                      <td className="py-3 px-4">
                        <Badge variant={config.scope === "GLOBAL" ? "default" : "secondary"}>
                          {config.scope === "GLOBAL" ? "全局" : "门店"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {config.Store?.name || "-"}
                      </td>
                      <td className="py-3 px-4">
                        {config.isActive ? (
                          <span className="flex items-center gap-1 text-green-600">
                            <ToggleRight className="h-5 w-5" />
                            启用
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-gray-400">
                            <ToggleLeft className="h-5 w-5" />
                            停用
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600 text-sm">
                        {config.description || "-"}
                      </td>
                      <td className="py-3 px-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {config.value}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 渠道来源字典 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Hash className="h-5 w-5" />
            渠道来源字典
            <Badge variant="secondary">{channels.length} 个</Badge>
          </CardTitle>
          <CardDescription>
            患者来源渠道分类
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {channels.map((channel) => (
              <Badge
                key={channel.id}
                variant={channel.isActive ? "outline" : "secondary"}
                className={channel.isActive ? "" : "opacity-50"}
              >
                {channel.name}
                {channel.store && (
                  <span className="ml-1 text-xs text-gray-400">
                    ({channel.store.code})
                  </span>
                )}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">使用说明</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>• 系统配置功能正在开发中，目前仅支持查看配置项</p>
          <p>• 功能开关支持"可降档、可停"，可根据业务需要启用或停用</p>
          <p>• 配置修改功能将在后续版本中提供</p>
          <p>• 如需修改配置，请联系技术支持</p>
        </CardContent>
      </Card>
    </div>
  );
}

