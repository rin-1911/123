import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import type { Role, DepartmentCode, UserSession } from "./types";
import { parseRoles, getPrimaryRole } from "./types";

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
        if (!credentials?.account || !credentials?.password) {
          throw new Error("请输入账号和密码");
        }

        const user = await prisma.user.findUnique({
          where: { account: credentials.account },
          include: {
            Store: true,
            Department: true,
          },
        });

        // 安全改进：统一错误信息，防止用户枚举攻击
        // 不区分"账号不存在"和"密码错误"
        if (!user) {
          throw new Error("账号或密码错误");
        }

        if (!user.isActive) {
          throw new Error("账号已被禁用，请联系管理员");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error("账号或密码错误");
        }

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

