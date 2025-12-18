import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <h2 className="text-6xl font-bold text-gray-300 mb-4">404</h2>
        <p className="text-gray-600 mb-6">页面不存在</p>
        <Link
          href="/"
          className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors inline-block"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}

