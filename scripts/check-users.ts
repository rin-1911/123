import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("📋 当前用户及角色列表：\n");
  
  const users = await prisma.user.findMany({
    include: {
      Department: true,
      Store: true,
    },
    orderBy: { name: "asc" }
  });
  
  users.forEach((user, i) => {
    console.log(`${i + 1}. ${user.name.padEnd(10)} | 账号: ${user.account.padEnd(12)} | 角色: ${user.roles.padEnd(30)} | 部门: ${user.Department?.name || "-"}`);
  });
  
  console.log(`\n共 ${users.length} 个用户`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

