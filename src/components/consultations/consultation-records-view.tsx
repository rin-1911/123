"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import type { UserSession } from "@/lib/types";
import { getToday, formatNumber, centsToYuan } from "@/lib/utils";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Plus, 
  Search,
  User,
  Phone,
  Calendar,
  DollarSign,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface Consultant {
  id: string;
  name: string;
}

interface UserRole {
  isAdmin: boolean;
  isDeptLead: boolean;
  isConsultant: boolean;
  canViewAll?: boolean;
  canExport?: boolean;
}

interface ConsultationRecord {
  id: string;
  patientName: string;
  patientPhone?: string;
  patientAge?: number;
  patientGender?: string;
  visitDate: string;
  visitType: string;
  source?: string;
  toothPositions: string[];
  chiefComplaint?: string;
  intendedProjects: string[];
  intentionLevel?: string;
  dealStatus: string;
  dealProjects: string[];
  dealAmountYuan: number;
  depositAmountYuan: number;
  noDealReason?: string;
  nextFollowDate?: string;
  remark?: string;
  User: { id: string; name: string };
  createdAt: string;
}

interface Stats {
  total: number;
  pending: number;
  deal: number;
  noDeal: number;
  totalDealAmount: number;
  totalDeposit: number;
  initialVisits: number;
  returnVisits: number;
}

interface ConsultationRecordsViewProps {
  user: UserSession;
  consultants: Consultant[];
  userRole: UserRole;
}

// 项目选项
const PROJECT_OPTIONS = [
  "种植", "正畸", "修复", "美白", "洁牙", "拔牙", "根管", "儿牙", "其他"
];

// 意向程度选项
const INTENTION_OPTIONS = [
  { value: "HIGH", label: "高意向", color: "bg-green-100 text-green-700" },
  { value: "MEDIUM", label: "中意向", color: "bg-yellow-100 text-yellow-700" },
  { value: "LOW", label: "低意向", color: "bg-gray-100 text-gray-700" },
];

// 未成交原因选项
const NO_DEAL_REASONS = [
  "价格因素", "时间因素", "需要考虑", "对比其他机构", "家人反对", "恐惧心理", "其他"
];

