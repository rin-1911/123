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

  // ============ 2. 创建部门 ============
  console.log("📁 创建部门...");
  
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

  console.log(`✅ 创建了 ${departments.length} 个部门`);

  // 获取总经办部门ID
  const managementDept = departments.find(d => d.code === "MANAGEMENT");

  // ============ 3. 创建超级管理员账号 ============
  console.log("\n👤 创建超级管理员账号...");
  
  // 管理员密码 - 生产环境强密码
  const adminPassword = "HeZong888";
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

  // ============ 4. 创建渠道来源字典 ============
  console.log("\n📋 创建渠道来源...");
  
  const channels = [
    "自然到店",
    "老客转介绍",
    "美团/大众点评",
    "抖音",
    "小红书",
    "微信公众号",
    "朋友圈广告",
    "地推活动",
    "社区合作",
    "企业合作",
    "学校合作",
    "其他",
  ];

  // 删除已存在的全局渠道，然后重新创建
  await prisma.channelSource.deleteMany({
    where: { storeId: null },
  });

  for (let i = 0; i < channels.length; i++) {
    await prisma.channelSource.create({
      data: {
        name: channels[i],
        sortOrder: i,
        isActive: true,
        storeId: null, // 全局字典
      },
    });
  }

  console.log(`✅ 创建了 ${channels.length} 个渠道来源`);

  // ============ 5. 创建配置开关 ============
  console.log("\n⚙️  创建配置开关...");
  
  await prisma.configFlag.deleteMany({
    where: { scope: "GLOBAL", storeId: null },
  });

  await prisma.configFlag.create({
    data: {
      scope: "GLOBAL",
      key: "implant_incentive",
      isActive: true,
      value: JSON.stringify({ enabled: true, rate: 0.05 }),
      description: "种植激励开关",
    },
  });

  await prisma.configFlag.create({
    data: {
      scope: "GLOBAL",
      key: "ortho_incentive",
      isActive: true,
      value: JSON.stringify({ enabled: true, rate: 0.03 }),
      description: "正畸激励开关",
    },
  });

  console.log("✅ 配置开关已创建");

  // ============ 完成 ============
  console.log("\n" + "═".repeat(50));
  console.log("🎉 生产环境初始化完成！");
  console.log("═".repeat(50));
  console.log("\n📋 登录信息:");
  console.log("┌─────────────────────────────────────┐");
  console.log("│  账号: admin                        │");
  console.log("│  密码: HeZong888                    │");
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
