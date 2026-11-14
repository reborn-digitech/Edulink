/**
 * The owner's decision on TA-379 and TA-475 of the testing analysis of 13 November 2026 (one change answers both).
 *
 * TA-379: the "meeting twenty weeks" figure added up the whole span of every posting a student teacher ever had,
 * past or future, so a posting typed today for next term met the twenty weeks before a day was served; a posting
 * across 1 June was counted whole, with its lessons, in both years; and any length was accepted, so a year typed
 * wrong gave seventy weeks. TA-475: the "out of" number was only the students posted in the year, so a student
 * teacher never posted was in neither number.
 *
 * Now the figure counts weeks already served (a posting's days once they have passed, by the college's calendar;
 * a past year stops at its own 31 May), out of every final-year student teacher on the return's education
 * programmes, posted or not, found from the entry year plus the programme's length; a posting across 1 June
 * splits its weeks and its watched lessons by day, and the posting with its lessons planned belongs to the year
 * it starts; a posting longer than a year is refused as a typing slip. The tiles, the return and the guide say
 * "final-year student teachers", and no new sentence states an NCTE requirement as fact.
 *
 * One ZZ college of this suite's own (education and management), made through the operator's createSchool and
 * removed after. The clock is pinned through the summary's `now`.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { FILING_TEXT, NCTE_MIN_PRACTICE_WEEKS } from "@edulink/contracts";
import { en } from "@edulink/i18n/en";
import { hi } from "@edulink/i18n/hi";
import { mr } from "@edulink/i18n/mr";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { createSchool } from "@/lib/superuser";
import { teachingPracticeSummary } from "@/lib/stream-summaries";
import { savePracticePosting } from "@/lib/teaching-practice";
import { councilDocument } from "@/lib/council-filings";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-ta-379-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
const operator = () => ({ user: { id: ids.operator, isSuperuser: true, email: MAIL("op") } }) as unknown as ActiveContext;
/** 14 November 2026, noon in India: the college's today is 2026-11-14. */
const NOV_14 = new Date("2026-11-14T06:30:00Z");
const ROOT = path.resolve(__dirname, "..", "..", "..");

function flatten(tree: unknown, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [k, v] of Object.entries(tree as Record<string, unknown>)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out.set(key, v);
    else if (v && typeof v === "object") for (const [kk, vv] of flatten(v, key)) out.set(kk, vv);
  }
  return out;
}
const E = flatten(en);
const H = flatten(hi);
const M = flatten(mr);

async function as(who: string, role: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids.A!, role: role as never });
  return (await getSession()) as ActiveContext;
}

async function person(who: string, role: string): Promise<string> {
  ids[who] = (await db.user.create({ data: { name: `ZZ 379 ${who}`, email: MAIL(who) }, select: { id: true } })).id;
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.A!, role, status: "ACTIVE" }, select: { id: true } })).id;
  return ids[`${who}M`]!;
}

async function student(who: string, programme: string, scheme: string, entryYear: number): Promise<string> {
  const m = await person(who, "STUDENT");
  await db.studentProgramme.create({ data: { schoolId: ids.A!, studentMembershipId: m, programmeId: ids[programme]!, schemeId: ids[scheme]!, entryYear } });
  return m;
}

async function posting(who: string, fromKey: string, toKey: string, lessonsPlanned: number, observedOn: string[] = []): Promise<string> {
  const p = await db.teachingPracticePosting.create({ data: { schoolId: ids.A!, studentMembershipId: ids[`${who}M`]!, practiceSchoolId: ids.place!, fromKey, toKey, lessonsPlanned }, select: { id: true } });
  for (const at of observedOn) await db.lessonObservation.create({ data: { schoolId: ids.A!, postingId: p.id, at, observerMembershipId: ids.coordM!, grade: "B" } });
  return p.id;
}

