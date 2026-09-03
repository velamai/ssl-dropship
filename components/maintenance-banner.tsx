import { Wrench } from "lucide-react";
import {
  getMaintenanceBannerMessage,
  isMaintenanceBannerActive,
} from "@/lib/maintenance-config";

export function MaintenanceBanner() {
  if (!isMaintenanceBannerActive()) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-[100] w-full border-b border-red-700/80 bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white shadow-md"
    >
      <div className="mx-auto flex min-h-7 max-w-7xl items-center justify-center gap-1.5 px-3 py-1 text-center text-[10px] font-medium leading-tight sm:text-[11px]">
        <Wrench className="h-3 w-3 shrink-0 text-red-100" aria-hidden />
        <p>
          <span className="font-bold uppercase tracking-wide text-red-100">
            Scheduled Maintenance
          </span>
          <span className="mx-2 hidden sm:inline text-red-200" aria-hidden>
            |
          </span>
          <span className="block sm:inline text-white">
            {getMaintenanceBannerMessage()}
          </span>
        </p>
      </div>
    </div>
  );
}
