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


/**
 * THE REPORT CARD'S CODED DEFAULTS (A3-states-18, risks batch): a band's
 * descriptor ("Needs improvement"), a co-scholastic area ("Physical
 * education", "Work education") and the scale's words, as report-card-rules.ts
 * `defaultConfigFor` writes them into a school's rules in English when the
 * school had no locale yet (the fixtures, an English-first school). A reader
 * in Hindi or Marathi saw them in English on the card and on the office's
 * preview. The same rule as above: translated at render only while the text
 * is still, character for character, the English default; once the office
 * retypes it, it is the school's word and is shown as typed.
 */
const REPORT_CARD_DEFAULTS: Map<string, TranslationKey> = new Map(
  (
    [
      "outstanding",
      "excellent",
      "veryGood",
      "good",
      "fair",
      "average",
      "belowAverage",
      "needsImprovement",
      "distinction",
      "firstClass",
      "secondClass",
      "passClass",
      "notPassed",
      "workEducation",
      "artEducation",
      "physicalEducation",
      "discipline",
    ] as const
  ).map((k) => [english(`reportCardDefaults.${k}` as TranslationKey), `reportCardDefaults.${k}` as TranslationKey]),
);

/** A band's descriptor, a co-scholastic area or a scale word: the reader's word while it is the English default, else as typed. */
export function reportCardDefaultLabel(text: string, t: Translate): string {
  const key = REPORT_CARD_DEFAULTS.get(text);
  return key ? t(key) : text;
}

/** The same lookup as a plain object, for a client component (the office's preview) that has no English dictionary. */
export function reportCardDefaultLabels(t: Translate): Record<string, string> {
  return Object.fromEntries([...REPORT_CARD_DEFAULTS].map(([englishText, key]) => [englishText, t(key)]));
}
