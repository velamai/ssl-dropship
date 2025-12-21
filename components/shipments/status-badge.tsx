/**
 * StatusBadge component for displaying shipment status
 */

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      // Initial & Processing States
      Pending: {
        label: "Pending",
        color: "bg-amber-100 text-amber-800 border-amber-300",
      },
      Assigned: {
        label: "Assigned",
        color: "bg-blue-100 text-blue-800 border-blue-300",
      },
      Received: {
        label: "Received",
        color: "bg-cyan-100 text-cyan-800 border-cyan-300",
      },
      "Pick Up": {
        label: "Pick Up",
        color: "bg-violet-100 text-violet-800 border-violet-300",
      },
      // Acceptance & Pricing States
      Accepted: {
        label: "Accepted",
        color: "bg-emerald-100 text-emerald-800 border-emerald-300",
      },
      "Pricing Pending": {
        label: "Pricing Pending",
        color: "bg-teal-100 text-teal-800 border-teal-300",
      },
      "Price Ready": {
        label: "Price Ready",
        color: "bg-indigo-100 text-indigo-800 border-indigo-300",
      },
      "Product Price Ready": {
        label: "Product Price Ready",
        color: "bg-stone-100 text-stone-800 border-stone-300",
      },
      // Payment States
      "Invoice Generated": {
        label: "Invoice Generated",
        color: "bg-purple-100 text-purple-800 border-purple-300",
      },
      "Product Invoice Generated": {
        label: "Product Invoice Generated",
        color: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300",
      },
      "Payment Requested": {
        label: "Payment Requested",
        color: "bg-orange-100 text-orange-800 border-orange-300",
      },
      "Product Payment Requested": {
        label: "Product Payment Requested",
        color: "bg-rose-100 text-rose-800 border-rose-300",
      },
      Paid: {
        label: "Paid",
        color: "bg-green-100 text-green-800 border-green-300",
      },
      "Product Paid": {
        label: "Product Paid",
        color: "bg-lime-100 text-lime-800 border-lime-300",
      },
      // Product & Warehouse States
      Purchased: {
        label: "Purchased",
        color: "bg-pink-100 text-pink-800 border-pink-300",
      },
      "Received at Warehouse": {
        label: "Received at Warehouse",
        color: "bg-cyan-100 text-cyan-800 border-cyan-300",
      },
      "Processing to Dispatch": {
        label: "Processing to Dispatch",
        color: "bg-amber-100 text-amber-800 border-amber-300",
      },
      // Shipping States
      "Ready to Ship": {
        label: "Ready to Ship",
        color: "bg-sky-100 text-sky-800 border-sky-300",
      },
      Departure: {
        label: "Departure",
        color: "bg-blue-100 text-blue-800 border-blue-300",
      },
      Departed: {
        label: "Departed",
        color: "bg-slate-200 text-slate-900 border-slate-400",
      },
      "In Transit": {
        label: "In Transit",
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
      },
      Delivered: {
        label: "Delivered",
        color: "bg-green-100 text-green-800 border-green-300",
      },
      // Negative States
      Cancelled: {
        label: "Cancelled",
        color: "bg-red-100 text-red-800 border-red-300",
      },
      Canceled: {
        label: "Canceled",
        color: "bg-red-100 text-red-800 border-red-300",
      },
      Rejected: {
        label: "Rejected",
        color: "bg-red-100 text-red-800 border-red-300",
      },
      Failed: {
        label: "Failed",
        color: "bg-red-100 text-red-800 border-red-300",
      },
      // UPS Tracking States
      "Out for Delivery": {
        label: "Out for Delivery",
        color: "bg-yellow-100 text-yellow-800 border-yellow-300",
      },
      "On the Way": {
        label: "On the Way",
        color: "bg-blue-100 text-blue-800 border-blue-300",
      },
      "We Have Your Package": {
        label: "We Have Your Package",
        color: "bg-cyan-100 text-cyan-800 border-cyan-300",
      },
      "Label Created": {
        label: "Label Created",
        color: "bg-gray-100 text-gray-800 border-gray-300",
      },
      // Additional statuses
      "Picked Up": {
        label: "Picked Up",
        color: "bg-violet-100 text-violet-800 border-violet-300",
      },
      "Invoice Ready": {
        label: "Invoice Ready",
        color: "bg-purple-100 text-purple-800 border-purple-300",
      },
      Ready: {
        label: "Ready",
        color: "bg-sky-100 text-sky-800 border-sky-300",
      },
    };

    return (
      statusMap[status] || {
        label: status,
        color: "bg-gray-100 text-gray-700 border-gray-300",
      }
    );
  };

  const { label, color } = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}
    >
      {label}
    </span>
  );
}

