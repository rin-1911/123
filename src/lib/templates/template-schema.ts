import type { DailyReportSchema, FormField } from "@/lib/schemas";

export type TemplateContainerType =
  | "general"           // 通用容器（包含各种字段）
  | "dynamic_list";     // 动态清单（可重复添加行）

export type TemplateFieldType =
  | "number"
  | "money"
  | "text"
  | "textarea"
  | "dynamic_select"
  | "calculated"
  | "select"
  | "divider"
  | "dynamic_rows";

export interface TemplateFieldV2 {
  id: string; // 稳定 ID（用于数据映射，改名不改 id）
  label: string;
  type: TemplateFieldType;
  required?: boolean;
  hint?: string;
  suffix?: string;
  dynamicOptionsKey?: string; // dynamic_select 下拉关联（字典 key）
  metricKey?: string; // 标准指标关联
  formula?: string; // calculated 公式
  options?: { value: string; label: string }[]; // select 下拉选项
  // 动态清单行字段（配置中心格式）
  rowFields?: {
    id: string;
    label: string;
    type: string;
    dynamicOptionsKey?: string;
    fullWidth?: boolean;
  }[];
  addRowLabel?: string;
}

export interface TemplateContainerV2 {
  id: string; // 稳定 ID
  title: string;
  type: TemplateContainerType;
  // 容器内字段：
  // - auto_summary/normal/long_plan: fields 直接就是输入字段
  // - dynamic_list: fields 表示“列定义”
  fields: TemplateFieldV2[];
  // dynamic_list 专用：新增一行按钮文案
  addRowLabel?: string;
}

export interface DailyReportTemplateV2 {
  version: 2;
  containers: TemplateContainerV2[];
}

export function isTemplateV2(config: unknown): config is DailyReportTemplateV2 {
  if (!config || typeof config !== "object") return false;
  const anyCfg = config as any;
  return anyCfg.version === 2 && Array.isArray(anyCfg.containers);
}

export function buildSchemaFromTemplateV2(template: DailyReportTemplateV2, schemaId = "template_v2"): DailyReportSchema {
  // 过滤掉没有字段的空容器
  const validContainers = template.containers.filter((c) => c.fields && c.fields.length > 0);
  
  return {
    id: schemaId,
    title: "动态日报",
    description: "由统一配置中心动态生成",
    sections: validContainers.map((c) => {
      // 统一处理所有类型的容器：字段直接展开；fieldId 统一前缀 `${containerId}.${fieldId}`
      const fields: FormField[] = c.fields.map((f) => {
        // 处理清单字段类型
        if (f.type === "dynamic_rows" && f.rowFields && Array.isArray(f.rowFields) && f.rowFields.length > 0) {
          return {
            id: `${c.id}.${f.id}`,
            label: f.label,
            type: "dynamic_rows" as const,
            hint: f.hint,
            addRowLabel: f.addRowLabel || "+ 新增记录",
            rowFields: f.rowFields.map((rf: any) => ({
              id: rf.id,
              label: rf.label,
                type: rf.type === "dynamic_select" ? "dynamic_select" : rf.type,
                dynamicOptionsKey: rf.dynamicOptionsKey,
                metricKey: rf.metricKey,
                fullWidth: rf.fullWidth,
              })),
          };
        }
        
        // 处理普通字段类型
        return {
          id: `${c.id}.${f.id}`,
          label: f.label,
          type: f.type as any,
          required: !!f.required,
          hint: f.hint,
          dynamicOptionsKey: (f as any).dynamicOptionsKey,
          metricKey: (f as any).metricKey,
          formula: (f as any).formula,
          suffix: (f as any).suffix,
        };
      });

      return {
        id: c.id,
        title: c.title,
        fields,
      };
    }),
  };
}

// =========================
// 数据结构：容器化存储
// =========================

export interface ContainerizedFormDataV2 {
  version: 2;
  containers: Record<string, Record<string, unknown>>;
}

// 将“扁平 key（containerId.fieldId）”转为“按容器嵌套存储”
export function nestFlatFormDataToContainers(flat: Record<string, unknown>): ContainerizedFormDataV2 {
  const containers: Record<string, Record<string, unknown>> = {};
  for (const [key, value] of Object.entries(flat)) {
    // dynamic_list 的列表字段是 `${containerId}.items`
    const dot = key.indexOf(".");
    if (dot <= 0) continue;
    const containerId = key.slice(0, dot);
    const fieldId = key.slice(dot + 1);
    if (!containers[containerId]) containers[containerId] = {};
    containers[containerId][fieldId] = value;
  }
  return { version: 2, containers };
}

// 将“容器嵌套存储”还原成“扁平 key（containerId.fieldId）”用于前端渲染
export function flattenContainerizedFormData(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;
  const anyData = data as any;
  if (anyData.version !== 2 || !anyData.containers || typeof anyData.containers !== "object") return null;

  const flat: Record<string, unknown> = {};
  for (const [containerId, obj] of Object.entries(anyData.containers as Record<string, any>)) {
    if (!obj || typeof obj !== "object") continue;
    for (const [fieldId, value] of Object.entries(obj)) {
      flat[`${containerId}.${fieldId}`] = value;
    }
  }
  return flat;
}


