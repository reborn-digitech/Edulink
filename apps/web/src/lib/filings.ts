import { codeFromList, CWSN_NONE, MOTHER_TONGUES, NATIONALITIES } from "@edulink/contracts";
import "server-only";
import type { FilingIdentitySave, FilingsView, PupilRecordField } from "@edulink/contracts";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { toCsv } from "./csv";
import { readJsonArray } from "./json";
import { missingFilingFields, FILING_RECORD_FIELDS } from "./pupil-records";
import { CWSN_TYPE_NAMES } from "./filing-codes";
import { ageInYears } from "./dates";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";
import type { CsvExport } from "./attendance-export";

/**
 * Filings: the returns a school files with the UDISE+ portal and its board,
 * cut from what the app already holds and laid out the way the portal
 * reads them.
 *
 * WHICH FORMATS ARE REAL. The UDISE+ student module takes a bulk Excel whose
 * fifty-four columns and codes are published on its validation sheet; that
 * sheet is reproduced here column for column, in its order, with its codes,
 * so the office opens the portal's template, pastes, and uploads. The
 * teacher profile is a fixed order of coded fields on the school DCF
 * (2024-25, §3.2); no bulk template is published, so the export is one row
 * per teacher in that order for typing in. The enrolment tables the portal
 * derives (the old DCF §4: class by gender by category, minority, age,
 * CWSN) are cut for the clerk's cross-check. CBSE's List of Candidates and
 * the Maharashtra board's pre-list are online workflows, and what a clerk
 * needs for either is a verification sheet in the board's own field order —
 * names, parents, date of birth, gender, category, subject codes — which is
 * what the two board sheets are.
 *
 * WHAT NEVER GOES OUT. Aadhaar: the app has no column for it and the
 * sheet's Aadhaar columns are left blank for the office to fill on the
 * portal itself if it must. Every export names children, so every one is
 * audited as compliance.export with a kind and a count — the same sensitive
 * action the register export carries.
 *
 * CODES ARE THE VALIDATION SHEET'S. The published documents disagree with
 * each other on the social-category numbering (the 2022-23 DCF prints SC-1,
 * the SDMS sheet and the 2024-25 DCF print General-1); this file follows
 * the bulk sheet, which is the one a file is uploaded against, and says so
 * in the column heading where the portal's own heading carries the legend.
 */

const OFFICE: readonly Role[] = ["ADMIN", "PRINCIPAL"];
type Office = ActiveContext & { schoolId: string; role: Role };

function office(ctx: ActiveContext): Office {
  if (!ctx.schoolId || !ctx.role || !OFFICE.includes(ctx.role)) throw new AccessError("access.notAllowed");
  return ctx as Office;
}
function admin(ctx: ActiveContext): Office {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) throw new AccessError("access.notAllowed");
  return ctx as Office;
}

/* -------------------------------------------------------------------------- */
/* The portal's codes                                                           */
/* -------------------------------------------------------------------------- */

