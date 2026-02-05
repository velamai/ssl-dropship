"use client";

import type React from "react";
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { OrderDraft } from "@/lib/order-draft";
import { getDrafts, setDraftsInStorage } from "@/lib/order-draft";
import { useAuth } from "@/contexts/auth-context";
import {
  saveDraftToDb,
  getDraftsFromDb,
} from "@/lib/api/order-drafts";

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
  const { user } = useAuth();
  const [drafts, setDrafts] = useState<OrderDraft[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const refreshDrafts = useCallback(async () => {
    if (user?.id) {
      try {
        // Sync localStorage drafts to DB (guest drafts from before login)
        const localDrafts = getDrafts();
        for (const draft of localDrafts) {
          try {
            await saveDraftToDb(draft, user.id);
          } catch {
            // Ignore sync errors; draft stays in localStorage
          }
        }
        const dbDrafts = await getDraftsFromDb(user.id);
        setDraftsInStorage(dbDrafts);
        setDrafts(dbDrafts);
      } catch {
        // Fallback to localStorage on DB error
        setDrafts(getDrafts());
      }
    } else {
      setDrafts(getDrafts());
    }
  }, [user?.id]);

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
