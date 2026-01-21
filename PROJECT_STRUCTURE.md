# 项目文件结构与功能详解

本文档详细说明了本项目（德弗口腔运营管理系统）中各个文件和目录的作用，帮助开发和运维人员快速理解系统架构。

## 1. 根目录配置文件

| 文件名 | 类型 | 作用说明 |
| :--- | :--- | :--- |
| **`package.json`** | 项目配置 | 定义项目依赖（如 Next.js, React, Prisma）、启动脚本（dev, build, start）以及项目元数据。 |
| **`package-lock.json`** | 依赖锁定 | 锁定安装时的具体依赖版本，确保不同环境下安装的依赖一致。 |
| **`tsconfig.json`** | TS 配置 | TypeScript 编译选项配置，定义路径别名（如 `@/*` 指向 `src/*`）和编译规则。 |
| **`next.config.mjs`** | Next.js 配置 | Next.js 框架的配置文件，用于配置构建行为、环境变量、图片域名等。 |
| **`tailwind.config.ts`** | 样式配置 | Tailwind CSS 配置文件，定义主题颜色、字体、断点以及自定义样式插件（如 `tailwindcss-animate`）。 |
| **`postcss.config.mjs`** | CSS 处理 | PostCSS 配置文件，用于加载 Tailwind CSS 和 Autoprefixer 插件。 |
| **`.eslintrc.json`** | 代码规范 | ESLint 配置文件，定义代码检查规则，保持代码风格统一。 |
| **`.gitignore`** | Git 忽略 | 指定 Git 版本控制需要忽略的文件，如 `node_modules`、`.env`、日志文件等。 |
| **`.dockerignore`** | Docker 忽略 | 指定构建 Docker 镜像时不需要复制的文件，减小镜像体积并提高安全性。 |
| **`Dockerfile`** | 部署构建 | 定义 Docker 镜像的构建步骤，用于容器化部署。 |
| **`docker-compose.yml`** | 容器编排 | 定义 Docker 服务编排，包含应用服务配置（端口映射、环境变量等）。 |
| **`README.md`** | 项目说明 | 项目的主文档，包含项目介绍、快速开始、功能列表等。 |

## 2. 源代码目录 (`src/`)

### 2.1 应用路由 (`src/app/`)
基于 Next.js App Router 架构。

| 路径 | 说明 |
| :--- | :--- |
| **`layout.tsx`** | 全局根布局，定义 HTML 结构、字体和全局 Provider（如 Toast, Session）。 |
| **`page.tsx`** | 首页（重定向逻辑）。 |
| **`globals.css`** | 全局样式文件，引入 Tailwind 指令。 |
| **`login/page.tsx`** | **登录页面**，处理用户认证逻辑。 |
| **`(dashboard)/`** | **后台管理布局组**，包含侧边栏、顶部导航等共享布局。 |
| ├── `layout.tsx` | Dashboard 布局文件，包含 Sidebar 和 Header。 |
| ├── `admin/` | **系统管理模块**（用户管理、字典管理、配置中心）。 |
| ├── `daily/` | **日报模块**（填写日报、团队日报、我的日报）。 |
| └── `reports/` | **报表模块**（门店报表、数据汇总）。 |
| **`api/`** | **后端 API 路由**，处理前端请求。 |
| ├── `auth/[...nextauth]/` | NextAuth 认证处理（登录、Session 管理）。 |
| ├── `daily/` | 日报数据的增删改查接口。 |
| ├── `reports/` | 报表聚合与统计接口。 |
| └── `...` | 其他业务接口（部门、门店、用户等）。 |

### 2.2 组件库 (`src/components/`)

| 目录 | 说明 |
| :--- | :--- |
| **`ui/`** | **基础 UI 组件**（基于 Shadcn/ui），如 Button, Input, Dialog, Card 等，不含业务逻辑。 |
| **`admin/`** | **管理后台业务组件**，如用户管理表格、权限配置表单、字典管理面板。 |
| **`daily/`** | **日报业务组件**，如日报填写表单、团队日报视图。 |
| **`reports/`** | **报表业务组件**，如数据汇总面板、门店报表图表。 |
| **`providers/`** | **全局上下文组件**，如 `auth-provider.tsx` (Session 供体)。 |

### 2.3 核心库 (`src/lib/`)

| 文件/目录 | 说明 |
| :--- | :--- |
| **`prisma.ts` / `db.ts`** | **数据库实例**，导出全局唯一的 PrismaClient 实例，防止连接数耗尽。 |
| **`auth.ts`** | **认证配置**，NextAuth 的核心配置，定义 CredentialsProvider、回调函数（JWT, Session）。 |
| **`utils.ts`** | **通用工具函数**，如 CSS 类名合并（cn）、日期格式化等。 |
| **`rbac.ts`** | **权限控制逻辑**，定义角色权限检查函数。 |
| **`report-aggregator.ts`** | **报表聚合逻辑**，负责将复杂的日报数据聚合为统计报表的核心算法。 |
| **`schemas/`** | **Zod 验证模式**，定义前端表单验证规则和后端数据校验规则。 |
| **`templates/`** | **模板定义**，定义日报的动态表单结构。 |

## 3. 数据库与脚本 (`prisma/` & `scripts/`)

| 文件/目录 | 说明 |
| :--- | :--- |
| **`prisma/schema.prisma`** | **数据库模型定义**，定义表结构（User, Store, DailyReport 等）及关系。 |
| **`prisma/seed.ts`** | **种子数据脚本**，用于初始化数据库（创建默认部门、门店、管理员账号）。 |
| **`scripts/`** | **运维脚本目录**。 |
| ├── `reset-admin.ts` | 重置管理员密码脚本。 |
| ├── `check-data.ts` | 数据完整性检查脚本。 |
| └── `...` | 其他辅助脚本。 |

## 4. 静态资源 (`public/`)

存放图片、图标等静态文件，可直接通过 URL 访问。

---

**注意**：
- 带有 `.` 开头的文件（如 `.env`）通常包含敏感信息，**严禁**提交到版本控制系统（已在 `.gitignore` 中配置）。
- `node_modules/` 目录存放第三方依赖包，不需要提交，通过 `npm install` 自动生成。
