import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEditReport } from "@/lib/rbac";
import { getToday } from "@/lib/utils";
import type { DepartmentCode } from "@/lib/types";
import { hasAnyRole } from "@/lib/types";

// GET: 获取当前用户某日的日报
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const reportDate = searchParams.get("date") || getToday();

  // 并行获取日报和用户自定义配置
  const [report, userWithConfig, lock] = await Promise.all([
    prisma.dailyReport.findUnique({
      where: {
        userId_reportDate: {
          userId: session.user.id,
          reportDate,
        },
      },
      include: {
        ConsultationReport: true,
        FrontDeskReport: true,
        OfflineMarketingReport: true,
        OnlineGrowthReport: true,
        MedicalReport: true,
        NursingReport: true,
        FinanceHrAdminReport: true,
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
  const { reportDate, status, data, formData, schemaId, note, targetUserId } = body;

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
      departmentCode: targetUser.Department?.code as DepartmentCode | undefined,
    };
    isAdminEdit = true;
  }

  if (!user.storeId || !user.departmentId || !user.departmentCode) {
    return NextResponse.json({ error: "用户信息不完整" }, { status: 400 });
  }

  // 检查权限（管理员可以跳过锁定检查）
  if (!isAdminEdit) {
    const permCheck = await canEditReport(currentUser, user.id, user.storeId, reportDate);
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.reason }, { status: 403 });
    }
  }

  try {
    // 使用事务保存
    const result = await prisma.$transaction(async (tx) => {
      // 将 formData 转为 JSON 字符串存储
      const formDataJson = formData ? JSON.stringify(formData) : null;

      // 创建或更新主表
      const report = await tx.dailyReport.upsert({
        where: {
          userId_reportDate: {
            userId: user.id,
            reportDate,
          },
        },
        update: {
          status: status || "DRAFT",
          submittedAt: status === "SUBMITTED" ? new Date() : null,
          note,
          schemaId: schemaId || null,
          formData: formDataJson,
          updatedAt: new Date(),
        },
        create: {
          userId: user.id,
          storeId: user.storeId!,
          departmentId: user.departmentId!,
          reportDate,
          status: status || "DRAFT",
          submittedAt: status === "SUBMITTED" ? new Date() : null,
          note: note || undefined,
          schemaId: schemaId || undefined,
          formData: formDataJson,
        },
      });

      // 无论是新格式还是旧格式，都同步更新固定表（保证数据一致性）
      // 这样既支持旧的固定表查询，也支持新的 formData 灵活统计
      const dataToSync = formData || data;
      if (dataToSync) {
        await upsertDepartmentReport(tx, user.departmentCode as DepartmentCode, report.id, dataToSync);
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
        },
      });
      break;

    case "FRONT_DESK":
      // 前台字段映射：
      // Schema: actualRevenue, expectedRevenue, totalVisitors, firstVisitCount, returnVisitCount
      // 固定表: newVisits, returningVisits, initialTriage, revisitTriage
      await tx.frontDeskReport.upsert({
        where: { dailyReportId },
        update: {
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
        },
      });
      break;

    case "ONLINE_GROWTH":
      // 网络新媒体字段映射
      await tx.onlineGrowthReport.upsert({
        where: { dailyReportId },
        update: {
          videosPublished: getNum(data, "videosPublished"),
          liveSessions: getNum(data, "liveSessions"),
          postsPublished: getNum(data, "postsPublished"),
          leadsNew: getNum(data, "leadsNew", "newLeads", "wechatAdded"),
          leadsValid: getNum(data, "leadsValid", "validLeads", "validInfoCollected"),
          appointmentsBooked: getNum(data, "appointmentsBooked", "appointmentsMade"),
          visitsArrived: getNum(data, "visitsArrived", "arrivedCount"),
          adSpendInCents: getMoneyInCents(data, "adSpendInCents", "adSpend"),
          followupsDone: getNum(data, "followupsDone"),
          unreachableCount: getNum(data, "unreachableCount"),
        },
        create: {
          dailyReportId,
          videosPublished: getNum(data, "videosPublished"),
          liveSessions: getNum(data, "liveSessions"),
          postsPublished: getNum(data, "postsPublished"),
          leadsNew: getNum(data, "leadsNew", "newLeads", "wechatAdded"),
          leadsValid: getNum(data, "leadsValid", "validLeads", "validInfoCollected"),
          appointmentsBooked: getNum(data, "appointmentsBooked", "appointmentsMade"),
          visitsArrived: getNum(data, "visitsArrived", "arrivedCount"),
          adSpendInCents: getMoneyInCents(data, "adSpendInCents", "adSpend"),
          followupsDone: getNum(data, "followupsDone"),
          unreachableCount: getNum(data, "unreachableCount"),
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
        },
      });
      break;
  }
}

