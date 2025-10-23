import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send } from "lucide-react";

interface TermsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
  isSubmitting: boolean;
}

export function TermsDialog({
  open,
  onOpenChange,
  onAccept,
  isSubmitting,
}: TermsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Terms and Conditions</DialogTitle>
          <DialogDescription>
            Please read and accept our terms and conditions to continue with
            your order.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4 border rounded-md p-4">
          <div className="space-y-4 text-sm leading-relaxed">
            <p>
              These conditions of carriage EXCLUDE LIABILITY on the part of
              Colombo Mail and its employees or agents for loss, damage and
              delay in certain circumstances, LIMIT LIABILITY to stated amounts
              where liability is accepted and REQUIRE NOTICE OF CLAIMS within
              strict time limits. Senders should note these conditions carefully
              and where necessary obtain insurance cover in order to protect
              their interests.
            </p>
            <p>
              To continue providing uninterrupted services to our valued
              customers with best possible service during this Covid-19 pandemic
              time, a temporary surcharge will be added on all international
              parcel, freight, and shipments until further notice.
            </p>
            <p>
              Rates and service quotations by employees and agents of Colombo
              Mail will be based upon information provided by the sender but
              final rates and service may vary based upon the shipment actually
              tendered and the application of these conditions. Colombo Mail is
              not liable for, nor will any adjustment, refund or credit of any
              kind be made, as a result of any discrepancy in any rate or
              service quotation made prior to the tender of the shipment and the
              rates, and other charges invoiced to the customer.
            </p>
            <p>
              Charges may be assessed based on dimensional weight. Dimensional
              weight is determined by multiplying a package’s length x height x
              width (all in centimetres) and dividing by 5000 or such other
              number as specified by Colombo Mail from time to time on fedex.com
              If the result exceeds the actual weight, additional charges may be
              assessed based on the dimensional weight.
            </p>
            <p>
              There is no limit on the aggregate weight of a multiple piece
              shipment provided each individual package within the shipment does
              not exceed the per package weight limit specified for the
              destination. For the bulk shipments require advance arrangement
              with Colombo Mail. Details are available upon request.
            </p>

            <p>The following items are not acceptable for carriage:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Money (coins, cash, negotiable instruments, etc.).</li>
              <li>Explosives, fireworks, flammable items.</li>
              <li>Human or animal remains, organs, embryos.</li>
              <li>Firearms, ammunition, and parts.</li>
              <li>
                Foodstuffs, perishable food, or beverages needing refrigeration.
              </li>
              <li>Hazardous waste including used needles or medical waste.</li>
              <li>Shipments requiring special licenses or permits.</li>
              <li>Shipments prohibited by law, statute, or regulation.</li>
              <li>Packages that are wet, leaking, or emit an odor.</li>
              <li>Packages wrapped in kraft paper.</li>
            </ul>

            <p>
              Each package must be legibly and durably marked with the shipper
              and recipient’s full name, complete postal address (with PIN
              code), and phone number. Colombo Mail is not liable for
              non-delivery due to incomplete/erroneous addresses. Customers must
              notify us of any tracking number errors within 24 hours of
              receipt.
            </p>

            <p>
              Colombo Mail reserves the right to add Rs.300 for register post
              charges and service surcharges without notice when using Sri
              Lankan post. Additionally, Sri Lankan post terms & conditions
              apply.
            </p>

            <p>
              Rates are updated monthly based on USD to LKR conversion. Express
              courier shipments are dispatched the same day (tracking provided
              same day). Singapore and Swiss post shipments are dispatched
              Friday with tracking updated the following Wednesday.
            </p>

            <p>
              Save as expressly set out herein, Colombo Mail makes no
              warranties, express or implied. Maximum liability for
              lost/damage/shortage is USD 100 only or invoice value, whichever
              is lower. Prices may vary daily depending on the exchange rate.
            </p>

            <p>
              Kindly note: For USPS, Singapore Post (Smart & Simple), and Hermes
              shipments without tracking progress in the specified timeframe,
              compensation is limited to shipping charges only.
            </p>
          </div>
        </ScrollArea>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={onAccept} disabled={isSubmitting} className="gap-2">
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
      </DialogContent>
    </Dialog>
  );
}
