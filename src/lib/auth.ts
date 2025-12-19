import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import type { Role, DepartmentCode, UserSession } from "./types";
import { parseRoles, getPrimaryRole } from "./types";
import { isWeakPassword } from "./password-policy";

declare module "next-auth" {
  interface Session {
    user: UserSession;
  }
  interface User extends UserSession {}
}

declare module "next-auth/jwt" {
  interface JWT extends UserSession {}
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        account: { label: "账号", type: "text" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        const account = (credentials?.account || "").trim();
        const password = credentials?.password || "";

        if (!account || !password) {
          throw new Error("请输入账号和密码");
        }

        const user = await prisma.user.findUnique({
          where: { account },
          include: {
            Store: true,
            Department: true,
          },
        });

        // 调试日志：看是否找到了用户
        if (!user) {
          console.log(`[AUTH DEBUG] 找不到账号: "${account}"`);
          throw new Error("账号不存在 (调试用)");
        }

        console.log(`[AUTH DEBUG] 找到账号: "${account}", 开始对比密码...`);

        if (!user.isActive) {
          throw new Error("账号已被禁用，请联系管理员");
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        
        if (!isValid) {
          console.log(`[AUTH DEBUG] 密码错误: 账号为 "${account}"`);
          throw new Error("密码错误 (调试用)");
        }

        console.log(`[AUTH DEBUG] 登录成功: "${account}"`);

        // 解析多角色
        const roles = parseRoles(user.roles);
        const primaryRole = getPrimaryRole(roles);

        return {
          id: user.id,
          account: user.account,
          name: user.name,
          roles: roles,
          primaryRole: primaryRole,
          storeId: user.storeId,
          departmentId: user.departmentId,
          departmentCode: user.Department?.code as DepartmentCode | null,
          storeName: user.Store?.name ?? null,
          departmentName: user.Department?.name ?? null,
          nursingRole: user.nursingRole ?? null,
          passwordWeak: isWeakPassword(password),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.account = user.account;
        token.name = user.name;
        token.roles = user.roles;
        token.primaryRole = user.primaryRole;
        token.storeId = user.storeId;
        token.departmentId = user.departmentId;
        token.departmentCode = user.departmentCode;
        token.storeName = user.storeName;
        token.departmentName = user.departmentName;
        token.nursingRole = user.nursingRole;
        token.passwordWeak = (user as UserSession).passwordWeak ?? false;
      }
      // 兼容旧版本 token（只有 role，没有 roles/primaryRole）
      const anyToken = token as unknown as { role?: string; roles?: unknown; primaryRole?: unknown };
      if (!Array.isArray(anyToken.roles) || anyToken.roles.length === 0) {
        const legacyRole = anyToken.role as Role | undefined;
        token.roles = legacyRole ? [legacyRole] : ["STAFF"];
      }
      if (!token.primaryRole) {
        token.primaryRole = getPrimaryRole((token.roles as Role[]) ?? ["STAFF"]);
      }
      return token;
    },
    async session({ session, token }) {
      // 兜底：roles 为空时，用 legacy role 或 STAFF
      const anyToken = token as unknown as { role?: string; roles?: unknown; primaryRole?: unknown };
      const roles =
        Array.isArray(anyToken.roles) && anyToken.roles.length > 0
          ? (anyToken.roles as Role[])
          : ([((anyToken.role as Role | undefined) ?? "STAFF")] as Role[]);
      const primaryRole = (anyToken.primaryRole as Role | undefined) ?? getPrimaryRole(roles);
      session.user = {
        id: token.id as string,
        account: token.account as string,
        name: token.name as string,
        roles,
        primaryRole,
        storeId: token.storeId as string | null,
        departmentId: token.departmentId as string | null,
        departmentCode: token.departmentCode as DepartmentCode | null,
        storeName: token.storeName as string | null,
        departmentName: token.departmentName as string | null,
        nursingRole: token.nursingRole as string | null,
        passwordWeak: (token as unknown as { passwordWeak?: boolean }).passwordWeak ?? false,
      };
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
};

