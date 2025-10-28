import { Button } from "@/components/ui/button";
import { TermsDialog } from "@/components/ui/terms-dialog";
import { Loader2, Send } from "lucide-react";

interface FormHeaderProps {
  totalPrice: string;
  isSubmitting: boolean;
  showTermsDialog: boolean;
  setShowTermsDialog: (show: boolean) => void;
  onSubmit: () => void;
}

export function FormHeader({
  totalPrice,
  isSubmitting,
  showTermsDialog,
  setShowTermsDialog,
  onSubmit,
}: FormHeaderProps) {
  const handlePlaceOrder = () => {
    setShowTermsDialog(true);
  };
  console.log("totalPrice", totalPrice);

  const handleAcceptTerms = () => {
    onSubmit();
    // Don't close dialog here - let it close when submission is complete
  };
  return (
    <div className="mb-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight">
            Create New Order
          </h2>
          <p className="text-muted-foreground">
            Fill out the form below to create a new order
          </p>
        </div>
        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-end sm:gap-6 md:w-auto">
          <div className="flex flex-col items-start sm:items-end">
            <span className="text-sm text-muted-foreground">Total Amount</span>
            <span className="text-lg md:text-xl font-bold">₹{totalPrice}</span>
          </div>
          <Button
            type="button"
            onClick={handlePlaceOrder}
            className="gap-1 w-full sm:w-auto"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Place Order
              </>
            )}
          </Button>
        </div>
      </div>

      <TermsDialog
        open={showTermsDialog}
        onOpenChange={setShowTermsDialog}
        onAccept={handleAcceptTerms}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
