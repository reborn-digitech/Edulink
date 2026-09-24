import type { AdmissionStatus } from "@edulink/contracts";
import type { TranslationKey } from "@/lib/i18n/dictionary";

/**
 * The words for an application's stage, a cycle's state and the applicant's
 * relation, shared by the office's pipeline, the family's list and the
 * school's page. Kept out of src/lib so a client component can hold it
 * without dragging the server-only library into the bundle.
 */
export type BadgeTone =
  "neutral" | "accent" | "ok" | "warn" | "danger" | "info";

export const ADMISSION_STATUS_KEY: Record<AdmissionStatus, TranslationKey> = {
  SUBMITTED: "admissions.statusSubmitted",
  OFFERED: "admissions.statusOffered",
  ACCEPTED: "admissions.statusAccepted",
  ADMITTED: "admissions.statusAdmitted",
  DECLINED: "admissions.statusDeclined",
  WAITLISTED: "admissions.statusWaitlisted",
  WITHDRAWN: "admissions.statusWithdrawn",
  EXPIRED: "admissions.statusExpired",
};

export const ADMISSION_STATUS_TONE: Record<AdmissionStatus, BadgeTone> = {
  SUBMITTED: "info",
  OFFERED: "accent",
  ACCEPTED: "ok",
  ADMITTED: "ok",
  DECLINED: "danger",
  WAITLISTED: "warn",
  WITHDRAWN: "neutral",
  EXPIRED: "neutral",
};

export const ADMISSION_STATUSES: AdmissionStatus[] = [
  "SUBMITTED",
  "OFFERED",
  "ACCEPTED",
  "ADMITTED",
  "DECLINED",
  "WAITLISTED",
  "WITHDRAWN",
  "EXPIRED",
];

export type CycleStatus = "DRAFT" | "OPEN" | "CLOSED";
export const CYCLE_STATUS_KEY: Record<CycleStatus, TranslationKey> = {
  DRAFT: "admissions.statusDraft",
  OPEN: "admissions.statusOpen",
  CLOSED: "admissions.statusClosed",
};
export const CYCLE_STATUS_TONE: Record<CycleStatus, BadgeTone> = {
  DRAFT: "neutral",
  OPEN: "ok",
  CLOSED: "warn",
};

export const RELATIONS = ["PARENT", "GUARDIAN", "OTHER"] as const;
export type Relation = (typeof RELATIONS)[number];
export const RELATION_KEY: Record<Relation, TranslationKey> = {
  PARENT: "admissions.relationParent",
  GUARDIAN: "admissions.relationGuardian",
  OTHER: "admissions.relationOther",
};
export const relationKey = (relation: string): TranslationKey =>
  RELATION_KEY[
    (RELATIONS as readonly string[]).includes(relation)
      ? (relation as Relation)
      : "OTHER"
  ];

/** The family's next step, from where the application stands and what it still lacks. */
export function nextStepKey(
  status: AdmissionStatus,
  needs: { documents: boolean; booking: boolean },
): TranslationKey {
  switch (status) {
    case "SUBMITTED":
    case "WAITLISTED":
    case "ACCEPTED":
      return needs.documents
        ? "admissions.nextDocuments"
        : needs.booking
          ? "admissions.nextBook"
          : "admissions.nextWait";
    case "OFFERED":
      return "admissions.nextRespond";
    case "ADMITTED":
      return "admissions.nextAdmitted";
    default:
      return "admissions.nextSettled";
  }
}

/** The document key the editor derives from a name: lowercase, underscores, the contract's shape. Blank when the name has no Latin letters. */
export function documentKeyFrom(name: string): string {
  const key = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 31);
  if (!key) return "";
  return /^[a-z]/.test(key) ? key : `d_${key}`.slice(0, 31);
}
