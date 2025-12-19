import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"], // 只记录错误，减少开销
    // 增加数据库连接超时设置
    datasourceUrl: process.env.DATABASE_URL,
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

