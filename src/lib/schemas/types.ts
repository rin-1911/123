// 日报表单类型定义

export interface FieldOption {
  value: string;
  label: string;
}

export interface FormField {
  id: string;
  label: string;
  type: "text" | "number" | "money" | "textarea" | "select" | "multiselect" | "boolean" | "calculated" | "dynamic_select" | "dynamic_rows" | "divider";
  required?: boolean;
  hint?: string;
  suffix?: string;
  formula?: string; // 用于 calculated 类型
  options?: FieldOption[]; // 用于 select/multiselect 类型
  dynamicOptionsKey?: string; // 用于 dynamic_select 类型，指定从哪个配置获取选项
  rowFields?: { id: string; label: string; type: "text" | "number" | "money" | "dynamic_select"; fullWidth?: boolean; dynamicOptionsKey?: string }[]; // 用于 dynamic_rows 类型
  addRowLabel?: string; // 用于 dynamic_rows 类型，自定义“新增一行”按钮文案
  reportEnabled?: boolean;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  allowCustomFields?: boolean; // 新增：允许用户在该分组下手动添加字段
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







