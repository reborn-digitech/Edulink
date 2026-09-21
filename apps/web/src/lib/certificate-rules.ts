import type { CertificateKind, CertificateLayout, CertificateRow, CertificateTemplateSave } from "@edulink/contracts";
import { dictionaryFor, translatorFor, type TranslationKey } from "@edulink/i18n";
import { dateInFigures, dateInWords, type WordsLocale } from "./words";

/**
 * The rules of a certificate with no database in them: the placeholders a
 * template may use, how they are filled, and the presets a school starts
 * from — each in the language the document is written in.
 *
 * A PLACEHOLDER IS [[key]] — double square brackets, so the dictionary's own
 * {vars} never collide with it. A blank value prints as a dash and is named
 * on the issue screen, because a certificate with a silent gap is worse than
 * one that says what it lacks.
 */
export type Words = (key: string, vars?: Record<string, string | number>) => string;
const englishWords: Words = (key, vars) => translatorFor(dictionaryFor("en"))(key as TranslationKey, vars);
export const wordsFor = (locale: WordsLocale): Words => (key, vars) => translatorFor(dictionaryFor(locale))(key as TranslationKey, vars);

export const CERTIFICATE_KINDS: CertificateKind[] = ["TC", "NIRGAM", "BONAFIDE", "CHARACTER", "STUDY", "CUSTOM"];

export const PLACEHOLDER_KEYS = [
  "pupil.name", "pupil.studentCode", "pupil.dob", "pupil.dobWords", "pupil.age",
  "pupil.fatherName", "pupil.motherName", "pupil.parentage", "pupil.placeOfBirth", "pupil.nationality",
  "pupil.religion", "pupil.caste", "pupil.category", "pupil.motherTongue", "pupil.address",
  "pupil.admissionNumber", "pupil.admissionDate", "pupil.admittedToGrade", "pupil.previousSchool", "pupil.penNumber",
  "class.name", "class.grade", "school.name", "school.address", "school.code", "year.name",
  "record.leftOn", "record.leftOnWords", "record.reason", "record.conduct", "record.destination", "record.attendance", "record.lastClass",
  "issue.date", "issue.dateWords", "issue.serial", "issue.purpose", "issue.remark",
] as const;
export type PlaceholderKey = (typeof PLACEHOLDER_KEYS)[number];
export type CertificateData = Partial<Record<PlaceholderKey, string | null>>;

const PLACEHOLDER = /\[\[\s*([a-z]+\.[A-Za-z]+)\s*\]\]/g;
export const BLANK = "—";

/** The keys a text names. */
export function placeholderKeys(text: string): string[] {
  return [...text.matchAll(PLACEHOLDER)].map((m) => m[1]!);
}

/** The text with every placeholder filled; the keys that had nothing are returned so the issuer can be told. */
export function fill(text: string, data: CertificateData): { text: string; missing: string[] } {
  const missing = new Set<string>();
  const out = text.replace(PLACEHOLDER, (_whole, key: string) => {
    const value = (data as Record<string, string | null | undefined>)[key];
    if (value === undefined || value === null || value.trim() === "") {
      missing.add(key);
      return BLANK;
    }
    return value;
  });
  return { text: out, missing: [...missing] };
}

export function fillRows(rows: CertificateRow[], data: CertificateData): { rows: CertificateRow[]; missing: string[] } {
  const missing = new Set<string>();
  const out = rows.map((r) => {
    const f = fill(r.value, data);
    for (const k of f.missing) missing.add(k);
    return { label: r.label, value: f.text };
  });
  return { rows: out, missing: [...missing] };
}

export function defaultLayoutFor(words: Words = englishWords): CertificateLayout {
  return {
    showLogo: true,
    showAddress: true,
    useBrandColour: true,
    signatureLeft: words("certificateDefaults.signatureOffice"),
    signatureRight: words("reportCardDefaults.principal"),
    footerNote: null,
    paper: "A4",
  };
}

export function parseLayout(raw: string | null | undefined, words: Words = englishWords): CertificateLayout {
  const fallback = defaultLayoutFor(words);
  if (!raw) return fallback;
  try {
    return { ...fallback, ...(JSON.parse(raw) as Partial<CertificateLayout>) };
  } catch {
    return fallback;
  }
}

export function parseRows(raw: string | null | undefined): CertificateRow[] {
  if (!raw) return [];
  try {
    const rows = JSON.parse(raw) as unknown;
    return Array.isArray(rows) ? rows.filter((r): r is CertificateRow => typeof r?.label === "string" && typeof r?.value === "string") : [];
  } catch {
    return [];
  }
}

const SERIAL_PREFIX: Record<CertificateKind, string> = { TC: "TC", NIRGAM: "NU", BONAFIDE: "BC", CHARACTER: "CC", STUDY: "SC", CUSTOM: "CERT" };

