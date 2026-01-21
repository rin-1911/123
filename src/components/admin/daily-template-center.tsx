"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, GripVertical, Save, Loader2, ChevronDown, ChevronRight, ChevronUp, Settings2, FileText, Database, Layers } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast, useToast } from "@/components/ui/use-toast";
import { ROLE_LABELS, Role } from "@/lib/types";
import { MARKETING_SUB_DEPT_LABELS, MarketingSubDept, NURSING_ROLE_LABELS, NursingRole, getSchemaForRole, DailyReportSchema } from "@/lib/schemas";

// ============== 类型定义 ==============
interface Department {
  id: string;
  name: string;
  code: string;
}

// V2 容器类型
type ContainerType = "general";

const CONTAINER_TYPE_LABELS: Record<ContainerType, string> = {
  general: "标准容器",
};

const CONTAINER_TYPE_ICONS: Record<ContainerType, React.ReactNode> = {
  general: <Layers className="h-4 w-4" />,
};

// 字段类型
type FieldType = "text" | "number" | "money" | "textarea" | "select" | "dynamic_select" | "divider" | "dynamic_rows";

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: "文本",
  number: "数字",
  money: "金额",
  textarea: "多行文本",
  select: "下拉选择",
  dynamic_select: "下拉",
  divider: "分隔线",
  dynamic_rows: "清单字段",
};

const REPORTABLE_FIELD_TYPES = new Set<FieldType>(["number", "money", "select", "dynamic_select", "dynamic_rows"]);

const DICTIONARY_CATEGORY_LABELS: Record<string, string> = {
  marketing_spots: "市场点位",
  first_visit_sources: "初诊来源",
  treatment_projects: "项目成交",
};

