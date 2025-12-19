import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 处理连接字符串，确保包含连接池限制参数
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL || "";
  if (!url) return url;
  
  // 如果已经有参数了，用 & 连接，否则用 ? 连接
  const separator = url.includes("?") ? "&" : "?";
  
  // 关键参数：
  // connection_limit=5: 限制本地只占用 5 个连接，给其他操作留空间
  // pool_timeout=30: 等待连接的时间延长到 30 秒，避免 10 秒就报错
  if (!url.includes("connection_limit")) {
    return `${url}${separator}connection_limit=5&pool_timeout=30`;
  }
  return url;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
    datasourceUrl: getDatabaseUrl(),
  });

// 在 Node.js 进程退出时关闭 Prisma 客户端，防止连接残留
if (typeof process !== "undefined") {
  process.on("beforeExit", () => {
    prisma.$disconnect();
  });
}

// 添加连接重试逻辑
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export async function withRetry<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  try {
    return await operation();
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (retries > 0 && prismaError?.code === 'P1001') {
      // P1001 = Can't reach database server
      console.log(`数据库连接失败，${RETRY_DELAY}ms 后重试... (剩余 ${retries} 次)`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return withRetry(operation, retries - 1);
    }
    throw error;
  }
}

// 生产环境（Vercel/Serverless）也需要复用 PrismaClient，
// 否则每次请求都创建新连接池，容易触发 connection pool timeout
globalForPrisma.prisma = prisma;

