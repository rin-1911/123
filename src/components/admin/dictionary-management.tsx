"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Pencil, Trash2, GripVertical, Tag } from "lucide-react";

interface DictionaryItem {
  id: string;
  category: string;
  name: string;
  value: string | null;
  isActive: boolean;
  sortOrder: number;
}

// 字典类别配置
const DICTIONARY_CATEGORIES = [
  { key: "first_visit_sources", label: "初诊来源", description: "患者首次就诊的来源渠道" },
  { key: "treatment_projects", label: "项目成交", description: "可选择的治疗项目类型" },
];

export function DictionaryManagement() {
  const { toast } = useToast();
  const [items, setItems] = useState<DictionaryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DictionaryItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("first_visit_sources");
  
  // 表单状态
  const [formData, setFormData] = useState({
    category: "first_visit_sources",
    name: "",
    sortOrder: 0,
  });

  // 加载数据
  const loadItems = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/dictionary");
      const data = await res.json();
      setItems(data.items || []);
    } catch {
      toast({
        title: "加载失败",
        description: "无法加载字典数据",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  // 筛选当前类别的项目
  const filteredItems = items.filter((item) => item.category === selectedCategory);

  // 打开新增对话框
  const openAddDialog = () => {
    setEditingItem(null);
    setFormData({
      category: selectedCategory,
      name: "",
      sortOrder: filteredItems.length,
    });
    setIsDialogOpen(true);
  };

  // 打开编辑对话框
  const openEditDialog = (item: DictionaryItem) => {
    setEditingItem(item);
    setFormData({
      category: item.category,
      name: item.name,
      sortOrder: item.sortOrder,
    });
    setIsDialogOpen(true);
  };

  // 保存
  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "请输入名称",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingItem) {
        // 更新
        const res = await fetch("/api/dictionary", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingItem.id,
            name: formData.name,
            sortOrder: formData.sortOrder,
          }),
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "更新失败");
        }
        
        toast({ title: "更新成功" });
      } else {
        // 新增
        const res = await fetch("/api/dictionary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "添加失败");
        }
        
        toast({ title: "添加成功" });
      }
      
      setIsDialogOpen(false);
      loadItems();
    } catch (error) {
      toast({
        title: "操作失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    }
  };

  // 切换启用状态
  const toggleActive = async (item: DictionaryItem) => {
    try {
      const res = await fetch("/api/dictionary", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          isActive: !item.isActive,
        }),
      });
      
      if (!res.ok) {
        throw new Error("更新失败");
      }
      
      toast({
        title: item.isActive ? "已禁用" : "已启用",
      });
      loadItems();
    } catch {
      toast({
        title: "操作失败",
        variant: "destructive",
      });
    }
  };

  // 删除
  const handleDelete = async (item: DictionaryItem) => {
    if (!confirm(`确定要删除"${item.name}"吗？`)) return;

    try {
      const res = await fetch(`/api/dictionary?id=${item.id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        throw new Error("删除失败");
      }
      
      toast({ title: "删除成功" });
      loadItems();
    } catch {
      toast({
        title: "删除失败",
        variant: "destructive",
      });
    }
  };

  const currentCategoryInfo = DICTIONARY_CATEGORIES.find((c) => c.key === selectedCategory);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Tag className="h-5 w-5" />
          字典管理
          <Badge variant="secondary">{items.length} 项</Badge>
        </CardTitle>
        <CardDescription>
          管理前台日报中的动态选项，如初诊来源、项目成交等
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 类别选择 */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DICTIONARY_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.key} value={cat.key}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={openAddDialog} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            添加选项
          </Button>
        </div>

        {currentCategoryInfo && (
          <p className="text-sm text-gray-500">{currentCategoryInfo.description}</p>
        )}

        {/* 选项列表 */}
        <div className="border rounded-lg divide-y">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              暂无选项，点击"添加选项"创建
            </div>
          ) : (
            filteredItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 hover:bg-gray-50 ${
                  !item.isActive ? "opacity-50" : ""
                }`}
              >
                <GripVertical className="h-4 w-4 text-gray-400" />
                <div className="flex-1">
                  <span className="font-medium">{item.name}</span>
                  {!item.isActive && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      已禁用
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleActive(item)}
                  >
                    {item.isActive ? "禁用" : "启用"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 新增/编辑对话框 */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? "编辑选项" : "添加选项"}</DialogTitle>
              <DialogDescription>
                {editingItem ? "修改选项信息" : "添加新的选项到字典中"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>类别</Label>
                <Select
                  value={formData.category}
                  onValueChange={(v) => setFormData({ ...formData, category: v })}
                  disabled={!!editingItem}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DICTIONARY_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.key} value={cat.key}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>名称</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入选项名称"
                />
              </div>
              <div className="space-y-2">
                <Label>排序</Label>
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                  placeholder="数字越小越靠前"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSave}>
                {editingItem ? "保存" : "添加"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}



