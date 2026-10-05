import type { TranslationKey } from "@edulink/i18n";
import type { HostelLeaveRow } from "@edulink/contracts";
import { formatDateTime, instantFromTyped } from "@/lib/dates";

/** The hostel's coded words on the phone, as the web's components/hostel/parts.tsx has them. */
export const LEAVE_KIND_KEY: Record<HostelLeaveRow["kind"], TranslationKey> = { HOME: "hostel.kindHOME", LOCAL: "hostel.kindLOCAL", MEDICAL: "hostel.kindMEDICAL", NIGHT_OUT: "collegeOffice.kindNIGHT_OUT" };
export const LEAVE_STATUS_KEY: Record<HostelLeaveRow["status"], TranslationKey> = { AWAITING_CONSENT: "hostel.statusAWAITING_CONSENT", PENDING: "hostel.statusPENDING", APPROVED: "hostel.statusAPPROVED", DECLINED: "hostel.statusDECLINED", CANCELLED: "hostel.statusCANCELLED" };
export const ROLL_KEY: Record<"PRESENT" | "ON_LEAVE" | "ABSENT" | "NOT_TAKEN", TranslationKey> = { PRESENT: "hostel.rollPRESENT", ON_LEAVE: "hostel.rollON_LEAVE", ABSENT: "hostel.rollABSENT", NOT_TAKEN: "hostel.rollNOT_TAKEN" };
export const SLOT_KEY: Record<"MORNING" | "NIGHT", TranslationKey> = { MORNING: "hostel.slotMORNING", NIGHT: "hostel.slotNIGHT" };
export const MEAL_KEY: Record<"BREAKFAST" | "LUNCH" | "SNACKS" | "DINNER", TranslationKey> = { BREAKFAST: "hostel.mealBREAKFAST", LUNCH: "hostel.mealLUNCH", SNACKS: "hostel.mealSNACKS", DINNER: "hostel.mealDINNER" };

/** "04/10/2026 18:30" for an instant, in the device's own zone (src/lib/dates.ts). */
export function whenOf(iso: string, _locale?: string): string {
  return formatDateTime(iso);
}

/** "04/10/2026 18:30" typed on the phone (the older "2026-10-04 18:30" too), as an instant in the device's zone; null if it cannot be read. */
export function instantOf(typed: string): string | null {
  return instantFromTyped(typed);
}

/** The example under a leave's from and to fields, in the shape the app prints and reads: dd/mm/yyyy HH:mm. */
export const WHEN_HINT = "25/10/2026 16:00";
