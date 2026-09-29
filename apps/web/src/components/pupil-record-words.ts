import { CWSN_NONE, PUPIL_CATEGORIES, PUPIL_RELIGIONS, type MotherTongue, type Nationality, type PupilRecordField } from "@edulink/contracts";
import { CWSN_TYPE_NAMES } from "@/lib/filing-codes";
import type { TranslationKey } from "@/lib/i18n/dictionary";

/**
 * The record's coded answers as the words a reader sees: the form's lists
 * and the lines of a family's ask read from the same table, so "MARATHI" is
 * never shown to anybody as a code.
 */
export const LANGUAGE_KEY = { ASSAMESE: "pupilRecord.langAssamese", BENGALI: "pupilRecord.langBengali", BODO: "pupilRecord.langBodo", DOGRI: "pupilRecord.langDogri", ENGLISH: "pupilRecord.langEnglish", GUJARATI: "pupilRecord.langGujarati", HINDI: "pupilRecord.langHindi", KANNADA: "pupilRecord.langKannada", KASHMIRI: "pupilRecord.langKashmiri", KONKANI: "pupilRecord.langKonkani", MAITHILI: "pupilRecord.langMaithili", MALAYALAM: "pupilRecord.langMalayalam", MANIPURI: "pupilRecord.langManipuri", MARATHI: "pupilRecord.langMarathi", NEPALI: "pupilRecord.langNepali", ODIA: "pupilRecord.langOdia", PUNJABI: "pupilRecord.langPunjabi", SANSKRIT: "pupilRecord.langSanskrit", SANTALI: "pupilRecord.langSantali", SINDHI: "pupilRecord.langSindhi", TAMIL: "pupilRecord.langTamil", TELUGU: "pupilRecord.langTelugu", URDU: "pupilRecord.langUrdu", OTHER: "pupilRecord.langOther" } as const satisfies Record<MotherTongue, TranslationKey>;
export const NATIONALITY_KEY = { INDIAN: "pupilRecord.natIndian", NEPALI: "pupilRecord.natNepali", BHUTANESE: "pupilRecord.natBhutanese", BANGLADESHI: "pupilRecord.natBangladeshi", SRI_LANKAN: "pupilRecord.natSriLankan", OTHER: "pupilRecord.natOther" } as const satisfies Record<Nationality, TranslationKey>;

type T = (key: TranslationKey, vars?: Record<string, string | number>) => string;

/** One stored value as words; a value typed before the lists shows as itself. */
export function recordValueText(t: T, field: PupilRecordField, value: string | null): string {
  if (value === null || value === "") return t("recordChanges.blank");
  if (field === "bpl" || field === "ews" || field === "rte" || field === "repeating") return value === "yes" ? t("pupilRecord.yes") : value === "no" ? t("pupilRecord.no") : value;
  if (field === "gender") return value === "M" ? t("pupilRecord.genderM") : value === "F" ? t("pupilRecord.genderF") : value === "T" ? t("pupilRecord.genderT") : value;
  if (field === "cwsnType") return value === CWSN_NONE ? t("pupilRecord.cwsnNone") : CWSN_TYPE_NAMES[value] ? `${value} — ${CWSN_TYPE_NAMES[value]}` : value;
  if (field === "motherTongue") return value in LANGUAGE_KEY ? t(LANGUAGE_KEY[value as MotherTongue]) : value;
  if (field === "nationality") return value in NATIONALITY_KEY ? t(NATIONALITY_KEY[value as Nationality]) : value;
  if (field === "category") return (PUPIL_CATEGORIES as readonly string[]).includes(value) ? t(`pupilRecord.cat${value === "GENERAL" ? "General" : value}` as TranslationKey) : value;
  if (field === "religion") return (PUPIL_RELIGIONS as readonly string[]).includes(value) ? t(`pupilRecord.rel${value[0]}${value.slice(1).toLowerCase()}` as TranslationKey) : value;
  return value;
}
