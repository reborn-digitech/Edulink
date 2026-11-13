/**
 * The concession before the demands: finding TA-004 of the testing analysis of
 * 13 November 2026, held by cases that FAIL while the defect stands and pass
 * once it is fixed.
 *
 *   TA-004  A concession granted before the student's demands exist is valued
 *           at nothing and applied without the principal; several small ones
 *           add up the same way. concessionWorth (src/lib/college-fees.ts)
 *           reads only demands that already exist, so with none the worth is 0,
 *           0 is not above the office's limit and the row is written APPROVED;
 *           regenerateDemands (src/lib/fees.ts) then applies every APPROVED
 *           concession when demands are next written. And the limit is
 *           compared with one concession's worth, never with what the
 *           student's concessions take together.
 *
 * Route one: the accounts desk grants a student with no demands a 100 %
 * concession, then raises the year's demands. Route two: with demands in place
 * and the limit at its default of Rs 5,000, two AMOUNT concessions of Rs 2,500
 * a term on a two-term plan (Rs 5,000 each, exactly the limit; Rs 10,000
 * together).
 *
 * A scratch ZZ college of this suite's own (its stamp in every name and
 * address), built as tests/college-office.test.ts builds its own: a year, a
 * programme, one tuition head, one published structure of two terms at
 * Rs 12,500 each, two enrolled students, an accounts desk and a principal.
 * Removed with the college in afterAll.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { grantCollegeConcession, pendingConcessions, raiseDemands } from "@/lib/college-fees";
import { POST as structuresPost } from "@/app/api/v1/accounts/fee-structures/route";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-ta004-${who}-${STAMP}@test.invalid`;
const TERM_TUITION = 1_250_000; // Rs 12,500 a term
const LIMIT = 500_000; // the office's default limit, Rs 5,000 (officeSettings)
const ids: Record<string, string> = {};

async function as(who: string, role: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId: ids.college!, role: role as never });
  const session = await getSession();
  if (!session?.membershipId) throw new Error(`no session for ${who} as ${role}`);
  return session;
}

async function person(who: string, role: string, name: string, extra: object = {}): Promise<void> {
  ids[who] = (await db.user.create({ data: { name, email: MAIL(who), prefs: "{}", ...extra }, select: { id: true } })).id;
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.college!, role, status: "ACTIVE" }, select: { id: true } })).id;
}

async function settle<T>(run: () => Promise<T>): Promise<{ value: T } | { error: unknown }> {
  try {
    return { value: await run() };
  } catch (error) {
    return { error };
  }
}

const demandsOf = (who: string) => db.feeDemand.findMany({ where: { studentMembershipId: ids[`${who}M`] }, orderBy: { dueDate: "asc" }, select: { grossPaise: true, concessionPaise: true, netPaise: true, status: true } });
type Grant = { value: Awaited<ReturnType<typeof grantCollegeConcession>> } | { error: unknown };
const statusOf = (g: Grant) => ("value" in g ? g.value.approvalStatus : `refused: ${(g.error as { key?: string }).key ?? String(g.error)}`);

let demandsWhenGranted = -1;
let early: Grant;
let raised: Awaited<ReturnType<typeof raiseDemands>>;
let earlyDemands: Awaited<ReturnType<typeof demandsOf>> = [];
let principalsQueue: string[] = [];
let lateDemandsBefore: Awaited<ReturnType<typeof demandsOf>> = [];
let first: Grant;
let second: Grant;
let lateDemandsAfter: Awaited<ReturnType<typeof demandsOf>> = [];

beforeAll(async () => {
  const college = await db.school.create({ data: { name: `ZZ TA004 College ${STAMP}`, slug: `zz-ta004-college-${STAMP}`, code: `ZZTA004${STAMP}`, contactEmail: MAIL("office"), timezone: "Asia/Kolkata", kind: "COLLEGE", isTestFixture: true }, select: { id: true } });
  ids.college = college.id;
  await db.schoolModule.create({ data: { schoolId: college.id, module: "ACADEMICS" } });
  await person("accounts", "ACCOUNTS", "ZZ TA004 Accounts");
  await person("principal", "PRINCIPAL", "ZZ TA004 Principal");
  const adult = { isMinor: false, birthdate: new Date("2006-01-01T00:00:00Z") };
  await person("early", "STUDENT", "ZZ TA004 Early", adult); // the concession comes before their demands
  await person("late", "STUDENT", "ZZ TA004 Late", adult); // two concessions after their demands
  ids.year = (await db.academicYear.create({ data: { schoolId: college.id, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-05-31T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  const dept = await db.department.create({ data: { schoolId: college.id, code: "PHY", name: "ZZ TA004 Physics" }, select: { id: true } });
  const programme = await db.programme.create({ data: { schoolId: college.id, departmentId: dept.id, code: "BSCPHY", name: "ZZ TA004 BSc Physics", level: "UG", durationYears: 4, regulator: "UGC" }, select: { id: true } });
  ids.tuition = (await db.feeHead.create({ data: { schoolId: college.id, name: "ZZ TA004 Tuition", code: "TUI", kind: "TUITION" }, select: { id: true } })).id;
  await db.programmeEnrolment.createMany({ data: ["early", "late"].map((who) => ({ schoolId: college.id, studentMembershipId: ids[`${who}M`]!, programmeId: programme.id, yearOfEntry: 2026, category: "OPEN", quota: "CAP" })) });

  // The year's structure is published; nobody has pressed "raise demands" yet.
  await as("accounts", "ACCOUNTS");
  const structure = await structuresPost(
    new Request("http://localhost/api/v1/accounts/fee-structures", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ programmeId: programme.id, yearOfStudy: 1, category: "OPEN", approvalRef: "ZZ/FRA/0004", name: "ZZ TA004 FY OPEN", terms: [{ label: "ZZ Odd", dueDateKey: "2026-07-15", lines: [{ headId: ids.tuition, amountPaise: TERM_TUITION }] }, { label: "ZZ Even", dueDateKey: "2026-12-15", lines: [{ headId: ids.tuition, amountPaise: TERM_TUITION }] }], lateFeeSlabs: [] }),
    }),
  );
  if (structure.status !== 200) throw new Error(`the structure was refused: ${structure.status} ${await structure.text()}`);

  // Route one: a 100 % concession for a student with no demands, then the demands are raised.
  demandsWhenGranted = await db.feeDemand.count({ where: { studentMembershipId: ids.earlyM } });
  early = await settle(async () => grantCollegeConcession(await as("accounts", "ACCOUNTS"), { studentMembershipId: ids.earlyM!, headId: null, kind: "PERCENT", value: 10000, reason: "ZZ full waiver", authority: "ZZ Governing body" }));
  raised = await raiseDemands(await as("accounts", "ACCOUNTS"), {});
  earlyDemands = await demandsOf("early");
  principalsQueue = (await pendingConcessions(await as("principal", "PRINCIPAL"))).items.map((c) => c.studentName);

  // Route two: with demands in place, two concessions of Rs 2,500 a term, each worth exactly the limit.
  lateDemandsBefore = await demandsOf("late");
  const amount = { studentMembershipId: ids.lateM!, headId: ids.tuition!, kind: "AMOUNT" as const, value: 250_000, authority: "ZZ Governing body" };
  first = await settle(async () => grantCollegeConcession(await as("accounts", "ACCOUNTS"), { ...amount, reason: "ZZ sibling" }));
  second = await settle(async () => grantCollegeConcession(await as("accounts", "ACCOUNTS"), { ...amount, reason: "ZZ sports" }));
  lateDemandsAfter = await demandsOf("late");
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  if (ids.college) {
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.college }, { actorUserId: { in: userIds } }] } });
    await db.school.deleteMany({ where: { id: ids.college } });
  }
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-004: a concession is valued on what it will take, and the limit on what the student's concessions take together", () => {
  it("arrange: no demand existed when the first concession was granted; raising then wrote two terms of Rs 12,500 for each student", () => {
    expect(demandsWhenGranted).toBe(0);
    expect({ students: raised.students, assigned: raised.assigned }).toEqual({ students: 2, assigned: 2 });
    expect(earlyDemands.map((d) => d.grossPaise)).toEqual([TERM_TUITION, TERM_TUITION]);
    expect(lateDemandsBefore.map((d) => [d.grossPaise, d.netPaise, d.status])).toEqual([[TERM_TUITION, TERM_TUITION, "OPEN"], [TERM_TUITION, TERM_TUITION, "OPEN"]]);
  });

  it("⚠ a 100 % concession for a student with no demands yet waits for the principal", () => {
    expect(statusOf(early), "value" in early ? `valued at ${early.value.valuePaise} paise against a limit of ${LIMIT}` : undefined).toBe("PENDING");
  });

  it("⚠ …and is on the principal's list of concessions to decide", () => {
    expect(principalsQueue).toEqual(["ZZ TA004 Early"]);
  });

  it("⚠ …and when the demands are raised each term still asks its full fee: nothing is waived until a principal approves", () => {
    expect(earlyDemands.map((d) => ({ net: d.netPaise, concession: d.concessionPaise, status: d.status }))).toEqual([
      { net: TERM_TUITION, concession: 0, status: "OPEN" },
      { net: TERM_TUITION, concession: 0, status: "OPEN" },
    ]);
  });

  it("the first concession of Rs 2,500 a term is worth exactly the limit and is the office's to apply", () => {
    expect(statusOf(first)).toBe("APPROVED");
    expect("value" in first ? first.value.valuePaise : null).toBe(LIMIT);
  });

  it("⚠ a second one, which takes the student's concessions to twice the limit, waits for the principal", () => {
    expect(statusOf(second)).toBe("PENDING");
  });

  it("⚠ …and takes nothing more off the demands until then: each term stands at Rs 10,000", () => {
    expect(lateDemandsAfter.map((d) => ({ net: d.netPaise, concession: d.concessionPaise }))).toEqual([
      { net: TERM_TUITION - 250_000, concession: 250_000 },
      { net: TERM_TUITION - 250_000, concession: 250_000 },
    ]);
  });
});
