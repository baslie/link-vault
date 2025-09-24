export type AnalyticsEvent =
  | "link_created"
  | "import_completed"
  | "export_generated"
  | "theme_changed";

declare global {
  interface Window {
    linkVaultTrack?: (eventName: string, params?: Record<string, unknown>) => void;
  }
}

export function trackAnalyticsEvent(event: AnalyticsEvent, params?: Record<string, unknown>) {
  if (typeof window === "undefined") {
    return;
  }

  if (typeof window.linkVaultTrack === "function") {
    window.linkVaultTrack(event, params ?? {});
  }
}
