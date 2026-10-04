/**
 * WHAT MARKING A LECTURE COSTS (load campaign LOAD-2, 4 October 2026).
 *
 * At a college's busiest hour one process saturated at ~45–50 requests a
 * second, and the lecture mark grew fastest: it made about ten sequential
 * awaits, one upsert per student, and read the whole offering's attendance
 * before and after the write. Every query outside a transaction is a
 * transaction of its own with the tenant settings (db.ts), so each await was a
 * handful of round trips queued behind a busy event loop.
 *
 * What is held here, as the app role (row-level security on), by counting the
 * Prisma operations markLecture issues (the app's `db` wrapped in a counter;
 * no SQL log is configured on it):
 * the batch's size does not change the count (12 students cost what 2 do,
 * present or with one absentee); an all-present batch reads no percentage at
 * all (no term, no timetable, no holidays); the whole check-and-write is one
 * tenant transaction; and the count stays at or under what this fix brought
 * it to. And, because the percentage before the mark is now worked out from
 * the one read after it, the notice rule is proved on a re-mark (a PRESENT
 * turned ABSENT that takes a student from 75 % to 50 % is told; one already
 * under the line is not), and a student named twice in a batch keeps the
 * last mark, as the one-by-one upserts did.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

type Counter = { ops: number; txs: number; models: string[] };
const counter = vi.hoisted<Counter>(() => ({ ops: 0, txs: 0, models: [] }));

vi.mock("@/lib/db", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/db")>();
  type Fn = (...a: unknown[]) => unknown;
  const delegate = (d: object, model: string, inTx: boolean) =>
    new Proxy(d, {
      get(t, op) {
        const v = (t as Record<string | symbol, unknown>)[op];
        if (typeof v !== "function") return v;
        return (...a: unknown[]) => {
          counter.ops += 1;
          if (!inTx) counter.txs += 1;
          counter.models.push(`${model}.${String(op)}`);
          return (v as Fn).apply(t, a);
        };
      },
    });
  const wrap = (client: object, inTx: boolean): object =>
    new Proxy(client, {
      get(t, k) {
        const v = (t as Record<string | symbol, unknown>)[k];
        if (k === "$tenantTransaction") {
          return (work: (tx: unknown) => Promise<unknown>, opts?: unknown) => {
            counter.txs += 1;
            return (v as Fn).call(t, (tx: unknown) => work(wrap(tx as object, true)), opts);
          };
        }
        if (typeof k === "string" && !k.startsWith("$") && v && typeof v === "object") return delegate(v, k, inTx);
        return typeof v === "function" ? (v as Fn).bind(t) : v;
      },
    });
  return { ...real, db: wrap(real.db, false) };
});

// As the app role, so row-level security stands over every query markLecture makes (the batched
// insert and updates included); tests/setup.ts made DATABASE_URL the owner's, kept here for fixtures.
const OWNER_URL = process.env.DATABASE_URL;
process.env.DATABASE_URL = process.env.DATABASE_APP_URL;

const { db: appDb } = await import("@/lib/db");
const { createSession } = await import("@/lib/session");
const { __resetCookies, __setHeaders } = await import("./stubs/next-headers");
const { requireApiRoles } = await import("@/lib/api-roles");
const { markLecture } = await import("@/lib/academics-attendance");
const { addDaysToKey, todayKey } = await import("@/lib/dates");

const db = new PrismaClient({ datasourceUrl: OWNER_URL });
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const TODAY = todayKey("Asia/Kolkata");
const id: Record<string, string> = {};
const students: string[] = [];
let facultyUser = "";
let lectureN = 0;

/** A lecture of the offering on a past day of its own. */
async function lecture(): Promise<string> {
  lectureN += 1;
  return (await db.lecture.create({ data: { schoolId: id.college!, offeringId: id.offering!, dateKey: addDaysToKey(TODAY, -lectureN), startMinute: 540, endMinute: 590 }, select: { id: true } })).id;
}

/** Marks a fresh lecture and answers what it cost. */
async function cost(entries: { studentMembershipId: string; status: "PRESENT" | "ABSENT" | "LATE" }[]): Promise<Counter> {
  const ctx = await requireApiRoles("FACULTY");
  const lectureId = await lecture();
  counter.ops = 0;
  counter.txs = 0;
  counter.models = [];
  const r = await markLecture(ctx, lectureId, { clientId: `zz-cost-${STAMP}-${lectureN}`, entries });
  expect(r.replay).toBe(false);
  return { ops: counter.ops, txs: counter.txs, models: [...counter.models] };
}

