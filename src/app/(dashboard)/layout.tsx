import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

// 配置动态渲染，避免不必要的静态生成
export const dynamic = "force-dynamic";

// 减少不必要的重新验证
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar user={session.user} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header user={session.user} />
        {/* 关键：强制始终显示滚动条，避免内容高度变化导致的布局左右“跳动/偏移” */}
        <main className="flex-1 overflow-y-scroll p-6">
          {children}
        </main>
      </div>
    </div>
  );
}





