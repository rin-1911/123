import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";

/**
 * GET: 调试 API - 检查数据汇总状态
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId") || session.user.storeId;
  const date = searchParams.get("date") || formatDate(new Date());

  if (!storeId) {
    return NextResponse.json({ error: "缺少门店参数" }, { status: 400 });
  }

  try {
    // 查询当天所有日报
    const allReports = await prisma.dailyReport.findMany({
      where: {
        storeId,
        reportDate: date,
      },
      select: {
        id: true,
        userId: true,
        status: true,
        formData: true,
        schemaId: true,
        departmentId: true,
        submittedAt: true,
        User: {
          select: { name: true, account: true },
        },
        Department: {
          select: { code: true, name: true },
        },
        ConsultationReport: true,
        FrontDeskReport: true,
        NursingReport: true,
      },
    });

    // 分析每个日报的数据状态
    const reportAnalysis = allReports.map((report) => {
      let formDataParsed = null;
      let formDataFieldCount = 0;
      
      if (report.formData) {
        try {
          formDataParsed = typeof report.formData === "string" 
            ? JSON.parse(report.formData) 
            : report.formData;
          formDataFieldCount = Object.keys(formDataParsed).length;
        } catch {
          formDataParsed = "解析错误";
        }
      }

      // 检查固定表数据
      const hasConsultation = !!report.ConsultationReport;
      const hasFrontDesk = !!report.FrontDeskReport;
      const hasNursing = !!report.NursingReport;

      return {
        userId: report.userId,
        userName: report.User?.name || "未知",
        userAccount: report.User?.account,
        departmentCode: report.Department?.code,
        departmentName: report.Department?.name,
        status: report.status,
        submittedAt: report.submittedAt,
        hasFormData: !!report.formData,
        formDataFieldCount,
        formDataSample: formDataParsed 
          ? Object.entries(formDataParsed).slice(0, 5).map(([k, v]) => ({ field: k, value: v }))
          : null,
        hasConsultation,
        hasFrontDesk,
        hasNursing,
        consultationData: report.ConsultationReport ? {
          receptionTotal: report.ConsultationReport.receptionTotal,
          dealsTotal: report.ConsultationReport.dealsTotal,
          cashInCents: report.ConsultationReport.cashInCents,
        } : null,
      };
    });

    // 统计
    const summary = {
      totalReports: allReports.length,
      submittedReports: allReports.filter((r) => r.status === "SUBMITTED").length,
      draftReports: allReports.filter((r) => r.status === "DRAFT").length,
      reportsWithFormData: allReports.filter((r) => r.formData).length,
      reportsWithConsultation: allReports.filter((r) => r.consultation).length,
    };

    return NextResponse.json({
      success: true,
      date,
      storeId,
      summary,
      reports: reportAnalysis,
    });
  } catch (error) {
    console.error("调试查询失败:", error);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}



