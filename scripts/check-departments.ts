import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("📋 当前数据库中的部门列表：\n");
  
  const departments = await prisma.department.findMany({
    orderBy: { code: "asc" }
  });
  
  departments.forEach((dept, i) => {
    console.log(`${i + 1}. ${dept.code.padEnd(20)} -> ${dept.name}`);
  });
  
  console.log(`\n共 ${departments.length} 个部门\n`);
  
  // 检查是否有 HR 和 ADMIN
  const hasHR = departments.some(d => d.code === "HR");
  const hasADMIN = departments.some(d => d.code === "ADMIN");
  const hasOldFinanceHrAdmin = departments.some(d => d.code === "FINANCE_HR_ADMIN" && d.name.includes("人事"));
  
  console.log(`✓ HR (人事部): ${hasHR ? "存在" : "不存在"}`);
  console.log(`✓ ADMIN (行政部): ${hasADMIN ? "存在" : "不存在"}`);
  console.log(`✓ FINANCE_HR_ADMIN: ${hasOldFinanceHrAdmin ? "名称包含人事" : "已是纯财务"}`);
  
  // 如果 FINANCE_HR_ADMIN 的名称还包含"人事"或"行政"，更新为纯"财务部"
  const financeHrAdminDept = departments.find(d => d.code === "FINANCE_HR_ADMIN");
  if (financeHrAdminDept && financeHrAdminDept.name !== "财务部") {
    console.log(`\n🔧 将 FINANCE_HR_ADMIN 的名称从 "${financeHrAdminDept.name}" 更新为 "财务部"...`);
    await prisma.department.update({
      where: { code: "FINANCE_HR_ADMIN" },
      data: { name: "财务部" }
    });
    console.log("✅ 已更新");
  }
  
  // 确保 HR 和 ADMIN 存在
  if (!hasHR) {
    console.log("\n🔧 创建 HR (人事部)...");
    await prisma.department.create({
      data: { code: "HR", name: "人事部" }
    });
    console.log("✅ 已创建");
  }
  
  if (!hasADMIN) {
    console.log("\n🔧 创建 ADMIN (行政部)...");
    await prisma.department.create({
      data: { code: "ADMIN", name: "行政部" }
    });
    console.log("✅ 已创建");
  }
  
  // 最终输出
  console.log("\n📋 更新后的部门列表：\n");
  const updatedDepts = await prisma.department.findMany({
    orderBy: { code: "asc" }
  });
  
  updatedDepts.forEach((dept, i) => {
    console.log(`${i + 1}. ${dept.code.padEnd(20)} -> ${dept.name}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

