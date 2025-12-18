/**
 * 德弗口腔运营系统 - 全面测试脚本
 * 运行: npx tsx tests/run-all-tests.ts
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// 创建带超时配置的 Prisma 客户端
const prisma = new PrismaClient({
  log: ["error"],
});

// 连接重试配置
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

async function connectWithRetry(retries = MAX_RETRIES): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      return true;
    } catch (error) {
      console.log(`  ⏳ 连接尝试 ${i + 1}/${retries} 失败，${RETRY_DELAY/1000}秒后重试...`);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }
  return false;
}

// 测试结果收集
interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  message: string;
  severity: "critical" | "warning" | "info";
}

const results: TestResult[] = [];

function log(msg: string) {
  console.log(msg);
}

function addResult(category: string, name: string, passed: boolean, message: string, severity: TestResult["severity"] = "info") {
  results.push({ category, name, passed, message, severity });
  const icon = passed ? "✅" : "❌";
  console.log(`  ${icon} ${name}: ${message}`);
}

// ==================== 数据库连接测试 ====================
async function testDatabaseConnection() {
  log("\n📊 [1/6] 数据库连接测试");
  log("─".repeat(50));
  
  try {
    const connected = await connectWithRetry();
    if (!connected) {
      throw new Error("无法连接到数据库");
    }
    addResult("数据库", "连接测试", true, "数据库连接成功");
    
    // 测试查询
    const userCount = await prisma.user.count();
    addResult("数据库", "查询测试", true, `用户表共 ${userCount} 条记录`);
    
    const storeCount = await prisma.store.count();
    addResult("数据库", "门店数据", storeCount > 0, `门店表共 ${storeCount} 条记录`);
    
    const deptCount = await prisma.department.count();
    addResult("数据库", "部门数据", deptCount > 0, `部门表共 ${deptCount} 条记录`);
    
  } catch (error: any) {
    addResult("数据库", "连接测试", false, `连接失败: ${error.message}`, "critical");
  }
}

// ==================== 用户认证测试 ====================
async function testAuthentication() {
  log("\n🔐 [2/6] 用户认证测试");
  log("─".repeat(50));
  
  // 测试用户是否存在
  const testAccounts = ["00001", "10001", "10101"];
  
  for (const account of testAccounts) {
    const user = await prisma.user.findUnique({ 
      where: { account },
      include: { Store: true, Department: true }
    });
    
    if (user) {
      addResult("认证", `账号 ${account}`, true, `${user.name} - ${user.Store?.name || "总部"}`);
      
      // 验证密码哈希
      const isValidHash = user.passwordHash.startsWith("$2");
      addResult("认证", `密码安全(${account})`, isValidHash, 
        isValidHash ? "密码已加密存储" : "密码未正确加密", 
        isValidHash ? "info" : "critical");
    } else {
      addResult("认证", `账号 ${account}`, false, "账号不存在", "warning");
    }
  }
  
  // 测试密码验证
  const admin = await prisma.user.findUnique({ where: { account: "00001" } });
  if (admin) {
    const validPassword = await bcrypt.compare("123456", admin.passwordHash);
    addResult("认证", "密码验证", validPassword, 
      validPassword ? "密码验证功能正常" : "密码验证失败");
  }
}

// ==================== 权限配置测试 ====================
async function testPermissions() {
  log("\n🛡️ [3/6] 权限配置测试");
  log("─".repeat(50));
  
  // 检查各角色用户
  const roles = [
    { role: "HQ_ADMIN", name: "总部管理员" },
    { role: "STORE_MANAGER", name: "店长" },
    { role: "DEPT_LEAD", name: "部门负责人" },
    { role: "STAFF", name: "普通员工" },
  ];
  
  for (const { role, name } of roles) {
    const count = await prisma.user.count({
      where: { roles: { contains: role } }
    });
    addResult("权限", `${name}用户`, count > 0, `共 ${count} 个${name}`);
  }
  
  // 检查用户是否都有部门/门店分配
  const usersWithoutStore = await prisma.user.count({
    where: { 
      storeId: null,
      roles: { not: { contains: "HQ_ADMIN" } }
    }
  });
  addResult("权限", "门店分配", usersWithoutStore === 0, 
    usersWithoutStore === 0 ? "所有非总部用户都已分配门店" : `${usersWithoutStore} 个用户未分配门店`,
    usersWithoutStore > 0 ? "warning" : "info");
}

// ==================== 数据完整性测试 ====================
async function testDataIntegrity() {
  log("\n📋 [4/6] 数据完整性测试");
  log("─".repeat(50));
  
  // 检查孤立的日报记录（检查外键字段）
  const orphanReports = await prisma.dailyReport.findMany({
    where: {
      OR: [
        { userId: { equals: "" } },
        { storeId: { equals: "" } },
        { departmentId: { equals: "" } }
      ]
    }
  });
  addResult("数据", "日报关联", orphanReports.length === 0, 
    orphanReports.length === 0 ? "所有日报关联正常" : `${orphanReports.length} 条孤立日报`,
    orphanReports.length > 0 ? "warning" : "info");
  
  // 检查咨询记录
  const orphanConsultations = await prisma.patientConsultation.findMany({
    where: {
      OR: [
        { consultantId: { equals: "" } },
        { storeId: { equals: "" } }
      ]
    }
  });
  addResult("数据", "咨询记录关联", orphanConsultations.length === 0, 
    orphanConsultations.length === 0 ? "所有咨询记录关联正常" : `${orphanConsultations.length} 条孤立记录`,
    orphanConsultations.length > 0 ? "warning" : "info");
  
  // 检查必填字段
  const usersWithoutName = await prisma.user.count({
    where: { name: { equals: "" } }
  });
  addResult("数据", "用户姓名完整", usersWithoutName === 0, 
    usersWithoutName === 0 ? "所有用户都有姓名" : `${usersWithoutName} 个用户缺少姓名`,
    usersWithoutName > 0 ? "warning" : "info");
  
  // 检查日报重复
  const duplicateReports = await prisma.$queryRaw<{count: bigint}[]>`
    SELECT COUNT(*) as count FROM (
      SELECT "userId", "reportDate", COUNT(*) as cnt 
      FROM "DailyReport" 
      GROUP BY "userId", "reportDate" 
      HAVING COUNT(*) > 1
    ) as duplicates
  `;
  const dupCount = Number(duplicateReports[0]?.count || 0);
  addResult("数据", "日报唯一性", dupCount === 0, 
    dupCount === 0 ? "无重复日报" : `发现 ${dupCount} 组重复日报`,
    dupCount > 0 ? "critical" : "info");
}

// ==================== 安全性测试 ====================
async function testSecurity() {
  log("\n🔒 [5/6] 安全性测试");
  log("─".repeat(50));
  
  // 检查弱密码
  const users = await prisma.user.findMany({ select: { account: true, passwordHash: true } });
  const weakPasswords = ["123456", "password", "admin", "000000"];
  let weakPasswordCount = 0;
  
  for (const user of users) {
    for (const weak of weakPasswords) {
      if (await bcrypt.compare(weak, user.passwordHash)) {
        weakPasswordCount++;
        break;
      }
    }
  }
  
  addResult("安全", "密码强度", weakPasswordCount === 0, 
    weakPasswordCount === 0 ? "所有密码强度正常" : `${weakPasswordCount} 个用户使用弱密码`,
    weakPasswordCount > 0 ? "warning" : "info");
  
  // 检查禁用账号
  const inactiveUsers = await prisma.user.count({ where: { isActive: false } });
  addResult("安全", "禁用账号", true, `${inactiveUsers} 个账号已禁用`);
  
  // 检查敏感配置
  const envCheck = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
  };
  
  addResult("安全", "环境变量配置", envCheck.DATABASE_URL && envCheck.NEXTAUTH_SECRET,
    "DATABASE_URL: " + (envCheck.DATABASE_URL ? "✓" : "✗") + 
    ", NEXTAUTH_SECRET: " + (envCheck.NEXTAUTH_SECRET ? "✓" : "✗"),
    (!envCheck.DATABASE_URL || !envCheck.NEXTAUTH_SECRET) ? "critical" : "info");
}

// ==================== 业务逻辑测试 ====================
async function testBusinessLogic() {
  log("\n⚙️ [6/6] 业务逻辑测试");
  log("─".repeat(50));
  
  // 检查门店配置
  const stores = await prisma.store.findMany({ where: { isActive: true } });
  addResult("业务", "活跃门店", stores.length > 0, `${stores.length} 个活跃门店`);
  
  for (const store of stores) {
    const storeUsers = await prisma.user.count({ 
      where: { storeId: store.id, isActive: true } 
    });
    addResult("业务", `${store.name}员工`, storeUsers > 0, `${storeUsers} 个员工`);
  }
  
  // 检查部门配置
  const departments = await prisma.department.findMany();
  addResult("业务", "部门配置", departments.length >= 7, `${departments.length} 个部门`);
  
  // 检查渠道来源
  const channels = await prisma.channelSource.count({ where: { isActive: true } });
  addResult("业务", "渠道来源", channels > 0, `${channels} 个活跃渠道`);
  
  // 检查日报Schema配置
  const usersWithCustomConfig = await prisma.user.count({
    where: { customFormConfig: { not: null } }
  });
  addResult("业务", "自定义表单", true, `${usersWithCustomConfig} 个用户有自定义表单配置`);
}

// ==================== 生成测试报告 ====================
function generateReport() {
  log("\n");
  log("═".repeat(60));
  log("                    测试报告汇总");
  log("═".repeat(60));
  
  const categories = Array.from(new Set(results.map(r => r.category)));
  
  let totalPassed = 0;
  let totalFailed = 0;
  let criticalFailed = 0;
  
  for (const category of categories) {
    const categoryResults = results.filter(r => r.category === category);
    const passed = categoryResults.filter(r => r.passed).length;
    const failed = categoryResults.filter(r => !r.passed).length;
    const critical = categoryResults.filter(r => !r.passed && r.severity === "critical").length;
    
    totalPassed += passed;
    totalFailed += failed;
    criticalFailed += critical;
    
    const status = failed === 0 ? "✅" : (critical > 0 ? "❌" : "⚠️");
    log(`${status} ${category}: ${passed}/${categoryResults.length} 通过`);
  }
  
  log("─".repeat(60));
  log(`总计: ${totalPassed}/${results.length} 通过 (${Math.round(totalPassed/results.length*100)}%)`);
  
  if (criticalFailed > 0) {
    log(`\n⚠️  发现 ${criticalFailed} 个严重问题，需要修复后才能部署！`);
  } else if (totalFailed > 0) {
    log(`\n⚠️  发现 ${totalFailed} 个非严重问题，建议修复后部署`);
  } else {
    log(`\n🎉 所有测试通过，系统可以部署！`);
  }
  
  // 输出失败项
  const failedResults = results.filter(r => !r.passed);
  if (failedResults.length > 0) {
    log("\n问题列表:");
    for (const r of failedResults) {
      const icon = r.severity === "critical" ? "🔴" : "🟡";
      log(`  ${icon} [${r.category}] ${r.name}: ${r.message}`);
    }
  }
  
  log("\n" + "═".repeat(60));
  log(`测试时间: ${new Date().toLocaleString("zh-CN")}`);
  log("═".repeat(60));
}

// ==================== 主函数 ====================
async function main() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║       德弗口腔运营系统 - 部署前全面测试                ║");
  console.log("║                    DENTAL-OPS v2.0                     ║");
  console.log("╚════════════════════════════════════════════════════════╝");
  
  try {
    await testDatabaseConnection();
    await testAuthentication();
    await testPermissions();
    await testDataIntegrity();
    await testSecurity();
    await testBusinessLogic();
    
    generateReport();
    
  } catch (error: any) {
    console.error("\n❌ 测试过程中发生错误:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();

