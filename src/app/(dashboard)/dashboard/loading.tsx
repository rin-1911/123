export default function DashboardLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* 加载动画 */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-gray-200 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin" />
        </div>
        <p className="text-gray-500 text-sm">加载中...</p>
      </div>
    </div>
  );
}
