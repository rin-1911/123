import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 格式化日期为 YYYY-MM-DD
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

// 获取今天的日期字符串
export function getToday(): string {
  return formatDate(new Date());
}

// 金额分转元
export function centsToYuan(cents: number): string {
  return (cents / 100).toFixed(2);
}

// 金额元转分
export function yuanToCents(yuan: number): number {
  return Math.round(yuan * 100);
}

// 计算百分比
export function calcPercentage(numerator: number, denominator: number): string {
  if (denominator === 0) return "0.00%";
  return ((numerator / denominator) * 100).toFixed(2) + "%";
}

// 格式化数字
export function formatNumber(num: number): string {
  return num.toLocaleString("zh-CN");
}







