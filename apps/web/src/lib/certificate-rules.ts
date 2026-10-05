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

export const CERTIFICATE_KINDS: CertificateKind[] = ["TC", "NIRGAM", "BONAFIDE", "CHARACTER", "STUDY", "CUSTOM", "MIGRATION", "PROVISIONAL", "COURSE_COMPLETION", "APPOINTMENT"];
/**
 * The kinds issued to a MEMBER OF STAFF rather than a pupil (risks batch 5A, 5 Oct 2026): filled from the staff
 * record with the `staff.*` placeholders (and the school's, the year's and the issue's), through
 * `issueAppointmentLetter`; refused by the pupil's issue, never offered to a family's ask.
 */
export const STAFF_CERTIFICATE_KINDS: CertificateKind[] = ["APPOINTMENT"];
export const isStaffKind = (kind: string): boolean => (STAFF_CERTIFICATE_KINDS as string[]).includes(kind);
/** The kinds only a college issues (4 Oct 2026). */
export const COLLEGE_CERTIFICATE_KINDS: CertificateKind[] = ["MIGRATION", "PROVISIONAL", "COURSE_COMPLETION"];

export const PLACEHOLDER_KEYS = [
  "pupil.name", "pupil.dob", "pupil.dobWords", "pupil.age",
  "pupil.fatherName", "pupil.motherName", "pupil.parentage", "pupil.placeOfBirth", "pupil.nationality",
  "pupil.religion", "pupil.caste", "pupil.category", "pupil.motherTongue", "pupil.address",
  "pupil.admissionNumber", "pupil.admissionDate", "pupil.admittedToGrade", "pupil.previousSchool", "pupil.penNumber",
  "class.name", "class.grade", "school.name", "school.address", "year.name",
  "record.leftOn", "record.leftOnWords", "record.reason", "record.conduct", "record.destination", "record.attendance", "record.lastClass",
  "issue.date", "issue.dateWords", "issue.serial", "issue.purpose", "issue.remark",
  // A college's (4 Oct 2026; college-records.ts collegeFacts): a dash at a school.
  "college.programme", "college.prn", "college.yearOfEntry", "college.yearOfPassing", "college.result", "college.apaarId", "college.abcId",
  // A member of staff's (risks batch 5A, 5 Oct 2026; certificates.ts staffFactsFor): an appointment letter's, a dash on a pupil's paper.
  "staff.name", "staff.designation", "staff.department", "staff.staffNumber", "staff.joinedOn", "staff.joinedOnWords", "staff.qualification", "staff.appointmentType",
] as const;
/** The placeholders a staff paper may use: its own, and the school's, the year's and the issue's. */
export function placeholderFitsKind(key: string, kind: string): boolean {
  const staffKey = key.startsWith("staff.");
  const shared = key.startsWith("school.") || key.startsWith("year.") || key.startsWith("issue.");
  return isStaffKind(kind) ? staffKey || shared : !staffKey;
}
/**
 * NOT IN THE LIST, ON PURPOSE: the pupil's student code and the school's join
 * code. Each opens something — with the date of birth the first is what a
 * guardian's claim asks for, and the second lets its holder join the school
 * — and a certificate is a paper that changes hands. The school's register
 * number (`pupil.admissionNumber`) is the number a certificate carries.
 */
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
    font: "default",
    introFont: "default",
    outroFont: "default",
    signerLeft: "NONE",
    signerRight: "NONE",
    showSeal: false,
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

const SERIAL_PREFIX: Record<CertificateKind, string> = { TC: "TC", NIRGAM: "NU", BONAFIDE: "BC", CHARACTER: "CC", STUDY: "SC", CUSTOM: "CERT", MIGRATION: "MC", PROVISIONAL: "PC", COURSE_COMPLETION: "CCC", APPOINTMENT: "AL" };

