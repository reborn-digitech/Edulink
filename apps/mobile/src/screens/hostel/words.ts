import type { TranslationKey } from "@edulink/i18n";
import type { HostelLeaveRow } from "@edulink/contracts";

/** The hostel's coded words on the phone, as the web's components/hostel/parts.tsx has them. */
export const LEAVE_KIND_KEY: Record<HostelLeaveRow["kind"], TranslationKey> = { HOME: "hostel.kindHOME", LOCAL: "hostel.kindLOCAL", MEDICAL: "hostel.kindMEDICAL" };
export const LEAVE_STATUS_KEY: Record<HostelLeaveRow["status"], TranslationKey> = { AWAITING_CONSENT: "hostel.statusAWAITING_CONSENT", PENDING: "hostel.statusPENDING", APPROVED: "hostel.statusAPPROVED", DECLINED: "hostel.statusDECLINED", CANCELLED: "hostel.statusCANCELLED" };
export const ROLL_KEY: Record<"PRESENT" | "ON_LEAVE" | "ABSENT" | "NOT_TAKEN", TranslationKey> = { PRESENT: "hostel.rollPRESENT", ON_LEAVE: "hostel.rollON_LEAVE", ABSENT: "hostel.rollABSENT", NOT_TAKEN: "hostel.rollNOT_TAKEN" };
export const SLOT_KEY: Record<"MORNING" | "NIGHT", TranslationKey> = { MORNING: "hostel.slotMORNING", NIGHT: "hostel.slotNIGHT" };
export const MEAL_KEY: Record<"BREAKFAST" | "LUNCH" | "SNACKS" | "DINNER", TranslationKey> = { BREAKFAST: "hostel.mealBREAKFAST", LUNCH: "hostel.mealLUNCH", SNACKS: "hostel.mealSNACKS", DINNER: "hostel.mealDINNER" };

/** "4 Oct, 6:30 pm" for an instant, in the reader's language with Latin digits and the device's own zone. */
export function whenOf(iso: string, locale: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const tag = locale === "en" ? "en-IN" : `${locale}-IN-u-nu-latn`;
  return d.toLocaleString(tag, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

/** "2026-10-04 18:30" typed on the phone, as an instant in the device's zone; null if it cannot be read. */
export function instantOf(typed: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})$/.exec(typed.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  return Number.isNaN(d.getTime()) || d.getMonth() !== Number(m[2]) - 1 ? null : d.toISOString();
}