/** UDISE+ SDMS: Male-1, Female-2, Transgender-3. */
export const GENDER_CODE: Record<string, string> = { M: "1", F: "2", T: "3" };
/** UDISE+ SDMS bulk sheet: General-1, SC-2, ST-3, OBC-4. */
export const CATEGORY_CODE: Record<string, string> = { GENERAL: "1", GEN: "1", SC: "2", ST: "3", OBC: "4", VJ: "4", NT: "4", SBC: "4" };
/** UDISE+ SDMS: Muslim-1, Christian-2, Sikh-3, Buddhist-4, Parsi-5, Jain-6, Not Minority-7 — from the religion the record holds. */
export const MINORITY_CODE: Record<string, string> = { MUSLIM: "1", ISLAM: "1", CHRISTIAN: "2", CHRISTIANITY: "2", SIKH: "3", SIKHISM: "3", BUDDHIST: "4", BUDDHISM: "4", PARSI: "5", ZOROASTRIAN: "5", JAIN: "6", JAINISM: "6", HINDU: "7", HINDUISM: "7", OTHER: "7" };
/** The 21 impairment types of the UDISE+ student module, by code — kept in filing-codes.ts so the record form can show them without this file's server-only imports. */
export { CWSN_TYPE_NAMES };
/** UDISE+ DCF §3.2.12. */
const APPOINTMENT_CODE: Record<string, string> = { REGULAR: "1", CONTRACT: "2", PART_TIME: "3" };
/** UDISE+ DCF §3.2.18: the subject appointed for, from the code the office picked — the same numbers as UDISE_SUBJECT_CODE below. */
export const APPOINTED_SUBJECT_CODE: Record<string, string> = { MATHEMATICS: "3", EVS: "4", MUSIC: "6", SCIENCE: "7", SOCIAL_SCIENCE: "8", ACCOUNTANCY: "10", BIOLOGY: "11", BUSINESS_STUDIES: "12", CHEMISTRY: "13", COMPUTER_SCIENCE: "14", ECONOMICS: "15", GEOGRAPHY: "18", HISTORY: "19", PHYSICS: "22", POLITICAL_SCIENCE: "23", PSYCHOLOGY: "24", HINDI: "41", SANSKRIT: "43", URDU: "45", ENGLISH: "46", REGIONAL_LANGUAGE: "47", SOCIOLOGY: "52", STATISTICS: "57", ART: "91", PHYSICAL_EDUCATION: "92", WORK_EDUCATION: "93" };
/** UDISE+ DCF §3.2.13: 3 teacher, 6 principal, 1 head teacher. */
const TEACHER_TYPE_CODE: Record<string, string> = { TEACHER: "3", PRINCIPAL: "6", ADMIN: "1" };
/** UDISE+ DCF §3.2.19 subject codes, matched on the subject name a timetable or a profile carries. */
const UDISE_SUBJECT_CODE: [RegExp, string][] = [
  [/^math/i, "3"], [/^evs|environment/i, "4"], [/sport|physical|^pe$|p\.e\./i, "92"], [/music/i, "6"], [/^science|general science/i, "7"], [/social/i, "8"], [/geograph/i, "18"], [/histor/i, "19"],
  [/^hindi/i, "41"], [/sanskrit/i, "43"], [/urdu/i, "45"], [/^english/i, "46"], [/marathi|gujarati|kannada|tamil|telugu|bengali|punjabi|malayalam|odia|assamese|regional/i, "47"], [/^art|drawing|craft/i, "91"], [/work ed/i, "93"],
  [/accountanc/i, "10"], [/biolog/i, "11"], [/business/i, "12"], [/chemist/i, "13"], [/computer|informatics|\bit\b|ict/i, "14"], [/econom/i, "15"], [/physics/i, "22"], [/political|civics/i, "23"], [/psycholog/i, "24"], [/sociolog/i, "52"], [/statistic/i, "57"],
];
/** CBSE subject codes for classes IX–X (Annexure H, 2025-26), by the name a timetable carries. */
const CBSE_X_CODE: [RegExp, string][] = [
  [/^hindi/i, "002"], [/^english/i, "184"], [/^urdu/i, "003"], [/^punjabi/i, "004"], [/^bengali/i, "005"], [/^tamil/i, "006"], [/^telugu/i, "007"], [/^sindhi/i, "008"], [/^marathi/i, "009"], [/^gujarati/i, "010"], [/^malayalam/i, "012"], [/^odia|^oriya/i, "013"], [/^assamese/i, "014"], [/^kannada/i, "015"], [/^french/i, "018"], [/^german/i, "020"], [/^sanskrit/i, "122"],
  [/basic.*math|math.*basic/i, "241"], [/^math/i, "041"], [/^science/i, "086"], [/social/i, "087"], [/computer app|^it$|information tech/i, "402"], [/artificial intel|^ai$/i, "417"], [/home sci/i, "064"], [/painting|^art/i, "049"],
];
/** CBSE subject codes for classes XI–XII (Annexure K, 2025-26). */
const CBSE_XII_CODE: [RegExp, string][] = [
  [/^english/i, "301"], [/^hindi/i, "302"], [/^urdu/i, "303"], [/^sanskrit/i, "322"], [/^marathi/i, "109"], [/^gujarati/i, "110"], [/^french/i, "118"], [/^german/i, "120"],
  [/^histor/i, "027"], [/political/i, "028"], [/geograph/i, "029"], [/econom/i, "030"], [/psycholog/i, "037"], [/sociolog/i, "039"], [/applied math/i, "241"], [/^math/i, "041"], [/physics/i, "042"], [/chemist/i, "043"], [/biolog/i, "044"], [/biotech/i, "045"], [/engineering graph/i, "046"], [/physical ed/i, "048"], [/painting/i, "049"], [/business/i, "054"], [/accountanc/i, "055"], [/home sci/i, "064"], [/informatics/i, "065"], [/computer sci/i, "083"], [/entrepreneur/i, "066"], [/legal/i, "074"],
];
/** MSBSHSE SSC subject codes: a language's code depends on whether it is the first language (the medium) or a second or third. */
const SSC_FIRST_LANGUAGE: Record<string, string> = { MARATHI: "01", HINDI: "02", ENGLISH: "03", URDU: "04", GUJARATI: "05", KANNADA: "06", TAMIL: "07", TELUGU: "08", MALAYALAM: "09", SINDHI: "10", BENGALI: "11", PUNJABI: "12" };
const SSC_OTHER_LANGUAGE: Record<string, string> = { HINDI: "15", MARATHI: "16", ENGLISH: "17", URDU: "18", GUJARATI: "19", KANNADA: "20", TAMIL: "21", TELUGU: "22", MALAYALAM: "23", SINDHI: "24", BENGALI: "25", PUNJABI: "26", SANSKRIT: "27", PALI: "28", ARDHAMAGADHI: "29", PERSIAN: "30", ARABIC: "31", GERMAN: "34", FRENCH: "35", RUSSIAN: "36" };
const SSC_CORE_CODE: [RegExp, string][] = [[/^ict|information/i, "41"], [/general math/i, "74"], [/^math/i, "71"], [/^science/i, "72"], [/social/i, "73"], [/sport|physical/i, "86"]];

/** The header row even when the school has nobody to list: the keys of a row built from nothing. */
function csvWithHeaders(rows: Record<string, unknown>[], sample: () => Record<string, unknown>): string {
  return toCsv(rows, rows.length ? undefined : Object.keys(sample()));
}

/** The language's English name from its code; a word typed before the list as it was typed. */
const LANGUAGE_NAME: Record<string, string> = { ASSAMESE: "Assamese", BENGALI: "Bengali", BODO: "Bodo", DOGRI: "Dogri", ENGLISH: "English", GUJARATI: "Gujarati", HINDI: "Hindi", KANNADA: "Kannada", KASHMIRI: "Kashmiri", KONKANI: "Konkani", MAITHILI: "Maithili", MALAYALAM: "Malayalam", MANIPURI: "Manipuri", MARATHI: "Marathi", NEPALI: "Nepali", ODIA: "Odia", PUNJABI: "Punjabi", SANSKRIT: "Sanskrit", SANTALI: "Santali", SINDHI: "Sindhi", TAMIL: "Tamil", TELUGU: "Telugu", URDU: "Urdu", OTHER: "Other" };
export function languageName(value: string | null | undefined): string {
  if (!value) return "";
  return LANGUAGE_NAME[codeFromList(MOTHER_TONGUES, value) ?? ""] ?? value.trim();
}
/** Yes-1 for the code INDIAN, No-2 for any other code; a word typed before the list is read as it was, by whether it says India. */
export function indianNational(value: string | null | undefined): string {
  if (!value || !value.trim()) return "";
  const code = codeFromList(NATIONALITIES, value);
  if (code) return code === "INDIAN" ? "1" : "2";
  return /india|भारतीय/i.test(value) ? "1" : "2";
}

function codeFor(table: [RegExp, string][], subject: string): string {
  const s = subject.trim();
  for (const [re, code] of table) if (re.test(s)) return code;
  return "";
}
const upper = (v: string | null | undefined) => (v ?? "").trim().toUpperCase();
/** DD-MM-YYYY, the SDMS sheet's own heading; DD/MM/YYYY where a board prints it so. */
const ddmmyyyy = (d: Date | null | undefined, sep = "-") => (d ? `${String(d.getUTCDate()).padStart(2, "0")}${sep}${String(d.getUTCMonth() + 1).padStart(2, "0")}${sep}${d.getUTCFullYear()}` : "");
const yesNo = (v: boolean | null | undefined) => (v === true ? "1" : v === false ? "2" : "");
/** UDISE+ class codes: PP3, PP2, PP1, then 1–12; anything else is left as the school wrote it. */
function classCode(grade: string | null | undefined): string {
  const g = (grade ?? "").trim().toUpperCase();
  if (/^\d{1,2}$/.test(g)) return String(Number(g));
  if (["NURSERY", "PLAYGROUP", "PRE-NURSERY"].includes(g)) return "PP3";
  if (["LKG", "JR KG", "JUNIOR KG", "KG1"].includes(g)) return "PP2";
  if (["UKG", "SR KG", "SENIOR KG", "KG2", "KG"].includes(g)) return "PP1";
  return g;
}
/** A grade as it may appear in a Content-Disposition filename: word characters and hyphens only, since `?grade=` is typed by the caller. */
function filenameSafe(grade: string): string {
  return grade.replace(/[^\w-]/g, "").slice(0, 24) || "grade";
}

