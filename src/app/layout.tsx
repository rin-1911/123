import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/providers/auth-provider";
import { NavProgress } from "@/components/layout/nav-progress";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "德弗口腔运营管理系统",
  description: "门店运营数据填报与汇总系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <AuthProvider>
          <Suspense fallback={null}>
            <NavProgress />
          </Suspense>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}