export function kindTitle(kind: CertificateKind, words: Words): string {
  const key = { TC: "titleTc", NIRGAM: "titleNirgam", BONAFIDE: "titleBonafide", CHARACTER: "titleCharacter", STUDY: "titleStudy", CUSTOM: "titleCustom", MIGRATION: "titleMigration", PROVISIONAL: "titleProvisional", COURSE_COMPLETION: "titleCourseCompletion", APPOINTMENT: "titleAppointment" }[kind];
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

/**
 * A COLLEGE'S PRESETS (4 Oct 2026): a bonafide naming the programme and PRN,
 * and the migration, provisional and course-completion certificates, whose
 * year of passing and result come from the exams module's published result.
 */
export function collegePresetsFor(locale: WordsLocale, words: Words = wordsFor(locale)): (Omit<CertificateTemplateSave, "active"> & { key: string })[] {
  const layout = defaultLayoutFor(words);
  const d = (key: string) => words(`certificateDefaults.${key}`);
  const base = [row(words, "rowName", "[[pupil.name]]"), row(words, "rowProgramme", "[[college.programme]]"), row(words, "rowPrn", "[[college.prn]]"), row(words, "rowYearOfEntry", "[[college.yearOfEntry]]")];
  const passing = [...base, row(words, "rowYearOfPassing", "[[college.yearOfPassing]]"), row(words, "rowResult", "[[college.result]]")];
  return [
    { key: `COLLEGE-BONAFIDE-${locale}`, kind: "BONAFIDE", name: d("collegeBonafideName"), locale, title: kindTitle("BONAFIDE", words), intro: d("collegeBonafideIntro"), rows: [...base, row(words, "rowYear", "[[year.name]]")], outro: d("bonafideOutro"), layout, serialPrefix: SERIAL_PREFIX.BONAFIDE },
    { key: `MIGRATION-${locale}`, kind: "MIGRATION", name: kindTitle("MIGRATION", words), locale, title: kindTitle("MIGRATION", words), intro: d("migrationIntro"), rows: [...passing, row(words, "rowLeftOn", "[[record.leftOn]]")], outro: d("migrationOutro"), layout, serialPrefix: SERIAL_PREFIX.MIGRATION },
    { key: `PROVISIONAL-${locale}`, kind: "PROVISIONAL", name: kindTitle("PROVISIONAL", words), locale, title: kindTitle("PROVISIONAL", words), intro: d("provisionalIntro"), rows: passing, outro: d("provisionalOutro"), layout, serialPrefix: SERIAL_PREFIX.PROVISIONAL },
    { key: `COURSE_COMPLETION-${locale}`, kind: "COURSE_COMPLETION", name: kindTitle("COURSE_COMPLETION", words), locale, title: kindTitle("COURSE_COMPLETION", words), intro: d("courseCompletionIntro"), rows: passing, outro: d("courseCompletionOutro"), layout, serialPrefix: SERIAL_PREFIX.COURSE_COMPLETION },
  ];
}

export function allCollegePresets(): (Omit<CertificateTemplateSave, "active"> & { key: string })[] {
  return (["en", "hi", "mr"] as const).flatMap((locale) => collegePresetsFor(locale));
}

/**
 * THE APPOINTMENT LETTER (risks batch 5A, 5 Oct 2026), offered at a school and a college alike, in each
 * language: the member of staff's designation, department, the day they join, their staff number, the
 * nature of the appointment and their qualification, in the register's rows; the terms in the closing. No
 * pay figure: the letter names the post, not the money (decision 0003 keeps money off the platform).
 */
export function appointmentPresetsFor(locale: WordsLocale, words: Words = wordsFor(locale)): (Omit<CertificateTemplateSave, "active"> & { key: string })[] {
  const layout = defaultLayoutFor(words);
  const d = (key: string) => words(`certificateDefaults.${key}`);
  return [
    {
      key: `APPOINTMENT-${locale}`, kind: "APPOINTMENT", name: kindTitle("APPOINTMENT", words), locale, title: kindTitle("APPOINTMENT", words), intro: d("appointmentIntro"),
      rows: [row(words, "rowStaffName", "[[staff.name]]"), row(words, "rowDesignation", "[[staff.designation]]"), row(words, "rowDepartment", "[[staff.department]]"), row(words, "rowJoinedOn", "[[staff.joinedOn]] ([[staff.joinedOnWords]])"), row(words, "rowStaffNumber", "[[staff.staffNumber]]"), row(words, "rowAppointmentType", "[[staff.appointmentType]]"), row(words, "rowQualification", "[[staff.qualification]]")],
      outro: d("appointmentOutro"), layout, serialPrefix: SERIAL_PREFIX.APPOINTMENT,
    },
  ];
}

export function allAppointmentPresets(): (Omit<CertificateTemplateSave, "active"> & { key: string })[] {
  return (["en", "hi", "mr"] as const).flatMap((locale) => appointmentPresetsFor(locale));
}

/** What an appointment letter may name about one member of staff (certificates.ts staffFactsFor). */
export type StaffFacts = {
  name: string;
  designation: string | null;
  department: string | null;
  staffNumber: string | null;
  joinedOnKey: string | null;
  qualification: string | null;
  appointmentType: string | null;
  school: { name: string; address: string | null };
  yearName: string | null;
  issue: { dateKey: string; serial: string; purpose: string | null; remark: string | null };
};

const APPOINTMENT_WORD: Record<string, string> = { REGULAR: "certificateDefaults.appointmentRegular", CONTRACT: "certificateDefaults.appointmentContract", PART_TIME: "certificateDefaults.appointmentPartTime" };

/** Every placeholder's value for one member of staff, in the document's language; the pupil's are blank. */
export function staffDataFor(facts: StaffFacts, locale: WordsLocale, words: Words = wordsFor(locale)): CertificateData {
  return {
    "staff.name": facts.name,
    "staff.designation": facts.designation,
    "staff.department": facts.department,
    "staff.staffNumber": facts.staffNumber,
    "staff.joinedOn": facts.joinedOnKey ? dateInFigures(facts.joinedOnKey) : null,
    "staff.joinedOnWords": facts.joinedOnKey ? dateInWords(facts.joinedOnKey, locale) : null,
    "staff.qualification": facts.qualification,
    "staff.appointmentType": worded(APPOINTMENT_WORD, facts.appointmentType, words),
    "school.name": facts.school.name,
    "school.address": facts.school.address,
    "year.name": facts.yearName,
    "issue.date": dateInFigures(facts.issue.dateKey),
    "issue.dateWords": dateInWords(facts.issue.dateKey, locale),
    "issue.serial": facts.issue.serial,
    "issue.purpose": facts.issue.purpose,
    "issue.remark": facts.issue.remark,
  };
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
  /** A college student's programme, PRN, years and result (college-records.ts); absent at a school. */
  college?: { programme: string | null; prn: string | null; yearOfEntry: string | null; yearOfPassing: string | null; result: string | null; apaarId: string | null; abcId: string | null } | null;
};

/** Every placeholder's value for one pupil, in the document's language. */
const CATEGORY_WORD: Record<string, string> = { GENERAL: "pupilRecord.catGeneral", SC: "pupilRecord.catSC", ST: "pupilRecord.catST", OBC: "pupilRecord.catOBC", VJ: "pupilRecord.catVJ", NT: "pupilRecord.catNT", SBC: "pupilRecord.catSBC" };
const RELIGION_WORD: Record<string, string> = { HINDU: "pupilRecord.relHindu", MUSLIM: "pupilRecord.relMuslim", CHRISTIAN: "pupilRecord.relChristian", SIKH: "pupilRecord.relSikh", BUDDHIST: "pupilRecord.relBuddhist", PARSI: "pupilRecord.relParsi", JAIN: "pupilRecord.relJain", OTHER: "pupilRecord.relOther" };

const LANGUAGE_WORD: Record<string, string> = { ASSAMESE: "pupilRecord.langAssamese", BENGALI: "pupilRecord.langBengali", BODO: "pupilRecord.langBodo", DOGRI: "pupilRecord.langDogri", ENGLISH: "pupilRecord.langEnglish", GUJARATI: "pupilRecord.langGujarati", HINDI: "pupilRecord.langHindi", KANNADA: "pupilRecord.langKannada", KASHMIRI: "pupilRecord.langKashmiri", KONKANI: "pupilRecord.langKonkani", MAITHILI: "pupilRecord.langMaithili", MALAYALAM: "pupilRecord.langMalayalam", MANIPURI: "pupilRecord.langManipuri", MARATHI: "pupilRecord.langMarathi", NEPALI: "pupilRecord.langNepali", ODIA: "pupilRecord.langOdia", PUNJABI: "pupilRecord.langPunjabi", SANSKRIT: "pupilRecord.langSanskrit", SANTALI: "pupilRecord.langSantali", SINDHI: "pupilRecord.langSindhi", TAMIL: "pupilRecord.langTamil", TELUGU: "pupilRecord.langTelugu", URDU: "pupilRecord.langUrdu", OTHER: "pupilRecord.langOther" };
const NATIONALITY_WORD: Record<string, string> = { INDIAN: "pupilRecord.natIndian", NEPALI: "pupilRecord.natNepali", BHUTANESE: "pupilRecord.natBhutanese", BANGLADESHI: "pupilRecord.natBangladeshi", SRI_LANKAN: "pupilRecord.natSriLankan", OTHER: "pupilRecord.natOther" };
/** A coded record value as the word a paper prints, in the paper's language; a value typed before the codes as itself. */
const worded = (table: Record<string, string>, value: string | null | undefined, words: Words): string | null => {
  if (!value) return null;
  const key = table[value.trim().toUpperCase().replace(/[\s-]+/g, "_")];
  return key ? words(key) : value;
};

export function dataFor(facts: PupilFacts, locale: WordsLocale, words: Words = wordsFor(locale)): CertificateData {
  const r = facts.record;
  const parentage = r?.fatherName && r?.motherName ? words("certificateDefaults.childOf", { father: r.fatherName, mother: r.motherName }) : null;
  const address = r ? [r.addressLine, r.city, r.postalCode].filter(Boolean).join(", ") || null : null;
  const reasonKey = facts.leaving?.reason ? ({ TRANSFERRED: "tc.reasonTransferred", GRADUATED: "tc.reasonGraduated", LEFT: "tc.reasonLeft" } as Record<string, string>)[facts.leaving.reason] : null;
  const conductKey = facts.leaving?.conduct ? ({ EXCELLENT: "tc.conductExcellent", GOOD: "tc.conductGood", SATISFACTORY: "tc.conductSatisfactory" } as Record<string, string>)[facts.leaving.conduct] : null;
  return {
    "pupil.name": facts.name,
    "pupil.dob": facts.birthdateKey ? dateInFigures(facts.birthdateKey) : null,
    "pupil.dobWords": facts.birthdateKey ? dateInWords(facts.birthdateKey, locale) : null,
    "pupil.age": facts.ageYears === null ? null : String(facts.ageYears),
    "pupil.fatherName": r?.fatherName ?? null,
    "pupil.motherName": r?.motherName ?? null,
    "pupil.parentage": parentage,
    "pupil.placeOfBirth": r?.placeOfBirth ?? null,
    "pupil.nationality": worded(NATIONALITY_WORD, r?.nationality, words),
    // Coded on the record since the filings were made exact; printed as the word in the paper's language. A value from before the codes prints as typed.
    "pupil.religion": r?.religion ? (RELIGION_WORD[r.religion.toUpperCase()] ? words(RELIGION_WORD[r.religion.toUpperCase()]!) : r.religion) : null,
    "pupil.caste": r?.caste ?? null,
    "pupil.category": r?.category ? (CATEGORY_WORD[r.category.toUpperCase()] ? words(CATEGORY_WORD[r.category.toUpperCase()]!) : r.category) : null,
    "pupil.motherTongue": worded(LANGUAGE_WORD, r?.motherTongue, words),
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
    "college.programme": facts.college?.programme ?? null,
    "college.prn": facts.college?.prn ?? null,
    "college.yearOfEntry": facts.college?.yearOfEntry ?? null,
    "college.yearOfPassing": facts.college?.yearOfPassing ?? null,
    "college.result": facts.college?.result ? (RESULT_WORD[facts.college.result] ? words(RESULT_WORD[facts.college.result]!) : facts.college.result) : null,
    "college.apaarId": facts.college?.apaarId ?? null,
    "college.abcId": facts.college?.abcId ?? null,
  };
}

/** The exams module's class or status as the paper prints it. */
const RESULT_WORD: Record<string, string> = { DISTINCTION: "certificateDefaults.resultDistinction", FIRST: "certificateDefaults.resultFirst", HIGHER_SECOND: "certificateDefaults.resultHigherSecond", SECOND: "certificateDefaults.resultSecond", PASS: "certificateDefaults.resultPass" };

/** The pupil-record fields a certificate needs before it can be issued without gaps. */
export const REQUIRED_RECORD_FIELDS = ["fatherName", "motherName", "placeOfBirth", "nationality", "motherTongue", "addressLine", "city", "admissionNumber", "admissionDate"] as const;
export const OPTIONAL_RECORD_FIELDS = ["religion", "caste", "category", "postalCode", "admittedToGrade", "previousSchool", "previousSchoolTcNumber", "previousSchoolTcDate", "penNumber", "rollNumber", "fatherOccupation", "motherOccupation", "annualIncome", "guardianPhone"] as const;
/** The record form's third group: what UDISE+ and the boards ask beyond a certificate (src/lib/pupil-records.ts says which of them a filing cannot do without). */
export const FILING_FORM_FIELDS = ["gender", "nameLocal", "fatherNameLocal", "motherNameLocal", "bpl", "ews", "rte", "repeating", "cwsnType", "bloodGroup", "alternatePhone", "freeUniform", "freeTextbook", "extracurricular", "stream", "vocationalCourse", "vocationalTradeId", "vocationalJobRoleId", "vocationalExamAppeared"] as const;