/** UDISE+ class codes a pupil's grade must resolve to for the sheet: PP3, PP2, PP1, 1–12. */
const UDISE_CLASS_CODE = /^(PP[123]|[1-9]|1[0-2])$/;
export const isUdiseClass = (code: string) => UDISE_CLASS_CODE.test(code);
/**
 * DCF §3.2.16 "Classes Taught", by the bands a teacher's classes span — the
 * form's own list, keyed pre-primary/primary/upper/secondary/higher:
 *   1 Primary only, 2 Upper primary only, 3 Primary and upper primary,
 *   5 Secondary only, 6 Higher secondary only, 7 Upper primary and secondary,
 *   8 Secondary and higher secondary, 10 Pre-primary only, 11 Pre-primary and primary.
 * A combination the form does not list (a teacher of grades 3 and 9, say)
 * has no code of its own; it files the code of the LOWEST band present
 * rather than "3", which said upper primary of someone who teaches none.
 */
const BANDS = ["pre", "primary", "upper", "secondary", "higher"] as const;
type Band = (typeof BANDS)[number];
const CLASSES_TAUGHT_CODE: Record<string, string> = { primary: "1", upper: "2", "primary+upper": "3", secondary: "5", higher: "6", "upper+secondary": "7", "secondary+higher": "8", pre: "10", "pre+primary": "11" };
function classesTaughtCode(grades: string[]): string {
  const bands = new Set<Band>();
  for (const g of grades) {
    const code = classCode(g);
    if (/^PP/.test(code)) bands.add("pre");
    const n = Number(code);
    if (!Number.isInteger(n)) continue;
    if (n >= 1 && n <= 5) bands.add("primary");
    else if (n >= 6 && n <= 8) bands.add("upper");
    else if (n >= 9 && n <= 10) bands.add("secondary");
    else if (n >= 11 && n <= 12) bands.add("higher");
  }
  const present = BANDS.filter((b) => bands.has(b));
  if (present.length === 0) return "";
  return CLASSES_TAUGHT_CODE[present.join("+")] ?? CLASSES_TAUGHT_CODE[present[0]!]!;
}

/* -------------------------------------------------------------------------- */
/* Identity and readiness                                                       */
/* -------------------------------------------------------------------------- */

const IDENTITY_FIELDS = ["udiseCode", "board", "affiliationNumber", "district", "block", "medium", "managementType"] as const;

async function identityOf(schoolId: string) {
  const s = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { udiseCode: true, board: true, affiliationNumber: true, district: true, block: true, medium: true, managementType: true, region: true, city: true, postalCode: true, name: true, locale: true } });
  return { ...s, identity: { udiseCode: s.udiseCode, board: s.board, affiliationNumber: s.affiliationNumber, district: s.district, block: s.block, medium: s.medium, managementType: s.managementType, state: s.region, city: s.city, postalCode: s.postalCode } };
}

const STAFF_FILING_FIELDS = ["gender", "socialCategory", "academicQualification", "professionalQualification", "appointmentType", "joinedOn", "serviceJoinedOn"] as const;

/** The office's page: the identity, who is ready and who is not, and the grades a board sheet can be cut for. */
export async function filingsView(ctx: ActiveContext): Promise<FilingsView> {
  const caller = office(ctx);
  const [school, pupils, staff, classes, year] = await Promise.all([
    identityOf(caller.schoolId),
    db.membership.findMany({ where: { schoolId: caller.schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null }, select: { pupilRecord: true, user: { select: { birthdate: true } }, enrollments: { where: { status: "ACTIVE", class: { archivedAt: null } }, select: { class: { select: { gradeLevel: true } } }, take: 1, orderBy: { enrolledAt: "desc" } } } }),
    db.membership.findMany({ where: { schoolId: caller.schoolId, role: { in: ["TEACHER", "PRINCIPAL"] }, status: "ACTIVE", leftAt: null }, select: { staffRecord: true } }),
    db.class.findMany({ where: { schoolId: caller.schoolId, archivedAt: null }, select: { gradeLevel: true, _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } } }),
    db.academicYear.findFirst({ where: { schoolId: caller.schoolId, isCurrent: true }, select: { name: true } }),
  ]);
  const pupilMissing: Record<string, number> = {};
  let pupilsReady = 0;
  let withoutLocalName = 0;
  for (const p of pupils) {
    // Ready is wider than the record's own list (what the family can fill):
    // the sheet also needs the date of birth on the account, both parents'
    // names, and a live class whose grade codes to a UDISE+ class.
    const missing: string[] = missingFilingFields(p.pupilRecord);
    if (!p.user.birthdate) missing.push("birthdate");
    if (!p.pupilRecord?.fatherName?.trim() || !p.pupilRecord?.motherName?.trim()) missing.push("parents");
    if (!p.enrollments[0] || !isUdiseClass(classCode(p.enrollments[0].class.gradeLevel))) missing.push("classCode");
    if (missing.length === 0) pupilsReady += 1;
    for (const f of missing) pupilMissing[f] = (pupilMissing[f] ?? 0) + 1;
    if (!p.pupilRecord?.nameLocal) withoutLocalName += 1;
  }
  const staffMissing: Record<string, number> = {};
  let staffReady = 0;
  for (const s of staff) {
    const missing = STAFF_FILING_FIELDS.filter((f) => !s.staffRecord?.[f]);
    if (missing.length === 0) staffReady += 1;
    for (const f of missing) staffMissing[f] = (staffMissing[f] ?? 0) + 1;
  }
  const byGrade = new Map<string, number>();
  for (const c of classes) if (c.gradeLevel) byGrade.set(c.gradeLevel, (byGrade.get(c.gradeLevel) ?? 0) + c._count.enrollments);
  return {
    identity: school.identity,
    identityMissing: IDENTITY_FIELDS.filter((f) => !school.identity[f]),
    pupils: { total: pupils.length, ready: pupilsReady, missing: pupilMissing, withoutLocalName },
    staff: { total: staff.length, ready: staffReady, missing: staffMissing },
    grades: [...byGrade.entries()].sort((a, b) => Number(a[0]) - Number(b[0]) || a[0].localeCompare(b[0])).map(([gradeLevel, n]) => ({ gradeLevel, pupils: n })),
    academicYearName: year?.name ?? null,
  };
}

