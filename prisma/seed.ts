import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * 生产环境初始化脚本
 * 只创建必要的部门和一个超级管理员账号
 */
async function main() {
  console.log("🌱 开始初始化生产环境数据...\n");

  // ============ 1. 可控清库（生产环境默认不删，避免误操作）============
  // 如需“只保留一个管理员账号”，请在执行前设置环境变量：
  // Windows CMD:      set RESET_DB=1
  // Windows PowerShell: $env:RESET_DB="1"
  const shouldReset = process.env.RESET_DB === "1";
  if (shouldReset) {
    console.log("⚠️  RESET_DB=1 已开启：将删除历史数据，仅保留管理员账号 admin。\n");

    // 先删与用户/日报强相关的数据，避免外键约束
    await prisma.consultationViewPermission.deleteMany({});
    await prisma.storeDayLock.deleteMany({});

    // 日报子表
    await prisma.consultationReport.deleteMany({});
    await prisma.frontDeskReport.deleteMany({});
    await prisma.medicalReport.deleteMany({});
    await prisma.nursingReport.deleteMany({});
    await prisma.offlineMarketingReport.deleteMany({});
    await prisma.onlineGrowthReport.deleteMany({});
    await prisma.financeHrAdminReport.deleteMany({});

    // 日报主表
    await prisma.dailyReport.deleteMany({});

    // 咨询记录
    await prisma.patientConsultation.deleteMany({});

    // 门店访问权限
    await prisma.userStoreAccess.deleteMany({});

    // 删除除 admin 外的所有用户
    await prisma.user.deleteMany({
      where: {
        account: { not: "admin" },
      },
    });

    console.log("✅ 历史数据已清理（保留 admin）\n");
  }

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
