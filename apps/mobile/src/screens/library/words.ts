import type { TranslationKey } from "@edulink/i18n";
import type { LibraryFine } from "@edulink/contracts";

/** The library's coded words on the phone, as the web's components/library/parts.tsx has them. */
export const COPY_STATUS_KEY: Record<"AVAILABLE" | "ISSUED" | "LOST" | "WITHDRAWN" | "REPAIR", TranslationKey> = { AVAILABLE: "library.copyAVAILABLE", ISSUED: "library.copyISSUED", LOST: "library.copyLOST", WITHDRAWN: "library.copyWITHDRAWN", REPAIR: "library.copyREPAIR" };
export const FINE_REASON_KEY: Record<LibraryFine["reason"], TranslationKey> = { OVERDUE: "library.reasonOVERDUE", DAMAGE: "library.reasonDAMAGE", LOST: "library.reasonLOST" };
export const FINE_STATUS_KEY: Record<LibraryFine["status"], TranslationKey> = { DUE: "library.fineDUE", PAID: "library.finePAID", WAIVED: "library.fineWAIVED" };

/** "4 Oct 2026" from a YYYY-MM-DD key, in the reader's language with Latin digits. */
export function dayOf(key: string, locale: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return key;
  const tag = locale === "en" ? "en-IN" : `${locale}-IN-u-nu-latn`;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))).toLocaleDateString(tag, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
