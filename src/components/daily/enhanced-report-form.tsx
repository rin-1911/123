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
import { getSchemaForRole, DailyReportSchema, FormField, FormSection, NursingRole } from "@/lib/schemas";
import { Save, Send, Undo2, Lock, HelpCircle, ChevronLeft, ChevronRight, FileText } from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [status, setStatus] = useState<"DRAFT" | "SUBMITTED" | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [note, setNote] = useState("");
  const [activeSection, setActiveSection] = useState(0);
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, DynamicOption[]>>({});
  const [customFormConfig, setCustomFormConfig] = useState<CustomFormConfig | null>(null);

  const departmentCode = user.departmentCode as DepartmentCode;
  // 护理岗位直接从用户信息获取
  const nursingRole = user.nursingRole as NursingRole | null;

  // 获取对应的表单 Schema
  const baseSchema = useMemo(() => {
    // 护理部根据用户的 nursingRole 获取对应表单
    if (departmentCode === "NURSING" && nursingRole) {
      return getSchemaForRole(departmentCode, user.roles || [], nursingRole);
    }
    return getSchemaForRole(departmentCode, user.roles || []);
  }, [departmentCode, user.roles, nursingRole]);

  // 应用自定义配置后的 Schema
  const schema = useMemo((): DailyReportSchema | null => {
    if (!baseSchema) return null;
    if (!customFormConfig) return baseSchema;

    const { enabledFields, fieldLabels, customFields, hiddenSections } = customFormConfig;
    const enabledSet = new Set(enabledFields);
    const hiddenSet = new Set(hiddenSections || []);

    // 过滤和修改字段
    const filteredSections: FormSection[] = baseSchema.sections
      .filter((section) => !hiddenSet.has(section.id))
      .map((section) => {
        // 过滤启用的字段
        const filteredFields = section.fields.filter((field) => enabledSet.has(field.id));
        
        // 应用字段名称覆盖
        const modifiedFields: FormField[] = filteredFields.map((field) => ({
          ...field,
          label: fieldLabels[field.id] || field.label,
        }));

        // 添加该分组下的自定义字段
        const sectionCustomFields = (customFields || [])
          .filter((cf) => cf.sectionId === section.id && enabledSet.has(cf.id))
          .map((cf): FormField => ({
            id: cf.id,
            label: fieldLabels[cf.id] || cf.label,
            type: cf.type as any,
            required: cf.required,
          }));

        return {
          ...section,
          fields: [...modifiedFields, ...sectionCustomFields],
        };
      })
      .filter((section) => section.fields.length > 0); // 移除空分组

    return {
      ...baseSchema,
      sections: filteredSections,
    };
  }, [baseSchema, customFormConfig]);

  // 获取所有需要的动态选项类别
  const dynamicOptionsKeys = useMemo(() => {
    if (!schema) return [];
    const keys: string[] = [];
    schema.sections.forEach((section) => {
      section.fields.forEach((field) => {
        if (field.type === "dynamic_select" && field.dynamicOptionsKey) {
          if (!keys.includes(field.dynamicOptionsKey)) {
            keys.push(field.dynamicOptionsKey);
          }
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

  // 加载日报数据
  useEffect(() => {
    async function loadReport() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/daily?date=${reportDate}`);
        const data = await res.json();

        setIsLocked(data.isLocked);

        // 加载自定义表单配置
        if (data.customFormConfig) {
          try {
            const config = typeof data.customFormConfig === "string"
              ? JSON.parse(data.customFormConfig)
              : data.customFormConfig;
            setCustomFormConfig(config);
          } catch {
            setCustomFormConfig(null);
          }
        } else {
          setCustomFormConfig(null);
        }

        if (data.report) {
          setStatus(data.report.status);
          setNote(data.report.note || "");
          
          // 加载已保存的表单数据
          if (data.report.formData) {
            try {
              const savedData = typeof data.report.formData === "string" 
                ? JSON.parse(data.report.formData) 
                : data.report.formData;
              setFormData(savedData);
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
    }

    loadReport();
  }, [reportDate, toast]);

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
            if (value === undefined || value === null || value === "" || 
                (typeof value === "number" && isNaN(value))) {
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
  const calculateField = (formula: string): string => {
    try {
      // 替换公式中的变量
      let expr = formula;
      const matches = formula.match(/[a-zA-Z_][a-zA-Z0-9_]*/g) || [];
      for (const varName of matches) {
        const value = Number(formData[varName]) || 0;
        expr = expr.replace(new RegExp(varName, "g"), String(value));
      }
      // eslint-disable-next-line no-eval
      const result = eval(expr);
      if (Number.isNaN(result) || !Number.isFinite(result)) {
        return "-";
      }
      return result.toFixed(1);
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
      const res = await fetch("/api/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportDate: isAdminEdit && propReportDate ? propReportDate : reportDate,
          status: submitStatus,
          formData: formData,
          schemaId: schema?.id,
          note,
          // 管理员编辑模式：指定目标用户ID
          targetUserId: isAdminEdit ? targetUserId : undefined,
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

  // 撤回日报
  const handleWithdraw = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportDate,
          status: "DRAFT",
          formData: formData,
          schemaId: schema?.id,
          note,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "撤回失败");
      }

      setStatus("DRAFT");
      toast({
        title: "撤回成功",
        description: "日报已撤回为草稿状态",
      });
    } catch (error) {
      toast({
        title: "撤回失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 日期切换
  const changeDate = (days: number) => {
    const date = new Date(reportDate);
    date.setDate(date.getDate() + days);
    setReportDate(formatDate(date));
  };

  const isDisabled = isLocked && !hasAnyRole(user.roles, ["STORE_MANAGER", "HQ_ADMIN"]);

  // 渲染字段
  const renderField = (field: FormField) => {
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
          <Input
            type="text"
            value={(value as string) ?? ""}
            onChange={(e) => updateField(field.id, e.target.value)}
            placeholder={field.hint || ""}
            disabled={isReadOnly}
          />
        );

      case "textarea":
        return (
          <textarea
            className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
            value={(value as string) ?? ""}
            onChange={(e) => updateField(field.id, e.target.value)}
            placeholder={field.hint || ""}
            disabled={isReadOnly}
          />
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
        return (
          <div className="flex flex-wrap gap-2">
            {field.options?.map((opt) => (
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

      case "calculated":
        const calcValue = field.formula ? calculateField(field.formula) : "-";
        return (
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md">
            <span className="font-medium text-cyan-600">{calcValue}</span>
            {field.suffix && <span className="text-sm text-gray-500">{field.suffix}</span>}
            <span className="text-xs text-gray-400">（自动计算）</span>
          </div>
        );

      default:
        return null;
    }
  };

  // 渲染分组
  const renderSection = (section: FormSection, index: number) => {
    return (
      <div key={section.id} className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-800">{section.title}</h3>
          {section.description && (
            <span className="text-sm text-gray-500">({section.description})</span>
          )}
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {section.fields.map((field) => (
            <div
              key={field.id}
              className={`space-y-2 ${
                field.type === "textarea" || field.type === "multiselect" ? "md:col-span-2 lg:col-span-3" : ""
              }`}
            >
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
              {renderField(field)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (!schema) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>当前岗位暂无日报表单</p>
          <p className="text-sm mt-2">请联系管理员配置</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 flex-wrap">
                {schema.title}
                {status && (
                  <Badge variant={status === "SUBMITTED" ? "success" : "warning"}>
                    {status === "SUBMITTED" ? "已提交" : "草稿"}
                  </Badge>
                )}
                {isLocked && (
                  <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                    <Lock className="h-3 w-3 mr-1" />
                    已锁定
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{schema.description}</CardDescription>
            </div>

            {/* 日期选择 */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="px-4 py-2 bg-gray-50 rounded-md font-medium min-w-[120px] text-center">
                {reportDate}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => changeDate(1)}
                disabled={reportDate >= getToday()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* 分组导航 */}
        {schema.sections.length > 3 && (
          <div className="px-6 pb-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {schema.sections.map((section, index) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(index)}
                  className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                    activeSection === index
                      ? "bg-cyan-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {section.title.replace(/^[一二三四五六七八九十]+、/, "")}
                </button>
              ))}
            </div>
          </div>
        )}

        <Separator />

        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
            </div>
          ) : (
            <div className={isDisabled ? "opacity-60 pointer-events-none" : ""}>
              {/* 表单内容 */}
              <div className="space-y-8">
                {schema.sections.length > 3 ? (
                  // 多分组时只显示当前分组
                  renderSection(schema.sections[activeSection], activeSection)
                ) : (
                  // 少量分组时显示全部
                  schema.sections.map((section, index) => renderSection(section, index))
                )}
              </div>

              {/* 备注 - 可折叠 */}
              <details className="mt-8 group">
                <summary className="flex items-center gap-2 cursor-pointer list-none py-2 text-sm font-medium text-gray-600 hover:text-gray-900">
                  <span className="transform transition-transform group-open:rotate-90">▶</span>
                  备注（选填）
                  {note && <Badge variant="outline" className="text-xs">已填写</Badge>}
                </summary>
                <div className="mt-2">
                  <textarea
                    className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="如有特殊情况请在此说明（最多500字）"
                    maxLength={500}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </details>

              {/* 操作按钮 */}
              <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
                <div className="text-sm text-gray-500">
                  {isLocked ? (
                    <span className="text-orange-600">数据已锁定，无法修改</span>
                  ) : status === "SUBMITTED" ? (
                    <span>如需修改，请先撤回</span>
                  ) : (
                    <span>填写完成后请点击提交</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {/* 分组导航按钮 */}
                  {schema.sections.length > 3 && (
                    <div className="flex items-center gap-2 mr-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                        disabled={activeSection === 0}
                      >
                        上一项
                      </Button>
                      <span className="text-sm text-gray-500">
                        {activeSection + 1} / {schema.sections.length}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActiveSection(Math.min(schema.sections.length - 1, activeSection + 1))}
                        disabled={activeSection === schema.sections.length - 1}
                      >
                        下一项
                      </Button>
                    </div>
                  )}

                  {status === "SUBMITTED" && !isDisabled && !isReadOnly && (
                    <Button variant="outline" onClick={handleWithdraw} disabled={isSaving}>
                      <Undo2 className="h-4 w-4 mr-2" />
                      撤回
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
    </TooltipProvider>
  );
}