/** The office writes what the portals know the school as. A blank clears. */
export async function saveFilingIdentity(ctx: ActiveContext, input: FilingIdentitySave): Promise<FilingsView> {
  const caller = admin(ctx);
  const text = (v: string | undefined) => (v === undefined ? undefined : v.trim() || null);
  await db.school.update({ where: { id: caller.schoolId }, data: { udiseCode: text(input.udiseCode), board: text(input.board), affiliationNumber: text(input.affiliationNumber), district: text(input.district), block: text(input.block), medium: text(input.medium), managementType: text(input.managementType) } });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "school.filings.set", targetType: "School", targetId: caller.schoolId, meta: { fields: Object.keys(input).filter((k) => (input as Record<string, unknown>)[k] !== undefined) } });
  return filingsView(ctx);
}

/* -------------------------------------------------------------------------- */
/* The pupils, as the portals read them                                         */
/* -------------------------------------------------------------------------- */

type Pupil = Awaited<ReturnType<typeof loadPupils>>[number];

async function loadPupils(schoolId: string, grade?: string) {
  const rows = await db.membership.findMany({
    where: { schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null, ...(grade ? { enrollments: { some: { status: "ACTIVE", class: { gradeLevel: grade, archivedAt: null } } } } : {}) },
    select: {
      id: true, studentCode: true, joinedAt: true,
      user: { select: { name: true, birthdate: true, email: true, phone: true, penNumber: true } },
      pupilRecord: true,
      enrollments: { where: { status: "ACTIVE", class: { archivedAt: null } }, select: { enrolledAt: true, rollNumber: true, repeating: true, class: { select: { name: true, gradeLevel: true, section: true } } }, take: 1, orderBy: { enrolledAt: "desc" } },
      guardianships: { where: { status: "ACTIVE" }, select: { relation: true, parent: { select: { name: true, phone: true, email: true } } }, take: 1 },
    },
    orderBy: [{ user: { name: "asc" } }],
    take: 5000,
  });
  // Sorted the way a register reads: class, then name.
  return rows.sort((a, b) => {
    const ga = Number(a.enrollments[0]?.class.gradeLevel ?? 999), gb = Number(b.enrollments[0]?.class.gradeLevel ?? 999);
    return ga - gb || (a.enrollments[0]?.class.section ?? "").localeCompare(b.enrollments[0]?.class.section ?? "") || a.user.name.localeCompare(b.user.name);
  });
}

/**
 * The parents' names as UDISE+ wants them: the record's only. A linked
 * guardian never stands in for a father or a mother, because
 * Guardianship.relation says PARENT or GUARDIAN and not which parent; a
 * non-parent guardian goes in the sheet's own guardian column.
 */
/** `parents` over the four columns it reads, for a test that has no roll to load. */
export function parentsForTest(p: {
  user: { phone: string | null };
  pupilRecord: { fatherName: string | null; motherName: string | null; guardianPhone: string | null } | null;
  guardianships: { relation: string; parent: { name: string; phone: string | null; email: string | null } }[];
}) {
  return parents(p as unknown as Pupil);
}

function parents(p: Pupil) {
  const g = p.guardianships[0];
  return {
    father: p.pupilRecord?.fatherName ?? "",
    mother: p.pupilRecord?.motherName ?? "",
    guardian: g && g.relation !== "PARENT" ? g.parent.name : "",
    // A linked guardian's own number, proved by a code; else the number on the
    // record, which the office or the family wrote; else the pupil's own.
    phone: g?.parent.phone ?? p.pupilRecord?.guardianPhone ?? p.user.phone ?? "",
    email: g?.parent.email ?? "",
  };
}

/**
 * The current year (which decides "was here last year"), and the previous
 * year's attendance and annual card per pupil for the "previous year"
 * columns. Attended days are DAYS — distinct register dates with a PRESENT
 * or LATE mark — so a pupil on two registers the same day counts once;
 * the portal caps the column at 250.
 */
async function yearFacts(schoolId: string, ids: string[]) {
  const current = await db.academicYear.findFirst({ where: { schoolId, isCurrent: true }, select: { id: true, startDate: true } });
  const previous = current ? await db.academicYear.findFirst({ where: { schoolId, endDate: { lt: current.startDate } }, orderBy: { endDate: "desc" }, select: { id: true, startDate: true, endDate: true } }) : null;
  const attended = new Map<string, number>();
  const percent = new Map<string, number>();
  if (!previous || ids.length === 0) return { current, attended, percent };
  const from = previous.startDate.toISOString().slice(0, 10), to = previous.endDate.toISOString().slice(0, 10);
  const [days, cards] = await Promise.all([
    db.$queryRaw<{ studentMembershipId: string; days: number | bigint }[]>`
      SELECT r."studentMembershipId", COUNT(DISTINCT s."dateKey") AS "days"
      FROM "AttendanceRecord" r JOIN "AttendanceSession" s ON s."id" = r."sessionId"
      WHERE r."schoolId" = ${schoolId} AND r."studentMembershipId" IN (${Prisma.join(ids)})
        AND r."status" IN ('PRESENT', 'LATE') AND s."dateKey" >= ${from} AND s."dateKey" <= ${to}
      GROUP BY r."studentMembershipId"`,
    db.reportCard.findMany({ where: { schoolId, studentMembershipId: { in: ids }, academicYearId: previous.id, termId: null, status: "PUBLISHED", overallPercentMilli: { not: null } }, select: { studentMembershipId: true, overallPercentMilli: true } }),
  ]);
  for (const r of days) attended.set(r.studentMembershipId, Math.min(Number(r.days), 250));
  for (const c of cards) percent.set(c.studentMembershipId, Math.round((c.overallPercentMilli ?? 0) / 1000));
  return { current, attended, percent };
}

