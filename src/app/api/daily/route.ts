import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEditReport } from "@/lib/rbac";
import { getToday } from "@/lib/utils";
import type { DepartmentCode } from "@/lib/types";
import { hasAnyRole } from "@/lib/types";
import { flattenContainerizedFormData } from "@/lib/templates/template-schema";

// 强制不缓存，确保数据实时
export const dynamic = "force-dynamic";

// GET: 获取当前用户某日的日报
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const reportDate = searchParams.get("date") || getToday();
  const targetUserId = searchParams.get("targetUserId");
  const departmentId = searchParams.get("departmentId"); // 支持指定部门

  // 构建查询条件
  const whereClause: { userId: string; reportDate: string; departmentId?: string } = {
    userId: targetUserId || session.user.id,
    reportDate,
  };
  
  // 如果指定了部门ID，则查询该部门的日报
  if (departmentId) {
    whereClause.departmentId = departmentId;
  }

  // 并行获取最新的日报、用户自定义配置和锁定状态
  const [report, userWithConfig, lock] = await Promise.all([
    prisma.dailyReport.findFirst({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        ConsultationReport: true,
        FrontDeskReport: true,
        OfflineMarketingReport: true,
        OnlineGrowthReport: true,
        MedicalReport: true,
        NursingReport: true,
        FinanceHrAdminReport: true,
        HrReport: true,
        AdminReport: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { customFormConfig: true },
    }),
    session.user.storeId
      ? prisma.storeDayLock.findUnique({
          where: {
            storeId_reportDate: {
              storeId: session.user.storeId,
              reportDate,
            },
          },
        })
      : null,
  ]);

  const isLocked = lock?.isLocked ?? false;
  const customFormConfig = userWithConfig?.customFormConfig || null;

  return NextResponse.json({ report, isLocked, customFormConfig });
}

