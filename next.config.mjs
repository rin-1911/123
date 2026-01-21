/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
  
  // 添加HTTP安全头
  async headers() {
    return [
      {
        // 应用到所有路由
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',  // 防止点击劫持
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',  // 防止MIME类型嗅探
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',  // XSS过滤
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',  // 控制Referrer信息
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',  // 限制浏览器功能
          },
        ],
      },
      {
        // API路由额外安全头
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
