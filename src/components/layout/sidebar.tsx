"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition, useCallback } from "react";
import { cn } from "@/lib/utils";
import type { UserSession, Role } from "@/lib/types";
import { hasAnyRole } from "@/lib/types";
import {
  LayoutDashboard,
  FileEdit,
  Users,
  BarChart3,
  Settings,
  Building2,
  Loader2,
  ClipboardList,
} from "lucide-react";

interface SidebarProps {
  user: UserSession;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // 预加载路由
  const prefetchRoute = useCallback((href: string) => {
    router.prefetch(href);
  }, [router]);

  // 使用 transition 进行导航，不阻塞 UI
  const handleNavigation = useCallback((href: string, e: React.MouseEvent) => {
    e.preventDefault();
    startTransition(() => {
      router.push(href);
    });
  }, [router]);

  const navItems = [
    {
      title: "工作台",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["STAFF", "DEPT_LEAD", "STORE_MANAGER", "REGION_MANAGER", "HQ_ADMIN", "FINANCE", "MEDICAL_QC"],
    },
    {
      title: "我的日报",
      href: "/daily/my",
      icon: FileEdit,
      roles: ["STAFF", "DEPT_LEAD", "STORE_MANAGER", "FINANCE", "MEDICAL_QC"],
    },
    {
      title: "团队日报",
      href: "/daily/team",
      icon: Users,
      roles: ["DEPT_LEAD", "STORE_MANAGER", "REGION_MANAGER", "HQ_ADMIN"],
    },
    {
      title: "咨询记录",
      href: "/consultations",
      icon: ClipboardList,
      roles: ["STAFF", "DEPT_LEAD", "STORE_MANAGER", "HQ_ADMIN"],
    },
    {
      title: "门店报表",
      href: "/reports/store",
      icon: BarChart3,
      roles: ["STORE_MANAGER", "REGION_MANAGER", "HQ_ADMIN", "FINANCE"],
    },
    {
      title: "管理中心",
      href: "/admin",
      icon: Settings,
      roles: ["STORE_MANAGER", "HQ_ADMIN"],
    },
    {
      title: "用户管理",
      href: "/admin/users",
      icon: Users,
      roles: ["STORE_MANAGER", "HQ_ADMIN"],
    },
  ];

  const filteredItems = navItems.filter((item) =>
    hasAnyRole(user.roles, item.roles as Role[])
  );

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 overflow-y-auto bg-white border-r">
        <div className="flex items-center flex-shrink-0 px-4 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                德弗口腔
              </h1>
              <p className="text-xs text-gray-500">运营管理系统</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex-grow flex flex-col">
          {/* 加载指示器 */}
          {isPending && (
            <div className="px-3 pb-2">
              <div className="flex items-center gap-2 text-xs text-cyan-600">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>加载中...</span>
              </div>
            </div>
          )}
          <nav className="flex-1 px-3 space-y-1">
            {filteredItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onMouseEnter={() => prefetchRoute(item.href)}
                  onClick={(e) => handleNavigation(item.href, e)}
                  className={cn(
                    "group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-150",
                    isActive
                      ? "bg-gradient-to-r from-cyan-50 to-blue-50 text-cyan-700 border border-cyan-100"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    isPending && "pointer-events-none opacity-70"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                      isActive ? "text-cyan-600" : "text-gray-400 group-hover:text-gray-500"
                    )}
                  />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex-shrink-0 p-4 border-t">
          <div className="flex items-center">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-medium text-sm">
              {user.name.charAt(0)}
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-700 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.storeName || "总部"} · {user.departmentName || "管理"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

