import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * 生产环境初始化脚本
 * 只创建必要的部门和一个超级管理员账号
 */
async function main() {
  console.log("🌱 开始初始化生产环境数据...\n");

  // ============ 1. 清理旧数据（可选，正式环境请慎用）============
  // 如需重置，取消下面的注释
  // console.log("⚠️  清理旧用户数据...");
  // await prisma.user.deleteMany({});
  // await prisma.channelSource.deleteMany({});
  // await prisma.configFlag.deleteMany({});

  // ============ 2. 创建必要部门（总经办）===========
  console.log("📁 创建部门（总经办）...");
  const managementDept = await prisma.department.upsert({
    where: { code: "MANAGEMENT" },
    update: {},
    create: { code: "MANAGEMENT", name: "总经办" },
  });
  console.log("✅ 部门已就绪：总经办");

  // ============ 3. 创建超级管理员账号 ============
  console.log("\n👤 创建超级管理员账号...");
  
  // 管理员密码 - 生产环境强密码（字母+数字+特殊字符）
  const adminPassword = "Defu@2025";
  const passwordHash = await bcrypt.hash(adminPassword, 12); // 使用更高的加密强度

  const admin = await prisma.user.upsert({
    where: { account: "admin" },
    update: {
      // 如果已存在，更新密码和角色
      passwordHash,
      roles: JSON.stringify(["HQ_ADMIN"]),
      name: "何总",
      departmentId: managementDept?.id || null,
      isActive: true,
    },
    create: {
      account: "admin",
      name: "何总",
      passwordHash,
      roles: JSON.stringify(["HQ_ADMIN"]),
      storeId: null,  // 总部管理员不归属任何门店
      departmentId: managementDept?.id || null,
      isActive: true,
    },
  });

  console.log(`✅ 超级管理员账号已创建/更新`);
  console.log(`   账号: admin`);
  console.log(`   密码: ${adminPassword}`);
  console.log(`   角色: 总部管理员 (HQ_ADMIN)`);

  // ============ 完成 ============
  console.log("\n" + "═".repeat(50));
  console.log("🎉 生产环境初始化完成！");
  console.log("═".repeat(50));
  console.log("\n📋 登录信息:");
  console.log("┌─────────────────────────────────────┐");
  console.log("│  账号: admin                        │");
  console.log(`│  密码: ${adminPassword.padEnd(28, " ")}│`);
  console.log("│  角色: 总部管理员 (最高权限)         │");
  console.log("└─────────────────────────────────────┘");
  console.log("\n⚠️  请登录后立即:");
  console.log("   1. 修改初始密码");
  console.log("   2. 创建门店");
  console.log("   3. 添加其他员工账号");
  console.log("\n");
}

main()
  .catch((e) => {
    console.error("❌ 初始化失败:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
