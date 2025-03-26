"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastContextType {
  toast: {
    message: string;
    type: ToastType;
    visible: boolean;
  };
  showToast: (message: string, type: ToastType) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState({
    message: "",
    type: "info" as ToastType,
    visible: false,
  });

  const showToast = useCallback((message: string, type: ToastType) => {
    setToast({ message, type, visible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, showToast, hideToast }}>
      {children}
      {toast.visible && <CustomToast {...toast} onClose={hideToast} />}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function CustomToast({
  message,
  type,
  visible,
  onClose,
}: {
  message: string;
  type: ToastType;
  visible: boolean;
  onClose: () => void;
}) {
  if (!visible) return null;

  const baseStyles = "fixed bottom-4 right-4 p-4 rounded-lg shadow-lg max-w-md z-50 transition-opacity duration-300";
  const typeStyles = {
    success: "bg-green-500 text-white",
    error: "bg-red-500 text-white",
    info: "bg-blue-500 text-white",
    warning: "bg-yellow-500 text-white",
  };

  return (
    <div className={`${baseStyles} ${typeStyles[type]} ${visible ? "opacity-100" : "opacity-0"}`}>
      <div className="flex items-center justify-between">
        <p className="mr-4">{message}</p>
        <button onClick={onClose} className="text-white hover:text-gray-200 focus:outline-none">
          ×
        </button>
      </div>
    </div>
  );
}