beforeAll(async () => {
  ids.operator = (await db.user.create({ data: { name: "ZZ 379 Operator", email: MAIL("op"), isSuperuser: true }, select: { id: true } })).id;
  const made = await createSchool(operator(), { contactEmail: MAIL("contact"), timezone: "Asia/Kolkata", name: `ZZ 379 College of Education ${STAMP}`, kind: "COLLEGE", streams: ["EDUCATION", "MANAGEMENT"] });
  if (!made.ok) throw new Error(made.errorKey);
  ids.A = made.schoolId;
  await db.school.update({ where: { id: made.schoolId }, data: { isTestFixture: true } });
  const A = ids.A;
  await person("admin", "ADMIN");
  await person("coord", "FACULTY");
  ids.dept = (await db.department.create({ data: { schoolId: A, code: "EDU", name: "ZZ 379 Education" }, select: { id: true } })).id;
  const programme = async (key: string, code: string, stream: string, years: number, regulator: string) => {
    ids[key] = (await db.programme.create({ data: { schoolId: A, departmentId: ids.dept!, code, name: `ZZ 379 ${code}`, level: "UG", durationYears: years, intake: 50, regulator, stream }, select: { id: true } })).id;
    ids[`${key}Scheme`] = (await db.scheme.create({ data: { schoolId: A, programmeId: ids[key]!, name: `ZZ 379 ${code} scheme`, effectiveYear: 2023 }, select: { id: true } })).id;
  };
  await programme("bed", "BED", "EDUCATION", 2, "NCTE");
  await programme("itep", "ITEP", "EDUCATION", 4, "NCTE");
  await programme("mba", "MBA", "MANAGEMENT", 2, "AICTE");
  // Final year 2026–27 (batch 2027): f1, f2, f3 on the B.Ed. (entry 2025), f4 on the four-year ITEP (entry 2023).
  for (const who of ["f1", "f2", "f3"]) await student(who, "bed", "bedScheme", 2025);
  await student("f4", "itep", "itepScheme", 2023);
  // Not final-year student teachers in 2026–27: a first-year (y1), a management student (m1), one who left before
  // the final year began (l1), and g1, whose final year was 2025–26.
  await student("y1", "bed", "bedScheme", 2026);
  await student("m1", "mba", "mbaScheme", 2025);
  await student("l1", "bed", "bedScheme", 2025);
  await db.membership.update({ where: { id: ids.l1M! }, data: { leftAt: new Date("2026-03-01T00:00:00Z") } });
  await student("g1", "bed", "bedScheme", 2024);
  ids.place = (await db.practiceSchool.create({ data: { schoolId: A, name: `ZZ 379 Zilla Parishad School ${STAMP}` }, select: { id: true } })).id;

  // f1: 21 weeks from tomorrow (15 November). f2: 15 June – 1 November 2026, 140 days, ended before today.
  await posting("f1", "2026-11-15", "2027-04-11", 30);
  await posting("f2", "2026-06-15", "2026-11-01", 40, ["2026-07-10"]);
  // y1: a first-year's four weeks, counted in the year's postings and weeks, never in the ratio.
  await posting("y1", "2026-07-01", "2026-07-28", 5);
  // g1: a posting across 1 June (14 days before, 20 after, a watched lesson each side), then 141 days after it.
  await posting("g1", "2026-05-18", "2026-06-20", 10, ["2026-05-20", "2026-06-10"]);
  await posting("g1", "2026-06-21", "2026-11-08", 20);
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  if (ids.A) {
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.A }, { targetId: ids.A }, { actorUserId: { in: userIds } }] } });
    await db.invite.deleteMany({ where: { schoolId: ids.A } });
    await db.school.deleteMany({ where: { id: ids.A } });
  }
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

const per = (s: Awaited<ReturnType<typeof teachingPracticeSummary>>, who: string) => s.perStudent.find((p) => p.studentMembershipId === ids[`${who}M`]);

describe("TA-379: weeks count once they are served", () => {
  it("TA-379: a posting's weeks count only once its days have passed, by the college's calendar", async () => {
    const now = await teachingPracticeSummary(ids.A!, 2026, NOV_14);
    // f1's 21 weeks begin tomorrow: nothing served, not meeting. f2's 140 days ended on 1 November: twenty weeks served.
    expect(per(now, "f1")).toMatchObject({ weeks: 0, meets: false });
    expect(per(now, "f2")).toMatchObject({ weeks: 20, meets: true });
    expect(now.meetingMinimum).toBe(1);
    // By 1 May 2027 f1's posting is behind them: 148 days, 21.1 weeks.
    const later = await teachingPracticeSummary(ids.A!, 2026, new Date("2027-05-01T06:30:00Z"));
    expect(per(later, "f1")).toMatchObject({ weeks: 21.1, meets: true });
    expect(later.meetingMinimum).toBe(2);
  });

  it("TA-379: a posting across 1 June splits its weeks and watched lessons by day; it and its lessons planned belong to the year it starts; a past year stops at its 31 May", async () => {
    const past = await teachingPracticeSummary(ids.A!, 2025, NOV_14);
    // 2025–26: g1's first posting only (it starts on 18 May), 14 of its days, one of its two watched lessons.
    expect(past).toMatchObject({ postings: 1, lessonsPlanned: 10, lessonsObserved: 1, weeks: 2, students: 1, meetingMinimum: 0 });
    // g1's twenty weeks after 1 June do not reach back into 2025–26, whose figure stops at its own 31 May.
    expect(per(past, "g1")).toMatchObject({ weeks: 2, lessonsPlanned: 10, lessonsObserved: 1, meets: false });
    // Generated again later, the past year does not move.
    expect(await teachingPracticeSummary(ids.A!, 2025, new Date("2027-03-01T06:30:00Z"))).toEqual(past);

    const now = await teachingPracticeSummary(ids.A!, 2026, NOV_14);
    // 2026–27: the four postings that start in it (f1, f2, y1, g1's second); 30 + 40 + 5 + 20 lessons planned; the
    // lessons watched on days of the year (f2's 10 July and g1's 10 June); the weeks served: f1 0, f2 20, y1 4,
    // g1's 20 days of June 2.9 and 141 days 20.1.
    expect(now).toMatchObject({ postings: 4, lessonsPlanned: 95, lessonsObserved: 2, weeks: 47, minimumWeeks: NCTE_MIN_PRACTICE_WEEKS });
    expect(now.bySchool).toEqual([expect.objectContaining({ practiceSchoolId: ids.place, postings: 4, students: 4 })]);
  });

  it("TA-379: a posting longer than a year is refused as a typing slip, with a sentence in three languages", async () => {
    const admin = await as("admin", "ADMIN");
    // 2027 typed as 2028: seventeen months.
    await expect(savePracticePosting(admin, { studentMembershipId: ids.f3M!, practiceSchoolId: ids.place!, from: "2026-12-01", to: "2028-04-30", lessonsPlanned: 30 })).rejects.toMatchObject({ key: "duties.teachingPractice.refuseTooLong", status: 422 });
    // A year to the day is one day longer than a year; a year less a day is not.
    await expect(savePracticePosting(admin, { studentMembershipId: ids.f3M!, practiceSchoolId: ids.place!, from: "2027-06-01", to: "2028-06-01", lessonsPlanned: 30 })).rejects.toMatchObject({ key: "duties.teachingPractice.refuseTooLong" });
    expect(await db.teachingPracticePosting.count({ where: { schoolId: ids.A!, studentMembershipId: ids.f3M! } })).toBe(0);
    const kept = await savePracticePosting(admin, { studentMembershipId: ids.y1M!, practiceSchoolId: ids.place!, from: "2027-06-01", to: "2028-05-31", lessonsPlanned: 30 });
    await db.teachingPracticePosting.delete({ where: { id: kept.id } });
    expect(E.get("duties.teachingPractice.refuseTooLong")).toMatch(/year/);
    expect(H.get("duties.teachingPractice.refuseTooLong")).toMatch(/।$/);
    expect(M.get("duties.teachingPractice.refuseTooLong")).toMatch(/\.$/);
  });
});

