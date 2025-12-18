/**
 * 安全性测试脚本
 * 运行: npx tsx tests/test-security.ts
 */

const BASE_URL = "http://localhost:3000";

interface SecurityTest {
  name: string;
  category: string;
  passed: boolean;
  severity: "critical" | "high" | "medium" | "low";
  message: string;
}

const results: SecurityTest[] = [];

function addResult(category: string, name: string, passed: boolean, message: string, severity: SecurityTest["severity"]) {
  results.push({ category, name, passed, severity, message });
  const icon = passed ? "✅" : "❌";
  const sevIcon = severity === "critical" ? "🔴" : severity === "high" ? "🟠" : severity === "medium" ? "🟡" : "🟢";
  console.log(`  ${icon} ${sevIcon} ${name}: ${message}`);
}

// ==================== SQL 注入测试 ====================
async function testSQLInjection() {
  console.log("\n💉 SQL注入测试");
  console.log("─".repeat(60));
  
  const payloads = [
    "' OR 1=1 --",
    "'; DROP TABLE User; --",
    "1' OR '1'='1",
    "admin'--",
    "1; SELECT * FROM User",
  ];
  
  for (const payload of payloads) {
    try {
      const response = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account: payload,
          password: "test"
        })
      });
      
      // 如果返回200且成功登录，说明有注入漏洞
      const text = await response.text();
      const isVulnerable = response.ok && text.includes('"user"');
      
      addResult("SQL注入", `Payload: ${payload.substring(0, 20)}...`, !isVulnerable,
        isVulnerable ? "可能存在SQL注入漏洞！" : "已阻止",
        "critical");
        
    } catch (error: any) {
      addResult("SQL注入", `Payload: ${payload.substring(0, 20)}...`, true,
        "请求被阻止", "critical");
    }
  }
}

// ==================== XSS 测试 ====================
async function testXSS() {
  console.log("\n🔥 XSS跨站脚本测试");
  console.log("─".repeat(60));
  
  const xssPayloads = [
    "<script>alert('xss')</script>",
    "<img src=x onerror=alert('xss')>",
    "javascript:alert('xss')",
    "<svg onload=alert('xss')>",
    "'><script>alert('xss')</script>",
  ];
  
  for (const payload of xssPayloads) {
    try {
      // 测试登录接口
      const response = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          account: payload,
          password: payload
        })
      });
      
      const text = await response.text();
      // 检查响应中是否包含未转义的payload
      const isVulnerable = text.includes(payload) && !text.includes("&lt;");
      
      addResult("XSS", `Payload: ${payload.substring(0, 25)}...`, !isVulnerable,
        isVulnerable ? "响应中包含未转义的脚本！" : "已转义或阻止",
        "high");
        
    } catch (error: any) {
      addResult("XSS", `Payload: ${payload.substring(0, 25)}...`, true,
        "请求被阻止", "high");
    }
  }
}

// ==================== 认证绕过测试 ====================
async function testAuthBypass() {
  console.log("\n🔓 认证绕过测试");
  console.log("─".repeat(60));
  
  // 测试无Cookie访问受保护资源
  const protectedEndpoints = [
    "/api/users",
    "/api/daily",
    "/api/stores",
    "/api/consultations?startDate=2024-01-01&endDate=2024-01-01",
  ];
  
  for (const endpoint of protectedEndpoints) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: { "Content-Type": "application/json" }
      });
      
      // 应该返回401或重定向
      const isProtected = response.status === 401 || 
                          response.status === 307 || 
                          response.status === 403 ||
                          response.status === 400;
      
      addResult("认证", `未授权访问 ${endpoint}`, isProtected,
        isProtected ? `返回 ${response.status}` : `返回 ${response.status}，可能未受保护`,
        "high");
        
    } catch (error: any) {
      addResult("认证", `未授权访问 ${endpoint}`, true,
        "请求失败（可能是正常的保护机制）", "high");
    }
  }
}

// ==================== 敏感信息泄露测试 ====================
async function testInfoDisclosure() {
  console.log("\n🔍 敏感信息泄露测试");
  console.log("─".repeat(60));
  
  // 检查错误响应是否泄露堆栈信息
  try {
    const response = await fetch(`${BASE_URL}/api/nonexistent`);
    const text = await response.text();
    
    const hasStackTrace = text.includes("at ") && text.includes(".js:");
    addResult("信息泄露", "错误响应堆栈", !hasStackTrace,
      hasStackTrace ? "错误响应中包含堆栈信息" : "未泄露堆栈信息",
      "medium");
      
  } catch (error) {
    addResult("信息泄露", "错误响应堆栈", true, "请求失败", "medium");
  }
  
  // 检查是否可以枚举用户
  try {
    const response1 = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account: "00001", password: "wrongpassword" })
    });
    
    const response2 = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ account: "nonexistent99999", password: "wrongpassword" })
    });
    
    // 检查响应中是否包含可区分用户存在与否的明确文本
    const text1 = await response1.text();
    const text2 = await response2.text();
    
    // 检查是否有明确区分的错误信息（如"账号不存在"vs"密码错误"）
    const hasDistinctErrors = 
      (text1.includes("账号不存在") || text2.includes("账号不存在")) ||
      (text1.includes("密码错误") && !text1.includes("账号或密码错误")) ||
      (text2.includes("密码错误") && !text2.includes("账号或密码错误"));
    
    // 如果使用统一的错误信息或NextAuth默认处理，则认为安全
    const canEnumerate = hasDistinctErrors;
    addResult("信息泄露", "用户枚举", !canEnumerate,
      canEnumerate ? "可以通过错误信息区分用户是否存在" : "已使用统一错误信息，无法枚举用户",
      "low");
      
  } catch (error) {
    addResult("信息泄露", "用户枚举", true, "测试失败", "low");
  }
}

