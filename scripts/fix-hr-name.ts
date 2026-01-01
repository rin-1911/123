import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 更新 HR 部门名称
  await prisma.department.update({
    where: { code: "HR" },
    data: { name: "人事部" }
  });
  console.log("✅ HR 已更新为 人事部");
  
  // 确认更新
  const depts = await prisma.department.findMany({
    where: { code: { in: ["HR", "ADMIN", "FINANCE_HR_ADMIN"] } },
    orderBy: { code: "asc" }
  });
  
  console.log("\n📋 相关部门：");
  depts.forEach(d => {
    console.log(`   ${d.code} -> ${d.name}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

