import "server-only";
import type { FilingIdentitySave, FilingsView, PupilRecordField } from "@edulink/contracts";
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
export const CATEGORY_CODE: Record<string, string> = { GENERAL: "1", GEN: "1", SC: "2", ST: "3", OBC: "4" };
/** UDISE+ SDMS: Muslim-1, Christian-2, Sikh-3, Buddhist-4, Parsi-5, Jain-6, Not Minority-7 — from the religion the record holds. */
export const MINORITY_CODE: Record<string, string> = { MUSLIM: "1", ISLAM: "1", CHRISTIAN: "2", CHRISTIANITY: "2", SIKH: "3", SIKHISM: "3", BUDDHIST: "4", BUDDHISM: "4", PARSI: "5", ZOROASTRIAN: "5", JAIN: "6", JAINISM: "6" };
/** The 21 impairment types of the UDISE+ student module, by code — kept in filing-codes.ts so the record form can show them without this file's server-only imports. */
export { CWSN_TYPE_NAMES };
/** UDISE+ DCF §3.2.12. */
const APPOINTMENT_CODE: Record<string, string> = { REGULAR: "1", CONTRACT: "2", PART_TIME: "3" };
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
  [/^math/i, "041"], [/^science/i, "086"], [/social/i, "087"], [/computer app|^it$|information tech/i, "402"], [/artificial intel|^ai$/i, "417"], [/home sci/i, "064"], [/painting|^art/i, "049"],
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
/** The classes-taught code of §3.2.16 from the grades a teacher's classes span. */
function classesTaughtCode(grades: string[]): string {
  const nums = grades.map((g) => Number(g)).filter((n) => Number.isInteger(n));
  const pre = grades.some((g) => /^PP/.test(classCode(g)));
  const primary = nums.some((n) => n >= 1 && n <= 5);
  const upper = nums.some((n) => n >= 6 && n <= 8);
  const secondary = nums.some((n) => n >= 9 && n <= 10);
  const higher = nums.some((n) => n >= 11);
  if (pre && !primary && !upper && !secondary && !higher) return "10";
  if (pre && primary && !upper && !secondary && !higher) return "11";
  if (primary && !upper && !secondary && !higher) return "1";
  if (upper && !primary && !secondary && !higher) return "2";
  if (primary && upper && !secondary && !higher) return "3";
  if (secondary && !primary && !upper && !higher) return "5";
  if (higher && !primary && !upper && !secondary) return "6";
  if (upper && secondary && !primary && !higher) return "7";
  if (secondary && higher && !primary && !upper) return "8";
  return grades.length ? "3" : "";
}

/* -------------------------------------------------------------------------- */
/* Identity and readiness                                                       */
/* -------------------------------------------------------------------------- */

const IDENTITY_FIELDS = ["udiseCode", "board", "affiliationNumber", "district", "block", "medium", "managementType"] as const;

async function identityOf(schoolId: string) {
  const s = await db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { udiseCode: true, board: true, affiliationNumber: true, district: true, block: true, medium: true, managementType: true, region: true, city: true, postalCode: true, name: true, locale: true } });
  return { ...s, identity: { udiseCode: s.udiseCode, board: s.board, affiliationNumber: s.affiliationNumber, district: s.district, block: s.block, medium: s.medium, managementType: s.managementType, state: s.region, city: s.city, postalCode: s.postalCode } };
}

const STAFF_FILING_FIELDS = ["gender", "socialCategory", "academicQualification", "professionalQualification", "appointmentType", "joinedOn"] as const;

