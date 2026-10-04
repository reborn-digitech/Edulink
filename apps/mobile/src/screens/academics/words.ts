import type { TranslationKey } from "@edulink/i18n";
import type { CourseAttendance } from "@edulink/contracts";

/** The academics module's coded words on the phone, as the web's components/academics/parts.tsx has them. */
export const MARK_KEY: Record<"PRESENT" | "ABSENT" | "LATE", TranslationKey> = { PRESENT: "academics.markPRESENT", ABSENT: "academics.markABSENT", LATE: "academics.markLATE" };
export const KIND_KEY: Record<string, TranslationKey> = { CORE: "academics.kindCORE", ELECTIVE: "academics.kindELECTIVE", MINOR: "academics.kindMINOR", HONOURS: "academics.kindHONOURS", OPEN: "academics.kindOPEN" };
export const LECTURE_KIND_KEY: Record<string, TranslationKey> = { LECTURE: "academics.lectureLECTURE", LAB: "academics.lectureLAB", TUTORIAL: "academics.lectureTUTORIAL" };
export const GROUND_KEY: Record<string, TranslationKey> = { MEDICAL: "academics.groundMEDICAL", SPORTS: "academics.groundSPORTS", NCC_NSS: "academics.groundNCC_NSS", CULTURAL: "academics.groundCULTURAL", BEREAVEMENT: "academics.groundBEREAVEMENT", OTHER: "academics.groundOTHER" };
export const CONDONATION_KEY: Record<string, TranslationKey> = { ASKED: "academics.condASKED", HOD_APPROVED: "academics.condHOD_APPROVED", FORWARDED: "academics.condFORWARDED", PRINCIPAL_APPROVED: "academics.condPRINCIPAL_APPROVED", REFUSED: "academics.condREFUSED" };
export const INTERNAL_KIND_KEY: Record<string, TranslationKey> = { UNIT_TEST: "academics.internalUNIT_TEST", ASSIGNMENT: "academics.internalASSIGNMENT", PRACTICAL: "academics.internalPRACTICAL", VIVA: "academics.internalVIVA", PROJECT: "academics.internalPROJECT" };
export const FLAG_KEY: Record<string, TranslationKey> = { NONE: "academics.flagNONE", SLOW: "academics.flagSLOW", ADVANCED: "academics.flagADVANCED", COUNSELLING: "academics.flagCOUNSELLING" };
export const ITEM_KEY: Record<string, TranslationKey> = { RESOURCE: "academics.itemRESOURCE", NOTES: "academics.itemNOTES", QUESTION_PAPER: "academics.itemQUESTION_PAPER", MODEL_ANSWER: "academics.itemMODEL_ANSWER", LINK: "academics.itemLINK" };

/** "09:00–09:50" from minutes after midnight. */
export function clock(start: number, end: number): string {
  const hm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
  return `${hm(start)}–${hm(end)}`;
}

type T = (key: TranslationKey, vars?: Record<string, string | number>) => string;

/** "may miss 3 more", "on the line", or "4 short": the web's projectionText. */
export function projectionText(t: T, a: Pick<CourseAttendance, "canMiss" | "remaining" | "held">): string {
  if (a.held === 0 && a.remaining === 0) return t("academics.projectionNone");
  if (a.canMiss > 0) return t("academics.projectionMiss", { n: a.canMiss, remaining: a.remaining });
  if (a.canMiss === 0) return t("academics.projectionNoMore", { remaining: a.remaining });
  return t("academics.projectionShort", { n: -a.canMiss });
}

/** The standing of one course: condoned, not yet marked, at or above the line, or under it. */
export function standingText(t: T, a: Pick<CourseAttendance, "eligible" | "condoned" | "threshold" | "percent">): string {
  if (a.condoned) return t("academics.condoned");
  if (a.percent === null) return t("academics.notYet");
  return t(a.eligible ? "academics.aboveLine" : "academics.belowLine", { threshold: a.threshold });
}
