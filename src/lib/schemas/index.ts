// 日报表单 Schema 导出
import { DailyReportSchema, DepartmentSchemaMapping } from "./types";
import { consultationSchemas } from "./consultation";
import { frontDeskSchemas } from "./front-desk";
import { offlineMarketingSchemas } from "./offline-marketing";
import { onlineGrowthSchemas } from "./online-growth";
import { storeManagerSchemas } from "./store-manager";
import { financeSchemas } from "./finance";
import { hrSchemas } from "./hr";
import { nursingSchemas } from "./nursing";

export * from "./types";
export { consultationSchemas } from "./consultation";
export { frontDeskSchemas } from "./front-desk";
export { offlineMarketingSchemas } from "./offline-marketing";
export { onlineGrowthSchemas } from "./online-growth";
export { storeManagerSchemas } from "./store-manager";
export { financeSchemas } from "./finance";
export { hrSchemas } from "./hr";
export { nursingSchemas } from "./nursing";

// 护理岗位类型
export type NursingRole = "assistant" | "assistantLead" | "hygienist" | "hygienistLead" | "headNurse";

// 护理岗位标签
export const NURSING_ROLE_LABELS: Record<NursingRole, string> = {
  assistant: "配台护士",
  assistantLead: "配台护士组长",
  hygienist: "洁牙师",
  hygienistLead: "洁牙师组长",
  headNurse: "护士长",
};

// 部门代码 -> 表单 Schema 映射
export const departmentSchemaMap: DepartmentSchemaMapping = {
  CONSULTATION: consultationSchemas,
  FRONT_DESK: frontDeskSchemas,
  OFFLINE_MARKETING: offlineMarketingSchemas,
  ONLINE_GROWTH: onlineGrowthSchemas,
  MEDICAL: {
    staff: {
      id: "medical_staff",
      title: "医疗部日报",
      description: "医疗部每日必填",
      sections: [
        {
          id: "treatment",
          title: "一、诊疗情况",
          fields: [
            { id: "patientsTotal", label: "接诊患者总数", type: "number", required: true },
            { id: "patientsFirst", label: "初诊患者", type: "number", required: true },
            { id: "patientsReturn", label: "复诊患者", type: "number", required: true },
            { id: "implantCases", label: "种植手术台数", type: "number" },
            { id: "orthoCases", label: "正畸调整人数", type: "number" },
            { id: "restoreCases", label: "修复治疗人数", type: "number" },
            { id: "pediatricCases", label: "儿牙治疗人数", type: "number" },
            { id: "emergencyCases", label: "急诊处理人数", type: "number" },
          ],
        },
        {
          id: "quality",
          title: "二、医疗质量",
          fields: [
            { id: "planOutputCount", label: "治疗方案输出数", type: "number", required: true },
            { id: "consultationCount", label: "会诊次数", type: "number" },
            { id: "complicationCount", label: "并发症/不良反应例数", type: "number" },
            { id: "complicationDetail", label: "并发症详情", type: "textarea" },
          ],
        },
        {
          id: "tomorrow",
          title: "三、明日计划",
          fields: [
            { id: "tomorrowSurgery", label: "明日手术安排", type: "textarea" },
            { id: "tomorrowConsult", label: "明日会诊安排", type: "textarea" },
          ],
        },
      ],
    },
  },
  NURSING: {
    // 默认员工使用配台护士表单
    staff: nursingSchemas.assistant,
    // 配台护士组长
    assistantLead: nursingSchemas.assistantLead,
    // 洁牙师
    hygienist: nursingSchemas.hygienist,
    // 洁牙师组长
    hygienistLead: nursingSchemas.hygienistLead,
    // 护士长（部门负责人）
    lead: nursingSchemas.headNurse,
    // 护士长也作为 director
    director: nursingSchemas.headNurse,
  },
  FINANCE_HR_ADMIN: {
    // 默认员工使用出纳/收银表单
    staff: financeSchemas.cashier,
    // 部门负责人使用财务主管表单
    lead: financeSchemas.manager,
    // 总监使用财务主管表单
    director: financeSchemas.manager,
  },
  // 人事部门（可作为独立部门或复用 FINANCE_HR_ADMIN）
  HR: {
    staff: hrSchemas.staff,
    lead: hrSchemas.lead,
    director: hrSchemas.director,
  },
  MANAGEMENT: {
    staff: storeManagerSchemas.storeManager,
    manager: storeManagerSchemas.storeManager,
  },
};

