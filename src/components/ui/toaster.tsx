"use client";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        return (
          <Toast key={id} variant={variant} {...props} className="border-white/5">
            <div className="flex gap-3 items-start">
              <div className="mt-1 flex-shrink-0">
                {variant === "destructive" ? (
                  <AlertCircle className="h-5 w-5 text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                ) : title?.includes("成功") ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                ) : (
                  <Info className="h-5 w-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" />
                )}
              </div>
              <div className="grid gap-1">
                {title && <ToastTitle className="text-sm font-bold tracking-tight text-white">{title}</ToastTitle>}
                {description && (
                  <ToastDescription className="text-[11px] text-gray-300 leading-normal font-mono">
                    {description}
                  </ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose className="text-white/20 hover:text-white transition-opacity" />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}









