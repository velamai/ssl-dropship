import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { useEffect, useState } from "react";

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface CustomToastProps {
  message: string;
  type: "success" | "error" | "info" | "warning";
  onClose: () => void;
  action?: ToastAction;
}

// Toast icon mapping
const ToastIcon = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

// Toast color mapping based on design system
const ToastColors = {
  success: {
    bg: "bg-[#f1f9f5]",
    border: "border-[#34c759]/20",
    text: "text-[#1c7a34]",
    icon: "text-[#34c759]",
  },
  error: {
    bg: "bg-[#fef2f2]",
    border: "border-[#dc2626]/20",
    text: "text-[#991b1b]",
    icon: "text-[#dc2626]",
  },
  info: {
    bg: "bg-[#f5e5ff]",
    border: "border-[#9a3bd9]/20",
    text: "text-[#6b21a8]",
    icon: "text-[#9a3bd9]",
  },
  warning: {
    bg: "bg-[#fffbeb]",
    border: "border-[#f59e0b]/20",
    text: "text-[#92400e]",
    icon: "text-[#f59e0b]",
  },
};

export const CustomToast = ({ message, type, onClose, action }: CustomToastProps) => {
  const Icon = ToastIcon[type];
  const colors = ToastColors[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div role="alert" aria-live="polite" className="fixed right-4 top-4 z-50 animate-slideInFromTop">
      <div className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-sm ${colors.bg} ${colors.border}`}>
        <Icon size={18} className={colors.icon} aria-hidden="true" />
        <span className={`text-[14px] font-medium ${colors.text}`}>{message}</span>
        {action && (
          <button
            onClick={action.onClick}
            className={`ml-2 rounded-md bg-white/50 px-3 py-1 text-[13px] font-medium ${colors.text} transition-colors hover:bg-white/80`}
          >
            {action.label}
          </button>
        )}
        <button
          onClick={onClose}
          className={`ml-1 rounded-full p-1 ${colors.text} opacity-60 transition-opacity hover:opacity-100`}
          aria-label="Close notification"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

interface ToastState {
  message: string;
  type: "success" | "error" | "info" | "warning";
  action?: ToastAction;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (
    message: string,
    type: "success" | "error" | "info" | "warning",
    options?: { action?: ToastAction }
  ) => {
    setToast({ message, type, action: options?.action });
  };

  const hideToast = () => {
    setToast(null);
  };

  return {
    toast,
    showToast,
    hideToast,
  };
};