/**
 * UDISE+ SDMS bulk sheet: the fifty-four columns of the student template in
 * its order, coded as its validation sheet codes them; the Aadhaar columns
 * blank; dates DD-MM-YYYY; names in capitals.
 */
export async function udiseStudentsExport(ctx: ActiveContext): Promise<CsvExport> {
  const caller = admin(ctx);
  const [pupils, school] = await Promise.all([loadPupils(caller.schoolId), identityOf(caller.schoolId)]);
  const facts = await yearFacts(caller.schoolId, pupils.map((p) => p.id));
  let roll = 0;
  let counter = 0;
  let lastClass = "";
  const rowOf = (p: Pupil | null) => {
    const r = p?.pupilRecord ?? null;
    const klass = p?.enrollments[0]?.class;
    const grade = classCode(klass?.gradeLevel);
    const classKey = `${grade}/${klass?.section ?? ""}`;
    counter = classKey === lastClass ? counter + 1 : 1;
    lastClass = classKey;
    // The roll number the school assigned on the enrolment; the running counter only where none was.
    roll = p?.enrollments[0]?.rollNumber ?? counter;
    const par = p ? parents(p) : { father: "", mother: "", guardian: "", phone: "", email: "" };
    /**
     * ⚠ AN ANSWER NOBODY GAVE IS FILED BLANK. A record with no impairment
     * chosen used to file "No", and a class with no section "A": both are
     * statements, and the school had made neither. "None" is a choice on
     * the form now (cwsnType NONE) and files No; a blank files blank, and
     * the record is not ready until somebody has answered.
     */
    const isCwsn = !r?.cwsnType ? "" : r.cwsnType === CWSN_NONE ? "2" : "1";
    const repeating = p?.enrollments[0]?.repeating === true;
    // "Was here last year" is the admission date (the record's, else the day
    // they joined the roll here) falling before the current academic year's
    // start — not the calendar year of the platform join, which filed every
    // pupil of a school's first year on the app as a new admission and a
    // June admission exported in January as an old hand. No current year,
    // no answer.
    const admitted = r?.admissionDate ?? p?.joinedAt ?? null;
    const sameSchool = p && admitted && facts.current ? (admitted < facts.current.startDate ? "1" : "2") : "";
    return {
      "Grade/Class": grade,
      "SECTION": klass?.section ?? "",
      "Roll no": roll,
      "Name of Student": upper(p?.user.name),
      "GENDER": GENDER_CODE[r?.gender ?? ""] ?? "",
      "DOB (DD-MM-YYYY)": ddmmyyyy(p?.user.birthdate),
      "MOTHER NAME": upper(par.mother),
      "FATHER NAME": upper(par.father),
      "GUARDIAN NAME (Optional)": upper(par.guardian),
      "Aadhaar No of Child": "",
      "STUDENT NAME AS PER AADHAR": "",
      "PRESENT ADDRESS": [r?.addressLine, r?.city].filter(Boolean).join(", "),
      "PINCODE": r?.postalCode ?? "",
      "MOBILE NUMBER": par.phone.replace(/\D/g, "").slice(-10),
      "ALTERNATE MOBILE NUMBER (Optional)": "",
      "EMAIL ID (Optional)": par.email,
      "MOTHER TONGUE": languageName(r?.motherTongue),
      "SOCIAL CATEGORY (General-1, SC-2, ST-3, OBC-4)": CATEGORY_CODE[upper(r?.category)] ?? "",
      "MINORITY GROUP (Muslim-1, Christian-2, Sikh-3, Buddhist-4, Parsi-5, Jain-6, Not Minority-7)": MINORITY_CODE[upper(r?.religion)] ?? "",
      "Is BPL BENEFICIARY (Yes-1, No-2)": yesNo(r?.bpl),
      "Whether AAY beneficiary": "",
      "BELONGS TO EWS/DISADVANTAGED GROUP (Yes-1, No-2)": yesNo(r?.ews),
      "IS CWSN (Yes-1, No-2)": isCwsn,
      "CWSN IMPAIRMENT TYPE": r?.cwsnType && r.cwsnType !== CWSN_NONE ? r.cwsnType : "",
      "CHILD IS INDIAN NATIONAL (Yes-1, No-2)": indianNational(r?.nationality),
      "CHILD IS OUT-OF-SCHOOL-CHILD (Yes-1, No-2)": "2",
      "When mainstreamed": "",
      "Admission Number": r?.admissionNumber ?? "",
      "ADMISSION DATE (DD-MM-YYYY)": ddmmyyyy(r?.admissionDate ?? p?.joinedAt),
      "STUDENT STREAM (HS only)": "",
      "PREVIOUS ACADEMIC YEAR SCHOOLING STATUS": sameSchool,
      // Grade 1's previous class is the portal's last pre-primary code, PP3, not "PP".
      // A pupil repeating the class studied THIS class last year; everybody else, the one below it.
      "CLASS STUDIED IN PREVIOUS ACADEMIC YEAR": sameSchool === "1" && /^\d+$/.test(grade) ? (repeating ? grade : Number(grade) > 1 ? String(Number(grade) - 1) : "PP3") : "",
      // The office's own answer where it has given one. 1 for an RTE admission is this code's reading of the
      // column beside the 2 and 0 it already printed and has not been checked against the portal's sheet.
      "ADMITTED/ENROLLED UNDER RTE/EWS": r?.rte === true ? "1" : r?.ews === true ? "2" : r && r.rte === false && r.ews === false ? "0" : "",
      "APPEARED FOR EXAM IN PREVIOUS CLASS": p && sameSchool === "1" ? (facts.percent.has(p.id) ? "1" : "") : "",
      // Passed, for a pupil who moved up with a card to show for it. A repeater's result is left for the
      // office to enter on the portal: the app computes no pass or fail, and this sheet will not state one.
      "RESULT FOR PREVIOUS EXAM": p && sameSchool === "1" && facts.percent.has(p.id) && !repeating ? "1" : "",
      "MARKS % OF PREVIOUS EXAM": p ? (facts.percent.get(p.id) ?? "") : "",
      "CLASS ATTENDED DAYS (Previous Year)": p ? (facts.attended.get(p.id) ?? "") : "",
      "Free Uniform (Yes-1, No-2)": "",
      "Free TextBook (Yes-1, No-2)": "",
      "Central scholarship (Yes-1, No-2)": "",
      "NSP scholarship code": "",
      "State scholarship (Yes-1, No-2)": "",
      "Other scholarship (Yes-1, No-2)": "",
      "Scholarship amount": "",
      "Facility provided to the CWSN": "",
      "Screened for SLD (Yes-1, No-2)": "",
      "SLD type": "",
      "Screened for ASD (Yes-1, No-2)": "",
      "Screened for ADHD (Yes-1, No-2)": "",
      "Extracurricular (Yes-1, No-2)": "",
      "Vocational course (Yes-1, No-2)": "",
      "Trade/Sector ID": "",
      "Job Role ID": "",
      "Appeared for vocational exam": "",
    };
  };
  const rows = pupils.map(rowOf);
  const csv = csvWithHeaders(rows, () => rowOf(null));
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "compliance.export", meta: { kind: "udise-students", rows: rows.length, udise: Boolean(school.udiseCode) } });
  return { filename: `udise-students-${school.udiseCode ?? "school"}-${today()}.csv`, csv, rows: rows.length };
}

