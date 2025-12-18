"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollapsibleCardProps {
  title: string | React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  priority?: "high" | "normal" | "low"; // 高优先级默认展开，低优先级默认折叠
  summary?: React.ReactNode; // 折叠时显示的摘要
}

export function CollapsibleCard({
  title,
  icon,
  badge,
  defaultOpen,
  children,
  className,
  headerClassName,
  priority = "normal",
  summary,
}: CollapsibleCardProps) {
  // 根据优先级决定默认状态
  const getDefaultOpen = () => {
    if (defaultOpen !== undefined) return defaultOpen;
    if (priority === "high") return true;
    if (priority === "low") return false;
    return true;
  };

  const [isOpen, setIsOpen] = useState(getDefaultOpen());

  return (
    <Card className={cn("transition-all", className)}>
      <CardHeader
        className={cn(
          "cursor-pointer select-none transition-colors hover:bg-gray-50/50",
          headerClassName,
          !isOpen && "pb-4"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            {icon}
            {title}
            {badge}
          </CardTitle>
          <div className="flex items-center gap-2">
            {!isOpen && summary && (
              <span className="text-sm text-gray-500 hidden sm:block">{summary}</span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
            >
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <CardContent className="pt-0">{children}</CardContent>
      </div>
    </Card>
  );
}

// 快速摘要组件
interface QuickSummaryProps {
  items: { label: string; value: string | number; highlight?: boolean }[];
}

export function QuickSummary({ items }: QuickSummaryProps) {
  return (
    <div className="flex items-center gap-4">
      {items.map((item, index) => (
        <span
          key={index}
          className={cn(
            "text-sm",
            item.highlight ? "text-cyan-600 font-medium" : "text-gray-500"
          )}
        >
          {item.label}: <strong>{item.value}</strong>
        </span>
      ))}
    </div>
  );
}



