import type { PriceCalculationResult } from "@/lib/price-calculator";

interface PriceDetailsProps {
  result: PriceCalculationResult;
}

export function PriceDetails({ result }: PriceDetailsProps) {
  if (!result.transportable || !result.prices || result.prices.length === 0) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md">
        <p className="text-red-600 font-medium">This shipment cannot be transported with the current parameters.</p>
        <p className="text-sm text-red-500 mt-1">
          Please check the weight, dimensions, destination country, and courier service.
        </p>
      </div>
    );
  }

  const price = result.prices[0];

  return (
    <div className="p-4 bg-gray-50 border rounded-md">
      <h3 className="font-medium text-gray-900 mb-2">Price Details</h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Courier Service:</span>
          <span className="font-medium">{price.name}</span>
        </div>

        {price.description && (
          <div className="bg-gray-100 p-2 rounded text-gray-700 text-xs">
            <p>{price.description}</p>
          </div>
        )}

        <div className="border-t pt-2 flex justify-between font-medium">
          <span className="text-gray-900">Final Price:</span>
          <span className="text-primary">
            {price.finalPrice.toFixed(2)} {price.currency}
          </span>
        </div>

        {price.instruction && (
          <div className="mt-4 p-2 bg-blue-50 border border-blue-100 rounded text-blue-700 text-xs">
            <p className="font-medium mb-1">Instructions:</p>
            <p>{price.instruction}</p>
          </div>
        )}

        {price.transhipment_time && (
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Estimated Delivery Time:</span>
            <span>{price.transhipment_time}</span>
          </div>
        )}
      </div>
    </div>
  );
}
