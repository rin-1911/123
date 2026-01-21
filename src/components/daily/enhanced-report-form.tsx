"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import type { UserSession, DepartmentCode } from "@/lib/types";
import { DEPARTMENT_LABELS, hasAnyRole } from "@/lib/types";
import { getToday, formatDate, cn } from "@/lib/utils";
import { getSchemaForRole, DailyReportSchema, FormField, FormSection, NursingRole, MarketingSubDept, NURSING_ROLE_LABELS, MARKETING_SUB_DEPT_LABELS } from "@/lib/schemas";
import { buildSchemaFromTemplateV2, flattenContainerizedFormData, isTemplateV2, nestFlatFormDataToContainers } from "@/lib/templates/template-schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Save, 
  Send, 
  Undo2, 
  Lock, 
  HelpCircle, 
  ChevronLeft, 
  ChevronRight, 
  FileText,
  Plus,
  Trash2,
  AlertTriangle,
  Layers,
  ChevronDown,
  ChevronUp
} from "lucide-react";

// 动态选项类型
interface DynamicOption {
  id: string;
  name: string;
  value: string | null;
}

// 自定义表单配置类型
interface CustomFormConfig {
  enabledFields: string[];
  fieldLabels: Record<string, string>;
  customFields: {
    id: string;
    label: string;
    type: "number" | "text" | "textarea";
    sectionId: string;
    required?: boolean;
  }[];
  hiddenSections: string[];
}

interface EnhancedReportFormProps {
  user: UserSession;
  // 以下为可选的管理员编辑模式参数
  schema?: DailyReportSchema;
  initialData?: Record<string, unknown> | null;
  reportDate?: string;
  isLocked?: boolean;
  isReadOnly?: boolean; // 新增：只读模式
  status?: string;
  customFormConfig?: string | null;
  isAdminEdit?: boolean;
  targetUserId?: string;
}

