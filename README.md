# 德弗口腔运营管理系统

口腔诊所连锁门店运营数据填报与汇总系统。

## 功能特性

- **多门店支持**：支持多门店数据管理，可扩展至区域/总部级别
- **多角色权限**：STAFF、DEPT_LEAD、STORE_MANAGER、FINANCE、HQ_ADMIN 等角色
- **每日填报**：7个部门各有专属填报表单（咨询、前台、市场、网络、医疗、护理、财务）
- **自动汇总**：门店看板自动汇总计算核心经营指标
- **数据锁定**：店长可锁定某日数据，防止误修改
- **数据口径**：每个字段都有统一的口径说明

## 技术栈

- **框架**: Next.js 14 (App Router) + TypeScript
- **样式**: TailwindCSS + shadcn/ui
- **数据库**: Prisma ORM + SQLite (开发) / PostgreSQL (生产)
- **认证**: NextAuth.js (Credentials Provider)
- **权限**: 服务端 RBAC 校验

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env` 文件：

```env
# 数据库配置 - 开发环境使用 SQLite
DATABASE_URL="file:./dev.db"

# 生产环境改为 PostgreSQL:
# DATABASE_URL="postgresql://user:password@localhost:5432/dental_ops?schema=public"

# NextAuth 配置
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-in-production-32chars"
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npx prisma generate

# 创建数据库迁移
npx prisma migrate dev --name init

# 填充示例数据
npm run db:seed
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 示例账号

所有示例账号密码均为：`123456`

### 账号编号规则
- 第1位：门店编号（0=总部，1=鑫洁，2=德弗城南）
- 第2-3位：部门编号（00=管理，01=咨询，02=前台，03=线下市场，04=网络，05=医疗，06=护理，07=财务）
- 第4-5位：员工序号（01=主管，02=员工...）

| 账号 | 姓名 | 角色 | 门店 | 部门 |
|------|------|------|------|------|
| 00001 | 系统管理员 | HQ_ADMIN | 总部 | - |
| 10001 | 李店长 | STORE_MANAGER | 鑫洁口腔 | 管理层 |
| 20001 | 钱店长 | STORE_MANAGER | 德弗城南 | 管理层 |
| 10101 | 王咨询主管 | DEPT_LEAD | 鑫洁口腔 | 咨询部 |
| 10102 | 张咨询师 | STAFF | 鑫洁口腔 | 咨询部 |
| 10201 | 刘前台主管 | DEPT_LEAD | 鑫洁口腔 | 前台客服 |
| 10202 | 陈前台 | STAFF | 鑫洁口腔 | 前台客服 |
| 10301 | 赵市场主管 | DEPT_LEAD | 鑫洁口腔 | 线下市场 |
| 10302 | 周市场专员 | STAFF | 鑫洁口腔 | 线下市场 |
| 10401 | 吴新媒体主管 | DEPT_LEAD | 鑫洁口腔 | 网络新媒体 |
| 10501 | 孙主治医师 | DEPT_LEAD | 鑫洁口腔 | 医疗部 |
| 10601 | 郑护士长 | DEPT_LEAD | 鑫洁口腔 | 护理部 |
| 10701 | 冯财务主管 | FINANCE | 鑫洁口腔 | 财务人资行政 |
| 20101 | 孙咨询主管 | DEPT_LEAD | 德弗城南 | 咨询部 |
| 20201 | 杨前台主管 | DEPT_LEAD | 德弗城南 | 前台客服 |
| 20301 | 何市场主管 | DEPT_LEAD | 德弗城南 | 线下市场 |

## 项目结构

```
├── prisma/
│   ├── schema.prisma      # 数据库模型定义
│   └── seed.ts            # 种子数据脚本
├── src/
│   ├── app/
│   │   ├── (dashboard)/   # 需要登录的页面
│   │   │   ├── dashboard/ # 工作台
│   │   │   ├── daily/     # 日报管理
│   │   │   │   ├── my/    # 我的日报
│   │   │   │   └── team/  # 团队日报
│   │   │   ├── reports/   # 报表
│   │   │   │   └── store/ # 门店报表
│   │   │   └── admin/     # 管理后台
│   │   │       └── users/ # 用户管理
│   │   ├── api/           # API 路由
│   │   │   ├── auth/      # 认证
│   │   │   ├── daily/     # 日报 API
│   │   │   └── reports/   # 报表 API
│   │   └── login/         # 登录页
│   ├── components/
│   │   ├── daily/         # 日报相关组件
│   │   ├── layout/        # 布局组件
│   │   ├── providers/     # Context Providers
│   │   ├── reports/       # 报表相关组件
│   │   └── ui/            # UI 基础组件
│   └── lib/
│       ├── auth.ts        # NextAuth 配置
│       ├── db.ts          # Prisma 客户端
│       ├── rbac.ts        # 权限校验
│       ├── schemas/       # 表单验证 Schema
│       ├── types.ts       # TypeScript 类型
│       └── utils.ts       # 工具函数
```

## 核心概念

### 角色权限

| 角色 | 权限说明 |
|------|----------|
| STAFF | 普通员工，只能填写/查看本人日报 |
| DEPT_LEAD | 部门负责人，可查看本部门所有人日报 |
| STORE_MANAGER | 店长，可查看本店所有数据，可锁定日期 |
| FINANCE | 财务，可查看财务模块与收款汇总 |
| MEDICAL_QC | 医疗质控，可查看医疗相关数据 |
| REGION_MANAGER | 区域经理，可查看区域内所有门店（预留） |
| HQ_ADMIN | 总部管理员，可查看所有数据 |

### 数据锁定

- 店长可以锁定某一天的数据
- 锁定后，普通员工无法修改当日日报
- 只有店长或总部管理员可以解锁

### 日报状态

- **DRAFT**：草稿，可随时修改
- **SUBMITTED**：已提交，需撤回后才能修改

## 部署到生产环境

### 1. 切换到 PostgreSQL

修改 `prisma/schema.prisma`：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

修改 `.env`：

```env
DATABASE_URL="postgresql://user:password@host:5432/dental_ops?schema=public"
```

### 2. 执行迁移

```bash
npx prisma migrate deploy
npm run db:seed
```

### 3. 构建部署

```bash
npm run build
npm start
```

## 开发命令

```bash
# 开发服务器
npm run dev

# 数据库迁移
npm run db:migrate

# 填充数据
npm run db:seed

# 数据库管理界面
npm run db:studio

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 数据口径说明

系统内置了统一的数据口径定义，确保各部门理解一致：

- **初诊人数**：首次到店就诊的患者数量（第一次来本店）
- **成交人数**：当日完成付费的患者数量（含初诊和复诊）
- **实收金额**：实际收到的现金/转账金额，不含欠款和预存
- **有效线索**：经电话确认有就诊意向的线索数量
- **到店转化率**：预约后实际到店的比例
- **初诊成交率**：初诊患者中当日完成付费的比例
- **客单价**：实收金额 / 成交人数

更多口径说明请查看系统内的字段提示。

## 隐私说明

系统严格遵守数据隐私原则：

- **不录入**患者姓名、电话、身份证等敏感个人信息
- 只做**运营汇总数据**与**线索分级统计**
- 所有数据以**数字**形式存储，不涉及具体患者信息

## License

MIT