const today = () => new Date().toISOString().slice(0, 10);

/** The class columns, and a last one for a pupil whose grade is not a UDISE+ class or who has no live class, so the columns always sum to Total. */
const UDISE_CLASSES = ["PP", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "Other"] as const;
const UDISE_CLASS_LABEL: Record<string, string> = { PP: "Pre-Primary", "1": "I", "2": "II", "3": "III", "4": "IV", "5": "V", "6": "VI", "7": "VII", "8": "VIII", "9": "IX", "10": "X", "11": "XI", "12": "XII", Other: "Not in a listed class" };
/** The category row is the sheet's own coded name, so VJ, NT and SBC file under OBC here as they do on the student sheet. */
const CATEGORY_ROW: Record<string, string> = { "1": "GENERAL", "2": "SC", "3": "ST", "4": "OBC" };

/**
 * The enrolment tables the portal derives (DCF §4.2, 4.4, 4.6): class by
 * gender by social category, then by minority group, by age and by
 * impairment type — a Boys and a Girls column per class, and a row per
 * category. No child is named; a pupil with no gender on record is counted
 * in a third pair of columns so the office sees what the portal cannot.
 */
export async function udiseEnrolmentExport(ctx: ActiveContext): Promise<CsvExport> {
  const caller = admin(ctx);
  const pupils = await loadPupils(caller.schoolId);
  type Cell = { B: number; G: number; U: number };
  const blank = (): Record<string, Cell> => Object.fromEntries([...UDISE_CLASSES, "Total"].map((c) => [c, { B: 0, G: 0, U: 0 }]));
  const tables = new Map<string, Map<string, Record<string, Cell>>>();
  const bump = (table: string, row: string, cls: string, gender: string | null) => {
    const t = tables.get(table) ?? new Map();
    tables.set(table, t);
    const r = t.get(row) ?? blank();
    t.set(row, r);
    const key = gender === "M" ? "B" : gender === "F" ? "G" : "U";
    const col = (UDISE_CLASSES as readonly string[]).includes(cls) && cls !== "Other" ? cls : cls.startsWith("PP") ? "PP" : "Other";
    r[col]![key] += 1;
    r.Total[key] += 1;
  };
  for (const p of pupils) {
    const r = p.pupilRecord;
    const cls = classCode(p.enrollments[0]?.class.gradeLevel);
    const g = r?.gender ?? null;
    const cat = CATEGORY_ROW[CATEGORY_CODE[upper(r?.category)] ?? ""] ?? "Not on record";
    bump("4.2 Enrolment by social category", cat, cls, g);
    bump("4.2 Enrolment by social category", "Total", cls, g);
    const minority = MINORITY_CODE[upper(r?.religion)];
    if (r?.religion && minority && minority !== "7") bump("4.2(b) Minority groups", upper(r.religion), cls, g);
    const age = p.user.birthdate ? ageInYears(p.user.birthdate) : null;
    bump("4.4 Enrolment by age", age === null ? "Age not on record" : age < 5 ? "<5" : age > 22 ? ">22" : String(age), cls, g);
    if (r?.cwsnType && r.cwsnType !== CWSN_NONE) bump("4.6 CWSN by impairment", `${r.cwsnType} ${CWSN_TYPE_NAMES[r.cwsnType] ?? ""}`.trim(), cls, g);
  }
  const rows: Record<string, unknown>[] = [];
  for (const [table, byRow] of tables) {
    const rowNames = [...byRow.keys()].sort((a, b) => (a === "Total" ? 1 : b === "Total" ? -1 : Number(a) - Number(b) || a.localeCompare(b)));
    for (const name of rowNames) {
      const cells = byRow.get(name)!;
      const row: Record<string, unknown> = { table, row: name };
      for (const c of [...UDISE_CLASSES, "Total"]) {
        const label = UDISE_CLASS_LABEL[c] ?? c;
        row[`${label} Boys`] = cells[c]?.B ?? 0;
        row[`${label} Girls`] = cells[c]?.G ?? 0;
        row[`${label} No gender on record`] = cells[c]?.U ?? 0;
      }
      rows.push(row);
    }
  }
  const csv = csvWithHeaders(rows, () => ({ table: "", row: "", ...Object.fromEntries([...UDISE_CLASSES, "Total"].flatMap((c) => [[`${UDISE_CLASS_LABEL[c] ?? c} Boys`, ""], [`${UDISE_CLASS_LABEL[c] ?? c} Girls`, ""], [`${UDISE_CLASS_LABEL[c] ?? c} No gender on record`, ""]])) }));
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "compliance.export", meta: { kind: "udise-enrolment", rows: rows.length } });
  return { filename: `udise-enrolment-${today()}.csv`, csv, rows: rows.length };
}

