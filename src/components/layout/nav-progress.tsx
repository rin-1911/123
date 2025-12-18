"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 路由变化时重置
    setIsNavigating(false);
    setProgress(0);
  }, [pathname, searchParams]);

  useEffect(() => {
    // 监听导航开始
    const handleStart = () => {
      setIsNavigating(true);
      setProgress(30);
    };

    // 模拟进度
    let timer: NodeJS.Timeout;
    if (isNavigating && progress < 90) {
      timer = setTimeout(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 100);
    }

    // 添加点击事件监听
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      if (link && link.href && !link.href.startsWith("#")) {
        const url = new URL(link.href);
        if (url.pathname !== pathname) {
          handleStart();
        }
      }
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
      clearTimeout(timer);
    };
  }, [isNavigating, progress, pathname]);

  if (!isNavigating) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200">
      <div
        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-200 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}



