export type MaintenanceNotice = {
  enabled: boolean;
  date: string;
  startTime: string;
  endTime: string;
};

const DEFAULT_NOTICE: MaintenanceNotice = {
  enabled: true,
  date: "04, 05 & 06 September 2026",
  startTime: "11:00 PM IST",
  endTime: "1:00 AM IST",
};

export function getMaintenanceNotice(): MaintenanceNotice {
  return DEFAULT_NOTICE;
}

export function isMaintenanceBannerActive(): boolean {
  return getMaintenanceNotice().enabled;
}

export function getMaintenanceNavbarTopClass(): string {
  return isMaintenanceBannerActive() ? "top-7" : "top-0";
}

export function getMaintenanceBannerMessage(): string {
  const notice = getMaintenanceNotice();

  return `The site will be under maintenance on ${notice.date} from ${notice.startTime} to ${notice.endTime}.`;
}