/** UDISE+ DCF §3.2, one row per teacher and the head, the fields in the form's order and its codes. */
export async function udiseTeachersExport(ctx: ActiveContext): Promise<CsvExport> {
  const caller = admin(ctx);
  const [school, staff] = await Promise.all([
    identityOf(caller.schoolId),
    db.membership.findMany({
      where: { schoolId: caller.schoolId, role: { in: ["TEACHER", "PRINCIPAL"] }, status: "ACTIVE", leftAt: null },
      select: { id: true, role: true, subjects: true, joinedAt: true, user: { select: { name: true, birthdate: true, email: true, phone: true } }, staffRecord: true, classTeachers: { where: { class: { archivedAt: null } }, select: { class: { select: { gradeLevel: true } } } }, timetableSlots: { where: { class: { archivedAt: null } }, select: { subject: true, class: { select: { gradeLevel: true } } } } },
      orderBy: [{ role: "desc" }, { user: { name: "asc" } }],
    }),
  ]);
  type Staff = (typeof staff)[number];
  const rowOf = (s: Staff | null) => {
    const r = s?.staffRecord ?? null;
    // The profile's own subjects first (a teacher says what they teach); else the timetable's, most periods first, then by name — never the database's order.
    const counts = new Map<string, number>();
    for (const t of s?.timetableSlots ?? []) counts.set(t.subject.trim(), (counts.get(t.subject.trim()) ?? 0) + 1);
    const taught = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name]) => name);
    const profile = s ? readJsonArray<string>(s.subjects).map((x) => x.trim()).filter(Boolean) : [];
    const subjects = profile.length ? profile : taught;
    // 3.2.18 is a subject CODE, never the title: the designation with its rank word
    // stripped ("TGT Mathematics" → Mathematics), matched on the same table as
    // 3.2.19; else subject 1's code; else blank.
    // The office's own answer first; the designation's words and subject 1 are what is left when it has not said.
    const appointedFor = APPOINTED_SUBJECT_CODE[r?.appointedSubject ?? ""] || codeFor(UDISE_SUBJECT_CODE, (r?.designation ?? "").replace(/^(PGT|TGT|PRT|NTT|PET|HM)\b[\s:./-]*/i, "").replace(/\bteacher\b/i, "").trim()) || codeFor(UDISE_SUBJECT_CODE, subjects[0] ?? "");
    const grades = s ? [...new Set([...s.classTeachers.map((c) => c.class.gradeLevel), ...s.timetableSlots.map((t) => t.class.gradeLevel)].filter((g): g is string => Boolean(g)))] : [];
    return {
      "UDISE Code of School": school.udiseCode ?? "",
      "Teacher National Code": "",
      "3.2.1 Name of the Teacher": upper(s?.user.name),
      "3.2.2 Gender (Male-1, Female-2, Transgender-3)": GENDER_CODE[r?.gender ?? ""] ?? "",
      "3.2.3 Date of Birth (DD/MM/YYYY)": ddmmyyyy(r?.birthdate ?? s?.user.birthdate, "/"),
      "3.2.4 Teacher Code of State": r?.staffNumber ?? "",
      "3.2.5 Social Category (General-1, SC-2, ST-3, OBC-4)": CATEGORY_CODE[upper(r?.socialCategory)] ?? "",
      "3.2.6(a) Highest Academic Qualification": r?.academicQualification ?? "",
      "3.2.6(b) Trade/Degree": r?.qualification ?? "",
      "3.2.7(a) Highest Professional Qualification": r?.professionalQualification ?? "",
      "3.2.8(a) Mobile Number": (s?.user.phone ?? "").replace(/\D/g, "").slice(-10),
      "3.2.8(b) Email": s?.user.email ?? "",
      "3.2.9(a) Aadhaar Number": "",
      "3.2.12 Nature of Appointment (Regular-1, Contract-2, Part-Time-3)": APPOINTMENT_CODE[r?.appointmentType ?? ""] ?? "",
      "3.2.13 Type of Teacher": TEACHER_TYPE_CODE[s?.role ?? ""] ?? "",
      "3.2.14 Date of Joining in Service (DD/MM/YYYY)": ddmmyyyy(r?.serviceJoinedOn ?? r?.joinedOn ?? null, "/"),
      "3.2.15 Date of Joining in Present School (DD/MM/YYYY)": ddmmyyyy(r?.joinedOn ?? s?.joinedAt, "/"),
      "3.2.16 Classes Taught": classesTaughtCode(grades),
      "3.2.18 Appointed for Subject": appointedFor,
      "3.2.19(a) Main Subject Taught 1": codeFor(UDISE_SUBJECT_CODE, subjects[0] ?? ""),
      "3.2.19(a) Subject 1 name": subjects[0] ?? "",
      "3.2.19(b) Main Subject Taught 2": codeFor(UDISE_SUBJECT_CODE, subjects[1] ?? ""),
      "3.2.19(b) Subject 2 name": subjects[1] ?? "",
      "Classes on the timetable": grades.sort((a, b) => Number(a) - Number(b)).join(" "),
    };
  };
  const rows = staff.map(rowOf);
  const csv = csvWithHeaders(rows, () => rowOf(null));
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "compliance.export", meta: { kind: "udise-teachers", rows: rows.length } });
  return { filename: `udise-teachers-${today()}.csv`, csv, rows: rows.length };
}

