import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { hasAnyRole } from "@/lib/types";

/**
 * 数据验证API - 用于检测数据统计准确性
 * 只有管理员可以访问
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !hasAnyRole(session.user.roles, ["STORE_MANAGER", "HQ_ADMIN"])) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId") || session.user.storeId;
  const dateParam = searchParams.get("date") || formatDate(new Date());

  if (!storeId) {
    return NextResponse.json({ error: "缺少门店参数" }, { status: 400 });
  }

  try {
    // 1. 获取所有日报
    const reports = await prisma.dailyReport.findMany({
      where: {
        storeId,
        reportDate: dateParam,
      },
      include: {
        User: {
          select: {
            id: true,
            name: true,
            departmentId: true,
            Department: { select: { name: true, code: true } },
            roles: true,
            customFormConfig: true,
          },
        },
        ConsultationReport: true,
        FrontDeskReport: true,
        OfflineMarketingReport: true,
        OnlineGrowthReport: true,
        MedicalReport: true,
        NursingReport: true,
        FinanceHrAdminReport: true,
      },
    });

    // 2. 分析每份日报
    const reportAnalysis = reports.map((report) => {
      const formData = report.formData ? JSON.parse(report.formData as string) : {};
      const formDataFields = Object.keys(formData).filter(k => formData[k] !== null && formData[k] !== "" && formData[k] !== 0);
      
      // 识别自定义字段
      const customFields = formDataFields.filter(f => f.startsWith("custom_"));
      const standardFields = formDataFields.filter(f => !f.startsWith("custom_"));
      
      // 检查固定表数据
      const fixedTables: string[] = [];
      if (report.ConsultationReport) fixedTables.push("咨询");
      if (report.FrontDeskReport) fixedTables.push("前台");
      if (report.OfflineMarketingReport) fixedTables.push("市场");
      if (report.OnlineGrowthReport) fixedTables.push("网络");
      if (report.MedicalReport) fixedTables.push("医疗");
      if (report.NursingReport) fixedTables.push("护理");
      if (report.FinanceHrAdminReport) fixedTables.push("财务");

      // 数据一致性检查
      const inconsistencies: string[] = [];
      
      // 检查金额字段一致性
      if (formData.actualRevenue && report.FrontDeskReport) {
        const formValue = Number(formData.actualRevenue);
        const tableValue = report.FrontDeskReport.cashInCents / 100;
        if (Math.abs(formValue - tableValue) > 0.01) {
          inconsistencies.push(`实收金额不一致: formData=${formValue}, 固定表=${tableValue}`);
        }
      }
      
      if (formData.cashInYuan && report.ConsultationReport) {
        const formValue = Number(formData.cashInYuan);
        const tableValue = report.ConsultationReport.cashInCents / 100;
        if (Math.abs(formValue - tableValue) > 0.01) {
          inconsistencies.push(`咨询实收不一致: formData=${formValue}, 固定表=${tableValue}`);
        }
      }

      // 检查人数字段一致性
      if (formData.totalVisitors && report.FrontDeskReport) {
        const formValue = Number(formData.totalVisitors);
        const tableValue = report.FrontDeskReport.newVisits + report.FrontDeskReport.returningVisits;
        if (formValue !== tableValue) {
          inconsistencies.push(`到院人数不一致: formData=${formValue}, 固定表=${tableValue}`);
        }
      }

      return {
        userId: report.userId,
        userName: report.User?.name || "未知",
        department: report.User?.Department?.name || "未知",
        status: report.status,
        formDataFieldCount: formDataFields.length,
        standardFieldCount: standardFields.length,
        customFieldCount: customFields.length,
        customFields: customFields.map(id => ({
          id,
          value: formData[id],
        })),
        fixedTables: fixedTables.join("/") || "无",
        hasFormData: formDataFields.length > 0,
        hasFixedTable: fixedTables.length > 0,
        inconsistencies,
        dataQuality: inconsistencies.length === 0 ? "良好" : "需检查",
      };
    });

    // 3. 汇总统计
    const summary = {
      totalReports: reports.length,
      submittedReports: reports.filter(r => r.status === "SUBMITTED").length,
      draftReports: reports.filter(r => r.status === "DRAFT").length,
      reportsWithFormData: reportAnalysis.filter(r => r.hasFormData).length,
      reportsWithFixedTable: reportAnalysis.filter(r => r.hasFixedTable).length,
      reportsWithCustomFields: reportAnalysis.filter(r => r.customFieldCount > 0).length,
      reportsWithInconsistencies: reportAnalysis.filter(r => r.inconsistencies.length > 0).length,
      totalCustomFields: reportAnalysis.reduce((sum, r) => sum + r.customFieldCount, 0),
      totalStandardFields: reportAnalysis.reduce((sum, r) => sum + r.standardFieldCount, 0),
    };

    // 4. 按部门汇总
    const departmentSummary: Record<string, {
      department: string;
      totalUsers: number;
      submittedCount: number;
      customFieldsUsed: number;
      dataQuality: string;
    }> = {};

    for (const r of reportAnalysis) {
      if (!departmentSummary[r.department]) {
        departmentSummary[r.department] = {
          department: r.department,
          totalUsers: 0,
          submittedCount: 0,
          customFieldsUsed: 0,
          dataQuality: "良好",
        };
      }
      departmentSummary[r.department].totalUsers++;
      if (r.status === "SUBMITTED") {
        departmentSummary[r.department].submittedCount++;
      }
      departmentSummary[r.department].customFieldsUsed += r.customFieldCount;
      if (r.inconsistencies.length > 0) {
        departmentSummary[r.department].dataQuality = "需检查";
      }
    }

    return NextResponse.json({
      success: true,
      date: dateParam,
      summary,
      departmentSummary: Object.values(departmentSummary),
      reports: reportAnalysis,
      message: summary.reportsWithInconsistencies > 0 
        ? `发现 ${summary.reportsWithInconsistencies} 份日报存在数据不一致`
        : "所有数据验证通过",
    });
  } catch (error) {
    console.error("数据验证失败:", error);
    return NextResponse.json({ 
      error: "验证失败", 
      details: error instanceof Error ? error.message : "未知错误" 
    }, { status: 500 });
  }
}



