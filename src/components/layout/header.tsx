"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import type { UserSession } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";
import { LogOut, Menu } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface HeaderProps {
  user: UserSession;
}

export function Header({ user }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { title: "工作台", href: "/dashboard" },
    { title: "我的日报", href: "/daily/my" },
    { title: "团队日报", href: "/daily/team" },
    { title: "门店报表", href: "/reports/store" },
  ];

  return (
    <>
      <header className="flex-shrink-0 bg-white border-b">
        {user.passwordWeak && (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-sm px-4 sm:px-6 py-2">
            检测到你正在使用弱密码（纯数字）。为保障账号安全，请尽快修改为“至少8位且包含字母+数字”的强密码。
          </div>
        )}
        <div className="flex items-center justify-between h-16 px-4 sm:px-6">
          <div className="flex items-center md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>

          <div className="flex-1 flex justify-center md:justify-start">
            <div className="hidden md:block">
              <h2 className="text-lg font-semibold text-gray-800">
                {getPageTitle(pathname)}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              <span className="px-2 py-1 rounded-md bg-cyan-50 text-cyan-700 font-medium">
                {ROLE_LABELS[user.primaryRole]}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-4 w-4 mr-2" />
              退出
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b">
              <h1 className="text-lg font-bold text-cyan-600">德弗口腔</h1>
              <p className="text-xs text-gray-500">运营管理系统</p>
            </div>
            <nav className="p-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "block px-3 py-2 rounded-lg text-sm font-medium",
                    pathname === item.href
                      ? "bg-cyan-50 text-cyan-700"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

function getPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    "/dashboard": "工作台",
    "/daily/my": "我的日报",
    "/daily/team": "团队日报",
    "/reports/store": "门店报表",
    "/admin/users": "用户管理",
    "/admin/config": "系统配置",
  };
  return titles[pathname] || "德弗口腔";
}