describe("TA-475: the 'out of' number is every final-year student teacher", () => {
  it("TA-475: final-year student teachers on the education programmes count, posted or not; first-years, other streams and those who left before the final year do not", async () => {
    const now = await teachingPracticeSummary(ids.A!, 2026, NOV_14);
    expect(now.students).toBe(4);
    expect(new Set(now.perStudent.map((p) => p.studentMembershipId))).toEqual(new Set([ids.f1M, ids.f2M, ids.f3M, ids.f4M]));
    expect(per(now, "f3")).toMatchObject({ weeks: 0, lessonsPlanned: 0, lessonsObserved: 0, meets: false });
    expect(per(now, "f4")).toMatchObject({ weeks: 0, meets: false });
  });

  it("TA-475: the NCTE return prints final-year student teachers served out of all of them", async () => {
    const built = await councilDocument(ids.A!, "NCTE_RETURN", 2025, null, { snapshot: "live" });
    const rows = built.document.sections.flatMap((s) => s.rows ?? []);
    const row = rows.find((r) => String(r[0]).startsWith(FILING_TEXT.practiceServedFinalYear));
    // 2025–26's final year is g1 alone, with two weeks served by its 31 May.
    expect(row?.[1]).toBe("0 / 1");
    expect(built.figures.meetingMinimum).toBe(0);
    expect(rows.some((r) => String(r[0]).includes("NCTE minimum"))).toBe(false);
  });
});

describe("TA-379 and TA-475: what the screens and the guide say", () => {
  it("TA-379: the tiles, the return and the office guide say final-year student teachers, and no new sentence states an NCTE requirement", () => {
    for (const key of ["streamRecords.statServedFinalYear", "streamRecords.practiceBodyServed", "duties.teachingPractice.introServed"]) {
      expect(E.get(key), key).toMatch(/final-year student teachers/i);
      for (const dict of [E, H, M]) expect(dict.get(key), key).not.toMatch(/NCTE|एनसीटीई/);
    }
    for (const key of ["streamRecords.practiceBodyServed", "duties.teachingPractice.introServed"]) {
      expect(H.get(key), key).toMatch(/।$/);
      expect(M.get(key), key).toMatch(/\.$/);
      expect(M.get(key), key).not.toContain("स्कूल");
    }
    expect(FILING_TEXT.practiceServedFinalYear).toMatch(/^Final-year student teachers/);
    const read = (p: string) => readFileSync(path.join(ROOT, p), "utf8");
    for (const page of ["apps/web/src/app/(app)/duties/teaching-practice/page.tsx", "apps/web/src/app/(app)/admin/stream-records/page.tsx", "apps/mobile/src/screens/college/duty-desks.tsx", "apps/mobile/src/screens/college/stream-records.tsx"]) {
      const src = read(page);
      expect(src, page).toContain("streamRecords.statServedFinalYear");
      expect(src, page).not.toContain("streamRecords.statMeetingNcte");
    }
    expect(read("docs/guide/office-college.md")).toContain(`"${E.get("streamRecords.statServedFinalYear")}"`);
    expect(read("docs/guide/office-college.md")).not.toContain("Meeting the NCTE weeks");
  });
});
