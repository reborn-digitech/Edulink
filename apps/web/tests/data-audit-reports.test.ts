/**
 * The data-flow audit, second pass: every REPORT, EXPORT and FILING the app
 * cuts, recomputed cell by cell from the rows it reads, and a scan of the
 * inputs the school still has to enter before those sheets are whole.
 *
 * Runs with DATA_AUDIT=1 (npm run data:audit) against the demo schools and
 * ZZ Northgate, like data-audit.test.ts, and writes docs/data-audit/reports.md.
 * FAIL = the sheet disagrees with its own rows; WARN = a snapshot that has
 * drifted or a figure a blank input makes wrong; INFO = inputs still needed.
 */
import { MOTHER_TONGUES } from "@edulink/contracts";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseCsvRecords } from "@/lib/csv";
import { udiseStudentsExport, udiseEnrolmentExport, udiseTeachersExport, cbseCandidatesExport, msbshseCandidatesExport, filingsView } from "@/lib/filings";
import { registerExport, enrolmentExport } from "@/lib/attendance-export";
import { monthRoll } from "@/lib/attendance-history";
import { collectionsExport, outstandingExport, duesList } from "@/lib/fees-reports";
import { staffMonthCsvRows } from "@/lib/staff-attendance";
import { leaveBalanceFor } from "@/lib/staff-records";
import { classInsights, defaultWindow } from "@/lib/insights";
import { buildProgressReport } from "@/lib/reports";
import { schoolYearArchive, listClosedYears } from "@/lib/year-archive";
import { messagingOverview } from "@/lib/messaging";
import { retentionPreview } from "@/lib/retention";
import { HOLIDAY_KIND_META } from "@/lib/holiday-kinds";
import { todayKey } from "@/lib/dates";
import { PUPIL_CATEGORIES } from "@edulink/contracts";
import type { ActiveContext } from "@/lib/session";

const RUN = process.env.DATA_AUDIT === "1";
const d = RUN ? describe : describe.skip;
/** The audit's own reading of a stored mother tongue: a code of the list as the language's English name, anything else as it stands. */
const languageWord = (stored: string | null | undefined): string => {
  if (!stored) return "";
  if (stored === "OTHER") return "Other";
  return (MOTHER_TONGUES as readonly string[]).includes(stored) ? stored[0] + stored.slice(1).toLowerCase() : stored.trim();
};

const db = new PrismaClient();

type Finding = { check: string; level: "FAIL" | "WARN" | "INFO"; school: string; detail: string };
const findings: Finding[] = [];
const note = (check: string, level: Finding["level"], school: string, detail: string) => findings.push({ check, level, school, detail });
const failsOf = (check: string) => findings.filter((f) => f.check === check && f.level === "FAIL").map((f) => `${f.school}: ${f.detail}`);

type School = { id: string; name: string; slug: string; timezone: string; teachingDays: string; udiseCode: string | null; board: string | null; medium: string | null; affiliationNumber: string | null; district: string | null; block: string | null; managementType: string | null; addressLine: string | null; logoPath: string | null; reportCardConfig: string | null; feeReceiptPrefix: string | null };
let schools: School[] = [];
const ctxs = new Map<string, { admin: ActiveContext | null; principal: ActiveContext | null }>();