export function ConsultationRecordsView({ 
  user, 
  consultants,
  userRole 
}: ConsultationRecordsViewProps) {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const initialDate = searchParams.get("date") || getToday();
  const initialStatus = searchParams.get("status") || "all";
  const initialConsultant = searchParams.get("consultantId") || "all";

  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<ConsultationRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  
  // 筛选条件
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
  const [selectedConsultant, setSelectedConsultant] = useState<string>(initialConsultant);
  const [searchTerm, setSearchTerm] = useState("");

  // 同步 URL 参数
  const updateUrl = (date: string, status: string, consultantId: string) => {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (status !== "all") params.set("status", status);
    if (consultantId !== "all") params.set("consultantId", consultantId);
    
    router.replace(`/consultations?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    updateUrl(selectedDate, selectedStatus, selectedConsultant);
  }, [selectedDate, selectedStatus, selectedConsultant]);
  
  // 表单
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ConsultationRecord | null>(null);
  const [saving, setSaving] = useState(false);
  
  // 表单数据
  const [formData, setFormData] = useState({
    patientName: "",
    patientPhone: "",
    patientAge: "",
    patientGender: "",
    visitDate: getToday(),
    visitType: "INITIAL",
    source: "",
    toothPositions: [] as string[],
    chiefComplaint: "",
    intendedProjects: [] as string[],
    intentionLevel: "",
    dealStatus: "PENDING",
    dealProjects: [] as string[],
    dealAmount: "",
    depositAmount: "",
    paymentMethod: "",
    noDealReason: "",
    noDealDetail: "",
    nextFollowDate: "",
    nextFollowNote: "",
    remark: "",
  });

  // 获取记录
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: selectedDate,
        endDate: selectedDate,
      });
      if (selectedStatus !== "all") {
        params.set("status", selectedStatus);
      }
      if (selectedConsultant !== "all") {
        params.set("consultantId", selectedConsultant);
      }
      
      const res = await fetch(`/api/consultations?${params}`);
      const data = await res.json();
      
      if (res.ok) {
        setRecords(data.records || []);
        setStats(data.stats || null);
      } else {
        toast({
          title: "获取失败",
          description: data.error || "无法获取咨询记录",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "网络错误",
        description: "请检查网络连接",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedDate, selectedStatus, selectedConsultant]);

  // 日期切换
  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  // 打开新建表单
  const openNewForm = () => {
    setFormData({
      patientName: "",
      patientPhone: "",
      patientAge: "",
      patientGender: "",
      visitDate: selectedDate,
      visitType: "INITIAL",
      source: "",
      toothPositions: [],
      chiefComplaint: "",
      intendedProjects: [],
      intentionLevel: "",
      dealStatus: "PENDING",
      dealProjects: [],
      dealAmount: "",
      depositAmount: "",
      paymentMethod: "",
      noDealReason: "",
      noDealDetail: "",
      nextFollowDate: "",
      nextFollowNote: "",
      remark: "",
    });
    setEditingRecord(null);
    setShowForm(true);
  };

  // 打开编辑表单
  const openEditForm = (record: ConsultationRecord) => {
    setFormData({
      patientName: record.patientName,
      patientPhone: record.patientPhone || "",
      patientAge: record.patientAge?.toString() || "",
      patientGender: record.patientGender || "",
      visitDate: record.visitDate,
      visitType: record.visitType,
      source: record.source || "",
      toothPositions: record.toothPositions || [],
      chiefComplaint: record.chiefComplaint || "",
      intendedProjects: record.intendedProjects || [],
      intentionLevel: record.intentionLevel || "",
      dealStatus: record.dealStatus,
      dealProjects: record.dealProjects || [],
      dealAmount: record.dealAmountYuan.toString(),
      depositAmount: record.depositAmountYuan.toString(),
      paymentMethod: "",
      noDealReason: record.noDealReason || "",
      noDealDetail: "",
      nextFollowDate: record.nextFollowDate || "",
      nextFollowNote: "",
      remark: record.remark || "",
    });
    setEditingRecord(record);
    setShowForm(true);
  };

  // 数据验证
  const validateConsultation = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // 必填字段检查
    if (!formData.patientName.trim()) {
      errors.push("患者姓名不能为空");
    }

    // 电话格式检查
    if (formData.patientPhone && !/^1[3-9]\d{9}$/.test(formData.patientPhone)) {
      errors.push("手机号格式不正确");
    }

    // 年龄合理性检查
    if (formData.patientAge) {
      const age = parseInt(formData.patientAge);
      if (age < 0 || age > 120) {
        errors.push("年龄范围不合理（0-120岁）");
      }
    }

    // 成交金额检查
    if (formData.dealStatus === "DEAL") {
      const amount = parseFloat(formData.dealAmount);
      if (!amount || amount <= 0) {
        errors.push("成交状态需要填写成交金额");
      }
      if (formData.dealProjects.length === 0) {
        errors.push("成交状态需要选择成交项目");
      }
      // 定金不能大于成交金额
      const deposit = parseFloat(formData.depositAmount) || 0;
      if (deposit > amount) {
        errors.push("定金不能大于成交金额");
      }
    }

    // 未成交原因检查
    if (formData.dealStatus === "NO_DEAL" && !formData.noDealReason) {
      errors.push("未成交状态需要选择未成交原因");
    }

    return { valid: errors.length === 0, errors };
  };

  // 保存记录
  const handleSave = async () => {
    // 验证数据
    const validation = validateConsultation();
    if (!validation.valid) {
      toast({
        title: "数据验证未通过",
        description: validation.errors.join("；"),
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const url = editingRecord 
        ? `/api/consultations/${editingRecord.id}` 
        : "/api/consultations";
      const method = editingRecord ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast({
          title: editingRecord ? "更新成功" : "创建成功",
          description: `患者 ${formData.patientName} 的记录已保存`,
        });
        setShowForm(false);
        fetchRecords();
      } else {
        toast({
          title: "保存失败",
          description: data.error || "请重试",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "网络错误",
        description: "请检查网络连接",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // 切换项目选择
  const toggleProject = (project: string, field: "intendedProjects" | "dealProjects") => {
    setFormData(prev => {
      const current = prev[field];
      const updated = current.includes(project)
        ? current.filter(p => p !== project)
        : [...current, project];
      return { ...prev, [field]: updated };
    });
  };

  // 过滤记录
  const filteredRecords = records.filter(r => 
    !searchTerm || 
    r.patientName.includes(searchTerm) || 
    r.patientPhone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">今日接诊</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <User className="h-8 w-8 text-blue-500" />
              </div>
              <div className="mt-2 text-xs text-gray-400">
                初诊 {stats.initialVisits} / 复诊 {stats.returnVisits}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">成交人数</p>
                  <p className="text-2xl font-bold text-green-600">{stats.deal}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
              <div className="mt-2 text-xs text-gray-400">
                转化率 {stats.total > 0 ? Math.round(stats.deal / stats.total * 100) : 0}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">成交金额</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    ¥{formatNumber(stats.totalDealAmount / 100)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-emerald-500" />
              </div>
              <div className="mt-2 text-xs text-gray-400">
                定金 ¥{formatNumber(stats.totalDeposit / 100)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">跟进中</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
              <div className="mt-2 text-xs text-gray-400">
                未成交 {stats.noDeal}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 筛选栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* 日期选择 */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40"
              />
              <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* 状态筛选 */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="PENDING">跟进中</SelectItem>
                <SelectItem value="DEAL">已成交</SelectItem>
                <SelectItem value="NO_DEAL">未成交</SelectItem>
              </SelectContent>
            </Select>

            {/* 咨询师筛选（仅管理员可见） */}
            {userRole.canViewAll && consultants.length > 1 && (
              <Select value={selectedConsultant} onValueChange={setSelectedConsultant}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部咨询师</SelectItem>
                  {consultants.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* 搜索 */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="搜索患者姓名/电话"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 新建按钮 */}
            {userRole.isConsultant && (
              <Button onClick={openNewForm} className="ml-auto">
                <Plus className="h-4 w-4 mr-2" />
                新建记录
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 记录列表 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            咨询记录
            <Badge variant="outline" className="ml-2">
              {filteredRecords.length} 条
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>暂无咨询记录</p>
              {userRole.isConsultant && (
                <Button variant="link" onClick={openNewForm}>
                  点击新建记录
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map(record => (
                <div
                  key={record.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-lg">{record.patientName}</span>
                        <Badge variant={record.visitType === "INITIAL" ? "default" : "secondary"}>
                          {record.visitType === "INITIAL" ? "初诊" : "复诊"}
                        </Badge>
                        <Badge className={
                          record.dealStatus === "DEAL" 
                            ? "bg-green-100 text-green-700" 
                            : record.dealStatus === "NO_DEAL"
                              ? "bg-red-100 text-red-700"
                              : "bg-orange-100 text-orange-700"
                        }>
                          {record.dealStatus === "DEAL" ? "已成交" : record.dealStatus === "NO_DEAL" ? "未成交" : "跟进中"}
                        </Badge>
                        {record.intentionLevel && (
                          <Badge className={
                            INTENTION_OPTIONS.find(o => o.value === record.intentionLevel)?.color
                          }>
                            {INTENTION_OPTIONS.find(o => o.value === record.intentionLevel)?.label}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        {record.patientPhone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {record.patientPhone}
                          </span>
                        )}
                        {record.patientAge && (
                          <span>{record.patientAge}岁</span>
                        )}
                        {record.intendedProjects.length > 0 && (
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            意向: {record.intendedProjects.join("、")}
                          </span>
                        )}
                        {record.dealStatus === "DEAL" && (
                          <span className="flex items-center gap-1 text-green-600">
                            <DollarSign className="h-3 w-3" />
                            成交 ¥{formatNumber(record.dealAmountYuan)}
                          </span>
                        )}
                      </div>

                      {record.remark && (
                        <p className="mt-2 text-sm text-gray-400">
                          备注: {record.remark}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">
                        {record.User.name}
                      </span>
                      {(userRole.isAdmin || record.User.id === user.id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditForm(record)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新建/编辑表单对话框 */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? "编辑咨询记录" : "新建咨询记录"}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">基本信息</TabsTrigger>
              <TabsTrigger value="intention">意向与项目</TabsTrigger>
              <TabsTrigger value="deal">成交情况</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>患者姓名 *</Label>
                  <Input
                    value={formData.patientName}
                    onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                    placeholder="请输入姓名"
                  />
                </div>
                <div>
                  <Label>联系电话</Label>
                  <Input
                    value={formData.patientPhone}
                    onChange={(e) => setFormData(prev => ({ ...prev, patientPhone: e.target.value }))}
                    placeholder="手机号码"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>年龄</Label>
                  <Input
                    type="number"
                    value={formData.patientAge}
                    onChange={(e) => setFormData(prev => ({ ...prev, patientAge: e.target.value }))}
                    placeholder="年龄"
                  />
                </div>
                <div>
                  <Label>性别</Label>
                  <Select
                    value={formData.patientGender}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, patientGender: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择性别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">男</SelectItem>
                      <SelectItem value="FEMALE">女</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>就诊类型</Label>
                  <Select
                    value={formData.visitType}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, visitType: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INITIAL">初诊</SelectItem>
                      <SelectItem value="RETURN">复诊</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>就诊日期</Label>
                  <Input
                    type="date"
                    value={formData.visitDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, visitDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>来源渠道</Label>
                  <Input
                    value={formData.source}
                    onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                    placeholder="如：美团、抖音、转介绍等"
                  />
                </div>
              </div>

              <div>
                <Label>主诉</Label>
                <Textarea
                  value={formData.chiefComplaint}
                  onChange={(e) => setFormData(prev => ({ ...prev, chiefComplaint: e.target.value }))}
                  placeholder="患者主要诉求"
                  rows={2}
                />
              </div>

              <div>
                <Label>牙位（多选）</Label>
                <div className="grid grid-cols-8 gap-1 mt-2 p-2 bg-gray-50 rounded">
                  {["11","12","13","14","15","16","17","18","21","22","23","24","25","26","27","28","31","32","33","34","35","36","37","38","41","42","43","44","45","46","47","48"].map(tooth => (
                    <Button
                      key={tooth}
                      type="button"
                      variant={formData.toothPositions.includes(tooth) ? "default" : "outline"}
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          toothPositions: prev.toothPositions.includes(tooth)
                            ? prev.toothPositions.filter(t => t !== tooth)
                            : [...prev.toothPositions, tooth]
                        }));
                      }}
                    >
                      {tooth}
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="intention" className="space-y-4 mt-4">
              <div>
                <Label>意向项目（多选）</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {PROJECT_OPTIONS.map(project => (
                    <Button
                      key={project}
                      type="button"
                      variant={formData.intendedProjects.includes(project) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleProject(project, "intendedProjects")}
                    >
                      {project}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>意向程度</Label>
                <div className="flex gap-2 mt-2">
                  {INTENTION_OPTIONS.map(opt => (
                    <Button
                      key={opt.value}
                      type="button"
                      variant={formData.intentionLevel === opt.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFormData(prev => ({ ...prev, intentionLevel: opt.value }))}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <Label>下次跟进日期</Label>
                <Input
                  type="date"
                  value={formData.nextFollowDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, nextFollowDate: e.target.value }))}
                />
              </div>

              <div>
                <Label>跟进备注</Label>
                <Textarea
                  value={formData.nextFollowNote}
                  onChange={(e) => setFormData(prev => ({ ...prev, nextFollowNote: e.target.value }))}
                  placeholder="跟进计划和注意事项"
                  rows={2}
                />
              </div>
            </TabsContent>

            <TabsContent value="deal" className="space-y-4 mt-4">
              <div>
                <Label>成交状态</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant={formData.dealStatus === "PENDING" ? "default" : "outline"}
                    onClick={() => setFormData(prev => ({ ...prev, dealStatus: "PENDING" }))}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    跟进中
                  </Button>
                  <Button
                    type="button"
                    variant={formData.dealStatus === "DEAL" ? "default" : "outline"}
                    className={formData.dealStatus === "DEAL" ? "bg-green-600 hover:bg-green-700" : ""}
                    onClick={() => setFormData(prev => ({ ...prev, dealStatus: "DEAL" }))}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    已成交
                  </Button>
                  <Button
                    type="button"
                    variant={formData.dealStatus === "NO_DEAL" ? "default" : "outline"}
                    className={formData.dealStatus === "NO_DEAL" ? "bg-red-600 hover:bg-red-700" : ""}
                    onClick={() => setFormData(prev => ({ ...prev, dealStatus: "NO_DEAL" }))}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    未成交
                  </Button>
                </div>
              </div>

              {formData.dealStatus === "DEAL" && (
                <>
                  <div>
                    <Label>成交项目（多选）</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {PROJECT_OPTIONS.map(project => (
                        <Button
                          key={project}
                          type="button"
                          variant={formData.dealProjects.includes(project) ? "default" : "outline"}
                          size="sm"
                          onClick={() => toggleProject(project, "dealProjects")}
                        >
                          {project}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>成交金额（元）</Label>
                      <Input
                        type="number"
                        value={formData.dealAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, dealAmount: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>定金金额（元）</Label>
                      <Input
                        type="number"
                        value={formData.depositAmount}
                        onChange={(e) => setFormData(prev => ({ ...prev, depositAmount: e.target.value }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </>
              )}

              {formData.dealStatus === "NO_DEAL" && (
                <>
                  <div>
                    <Label>未成交原因</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {NO_DEAL_REASONS.map(reason => (
                        <Button
                          key={reason}
                          type="button"
                          variant={formData.noDealReason === reason ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, noDealReason: reason }))}
                        >
                          {reason}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label>详细说明</Label>
                    <Textarea
                      value={formData.noDealDetail}
                      onChange={(e) => setFormData(prev => ({ ...prev, noDealDetail: e.target.value }))}
                      placeholder="未成交的具体原因和情况"
                      rows={2}
                    />
                  </div>
                </>
              )}

              <div>
                <Label>备注</Label>
                <Textarea
                  value={formData.remark}
                  onChange={(e) => setFormData(prev => ({ ...prev, remark: e.target.value }))}
                  placeholder="其他需要记录的信息"
                  rows={2}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

