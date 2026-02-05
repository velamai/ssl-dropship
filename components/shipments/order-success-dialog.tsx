"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const REDIRECT_DELAY_MS = 2000;

interface OrderSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRedirect: () => void;
}

export function OrderSuccessDialog({
  open,
  onOpenChange,
  onRedirect,
}: OrderSuccessDialogProps) {
  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      onRedirect();
    }, REDIRECT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [open, onRedirect]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center py-4"
        >
          <DialogHeader className="flex flex-col items-center space-y-4 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15,
              }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
            >
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-500" />
            </motion.div>
            <div className="space-y-2">
              <DialogTitle className="text-xl font-semibold">
                Order Placed Successfully!
              </DialogTitle>
              <DialogDescription className="text-base">
                Your order has been confirmed. Redirecting to your shipments...
              </DialogDescription>
            </div>
          </DialogHeader>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{
              duration: REDIRECT_DELAY_MS / 1000,
              ease: "linear",
            }}
            className="mt-6 h-1 w-full origin-left rounded-full bg-primary/30"
          />
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
