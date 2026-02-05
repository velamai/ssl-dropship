"use client";

import { OrderDraftSheet } from "@/components/shipments/order-draft-sheet";
import { useOrderDraft } from "@/contexts/order-draft-context";

/**
 * Wrapper that renders OrderDraftSheet connected to OrderDraftContext.
 * Placed in layout so the cart sheet is available on all pages.
 */
export function OrderDraftSheetWrapper() {
  const { isCartOpen, setIsCartOpen } = useOrderDraft();

  return (
    <OrderDraftSheet
      open={isCartOpen}
      onOpenChange={setIsCartOpen}
    />
  );
}
