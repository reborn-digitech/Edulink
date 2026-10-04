import "server-only";
import { dictionaryFor, translatorFor } from "@edulink/i18n";
import type { Translate, TranslationKey } from "./i18n/dictionary";

/**
 * A certificate template's name and an issued certificate's title, read back
 * in the reader's language while it is still the English default a preset
 * wrote (B-15, 4 Oct 2026; the rule is in coded-defaults.ts). Server only:
 * knowing the defaults needs the English dictionary, which no client bundle
 * should carry.
 */
const english = translatorFor(dictionaryFor("en"));

/**
 * The names a certificate preset gives its template and its certificates'
 * title (certificate-rules.ts `kindTitle`, `collegeBonafideName`), in English.
 */
const CERTIFICATE_DEFAULTS: Map<string, TranslationKey> = new Map(
  ([
    "certificateDefaults.titleTc",
    "certificateDefaults.titleNirgam",
    "certificateDefaults.titleBonafide",
    "certificateDefaults.titleCharacter",
    "certificateDefaults.titleStudy",
    "certificateDefaults.titleCustom",
    "certificateDefaults.titleMigration",
    "certificateDefaults.titleProvisional",
    "certificateDefaults.titleCourseCompletion",
    "certificateDefaults.collegeBonafideName",
  ] as TranslationKey[]).map((key) => [english(key), key]),
);

/** A certificate template's name or an issued certificate's title, for a list or a heading. */
export function certificateNameLabel(name: string, t: Translate): string {
  const key = CERTIFICATE_DEFAULTS.get(name);
  return key ? t(key) : name;
}