/** The office's page: the identity, who is ready and who is not, and the grades a board sheet can be cut for. */
export async function filingsView(ctx: ActiveContext): Promise<FilingsView> {
  const caller = office(ctx);
  const [school, pupils, staff, classes, year] = await Promise.all([
    identityOf(caller.schoolId),
    db.membership.findMany({ where: { schoolId: caller.schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null }, select: { pupilRecord: true } }),
    db.membership.findMany({ where: { schoolId: caller.schoolId, role: { in: ["TEACHER", "PRINCIPAL"] }, status: "ACTIVE", leftAt: null }, select: { staffRecord: true } }),
    db.class.findMany({ where: { schoolId: caller.schoolId, archivedAt: null }, select: { gradeLevel: true, _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } } }),
    db.academicYear.findFirst({ where: { schoolId: caller.schoolId, isCurrent: true }, select: { name: true } }),
  ]);
  const pupilMissing: Record<string, number> = {};
  let pupilsReady = 0;
  let withoutLocalName = 0;
  for (const p of pupils) {
    const missing = missingFilingFields(p.pupilRecord);
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
      user: { select: { name: true, birthdate: true, email: true, phone: true } },
      pupilRecord: true,
      enrollments: { where: { status: "ACTIVE", class: { archivedAt: null } }, select: { enrolledAt: true, class: { select: { name: true, gradeLevel: true, section: true } } }, take: 1, orderBy: { enrolledAt: "desc" } },
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

/** The parents' names as UDISE+ wants them: the record's, else the linked guardian's where the relation says which. */
function parents(p: Pupil) {
  const g = p.guardianships[0];
  return {
    father: p.pupilRecord?.fatherName ?? "",
    mother: p.pupilRecord?.motherName ?? "",
    guardian: g && g.relation !== "PARENT" ? g.parent.name : "",
    phone: g?.parent.phone ?? p.user.phone ?? "",
    email: g?.parent.email ?? "",
  };
}

/** The year's attendance and the annual card, per pupil, for the "previous year" columns. */
async function lastYearFacts(schoolId: string, ids: string[]) {
  const year = await db.academicYear.findFirst({ where: { schoolId, isCurrent: true }, select: { id: true, startDate: true } });
  const previous = year ? await db.academicYear.findFirst({ where: { schoolId, endDate: { lt: year.startDate } }, orderBy: { endDate: "desc" }, select: { id: true, startDate: true, endDate: true } }) : null;
  const attended = new Map<string, number>();
  const percent = new Map<string, number>();
  if (!previous) return { attended, percent };
  const from = previous.startDate.toISOString().slice(0, 10), to = previous.endDate.toISOString().slice(0, 10);
  const [records, cards] = await Promise.all([
    db.attendanceRecord.groupBy({ by: ["studentMembershipId"], where: { schoolId, studentMembershipId: { in: ids }, status: { in: ["PRESENT", "LATE"] }, session: { dateKey: { gte: from, lte: to } } }, _count: { _all: true } }),
    db.reportCard.findMany({ where: { schoolId, studentMembershipId: { in: ids }, academicYearId: previous.id, termId: null, status: "PUBLISHED", overallPercentMilli: { not: null } }, select: { studentMembershipId: true, overallPercentMilli: true } }),
  ]);
  for (const r of records) attended.set(r.studentMembershipId, Math.min(r._count._all, 250));
  for (const c of cards) percent.set(c.studentMembershipId, Math.round((c.overallPercentMilli ?? 0) / 1000));
  return { attended, percent };
}

/**
 * UDISE+ SDMS bulk sheet: the fifty-four columns of the student template in
 * its order, coded as its validation sheet codes them; the Aadhaar columns
 * blank; dates DD-MM-YYYY; names in capitals.
 */
export async function udiseStudentsExport(ctx: ActiveContext): Promise<CsvExport> {
  const caller = admin(ctx);
  const [pupils, school] = await Promise.all([loadPupils(caller.schoolId), identityOf(caller.schoolId)]);
  const facts = await lastYearFacts(caller.schoolId, pupils.map((p) => p.id));
  let roll = 0;
  let lastClass = "";
  const rowOf = (p: Pupil | null) => {
    const r = p?.pupilRecord ?? null;
    const klass = p?.enrollments[0]?.class;
    const grade = classCode(klass?.gradeLevel);
    const classKey = `${grade}/${klass?.section ?? "A"}`;
    roll = classKey === lastClass ? roll + 1 : 1;
    lastClass = classKey;
    const par = p ? parents(p) : { father: "", mother: "", guardian: "", phone: "", email: "" };
    const isCwsn = r?.cwsnType ? "1" : r ? "2" : "";
    const sameSchool = p ? (year(p.joinedAt) < year(new Date()) ? "1" : "2") : "";
    return {
      "Grade/Class": grade,
      "SECTION": klass?.section ?? "A",
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
      "MOTHER TONGUE": r?.motherTongue ?? "",
      "SOCIAL CATEGORY (General-1, SC-2, ST-3, OBC-4)": CATEGORY_CODE[upper(r?.category)] ?? "",
      "MINORITY GROUP (Muslim-1, Christian-2, Sikh-3, Buddhist-4, Parsi-5, Jain-6, Not Minority-7)": r?.religion ? (MINORITY_CODE[upper(r.religion)] ?? "7") : "",
      "Is BPL BENEFICIARY (Yes-1, No-2)": yesNo(r?.bpl),
      "Whether AAY beneficiary": "",
      "BELONGS TO EWS/DISADVANTAGED GROUP (Yes-1, No-2)": yesNo(r?.ews),
      "IS CWSN (Yes-1, No-2)": isCwsn,
      "CWSN IMPAIRMENT TYPE": r?.cwsnType ?? "",
      "CHILD IS INDIAN NATIONAL (Yes-1, No-2)": r?.nationality ? (/india/i.test(r.nationality) ? "1" : "2") : "",
      "CHILD IS OUT-OF-SCHOOL-CHILD (Yes-1, No-2)": "2",
      "When mainstreamed": "",
      "Admission Number": r?.admissionNumber ?? "",
      "ADMISSION DATE (DD-MM-YYYY)": ddmmyyyy(r?.admissionDate ?? p?.joinedAt),
      "STUDENT STREAM (HS only)": "",
      "PREVIOUS ACADEMIC YEAR SCHOOLING STATUS": sameSchool,
      "CLASS STUDIED IN PREVIOUS ACADEMIC YEAR": sameSchool === "1" && /^\d+$/.test(grade) ? String(Number(grade) - 1 || "PP") : "",
      "ADMITTED/ENROLLED UNDER RTE/EWS": r?.ews ? "2" : r ? "0" : "",
      "APPEARED FOR EXAM IN PREVIOUS CLASS": p && sameSchool === "1" ? (facts.percent.has(p.id) ? "1" : "") : "",
      "RESULT FOR PREVIOUS EXAM": p && sameSchool === "1" && facts.percent.has(p.id) ? "1" : "",
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

const year = (d: Date) => d.getUTCFullYear();
const today = () => new Date().toISOString().slice(0, 10);

const UDISE_CLASSES = ["PP", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"] as const;
const UDISE_CLASS_LABEL: Record<string, string> = { PP: "Pre-Primary", "1": "I", "2": "II", "3": "III", "4": "IV", "5": "V", "6": "VI", "7": "VII", "8": "VIII", "9": "IX", "10": "X", "11": "XI", "12": "XII" };

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
    const col = (UDISE_CLASSES as readonly string[]).includes(cls) ? cls : cls.startsWith("PP") ? "PP" : cls;
    if (r[col]) r[col][key] += 1;
    r.Total[key] += 1;
  };
  for (const p of pupils) {
    const r = p.pupilRecord;
    const cls = classCode(p.enrollments[0]?.class.gradeLevel);
    const g = r?.gender ?? null;
    const cat = CATEGORY_CODE[upper(r?.category)] ? upper(r?.category) === "GEN" ? "GENERAL" : upper(r?.category) : "Not on record";
    bump("4.2 Enrolment by social category", cat, cls, g);
    bump("4.2 Enrolment by social category", "Total", cls, g);
    if (r?.religion && MINORITY_CODE[upper(r.religion)]) bump("4.2(b) Minority groups", r.religion.trim(), cls, g);
    const age = p.user.birthdate ? ageInYears(p.user.birthdate) : null;
    bump("4.4 Enrolment by age", age === null ? "Age not on record" : age < 5 ? "<5" : age > 22 ? ">22" : String(age), cls, g);
    if (r?.cwsnType) bump("4.6 CWSN by impairment", `${r.cwsnType} ${CWSN_TYPE_NAMES[r.cwsnType] ?? ""}`.trim(), cls, g);
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
      select: { id: true, role: true, subjects: true, joinedAt: true, user: { select: { name: true, birthdate: true, email: true, phone: true } }, staffRecord: true, classTeachers: { select: { class: { select: { gradeLevel: true } } } }, timetableSlots: { where: { class: { archivedAt: null } }, select: { subject: true, class: { select: { gradeLevel: true } } } } },
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
    const grades = s ? [...new Set([...s.classTeachers.map((c) => c.class.gradeLevel), ...s.timetableSlots.map((t) => t.class.gradeLevel)].filter((g): g is string => Boolean(g)))] : [];
    return {
      "UDISE Code of School": school.udiseCode ?? "",
      "Teacher National Code": "",
      "3.2.1 Name of the Teacher": upper(s?.user.name),
      "3.2.2 Gender (Male-1, Female-2, Transgender-3)": GENDER_CODE[r?.gender ?? ""] ?? "",
      "3.2.3 Date of Birth (DD/MM/YYYY)": ddmmyyyy(s?.user.birthdate, "/"),
      "3.2.4 Teacher Code of State": r?.staffNumber ?? "",
      "3.2.5 Social Category (General-1, SC-2, ST-3, OBC-4)": CATEGORY_CODE[r?.socialCategory ?? ""] ?? "",
      "3.2.6(a) Highest Academic Qualification": r?.academicQualification ?? "",
      "3.2.6(b) Trade/Degree": r?.qualification ?? "",
      "3.2.7(a) Highest Professional Qualification": r?.professionalQualification ?? "",
      "3.2.8(a) Mobile Number": (s?.user.phone ?? "").replace(/\D/g, "").slice(-10),
      "3.2.8(b) Email": s?.user.email ?? "",
      "3.2.9(a) Aadhaar Number": "",
      "3.2.12 Nature of Appointment (Regular-1, Contract-2, Part-Time-3)": APPOINTMENT_CODE[r?.appointmentType ?? ""] ?? "",
      "3.2.13 Type of Teacher": TEACHER_TYPE_CODE[s?.role ?? ""] ?? "",
      "3.2.14 Date of Joining in Service (DD/MM/YYYY)": ddmmyyyy(r?.joinedOn ?? null, "/"),
      "3.2.15 Date of Joining in Present School (DD/MM/YYYY)": ddmmyyyy(r?.joinedOn ?? s?.joinedAt, "/"),
      "3.2.16 Classes Taught": classesTaughtCode(grades),
      "3.2.18 Appointed for Subject": r?.designation ?? "",
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
  const coded = subjects.map((s) => ({ name: s, code: codeFor(table, s) })).filter((s) => s.code).slice(0, 7);
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
      "CWSN": r?.cwsnType ? "Yes" : p ? "No" : "",
      "PEN": r?.penNumber ?? "",
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
  return { filename: `cbse-candidates-class-${grade}-${today()}.csv`, csv, rows: rows.length };
}

/** Surname, first name and the father's name the way the Maharashtra board prints a candidate: the full name split, the record's father as the middle name. */
function marathiNameParts(fullName: string, father: string): { surname: string; first: string; middle: string } {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0] ?? "";
  const surname = parts.length > 1 ? parts[parts.length - 1]! : "";
  const middle = father.trim().split(/\s+/)[0] ?? (parts.length > 2 ? parts[1]! : "");
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
  const medium = upper(school.medium);
  const languages = subjects.filter((s) => SSC_FIRST_LANGUAGE[upper(s)] || SSC_OTHER_LANGUAGE[upper(s)]);
  const codes: { name: string; code: string }[] = [];
  for (const l of languages) codes.push({ name: l, code: (upper(l) === medium ? SSC_FIRST_LANGUAGE[upper(l)] : SSC_OTHER_LANGUAGE[upper(l)]) ?? "" });
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
      "Mother tongue": r?.motherTongue ?? "",
      "PEN": r?.penNumber ?? "",
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
  return { filename: `msbshse-candidates-std-${grade}-${today()}.csv`, csv, rows: rows.length };
}

/** The filing fields, for the office's record pages to name what the sheet needs. */
export const FILING_FIELDS: readonly PupilRecordField[] = FILING_RECORD_FIELDS;