export function EnhancedReportForm({ 
  user, 
  schema: propSchema,
  initialData: propInitialData,
  reportDate: propReportDate,
  isLocked: propIsLocked,
  isReadOnly = false, // 默认不为只读
  status: propStatus,
  customFormConfig: propCustomFormConfig,
  isAdminEdit = false,
  targetUserId,
}: EnhancedReportFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [reportDate, setReportDate] = useState(getToday());
  const [isLoading, setIsLoading] = useState(true); // 初始为 true，避免闪烁
  const [isSaving, setIsSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [status, setStatus] = useState<"DRAFT" | "SUBMITTED" | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [note, setNote] = useState("");
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, DynamicOption[]>>({});
  const [templateSchema, setTemplateSchema] = useState<DailyReportSchema | null>(null); // V2：容器化模板直接生成 schema
  const [version, setVersion] = useState(0); // 用于强制刷新数据

  const departmentCode = user.departmentCode as DepartmentCode;
  // 护理岗位直接从用户信息获取（可能是逗号分隔的多个值）
  const nursingRoleRaw = user.nursingRole || "";
  const nursingRoles = nursingRoleRaw.split(",").filter(Boolean) as NursingRole[];
  // 线下市场子部门（可能是逗号分隔的多个值）
  const marketingSubDeptRaw = user.marketingSubDept || "";
  const marketingSubDepts = marketingSubDeptRaw.split(",").filter(Boolean) as MarketingSubDept[];

  // 当用户有多个子部门时，需要选择要填写的
  const [selectedNursingRole, setSelectedNursingRole] = useState<NursingRole | null>(
    nursingRoles.length > 0 ? nursingRoles[0] : null
  );
  const [selectedMarketingSubDept, setSelectedMarketingSubDept] = useState<MarketingSubDept | null>(
    marketingSubDepts.length > 0 ? marketingSubDepts[0] : null
  );

  // 获取对应的表单 Schema
  const baseSchema = useMemo(() => {
    // V2 模板优先：完全由配置中心驱动
    if (templateSchema) return templateSchema;
    // 护理部根据用户的 nursingRole 获取对应表单
    if (departmentCode === "NURSING" && selectedNursingRole) {
      return getSchemaForRole(departmentCode, user.roles || [], selectedNursingRole);
    }
    // 线下市场根据 marketingSubDept 获取对应表单
    if (departmentCode === "OFFLINE_MARKETING") {
      return getSchemaForRole(departmentCode, user.roles || [], undefined, selectedMarketingSubDept || undefined);
    }
    return getSchemaForRole(departmentCode, user.roles || []);
  }, [templateSchema, departmentCode, user.roles, selectedNursingRole, selectedMarketingSubDept]);

  // 应用自定义配置后的 Schema
  // 优先级：V2 模板 schema > 默认 schema
  // 已移除用户个人配置（customFormConfig），确保只能由配置中心统一管理
  const schema = useMemo((): DailyReportSchema | null => {
    if (!baseSchema) return null;
    
    // V2 模板 schema 或 默认 schema 直接返回
    return baseSchema;
  }, [baseSchema]);

  // 获取所有需要的动态选项类别（包括 dynamic_rows 中的 rowFields）
  const dynamicOptionsKeys = useMemo(() => {
    if (!schema) return [];
    const keys: string[] = [];
    schema.sections.forEach((section) => {
      section.fields.forEach((field) => {
        // 普通 dynamic_select 字段
        if (field.type === "dynamic_select" && field.dynamicOptionsKey) {
          if (!keys.includes(field.dynamicOptionsKey)) {
            keys.push(field.dynamicOptionsKey);
          }
        }
        // dynamic_rows 中的 rowFields 也可能有 dynamic_select
        if (field.type === "dynamic_rows" && field.rowFields) {
          field.rowFields.forEach((rf) => {
            if (rf.type === "dynamic_select" && rf.dynamicOptionsKey) {
              if (!keys.includes(rf.dynamicOptionsKey)) {
                keys.push(rf.dynamicOptionsKey);
              }
            }
          });
        }
      });
    });
    return keys;
  }, [schema]);

  // 加载动态选项
  const loadDynamicOptions = useCallback(async () => {
    if (dynamicOptionsKeys.length === 0) return;

    const optionsMap: Record<string, DynamicOption[]> = {};
    
    for (const key of dynamicOptionsKeys) {
      try {
        const res = await fetch(`/api/dictionary?category=${key}`);
        const data = await res.json();
        optionsMap[key] = data.items || [];
      } catch {
        optionsMap[key] = [];
      }
    }
    
    setDynamicOptions(optionsMap);
  }, [dynamicOptionsKeys]);

  // 加载动态选项
  useEffect(() => {
    loadDynamicOptions();
  }, [loadDynamicOptions]);

  // 加载模板配置（角色+部门模板，优先于用户个人配置）
  const loadTemplateConfig = useCallback(async () => {
    if (!user.departmentId) return;

    try {
      // 确定角色：部门负责人 or 员工
      const role = (user.roles || []).includes("DEPT_LEAD") ? "DEPT_LEAD" : "STAFF";
      
      // 确定子部门
      let subDept = "";
      if (departmentCode === "NURSING" && selectedNursingRole) {
        subDept = selectedNursingRole;
      } else if (departmentCode === "OFFLINE_MARKETING" && selectedMarketingSubDept) {
        subDept = selectedMarketingSubDept;
      }

      const params = new URLSearchParams({
        departmentId: user.departmentId,
        role,
      });
      if (subDept) {
        params.append("subDept", subDept);
      }

      const res = await fetch(`/api/daily-templates?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.template) {
          const rawConfig = typeof data.template.configJson === "string"
            ? JSON.parse(data.template.configJson)
            : data.template.configJson;

          // V2：容器化模板
          if (isTemplateV2(rawConfig)) {
            setTemplateSchema(buildSchemaFromTemplateV2(
              rawConfig,
              `tpl_v2_${role}_${user.departmentId}_${subDept || "default"}`
            ));
            return;
          }
        }
      }
      setTemplateSchema(null);
    } catch (error) {
      console.error("加载模板配置失败", error);
      setTemplateSchema(null);
    }
  }, [user.departmentId, user.roles, departmentCode, selectedNursingRole, selectedMarketingSubDept]);

  // 加载日报数据
  const loadReport = useCallback(async () => {
    setIsLoading(true);
    try {
      // 先加载模板配置
      await loadTemplateConfig();

      // 增加 v 参数防止浏览器缓存，并明确传递 targetUserId 和 departmentId
      const deptParam = user.departmentId ? `&departmentId=${user.departmentId}` : '';
      const res = await fetch(`/api/daily?date=${reportDate}${targetUserId ? `&targetUserId=${targetUserId}` : ''}${deptParam}&v=${version}`);
      const data = await res.json();

      setIsLocked(data.isLocked || false);

      if (data.report) {
        setStatus(data.report.status);
        setNote(data.report.note || "");
        
        // 加载已保存的表单数据
        if (data.report.formData) {
          try {
            const savedData = typeof data.report.formData === "string" 
              ? JSON.parse(data.report.formData) 
              : data.report.formData;
            // V2：按容器存储的数据需要先扁平化
            const flat = flattenContainerizedFormData(savedData);
            setFormData(flat || savedData);
          } catch {
            setFormData({});
          }
        } else {
          setFormData({});
        }
      } else {
        setStatus(null);
        setFormData({});
        setNote("");
      }
    } catch {
      toast({
        title: "加载失败",
        description: "无法加载日报数据",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [reportDate, targetUserId, version, toast, user.departmentId, loadTemplateConfig]);

  // 加载日报数据
  useEffect(() => {
    loadReport();
  }, [loadReport]);

  // 数据验证警告
  const [validationWarnings, setValidationWarnings] = useState<Record<string, string>>({});

  // 更新字段值并进行实时验证
  const updateField = (fieldId: string, value: unknown) => {
    setFormData((prev) => {
      const newData = { ...prev, [fieldId]: value };
      // 实时验证
      validateFieldData(fieldId, value, newData);
      return newData;
    });
  };

  // 字段验证规则
  const validateFieldData = (fieldId: string, value: unknown, allData: Record<string, unknown>) => {
    const warnings: Record<string, string> = { ...validationWarnings };
    delete warnings[fieldId]; // 先清除该字段的警告

    const numValue = Number(value) || 0;

    // 通用验证：负数检查
    if (numValue < 0) {
      warnings[fieldId] = "数值不能为负数";
    }

    // 金额验证：异常大额检查
    if (fieldId.includes("cash") || fieldId.includes("amount") || fieldId.includes("revenue") || 
        fieldId.includes("Revenue") || fieldId.includes("Amount")) {
      if (numValue > 10000000) { // 超过1000万
        warnings[fieldId] = "金额异常，请确认是否正确";
      }
    }

    // 人数验证：异常大数量检查
    if (fieldId.includes("count") || fieldId.includes("Count") || fieldId.includes("total") || 
        fieldId.includes("Total") || fieldId.includes("visitors") || fieldId.includes("Visitors")) {
      if (numValue > 1000) {
        warnings[fieldId] = "人数异常，请确认是否正确";
      }
    }

    // 逻辑冲突检查
    // 1. 成交人数不能大于接诊人数
    if (fieldId === "dealCount" || fieldId === "receptionTotal") {
      const dealCount = Number(allData["dealCount"]) || 0;
      const receptionTotal = Number(allData["receptionTotal"]) || 0;
      if (dealCount > receptionTotal && receptionTotal > 0) {
        warnings["dealCount"] = "成交人数不能大于接诊人数";
      } else {
        delete warnings["dealCount"];
      }
    }

    // 2. 初诊人数 + 复诊人数 应等于 总到院人数
    if (fieldId === "firstVisitCount" || fieldId === "returnVisitCount" || fieldId === "totalVisitors") {
      const first = Number(allData["firstVisitCount"]) || 0;
      const returnV = Number(allData["returnVisitCount"]) || 0;
      const total = Number(allData["totalVisitors"]) || 0;
      if (total > 0 && first + returnV !== total && first > 0 && returnV > 0) {
        warnings["totalVisitors"] = `初诊(${first})+复诊(${returnV})=${first+returnV}，与总人数(${total})不符`;
      } else {
        delete warnings["totalVisitors"];
      }
    }

    // 3. 有效线索不能大于新增线索
    if (fieldId === "validLeads" || fieldId === "newLeads" || fieldId === "leadsNew" || fieldId === "leadsValid") {
      const newL = Number(allData["newLeads"] || allData["leadsNew"]) || 0;
      const validL = Number(allData["validLeads"] || allData["leadsValid"]) || 0;
      if (validL > newL && newL > 0) {
        warnings["validLeads"] = "有效线索不能大于新增线索";
        warnings["leadsValid"] = "有效线索不能大于新增线索";
      } else {
        delete warnings["validLeads"];
        delete warnings["leadsValid"];
      }
    }

    // 4. 到店人数不能大于预约人数（市场部）
    if (fieldId === "arrivedCount" || fieldId === "appointmentsMade" || fieldId === "appointmentsBooked") {
      const arrived = Number(allData["arrivedCount"] || allData["visitsArrived"]) || 0;
      const booked = Number(allData["appointmentsMade"] || allData["appointmentsBooked"]) || 0;
      if (arrived > booked && booked > 0) {
        warnings["arrivedCount"] = "到店人数超过预约人数，请确认";
      } else {
        delete warnings["arrivedCount"];
      }
    }

    setValidationWarnings(warnings);
  };

  // 提交前完整验证
  const validateBeforeSubmit = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // 检查必填字段
    if (schema) {
      for (const section of schema?.sections || []) {
        for (const field of section.fields) {
          if (field.required) {
            const value = formData[field.id];
            const isEmptyDynamicRows =
              field.type === "dynamic_rows" && (!Array.isArray(value) || value.length === 0);
            if (
              value === undefined ||
              value === null ||
              value === "" ||
              (typeof value === "number" && isNaN(value)) ||
              isEmptyDynamicRows
            ) {
              errors.push(`"${field.label}" 为必填项`);
            }
          }
        }
      }
    }

    // 检查验证警告
    const warningCount = Object.keys(validationWarnings).length;
    if (warningCount > 0) {
      errors.push(`有 ${warningCount} 个数据异常需要确认`);
    }

    return { valid: errors.length === 0, errors };
  };

  // 切换多选项
  const toggleMultiSelect = (fieldId: string, option: string) => {
    setFormData((prev) => {
      const current = (prev[fieldId] as string[]) || [];
      if (current.includes(option)) {
        return { ...prev, [fieldId]: current.filter((o) => o !== option) };
      } else {
        return { ...prev, [fieldId]: [...current, option] };
      }
    });
  };

  // 计算字段值
  const calculateField = (formula: string, sectionId?: string, dataOverride?: Record<string, unknown>): string => {
    const data = dataOverride ?? formData;
    try {
      // 特殊处理：SECTION_SUM (对某个分组下的所有数值/金额字段求和)
      if (formula.startsWith("SECTION_SUM:")) {
        const targetSectionId = formula.split(":")[1];
        const targetSection = schema?.sections.find(s => s.id === targetSectionId);
        if (!targetSection) return "0.0";
        
        let sum = 0;
        // 统计标准字段
        targetSection.fields.forEach(f => {
          if (f.type === "number" || f.type === "money") {
            sum += Number(data[f.id]) || 0;
          }
          // 同时也统计动态行中的数值总和
          if (f.type === "dynamic_rows") {
            const rows = (data[f.id] as any[]) || [];
            rows.forEach(row => {
              Object.values(row).forEach(val => {
                if (typeof val === "number") sum += val;
              });
            });
          }
        });
        return sum.toFixed(2);
      }

      // 特殊处理：ROW_SUM（对 dynamic_rows 的某一列求和）
      // - ROW_SUM_INT:listFieldId,columnId  => 返回整数
      // - ROW_SUM_MONEY:listFieldId,columnId => 返回两位小数
      if (formula.startsWith("ROW_SUM_INT:") || formula.startsWith("ROW_SUM_MONEY:")) {
        const isMoney = formula.startsWith("ROW_SUM_MONEY:");
        const payload = formula.split(":")[1] || "";
        const [listFieldIdRaw, columnIdRaw] = payload.split(",").map(s => s?.trim());
        if (!listFieldIdRaw || !columnIdRaw) return isMoney ? "0.00" : "0";

        const rows = (data[listFieldIdRaw] as any[]) || [];
        let sum = 0;
        for (const row of rows) {
          const v = row?.[columnIdRaw];
          sum += Number(v) || 0;
        }
        return isMoney ? sum.toFixed(2) : String(Math.round(sum));
      }

      // 特殊处理：PERCENT (计算百分比，公式格式: PERCENT:分子字段,分母字段)
      if (formula.startsWith("PERCENT:")) {
        const parts = formula.split(":")[1].split(",");
        if (parts.length !== 2) return "-";
        const numerator = Number(data[parts[0].trim()]) || 0;
        const denominator = Number(data[parts[1].trim()]) || 0;
        if (denominator === 0) return "0.00";
        const percent = (numerator / denominator) * 100;
        return percent.toFixed(2);
      }

      // 常规公式处理
      let expr = formula;
      // 替换 SECTION_SUM 宏
      const sectionSumMatches = formula.match(/SECTION_SUM:[a-zA-Z0-9_]+/g) || [];
      for (const match of sectionSumMatches) {
        const val = calculateField(match, undefined, data);
        expr = expr.replace(match, val === "-" ? "0" : val);
      }

      const matches = expr.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
      for (const varName of matches) {
        // 避免替换 JavaScript 关键字
        if (["Math", "abs", "round", "ceil", "floor"].includes(varName)) continue;
        const value = Number(data[varName]) || 0;
        expr = expr.replace(new RegExp(varName, "g"), String(value));
      }
      // eslint-disable-next-line no-eval
      const result = eval(expr);
      if (Number.isNaN(result) || !Number.isFinite(result)) {
        return "-";
      }
      return result.toFixed(2);
    } catch {
      return "-";
    }
  };

  // 保存日报
  const handleSave = async (submitStatus: "DRAFT" | "SUBMITTED") => {
    // 提交时进行验证
    if (submitStatus === "SUBMITTED") {
      const validation = validateBeforeSubmit();
      if (!validation.valid) {
        toast({
          title: "数据验证未通过",
          description: validation.errors.slice(0, 3).join("；"),
          variant: "destructive",
        });
        // 如果只有警告（非必填错误），询问是否继续
        if (validation.errors.every(e => e.includes("异常"))) {
          if (!confirm("存在数据异常警告，是否仍然提交？")) {
            return;
          }
        } else {
          return;
        }
      }
    }

    setIsSaving(true);
    try {
      // 先把 calculated 字段“物化”写入提交数据，保证报表侧也能取到汇总值
      const materialized = (() => {
        if (!schema) return { ...formData };
        const next = { ...formData } as Record<string, unknown>;
        for (const sec of schema.sections) {
          for (const f of sec.fields) {
            if (f.type === "calculated" && f.formula) {
              const v = calculateField(f.formula, sec.id, next);
              const num = Number(v);
              next[f.id] = Number.isFinite(num) ? num : v;
            }
          }
        }
        return next;
      })();

      const payloadFormData = templateSchema
        ? nestFlatFormDataToContainers(materialized)
        : materialized;

      const submissionSchemaId = (() => {
        if (isAdminEdit) return schema?.id;
        if (departmentCode === "NURSING") return selectedNursingRole || "";
        if (departmentCode === "OFFLINE_MARKETING") return selectedMarketingSubDept || "";
        return "";
      })();

      const res = await fetch("/api/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportDate: isAdminEdit && propReportDate ? propReportDate : reportDate,
          status: submitStatus,
          formData: payloadFormData,
          schemaId: submissionSchemaId || undefined,
          note,
          // 管理员编辑模式：指定目标用户ID
          targetUserId: isAdminEdit ? targetUserId : undefined,
          // 多部门支持：指定当前选中的部门ID
          departmentId: user.departmentId,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "保存失败");
      }

      setStatus(submitStatus);
      toast({
        title: submitStatus === "SUBMITTED" ? "提交成功" : "保存成功",
        description: submitStatus === "SUBMITTED" ? "日报已提交" : "草稿已保存",
      });

      // 强制触发重新拉取
      setVersion(v => v + 1);
      router.refresh();
    } catch (error) {
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 重新提交逻辑：解除只读，准备提交新的一份
  const handleResubmit = () => {
    toast({
      title: "进入重新提交模式",
      description: "您可以修改当前数据，再次点击提交将生成该日的第二份日报。",
    });
    setStatus(null); // 重置状态，使其不再判定为 SUBMITTED
  };

  // 日期切换
  const changeDate = (days: number) => {
    const date = new Date(reportDate);
    date.setDate(date.getDate() + days);
    setReportDate(formatDate(date));
  };

  const isDisabled = isLocked && !hasAnyRole(user.roles, ["STORE_MANAGER", "HQ_ADMIN"]);

  // 渲染字段
  const renderField = (field: FormField, sectionId?: string) => {
    const value = formData[field.id];

    switch (field.type) {
      case "number":
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                value={value as number ?? ""}
                onChange={(e) => updateField(field.id, e.target.value ? Number(e.target.value) : "")}
                placeholder="0"
                className={cn("flex-1", validationWarnings[field.id] && "border-orange-400 bg-orange-50")}
                disabled={isReadOnly}
              />
              {field.suffix && <span className="text-sm text-gray-500">{field.suffix}</span>}
            </div>
            {validationWarnings[field.id] && !isReadOnly && (
              <p className="text-xs text-orange-600 flex items-center gap-1">
                <span className="inline-block w-3 h-3 bg-orange-500 text-white rounded-full text-[10px] flex items-center justify-center">!</span>
                {validationWarnings[field.id]}
              </p>
            )}
          </div>
        );

      case "money":
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">¥</span>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={value as number ?? ""}
                onChange={(e) => updateField(field.id, e.target.value ? Number(e.target.value) : "")}
                placeholder="0.00"
                className={cn("flex-1", validationWarnings[field.id] && "border-orange-400 bg-orange-50")}
                disabled={isReadOnly}
              />
            </div>
            {validationWarnings[field.id] && !isReadOnly && (
              <p className="text-xs text-orange-600 flex items-center gap-1">
                <span className="inline-block w-3 h-3 bg-orange-500 text-white rounded-full text-[10px] flex items-center justify-center">!</span>
                {validationWarnings[field.id]}
              </p>
            )}
          </div>
        );

      case "text":
        return (
          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={(value as string) ?? ""}
              onChange={(e) => updateField(field.id, e.target.value)}
              placeholder={field.hint || ""}
              disabled={isReadOnly}
              className="flex-1"
            />
          </div>
        );

      case "textarea":
        return (
          <div className="flex items-start gap-2">
            <textarea
              className="w-full min-h-[100px] px-3 py-2 border border-input rounded-md text-sm resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 bg-background"
              value={(value as string) ?? ""}
              onChange={(e) => updateField(field.id, e.target.value)}
              placeholder={field.hint || ""}
              disabled={isReadOnly}
            />
          </div>
        );

      case "select":
        return (
          <Select
            value={(value as string) ?? ""}
            onValueChange={(v) => updateField(field.id, v)}
            disabled={isReadOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="请选择" />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "multiselect":
        const selected = (value as string[]) || [];
        const combinedOptions = [...(field.options || [])];
        
        return (
          <div className="flex flex-wrap gap-2 items-center">
            {combinedOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => !isReadOnly && toggleMultiSelect(field.id, opt.value)}
                disabled={isReadOnly}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  selected.includes(opt.value)
                    ? "bg-cyan-500 text-white border-cyan-500"
                    : "bg-white text-gray-700 border-gray-300 hover:border-cyan-500"
                } ${isReadOnly ? "cursor-default opacity-80" : "cursor-pointer"}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        );

      case "divider":
        return (
          <div className="col-span-full pt-6 pb-2 border-b-2 border-cyan-100/50 mb-4 mt-2">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-5 bg-gradient-to-b from-cyan-500 to-blue-600 rounded-full" />
              <h4 className="text-sm font-bold text-slate-800 tracking-tight">
                {field.label}
              </h4>
              {field.hint && <span className="text-[10px] text-slate-400 font-normal ml-2">{field.hint}</span>}
            </div>
          </div>
        );

      case "boolean":
        return (
          <label className={`flex items-center gap-2 ${isReadOnly ? "cursor-default" : "cursor-pointer"}`}>
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => !isReadOnly && updateField(field.id, e.target.checked)}
              disabled={isReadOnly}
              className="w-4 h-4 rounded text-cyan-600"
            />
            <span className="text-sm">{field.hint || "是"}</span>
          </label>
        );

      case "dynamic_select":
        const options = field.dynamicOptionsKey ? dynamicOptions[field.dynamicOptionsKey] || [] : [];
        return (
          <Select
            value={(value as string) ?? ""}
            onValueChange={(v) => updateField(field.id, v)}
            disabled={isReadOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder="请选择" />
            </SelectTrigger>
            <SelectContent>
              {options.length === 0 ? (
                <div className="px-2 py-1 text-sm text-gray-500">暂无选项，请联系管理员添加</div>
              ) : (
                options.map((opt) => (
                  <SelectItem key={opt.id} value={opt.value || opt.name}>
                    {opt.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        );

      case "dynamic_rows":
        const rows = (value as any[]) || [];
        // 如果没有定义子字段，默认提供“名称”和“数值”
        const rowFields = field.rowFields || [
          { id: "name", label: "分类名称", type: "text" },
          { id: "amount", label: "数值/金额", type: "number" }
        ];
        
        const addRow = () => {
          // 数字/金额默认用空字符串，让输入框显示 placeholder（而不是默认显示 0）
          const newRow = rowFields.reduce(
            (acc, f) => ({ ...acc, [f.id]: f.type === "text" ? "" : "" }),
            {}
          );
          updateField(field.id, [...rows, newRow]);
        };

        const removeRow = (index: number) => {
          const newRows = rows.filter((_, i) => i !== index);
          updateField(field.id, newRows);
        };

        const updateRowField = (index: number, rowFieldId: string, val: any) => {
          const newRows = [...rows];
          newRows[index] = { ...newRows[index], [rowFieldId]: val };
          updateField(field.id, newRows);
        };

        return (
          <div className="space-y-3 w-full md:col-span-2 lg:col-span-3">
            {rows.map((row, idx) => (
              <div key={idx} className="flex flex-wrap items-end gap-3 p-3 bg-slate-50/50 rounded-xl border border-slate-100 group relative">
                {rowFields.map((rf) => (
                  <div
                    key={rf.id}
                    className={cn(
                      "space-y-1.5",
                      rf.fullWidth 
                        ? "basis-full min-w-[240px]" 
                        : rf.type === "money" 
                          ? "min-w-[90px] max-w-[120px]"  // 金额字段更窄更紧凑
                          : rf.type === "number"
                            ? "min-w-[80px] max-w-[100px]" // 数字字段也稍窄
                            : rf.type === "dynamic_select"
                              ? "min-w-[140px] max-w-[180px]" // 下拉框适中宽度
                              : "flex-1 min-w-[120px]"       // 文本字段可伸展
                    )}
                  >
                    <Label className="text-[10px] text-gray-400 uppercase truncate">{rf.label}</Label>
                    {rf.type === "dynamic_select" && rf.dynamicOptionsKey ? (
                      // 下拉框（从字典加载选项）
                      <Select
                        value={row[rf.id] ?? ""}
                        onValueChange={(val) => updateRowField(idx, rf.id, val)}
                        disabled={isReadOnly}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="请选择" />
                        </SelectTrigger>
                        <SelectContent>
                          {(dynamicOptions[rf.dynamicOptionsKey] || []).length === 0 ? (
                            <div className="px-2 py-1 text-sm text-gray-500">暂无选项，请在配置中心添加</div>
                          ) : (
                            (dynamicOptions[rf.dynamicOptionsKey] || []).map((opt) => (
                              <SelectItem key={opt.id} value={opt.value || opt.name}>
                                {opt.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    ) : rf.type === "money" ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-400">¥</span>
                        <Input
                          type="number"
                          value={row[rf.id] ?? ""}
                          onChange={(e) => updateRowField(idx, rf.id, e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="0"
                          className="h-9 text-sm"
                          disabled={isReadOnly}
                        />
                      </div>
                    ) : rf.type === "number" ? (
                      <Input
                        type="number"
                        value={row[rf.id] ?? ""}
                        onChange={(e) => updateRowField(idx, rf.id, e.target.value === "" ? "" : Number(e.target.value))}
                        placeholder="0"
                        className="h-9 text-sm"
                        disabled={isReadOnly}
                      />
                    ) : (
                      <Input
                        type="text"
                        value={row[rf.id] ?? ""}
                        onChange={(e) => updateRowField(idx, rf.id, e.target.value)}
                        placeholder="请输入..."
                        className="h-9 text-sm"
                        disabled={isReadOnly}
                      />
                    )}
                  </div>
                ))}
                {!isReadOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-300 hover:text-red-500 transition-colors"
                    onClick={() => removeRow(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {!isReadOnly && (
              <Button
                variant="outline"
                size="sm"
                onClick={addRow}
                className="w-full py-4 border-dashed border-slate-200 text-slate-400 hover:text-cyan-600 hover:border-cyan-500 hover:bg-cyan-50/30 rounded-xl transition-all h-auto"
              >
                {(() => {
                  const addText = field.addRowLabel || "点击添加一行记录";
                  // 如果文案本身已经带“+”，就不重复渲染图标
                  if (addText.trim().startsWith("+")) {
                    return <span>{addText}</span>;
                  }
                  return (
                    <>
                <Plus className="h-4 w-4 mr-2" />
                      {addText}
                    </>
                  );
                })()}
              </Button>
            )}
          </div>
        );

      case "calculated":
        const calcValue = field.formula ? calculateField(field.formula, sectionId) : "-";
        return (
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md border border-gray-100 shadow-sm">
            <span className="font-bold text-cyan-700">{calcValue}</span>
            {field.suffix && <span className="text-sm text-gray-500">{field.suffix}</span>}
            <span className="text-[10px] text-gray-400">（智能计算）</span>
          </div>
        );

      default:
        return null;
    }
  };

  // 渲染分组
  const renderSection = (section: FormSection, index: number) => {
    // 合并标准字段
    const sectionFields = [...section.fields];

    // 网络部特殊处理：不再使用硬编码的排版，统一遵循配置中心逻辑
    const isOnlineGrowth = departmentCode === "ONLINE_GROWTH";

    // 财务特有：支出对账校验 - 已根据需求移除警告逻辑
    // const isFinance = departmentCode === "FINANCE_HR_ADMIN";
    // const moduleASum = isFinance ? Number(calculateField("SECTION_SUM:module_a")) : 0;
    // const moduleBSum = isFinance ? Number(calculateField("SECTION_SUM:module_b")) : 0;
    // const isMismatch = isFinance && section.id === "module_d" && Math.abs(moduleASum - moduleBSum) > 0.01;

    return (
      <div key={section.id} className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* V2 模板：标题左侧蓝色竖线 */}
            {templateSchema && (
              <div className="w-1 h-5 bg-cyan-500 rounded-full" />
            )}
            <h3 className="text-base font-semibold text-gray-800">{section.title}</h3>
            {section.description && (
              <span className="text-sm text-gray-500">({section.description})</span>
            )}
          </div>
        </div>

        {/* 财务对账警告 - 已移除 */}
        {/* {isMismatch && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-pulse">
            <AlertTriangle className="h-4 w-4" />
            <span>警告：支出明细总计(¥{moduleASum.toFixed(2)})与支付方式总计(¥{moduleBSum.toFixed(2)})不一致，请仔细核对！</span>
          </div>
        )} */}
        
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
          {sectionFields.map((field, fieldIdx) => {
            // 如果是 divider 分割线字段，不显示外层 Label
            const isDivider = field.type === "divider";
            
            // 隐藏"自动计算"字段，不让其显示在填写界面，只在管理员报表中汇总
            if (field.type === "calculated") {
              return null;
            }

            return (
              <div
                key={field.id}
                className={cn(
                  "space-y-1.5",
                  (field.type === "textarea" || field.type === "multiselect" || field.type === "dynamic_rows" || isDivider) ? "md:col-span-2 lg:col-span-3" : ""
                )}
              >
                    {!isDivider && (
                      <Label className="flex items-center gap-1.5">
                        {field.label}
                        {field.required && <span className="text-red-500">*</span>}
                        {field.hint && field.type !== "textarea" && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              <p>{field.hint}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </Label>
                    )}
                    {renderField(field, section.id)}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (!schema) {
    return (
      <div className="w-full">
        <Card className="w-full">
          <CardContent className="py-12 text-center text-gray-500 min-h-[450px] flex flex-col items-center justify-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>当前岗位暂无日报表单</p>
          <p className="text-sm mt-2">请联系管理员配置</p>
        </CardContent>
      </Card>
      </div>
    );
  }

  // 是否需要显示子部门选择器
  const showNursingRoleSelector = departmentCode === "NURSING" && nursingRoles.length > 1;
  const showMarketingSubDeptSelector = departmentCode === "OFFLINE_MARKETING" && marketingSubDepts.length > 1;

  return (
    <TooltipProvider>
      <div className="w-full">
        {/* 子部门选择器（护理部/线下市场，多选时显示） */}
        {(showNursingRoleSelector || showMarketingSubDeptSelector) && (
          <div className="mb-4 flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-600">选择子部门：</span>
            <div className="flex items-center gap-2 flex-wrap">
              {showNursingRoleSelector && nursingRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => setSelectedNursingRole(role)}
                  className={`px-3 py-1.5 rounded-full border transition-all text-sm ${
                    selectedNursingRole === role
                      ? "border-cyan-500 bg-cyan-500 text-white"
                      : "border-gray-300 hover:border-cyan-400 hover:bg-cyan-50"
                  }`}
                >
                  {NURSING_ROLE_LABELS[role] || role}
                </button>
              ))}
              {showMarketingSubDeptSelector && marketingSubDepts.map((subDept) => (
                <button
                  key={subDept}
                  onClick={() => setSelectedMarketingSubDept(subDept)}
                  className={`px-3 py-1.5 rounded-full border transition-all text-sm ${
                    selectedMarketingSubDept === subDept
                      ? "border-cyan-500 bg-cyan-500 text-white"
                      : "border-gray-300 hover:border-cyan-400 hover:bg-cyan-50"
                  }`}
                >
                  {MARKETING_SUB_DEPT_LABELS[subDept] || subDept}
                </button>
              ))}
            </div>
          </div>
        )}

      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              {status && (
                <Badge variant={status === "SUBMITTED" ? "success" : "warning"}>
                  {status === "SUBMITTED" ? "已提交" : "草稿中"}
                </Badge>
              )}
              {isLocked && (
                <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                  <Lock className="h-3 w-3 mr-1" />
                  已锁定
                </Badge>
              )}
              {!isAdminEdit && <span className="text-sm font-medium text-gray-700">{schema.title}</span>}
            </div>

            {/* 日期选择 */}
            {!isAdminEdit && (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => changeDate(-1)} className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="px-3 py-1 bg-gray-50 rounded-md font-medium text-sm min-w-[100px] text-center">
                  {reportDate}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => changeDate(1)}
                  disabled={reportDate >= getToday()}
                  className="h-8 w-8"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 min-h-[400px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
            </div>
          ) : (
            <div className={cn(
              "transition-all duration-300 min-h-[450px] flex flex-col",
              isDisabled ? "opacity-60 pointer-events-none" : ""
            )}>
              {/* 表单内容 - 锚定容器 */}
              <div className="flex-1 space-y-8">
                {schema.sections.map((section, index) => (
                    <div key={section.id}>
                      {index > 0 && (
                        <div className="my-8">
                          <div className="h-0.5 bg-gradient-to-r from-cyan-300 via-cyan-200 to-transparent rounded-full" />
                        </div>
                      )}
                      {renderSection(section, index)}
                    </div>
                ))}
              </div>

              {/* 操作按钮 - 固定在容器底部（无论内容多少，位置相对稳定） */}
              <div className="mt-auto pt-10 flex items-center justify-between flex-wrap gap-4 border-t border-gray-50">
                <div className="text-sm text-gray-500 italic">
                  {isLocked ? (
                    <span className="text-orange-600 font-medium">数据已锁定，无法修改</span>
                  ) : status === "SUBMITTED" ? (
                    <span>如需修改数据，请点击“再次提交”生成新版本</span>
                  ) : (
                    <span>填写完成后请点击提交</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {status === "SUBMITTED" && !isDisabled && !isReadOnly && (
                    <Button 
                      variant="outline" 
                      onClick={handleResubmit} 
                      disabled={isSaving}
                      className="border-cyan-200 text-cyan-600 hover:bg-cyan-50"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      再次提交
                    </Button>
                  )}

                  {status !== "SUBMITTED" && !isDisabled && !isReadOnly && (
                    <>
                      {/* 警告汇总 */}
                      {Object.keys(validationWarnings).length > 0 && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg text-sm text-orange-700">
                          <span className="inline-flex items-center justify-center w-5 h-5 bg-orange-500 text-white rounded-full text-xs font-bold">
                            {Object.keys(validationWarnings).length}
                          </span>
                          <span>个字段存在数据异常，请检查</span>
                        </div>
                      )}
                      <Button variant="outline" onClick={() => handleSave("DRAFT")} disabled={isSaving}>
                        <Save className="h-4 w-4 mr-2" />
                        保存草稿
                      </Button>
                      <Button
                        onClick={() => handleSave("SUBMITTED")}
                        disabled={isSaving}
                        className="bg-gradient-to-r from-cyan-500 to-blue-600"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        提交
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </TooltipProvider>
  );
}

