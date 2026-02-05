"use client";

import type React from "react";
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { OrderDraft } from "@/lib/order-draft";
import { getDrafts } from "@/lib/order-draft";

type OrderDraftContextType = {
  drafts: OrderDraft[];
  refreshDrafts: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
};

const OrderDraftContext = createContext<OrderDraftContextType>({
  drafts: [],
  refreshDrafts: () => {},
  isCartOpen: false,
  setIsCartOpen: () => {},
});

export const useOrderDraft = () => useContext(OrderDraftContext);

export function OrderDraftProvider({ children }: { children: React.ReactNode }) {
  const [drafts, setDrafts] = useState<OrderDraft[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const refreshDrafts = useCallback(() => {
    setDrafts(getDrafts());
  }, []);

  useEffect(() => {
    refreshDrafts();
  }, [refreshDrafts]);

  return (
    <OrderDraftContext.Provider
      value={{ drafts, refreshDrafts, isCartOpen, setIsCartOpen }}
    >
      {children}
    </OrderDraftContext.Provider>
  );
}