// 根据部门代码和角色获取对应的表单 Schema
// nursingRole: 护理部专用，指定具体岗位类型
export function getSchemaForRole(
  departmentCode: string,
  roles: string[],
  nursingRole?: NursingRole
): DailyReportSchema | null {
  const schemas = departmentSchemaMap[departmentCode];
  if (!schemas) {
    return null;
  }

  // 护理部特殊处理：根据 nursingRole 返回对应表单
  if (departmentCode === "NURSING") {
    // 护士长（部门负责人）
    if (roles.includes("DEPT_LEAD")) {
      return nursingSchemas.headNurse;
    }
    // 根据 nursingRole 返回对应表单
    if (nursingRole) {
      switch (nursingRole) {
        case "assistant":
          return nursingSchemas.assistant;
        case "assistantLead":
          return nursingSchemas.assistantLead;
        case "hygienist":
          return nursingSchemas.hygienist;
        case "hygienistLead":
          return nursingSchemas.hygienistLead;
        case "headNurse":
          return nursingSchemas.headNurse;
      }
    }
    // 默认返回配台护士表单
    return nursingSchemas.assistant;
  }

  // 财务部门特殊处理：FINANCE 角色使用会计表单
  if (departmentCode === "FINANCE_HR_ADMIN") {
    if (roles.includes("FINANCE")) {
      // 财务负责人或主管使用财务经理表单
      if (roles.includes("DEPT_LEAD") || roles.includes("HQ_ADMIN")) {
        return financeSchemas.manager;
      }
      // 普通财务（会计）使用会计表单
      return financeSchemas.accountant;
    }
    // 其他情况（出纳/收银）使用默认表单
  }

  // 优先级：director > manager > lead > staff
  if (roles.includes("HQ_ADMIN") || roles.includes("REGION_MANAGER")) {
    return schemas.director || schemas.manager || schemas.lead || schemas.staff;
  }
  if (roles.includes("STORE_MANAGER")) {
    return schemas.manager || storeManagerSchemas.storeManager;
  }
  if (roles.includes("DEPT_LEAD")) {
    return schemas.lead || schemas.staff;
  }
  return schemas.staff;
}

// 获取护理部所有可用的表单
export function getNursingSchemas(): { role: NursingRole; schema: DailyReportSchema }[] {
  return [
    { role: "assistant", schema: nursingSchemas.assistant },
    { role: "assistantLead", schema: nursingSchemas.assistantLead },
    { role: "hygienist", schema: nursingSchemas.hygienist },
    { role: "hygienistLead", schema: nursingSchemas.hygienistLead },
    { role: "headNurse", schema: nursingSchemas.headNurse },
  ];
}

// 获取所有可用的表单列表（用于调试/展示）
export function getAllSchemas(): DailyReportSchema[] {
  return [
    // 咨询端
    consultationSchemas.staff,
    consultationSchemas.lead,
    // 前台端
    frontDeskSchemas.staff,
    frontDeskSchemas.lead,
    // 市场端
    offlineMarketingSchemas.staff,
    offlineMarketingSchemas.lead,
    offlineMarketingSchemas.director,
    // 网络端
    onlineGrowthSchemas.staff,
    onlineGrowthSchemas.lead,
    onlineGrowthSchemas.director,
    // 护理部
    nursingSchemas.assistant,
    nursingSchemas.assistantLead,
    nursingSchemas.hygienist,
    nursingSchemas.hygienistLead,
    nursingSchemas.headNurse,
    // 门店管理端
    storeManagerSchemas.storeManager,
    storeManagerSchemas.operations,
    // 财务端
    financeSchemas.cashier,
    financeSchemas.accountant,
    financeSchemas.manager,
    // 人事端
    hrSchemas.staff,
    hrSchemas.lead,
    hrSchemas.director,
  ];
}
