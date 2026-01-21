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

  // ============ 2. 创建所有部门架构（无虚拟员工）===========
  console.log("📁 创建部门架构...");
  const departments = await Promise.all([
    prisma.department.upsert({
      where: { code: "MANAGEMENT" },
      update: {},
      create: { code: "MANAGEMENT", name: "总经办" },
    }),
    prisma.department.upsert({
      where: { code: "FRONT_DESK" },
      update: {},
      create: { code: "FRONT_DESK", name: "前台客服" },
    }),
    prisma.department.upsert({
      where: { code: "CONSULTATION" },
      update: {},
      create: { code: "CONSULTATION", name: "咨询部" },
    }),
    prisma.department.upsert({
      where: { code: "MEDICAL" },
      update: {},
      create: { code: "MEDICAL", name: "医疗部" },
    }),
    prisma.department.upsert({
      where: { code: "NURSING" },
      update: {},
      create: { code: "NURSING", name: "护理部" },
    }),
    prisma.department.upsert({
      where: { code: "OFFLINE_MARKETING" },
      update: {},
      create: { code: "OFFLINE_MARKETING", name: "线下市场" },
    }),
    prisma.department.upsert({
      where: { code: "ONLINE_GROWTH" },
      update: {},
      create: { code: "ONLINE_GROWTH", name: "网络新媒体" },
    }),
    prisma.department.upsert({
      where: { code: "FINANCE_HR_ADMIN" },
      update: {},
      create: { code: "FINANCE_HR_ADMIN", name: "财务" },
    }),
    prisma.department.upsert({
      where: { code: "HR" },
      update: {},
      create: { code: "HR", name: "人事行政" },
    }),
  ]);
  console.log(`✅ ${departments.length} 个部门架构已就绪`);

  const managementDept = departments.find(d => d.code === "MANAGEMENT");

  // ============ 3. 创建标准门店 ============
  console.log("\n🏪 创建门店...");
  const storeXJ = await prisma.store.upsert({
    where: { code: "wsxjkq" },
    update: {},
    create: {
      code: "wsxjkq",
      name: "文山鑫洁口腔",
      city: "文山",
      isActive: true,
    },
  });

  const storeDF = await prisma.store.upsert({
    where: { code: "wsdfkq" },
    update: {},
    create: {
      code: "wsdfkq",
      name: "文山德弗口腔",
      city: "文山",
      isActive: true,
    },
  });
  console.log(`✅ 门店已就绪：${storeXJ.name}, ${storeDF.name}`);

  // ============ 4. 创建超级管理员账号 ============
  console.log("\n👤 创建超级管理员账号...");
  
  // 管理员密码 - 生产环境建议通过环境变量设置
  const adminPassword = process.env.ADMIN_INIT_PASSWORD || "Defu@2025";
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
