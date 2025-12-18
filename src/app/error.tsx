"use client";

import { useEffect } from "react";

export default function Error({
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">出错了</h2>
        <p className="text-gray-600 mb-6">{error.message || "发生了一个错误"}</p>
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