export function kindTitle(kind: CertificateKind, words: Words): string {
  const key = { TC: "titleTc", NIRGAM: "titleNirgam", BONAFIDE: "titleBonafide", CHARACTER: "titleCharacter", STUDY: "titleStudy", CUSTOM: "titleCustom" }[kind];
  return words(`certificateDefaults.${key}`);
}

const row = (words: Words, labelKey: string, value: string): CertificateRow => ({ label: words(`certificateDefaults.${labelKey}`), value });

/** The register-style rows of a transfer or leaving certificate. */
function registerRows(words: Words): CertificateRow[] {
  return [
    row(words, "rowAdmissionNumber", "[[pupil.admissionNumber]]"),
    row(words, "rowName", "[[pupil.name]]"),
    row(words, "rowFather", "[[pupil.fatherName]]"),
    row(words, "rowMother", "[[pupil.motherName]]"),
    row(words, "rowNationality", "[[pupil.nationality]]"),
    row(words, "rowReligion", "[[pupil.religion]]"),
    row(words, "rowCaste", "[[pupil.caste]]"),
    row(words, "rowCategory", "[[pupil.category]]"),
    row(words, "rowMotherTongue", "[[pupil.motherTongue]]"),
    row(words, "rowPlaceOfBirth", "[[pupil.placeOfBirth]]"),
    row(words, "rowDob", "[[pupil.dob]]"),
    row(words, "rowDobWords", "[[pupil.dobWords]]"),
    row(words, "rowAdmissionDate", "[[pupil.admissionDate]]"),
    row(words, "rowAdmittedTo", "[[pupil.admittedToGrade]]"),
    row(words, "rowPreviousSchool", "[[pupil.previousSchool]]"),
    row(words, "rowLastClass", "[[record.lastClass]]"),
    row(words, "rowLeftOn", "[[record.leftOn]] ([[record.leftOnWords]])"),
    row(words, "rowReason", "[[record.reason]]"),
    row(words, "rowConduct", "[[record.conduct]]"),
    row(words, "rowAttendance", "[[record.attendance]]"),
    row(words, "rowPen", "[[pupil.penNumber]]"),
    row(words, "rowRemarks", "[[issue.remark]]"),
  ];
}

/** The presets a school starts from, in the language asked for. */
export function presetsFor(locale: WordsLocale, words: Words = wordsFor(locale)): (Omit<CertificateTemplateSave, "active"> & { key: string })[] {
  const layout = defaultLayoutFor(words);
  const d = (key: string) => words(`certificateDefaults.${key}`);
  return [
    { key: `TC-${locale}`, kind: "TC", name: kindTitle("TC", words), locale, title: kindTitle("TC", words), intro: d("tcIntro"), rows: registerRows(words), outro: d("tcOutro"), layout, serialPrefix: SERIAL_PREFIX.TC },
    { key: `NIRGAM-${locale}`, kind: "NIRGAM", name: kindTitle("NIRGAM", words), locale, title: kindTitle("NIRGAM", words), intro: d("nirgamIntro"), rows: registerRows(words), outro: d("nirgamOutro"), layout, serialPrefix: SERIAL_PREFIX.NIRGAM },
    {
      key: `BONAFIDE-${locale}`, kind: "BONAFIDE", name: kindTitle("BONAFIDE", words), locale, title: kindTitle("BONAFIDE", words), intro: d("bonafideIntro"),
      rows: [row(words, "rowAdmissionNumber", "[[pupil.admissionNumber]]"), row(words, "rowClass", "[[class.name]]"), row(words, "rowYear", "[[year.name]]"), row(words, "rowDob", "[[pupil.dob]]")],
      outro: d("bonafideOutro"), layout, serialPrefix: SERIAL_PREFIX.BONAFIDE,
    },
    {
      key: `CHARACTER-${locale}`, kind: "CHARACTER", name: kindTitle("CHARACTER", words), locale, title: kindTitle("CHARACTER", words), intro: d("characterIntro"),
      rows: [row(words, "rowAdmissionNumber", "[[pupil.admissionNumber]]"), row(words, "rowClass", "[[class.name]]"), row(words, "rowConduct", "[[record.conduct]]")],
      outro: d("characterOutro"), layout, serialPrefix: SERIAL_PREFIX.CHARACTER,
    },
    {
      key: `STUDY-${locale}`, kind: "STUDY", name: kindTitle("STUDY", words), locale, title: kindTitle("STUDY", words), intro: d("studyIntro"),
      rows: [row(words, "rowAdmissionNumber", "[[pupil.admissionNumber]]"), row(words, "rowAdmissionDate", "[[pupil.admissionDate]]"), row(words, "rowAdmittedTo", "[[pupil.admittedToGrade]]"), row(words, "rowClass", "[[class.name]]"), row(words, "rowPen", "[[pupil.penNumber]]")],
      outro: d("studyOutro"), layout, serialPrefix: SERIAL_PREFIX.STUDY,
    },
  ];
}

