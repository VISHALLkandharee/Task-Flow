"use client";

import { useToastStore } from "@/store/toastStore";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

const toastIcons = {
  success: <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />,
  error: <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
  info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
};

const toastStyles = {
  success: "border-green-100 bg-white/95 shadow-green-50/10 hover:bg-green-50/10",
  error: "border-red-100 bg-white/95 shadow-red-50/10 hover:bg-red-50/10",
  warning: "border-amber-100 bg-white/95 shadow-amber-50/10 hover:bg-amber-50/10",
  info: "border-blue-100 bg-white/95 shadow-blue-50/10 hover:bg-blue-50/10",
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "flex items-start gap-3 p-4 rounded-xl border shadow-lg pointer-events-auto",
            "transition-all duration-300 transform translate-y-0 opacity-100 animate-slide-in",
            toastStyles[toast.type]
          )}
        >
          {toastIcons[toast.type]}
          <div className="flex-1 text-sm text-gray-800 font-medium">
            {toast.message}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-lg hover:bg-gray-100/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
