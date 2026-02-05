"use client";

import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useOrderDraft } from "@/contexts/order-draft-context";
import {
  deleteDraft,
  type OrderDraft,
} from "@/lib/order-draft";
import { ShoppingCart, Package, Trash2, ChevronRight } from "lucide-react";
import Link from "next/link";

interface OrderDraftSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoadDraft?: (draft: OrderDraft) => void;
}

export function OrderDraftSheet({
  open,
  onOpenChange,
  onLoadDraft,
}: OrderDraftSheetProps) {
  const router = useRouter();
  const { drafts, refreshDrafts } = useOrderDraft();

  const handleDelete = (id: string) => {
    deleteDraft(id);
    refreshDrafts();
  };

  const handleProceedToCheckout = (draft?: OrderDraft) => {
    onOpenChange(false);
    if (draft) {
      router.push(`/create-shipments?draft=${draft.id}`);
    } else {
      router.push("/create-shipments");
    }
  };

  const handleLoad = (draft: OrderDraft) => {
    onOpenChange(false);
    if (onLoadDraft) {
      onLoadDraft(draft);
    } else {
      router.push(`/create-shipments?draft=${draft.id}`);
    }
  };

  const totalItems = drafts.reduce((sum, d) => sum + d.items.length, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            My Cart
          </SheetTitle>
          <SheetDescription>
            {totalItems} item{totalItems !== 1 ? "s" : ""} across {drafts.length} draft{drafts.length !== 1 ? "s" : ""}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {drafts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                No drafts yet
              </p>
              <p className="text-xs text-muted-foreground max-w-xs">
                Add products from the calculator or create-shipments page to get started.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                asChild
              >
                <Link href="/product-price-calculator">Go to Calculator</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="rounded-lg border p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{draft.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {draft.items.length} item{draft.items.length !== 1 ? "s" : ""} · {draft.sourceCountryCode}
                        {draft.destinationCountryCode && ` → ${draft.destinationCountryCode}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Saved {new Date(draft.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(draft.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleLoad(draft)}
                    >
                      Load
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleProceedToCheckout(draft)}
                    >
                      Checkout
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {drafts.length > 0 && (
          <div className="border-t pt-4">
            <Button
              className="w-full"
              onClick={() => handleProceedToCheckout()}
            >
              Start New Order
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
