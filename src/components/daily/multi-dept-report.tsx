"use client";

import { useState, useEffect, useMemo } from "react";
import { EnhancedReportForm } from "./enhanced-report-form";
import { type DepartmentCode, type UserSession } from "@/lib/types";
import { Building2, CheckCircle2 } from "lucide-react";

interface Department {
  id: string;
  code: string;
  name: string;
}

interface MultiDeptReportProps {
  user: UserSession;
  departments: Department[];
  userDepartmentIds: string[]; // 用户所有的部门ID（主部门 + 额外部门）
}

export function MultiDeptReport({ user, departments, userDepartmentIds }: MultiDeptReportProps) {
  // 用户所属的所有部门（按名称排序，保持一致的显示顺序）
  const userDepartments = useMemo(() => 
    departments
      .filter(d => userDepartmentIds.includes(d.id))
      .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')),
    [departments, userDepartmentIds]
  );
  
  // 计算默认选中的部门ID
  const defaultDeptId = useMemo(() => 
    userDepartments[0]?.id || userDepartmentIds[0] || "",
    [userDepartments, userDepartmentIds]
  );
  
  // 当前选中的部门
  const [selectedDeptId, setSelectedDeptId] = useState<string>(defaultDeptId);
  
  // 各部门的提交状态
  const [submittedDepts, setSubmittedDepts] = useState<Set<string>>(new Set());

  // 获取当前选中的部门
  const selectedDept = departments.find(d => d.id === selectedDeptId);
  
  // 构造带有选中部门的用户对象
  const userWithSelectedDept: UserSession = {
    ...user,
    departmentId: selectedDeptId,
    departmentCode: (selectedDept?.code || user.departmentCode) as DepartmentCode,
    departmentName: selectedDept?.name || user.departmentName,
  };

  // 监听日报提交成功
  useEffect(() => {
    const handleReportSubmitted = () => {
      setSubmittedDepts(prev => {
        const newSet = new Set(prev);
        newSet.add(selectedDeptId);
        return newSet;
      });
    };
    
    window.addEventListener("report-submitted", handleReportSubmitted);
    return () => window.removeEventListener("report-submitted", handleReportSubmitted);
  }, [selectedDeptId]);

  // 如果只有一个部门，不显示选择器
  if (userDepartments.length <= 1) {
    return <EnhancedReportForm user={user} />;
  }

  return (
    <div className="space-y-4 w-full">
      {/* 顶部部门选择器 */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-gray-600">
          <Building2 className="h-4 w-4" />
          <span className="text-sm">选择部门：</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {userDepartments.map((dept) => {
            const isSelected = dept.id === selectedDeptId;
            const isSubmitted = submittedDepts.has(dept.id);
            
            return (
              <button
                key={dept.id}
                onClick={() => setSelectedDeptId(dept.id)}
                className={`px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 text-sm ${
                  isSelected
                    ? "border-cyan-500 bg-cyan-500 text-white"
                    : "border-gray-300 hover:border-cyan-400 hover:bg-cyan-50"
                }`}
              >
                <span>{dept.name}</span>
                {isSubmitted && (
                  <CheckCircle2 className={`h-3.5 w-3.5 ${isSelected ? "text-white" : "text-green-500"}`} />
                )}
              </button>
            );
          })}
        </div>
        
        {/* 进度指示 */}
        <div className="flex items-center gap-2 ml-auto text-xs text-gray-500">
          <span>今日进度：{submittedDepts.size}/{userDepartments.length}</span>
          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all"
              style={{ width: `${(submittedDepts.size / userDepartments.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* 日报表单 */}
      <EnhancedReportForm 
        key={selectedDeptId}
        user={userWithSelectedDept} 
      />
    </div>
  );
}

