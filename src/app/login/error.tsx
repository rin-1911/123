"use client";

import { useEffect } from "react";

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center p-8 bg-zinc-900 rounded-lg border border-zinc-800 max-w-md">
        <h2 className="text-xl font-bold text-white mb-2">登录页面出错</h2>
        <p className="text-zinc-400 mb-6 text-sm">{error.message || "请稍后重试"}</p>
        <button
          onClick={() => reset()}
          className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors"
        >
          重试
        </button>
      </div>
    </div>
  );
}