/** The subjects a grade's classes carry on the timetable, most common first — what a candidate of that grade sits. */
async function gradeSubjects(schoolId: string, grade: string): Promise<string[]> {
  const slots = await db.timetableSlot.findMany({ where: { schoolId, class: { gradeLevel: grade, archivedAt: null } }, select: { subject: true } });
  const counts = new Map<string, number>();
  for (const s of slots) counts.set(s.subject.trim(), (counts.get(s.subject.trim()) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s);
}

/**
 * CBSE: the verification sheet a school checks its List of Candidates or its
 * IX/XI registration against — the names as the admission register spells
 * them, parents, date of birth day first, gender, category, the PEN the
 * portal maps to the APAAR id, and the grade's subjects with their CBSE
 * codes (Annexure H for IX–X, K for XI–XII). The office corrects it on
 * Pariksha Sangam; nothing is uploaded from here.
 */
export async function cbseCandidatesExport(ctx: ActiveContext, grade: string): Promise<CsvExport> {
  const caller = admin(ctx);
  const [pupils, school, subjects] = await Promise.all([loadPupils(caller.schoolId, grade), identityOf(caller.schoolId), gradeSubjects(caller.schoolId, grade)]);
  const senior = Number(grade) >= 11;
  const table = senior ? CBSE_XII_CODE : CBSE_X_CODE;
  // The grade's list, once per code (a timetable's "Maths" and "Mathematics"
  // are one paper), and every candidate gets the whole of it: a pupil's own
  // subject choice is not held anywhere, so the office strikes out on the sheet.
  const seen = new Set<string>();
  const coded = subjects.map((s) => ({ name: s, code: codeFor(table, s) })).filter((s) => s.code && !seen.has(s.code) && Boolean(seen.add(s.code))).slice(0, 7);
  const rowOf = (p: Pupil | null) => {
    const r = p?.pupilRecord ?? null;
    const par = p ? parents(p) : { father: "", mother: "", guardian: "", phone: "", email: "" };
    const row: Record<string, unknown> = {
      "Affiliation No.": school.affiliationNumber ?? "",
      "Class": grade,
      "Section": p?.enrollments[0]?.class.section ?? "",
      "Candidate's Name": upper(p?.user.name),
      "Mother's Name": upper(par.mother),
      "Father's / Guardian's Name": upper(par.father || par.guardian),
      "Date of Birth (DD/MM/YYYY)": ddmmyyyy(p?.user.birthdate, "/"),
      "Gender": r?.gender === "M" ? "Male" : r?.gender === "F" ? "Female" : r?.gender === "T" ? "Transgender" : "",
      "Category": upper(r?.category),
      // Yes for a type, No for "none" said; blank while nobody has asked.
      "CWSN": !r?.cwsnType ? "" : r.cwsnType === CWSN_NONE ? "No" : "Yes",
      "PEN": p?.user.penNumber ?? r?.penNumber ?? "",
      "Admission No.": r?.admissionNumber ?? "",
      "Mobile": par.phone.replace(/\D/g, "").slice(-10),
      "Email": par.email,
    };
    coded.forEach((s, i) => {
      row[`Subject ${i + 1} code`] = s.code;
      row[`Subject ${i + 1}`] = s.name;
    });
    return row;
  };
  const rows = pupils.map(rowOf);
  const csv = csvWithHeaders(rows, () => rowOf(null));
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "compliance.export", meta: { kind: "cbse-candidates", grade, rows: rows.length } });
  return { filename: `cbse-candidates-class-${filenameSafe(grade)}-${today()}.csv`, csv, rows: rows.length };
}

/** Surname, first name and the father's name the way the Maharashtra board prints a candidate: the full name split, the record's father as the middle name. */
function marathiNameParts(fullName: string, father: string): { surname: string; first: string; middle: string } {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0] ?? "";
  const surname = parts.length > 1 ? parts[parts.length - 1]! : "";
  // "".split()[0] is "", not undefined, so the fallback to the pupil's own middle name needs a blank test.
  const middle = (father.trim().split(/\s+/)[0] || undefined) ?? (parts.length > 2 ? parts[1]! : "");
  return { surname, first, middle };
}

/**
 * MSBSHSE: the pre-list a school checks before the SSC or HSC exam form is
 * final — the candidate in the board's name order in English and in the
 * school's own script, the mother's name the board keys on, date of birth,
 * gender, category, medium, and the SSC subject codes, a language coded as
 * first language when it is the medium and as second or third otherwise.
 */
export async function msbshseCandidatesExport(ctx: ActiveContext, grade: string): Promise<CsvExport> {
  const caller = admin(ctx);
  const [pupils, school, subjects] = await Promise.all([loadPupils(caller.schoolId, grade), identityOf(caller.schoolId), gradeSubjects(caller.schoolId, grade)]);
  // "Marathi Medium" or "Semi-English" names the language inside a phrase: contains, not equals.
  const medium = upper(school.medium);
  const isMedium = (language: string) => medium.includes(upper(language));
  const languages = subjects.filter((s) => SSC_FIRST_LANGUAGE[upper(s)] || SSC_OTHER_LANGUAGE[upper(s)]);
  const codes: { name: string; code: string }[] = [];
  for (const l of languages) codes.push({ name: l, code: (isMedium(l) ? SSC_FIRST_LANGUAGE[upper(l)] : SSC_OTHER_LANGUAGE[upper(l)]) ?? "" });
  for (const s of subjects) if (!languages.includes(s) && codeFor(SSC_CORE_CODE, s)) codes.push({ name: s, code: codeFor(SSC_CORE_CODE, s) });
  const rowOf = (p: Pupil | null) => {
    const r = p?.pupilRecord ?? null;
    const par = p ? parents(p) : { father: "", mother: "", guardian: "", phone: "", email: "" };
    const en = marathiNameParts(p?.user.name ?? "", par.father);
    const local = r?.nameLocal ? marathiNameParts(r.nameLocal, r.fatherNameLocal ?? "") : null;
    const row: Record<string, unknown> = {
      "School index no.": school.affiliationNumber ?? "",
      "UDISE": school.udiseCode ?? "",
      "Std.": grade,
      "Division": p?.enrollments[0]?.class.section ?? "",
      "Surname": upper(en.surname),
      "First name": upper(en.first),
      "Father's name": upper(en.middle),
      "Mother's name": upper(par.mother),
      "आडनाव": local?.surname ?? "",
      "नाव": local?.first ?? "",
      "वडिलांचे नाव": local?.middle ?? "",
      "आईचे नाव": r?.motherNameLocal ?? "",
      "Date of birth (DD/MM/YYYY)": ddmmyyyy(p?.user.birthdate, "/"),
      "Gender": r?.gender === "M" ? "Male" : r?.gender === "F" ? "Female" : r?.gender === "T" ? "Transgender" : "",
      "Category": upper(r?.category),
      "Caste": r?.caste ?? "",
      "Medium": school.medium ?? "",
      "Mother tongue": languageName(r?.motherTongue),
      "PEN": p?.user.penNumber ?? r?.penNumber ?? "",
      "GR no.": r?.admissionNumber ?? "",
      "Mobile": par.phone.replace(/\D/g, "").slice(-10),
    };
    codes.forEach((s, i) => {
      row[`Subject ${i + 1} code`] = s.code;
      row[`Subject ${i + 1}`] = s.name;
    });
    return row;
  };
  const rows = pupils.map(rowOf);
  const csv = csvWithHeaders(rows, () => rowOf(null));
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "compliance.export", meta: { kind: "msbshse-candidates", grade, rows: rows.length } });
  return { filename: `msbshse-candidates-std-${filenameSafe(grade)}-${today()}.csv`, csv, rows: rows.length };
}

/** The filing fields, for the office's record pages to name what the sheet needs. */
export const FILING_FIELDS: readonly PupilRecordField[] = FILING_RECORD_FIELDS;
