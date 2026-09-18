import type { ReachState } from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";

/** How far a family got with a circular, as words and as a tone — shared by the report and its download. */
export const REACH_STATE_KEY: Record<ReachState, TranslationKey> = {
  ACKED: "circulars.stateAcked",
  SEEN: "circulars.stateSeen",
  TOLD: "circulars.stateTold",
  UNREACHED: "circulars.stateUnreached",
};

export const REACH_STATE_TONE: Record<ReachState, "ok" | "info" | "warn" | "danger"> = {
  ACKED: "ok",
  SEEN: "info",
  TOLD: "warn",
  UNREACHED: "danger",
};