beforeAll(async () => {
  const c = (id.college = (await db.school.create({ data: { name: `ZZ Mark Cost ${STAMP}`, slug: `zz-markcost-${STAMP}`, code: `ZMC${SUFFIX}`, contactEmail: `zz-markcost-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", kind: "COLLEGE" }, select: { id: true } })).id);
  await db.schoolModule.create({ data: { schoolId: c, module: "ACADEMICS" } });
  facultyUser = (await db.user.create({ data: { name: "ZZ Cost faculty", email: `zz-markcost-fac-${STAMP}@test.invalid` }, select: { id: true } })).id;
  id.faculty = (await db.membership.create({ data: { userId: facultyUser, schoolId: c, role: "FACULTY", status: "ACTIVE" }, select: { id: true } })).id;
  id.dept = (await db.department.create({ data: { schoolId: c, code: "PHY", name: "ZZ Physics", condoneFloorPercent: 65 }, select: { id: true } })).id;
  id.programme = (await db.programme.create({ data: { schoolId: c, departmentId: id.dept, code: "BSC", name: "ZZ BSc", level: "UG", durationYears: 3, regulator: "UGC", attendanceThreshold: 75 }, select: { id: true } })).id;
  id.scheme = (await db.scheme.create({ data: { schoolId: c, programmeId: id.programme, name: "ZZ BSc 2024", effectiveYear: 2024, passingRules: JSON.stringify({ minPercentPerCourse: 40, atktLimit: 4, totalCredits: 120, internalMax: 40, externalMax: 60, minTermCredits: 1, maxTermCredits: 30 }) }, select: { id: true } })).id;
  id.course = (await db.course.create({ data: { schoolId: c, schemeId: id.scheme, code: "PHY1", name: "ZZ PHY1", semester: 1, creditsL: 4, kind: "CORE", outcomes: "[]" }, select: { id: true } })).id;
  id.term = (await db.academicTerm.create({ data: { schoolId: c, name: "ZZ Now", academicYear: "2026–27", startsOn: addDaysToKey(TODAY, -100), endsOn: addDaysToKey(TODAY, 60), registrationOpensOn: addDaysToKey(TODAY, -100), registrationClosesOn: addDaysToKey(TODAY, -90) }, select: { id: true } })).id;
  id.offering = (await db.courseOffering.create({ data: { schoolId: c, termId: id.term, courseId: id.course, facultyMembershipId: id.faculty, lectureHours: 3 }, select: { id: true } })).id;
  for (let i = 0; i < 14; i += 1) {
    const user = await db.user.create({ data: { name: `ZZ Cost student ${i}`, email: `zz-markcost-s${i}-${STAMP}@test.invalid` }, select: { id: true } });
    const m = await db.membership.create({ data: { userId: user.id, schoolId: c, role: "STUDENT", status: "ACTIVE", studentCode: `ZMC${i}-${SUFFIX}` }, select: { id: true } });
    await db.studentProgramme.create({ data: { schoolId: c, studentMembershipId: m.id, programmeId: id.programme, schemeId: id.scheme, entryYear: 2026 } });
    students.push(m.id);
  }
  await db.courseRegistration.createMany({ data: students.map((s) => ({ schoolId: c, studentMembershipId: s, offeringId: id.offering!, termId: id.term!, kind: "CORE" })) });
  __resetCookies();
  __setHeaders({});
  await createSession(facultyUser, { schoolId: c, role: "FACULTY" as never });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.notification.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.auditLog.deleteMany({ where: { schoolId: id.college } });
  await db.school.deleteMany({ where: { id: id.college } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
  process.env.DATABASE_URL = OWNER_URL;
});

const present = (ids: string[]) => ids.map((s) => ({ studentMembershipId: s, status: "PRESENT" as const }));
// Twelve of the fourteen; the last two are kept for the notice cases below.
const batch = () => students.slice(0, 12);

describe("marking a lecture", () => {
  it("runs as the app role, not the owner", async () => {
    const [app] = await appDb.$queryRaw<{ u: string }[]>`SELECT current_user AS u`;
    const [owner] = await db.$queryRaw<{ u: string }[]>`SELECT current_user AS u`;
    expect(app!.u).not.toBe(owner!.u);
  });

  it("costs the same at twelve students as at two, reads no percentage when all are present, and writes in one tenant transaction", async () => {
    const two = await cost(present(batch().slice(0, 2)));
    const twelve = await cost(present(batch()));
    expect(twelve.ops).toBe(two.ops);
    expect(twelve.txs).toBe(two.txs);
    // Nothing of attendanceRows: no term, no timetable, no holidays, no registrations' names.
    for (const read of ["academicTerm.", "offeringSlot.", "holiday.", "attendanceCondonation."]) expect(twelve.models.some((m) => m.startsWith(read))).toBe(false);
    // One insert for the batch, no per-student upsert.
    expect(twelve.models.filter((m) => m === "lectureAttendance.createMany")).toHaveLength(1);
    expect(twelve.models.some((m) => m === "lectureAttendance.upsert")).toBe(false);
    // The count this fix brought it to: 10 operations in 5 transactions. Before it: 27 operations in 26
    // transactions at two students and 37 at twelve (an upsert each, and the whole offering's
    // attendanceRows before and after the write).
    expect(twelve.ops).toBeLessThanOrEqual(10);
    expect(twelve.txs).toBeLessThanOrEqual(5);
  });

  it("with one absentee, still costs the same at twelve as at two, and reads the percentage of that one student only", async () => {
    const mark = (n: number) => [...present(batch().slice(1, n)), { studentMembershipId: batch()[0]!, status: "ABSENT" as const }];
    // The first absence takes them under the line and sends a notice; measured after it, neither batch crosses anyone.
    await cost(mark(2));
    const two = await cost(mark(2));
    const twelve = await cost(mark(12));
    expect(twelve.ops).toBe(two.ops);
    expect(twelve.txs).toBe(two.txs);
    // attendanceRows once, after the write, for the absentee alone.
    expect(twelve.models.filter((m) => m === "academicTerm.findUniqueOrThrow")).toHaveLength(1);
    expect(twelve.models.filter((m) => m === "courseRegistration.findMany")).toHaveLength(2);
    // 18 operations in 13 transactions (before: 27 in 26 at two students, 37 at twelve).
    expect(twelve.ops).toBeLessThanOrEqual(18);
    expect(twelve.txs).toBeLessThanOrEqual(13);
  });

  it("tells a student a re-mark takes under the line, worked out from the one read after the write (75 % → 50 %)", async () => {
    const ctx = await requireApiRoles("FACULTY");
    const s = students[12]!;
    const ls = [await lecture(), await lecture(), await lecture(), await lecture()];
    const statuses = ["PRESENT", "PRESENT", "PRESENT", "ABSENT"] as const;
    for (const [k, l] of ls.entries()) await markLecture(ctx, l, { clientId: `zz-cost-re-${STAMP}-${k}`, entries: [{ studentMembershipId: s, status: statuses[k]! }] });
    // 3 of 4 = 75 %, on the line: the last ABSENT was not a crossing.
    expect(await db.defaulterNotice.count({ where: { studentMembershipId: s } })).toBe(0);
    // The third lecture corrected from PRESENT to ABSENT: 2 of 4 = 50 %, from 75 % before.
    const r = await markLecture(ctx, ls[2]!, { clientId: `zz-cost-re-${STAMP}-fix`, entries: [{ studentMembershipId: s, status: "ABSENT" }] });
    expect(r).toMatchObject({ absent: 1, present: 0, noticesSent: 1 });
    expect(await db.defaulterNotice.count({ where: { studentMembershipId: s } })).toBe(1);
  });

  it("does not tell a student already under the line, and keeps a student's last mark when named twice", async () => {
    const ctx = await requireApiRoles("FACULTY");
    const s = students[13]!;
    const first = await lecture();
    const r1 = await markLecture(ctx, first, { clientId: `zz-cost-under-${STAMP}-1`, entries: [{ studentMembershipId: s, status: "ABSENT" }] });
    // Unmarked before, 0 % now: told.
    expect(r1.noticesSent).toBe(1);
    await db.defaulterNotice.deleteMany({ where: { studentMembershipId: s } });
    // Already at 0 %: a second absence crosses nothing, though the weekly record was cleared.
    const second = await lecture();
    const r2 = await markLecture(ctx, second, { clientId: `zz-cost-under-${STAMP}-2`, entries: [{ studentMembershipId: s, status: "PRESENT" }, { studentMembershipId: s, status: "ABSENT" }] });
    expect(r2).toMatchObject({ absent: 1, present: 0, noticesSent: 0 });
    expect((await db.lectureAttendance.findFirstOrThrow({ where: { lectureId: second, studentMembershipId: s }, select: { status: true } })).status).toBe("ABSENT");
  });
});