/** Every preset in every language, for the office's picker. */
export function allPresets(): (Omit<CertificateTemplateSave, "active"> & { key: string })[] {
  return (["en", "hi", "mr"] as const).flatMap((locale) => presetsFor(locale));
}

export type PupilFacts = {
  name: string;
  studentCode: string | null;
  birthdateKey: string | null;
  ageYears: number | null;
  record: {
    fatherName: string | null; motherName: string | null; placeOfBirth: string | null; nationality: string | null; religion: string | null; caste: string | null; category: string | null; motherTongue: string | null;
    addressLine: string | null; city: string | null; postalCode: string | null; admissionNumber: string | null; admissionDateKey: string | null; admittedToGrade: string | null; previousSchool: string | null; penNumber: string | null;
  } | null;
  className: string | null;
  gradeLevel: string | null;
  school: { name: string; code: string; address: string | null };
  yearName: string | null;
  leaving: { leftOnKey: string | null; reason: string | null; conduct: string | null; destination: string | null; attendance: string | null; lastClass: string | null } | null;
  issue: { dateKey: string; serial: string; purpose: string | null; remark: string | null };
};

/** Every placeholder's value for one pupil, in the document's language. */
export function dataFor(facts: PupilFacts, locale: WordsLocale, words: Words = wordsFor(locale)): CertificateData {
  const r = facts.record;
  const parentage = r?.fatherName && r?.motherName ? words("certificateDefaults.childOf", { father: r.fatherName, mother: r.motherName }) : null;
  const address = r ? [r.addressLine, r.city, r.postalCode].filter(Boolean).join(", ") || null : null;
  const reasonKey = facts.leaving?.reason ? ({ TRANSFERRED: "tc.reasonTransferred", GRADUATED: "tc.reasonGraduated", LEFT: "tc.reasonLeft" } as Record<string, string>)[facts.leaving.reason] : null;
  const conductKey = facts.leaving?.conduct ? ({ EXCELLENT: "tc.conductExcellent", GOOD: "tc.conductGood", SATISFACTORY: "tc.conductSatisfactory" } as Record<string, string>)[facts.leaving.conduct] : null;
  return {
    "pupil.name": facts.name,
    "pupil.studentCode": facts.studentCode,
    "pupil.dob": facts.birthdateKey ? dateInFigures(facts.birthdateKey) : null,
    "pupil.dobWords": facts.birthdateKey ? dateInWords(facts.birthdateKey, locale) : null,
    "pupil.age": facts.ageYears === null ? null : String(facts.ageYears),
    "pupil.fatherName": r?.fatherName ?? null,
    "pupil.motherName": r?.motherName ?? null,
    "pupil.parentage": parentage,
    "pupil.placeOfBirth": r?.placeOfBirth ?? null,
    "pupil.nationality": r?.nationality ?? null,
    "pupil.religion": r?.religion ?? null,
    "pupil.caste": r?.caste ?? null,
    "pupil.category": r?.category ?? null,
    "pupil.motherTongue": r?.motherTongue ?? null,
    "pupil.address": address,
    "pupil.admissionNumber": r?.admissionNumber ?? null,
    "pupil.admissionDate": r?.admissionDateKey ? dateInFigures(r.admissionDateKey) : null,
    "pupil.admittedToGrade": r?.admittedToGrade ?? null,
    "pupil.previousSchool": r?.previousSchool ?? null,
    "pupil.penNumber": r?.penNumber ?? null,
    "class.name": facts.className,
    "class.grade": facts.gradeLevel,
    "school.name": facts.school.name,
    "school.address": facts.school.address,
    "school.code": facts.school.code,
    "year.name": facts.yearName,
    "record.leftOn": facts.leaving?.leftOnKey ? dateInFigures(facts.leaving.leftOnKey) : null,
    "record.leftOnWords": facts.leaving?.leftOnKey ? dateInWords(facts.leaving.leftOnKey, locale) : null,
    "record.reason": reasonKey ? words(reasonKey) : null,
    "record.conduct": conductKey ? words(conductKey) : null,
    "record.destination": facts.leaving?.destination ?? null,
    "record.attendance": facts.leaving?.attendance ?? null,
    "record.lastClass": facts.leaving?.lastClass ?? facts.className,
    "issue.date": dateInFigures(facts.issue.dateKey),
    "issue.dateWords": dateInWords(facts.issue.dateKey, locale),
    "issue.serial": facts.issue.serial,
    "issue.purpose": facts.issue.purpose,
    "issue.remark": facts.issue.remark,
  };
}

/** The pupil-record fields a certificate needs before it can be issued without gaps. */
export const REQUIRED_RECORD_FIELDS = ["fatherName", "motherName", "placeOfBirth", "nationality", "motherTongue", "addressLine", "city", "admissionNumber", "admissionDate"] as const;
export const OPTIONAL_RECORD_FIELDS = ["religion", "caste", "category", "postalCode", "admittedToGrade", "previousSchool", "penNumber"] as const;