const rowsOf = (csv: string) => {
  const { records } = parseCsvRecords(csv);
  const [headers = [], ...rows] = records;
  return { headers, rows: rows.map((r) => Object.fromEntries(headers.map((h, i) => [h, r[i] ?? ""])) as Record<string, string>) };
};
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const upper = (v: string | null | undefined) => (v ?? "").trim().toUpperCase();
const ddmmyyyy = (dt: Date | null | undefined, sep = "-") => (dt ? `${String(dt.getUTCDate()).padStart(2, "0")}${sep}${String(dt.getUTCMonth() + 1).padStart(2, "0")}${sep}${dt.getUTCFullYear()}` : "");
const CATEGORY: Record<string, string> = { GENERAL: "1", GEN: "1", SC: "2", ST: "3", OBC: "4", VJ: "4", NT: "4", SBC: "4" };
const MINORITY: Record<string, string> = { MUSLIM: "1", ISLAM: "1", CHRISTIAN: "2", CHRISTIANITY: "2", SIKH: "3", SIKHISM: "3", BUDDHIST: "4", BUDDHISM: "4", PARSI: "5", ZOROASTRIAN: "5", JAIN: "6", JAINISM: "6", HINDU: "7", HINDUISM: "7", OTHER: "7" };
const GENDER: Record<string, string> = { M: "1", F: "2", T: "3" };
const APPOINTMENT: Record<string, string> = { REGULAR: "1", CONTRACT: "2", PART_TIME: "3" };
const TEACHER_TYPE: Record<string, string> = { TEACHER: "3", PRINCIPAL: "6", ADMIN: "1" };
const yesNo = (v: boolean | null | undefined) => (v === true ? "1" : v === false ? "2" : "");
const ctxOf = (userId: string, membershipId: string, schoolId: string, role: "ADMIN" | "PRINCIPAL"): ActiveContext => ({ user: { id: userId, name: "x", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", locale: "en" } as never }, sessionId: "s", membershipId, schoolId, role });

beforeAll(async () => {
  if (!RUN) return;
  const slugs = process.env.DATA_AUDIT_SCHOOLS?.split(",").map((s) => s.trim()).filter(Boolean);
  const where = slugs?.length ? { slug: { in: slugs } } : { OR: [{ contactEmail: { endsWith: "@demo.relay.test" } }, { slug: "zz-northgate-school" }] };
  schools = await db.school.findMany({ where, select: { id: true, name: true, slug: true, timezone: true, teachingDays: true, udiseCode: true, board: true, medium: true, affiliationNumber: true, district: true, block: true, managementType: true, addressLine: true, logoPath: true, reportCardConfig: true, feeReceiptPrefix: true }, orderBy: { name: "asc" } });
  for (const s of schools) {
    const admin = await db.membership.findFirst({ where: { schoolId: s.id, role: "ADMIN", status: "ACTIVE", leftAt: null }, select: { id: true, userId: true }, orderBy: { joinedAt: "asc" } });
    const principal = await db.membership.findFirst({ where: { schoolId: s.id, role: "PRINCIPAL", status: "ACTIVE", leftAt: null }, select: { id: true, userId: true }, orderBy: { joinedAt: "asc" } });
    ctxs.set(s.id, { admin: admin ? ctxOf(admin.userId, admin.id, s.id, "ADMIN") : null, principal: principal ? ctxOf(principal.userId, principal.id, s.id, "PRINCIPAL") : null });
  }
});

afterAll(async () => {
  if (RUN) {
    const dir = resolve(__dirname, "../../../docs/data-audit");
    mkdirSync(dir, { recursive: true });
    const by = (level: Finding["level"]) => findings.filter((f) => f.level === level);
    const lines = ["# Data-flow audit — reports, exports and filings (second pass)", "", `Run: ${new Date().toISOString()} · schools: ${schools.map((s) => s.name).join(", ")} · ${by("FAIL").length} FAIL · ${by("WARN").length} WARN · ${by("INFO").length} INFO`, "", "Regenerate with `npm run data:audit` from apps/web. FAIL = a sheet disagrees with its own rows; WARN = a stale snapshot or a figure a blank input makes wrong; INFO = inputs the school still has to enter.", ""];
    for (const level of ["FAIL", "WARN", "INFO"] as const) {
      const rows = by(level);
      if (!rows.length) continue;
      lines.push(`## ${level} (${rows.length})`, "", "| check | school | detail |", "|---|---|---|");
      for (const f of rows) lines.push(`| ${f.check} | ${f.school} | ${f.detail.replace(/\|/g, "\\|")} |`);
      lines.push("");
    }
    writeFileSync(resolve(dir, "reports.md"), lines.join("\n"));
  }
  await db.$disconnect();
});

/** The pupils a filing reads, loaded the same way but through raw rows. */
async function rawPupils(schoolId: string, grade?: string) {
  return db.membership.findMany({
    where: { schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null, ...(grade ? { enrollments: { some: { status: "ACTIVE", class: { gradeLevel: grade, archivedAt: null } } } } : {}) },
    select: { id: true, joinedAt: true, user: { select: { name: true, birthdate: true, phone: true, email: true, penNumber: true } }, pupilRecord: true, enrollments: { where: { status: "ACTIVE", class: { archivedAt: null } }, select: { rollNumber: true, enrolledAt: true, class: { select: { name: true, gradeLevel: true, section: true } } }, orderBy: { enrolledAt: "desc" }, take: 1 }, guardianships: { where: { status: "ACTIVE" }, select: { relation: true, parent: { select: { name: true, phone: true, email: true } } }, take: 1 } },
  });
}

d("the five filing sheets, cell by cell", () => {
  it("UDISE+ student sheet: every coded column from the record, the phone from the guardian, the previous-year columns from last year's card and register", async () => {
    for (const s of schools) {
      const ctx = ctxs.get(s.id)?.admin;
      if (!ctx) { note("udise-students", "INFO", s.name, "no admin to cut the sheet as"); continue; }
      const { rows } = rowsOf((await udiseStudentsExport(ctx)).csv);
      const pupils = await rawPupils(s.id);
      if (rows.length !== pupils.length) note("udise-students", "FAIL", s.name, `${rows.length} rows for ${pupils.length} pupils on the roll`);
      const year = await db.academicYear.findFirst({ where: { schoolId: s.id, isCurrent: true }, select: { startDate: true } });
      const previous = year ? await db.academicYear.findFirst({ where: { schoolId: s.id, endDate: { lt: year.startDate } }, orderBy: { endDate: "desc" }, select: { id: true, startDate: true, endDate: true } }) : null;
      const byName = new Map<string, Record<string, string>[]>();
      for (const r of rows) byName.set(r["Name of Student"]!, [...(byName.get(r["Name of Student"]!) ?? []), r]);
      const seenRoll = new Map<string, Set<string>>();
      let checked = 0;
      for (const p of pupils) {
        const candidates = byName.get(upper(p.user.name)) ?? [];
        const r = candidates.length === 1 ? candidates[0]! : candidates.find((c) => c["DOB (DD-MM-YYYY)"] === ddmmyyyy(p.user.birthdate));
        if (!r) { note("udise-students", "FAIL", s.name, `${upper(p.user.name)} has no row (or two alike)`); continue; }
        checked += 1;
        const rec = p.pupilRecord;
        const g = p.guardianships[0];
        const exp: Record<string, string> = {
          "GENDER": GENDER[rec?.gender ?? ""] ?? "",
          "DOB (DD-MM-YYYY)": ddmmyyyy(p.user.birthdate),
          "MOTHER NAME": upper(rec?.motherName),
          "FATHER NAME": upper(rec?.fatherName),
          "PINCODE": rec?.postalCode ?? "",
          // A linked guardian's proved number, then the record's own, then the pupil's.
          "MOBILE NUMBER": (g?.parent.phone ?? rec?.guardianPhone ?? p.user.phone ?? "").replace(/\D/g, "").slice(-10),
          // The language's name from its code; a word typed before the list as it stands.
          "MOTHER TONGUE": languageWord(rec?.motherTongue),
          "SOCIAL CATEGORY (General-1, SC-2, ST-3, OBC-4)": CATEGORY[upper(rec?.category)] ?? "",
          "MINORITY GROUP (Muslim-1, Christian-2, Sikh-3, Buddhist-4, Parsi-5, Jain-6, Not Minority-7)": MINORITY[upper(rec?.religion)] ?? "",
          "Is BPL BENEFICIARY (Yes-1, No-2)": yesNo(rec?.bpl),
          "BELONGS TO EWS/DISADVANTAGED GROUP (Yes-1, No-2)": yesNo(rec?.ews),
          "IS CWSN (Yes-1, No-2)": rec?.cwsnType ? "1" : rec ? "2" : "",
          "CWSN IMPAIRMENT TYPE": rec?.cwsnType ?? "",
          "Admission Number": rec?.admissionNumber ?? "",
          "ADMISSION DATE (DD-MM-YYYY)": ddmmyyyy(rec?.admissionDate ?? p.joinedAt),
          "Grade/Class": p.enrollments[0]?.class.gradeLevel ?? "",
          "SECTION": p.enrollments[0]?.class.section ?? "A",
        };
        for (const [k, v] of Object.entries(exp)) if ((r[k] ?? "") !== v) note("udise-students", "FAIL", s.name, `${upper(p.user.name)} ${k}: sheet "${r[k]}" vs raw "${v}"`);
        if (p.enrollments[0]?.rollNumber != null && r["Roll no"] !== String(p.enrollments[0].rollNumber)) note("udise-students", "FAIL", s.name, `${upper(p.user.name)} roll no: sheet ${r["Roll no"]} vs enrolment ${p.enrollments[0].rollNumber}`);
        const cls = `${r["Grade/Class"]}/${r["SECTION"]}`;
        const set = seenRoll.get(cls) ?? new Set<string>();
        if (set.has(r["Roll no"]!)) note("udise-students", "WARN", s.name, `class ${cls}: roll number ${r["Roll no"]} appears twice`);
        set.add(r["Roll no"]!); seenRoll.set(cls, set);
        // Previous-year columns: the annual card and the register of the year before this one.
        if (previous) {
          const card = await db.reportCard.findFirst({ where: { schoolId: s.id, studentMembershipId: p.id, academicYearId: previous.id, termId: null, status: "PUBLISHED", overallPercentMilli: { not: null } }, select: { overallPercentMilli: true } });
          // Attended days are distinct days, and "was here last year" is the admission date (else the join date) before this year's start (filings.ts).
          const attendedRows = await db.attendanceRecord.findMany({ where: { schoolId: s.id, studentMembershipId: p.id, status: { in: ["PRESENT", "LATE"] }, session: { dateKey: { gte: previous.startDate.toISOString().slice(0, 10), lte: previous.endDate.toISOString().slice(0, 10) } } }, select: { session: { select: { dateKey: true } } } });
          const attended = new Set(attendedRows.map((r) => r.session.dateKey)).size;
          const admitted = rec?.admissionDate ?? p.joinedAt;
          const sameSchool = !!year && admitted.getTime() < year.startDate.getTime();
          const marks = card ? String(Math.round(card.overallPercentMilli! / 1000)) : "";
          if ((r["MARKS % OF PREVIOUS EXAM"] ?? "") !== marks) note("udise-students", "FAIL", s.name, `${upper(p.user.name)} marks %: sheet "${r["MARKS % OF PREVIOUS EXAM"]}" vs card ${marks || "none"}`);
          const days = attended ? String(Math.min(attended, 250)) : "";
          if ((r["CLASS ATTENDED DAYS (Previous Year)"] ?? "") !== days) note("udise-students", "FAIL", s.name, `${upper(p.user.name)} attended days: sheet "${r["CLASS ATTENDED DAYS (Previous Year)"]}" vs register ${days || "none"}`);
          if ((r["PREVIOUS ACADEMIC YEAR SCHOOLING STATUS"] ?? "") !== (sameSchool ? "1" : "2")) note("udise-students", "FAIL", s.name, `${upper(p.user.name)} previous-year status: sheet "${r["PREVIOUS ACADEMIC YEAR SCHOOLING STATUS"]}" vs admitted ${admitted.toISOString().slice(0, 10)}`);
          if (sameSchool && card && r["RESULT FOR PREVIOUS EXAM"] !== "1") note("udise-students", "FAIL", s.name, `${upper(p.user.name)} result: sheet "${r["RESULT FOR PREVIOUS EXAM"]}" with a card present`);
          if (sameSchool && !card) note("udise-students", "WARN", s.name, `${upper(p.user.name)} was here last year but has no published annual card — appeared/result/marks go out blank`);
        }
        // What the sheet needs that the school has not entered.
        const blanks = (["GENDER", "MOBILE NUMBER", "SOCIAL CATEGORY (General-1, SC-2, ST-3, OBC-4)", "Admission Number", "DOB (DD-MM-YYYY)"] as const).filter((k) => !r[k]);
        if (blanks.length) note("udise-students", "WARN", s.name, `${upper(p.user.name)} goes out with blank ${blanks.join(", ")}`);
        if (rec?.category && !(PUPIL_CATEGORIES as readonly string[]).includes(upper(rec.category)) && !CATEGORY[upper(rec.category)]) note("udise-students", "WARN", s.name, `${upper(p.user.name)} category "${rec.category}" is not a code the sheet knows`);
      }
      note("udise-students", "INFO", s.name, `${checked} pupils checked cell by cell across 18 coded columns`);
    }
    expect(failsOf("udise-students")).toEqual([]);
  });

  it("UDISE+ enrolment tables: every count sums back to the roll", async () => {
    for (const s of schools) {
      const ctx = ctxs.get(s.id)?.admin;
      if (!ctx) continue;
      const { rows, headers } = rowsOf((await udiseEnrolmentExport(ctx)).csv);
      const pupils = await rawPupils(s.id);
      const total = rows.find((r) => r.table === "4.2 Enrolment by social category" && r.row === "Total");
      if (!total) { note("udise-enrolment", "FAIL", s.name, "no Total row in 4.2"); continue; }
      const totalCols = headers.filter((h) => h.startsWith("Total "));
      const totalAll = sum(totalCols.map((h) => Number(total[h] ?? 0)));
      if (totalAll !== pupils.length) note("udise-enrolment", "FAIL", s.name, `4.2 Total counts ${totalAll} pupils, the roll has ${pupils.length}`);
      const boys = pupils.filter((p) => p.pupilRecord?.gender === "M").length, girls = pupils.filter((p) => p.pupilRecord?.gender === "F").length;
      if (Number(total["Total Boys"] ?? 0) !== boys || Number(total["Total Girls"] ?? 0) !== girls) note("udise-enrolment", "FAIL", s.name, `4.2 Total boys/girls ${total["Total Boys"]}/${total["Total Girls"]} vs raw ${boys}/${girls}`);
      const catRows = rows.filter((r) => r.table === "4.2 Enrolment by social category" && r.row !== "Total");
      const catSum = sum(catRows.map((r) => sum(totalCols.map((h) => Number(r[h] ?? 0)))));
      if (catSum !== pupils.length) note("udise-enrolment", "FAIL", s.name, `4.2 category rows sum to ${catSum}, the roll has ${pupils.length}`);
      const obc = catRows.find((r) => r.row === "OBC");
      const obcRaw = pupils.filter((p) => CATEGORY[upper(p.pupilRecord?.category)] === "4").length;
      if ((obc ? sum(totalCols.map((h) => Number(obc[h] ?? 0))) : 0) !== obcRaw) note("udise-enrolment", "FAIL", s.name, `OBC row vs raw code-4 pupils ${obcRaw} (VJ, NT and SBC file as OBC)`);
      const notOnRecord = catRows.find((r) => r.row === "Not on record");
      const uncoded = pupils.filter((p) => !CATEGORY[upper(p.pupilRecord?.category)]).length;
      if ((notOnRecord ? sum(totalCols.map((h) => Number(notOnRecord[h] ?? 0))) : 0) !== uncoded) note("udise-enrolment", "FAIL", s.name, `"Not on record" category count vs raw uncoded ${uncoded}`);
      const ageRows = rows.filter((r) => r.table === "4.4 Enrolment by age");
      const ageSum = sum(ageRows.map((r) => sum(totalCols.map((h) => Number(r[h] ?? 0)))));
      if (ageSum !== pupils.length) note("udise-enrolment", "FAIL", s.name, `4.4 age rows sum to ${ageSum}, the roll has ${pupils.length}`);
      const cwsnRows = rows.filter((r) => r.table === "4.6 CWSN by impairment");
      const cwsnSum = sum(cwsnRows.map((r) => sum(totalCols.map((h) => Number(r[h] ?? 0)))));
      const cwsnRaw = pupils.filter((p) => p.pupilRecord?.cwsnType).length;
      if (cwsnSum !== cwsnRaw) note("udise-enrolment", "FAIL", s.name, `4.6 CWSN counts ${cwsnSum}, raw ${cwsnRaw}`);
      const minRows = rows.filter((r) => r.table === "4.2(b) Minority groups");
      const minSum = sum(minRows.map((r) => sum(totalCols.map((h) => Number(r[h] ?? 0)))));
      const minRaw = pupils.filter((p) => { const c = MINORITY[upper(p.pupilRecord?.religion)]; return c && c !== "7"; }).length;
      if (minSum !== minRaw) note("udise-enrolment", "FAIL", s.name, `4.2(b) minority counts ${minSum}, raw ${minRaw}`);
      if (uncoded) note("udise-enrolment", "WARN", s.name, `${uncoded} pupil(s) file under "Not on record" for category`);
      const noGender = pupils.filter((p) => !p.pupilRecord?.gender).length;
      if (noGender) note("udise-enrolment", "WARN", s.name, `${noGender} pupil(s) have no gender on record and sit in the third column of every table`);
    }
    expect(failsOf("udise-enrolment")).toEqual([]);
  });

  it("UDISE+ teacher profile: codes, both dates, the type, the subjects and the classes from the record, the account and the timetable", async () => {
    for (const s of schools) {
      const ctx = ctxs.get(s.id)?.admin;
      if (!ctx) continue;
      const { rows } = rowsOf((await udiseTeachersExport(ctx)).csv);
      const staff = await db.membership.findMany({ where: { schoolId: s.id, role: { in: ["TEACHER", "PRINCIPAL"] }, status: "ACTIVE", leftAt: null }, select: { id: true, role: true, subjects: true, joinedAt: true, user: { select: { name: true, birthdate: true, phone: true, email: true } }, staffRecord: true, classTeachers: { where: { class: { archivedAt: null } }, select: { class: { select: { gradeLevel: true } } } }, timetableSlots: { where: { class: { archivedAt: null } }, select: { subject: true, class: { select: { gradeLevel: true } } } } } });
      if (rows.length !== staff.length) note("udise-teachers", "FAIL", s.name, `${rows.length} rows for ${staff.length} staff`);
      for (const m of staff) {
        const r = rows.find((x) => x["3.2.1 Name of the Teacher"] === upper(m.user.name));
        if (!r) { note("udise-teachers", "FAIL", s.name, `${upper(m.user.name)} has no row`); continue; }
        const rec = m.staffRecord;
        let profile: string[] = [];
        try { profile = (JSON.parse(m.subjects ?? "[]") as string[]).map((x) => x.trim()).filter(Boolean); } catch { profile = []; }
        const counts = new Map<string, number>();
        for (const t of m.timetableSlots) counts.set(t.subject.trim(), (counts.get(t.subject.trim()) ?? 0) + 1);
        const taught = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([n]) => n);
        const subjects = profile.length ? profile : taught;
        const exp: Record<string, string> = {
          "3.2.2 Gender (Male-1, Female-2, Transgender-3)": GENDER[rec?.gender ?? ""] ?? "",
          "3.2.3 Date of Birth (DD/MM/YYYY)": ddmmyyyy(rec?.birthdate ?? m.user.birthdate, "/"),
          "3.2.5 Social Category (General-1, SC-2, ST-3, OBC-4)": CATEGORY[rec?.socialCategory ?? ""] ?? "",
          "3.2.12 Nature of Appointment (Regular-1, Contract-2, Part-Time-3)": APPOINTMENT[rec?.appointmentType ?? ""] ?? "",
          "3.2.13 Type of Teacher": TEACHER_TYPE[m.role] ?? "",
          "3.2.14 Date of Joining in Service (DD/MM/YYYY)": ddmmyyyy(rec?.serviceJoinedOn ?? rec?.joinedOn ?? null, "/"),
          "3.2.15 Date of Joining in Present School (DD/MM/YYYY)": ddmmyyyy(rec?.joinedOn ?? m.joinedAt, "/"),
          "3.2.8(a) Mobile Number": (m.user.phone ?? "").replace(/\D/g, "").slice(-10),
          "3.2.19(a) Subject 1 name": subjects[0] ?? "",
          "3.2.19(b) Subject 2 name": subjects[1] ?? "",
        };
        for (const [k, v] of Object.entries(exp)) if ((r[k] ?? "") !== v) note("udise-teachers", "FAIL", s.name, `${upper(m.user.name)} ${k}: sheet "${r[k]}" vs raw "${v}"`);
        const grades = new Set([...m.classTeachers.map((c) => c.class.gradeLevel), ...m.timetableSlots.map((t) => t.class.gradeLevel)].filter(Boolean));
        if (grades.size && !r["3.2.16 Classes Taught"]) note("udise-teachers", "FAIL", s.name, `${upper(m.user.name)} teaches grades ${[...grades].join(",")} but classes-taught is blank`);
        if (subjects[0] && !r["3.2.19(a) Main Subject Taught 1"]) note("udise-teachers", "WARN", s.name, `${upper(m.user.name)} teaches "${subjects[0]}" which has no UDISE+ subject code`);
        const blanks = Object.entries(exp).filter(([k, v]) => !v && !k.includes("Subject 2") && !k.includes("Subject 1")).map(([k]) => k.split(" ")[0]);
        if (blanks.length) note("udise-teachers", "WARN", s.name, `${upper(m.user.name)} goes out with blank ${blanks.join(", ")}`);
      }
    }
    expect(failsOf("udise-teachers")).toEqual([]);
  });

  it("the board sheets: the grade's every pupil, the PEN from the account, the category as typed, the Maharashtra name order", async () => {
    for (const s of schools) {
      const ctx = ctxs.get(s.id)?.admin;
      if (!ctx) continue;
      const grades = await db.class.groupBy({ by: ["gradeLevel"], where: { schoolId: s.id, archivedAt: null, gradeLevel: { not: null } }, _count: true });
      const grade = grades.map((g) => g.gradeLevel!).filter((g) => /^\d+$/.test(g)).sort((a, b) => Number(b) - Number(a))[0];
      if (!grade) { note("board-sheets", "INFO", s.name, "no numbered grade to cut a sheet for"); continue; }
      const pupils = await rawPupils(s.id, grade);
      const cbse = rowsOf((await cbseCandidatesExport(ctx, grade)).csv).rows;
      const ms = rowsOf((await msbshseCandidatesExport(ctx, grade)).csv).rows;
      if (cbse.length !== pupils.length || ms.length !== pupils.length) note("board-sheets", "FAIL", s.name, `grade ${grade}: CBSE ${cbse.length} rows, MSBSHSE ${ms.length}, roll ${pupils.length}`);
      for (const p of pupils) {
        const c = cbse.find((r) => r["Candidate's Name"] === upper(p.user.name));
        if (!c) { note("board-sheets", "FAIL", s.name, `${upper(p.user.name)} missing from the CBSE sheet`); continue; }
        const rec = p.pupilRecord;
        if ((c["PEN"] ?? "") !== (p.user.penNumber ?? rec?.penNumber ?? "")) note("board-sheets", "FAIL", s.name, `${upper(p.user.name)} CBSE PEN "${c["PEN"]}" vs account ${p.user.penNumber}`);
        if ((c["Category"] ?? "") !== upper(rec?.category)) note("board-sheets", "FAIL", s.name, `${upper(p.user.name)} CBSE category "${c["Category"]}" vs "${upper(rec?.category)}"`);
        if ((c["Date of Birth (DD/MM/YYYY)"] ?? "") !== ddmmyyyy(p.user.birthdate, "/")) note("board-sheets", "FAIL", s.name, `${upper(p.user.name)} CBSE DOB`);
        if ((c["CWSN"] ?? "") !== (rec?.cwsnType ? "Yes" : "No")) note("board-sheets", "FAIL", s.name, `${upper(p.user.name)} CBSE CWSN`);
        const parts = p.user.name.trim().split(/\s+/);
        const m = ms.find((r) => r["First name"] === upper(parts[0]) && r["Surname"] === upper(parts.length > 1 ? parts[parts.length - 1] : ""));
        if (!m) { note("board-sheets", "FAIL", s.name, `${upper(p.user.name)} missing from the MSBSHSE sheet by name order`); continue; }
        if ((m["Mother's name"] ?? "") !== upper(rec?.motherName)) note("board-sheets", "FAIL", s.name, `${upper(p.user.name)} MSBSHSE mother's name`);
        if ((m["PEN"] ?? "") !== (p.user.penNumber ?? rec?.penNumber ?? "")) note("board-sheets", "FAIL", s.name, `${upper(p.user.name)} MSBSHSE PEN`);
        if (rec?.nameLocal && !m["नाव"]) note("board-sheets", "FAIL", s.name, `${upper(p.user.name)} has a local-script name but the sheet's नाव is blank`);
        if (!rec?.nameLocal) note("board-sheets", "WARN", s.name, `${upper(p.user.name)} has no name in the school's script — the Maharashtra pre-list goes out with blank Devanagari columns`);
      }
      if (!s.affiliationNumber) note("board-sheets", "WARN", s.name, "no affiliation or index number on the filing identity — both board sheets carry a blank first column");
    }
    expect(failsOf("board-sheets")).toEqual([]);
  });

  it("filings readiness: the counts the page shows are what the sheets above found blank", async () => {
    for (const s of schools) {
      const ctx = ctxs.get(s.id)?.admin;
      if (!ctx) continue;
      const view = await filingsView(ctx);
      const staff = await db.membership.findMany({ where: { schoolId: s.id, role: { in: ["TEACHER", "PRINCIPAL"] }, status: "ACTIVE", leftAt: null }, select: { staffRecord: true } });
      const fields = ["gender", "socialCategory", "academicQualification", "professionalQualification", "appointmentType", "joinedOn", "serviceJoinedOn"] as const;
      let ready = 0;
      const missing: Record<string, number> = {};
      for (const m of staff) {
        const gaps = fields.filter((f) => !(m.staffRecord as Record<string, unknown> | null)?.[f]);
        if (!gaps.length) ready += 1;
        for (const g of gaps) missing[g] = (missing[g] ?? 0) + 1;
      }
      if (view.staff.total !== staff.length || view.staff.ready !== ready) note("filings-readiness", "FAIL", s.name, `staff ${view.staff.ready}/${view.staff.total} vs raw ${ready}/${staff.length}`);
      for (const f of fields) if ((view.staff.missing[f] ?? 0) !== (missing[f] ?? 0)) note("filings-readiness", "FAIL", s.name, `staff missing ${f}: page ${view.staff.missing[f] ?? 0} vs raw ${missing[f] ?? 0}`);
    }
    expect(failsOf("filings-readiness")).toEqual([]);
  });
});

d("attendance, fees and staff exports", () => {
  it("register CSV: days present and days marked per pupil from the month's records", async () => {
    for (const s of schools) {
      const ctx = ctxs.get(s.id)?.admin;
      if (!ctx) continue;
      const last = await db.attendanceSession.findFirst({ where: { schoolId: s.id, class: { archivedAt: null } }, orderBy: { dateKey: "desc" }, select: { classId: true, dateKey: true } });
      if (!last) { note("register-csv", "INFO", s.name, "no register to export"); continue; }
      const month = last.dateKey.slice(0, 7);
      const file = await registerExport({ schoolId: s.id, user: { id: ctx.user.id } }, last.classId, month);
      if (!file) { note("register-csv", "FAIL", s.name, `no CSV for class ${last.classId} ${month}`); continue; }
      const { rows, headers } = rowsOf(file.csv);
      const days = headers.filter((h) => /^\d{4}-\d{2}-\d{2}$/.test(h));
      const sessions = await db.attendanceSession.findMany({ where: { schoolId: s.id, classId: last.classId, dateKey: { startsWith: month } }, select: { dateKey: true, records: { select: { studentMembershipId: true, status: true } } } });
      if (days.length !== sessions.length) note("register-csv", "FAIL", s.name, `${month}: ${days.length} day columns for ${sessions.length} sessions`);
      // The CSV's roll is the month's: everyone marked in it plus the enrolments live during it (attendance-history.ts monthRoll).
      const roll = await monthRoll(s.id, last.classId, month, sessions.map((x) => ({ dateKey: x.dateKey, records: x.records.map((r) => ({ studentMembershipId: r.studentMembershipId })) })) as never);
      if (rows.length !== roll.length) note("register-csv", "FAIL", s.name, `${month}: ${rows.length} rows for a month roll of ${roll.length}`);
      for (const e of roll) {
        const row = rows.find((r) => r.student_code === (e.studentCode ?? ""));
        if (!row) { note("register-csv", "FAIL", s.name, `pupil ${e.id} has no row`); continue; }
        const mine = sessions.flatMap((x) => x.records.filter((r) => r.studentMembershipId === e.id));
        const present = mine.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
        if (Number(row.days_present) !== present || Number(row.days_marked) !== mine.length) note("register-csv", "FAIL", s.name, `${e.id}: CSV ${row.days_present}/${row.days_marked} vs raw ${present}/${mine.length}`);
      }
      const enrol = rowsOf((await enrolmentExport({ schoolId: s.id, user: { id: ctx.user.id } })).csv).rows;
      const classes = await db.class.findMany({ where: { schoolId: s.id, archivedAt: null }, select: { gradeLevel: true, enrollments: { where: { status: "ACTIVE" }, select: { student: { select: { guardianships: { where: { status: "ACTIVE" }, select: { id: true }, take: 1 } } } } }, teachers: { select: { teacherMembershipId: true } } } });
      for (const r of enrol) {
        const mine = classes.filter((c) => (c.gradeLevel ?? "ungraded") === r.grade_level);
        const pupils = sum(mine.map((c) => c.enrollments.length));
        const withGuardian = sum(mine.map((c) => c.enrollments.filter((e) => e.student.guardianships.length > 0).length));
        const teachers = new Set(mine.flatMap((c) => c.teachers.map((t) => t.teacherMembershipId))).size;
        if (Number(r.classes) !== mine.length || Number(r.pupils_enrolled) !== pupils || Number(r.pupils_with_guardian_linked) !== withGuardian || Number(r.teachers_assigned) !== teachers) note("register-csv", "FAIL", s.name, `enrolment CSV grade ${r.grade_level}: ${r.classes}/${r.pupils_enrolled}/${r.pupils_with_guardian_linked}/${r.teachers_assigned} vs raw ${mine.length}/${pupils}/${withGuardian}/${teachers}`);
        if (pupils - withGuardian > 0) note("register-csv", "INFO", s.name, `grade ${r.grade_level}: ${pupils - withGuardian} pupil(s) have no guardian linked — no one to text, no phone on the UDISE+ sheet`);
      }
    }
    expect(failsOf("register-csv")).toEqual([]);
  });

  it("fees collections and outstanding CSVs: every row from the payments and the dues", async () => {
    for (const s of schools) {
      const ctx = ctxs.get(s.id)?.admin;
      if (!ctx) continue;
      const year = await db.academicYear.findFirst({ where: { schoolId: s.id, isCurrent: true }, select: { id: true, startDate: true, endDate: true } });
      if (!year) continue;
      const fromKey = year.startDate.toISOString().slice(0, 10), toKey = year.endDate.toISOString().slice(0, 10);
      const { rows } = rowsOf((await collectionsExport(ctx, { fromKey, toKey })).csv);
      const payments = await db.feePayment.findMany({ where: { schoolId: s.id, status: { in: ["PAID", "REVERSED", "REFUNDED"] }, paidAt: { gte: year.startDate, lt: new Date(year.endDate.getTime() + 86_400_000) } }, select: { id: true, amountPaise: true, status: true, receipt: { select: { serial: true } }, refunds: { select: { amountPaise: true } } } });
      if (rows.length !== payments.length) note("fees-csv", "FAIL", s.name, `collections: ${rows.length} rows for ${payments.length} payments in the year`);
      for (const p of payments) {
        const r = p.receipt ? rows.find((x) => x.receipt === p.receipt!.serial) : null;
        if (!p.receipt) { note("fees-csv", "WARN", s.name, `payment ${p.id} (${p.status}) has no receipt, so its CSV row carries no serial`); continue; }
        if (!r) { note("fees-csv", "FAIL", s.name, `receipt ${p.receipt.serial} has no row`); continue; }
        if (r.amount !== (p.amountPaise / 100).toFixed(2) || r.refunded !== (sum(p.refunds.map((x) => x.amountPaise)) / 100).toFixed(2) || r.status !== p.status) note("fees-csv", "FAIL", s.name, `receipt ${p.receipt.serial}: ${r.amount}/${r.refunded}/${r.status} vs raw ${(p.amountPaise / 100).toFixed(2)}/${(sum(p.refunds.map((x) => x.amountPaise)) / 100).toFixed(2)}/${p.status}`);
        if (!r.grade) note("fees-csv", "WARN", s.name, `receipt ${p.receipt.serial}: grade column blank`);
      }
      const out = rowsOf((await outstandingExport(ctx)).csv).rows;
      const dues = await duesList(ctx, { status: "open", pageSize: 200, page: 1 });
      if (out.length !== dues.total) note("fees-csv", "FAIL", s.name, `outstanding CSV ${out.length} rows vs dues page total ${dues.total}`);
      // Leavers with a balance stay on the defaulter list, flagged; the CSV total is every OPEN/PART demand of the year.
      const demands = await db.feeDemand.findMany({ where: { schoolId: s.id, academicYearId: year.id, status: { in: ["OPEN", "PART"] } }, select: { studentMembershipId: true, netPaise: true, paidPaise: true } });
      const rawOutstanding = sum(demands.map((x) => Math.max(0, x.netPaise - x.paidPaise)));
      const csvOutstanding = Math.round(sum(out.map((r) => Number(r.outstanding))) * 100);
      if (csvOutstanding !== rawOutstanding) note("fees-csv", "FAIL", s.name, `outstanding CSV totals ${csvOutstanding} paise vs raw ${rawOutstanding}`);
      const leaverRows = out.filter((r) => r.left === "yes").length;
      const leaverDemands = await db.feeDemand.count({ where: { schoolId: s.id, academicYearId: year.id, status: { in: ["OPEN", "PART"] }, student: { OR: [{ leftAt: { not: null } }, { status: { not: "ACTIVE" } }] } } });
      if (leaverDemands && !leaverRows) note("fees-csv", "FAIL", s.name, `${leaverDemands} open demand(s) belong to pupils off the roll but no CSV row is flagged left`);
      if (leaverRows) note("fees-csv", "INFO", s.name, `${leaverRows} defaulter row(s) belong to pupils who have left, flagged in the CSV`);
    }
    expect(failsOf("fees-csv")).toEqual([]);
  });

  it("staff month CSV and leave balances: day codes from the rows, used days from approved leave on open teaching days", async () => {
    for (const s of schools) {
      const ctx = ctxs.get(s.id)?.admin;
      if (!ctx) continue;
      const month = todayKey(s.timezone).slice(0, 7);
      const { rows, headers } = await staffMonthCsvRows(ctx, month);
      const days = headers.filter((h) => /^\d{4}-\d{2}-\d{2}$/.test(h));
      const marks = await db.staffAttendance.findMany({ where: { schoolId: s.id, dateKey: { in: days } }, select: { membershipId: true, dateKey: true, status: true, membership: { select: { user: { select: { name: true, preferredName: true } } } } } });
      const short: Record<string, string> = { PRESENT: "P", LATE: "L", HALF_DAY: "H", ABSENT: "A", ON_LEAVE: "LV" };
      for (const m of marks) {
        const name = m.membership.user.preferredName ?? m.membership.user.name;
        const row = rows.find((r) => r.name === name);
        if (!row) { note("staff-csv", "FAIL", s.name, `${name} has no row in ${month}`); continue; }
        if (row[m.dateKey] !== short[m.status]) note("staff-csv", "FAIL", s.name, `${name} ${m.dateKey}: CSV "${row[m.dateKey]}" vs row ${m.status}`);
      }
      // Leave balances.
      const year = await db.academicYear.findFirst({ where: { schoolId: s.id, isCurrent: true }, select: { startDate: true, endDate: true } });
      const week = s.teachingDays.split(",").map(Number);
      const closed = new Set<string>();
      if (year) {
        const from = year.startDate.toISOString().slice(0, 10), to = year.endDate.toISOString().slice(0, 10);
        for (const h of await db.holiday.findMany({ where: { schoolId: s.id, startDateKey: { lte: to }, endDateKey: { gte: from } }, select: { startDateKey: true, endDateKey: true, kind: true } })) {
          if (!HOLIDAY_KIND_META[h.kind as keyof typeof HOLIDAY_KIND_META]?.closesSchool) continue;
          for (let t = new Date(`${h.startDateKey}T00:00:00Z`); t.toISOString().slice(0, 10) <= h.endDateKey; t = new Date(t.getTime() + 86_400_000)) closed.add(t.toISOString().slice(0, 10));
        }
        const countDays = (a: string, b: string) => { let n = 0; for (let t = new Date(`${a}T00:00:00Z`); t.toISOString().slice(0, 10) <= b; t = new Date(t.getTime() + 86_400_000)) { const k = t.toISOString().slice(0, 10); if (week.includes(t.getUTCDay()) && !closed.has(k)) n += 1; } return n; };
        const staff = await db.membership.findMany({ where: { schoolId: s.id, role: { in: ["TEACHER", "PRINCIPAL", "ADMIN"] }, status: "ACTIVE", leftAt: null }, select: { id: true, staffRecord: { select: { leaveDaysPerYear: true } } } });
        let noEntitlement = 0;
        for (const m of staff) {
          const bal = await leaveBalanceFor(s.id, m.id);
          const approved = await db.leaveRequest.findMany({ where: { schoolId: s.id, teacherMembershipId: m.id, kind: { in: ["CASUAL", "SICK"] }, status: "APPROVED", fromDateKey: { lte: to }, toDateKey: { gte: from } }, select: { fromDateKey: true, toDateKey: true } });
          const used = sum(approved.map((r) => countDays(r.fromDateKey > from ? r.fromDateKey : from, r.toDateKey < to ? r.toDateKey : to)));
          if (bal.used !== used) note("staff-csv", "FAIL", s.name, `leave used for ${m.id}: balance ${bal.used} vs raw ${used}`);
          if (bal.entitlement === null) noEntitlement += 1;
          else if (bal.remaining !== null && bal.remaining < 0) note("staff-csv", "WARN", s.name, `${m.id} has taken ${bal.used} against ${bal.entitlement} — the balance is negative`);
        }
        if (noEntitlement) note("staff-csv", "INFO", s.name, `${noEntitlement} staff have no leave entitlement on their record — the desk sees no balance for them`);
      }
    }
    expect(failsOf("staff-csv")).toEqual([]);
  });
});

d("report cards, certificates and the leaving certificate", () => {
  it("report card papers carry the grade and the max as they stood; a card behind the marks is stale", async () => {
    for (const s of schools) {
      const items = await db.reportCardItem.findMany({ where: { schoolId: s.id, kind: "SCHOLASTIC", assignmentId: { not: null } }, select: { id: true, scoreMilli: true, pointsMilli: true, assignmentId: true, reportCard: { select: { id: true, status: true, studentMembershipId: true, updatedAt: true } }, assignment: { select: { pointsMilli: true, grades: { select: { studentMembershipId: true, scoreMilli: true, updatedAt: true } } } } } });
      let stale = 0, checked = 0;
      for (const it of items) {
        checked += 1;
        const grade = it.assignment!.grades.find((g) => g.studentMembershipId === it.reportCard.studentMembershipId);
        const score = grade?.scoreMilli ?? null;
        const diff = score !== it.scoreMilli || it.assignment!.pointsMilli !== it.pointsMilli;
        if (!diff) continue;
        const gradeNewer = grade && grade.updatedAt.getTime() > it.reportCard.updatedAt.getTime();
        if (gradeNewer || it.reportCard.status === "PUBLISHED") stale += 1;
        else note("report-card-items", "FAIL", s.name, `card ${it.reportCard.id} (${it.reportCard.status}) paper ${it.assignmentId}: item ${it.scoreMilli}/${it.pointsMilli} vs grade ${score}/${it.assignment!.pointsMilli} with no later mark`);
      }
      if (stale) note("report-card-items", "WARN", s.name, `${stale} paper(s) on cards differ from the marks as they stand now — a published card is frozen; a draft regenerates when opened`);
      note("report-card-items", "INFO", s.name, `${checked} card papers checked against their grades`);
      // Every card names a class and a pupil still on the roll of that class in that year, or the year is closed.
      const openYears = (await db.academicYear.findMany({ where: { schoolId: s.id, closedAt: null }, select: { id: true } })).map((y) => y.id);
      const orphans = await db.reportCard.count({ where: { schoolId: s.id, status: "PUBLISHED", academicYearId: { in: openYears }, student: { OR: [{ leftAt: { not: null } }, { status: { not: "ACTIVE" } }] } } });
      if (orphans) note("report-card-items", "INFO", s.name, `${orphans} published card(s) of the open year belong to pupils no longer on the roll`);
    }
    expect(failsOf("report-card-items")).toEqual([]);
  });

  it("certificates: the snapshot names what it printed blank, serials are one series per prefix and year, and the paper still matches the pupil", async () => {
    for (const s of schools) {
      const certs = await db.issuedCertificate.findMany({ where: { schoolId: s.id }, select: { id: true, serial: true, number: true, kind: true, templateId: true, dataJson: true, revokedAt: true, academicYear: { select: { name: true } }, template: { select: { serialPrefix: true } }, student: { select: { studentCode: true, user: { select: { name: true, preferredName: true, birthdate: true, penNumber: true } }, pupilRecord: { select: { admissionNumber: true, fatherName: true, motherName: true } } } } } });
      const serials = new Map<string, number>();
      for (const c of certs) {
        serials.set(c.serial, (serials.get(c.serial) ?? 0) + 1);
        let data: Record<string, unknown> = {};
        try { data = JSON.parse(c.dataJson); } catch { note("certificates", "FAIL", s.name, `${c.serial}: dataJson is not JSON`); continue; }
        const missing = Array.isArray(data.missing) ? (data.missing as string[]) : [];
        const blanks = Object.entries(data).filter(([k, v]) => k !== "missing" && v === "—").map(([k]) => k);
        for (const b of blanks) if (!missing.includes(b)) note("certificates", "FAIL", s.name, `${c.serial} printed "—" for ${b} but does not name it as missing`);
        if (c.template && c.academicYear) {
          const expect_ = `${c.template.serialPrefix}/${c.academicYear.name}/${String(c.number).padStart(4, "0")}`;
          if (c.serial !== expect_) note("certificates", "FAIL", s.name, `${c.serial} is not prefix/year/number (${expect_})`);
        }
        // Formal papers print the legal name (certificates.ts); a paper issued before that rule may carry the preferred name.
        const name = c.student.user.name;
        if (data["pupil.name"] && data["pupil.name"] !== name && data["pupil.name"] !== c.student.user.preferredName) note("certificates", "WARN", s.name, `${c.serial} names "${data["pupil.name"]}", the account now says "${name}"`);
        const dob = c.student.user.birthdate ? ddmmyyyy(c.student.user.birthdate, "/") : null;
        if (dob && data["pupil.dob"] && data["pupil.dob"] !== dob) note("certificates", "FAIL", s.name, `${c.serial} prints DOB ${data["pupil.dob"]}, the account holds ${dob}`);
        if (c.student.pupilRecord?.admissionNumber && data["pupil.admissionNumber"] && data["pupil.admissionNumber"] !== c.student.pupilRecord.admissionNumber) note("certificates", "WARN", s.name, `${c.serial} prints admission no. ${data["pupil.admissionNumber"]}, the record now says ${c.student.pupilRecord.admissionNumber}`);
        if (missing.length && !c.revokedAt) note("certificates", "INFO", s.name, `${c.serial} (${c.kind}) went out with "—" for ${missing.join(", ")}`);
      }
      for (const [serial, n] of serials) if (n > 1) note("certificates", "FAIL", s.name, `serial ${serial} issued ${n} times`);
      // Gaps in a series: numbers skipped between the first and the last.
      const byPrefix = new Map<string, number[]>();
      for (const c of certs) { const k = `${c.template?.serialPrefix ?? "?"}/${c.academicYear?.name ?? "?"}`; byPrefix.set(k, [...(byPrefix.get(k) ?? []), c.number]); }
      for (const [k, nums] of byPrefix) { const max = Math.max(...nums); const missingNums = []; for (let i = 1; i <= max; i += 1) if (!nums.includes(i)) missingNums.push(i); if (missingNums.length) note("certificates", "WARN", s.name, `series ${k} skips number(s) ${missingNums.join(", ")}`); }
    }
    expect(failsOf("certificates")).toEqual([]);
  });

  it("leaving certificates: the departure record agrees with the membership and its own counts", async () => {
    for (const s of schools) {
      const recs = await db.schoolRecord.findMany({ where: { schoolId: s.id }, select: { id: true, serial: true, joinedAt: true, leftAt: true, attendanceMarked: true, attendancePresent: true, reportCardCount: true, studentMembershipId: true, membership: { select: { leftAt: true, joinedAt: true, status: true } } } });
      const serials = new Set<string>();
      for (const r of recs) {
        if (r.serial) { if (serials.has(r.serial)) note("leaving-certificates", "FAIL", s.name, `serial ${r.serial} twice`); serials.add(r.serial); }
        if (r.leftAt < r.joinedAt) note("leaving-certificates", "FAIL", s.name, `${r.serial ?? r.id}: left before joining`);
        if (r.attendancePresent > r.attendanceMarked) note("leaving-certificates", "FAIL", s.name, `${r.serial ?? r.id}: present ${r.attendancePresent} exceeds marked ${r.attendanceMarked}`);
        if (r.membership.leftAt && r.membership.leftAt.toISOString().slice(0, 10) !== r.leftAt.toISOString().slice(0, 10)) note("leaving-certificates", "FAIL", s.name, `${r.serial ?? r.id}: record left ${r.leftAt.toISOString().slice(0, 10)}, membership left ${r.membership.leftAt.toISOString().slice(0, 10)}`);
        const marked = await db.attendanceRecord.count({ where: { schoolId: s.id, studentMembershipId: r.studentMembershipId } });
        const present = await db.attendanceRecord.count({ where: { schoolId: s.id, studentMembershipId: r.studentMembershipId, status: { in: ["PRESENT", "LATE"] } } });
        if (marked !== r.attendanceMarked || present !== r.attendancePresent) note("leaving-certificates", "WARN", s.name, `${r.serial ?? r.id}: snapshot ${r.attendancePresent}/${r.attendanceMarked}, the register holds ${present}/${marked}`);
        const cards = await db.reportCard.count({ where: { schoolId: s.id, studentMembershipId: r.studentMembershipId, status: "PUBLISHED" } });
        if (cards !== r.reportCardCount) note("leaving-certificates", "WARN", s.name, `${r.serial ?? r.id}: snapshot counts ${r.reportCardCount} cards, ${cards} are published`);
      }
      // Leavers with no departure record: a TC cannot be printed for them.
      const leaversNoRecord = await db.membership.count({ where: { schoolId: s.id, role: "STUDENT", leftAt: { not: null }, schoolRecord: null } });
      if (leaversNoRecord) note("leaving-certificates", "WARN", s.name, `${leaversNoRecord} pupil(s) left with no departure record — no leaving certificate exists for them`);
    }
    expect(failsOf("leaving-certificates")).toEqual([]);
  });
});

d("the figures the head, the family and the operator read", () => {
  it("class insights over the default window: attendance per class from the records inside it", async () => {
    for (const s of schools) {
      const ctx = ctxs.get(s.id)?.principal ?? ctxs.get(s.id)?.admin;
      if (!ctx) continue;
      const window = await defaultWindow(s.id);
      const rows = await classInsights(ctx, window);
      for (const r of rows) {
        const records = await db.attendanceRecord.findMany({ where: { schoolId: s.id, session: { classId: r.classId, dateKey: { gte: window.fromDateKey, lte: window.toDateKey } } }, select: { status: true } });
        const attended = records.filter((x) => x.status === "PRESENT" || x.status === "LATE").length;
        const pct = records.length ? Math.round((attended * 100) / records.length) : null;
        if (r.attendance.marks !== records.length || r.attendance.percent !== pct) note("insights", "FAIL", s.name, `${r.name}: insight ${r.attendance.percent}% of ${r.attendance.marks} vs raw ${pct}% of ${records.length}`);
        const sessions = await db.attendanceSession.count({ where: { schoolId: s.id, classId: r.classId, dateKey: { gte: window.fromDateKey, lte: window.toDateKey } } });
        if (r.sessionsTaken !== sessions) note("insights", "FAIL", s.name, `${r.name}: sessionsTaken ${r.sessionsTaken} vs ${sessions}`);
        const pupils = await db.enrollment.count({ where: { schoolId: s.id, classId: r.classId, status: "ACTIVE" } });
        if (r.pupils !== pupils) note("insights", "FAIL", s.name, `${r.name}: pupils ${r.pupils} vs ${pupils}`);
        if (r.progress.pupilsWithNoMarks > 0) note("insights", "INFO", s.name, `${r.name}: ${r.progress.pupilsWithNoMarks} pupil(s) have no marks in the window and are outside the class average`);
      }
    }
    expect(failsOf("insights")).toEqual([]);
  });

  it("a pupil's progress report: attendance in the window from the records; the marks section present", async () => {
    for (const s of schools) {
      const ctx = ctxs.get(s.id)?.admin;
      if (!ctx) continue;
      const pupil = await db.membership.findFirst({ where: { schoolId: s.id, role: "STUDENT", status: "ACTIVE", leftAt: null, attendance: { some: {} } }, select: { id: true } });
      if (!pupil) { note("progress-report", "INFO", s.name, "no pupil with marks"); continue; }
      const rep = await buildProgressReport(ctx, pupil.id);
      const records = await db.attendanceRecord.findMany({ where: { schoolId: s.id, studentMembershipId: pupil.id, session: { dateKey: { gte: rep.window.fromKey, lte: rep.window.toKey } } }, select: { status: true } });
      const attended = records.filter((x) => x.status === "PRESENT" || x.status === "LATE").length;
      const pct = records.length ? Math.round((attended * 100) / records.length) : null;
      if (rep.attendance.total !== records.length || rep.attendance.percent !== pct) note("progress-report", "FAIL", s.name, `${pupil.id}: report ${rep.attendance.percent}% of ${rep.attendance.total} vs raw ${pct}% of ${records.length}`);
      if (!rep.school.logoPath) note("progress-report", "INFO", s.name, "the report prints no school logo (School.logoPath is blank)");
    }
    expect(failsOf("progress-report")).toEqual([]);
  });

  it("the closed year's archive: pupils on roll, attendance and published cards from the rows of that year", async () => {
    for (const s of schools) {
      const ctx = ctxs.get(s.id)?.admin;
      if (!ctx) continue;
      const years = await listClosedYears(s.id);
      if (!years.length) { note("year-archive", "INFO", s.name, "no closed year"); continue; }
      for (const y of years) {
        const a = await schoolYearArchive(ctx, y.id);
        const row = await db.academicYear.findUniqueOrThrow({ where: { id: y.id }, select: { startDate: true, endDate: true } });
        const from = row.startDate.toISOString().slice(0, 10), to = row.endDate.toISOString().slice(0, 10);
        const marked = await db.attendanceRecord.count({ where: { schoolId: s.id, session: { dateKey: { gte: from, lte: to } } } });
        const present = await db.attendanceRecord.count({ where: { schoolId: s.id, status: { in: ["PRESENT", "LATE"] }, session: { dateKey: { gte: from, lte: to } } } });
        if (a.attendance.marked !== marked || a.attendance.present !== present) note("year-archive", "FAIL", s.name, `${y.name}: archive ${a.attendance.present}/${a.attendance.marked} vs raw ${present}/${marked}`);
        const cards = await db.reportCard.count({ where: { schoolId: s.id, status: "PUBLISHED", OR: [{ academicYearId: y.id }, { academicYearId: null, publishedAt: { gte: row.startDate, lte: new Date(row.endDate.getTime() + 86_400_000) } }] } });
        if (a.reportCardsPublished !== cards) note("year-archive", "FAIL", s.name, `${y.name}: archive ${a.reportCardsPublished} published cards vs raw ${cards}`);
        note("year-archive", "INFO", s.name, `${y.name}: ${a.pupilsOnRoll} on roll, ${a.leavers} leavers, ${a.badgesArchived} badges archived`);
      }
    }
    expect(failsOf("year-archive")).toEqual([]);
  });

  it("messaging: the month's counts and each broadcast's counters from its own messages", async () => {
    for (const s of schools) {
      const ctx = ctxs.get(s.id)?.admin;
      if (!ctx) continue;
      const ov = await messagingOverview(ctx);
      const now = new Date();
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
      const rows = await db.outboundMessage.groupBy({ by: ["status"], where: { schoolId: s.id, createdAt: { gte: monthStart } }, _count: true });
      const n = (st: string) => rows.find((r) => r.status === st)?._count ?? 0;
      const exp = { sent: n("SENT") + n("DELIVERED") + n("UNDELIVERED"), delivered: n("DELIVERED"), failed: n("FAILED") + n("UNDELIVERED"), skipped: n("SKIPPED") };
      for (const k of Object.keys(exp) as (keyof typeof exp)[]) if (ov.month[k] !== exp[k]) note("messaging", "FAIL", s.name, `month ${k}: overview ${ov.month[k]} vs raw ${exp[k]}`);
      const guardians = await db.guardianship.findMany({ where: { studentSchoolId: s.id, status: "ACTIVE" }, select: { parentUserId: true, parent: { select: { phone: true } } }, distinct: ["parentUserId"] });
      const withPhone = guardians.filter((g) => g.parent.phone).length;
      if (ov.parentsTotal !== guardians.length || ov.parentsWithPhone !== withPhone) note("messaging", "FAIL", s.name, `parents ${ov.parentsWithPhone}/${ov.parentsTotal} vs raw ${withPhone}/${guardians.length}`);
      if (guardians.length - withPhone > 0) note("messaging", "INFO", s.name, `${guardians.length - withPhone} guardian(s) have no phone — every text to them is SKIPPED`);
      for (const b of await db.broadcast.findMany({ where: { schoolId: s.id }, select: { id: true, title: true, queued: true, sent: true, delivered: true, failed: true, skipped: true, recipients: true, status: true, messages: { select: { status: true } } } })) {
        const c = (st: string) => b.messages.filter((m) => m.status === st).length;
        const e = { sent: c("SENT") + c("DELIVERED") + c("UNDELIVERED"), delivered: c("DELIVERED"), failed: c("FAILED") + c("UNDELIVERED"), skipped: c("SKIPPED") };
        if (b.status === "DONE" && b.messages.length) for (const k of Object.keys(e) as (keyof typeof e)[]) if (b[k] !== e[k]) note("messaging", "FAIL", s.name, `broadcast "${b.title}" ${k}: stored ${b[k]} vs its messages ${e[k]}`);
        if (b.sent + b.skipped + b.failed > b.messages.length + b.recipients) note("messaging", "FAIL", s.name, `broadcast "${b.title}": counters exceed recipients`);
      }
    }
    expect(failsOf("messaging")).toEqual([]);
  });

  it("the operator's retention preview counts what the sweep's own predicates count", async () => {
    const now = new Date();
    const view = await retentionPreview(now);
    const c = view.config as Record<string, number>;
    const day = 86_400_000;
    const cut = (days: number) => new Date(now.getTime() - days * day);
    const sessions = await db.session.count({ where: { OR: [{ expiresAt: { lt: cut(c.sessionDays ?? 7) } }, { revokedAt: { lt: cut(c.sessionDays ?? 7) } }] } });
    if (view.pending.sessions !== sessions) note("retention", "FAIL", "platform", `sessions: preview ${view.pending.sessions} vs raw ${sessions} (config ${JSON.stringify(view.config)})`);
    const outbox = await db.outboundEmail.count({ where: { createdAt: { lt: cut(c.outboxDays ?? 30) } } });
    if (view.pending.outbox !== outbox) note("retention", "FAIL", "platform", `outbox: preview ${view.pending.outbox} vs raw ${outbox}`);
    note("retention", "INFO", "platform", `tonight would take ${Object.entries(view.pending).map(([k, v]) => `${k} ${v}`).join(", ")}`);
    expect(failsOf("retention")).toEqual([]);
  });

  it("quiz progress and competition standings: mastery against the bank, standings against the entries", async () => {
    for (const s of schools) {
      const over = await db.$queryRaw<{ n: bigint }[]>`select count(*)::bigint n from "QuizMastery" m where m."schoolId" = ${s.id} and m."seenCount" > (select count(*) from "QuizQuestion" q where q."topicId" = m."topicId")`;
      if (Number(over[0]?.n ?? 0)) note("quiz-standings", "WARN", s.name, `${over[0]?.n} mastery row(s) have seen more questions than the topic now holds — "completed" can misreport after the bank shrank`);
      const dup = await db.$queryRaw<{ n: bigint }[]>`select count(*)::bigint n from (select "studentMembershipId", "badgeId" from "EarnedBadge" where "schoolId" = ${s.id} and permanent and "academicYearId" is null group by 1,2 having count(*) > 1) x`;
      if (Number(dup[0]?.n ?? 0)) note("quiz-standings", "FAIL", s.name, `${dup[0]?.n} permanent badge(s) awarded twice`);
      for (const st of await db.competitionStanding.findMany({ where: { schoolId: s.id }, select: { competitionId: true, entrants: true, bestRank: true, bestScoreMilli: true, competition: { select: { title: true, requiresParentConsent: true } } } })) {
        const entries = await db.competitionEntry.findMany({ where: { schoolId: s.id, competitionId: st.competitionId, ...(st.competition.requiresParentConsent ? { parentConsentAt: { not: null } } : {}) }, select: { rank: true, scoreMilli: true } });
        const scored = entries.filter((e) => e.rank !== null || e.scoreMilli !== null);
        const bestRank = scored.filter((e) => e.rank !== null).length ? Math.min(...scored.filter((e) => e.rank !== null).map((e) => e.rank!)) : null;
        const bestScore = scored.filter((e) => e.scoreMilli !== null).length ? Math.max(...scored.filter((e) => e.scoreMilli !== null).map((e) => e.scoreMilli!)) : null;
        if (st.entrants !== scored.length || st.bestRank !== bestRank || st.bestScoreMilli !== bestScore) note("quiz-standings", "FAIL", s.name, `standing for "${st.competition.title}": ${st.entrants}/${st.bestRank}/${st.bestScoreMilli} vs entries ${scored.length}/${bestRank}/${bestScore}`);
      }
    }
    expect(failsOf("quiz-standings")).toEqual([]);
  });
});

d("inputs the school still has to enter", () => {
  it("what every sheet, certificate and receipt needs that is blank, counted per school", async () => {
    for (const s of schools) {
      const pupils = await rawPupils(s.id);
      const count = (pred: (p: (typeof pupils)[number]) => boolean) => pupils.filter(pred).length;
      const gaps: [string, number, string][] = [
        ["date of birth", count((p) => !p.user.birthdate), "UDISE+ DOB, both board sheets, every certificate, the age tables"],
        ["gender", count((p) => !p.pupilRecord?.gender), "UDISE+ GENDER, the enrolment tables' boys/girls, the board sheets"],
        ["a contact number, the guardian's or the record's", count((p) => !(p.guardianships[0]?.parent.phone ?? p.pupilRecord?.guardianPhone ?? p.user.phone)), "UDISE+ MOBILE NUMBER"],
        ["a guardian with a number they proved", count((p) => !p.guardianships[0]?.parent.phone), "texts and reminders"],
        ["a guardian at all", count((p) => !p.guardianships[0]), "circulars, fee reminders, the PEN change approval"],
        ["a pupil record", count((p) => !p.pupilRecord), "every certificate field, every filing column"],
        ["father's and mother's names", count((p) => !p.pupilRecord?.fatherName || !p.pupilRecord?.motherName), "certificates (\"child of\"), UDISE+, the board sheets"],
        ["admission number", count((p) => !p.pupilRecord?.admissionNumber), "UDISE+ Admission Number, CBSE Admission No., MSBSHSE GR no., the TC"],
        ["admission date", count((p) => !p.pupilRecord?.admissionDate), "UDISE+ ADMISSION DATE falls back to the day the account joined"],
        ["category (coded)", count((p) => !CATEGORY[upper(p.pupilRecord?.category)]), "UDISE+ SOCIAL CATEGORY, the enrolment tables, the board sheets"],
        ["religion (coded)", count((p) => !MINORITY[upper(p.pupilRecord?.religion)]), "UDISE+ MINORITY GROUP"],
        ["mother tongue, from the list", count((p) => !p.pupilRecord?.motherTongue || !(MOTHER_TONGUES as readonly string[]).includes(p.pupilRecord.motherTongue)), "UDISE+ MOTHER TONGUE, MSBSHSE"],
        ["address and PIN", count((p) => !p.pupilRecord?.addressLine || !p.pupilRecord?.postalCode), "UDISE+ PRESENT ADDRESS and PINCODE, certificates"],
        ["BPL and EWS answered", count((p) => p.pupilRecord?.bpl == null || p.pupilRecord?.ews == null), "UDISE+ BPL, EWS and RTE columns"],
        ["name in the school's script", count((p) => !p.pupilRecord?.nameLocal), "the MSBSHSE pre-list's Devanagari columns"],
        ["UDISE+ PEN", count((p) => !p.user.penNumber), "CBSE and MSBSHSE PEN, the TC, finding the pupil by number"],
        ["roll number", count((p) => p.enrollments[0]?.rollNumber == null), "UDISE+ Roll no falls back to a counter"],
        ["previous school's TC", count((p) => !!p.pupilRecord?.previousSchool && !p.pupilRecord?.previousSchoolTcNumber), "the admission register's TC column, for pupils who came from another school"],
        ["household (occupations, income)", count((p) => !p.pupilRecord?.fatherOccupation || p.pupilRecord?.annualIncome == null), "RTE and EWS verification"],
      ];
      for (const [what, n, feeds] of gaps) if (n) note("inputs-pupils", n > pupils.length / 2 ? "WARN" : "INFO", s.name, `${n} of ${pupils.length} pupils lack ${what} — feeds ${feeds}`);
      const staff = await db.membership.findMany({ where: { schoolId: s.id, role: { in: ["TEACHER", "PRINCIPAL", "ADMIN"] }, status: "ACTIVE", leftAt: null }, select: { role: true, subjects: true, user: { select: { phone: true, birthdate: true } }, staffRecord: true, timetableSlots: { select: { id: true }, take: 1 } } });
      const sc = (pred: (m: (typeof staff)[number]) => boolean) => staff.filter(pred).length;
      const sgaps: [string, number, string][] = [
        ["a staff record", sc((m) => !m.staffRecord), "the DCF teacher profile, leave balances"],
        ["date of birth (record or account)", sc((m) => !m.staffRecord?.birthdate && !m.user.birthdate), "DCF 3.2.3"],
        ["service start", sc((m) => !m.staffRecord?.serviceJoinedOn), "DCF 3.2.14 falls back to the day they joined this school"],
        ["joined this school", sc((m) => !m.staffRecord?.joinedOn), "DCF 3.2.15 falls back to the account's join date"],
        ["gender, category, qualifications, appointment (coded)", sc((m) => !m.staffRecord?.gender || !m.staffRecord?.socialCategory || !m.staffRecord?.academicQualification || !m.staffRecord?.professionalQualification || !m.staffRecord?.appointmentType), "DCF 3.2.2–3.2.12"],
        ["a phone", sc((m) => !m.user.phone), "DCF 3.2.8(a), substitution and leave texts"],
        ["subjects (profile or timetable)", sc((m) => m.role === "TEACHER" && !m.timetableSlots.length && !(m.subjects && m.subjects !== "[]")), "DCF 3.2.19 subject codes"],
        ["leave entitlement", sc((m) => m.staffRecord?.leaveDaysPerYear == null), "the leave balance on the desk"],
      ];
      for (const [what, n, feeds] of sgaps) if (n) note("inputs-staff", n > staff.length / 2 ? "WARN" : "INFO", s.name, `${n} of ${staff.length} staff lack ${what} — feeds ${feeds}`);
      const identity: [string, boolean, string][] = [
        ["UDISE code", !s.udiseCode, "every UDISE+ sheet's first column and file name"],
        ["board", !s.board, "which board sheet applies"],
        ["affiliation or index number", !s.affiliationNumber, "CBSE and MSBSHSE first column"],
        ["district and block", !s.district || !s.block, "the filing identity the DCF prints"],
        ["management type", !s.managementType, "the DCF's management code"],
        ["medium", !s.medium, "MSBSHSE first-language coding"],
        ["address line", !s.addressLine, "certificates and receipts print the school's address"],
        ["logo", !s.logoPath, "certificates, receipts and progress reports print no logo"],
        ["report card rules", !s.reportCardConfig, "cards use the default bands and layout"],
        ["fee receipt prefix", !s.feeReceiptPrefix, "receipts are numbered RCPT/…"],
      ];
      for (const [what, blank, feeds] of identity) if (blank) note("inputs-school", "INFO", s.name, `school has no ${what} — ${feeds}`);
      const year = await db.academicYear.findFirst({ where: { schoolId: s.id, isCurrent: true }, select: { id: true, _count: { select: { terms: true } } } });
      if (!year) note("inputs-school", "WARN", s.name, "no current academic year — coverage, fees, archives and the previous-year columns have nothing to key on");
      else if (year._count.terms === 0) note("inputs-school", "WARN", s.name, "the current year has no terms — no series gets a term, no term card can be built");
      const classes = await db.class.findMany({ where: { schoolId: s.id, archivedAt: null }, select: { name: true, gradeLevel: true, section: true, _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } } });
      const noGrade = classes.filter((c) => !c.gradeLevel).length, noSection = classes.filter((c) => !c.section).length, empty = classes.filter((c) => c._count.enrollments === 0).length;
      if (noGrade) note("inputs-school", "WARN", s.name, `${noGrade} class(es) have no grade level — their pupils are outside every filing table and the fee report by grade`);
      if (noSection) note("inputs-school", "INFO", s.name, `${noSection} class(es) have no section — the UDISE+ sheet invents "A"`);
      if (empty) note("inputs-school", "INFO", s.name, `${empty} class(es) have no pupils`);
      const unstaffed = await db.timetableSlot.count({ where: { schoolId: s.id, teacherMembershipId: null, class: { archivedAt: null } } });
      if (unstaffed) note("inputs-school", "INFO", s.name, `${unstaffed} timetable slot(s) have no teacher`);
      if (year) {
        const noPlan = await db.membership.count({ where: { schoolId: s.id, role: "STUDENT", status: "ACTIVE", leftAt: null, feePlans: { none: { academicYearId: year.id } } } });
        if (noPlan) note("inputs-school", "INFO", s.name, `${noPlan} pupil(s) on the roll have no fee plan this year — no demand, no dues, no receipt`);
      }
      const noHealth = await db.membership.count({ where: { schoolId: s.id, role: "STUDENT", status: "ACTIVE", leftAt: null, healthCard: null } });
      if (noHealth) note("inputs-school", "INFO", s.name, `${noHealth} pupil(s) have no health card`);
    }
    expect(true).toBe(true);
  });
});
