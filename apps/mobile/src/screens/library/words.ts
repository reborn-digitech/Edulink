import type { TranslationKey } from "@edulink/i18n";
import type { LibraryFine } from "@edulink/contracts";
import { formatDate } from "@/lib/dates";

/** The library's coded words on the phone, as the web's components/library/parts.tsx has them. */
export const COPY_STATUS_KEY: Record<"AVAILABLE" | "ISSUED" | "LOST" | "WITHDRAWN" | "REPAIR", TranslationKey> = { AVAILABLE: "library.copyAVAILABLE", ISSUED: "library.copyISSUED", LOST: "library.copyLOST", WITHDRAWN: "library.copyWITHDRAWN", REPAIR: "library.copyREPAIR" };
export const FINE_REASON_KEY: Record<LibraryFine["reason"], TranslationKey> = { OVERDUE: "library.reasonOVERDUE", DAMAGE: "library.reasonDAMAGE", LOST: "library.reasonLOST" };
export const FINE_STATUS_KEY: Record<LibraryFine["status"], TranslationKey> = { DUE: "library.fineDUE", PAID: "library.finePAID", WAIVED: "library.fineWAIVED" };

/** "04/10/2026" from a YYYY-MM-DD key (src/lib/dates.ts). */
export function dayOf(key: string, _locale?: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(key) ? formatDate(key) : key;
}
