import type { PaperSignatureView } from "@edulink/contracts";
import type { Translate, TranslationKey } from "./i18n/dictionary";

/**
 * WHO SIGNED, PRINTED UNDER THE LINE (TA-326, the owner's decision of 14 November 2026).
 *
 * A line's caption is the school's own free text and is independent of who signs the line, so a paper could read
 * "Principal" under the office's signature. Under each signature already given the paper now also prints the
 * signer's name and the office they signed as, "Signed by A. Patil, Office", from what the paper stored at signing
 * (the row's role and signerName); the caption stays as typed and is neither refilled nor refused. It shows a
 * mismatch rather than preventing it. A line that waits or was declined prints nothing more.
 *
 * The office words are the ones the presets already caption these lines with. The caller passes the translator of
 * the language the paper is read in: a certificate's own language, a report card's reader's (its PDF follows the
 * reader). The phone has its own copy of this rule in screens/shared/certificate.tsx.
 */
const OFFICE_WORD: Record<PaperSignatureView["role"], TranslationKey> = {
  ADMIN: "certificateDefaults.signatureOffice",
  PRINCIPAL: "reportCardDefaults.principal",
  TEACHER: "reportCardDefaults.classTeacher",
};

export function signerLine(signature: Pick<PaperSignatureView, "status" | "role" | "signerName"> | undefined, t: Translate): string | null {
  const name = signature?.signerName?.trim();
  if (!signature || signature.status !== "SIGNED" || !name) return null;
  return t("signatures.signedByOffice", { name, office: t(OFFICE_WORD[signature.role]) });
}