// POST: 创建或更新日报
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const currentUser = session.user;
  const body = await request.json();
  const { reportDate, status, data, formData, schemaId, note, targetUserId, departmentId: requestDepartmentId } = body;

  // 支持两种格式：data（旧格式）和 formData（新格式）
  const reportData = formData || data;

  if (!reportDate || !reportData) {
    return NextResponse.json({ error: "参数不完整" }, { status: 400 });
  }

  // 确定实际操作的用户
  let user = currentUser;
  let isAdminEdit = false;

  // 如果指定了 targetUserId，检查管理员权限
  if (targetUserId && targetUserId !== currentUser.id) {
    // 检查是否有管理员权限
    if (!hasAnyRole(currentUser.roles, ["STORE_MANAGER", "HQ_ADMIN"])) {
      return NextResponse.json({ error: "无权限编辑他人日报" }, { status: 403 });
    }

    // 获取目标用户信息
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { Department: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "目标用户不存在" }, { status: 404 });
    }

    // 店长只能编辑自己门店的用户
    if (!hasAnyRole(currentUser.roles, ["HQ_ADMIN"]) && targetUser.storeId !== currentUser.storeId) {
      return NextResponse.json({ error: "只能编辑本门店用户" }, { status: 403 });
    }

    // 构建目标用户的会话对象
    user = {
      ...currentUser,
      id: targetUser.id,
      storeId: targetUser.storeId,
      departmentId: targetUser.departmentId,
      departmentCode: (targetUser.Department?.code ?? null) as DepartmentCode | null,
    };
    isAdminEdit = true;
  }

  // 如果请求中指定了 departmentId，使用它（多部门支持）
  let effectiveDepartmentId = user.departmentId;
  let effectiveDepartmentCode = user.departmentCode;
  
  if (requestDepartmentId && requestDepartmentId !== user.departmentId) {
    // 获取指定部门的信息
    const dept = await prisma.department.findUnique({
      where: { id: requestDepartmentId }
    });
    if (dept) {
      effectiveDepartmentId = dept.id;
      effectiveDepartmentCode = dept.code as DepartmentCode;
    }
  }

  // 补救措施：如果 session 中没有 departmentCode，但有 departmentId，尝试从数据库获取
  if (effectiveDepartmentId && !effectiveDepartmentCode) {
    const dept = await prisma.department.findUnique({
      where: { id: effectiveDepartmentId }
    });
    if (dept) {
      effectiveDepartmentCode = dept.code as DepartmentCode;
    }
  }

  // 补救措施：如果用户没有 storeId（例如总部用户），尝试查找"总部"门店
  let effectiveStoreId = user.storeId;
  if (!effectiveStoreId) {
    // 尝试查找现有的“总部（无门店）”记录，避免将总部当作门店创建
    const hqStore = await prisma.store.findFirst({
      where: {
        OR: [
          { code: "HQ" },
          { name: "总部（无门店）" },
          { name: "总部" },
          { name: "Headquarters" }
        ]
      },
      orderBy: { updatedAt: "desc" }
    });
    effectiveStoreId = hqStore?.id ?? null;
  }

  if (!effectiveDepartmentId || !effectiveDepartmentCode) {
    const missing = [];
    if (!effectiveDepartmentId) missing.push("部门ID(departmentId)");
    if (!effectiveDepartmentCode) missing.push("部门代码(departmentCode)");
    
    return NextResponse.json({ 
      error: `用户信息不完整: 缺少 ${missing.join(", ")}` 
    }, { status: 400 });
  }

  // 检查权限（管理员可以跳过锁定检查）
  if (!isAdminEdit) {
    const permCheck = await canEditReport(currentUser, user.id, effectiveStoreId ?? null, reportDate);
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.reason }, { status: 403 });
    }
  }

  try {
    // 使用事务保存
    const result = await prisma.$transaction(async (tx) => {
      // 将 formData 转为 JSON 字符串存储
      const formDataJson = formData ? JSON.stringify(formData) : null;

      // 查找该用户当天该部门的最新一份日报
      const latestReport = await tx.dailyReport.findFirst({
        where: { userId: user.id, reportDate, departmentId: effectiveDepartmentId! },
        orderBy: { createdAt: "desc" },
      });

      let report;

      // 逻辑：
      // 1. 如果没有日报，创建新的 (DRAFT 或 SUBMITTED)
      // 2. 如果最新的一份是 SUBMITTED，且用户再次提交，则创建第二份 (算作今日新报表)
      // 3. 如果最新的一份是 DRAFT，则更新它
      if (!latestReport || (latestReport.status === "SUBMITTED" && status === "SUBMITTED")) {
        // 创建新记录
        report = await tx.dailyReport.create({
          data: {
            userId: user.id,
            storeId: effectiveStoreId ?? null,
            departmentId: effectiveDepartmentId!,
            reportDate,
            status: status || "DRAFT",
            submittedAt: status === "SUBMITTED" ? new Date() : null,
            note: note || undefined,
            schemaId: schemaId || undefined,
            formData: formDataJson,
          },
        });
      } else {
        // 更新现有草稿（或覆盖已提交的 - 如果是管理员编辑等情况）
        report = await tx.dailyReport.update({
          where: { id: latestReport.id },
          data: {
            status: status || "DRAFT",
            submittedAt: status === "SUBMITTED" ? new Date() : (latestReport.submittedAt),
            note,
            schemaId: schemaId || null,
            formData: formDataJson,
            updatedAt: new Date(),
          },
        });
      }

      // 同步更新固定表
      const dataToSync = (() => {
        const raw = formData || data;
        if (!raw) return null;
        const flat = flattenContainerizedFormData(raw);
        return (flat || raw) as Record<string, unknown>;
      })();
      if (dataToSync) {
        await upsertDepartmentReport(tx, effectiveDepartmentCode as DepartmentCode, report.id, dataToSync);
      }

      return report;
    });

    return NextResponse.json({ success: true, report: result });
  } catch (error) {
    console.error("保存日报失败:", error);
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}

// 辅助函数：获取数值（支持多个可能的字段名）
function getNum(data: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const val = data[key];
    if (val !== undefined && val !== null && val !== "") {
      return Number(val) || 0;
    }
  }
  return 0;
}

// 辅助函数：获取金额（元转分，支持多个可能的字段名）
function getMoneyInCents(data: Record<string, unknown>, ...keys: string[]): number {
  for (const key of keys) {
    const val = data[key];
    if (val !== undefined && val !== null && val !== "") {
      const numVal = Number(val) || 0;
      // 如果字段名包含 Cents 说明已经是分，否则需要乘100
      if (key.toLowerCase().includes("cents")) {
        return numVal;
      }
      return Math.round(numVal * 100); // 元转分
    }
  }
  return 0;
}

