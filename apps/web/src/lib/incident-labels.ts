import type { IncidentKind, IncidentSeverity } from "@edulink/contracts";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * The words and the colours for an incident, shared by every page that draws
 * one — the log, the record, the pupil's file, the roster chip, the family's
 * page — so a "Serious" injury is red on all of them and never only on one.
 * Plain data, importable from the server and the browser alike.
 */
export const INCIDENT_KIND_KEY: Record<IncidentKind, TranslationKey> = {
  INJURY: "incidents.kindInjury",
  ILLNESS: "incidents.kindIllness",
  BEHAVIOUR: "incidents.kindBehaviour",
  SAFEGUARDING: "incidents.kindSafeguarding",
  OTHER: "incidents.kindOther",
};

export const INCIDENT_SEVERITY_KEY: Record<IncidentSeverity, TranslationKey> = {
  MINOR: "incidents.severityMinor",
  MODERATE: "incidents.severityModerate",
  SERIOUS: "incidents.severitySerious",
};

/** Never colour alone: the badge carries its word, the tone only underlines it. */
export const INCIDENT_SEVERITY_TONE: Record<IncidentSeverity, "neutral" | "warn" | "danger"> = {
  MINOR: "neutral",
  MODERATE: "warn",
  SERIOUS: "danger",
};
