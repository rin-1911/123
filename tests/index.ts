/**
 * 德弗口腔运营系统 - 测试入口
 * 
 * 运行所有测试: npx tsx tests/index.ts
 * 
 * 或分别运行:
 *   npx tsx tests/run-all-tests.ts  - 数据库和业务逻辑测试
 *   npx tsx tests/test-api.ts       - API接口测试
 *   npx tsx tests/test-security.ts  - 安全性测试
 */

import { execSync } from "child_process";
import { existsSync } from "fs";

console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║          德弗口腔运营系统 - 部署前全面测试套件                   ║
║                      DENTAL-OPS v2.0                             ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

测试时间: ${new Date().toLocaleString("zh-CN")}
`);

const tests = [
  { name: "数据库与业务逻辑测试", script: "tests/run-all-tests.ts" },
  { name: "API接口测试", script: "tests/test-api.ts" },
  { name: "安全性测试", script: "tests/test-security.ts" },
];

async function runTests() {
  const results: { name: string; success: boolean; error?: string }[] = [];
  
  for (const test of tests) {
    console.log(`\n${"=".repeat(70)}`);
    console.log(`▶ 开始执行: ${test.name}`);
    console.log(`${"=".repeat(70)}\n`);
    
    try {
      execSync(`npx tsx ${test.script}`, { 
        stdio: "inherit",
        cwd: process.cwd()
      });
      results.push({ name: test.name, success: true });
    } catch (error: any) {
      results.push({ name: test.name, success: false, error: error.message });
    }
    
    console.log(`\n`);
  }
  
  // 最终汇总
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║                        测试执行汇总                              ║
╚══════════════════════════════════════════════════════════════════╝
`);
  
  for (const r of results) {
    const icon = r.success ? "✅" : "❌";
    console.log(`${icon} ${r.name}: ${r.success ? "完成" : "失败"}`);
  }
  
  const allPassed = results.every(r => r.success);
  
  console.log(`
${"─".repeat(70)}
${allPassed ? "🎉 所有测试套件执行完成！" : "⚠️ 部分测试失败，请查看上方详细信息"}
${"─".repeat(70)}

下一步操作:
${allPassed 
  ? "  ✅ 系统可以准备部署，请按照部署指南进行操作" 
  : "  ⚠️ 请先修复失败的测试项，然后重新运行测试"}

测试报告生成时间: ${new Date().toLocaleString("zh-CN")}
`);
}

runTests();

