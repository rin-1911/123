// 日报表单类型定义

export interface FieldOption {
  value: string;
  label: string;
}

export interface FormField {
  id: string;
  label: string;
  type: "text" | "number" | "money" | "textarea" | "select" | "multiselect" | "boolean" | "calculated" | "dynamic_select";
  required?: boolean;
  hint?: string;
  suffix?: string;
  formula?: string; // 用于 calculated 类型
  options?: FieldOption[]; // 用于 select/multiselect 类型
  dynamicOptionsKey?: string; // 用于 dynamic_select 类型，指定从哪个配置获取选项
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
}

export interface DailyReportSchema {
  id: string;
  title: string;
  description: string;
  sections: FormSection[];
}

// 部门代码到表单的映射
export type DepartmentSchemaMapping = {
  [departmentCode: string]: {
    staff: DailyReportSchema;
    lead?: DailyReportSchema;
    director?: DailyReportSchema;
    manager?: DailyReportSchema;
    // 护理部特有岗位
    assistantLead?: DailyReportSchema;
    hygienist?: DailyReportSchema;
    hygienistLead?: DailyReportSchema;
  };
};







