"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { 
  ChevronDown, 
  ChevronUp, 
  Users, 
  Building2, 
  Shield, 
  Stethoscope, 
  HeartPulse, 
  Megaphone, 
  Globe,
  Wallet,
  UserCog
} from "lucide-react";

// 完整测试账号列表 - 带图标分类
const TEST_ACCOUNTS = [
  {
    category: "总部管理",
    icon: Shield,
    color: "text-red-400",
    accounts: [
      { account: "00001", name: "系统管理员", role: "总部管理员" },
    ],
  },
  {
    category: "鑫洁口腔 - 管理层",
    icon: Building2,
    color: "text-cyan-400",
    accounts: [
      { account: "10001", name: "李店长", role: "店长" },
    ],
  },
  {
    category: "鑫洁口腔 - 咨询部",
    icon: Users,
    color: "text-blue-400",
    accounts: [
      { account: "10101", name: "王咨询主管", role: "部门负责人" },
      { account: "10102", name: "张咨询师", role: "咨询师" },
    ],
  },
  {
    category: "鑫洁口腔 - 前台客服",
    icon: UserCog,
    color: "text-green-400",
    accounts: [
      { account: "10201", name: "刘前台主管", role: "部门负责人" },
      { account: "10202", name: "陈前台", role: "前台" },
    ],
  },
  {
    category: "鑫洁口腔 - 市场推广",
    icon: Megaphone,
    color: "text-orange-400",
    accounts: [
      { account: "10301", name: "赵市场主管", role: "部门负责人" },
      { account: "10302", name: "周市场专员", role: "市场专员" },
    ],
  },
  {
    category: "鑫洁口腔 - 网络新媒体",
    icon: Globe,
    color: "text-purple-400",
    accounts: [
      { account: "10401", name: "吴新媒体主管", role: "部门负责人" },
    ],
  },
  {
    category: "鑫洁口腔 - 医护团队",
    icon: Stethoscope,
    color: "text-pink-400",
    accounts: [
      { account: "10501", name: "孙主治医师", role: "医疗负责人" },
      { account: "10601", name: "郑护士长", role: "护士长" },
      { account: "10602", name: "李配台组长", role: "配台组长" },
      { account: "10603", name: "王配台护士", role: "配台护士" },
      { account: "10604", name: "张洁牙组长", role: "洁牙组长" },
      { account: "10605", name: "刘洁牙师", role: "洁牙师" },
    ],
  },
  {
    category: "鑫洁口腔 - 财务人事",
    icon: Wallet,
    color: "text-yellow-400",
    accounts: [
      { account: "10701", name: "冯财务主管", role: "财务负责人" },
      { account: "10702", name: "钟会计", role: "会计" },
      { account: "10703", name: "蒋出纳", role: "出纳" },
      { account: "10801", name: "沈人事主管", role: "人事负责人" },
      { account: "10802", name: "韩人事专员", role: "人事专员" },
    ],
  },
  {
    category: "德弗城南店",
    icon: Building2,
    color: "text-emerald-400",
    accounts: [
      { account: "20001", name: "钱店长", role: "店长" },
      { account: "20101", name: "孙咨询主管", role: "咨询部负责人" },
      { account: "20201", name: "杨前台主管", role: "前台负责人" },
      { account: "20301", name: "何市场主管", role: "市场负责人" },
    ],
  },
];

function LoginForm() {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTestAccounts, setShowTestAccounts] = useState(false);
  const [loggingInAccount, setLoggingInAccount] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        account,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "登录失败",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "登录成功",
          description: "正在进入系统...",
        });
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      toast({
        title: "网络错误",
        description: "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (testAccount: string, name: string) => {
    setLoggingInAccount(testAccount);
    try {
      const result = await signIn("credentials", {
        account: testAccount,
        password: "123456",
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "登录失败",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: `欢迎，${name}！`,
          description: "正在进入系统...",
        });
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      toast({
        title: "网络错误",
        variant: "destructive",
      });
    } finally {
      setLoggingInAccount(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* 登录卡片 */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">德弗口腔运营系统</h1>
            <p className="text-slate-400 text-sm mt-1">DENTAL-OPS v2.0</p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">账号</label>
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                placeholder="请输入账号"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                placeholder="请输入密码"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-lg hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  登录中...
                </span>
              ) : "登录"}
            </button>
          </form>

          {/* 测试账号展开按钮 */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowTestAccounts(!showTestAccounts)}
              className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-slate-200 text-sm transition-colors cursor-pointer py-2"
            >
              <Users className="w-4 h-4" />
              快速登录测试账号
              {showTestAccounts ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 测试账号列表 - 带图标分类样式 */}
        {showTestAccounts && (
          <div className="mt-4 bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 max-h-[60vh] overflow-y-auto">
            <div className="text-center mb-4 pb-4 border-b border-white/10">
              <p className="text-slate-400 text-sm">默认密码: <span className="text-cyan-400 font-mono">123456</span></p>
            </div>
            
            <div className="grid gap-4 sm:grid-cols-2">
              {TEST_ACCOUNTS.map((category) => {
                const Icon = category.icon;
                return (
                  <div key={category.category} className="space-y-2">
                    {/* 分类标题 */}
                    <div className={`flex items-center gap-2 text-xs font-medium ${category.color} uppercase tracking-wider`}>
                      <Icon className="w-3.5 h-3.5" />
                      <span className="truncate">{category.category}</span>
                    </div>
                    
                    {/* 账号列表 */}
                    <div className="space-y-1">
                      {category.accounts.map((acc) => (
                        <button
                          type="button"
                          key={acc.account}
                          onClick={() => handleQuickLogin(acc.account, acc.name)}
                          disabled={loggingInAccount !== null}
                          className={`w-full text-left px-3 py-2 rounded-lg border transition-all duration-200 cursor-pointer ${
                            loggingInAccount === acc.account
                              ? "border-cyan-500/50 bg-cyan-500/10"
                              : "border-white/5 hover:border-white/20 hover:bg-white/5"
                          } disabled:opacity-50`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-white text-sm truncate">{acc.name}</span>
                            <span className="text-slate-600 text-xs font-mono flex-shrink-0">{acc.account}</span>
                          </div>
                          {loggingInAccount === acc.account && (
                            <div className="flex items-center gap-2 mt-1 text-cyan-400 text-xs">
                              <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              登录中...
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 底部 */}
        <p className="text-center text-slate-600 text-xs mt-6">
          © 2024 德弗口腔运营管理系统
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