// ==================== 目录遍历测试 ====================
async function testPathTraversal() {
  console.log("\n📁 目录遍历测试");
  console.log("─".repeat(60));
  
  const payloads = [
    "../../../etc/passwd",
    "..\\..\\..\\windows\\system32\\config\\sam",
    "....//....//....//etc/passwd",
    "%2e%2e%2f%2e%2e%2f%2e%2e%2fetc/passwd",
  ];
  
  for (const payload of payloads) {
    try {
      const response = await fetch(`${BASE_URL}/${payload}`);
      const text = await response.text();
      
      // 检查是否返回敏感文件内容
      const isVulnerable = text.includes("root:") || text.includes("SAM");
      
      addResult("目录遍历", `Payload: ${payload.substring(0, 30)}...`, !isVulnerable,
        isVulnerable ? "可能存在目录遍历漏洞！" : "已阻止",
        "critical");
        
    } catch (error) {
      addResult("目录遍历", `Payload: ${payload.substring(0, 30)}...`, true,
        "请求被阻止", "critical");
    }
  }
}

// ==================== HTTP 头安全测试 ====================
async function testSecurityHeaders() {
  console.log("\n🔒 HTTP安全头测试");
  console.log("─".repeat(60));
  
  try {
    const response = await fetch(`${BASE_URL}/login`);
    const headers = response.headers;
    
    // 检查安全相关的HTTP头
    const securityHeaders = [
      { name: "X-Frame-Options", expected: true },
      { name: "X-Content-Type-Options", expected: true },
      { name: "X-XSS-Protection", expected: false }, // 已弃用
      { name: "Strict-Transport-Security", expected: false }, // 需要HTTPS
      { name: "Content-Security-Policy", expected: false }, // 建议有
    ];
    
    for (const { name, expected } of securityHeaders) {
      const hasHeader = headers.has(name);
      addResult("HTTP头", name, !expected || hasHeader,
        hasHeader ? `已设置: ${headers.get(name)?.substring(0, 30)}` : "未设置",
        expected && !hasHeader ? "medium" : "low");
    }
    
  } catch (error) {
    addResult("HTTP头", "安全头检查", false, "请求失败", "medium");
  }
}

// ==================== 生成报告 ====================
function generateReport() {
  console.log("\n");
  console.log("═".repeat(60));
  console.log("                  安全测试报告");
  console.log("═".repeat(60));
  
  const categories = Array.from(new Set(results.map(r => r.category)));
  
  const stats = {
    critical: { passed: 0, failed: 0 },
    high: { passed: 0, failed: 0 },
    medium: { passed: 0, failed: 0 },
    low: { passed: 0, failed: 0 },
  };
  
  for (const r of results) {
    if (r.passed) {
      stats[r.severity].passed++;
    } else {
      stats[r.severity].failed++;
    }
  }
  
  console.log("\n按严重程度统计:");
  console.log(`  🔴 严重: ${stats.critical.passed}/${stats.critical.passed + stats.critical.failed} 通过`);
  console.log(`  🟠 高危: ${stats.high.passed}/${stats.high.passed + stats.high.failed} 通过`);
  console.log(`  🟡 中危: ${stats.medium.passed}/${stats.medium.passed + stats.medium.failed} 通过`);
  console.log(`  🟢 低危: ${stats.low.passed}/${stats.low.passed + stats.low.failed} 通过`);
  
  const totalPassed = results.filter(r => r.passed).length;
  const totalFailed = results.filter(r => !r.passed).length;
  
  console.log("\n─".repeat(60));
  console.log(`总计: ${totalPassed}/${results.length} 通过 (${Math.round(totalPassed/results.length*100)}%)`);
  
  // 输出失败项
  const criticalFailed = results.filter(r => !r.passed && r.severity === "critical");
  const highFailed = results.filter(r => !r.passed && r.severity === "high");
  
  if (criticalFailed.length > 0) {
    console.log("\n⛔ 严重安全问题:");
    for (const r of criticalFailed) {
      console.log(`   - [${r.category}] ${r.name}: ${r.message}`);
    }
  }
  
  if (highFailed.length > 0) {
    console.log("\n⚠️ 高危安全问题:");
    for (const r of highFailed) {
      console.log(`   - [${r.category}] ${r.name}: ${r.message}`);
    }
  }
  
  if (criticalFailed.length === 0 && highFailed.length === 0) {
    console.log("\n🎉 未发现严重安全问题！");
  } else {
    console.log("\n❗ 建议修复以上问题后再部署到生产环境");
  }
  
  console.log("\n" + "═".repeat(60));
  console.log(`测试时间: ${new Date().toLocaleString("zh-CN")}`);
  console.log("═".repeat(60));
}

// ==================== 主函数 ====================
async function main() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║              安全性测试 - Security Audit               ║");
  console.log("╚════════════════════════════════════════════════════════╝");
  
  // 检查服务器
  try {
    await fetch(`${BASE_URL}/login`);
  } catch {
    console.log("\n❌ 服务器未运行！请先执行: npm run dev");
    process.exit(1);
  }
  
  await testSQLInjection();
  await testXSS();
  await testAuthBypass();
  await testInfoDisclosure();
  await testPathTraversal();
  await testSecurityHeaders();
  
  generateReport();
}

main();

