import type { CertificateKind } from "@edulink/contracts";
import { LOCALES } from "@edulink/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";

/**
 * The words for a certificate's kind and the language it is written in,
 * shared by the office's pages, the family's list and the document itself.
 * Kept out of src/lib so a client component can hold it without dragging a
 * server-only library into the bundle.
 */
export const CERTIFICATE_KIND_KEY: Record<CertificateKind, TranslationKey> = {
  TC: "certificates.kindTc",
  NIRGAM: "certificates.kindNirgam",
  BONAFIDE: "certificates.kindBonafide",
  CHARACTER: "certificates.kindCharacter",
  STUDY: "certificates.kindStudy",
  CUSTOM: "certificates.kindCustom",
  MIGRATION: "certificateDefaults.titleMigration",
  PROVISIONAL: "certificateDefaults.titleProvisional",
  COURSE_COMPLETION: "certificateDefaults.titleCourseCompletion",
};

/** "हिन्दी", not "Hindi": a document's language named in itself. */
export function localeName(code: string): string {
  return LOCALES.find((l) => l.code === code)?.native ?? code;
}
