import type { TripRow } from "@edulink/contracts";
import type { Translate } from "@/lib/i18n/dictionary";

/** How a trip's status and direction are said and coloured, the same on every transport page. */
export function statusTone(status: TripRow["status"]): "ok" | "accent" | "neutral" | "danger" {
  return status === "LIVE" ? "ok" : status === "MISSED" ? "danger" : status === "ENDED" ? "neutral" : "accent";
}
export function statusLabel(t: Translate, status: TripRow["status"]): string {
  return t(status === "LIVE" ? "transport.statusLive" : status === "MISSED" ? "transport.statusMissed" : status === "ENDED" ? "transport.statusEnded" : "transport.statusScheduled");
}
export function directionLabel(t: Translate, direction: string): string {
  return t(direction === "MORNING" ? "transport.directionMorning" : direction === "EVENING" ? "transport.directionEvening" : "transport.directionBoth");
}
