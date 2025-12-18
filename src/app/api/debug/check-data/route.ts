import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * GET: 检查数据库中的日报数据
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  try {
    // 获取所有日报（不过滤门店）
    const allReports = await prisma.dailyReport.findMany({
      where: {
        reportDate: date,
      },
      include: {
        User: {
          select: { id: true, name: true, account: true },
        },
        Store: {
          select: { id: true, name: true, code: true },
        },
        Department: {
          select: { id: true, name: true, code: true },
        },
        ConsultationReport: true,
        FrontDeskReport: true,
        NursingReport: true,
      },
    });

    // 获取所有门店
    const stores = await prisma.store.findMany({
      select: { id: true, name: true, code: true },
    });

    // 获取所有部门
    const departments = await prisma.department.findMany({
      select: { id: true, name: true, code: true },
    });

    // 获取所有用户（简要）
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        account: true,
        storeId: true,
        departmentId: true,
      },
    });

    return NextResponse.json({
      date,
      totalReports: allReports.length,
      reports: allReports.map((r) => ({
        id: r.id,
        userName: r.User?.name || "未知",
        userAccount: r.User?.account,
        storeName: r.Store?.name || "未知",
        storeId: r.storeId,
        departmentName: r.Department?.name || "未知",
        departmentId: r.departmentId,
        status: r.status,
        hasFormData: !!r.formData,
        formDataPreview: r.formData ? JSON.stringify(JSON.parse(r.formData as string)).slice(0, 200) : null,
        hasConsultation: !!r.ConsultationReport,
        hasFrontDesk: !!r.FrontDeskReport,
        hasNursing: !!r.NursingReport,
        consultationData: r.ConsultationReport,
        submittedAt: r.submittedAt,
      })),
      stores,
      departments,
      usersCount: users.length,
      usersSample: users.slice(0, 10).map((u) => ({
        name: u.name,
        account: u.account,
        storeId: u.storeId,
        departmentId: u.departmentId,
      })),
    });
  } catch (error) {
    console.error("检查数据失败:", error);
    return NextResponse.json({ error: "查询失败", details: String(error) }, { status: 500 });
  }
}