// 根据部门更新对应的明细表
// 注意：Schema 字段名与固定表字段名可能不同，需要映射
async function upsertDepartmentReport(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  departmentCode: DepartmentCode,
  dailyReportId: string,
  data: Record<string, unknown>
) {
  switch (departmentCode) {
    case "CONSULTATION":
      // 咨询部字段映射：
      // Schema: receptionTotal, firstVisitCount, returnVisitCount, dealCount, noDealCount, cashInYuan
      // 固定表: receptionTotal, initialTotal, dealsTotal, initialDealsTotal, cashInCents
      await tx.consultationReport.upsert({
        where: { dailyReportId },
        update: {
          receptionTotal: getNum(data, "receptionTotal"),
          initialTotal: getNum(data, "initialTotal", "firstVisitCount", "firstVisit"),
          dealsTotal: getNum(data, "dealsTotal", "dealCount"),
          initialDealsTotal: getNum(data, "initialDealsTotal", "initialDealCount"),
          cashInCents: getMoneyInCents(data, "cashInCents", "cashInYuan", "cashAmount"),
          implantLeads: getNum(data, "implantLeads", "implant_visit", "implantIntention"),
          orthoLeads: getNum(data, "orthoLeads", "ortho_visit", "orthoIntention"),
          followupAppointments: getNum(data, "followupAppointments", "nextAppointment", "followupAppt"),
          followupCallsDone: getNum(data, "followupCallsDone", "followupDone"),
        },
        create: {
          dailyReportId,
          receptionTotal: getNum(data, "receptionTotal"),
          initialTotal: getNum(data, "initialTotal", "firstVisitCount", "firstVisit"),
          dealsTotal: getNum(data, "dealsTotal", "dealCount"),
          initialDealsTotal: getNum(data, "initialDealsTotal", "initialDealCount"),
          cashInCents: getMoneyInCents(data, "cashInCents", "cashInYuan", "cashAmount"),
          implantLeads: getNum(data, "implantLeads", "implant_visit", "implantIntention"),
          orthoLeads: getNum(data, "orthoLeads", "ortho_visit", "orthoIntention"),
          followupAppointments: getNum(data, "followupAppointments", "nextAppointment", "followupAppt"),
          followupCallsDone: getNum(data, "followupCallsDone", "followupDone"),
          updatedAt: new Date(),
        },
      });
      break;

    case "FRONT_DESK":
      // 前台字段映射：
      // Schema: actualRevenue, expectedRevenue, totalVisitors, firstVisitCount, returnVisitCount, new_patients_count
      // 固定表: newVisits, returningVisits, initialTriage, revisitTriage, new_patients_count
      await tx.frontDeskReport.upsert({
        where: { dailyReportId },
        update: {
          new_patients_count: getNum(data, "new_patients_count", "new_patients_created"),
          newVisits: getNum(data, "newVisits", "firstVisitCount"),
          returningVisits: getNum(data, "returningVisits", "returnVisitCount"),
          newAppointments: getNum(data, "newAppointments"),
          rescheduledAppointments: getNum(data, "rescheduledAppointments"),
          canceledAppointments: getNum(data, "canceledAppointments"),
          noShowAppointments: getNum(data, "noShowAppointments", "noShowTotal"),
          initialTriage: getNum(data, "initialTriage", "firstVisitCount"),
          revisitTriage: getNum(data, "revisitTriage", "returnVisitCount"),
          paymentsCount: getNum(data, "paymentsCount"),
          refundsCount: getNum(data, "refundsCount"),
          complaintsCount: getNum(data, "complaintsCount"),
          resolvedCount: getNum(data, "resolvedCount"),
        },
        create: {
          dailyReportId,
          new_patients_count: getNum(data, "new_patients_count", "new_patients_created"),
          newVisits: getNum(data, "newVisits", "firstVisitCount"),
          returningVisits: getNum(data, "returningVisits", "returnVisitCount"),
          newAppointments: getNum(data, "newAppointments"),
          rescheduledAppointments: getNum(data, "rescheduledAppointments"),
          canceledAppointments: getNum(data, "canceledAppointments"),
          noShowAppointments: getNum(data, "noShowAppointments", "noShowTotal"),
          initialTriage: getNum(data, "initialTriage", "firstVisitCount"),
          revisitTriage: getNum(data, "revisitTriage", "returnVisitCount"),
          paymentsCount: getNum(data, "paymentsCount"),
          refundsCount: getNum(data, "refundsCount"),
          complaintsCount: getNum(data, "complaintsCount"),
          resolvedCount: getNum(data, "resolvedCount"),
          updatedAt: new Date(),
        },
      });
      break;

    case "OFFLINE_MARKETING":
      // 线下市场字段映射
      await tx.offlineMarketingReport.upsert({
        where: { dailyReportId },
        update: {
          touchpoints: getNum(data, "touchpoints"),
          leadsNew: getNum(data, "leadsNew", "newLeads"),
          leadsValid: getNum(data, "leadsValid", "validLeads", "validInfoCollected"),
          appointmentsBooked: getNum(data, "appointmentsBooked", "appointmentsMade"),
          visitsArrived: getNum(data, "visitsArrived", "arrivedCount"),
          costInCents: getMoneyInCents(data, "costInCents", "marketingCost"),
          partnershipsNew: getNum(data, "partnershipsNew", "partnerVisits"),
          partnershipsMaintained: getNum(data, "partnershipsMaintained"),
        },
        create: {
          dailyReportId,
          touchpoints: getNum(data, "touchpoints"),
          leadsNew: getNum(data, "leadsNew", "newLeads"),
          leadsValid: getNum(data, "leadsValid", "validLeads", "validInfoCollected"),
          appointmentsBooked: getNum(data, "appointmentsBooked", "appointmentsMade"),
          visitsArrived: getNum(data, "visitsArrived", "arrivedCount"),
          costInCents: getMoneyInCents(data, "costInCents", "marketingCost"),
          partnershipsNew: getNum(data, "partnershipsNew", "partnerVisits"),
          partnershipsMaintained: getNum(data, "partnershipsMaintained"),
          updatedAt: new Date(),
        },
      });
      break;

    case "ONLINE_GROWTH":
      // 网络部字段映射
      await tx.onlineGrowthReport.upsert({
        where: { dailyReportId },
        update: {
          leads_today: getNum(data, "leads_today"),
          leads_month: getNum(data, "leads_month"),
          visits_today: getNum(data, "visits_today"),
          deals_today: getNum(data, "deals_today"),
          visits_month: getNum(data, "visits_month"),
          deals_month: getNum(data, "deals_month"),
          revenue_today: getMoneyInCents(data, "revenue_today"),
          followup_today: getNum(data, "followup_today"),
          intentional_tomorrow: getNum(data, "intentional_tomorrow"),
        },
        create: {
          dailyReportId,
          leads_today: getNum(data, "leads_today"),
          leads_month: getNum(data, "leads_month"),
          visits_today: getNum(data, "visits_today"),
          deals_today: getNum(data, "deals_today"),
          visits_month: getNum(data, "visits_month"),
          deals_month: getNum(data, "deals_month"),
          revenue_today: getMoneyInCents(data, "revenue_today"),
          followup_today: getNum(data, "followup_today"),
          intentional_tomorrow: getNum(data, "intentional_tomorrow"),
          updatedAt: new Date(),
        },
      });
      break;

    case "MEDICAL":
      // 医疗部字段映射
      await tx.medicalReport.upsert({
        where: { dailyReportId },
        update: {
          patientsSeen: getNum(data, "patientsSeen", "patientsTotal"),
          rootCanals: getNum(data, "rootCanals"),
          fillings: getNum(data, "fillings"),
          extractions: getNum(data, "extractions"),
          fixedProsthesisDelivered: getNum(data, "fixedProsthesisDelivered"),
          removableProsthesisDeliv: getNum(data, "removableProsthesisDeliv"),
          implantSurgeries: getNum(data, "implantSurgeries", "implantCases"),
          orthoStarts: getNum(data, "orthoStarts"),
          orthoFollowups: getNum(data, "orthoFollowups", "orthoCases"),
          riskEvents: getNum(data, "riskEvents"),
        },
        create: {
          dailyReportId,
          patientsSeen: getNum(data, "patientsSeen", "patientsTotal"),
          rootCanals: getNum(data, "rootCanals"),
          fillings: getNum(data, "fillings"),
          extractions: getNum(data, "extractions"),
          fixedProsthesisDelivered: getNum(data, "fixedProsthesisDelivered"),
          removableProsthesisDeliv: getNum(data, "removableProsthesisDeliv"),
          implantSurgeries: getNum(data, "implantSurgeries", "implantCases"),
          orthoStarts: getNum(data, "orthoStarts"),
          orthoFollowups: getNum(data, "orthoFollowups", "orthoCases"),
          riskEvents: getNum(data, "riskEvents"),
          updatedAt: new Date(),
        },
      });
      break;

    case "NURSING":
      // 护理部字段映射
      await tx.nursingReport.upsert({
        where: { dailyReportId },
        update: {
          workType: String(data.workType) || "CHAIR_ASSIST",
          panoramicXrays: getNum(data, "panoramicXrays"),
          cbctScans: getNum(data, "cbctScans"),
          intraoralScansPhotos: getNum(data, "intraoralScansPhotos"),
          sterilizerCycles: getNum(data, "sterilizerCycles"),
          instrumentPacks: getNum(data, "instrumentPacks"),
          consumableIncidents: getNum(data, "consumableIncidents"),
          doctorsAssisted: getNum(data, "doctorsAssisted"),
          overtimeMinutes: getNum(data, "overtimeMinutes"),
          hygieneVisits: getNum(data, "hygieneVisits"),
          perioTherapies: getNum(data, "perioTherapies"),
          referralsToDoctor: getNum(data, "referralsToDoctor"),
        },
        create: {
          dailyReportId,
          workType: String(data.workType) || "CHAIR_ASSIST",
          panoramicXrays: getNum(data, "panoramicXrays"),
          cbctScans: getNum(data, "cbctScans"),
          intraoralScansPhotos: getNum(data, "intraoralScansPhotos"),
          sterilizerCycles: getNum(data, "sterilizerCycles"),
          instrumentPacks: getNum(data, "instrumentPacks"),
          consumableIncidents: getNum(data, "consumableIncidents"),
          doctorsAssisted: getNum(data, "doctorsAssisted"),
          overtimeMinutes: getNum(data, "overtimeMinutes"),
          hygieneVisits: getNum(data, "hygieneVisits"),
          perioTherapies: getNum(data, "perioTherapies"),
          referralsToDoctor: getNum(data, "referralsToDoctor"),
          updatedAt: new Date(),
        },
      });
      break;

    case "FINANCE_HR_ADMIN":
      // 财务人事行政字段映射
      await tx.financeHrAdminReport.upsert({
        where: { dailyReportId },
        update: {
          cashInCents: getMoneyInCents(data, "cashInCents", "cashInYuan"),
          refundsInCents: getMoneyInCents(data, "refundsInCents", "refundInYuan", "refundAmount"),
          cashPayInCents: getMoneyInCents(data, "cashPayInCents", "cashPayInYuan"),
          cardPayInCents: getMoneyInCents(data, "cardPayInCents", "cardInYuan"),
          onlinePayInCents: getMoneyInCents(data, "onlinePayInCents", "onlineInYuan"),
          expenseTotalInCents: getMoneyInCents(data, "expenseTotalInCents", "expenseTotal"),
          expenseMaterialInCents: getMoneyInCents(data, "expenseMaterialInCents"),
          expenseProcessingInCents: getMoneyInCents(data, "expenseProcessingInCents"),
          expenseMarketingInCents: getMoneyInCents(data, "expenseMarketingInCents"),
          expenseAdminInCents: getMoneyInCents(data, "expenseAdminInCents"),
          reconciliationIssues: getNum(data, "reconciliationIssues"),
          staffScheduled: getNum(data, "staffScheduled"),
          staffPresent: getNum(data, "staffPresent"),
          staffAbsent: getNum(data, "staffAbsent"),
          hiresCount: getNum(data, "hiresCount", "hireCount"),
          resignationsCount: getNum(data, "resignationsCount", "resignCount"),
          trainingSessions: getNum(data, "trainingSessions"),
          traineesCount: getNum(data, "traineesCount", "traineeCount"),
        },
        create: {
          dailyReportId,
          cashInCents: getMoneyInCents(data, "cashInCents", "cashInYuan"),
          refundsInCents: getMoneyInCents(data, "refundsInCents", "refundInYuan", "refundAmount"),
          cashPayInCents: getMoneyInCents(data, "cashPayInCents", "cashPayInYuan"),
          cardPayInCents: getMoneyInCents(data, "cardPayInCents", "cardInYuan"),
          onlinePayInCents: getMoneyInCents(data, "onlinePayInCents", "onlineInYuan"),
          expenseTotalInCents: getMoneyInCents(data, "expenseTotalInCents", "expenseTotal"),
          expenseMaterialInCents: getMoneyInCents(data, "expenseMaterialInCents"),
          expenseProcessingInCents: getMoneyInCents(data, "expenseProcessingInCents"),
          expenseMarketingInCents: getMoneyInCents(data, "expenseMarketingInCents"),
          expenseAdminInCents: getMoneyInCents(data, "expenseAdminInCents"),
          reconciliationIssues: getNum(data, "reconciliationIssues"),
          staffScheduled: getNum(data, "staffScheduled"),
          staffPresent: getNum(data, "staffPresent"),
          staffAbsent: getNum(data, "staffAbsent"),
          hiresCount: getNum(data, "hiresCount", "hireCount"),
          resignationsCount: getNum(data, "resignationsCount", "resignCount"),
          trainingSessions: getNum(data, "trainingSessions"),
          traineesCount: getNum(data, "traineesCount", "traineeCount"),
          updatedAt: new Date(),
        },
      });
      break;
  }
}
