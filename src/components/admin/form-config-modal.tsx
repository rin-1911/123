"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  X, 
  Plus, 
  Trash2, 
  GripVertical,
  Check,
  RotateCcw,
  Settings2,
  Eye,
  EyeOff
} from "lucide-react";
import { getSchemaForRole, DailyReportSchema, FormField } from "@/lib/schemas";
import type { DepartmentCode, Role } from "@/lib/types";

// 自定义表单配置类型
export interface CustomFormConfig {
  // 启用的字段ID列表（未在列表中的字段将被隐藏）
  enabledFields: string[];
  // 字段名称覆盖
  fieldLabels: Record<string, string>;
  // 自定义字段
  customFields: CustomField[];
  // 隐藏的分组
  hiddenSections: string[];
}

interface CustomField {
  id: string;
  label: string;
  type: "number" | "text" | "textarea";
  sectionId: string;
  required?: boolean;
}

interface FormConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: CustomFormConfig | null) => void;
  departmentCode: string;
  roles: Role[];
  nursingRole?: string;
  currentConfig?: CustomFormConfig | null;
  userName: string;
}

export function FormConfigModal({
  isOpen,
  onClose,
  onSave,
  departmentCode,
  roles,
  nursingRole,
  currentConfig,
  userName,
}: FormConfigModalProps) {
  // 获取该部门的默认表单
  const defaultSchema = useMemo(() => {
    if (!departmentCode) return null;
    return getSchemaForRole(
      departmentCode as DepartmentCode,
      roles,
      nursingRole as any
    );
  }, [departmentCode, roles, nursingRole]);

  // 启用的字段
  const [enabledFields, setEnabledFields] = useState<Set<string>>(new Set());
  // 字段名称覆盖
  const [fieldLabels, setFieldLabels] = useState<Record<string, string>>({});
  // 自定义字段
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  // 隐藏的分组
  const [hiddenSections, setHiddenSections] = useState<Set<string>>(new Set());
  // 是否显示添加字段表单
  const [showAddField, setShowAddField] = useState(false);
  // 新字段表单
  const [newField, setNewField] = useState<CustomField>({
    id: "",
    label: "",
    type: "number",
    sectionId: "",
  });

  // 初始化配置
  useEffect(() => {
    if (!defaultSchema) return;

    if (currentConfig) {
      // 使用已保存的配置
      setEnabledFields(new Set(currentConfig.enabledFields));
      setFieldLabels(currentConfig.fieldLabels || {});
      setCustomFields(currentConfig.customFields || []);
      setHiddenSections(new Set(currentConfig.hiddenSections || []));
    } else {
      // 默认启用所有字段
      const allFieldIds = new Set<string>();
      defaultSchema.sections.forEach((section) => {
        section.fields.forEach((field) => {
          allFieldIds.add(field.id);
        });
      });
      setEnabledFields(allFieldIds);
      setFieldLabels({});
      setCustomFields([]);
      setHiddenSections(new Set());
    }
  }, [defaultSchema, currentConfig, isOpen]);

  // 切换字段启用状态
  const toggleField = (fieldId: string) => {
    setEnabledFields((prev) => {
      const next = new Set(prev);
      if (next.has(fieldId)) {
        next.delete(fieldId);
      } else {
        next.add(fieldId);
      }
      return next;
    });
  };

  // 切换分组显示状态
  const toggleSection = (sectionId: string) => {
    setHiddenSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  // 更新字段名称
  const updateFieldLabel = (fieldId: string, label: string) => {
    setFieldLabels((prev) => ({
      ...prev,
      [fieldId]: label,
    }));
  };

  // 重置字段名称
  const resetFieldLabel = (fieldId: string) => {
    setFieldLabels((prev) => {
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  // 添加自定义字段
  const addCustomField = () => {
    if (!newField.label || !newField.sectionId) return;
    
    const fieldId = `custom_${Date.now()}`;
    setCustomFields((prev) => [
      ...prev,
      { ...newField, id: fieldId },
    ]);
    setEnabledFields((prev) => new Set([...Array.from(prev), fieldId]));
    setNewField({ id: "", label: "", type: "number", sectionId: "" });
    setShowAddField(false);
  };

  // 删除自定义字段
  const removeCustomField = (fieldId: string) => {
    setCustomFields((prev) => prev.filter((f) => f.id !== fieldId));
    setEnabledFields((prev) => {
      const next = new Set(prev);
      next.delete(fieldId);
      return next;
    });
  };

  // 全选/取消全选某个分组的字段
  const toggleAllInSection = (sectionId: string, fields: FormField[]) => {
    const sectionFieldIds = fields.map((f) => f.id);
    const allEnabled = sectionFieldIds.every((id) => enabledFields.has(id));
    
    setEnabledFields((prev) => {
      const next = new Set(prev);
      if (allEnabled) {
        sectionFieldIds.forEach((id) => next.delete(id));
      } else {
        sectionFieldIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // 保存配置
  const handleSave = () => {
    const config: CustomFormConfig = {
      enabledFields: Array.from(enabledFields),
      fieldLabels,
      customFields,
      hiddenSections: Array.from(hiddenSections),
    };
    onSave(config);
    onClose();
  };

  // 重置为默认配置
  const handleReset = () => {
    if (!defaultSchema) return;
    
    const allFieldIds = new Set<string>();
    defaultSchema.sections.forEach((section) => {
      section.fields.forEach((field) => {
        allFieldIds.add(field.id);
      });
    });
    setEnabledFields(allFieldIds);
    setFieldLabels({});
    setCustomFields([]);
    setHiddenSections(new Set());
  };

  // 清除自定义配置
  const handleClear = () => {
    onSave(null);
    onClose();
  };

  if (!isOpen) return null;

  if (!defaultSchema) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center">
          <Settings2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">该部门暂无日报表单</p>
          <p className="text-sm text-gray-400 mt-2">请先为用户选择部门</p>
          <Button variant="outline" onClick={onClose} className="mt-4">
            关闭
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-cyan-600" />
              配置日报表单字段
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              为 <span className="font-medium text-gray-700">{userName}</span> 自定义需要填写的字段
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 当前表单信息 */}
        <div className="px-4 py-3 bg-gray-50 border-b flex-shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">当前表单模板：</span>
            <Badge variant="secondary">{defaultSchema.title}</Badge>
            <span className="text-gray-400">|</span>
            <span className="text-gray-500">
              已启用 {enabledFields.size} / {
                defaultSchema.sections.reduce((sum, s) => sum + s.fields.length, 0) + customFields.length
              } 个字段
            </span>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {defaultSchema.sections.map((section) => {
              const isHidden = hiddenSections.has(section.id);
              const sectionCustomFields = customFields.filter(
                (f) => f.sectionId === section.id
              );
              const allFieldsEnabled = section.fields.every((f) =>
                enabledFields.has(f.id)
              );

              return (
                <div key={section.id} className="border rounded-lg">
                  {/* 分组标题 */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-t-lg border-b">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {isHidden ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                      <h4 className="font-medium text-gray-700">
                        {section.title}
                      </h4>
                      <Badge variant="outline" className="text-xs">
                        {section.fields.length} 个字段
                      </Badge>
                    </div>
                    <button
                      onClick={() => toggleAllInSection(section.id, section.fields)}
                      className="text-xs text-cyan-600 hover:text-cyan-700"
                    >
                      {allFieldsEnabled ? "取消全选" : "全选"}
                    </button>
                  </div>

                  {/* 字段列表 */}
                  {!isHidden && (
                    <div className="p-3 space-y-2">
                      {section.fields.map((field) => {
                        const isEnabled = enabledFields.has(field.id);
                        const customLabel = fieldLabels[field.id];
                        const hasCustomLabel = customLabel !== undefined;

                        return (
                          <div
                            key={field.id}
                            className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
                              isEnabled
                                ? "border-cyan-200 bg-cyan-50/50"
                                : "border-gray-100 bg-gray-50 opacity-60"
                            }`}
                          >
                            {/* 启用开关 */}
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={() => toggleField(field.id)}
                              className="rounded text-cyan-600"
                            />

                            {/* 字段信息 */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Input
                                  value={customLabel ?? field.label}
                                  onChange={(e) =>
                                    updateFieldLabel(field.id, e.target.value)
                                  }
                                  className="h-8 text-sm"
                                  disabled={!isEnabled}
                                />
                                {hasCustomLabel && (
                                  <button
                                    onClick={() => resetFieldLabel(field.id)}
                                    className="text-gray-400 hover:text-gray-600"
                                    title="恢复默认名称"
                                  >
                                    <RotateCcw className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                              {hasCustomLabel && (
                                <p className="text-xs text-gray-400 mt-1">
                                  原名称：{field.label}
                                </p>
                              )}
                            </div>

                            {/* 字段类型标签 */}
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                              {field.type === "number" && "数字"}
                              {field.type === "money" && "金额"}
                              {field.type === "text" && "文本"}
                              {field.type === "textarea" && "多行文本"}
                              {field.type === "select" && "选择"}
                              {field.type === "multiselect" && "多选"}
                              {field.type === "boolean" && "开关"}
                              {field.type === "calculated" && "自动计算"}
                            </Badge>

                            {field.required && (
                              <Badge variant="destructive" className="text-xs flex-shrink-0">
                                必填
                              </Badge>
                            )}
                          </div>
                        );
                      })}

                      {/* 该分组下的自定义字段 */}
                      {sectionCustomFields.map((field) => (
                        <div
                          key={field.id}
                          className="flex items-center gap-3 p-2 rounded-lg border border-purple-200 bg-purple-50/50"
                        >
                          <input
                            type="checkbox"
                            checked={enabledFields.has(field.id)}
                            onChange={() => toggleField(field.id)}
                            className="rounded text-purple-600"
                          />
                          <div className="flex-1">
                            <Input
                              value={fieldLabels[field.id] ?? field.label}
                              onChange={(e) =>
                                updateFieldLabel(field.id, e.target.value)
                              }
                              className="h-8 text-sm"
                            />
                          </div>
                          <Badge variant="outline" className="text-xs bg-purple-100">
                            自定义
                          </Badge>
                          <button
                            onClick={() => removeCustomField(field.id)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 添加自定义字段 */}
            <div className="border rounded-lg border-dashed border-gray-300">
              {showAddField ? (
                <div className="p-4 space-y-3">
                  <h4 className="font-medium text-gray-700">添加自定义字段</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">字段名称</Label>
                      <Input
                        value={newField.label}
                        onChange={(e) =>
                          setNewField({ ...newField, label: e.target.value })
                        }
                        placeholder="如：特殊备注"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">字段类型</Label>
                      <select
                        value={newField.type}
                        onChange={(e) =>
                          setNewField({
                            ...newField,
                            type: e.target.value as any,
                          })
                        }
                        className="w-full mt-1 h-10 px-3 border rounded-md text-sm"
                      >
                        <option value="number">数字</option>
                        <option value="text">文本</option>
                        <option value="textarea">多行文本</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">添加到分组</Label>
                    <select
                      value={newField.sectionId}
                      onChange={(e) =>
                        setNewField({ ...newField, sectionId: e.target.value })
                      }
                      className="w-full mt-1 h-10 px-3 border rounded-md text-sm"
                    >
                      <option value="">选择分组</option>
                      {defaultSchema.sections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={addCustomField}
                      disabled={!newField.label || !newField.sectionId}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      确认添加
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddField(false)}
                    >
                      取消
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddField(true)}
                  className="w-full p-4 text-center text-gray-500 hover:text-cyan-600 hover:bg-gray-50 transition-colors"
                >
                  <Plus className="h-5 w-5 mx-auto mb-1" />
                  <span className="text-sm">添加自定义字段</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="flex items-center justify-between p-4 border-t bg-gray-50 flex-shrink-0">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              重置为默认
            </Button>
            {currentConfig && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="text-orange-600 hover:text-orange-700"
              >
                清除自定义配置
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-cyan-500 to-blue-600"
            >
              <Check className="h-4 w-4 mr-1" />
              保存配置
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

