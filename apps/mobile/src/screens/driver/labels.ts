import type { TripStatus } from "@edulink/contracts";
import type { TranslationKey } from "@edulink/i18n";

/** How a trip's status and direction are said, on the driver's and the family's screens alike. */
export const STATUS_KEY: Record<TripStatus, TranslationKey> = {
  SCHEDULED: "transport.statusScheduled",
  LIVE: "transport.statusLive",
  ENDED: "transport.statusEnded",
  MISSED: "transport.statusMissed",
};
export const DIRECTION_KEY: Record<string, TranslationKey> = { MORNING: "transport.directionMorning", EVENING: "transport.directionEvening", BOTH: "transport.directionBoth" };
