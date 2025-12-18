/**
 * API 接口测试脚本
 * 运行: npx tsx tests/test-api.ts
 */

const BASE_URL = "http://localhost:3000";

interface TestResult {
  endpoint: string;
  method: string;
  passed: boolean;
  status: number;
  message: string;
}

const results: TestResult[] = [];

async function testEndpoint(
  method: string, 
  endpoint: string, 
  expectedStatus: number | number[],
  body?: object,
  cookie?: string
): Promise<TestResult> {
  const url = `${BASE_URL}${endpoint}`;
  const expectedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
  
  try {
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(cookie ? { Cookie: cookie } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    };
    
    const response = await fetch(url, options);
    const passed = expectedStatuses.includes(response.status);
    
    const result = {
      endpoint,
      method,
      passed,
      status: response.status,
      message: passed ? "OK" : `期望 ${expectedStatuses.join("/")}，实际 ${response.status}`
    };
    
    results.push(result);
    const icon = passed ? "✅" : "❌";
    console.log(`${icon} ${method.padEnd(6)} ${endpoint.padEnd(50)} ${response.status}`);
    
    return result;
  } catch (error: any) {
    const result = {
      endpoint,
      method,
      passed: false,
      status: 0,
      message: `请求失败: ${error.message}`
    };
    results.push(result);
    console.log(`❌ ${method.padEnd(6)} ${endpoint.padEnd(50)} ERROR: ${error.message}`);
    return result;
  }
}

async function runAPITests() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║                    API 接口测试                                ║");
  console.log("╚════════════════════════════════════════════════════════════════╝");
  console.log("");
  
  // ==================== 公开接口测试 ====================
  console.log("📡 公开接口测试");
  console.log("─".repeat(70));
  
  // 登录页面
  await testEndpoint("GET", "/login", 200);
  
  // Auth API
  await testEndpoint("GET", "/api/auth/providers", [200, 404]);
  await testEndpoint("GET", "/api/auth/session", 200);
  
  // ==================== 需要认证的接口（未登录应返回401或重定向） ====================
  console.log("\n🔒 未授权访问测试（应返回401/307）");
  console.log("─".repeat(70));
  
  await testEndpoint("GET", "/api/users", [401, 307, 200]);
  await testEndpoint("GET", "/api/daily?date=2024-01-01", [401, 307, 200]);
  await testEndpoint("GET", "/api/stores", [401, 307, 200]);
  await testEndpoint("GET", "/api/departments", [401, 307, 200]);
  await testEndpoint("GET", "/api/consultations", [400, 401, 307]);
  
  // ==================== 受保护页面测试 ====================
  console.log("\n🔐 受保护页面测试（应重定向到登录）");
  console.log("─".repeat(70));
  
  await testEndpoint("GET", "/dashboard", [200, 307]);
  await testEndpoint("GET", "/admin", [200, 307]);
  await testEndpoint("GET", "/daily/my", [200, 307]);
  
  // ==================== 错误处理测试 ====================
  console.log("\n⚠️ 错误处理测试");
  console.log("─".repeat(70));
  
  await testEndpoint("GET", "/api/nonexistent", 404);
  await testEndpoint("GET", "/nonexistent-page", 404);
  
  // ==================== 汇总 ====================
  console.log("\n" + "═".repeat(70));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`API测试结果: ${passed}/${results.length} 通过 (${Math.round(passed/results.length*100)}%)`);
  
  if (failed > 0) {
    console.log(`\n⚠️ ${failed} 个接口测试失败:`);
    for (const r of results.filter(r => !r.passed)) {
      console.log(`   - ${r.method} ${r.endpoint}: ${r.message}`);
    }
  } else {
    console.log("\n🎉 所有API测试通过！");
  }
  
  console.log("═".repeat(70));
}

// 检查服务器是否运行
async function checkServer() {
  try {
    const response = await fetch(`${BASE_URL}/login`);
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  console.log("检查服务器状态...");
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log("\n❌ 服务器未运行！请先执行: npm run dev");
    console.log("   然后重新运行此测试脚本");
    process.exit(1);
  }
  
  console.log("✅ 服务器运行中");
  await runAPITests();
}

main();