// 字典选择器弹窗组件
function DictionarySelectorDialog({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<{ key: string; label: string; description: string }[]>([]);
  const [items, setItems] = useState<{ id: string; category: string; name: string }[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ key: "", label: "", description: "" });
  const { toast } = useToast();

  // 加载字典数据
  const loadDictionaries = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/dictionary");
      const data = await res.json();
      const allItems = data.items || [];
      setItems(allItems);

      const uniqueCategories = Array.from(new Set(allItems.map((item: any) => item.category)));
      
      const presetCategories = [
        { key: "marketing_spots", label: "市场点位", description: "线下市场拓展活动点位" },
        { key: "first_visit_sources", label: "初诊来源", description: "患者首次就诊的来源渠道" },
        { key: "treatment_projects", label: "项目成交", description: "可选择的治疗项目类型" },
      ];

      const finalCategories = [...presetCategories];
      uniqueCategories.forEach((catKey: any) => {
        if (!finalCategories.find(c => c.key === catKey)) {
          finalCategories.push({
            key: catKey,
            label: catKey,
            description: "自定义类别"
          });
        }
      });

      setCategories(finalCategories);
    } catch (err) {
      console.error(err);
      toast({ title: "加载字典失败", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadDictionaries();
    }
  }, [open]);

  // 获取当前值的显示名称
  const getDisplayLabel = (val: string) => {
    if (!val) return "";
    if (DICTIONARY_CATEGORY_LABELS[val]) return DICTIONARY_CATEGORY_LABELS[val];
    const cat = categories.find(c => c.key === val);
    if (cat && cat.label !== cat.key) return cat.label;
    return val;
  };

  const handleAddCategory = () => {
    if (!newCategory.key || !newCategory.label) return;
    if (categories.find(c => c.key === newCategory.key)) {
      toast({ title: "该分类已存在", variant: "destructive" });
      return;
    }
    setCategories([...categories, newCategory]);
    setSelectedCategory(newCategory.key);
    setIsAddingCategory(false);
    setNewCategory({ key: "", label: "", description: "" });
    toast({ title: "分类添加成功", description: "添加首个选项后将正式创建" });
  };

  // 删除分类
  const handleDeleteCategory = async (categoryKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`确定要删除分类 "${getDisplayLabel(categoryKey)}" 吗？这将删除该分类下的所有选项。`)) return;

    try {
      const res = await fetch(`/api/dictionary?category=${categoryKey}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("删除失败");

      setCategories(categories.filter(c => c.key !== categoryKey));
      setItems(items.filter(item => item.category !== categoryKey));
      if (selectedCategory === categoryKey) setSelectedCategory(null);
      toast({ title: "分类删除成功" });
    } catch (err) {
      toast({ title: "删除失败", variant: "destructive" });
    }
  };

  const handleAddItem = async () => {
    if (!selectedCategory || !newItemName.trim()) return;

    try {
      const res = await fetch("/api/dictionary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: selectedCategory,
          name: newItemName.trim(),
        }),
      });

      if (!res.ok) throw new Error("添加失败");

      const data = await res.json();
      setItems([...items, data.item]);
      setNewItemName("");
      toast({ title: "添加成功" });
    } catch (err) {
      toast({ title: "添加失败", variant: "destructive" });
    }
  };

  // 删除选项
  const handleDeleteItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/dictionary?id=${itemId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("删除失败");

      setItems(items.filter((item) => item.id !== itemId));
      toast({ title: "删除成功" });
    } catch (err) {
      toast({ title: "删除失败", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-full justify-start text-muted-foreground font-normal"
        >
          {value ? (
            <span className="text-foreground font-medium">{getDisplayLabel(value)}</span>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              选择关联...
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[650px] flex flex-col gap-0 p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>关联配置</DialogTitle>
          <DialogDescription>
            选择或创建一个类别，员工在填写日报时将从这些选项中选择。
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden border-t mt-4">
          <div className="w-1/3 border-r bg-gray-50 overflow-y-auto p-2 flex flex-col">
            <div className="flex items-center justify-between px-2 py-2 mb-1">
              <div className="text-xs font-semibold text-gray-500">分类</div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50"
                onClick={() => setIsAddingCategory(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 space-y-1">
              {categories.map((cat) => (
                <div
                  key={cat.key}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center justify-between group cursor-pointer",
                    selectedCategory === cat.key
                      ? "bg-white shadow-sm border text-cyan-700 font-medium"
                      : "hover:bg-gray-100 text-gray-700"
                  )}
                  onClick={() => {
                    setSelectedCategory(cat.key);
                    setIsAddingCategory(false);
                  }}
                >
                  <div className="flex flex-col gap-0.5 overflow-hidden">
                    <span className="truncate">{cat.label}</span>
                    <span className="text-[10px] text-gray-400 truncate">{cat.description}</span>
                  </div>
                  {!DICTIONARY_CATEGORY_LABELS[cat.key] && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                      onClick={(e) => handleDeleteCategory(cat.key, e)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col bg-white">
            {isAddingCategory ? (
              <div className="p-8 space-y-4">
                <div className="text-lg font-medium">新增分类</div>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">分类标识 (Key)</Label>
                    <Input 
                      placeholder="例如：market_channels (仅限英文下划线)" 
                      value={newCategory.key}
                      onChange={e => setNewCategory({...newCategory, key: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">显示名称 (Label)</Label>
                    <Input 
                      placeholder="例如：投放渠道" 
                      value={newCategory.label}
                      onChange={e => setNewCategory({...newCategory, label: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">描述 (可选)</Label>
                    <Input 
                      placeholder="说明该分类的用途" 
                      value={newCategory.description}
                      onChange={e => setNewCategory({...newCategory, description: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => setIsAddingCategory(false)}>取消</Button>
                  <Button className="flex-1" onClick={handleAddCategory}>确认创建</Button>
                </div>
              </div>
            ) : selectedCategory ? (
              <>
                <div className="p-4 border-b flex items-center justify-between bg-gray-50/50">
                  <div>
                    <div className="font-medium text-sm">
                      {categories.find(c => c.key === selectedCategory)?.label || selectedCategory}
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: <code className="bg-gray-100 px-1 rounded">{selectedCategory}</code>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      onSelect(selectedCategory);
                      setOpen(false);
                    }}
                  >
                    确认关联此分类
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4">
                  <div className="space-y-2 mb-4">
                    {items
                      .filter((item) => item.category === selectedCategory)
                      .map((item) => (
                        <div 
                          key={item.id} 
                          className="flex items-center justify-between px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg group hover:border-cyan-200 hover:bg-cyan-50/30 transition-all"
                        >
                          <span className="text-sm font-medium text-gray-700">{item.name}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-red-500 hover:bg-red-50"
                            onClick={() => handleDeleteItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    {items.filter((item) => item.category === selectedCategory).length === 0 && (
                      <div className="text-sm text-gray-400 w-full text-center py-8 border-2 border-dashed rounded-lg">
                        暂无选项，请在下方添加首个选项
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 border-t bg-gray-50">
                  <div className="flex gap-2">
                    <Input
                      placeholder="输入新选项名称..."
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="h-9"
                      onKeyDown={(e) => e.key === "Enter" && handleAddItem()}
                    />
                    <Button size="sm" onClick={handleAddItem} disabled={!newItemName.trim() || isLoading}>
                      <Plus className="h-4 w-4 mr-1" />
                      添加选项
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                请在左侧选择一个分类
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 动态清单行字段定义
interface RowField {
  id: string;
  label: string;
  type: "text" | "number" | "money" | "dynamic_select";
  dynamicOptionsKey?: string;
  fullWidth?: boolean;
}

// 容器内字段
interface ContainerField {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  reportEnabled?: boolean; // 是否汇集到报表
  hint?: string;
  suffix?: string;
  formula?: string;
  dynamicOptionsKey?: string;
  options?: { value: string; label: string }[];
  rowFields?: RowField[];
  addRowLabel?: string;
}

// 容器定义
interface ContainerConfig {
  id: string;
  title: string;
  type: ContainerType;
  description?: string;
  reportEnabled?: boolean;
  fields: ContainerField[];
  expanded?: boolean;
}

// 模板配置 V2
interface TemplateConfigV2 {
  version: 2;
  containers: ContainerConfig[];
}

// ============== 角色列表 ==============
const ALL_ROLES: Role[] = ["STAFF", "DEPT_LEAD", "STORE_MANAGER", "FINANCE", "HQ_ADMIN"];

// ============== Schema 转换函数 ==============
function schemaToContainers(schema: DailyReportSchema): ContainerConfig[] {
  const containers: ContainerConfig[] = [];

  for (const section of schema.sections) {
    const fieldGroups: { title: string; id: string; fields: typeof section.fields }[] = [];
    let currentGroup: { title: string; id: string; fields: typeof section.fields } | null = null;

    for (const field of section.fields) {
      if (field.type === "divider") {
        if (currentGroup && currentGroup.fields.length > 0) {
          fieldGroups.push(currentGroup);
        }
        currentGroup = {
          title: field.label,
          id: field.id.replace("d_", ""),
          fields: [],
        };
      } else if (currentGroup) {
        currentGroup.fields.push(field);
      } else {
        if (!currentGroup) {
          currentGroup = {
            title: section.title,
            id: section.id,
            fields: [],
          };
        }
        currentGroup.fields.push(field);
      }
    }
    if (currentGroup && currentGroup.fields.length > 0) {
      fieldGroups.push(currentGroup);
    }

    if (fieldGroups.length === 0) {
      fieldGroups.push({
        title: section.title,
        id: section.id,
        fields: section.fields.filter((f) => f.type !== "divider"),
      });
    }

    for (const group of fieldGroups) {
      const containerFields: ContainerField[] = [];
      for (const field of group.fields) {
        const isReportable = REPORTABLE_FIELD_TYPES.has(field.type as FieldType);
        const cf: ContainerField = {
          id: field.id,
          label: field.label,
          type: field.type as FieldType,
          required: field.required,
          reportEnabled: field.reportEnabled !== undefined ? !!field.reportEnabled : isReportable,
          hint: field.hint,
          suffix: field.suffix,
          formula: field.formula,
          dynamicOptionsKey: field.dynamicOptionsKey,
          options: field.options,
        };

        if (field.type === "dynamic_rows" && field.rowFields) {
          cf.addRowLabel = field.addRowLabel;
          cf.rowFields = field.rowFields.map((rf) => ({
            id: rf.id,
            label: rf.label,
            type: rf.type as "text" | "number" | "money" | "dynamic_select",
            dynamicOptionsKey: rf.dynamicOptionsKey,
            fullWidth: rf.fullWidth,
          }));
        }

        containerFields.push(cf);
      }

      containers.push({
        id: `${section.id}_${group.id}`,
        title: group.title,
        type: "general", // 统一为 general
        reportEnabled: true,
        fields: containerFields,
        expanded: false,
      });
    }
  }

  return containers;
}

function getDefaultSchema(
  deptCode: string,
  role: Role,
  subDept?: string
): DailyReportSchema | null {
  const roles: string[] = [role];

  if (deptCode === "NURSING") {
    return getSchemaForRole(deptCode, roles, subDept as NursingRole, undefined);
  }

  if (deptCode === "OFFLINE_MARKETING") {
    let mktSubDept: MarketingSubDept | undefined;
    if (subDept === "marketing_expansion" || subDept === "expansion") {
      mktSubDept = "expansion";
    } else if (subDept === "customer_service" || subDept === "customerService") {
      mktSubDept = "customerService";
    }
    return getSchemaForRole(deptCode, roles, undefined, mktSubDept);
  }

  return getSchemaForRole(deptCode, roles);
}

// ============== 组件 Props ==============
interface Props {
  departments: Department[];
}

// 动态清单列配置弹窗
function RowFieldsConfigDialog({
  fields,
  onChange,
}: {
  fields: RowField[];
  onChange: (fields: RowField[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [localFields, setLocalFields] = useState<RowField[]>([]);

  useEffect(() => {
    if (open) {
      setLocalFields(JSON.parse(JSON.stringify(fields)));
    }
  }, [open, fields]);

  const handleSave = () => {
    onChange(localFields);
    setOpen(false);
  };

  const addRowField = () => {
    const newField: RowField = {
      id: `rf_${Date.now()}`,
      label: "新列",
      type: "text",
    };
    setLocalFields([...localFields, newField]);
  };

  const updateLocalField = (index: number, updates: Partial<RowField>) => {
    const newFields = [...localFields];
    newFields[index] = { ...newFields[index], ...updates };
    setLocalFields(newFields);
  };

  const removeLocalField = (index: number) => {
    setLocalFields(localFields.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mt-2 text-cyan-700 border-cyan-200 hover:bg-cyan-50">
          <Settings2 className="mr-2 h-4 w-4" />
          配置清单列 ({fields.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>配置清单列</DialogTitle>
          <DialogDescription>
            定义该清单中每一行包含的字段。
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 px-1 space-y-4">
          {localFields.length === 0 ? (
            <div className="text-center py-8 text-gray-400 border-2 border-dashed rounded-lg">
              暂无列配置，请点击下方按钮添加
            </div>
          ) : (
            <div className="space-y-3">
              {localFields.map((rf, rIdx) => (
                <div key={rf.id} className="p-3 bg-gray-50 rounded-lg border flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-gray-500 mb-1.5 block">列名称</Label>
                        <Input
                          value={rf.label}
                          onChange={(e) => updateLocalField(rIdx, { label: e.target.value })}
                          placeholder="例如：点位名称"
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500 mb-1.5 block">数据类型</Label>
                        <Select
                          value={rf.type}
                          onValueChange={(v) => updateLocalField(rIdx, { type: v as any })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">文本</SelectItem>
                            <SelectItem value="number">数字</SelectItem>
                            <SelectItem value="money">金额</SelectItem>
                            <SelectItem value="dynamic_select">下拉</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-red-500 h-9 w-9 mt-6"
                      onClick={() => removeLocalField(rIdx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-4 pl-1">
                    {rf.type === "dynamic_select" && (
                      <div className="flex-1">
                        <Label className="text-xs text-gray-500 mb-1.5 block">关联</Label>
                         <div className="w-full">
                           <DictionarySelectorDialog
                              value={rf.dynamicOptionsKey || ""}
                              onSelect={(v) => updateLocalField(rIdx, { dynamicOptionsKey: v })}
                           />
                         </div>
                      </div>
                    )}
                    
                    <div className={cn("flex items-center gap-2 pt-6", rf.type !== "dynamic_select" && "ml-0")}>
                      <Switch
                        checked={rf.fullWidth || false}
                        onCheckedChange={(v) => updateLocalField(rIdx, { fullWidth: v })}
                        id={`fw-${rf.id}`}
                      />
                      <Label htmlFor={`fw-${rf.id}`} className="text-sm font-normal text-gray-600 cursor-pointer">
                        整行显示
                      </Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button 
            variant="outline" 
            className="w-full border-dashed py-6 text-gray-500 hover:text-cyan-600 hover:border-cyan-300 hover:bg-cyan-50/50" 
            onClick={addRowField}
          >
            <Plus className="mr-2 h-4 w-4" /> 添加新列
          </Button>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t mt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>取消</Button>
          <Button onClick={handleSave}>保存配置</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============== 主组件 ==============
export function DailyTemplateCenter({ departments }: Props) {
  const [selectedRole, setSelectedRole] = useState<Role | "">("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [selectedSubDept, setSelectedSubDept] = useState("");

  const [containers, setContainers] = useState<ContainerConfig[]>([]);
  const [templateId, setTemplateId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [expandedContainerId, setExpandedContainerId] = useState<string | null>(null);

  const selectedDeptCode = departments.find((d) => d.id === selectedDeptId)?.code || "";
  const needsSubDept = selectedDeptCode === "NURSING" || selectedDeptCode === "OFFLINE_MARKETING";

  const loadTemplate = useCallback(async () => {
    if (!selectedRole || !selectedDeptId) {
      setContainers([]);
      setTemplateId(null);
      return;
    }

    if (needsSubDept && !selectedSubDept) {
      setContainers([]);
      setTemplateId(null);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        role: selectedRole,
        departmentId: selectedDeptId,
      });
      if (selectedSubDept) {
        params.set("subDept", selectedSubDept);
      }

      const res = await fetch(`/api/daily-templates?${params}`);
      if (!res.ok) throw new Error("加载失败");

      const data = await res.json();
      if (data.template) {
        setTemplateId(data.template.id);
        const config = data.template.configJson as TemplateConfigV2;
        if (config.version === 2 && Array.isArray(config.containers)) {
          setContainers(config.containers.map((c) => ({
            ...c,
            type: "general", // 加载时统一设为 general，向下兼容
            reportEnabled: c.reportEnabled ?? true,
            fields: (c.fields || []).map((f: any) => ({
              ...f,
              reportEnabled:
                f.type === "divider"
                  ? false
                  : (f.reportEnabled ?? REPORTABLE_FIELD_TYPES.has(f.type as FieldType)),
            })),
            expanded: false,
          })));
        } else {
          setContainers([]);
        }
      } else {
        setTemplateId(null);
        const defaultSchema = getDefaultSchema(selectedDeptCode, selectedRole as Role, selectedSubDept);
        if (defaultSchema) {
          const defaultContainers = schemaToContainers(defaultSchema);
          setContainers(defaultContainers);
        } else {
          setContainers([]);
        }
      }
      setHasChanges(false);
    } catch (err) {
      console.error(err);
      toast({ title: "加载模板失败", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [selectedRole, selectedDeptId, selectedSubDept, needsSubDept, selectedDeptCode]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  const saveTemplate = async () => {
    if (!selectedRole || !selectedDeptId) return;
    if (needsSubDept && !selectedSubDept) return;

    setIsSaving(true);
    try {
      const configJson: TemplateConfigV2 = {
        version: 2,
        containers: containers.map(({ expanded, ...c }) => c),
      };

      const res = await fetch("/api/daily-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: selectedRole,
          departmentId: selectedDeptId,
          subDept: selectedSubDept || "",
          configJson,
        }),
      });

      if (!res.ok) throw new Error("保存失败");

      const data = await res.json();
      setTemplateId(data.template.id);
      setHasChanges(false);
      toast({ title: "保存成功", description: "模板已保存，员工端将实时生效" });
    } catch (err) {
      console.error(err);
      toast({ title: "保存失败", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const addContainer = (type: ContainerType) => {
    const newContainer: ContainerConfig = {
      id: `container_${Date.now()}`,
      title: `新${CONTAINER_TYPE_LABELS[type]}`,
      type,
      reportEnabled: true,
      fields: [],
      expanded: true,
    };
    setContainers([...containers, newContainer]);
    setExpandedContainerId(newContainer.id);
    setHasChanges(true);
  };

  const removeContainer = (containerId: string) => {
    setContainers(containers.filter((c) => c.id !== containerId));
    if (expandedContainerId === containerId) {
      setExpandedContainerId(null);
    }
    setHasChanges(true);
  };

  const updateContainer = (containerId: string, updates: Partial<ContainerConfig>) => {
    setContainers(containers.map((c) => (c.id === containerId ? { ...c, ...updates } : c)));
    setHasChanges(true);
  };

  const toggleContainerExpand = (containerId: string) => {
    setExpandedContainerId(expandedContainerId === containerId ? null : containerId);
  };

  const addField = (containerId: string, forcedType: FieldType = "text") => {
    const container = containers.find((c) => c.id === containerId);
    if (!container) return;

    const newField: ContainerField = {
      id: `field_${Date.now()}`,
      label: forcedType === "dynamic_rows" ? "新清单" : "新字段",
      type: forcedType,
      required: false,
      reportEnabled: forcedType === "divider" ? false : REPORTABLE_FIELD_TYPES.has(forcedType),
      ...(forcedType === "dynamic_rows" ? { rowFields: [], addRowLabel: "+ 新增记录" } : {}),
    };

    updateContainer(containerId, {
      fields: [...container.fields, newField],
    });
  };

  const updateField = (containerId: string, fieldId: string, updates: Partial<ContainerField>) => {
    const container = containers.find((c) => c.id === containerId);
    if (!container) return;

    updateContainer(containerId, {
      fields: container.fields.map((f) => {
        if (f.id !== fieldId) return f;
        const updated = { ...f, ...updates };
        if (updates.type) {
          const isReportable = updates.type !== "divider" && REPORTABLE_FIELD_TYPES.has(updates.type as FieldType);
          updated.reportEnabled = isReportable ? (updated.reportEnabled ?? true) : false;
        } else if (updated.type === "divider") {
          updated.reportEnabled = false;
        }
        // 当类型变为 dynamic_rows 时，确保初始化 rowFields
        if (updates.type === "dynamic_rows") {
          if (!updated.rowFields) updated.rowFields = [];
          if (!updated.addRowLabel) updated.addRowLabel = "+ 新增";
        }
        return updated;
      }),
    });
  };

  const removeField = (containerId: string, fieldId: string) => {
    const container = containers.find((c) => c.id === containerId);
    if (!container) return;

    updateContainer(containerId, {
      fields: container.fields.filter((f) => f.id !== fieldId),
    });
  };

  const moveField = (containerId: string, fieldId: string, direction: "up" | "down") => {
    const container = containers.find((c) => c.id === containerId);
    if (!container) return;

    const fieldIndex = container.fields.findIndex((f) => f.id === fieldId);
    if (fieldIndex === -1) return;

    const newIndex = direction === "up" ? fieldIndex - 1 : fieldIndex + 1;
    if (newIndex < 0 || newIndex >= container.fields.length) return;

    const newFields = [...container.fields];
    [newFields[fieldIndex], newFields[newIndex]] = [newFields[newIndex], newFields[fieldIndex]];

    updateContainer(containerId, { fields: newFields });
  };

  const initMarketingExample = () => {
    const exampleContainers: ContainerConfig[] = [
      {
        id: "spot_list",
        title: "多点位清单",
        type: "general",
        fields: [
          {
            id: "spot_details",
            label: "点位明细",
            type: "dynamic_rows",
            addRowLabel: "+ 新增记录",
            rowFields: [
              { id: "spot_name", label: "点位名称", type: "dynamic_select", dynamicOptionsKey: "marketing_spots" },
              { id: "valid_leads_phone", label: "有效线索(电话)", type: "number" },
              { id: "direct_visits", label: "现场引流到诊", type: "number" },
              { id: "visit_deal", label: "到诊成交", type: "number" },
              { id: "receivable_amount", label: "应收", type: "money" },
              { id: "cash_received", label: "实收", type: "money" },
              { id: "remark", label: "备注", type: "text", fullWidth: true },
            ],
          },
        ],
      },
      {
        id: "plan",
        title: "当日总结",
        type: "general",
        fields: [
          { id: "today_plan", label: "今日总结", type: "textarea" },
          { id: "tomorrow_plan", label: "明日计划", type: "textarea" },
        ],
      },
    ];

    setContainers(exampleContainers);
    setHasChanges(true);
    toast({ title: "已加载示例配置", description: "市场拓展模板已初始化" });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">选择配置目标</CardTitle>
          <CardDescription>先选择角色和部门，再配置该组合的日报容器</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-48">
              <Label className="text-sm text-gray-600 mb-1.5 block">角色</Label>
              <Select value={selectedRole} onValueChange={(v) => { setSelectedRole(v as Role); setSelectedSubDept(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="选择角色" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_ROLES.map((role) => (
                    <SelectItem key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-48">
              <Label className="text-sm text-gray-600 mb-1.5 block">部门</Label>
              <Select value={selectedDeptId} onValueChange={(v) => { setSelectedDeptId(v); setSelectedSubDept(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="选择部门" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {needsSubDept && selectedDeptCode === "NURSING" && (
              <div className="w-48">
                <Label className="text-sm text-gray-600 mb-1.5 block">护理子部门</Label>
                <Select value={selectedSubDept} onValueChange={setSelectedSubDept}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择子部门" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(NURSING_ROLE_LABELS) as NursingRole[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {NURSING_ROLE_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {needsSubDept && selectedDeptCode === "OFFLINE_MARKETING" && (
              <div className="w-48">
                <Label className="text-sm text-gray-600 mb-1.5 block">市场子部门</Label>
                <Select value={selectedSubDept} onValueChange={setSelectedSubDept}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择子部门" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(MARKETING_SUB_DEPT_LABELS) as MarketingSubDept[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        {MARKETING_SUB_DEPT_LABELS[key]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {isLoading && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}
          </div>
        </CardContent>
      </Card>

      {selectedRole && selectedDeptId && (!needsSubDept || selectedSubDept) && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">容器(Section)管理</CardTitle>
                <CardDescription>
                  每个容器对应日报中的一个区块，左侧带蓝色竖线标识
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {selectedDeptCode === "OFFLINE_MARKETING" && selectedSubDept === "marketing_expansion" && (
                  <Button variant="outline" size="sm" onClick={initMarketingExample}>
                    <Settings2 className="h-4 w-4 mr-1" />
                    加载示例
                  </Button>
                )}
                <Button onClick={saveTemplate} disabled={isSaving || !hasChanges} size="sm">
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                  保存配置
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2 pb-4 border-b">
              <span className="text-sm text-gray-500 mr-2">管理容器：</span>
              <Button variant="outline" size="sm" onClick={() => addContainer("general")} className="bg-cyan-50 border-cyan-200 text-cyan-700 hover:bg-cyan-100">
                <Plus className="h-4 w-4 mr-1" />
                新增容器
              </Button>
            </div>

            {containers.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                暂无容器，请点击上方按钮新增
              </div>
            ) : (
              <div className="space-y-3">
                {containers.map((container) => (
                  <div key={container.id} className="border rounded-lg overflow-hidden">
                    <div
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                        "border-l-4 border-cyan-500 bg-gray-50 hover:bg-gray-100"
                      )}
                      onClick={() => toggleContainerExpand(container.id)}
                    >
                      <GripVertical className="h-4 w-4 text-gray-400 cursor-grab" />
                      {expandedContainerId === container.id ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="flex items-center gap-1.5 w-24 shrink-0">
                        {CONTAINER_TYPE_ICONS[container.type] || <Layers className="h-4 w-4" />}
                        <span className="text-xs text-cyan-600 font-medium">
                          [容器]
                        </span>
                      </span>
                      <Input
                        value={container.title}
                        onChange={(e) => {
                          e.stopPropagation();
                          updateContainer(container.id, { title: e.target.value });
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 h-8 max-w-md"
                        placeholder="容器标题"
                      />
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Switch
                          checked={container.reportEnabled ?? true}
                          onCheckedChange={(v) => updateContainer(container.id, { reportEnabled: v })}
                          className="data-[state=checked]:bg-cyan-600"
                        />
                        <span className="text-xs text-gray-500">报表</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeContainer(container.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {expandedContainerId === container.id && (
                      <div className="p-4 bg-white space-y-3">
                        {container.fields.length === 0 ? (
                          <div className="text-sm text-gray-400 text-center py-4">
                            暂无字段
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {container.fields.map((field, fIdx) => (
                              <div key={field.id} className="space-y-2">
                                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                  <div className="flex flex-col">
                                    <button
                                      onClick={() => moveField(container.id, field.id, "up")}
                                      disabled={fIdx === 0}
                                      className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      <ChevronUp className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={() => moveField(container.id, field.id, "down")}
                                      disabled={fIdx === container.fields.length - 1}
                                      className="p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                                    >
                                      <ChevronDown className="h-3 w-3" />
                                    </button>
                                  </div>
                                  <Input
                                    value={field.label}
                                    onChange={(e) => updateField(container.id, field.id, { label: e.target.value })}
                                    className="w-32 h-8"
                                    placeholder="字段名"
                                  />
                                  <Select
                                    value={field.type}
                                    onValueChange={(v) => updateField(container.id, field.id, { type: v as FieldType })}
                                  >
                                    <SelectTrigger className="w-28 h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {(Object.keys(FIELD_TYPE_LABELS) as FieldType[]).map((t) => (
                                        <SelectItem key={t} value={t}>
                                          {FIELD_TYPE_LABELS[t]}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  {field.type !== "divider" && (
                                    <>
                                      <div className="flex items-center gap-1">
                                        <Switch
                                          checked={field.required || false}
                                          onCheckedChange={(v) => updateField(container.id, field.id, { required: v })}
                                        />
                                        <span className="text-xs text-gray-500">必填</span>
                                      </div>
                                      {REPORTABLE_FIELD_TYPES.has(field.type) && (
                                        <div className="flex items-center gap-1">
                                          <Switch
                                            checked={!!field.reportEnabled}
                                            onCheckedChange={(v) => updateField(container.id, field.id, { reportEnabled: v })}
                                            className="data-[state=checked]:bg-cyan-600"
                                          />
                                          <span className="text-xs text-gray-500" title="开启后，该字段将自动显示在对应部门的报表汇总中">
                                            报表
                                          </span>
                                        </div>
                                      )}
                                    </>
                                  )}
                                  {field.type === "dynamic_select" && (
                                    <div className="w-40">
                                      <DictionarySelectorDialog
                                        value={field.dynamicOptionsKey || ""}
                                        onSelect={(v) => updateField(container.id, field.id, { dynamicOptionsKey: v })}
                                      />
                                    </div>
                                  )}
                                  {field.type === "dynamic_rows" && (
                                    <Input
                                      value={field.addRowLabel || "+ 新增"}
                                      onChange={(e) => updateField(container.id, field.id, { addRowLabel: e.target.value })}
                                      className="w-24 h-8 text-xs"
                                      placeholder="按钮文案"
                                      title="列表下方的添加按钮文案"
                                    />
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-400 hover:text-red-600"
                                    onClick={() => removeField(container.id, field.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>

                                {field.type === "dynamic_rows" && (
                                  <div className="ml-8 pl-3 border-l-2 border-cyan-200">
                                    <RowFieldsConfigDialog
                                      fields={field.rowFields || []}
                                      onChange={(newRowFields) => updateField(container.id, field.id, { rowFields: newRowFields })}
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => addField(container.id, "text")}>
                            <Plus className="h-4 w-4 mr-1" />
                            新增普通字段
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => addField(container.id, "dynamic_rows")}>
                            <Plus className="h-4 w-4 mr-1" />
                            新增清单字段
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {(!selectedRole || !selectedDeptId) && (
        <Card className="bg-gray-50">
          <CardContent className="py-12 text-center text-gray-400">
            请先在上方选择【角色】和【部门】
          </CardContent>
        </Card>
      )}

      {hasChanges && (
        <div className="fixed bottom-6 right-6 bg-orange-100 text-orange-800 px-4 py-2 rounded-lg shadow-lg text-sm">
          有未保存的更改
        </div>
      )}
    </div>
  );
}
