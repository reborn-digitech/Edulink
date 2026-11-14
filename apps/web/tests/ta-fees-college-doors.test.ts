/**
 * The fees batch of the testing analysis of 13 November 2026, at a college.
 *
 *   TA-082  the school's plan door put a college student on any published structure: a cheaper one was a
 *           concession with no authority named and no principal; and the remove door let the accounts desk in
 *           where the web's own button is the office's. A second reader found the family's door (selfEnrolPlan)
 *           still wrote through the one writer without the standing check, so a structure opened to families put an
 *           OPEN student on the OBC fee.
 *   TA-337  the receipt door refused the college's accounts desk, which the library and the web page admit.
 *
 * At a scratch ZZ college of this suite's own (its stamp in every name), removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { assignPlans, createStructure, publishStructure, saveHead } from "@/lib/fees";
import { recordCounterPayment } from "@/lib/fees-payments";
import { selfEnrolPlan } from "@/lib/fees-family";
import { POST as removePost } from "@/app/api/v1/fees/plans/remove/route";
import { GET as receiptGet } from "@/app/api/v1/fees/receipts/[receiptId]/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-tafees-college-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};

async function as(who: string, role: string, schoolId = ids.college!): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(ids[who]!, { schoolId, role: role as never });
  const session = await getSession();
  if (!session?.membershipId) throw new Error(`no session for ${who} as ${role}`);
  return session;
}

async function person(who: string, role: string, schoolId: string, extra: object = {}): Promise<void> {
  ids[who] = (await db.user.create({ data: { name: `ZZ TAF College ${who}`, email: MAIL(who), prefs: "{}", ...extra }, select: { id: true } })).id;
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId, role, status: "ACTIVE" }, select: { id: true } })).id;
}

async function structure(name: string, perTerm: number, standing: { programmeId: string; yearOfStudy: number; category: string } | null): Promise<string> {
  const accounts = await as("accounts", "ACCOUNTS");
  const id = await createStructure(accounts, { name, gradeLevel: null, instalments: [{ label: "ZZ Odd", dueDateKey: "2026-07-15", lines: [{ headId: ids.tuition!, amountPaise: perTerm }] }, { label: "ZZ Even", dueDateKey: "2026-12-15", lines: [{ headId: ids.tuition!, amountPaise: perTerm }] }] });
  if (standing) await db.feeStructure.update({ where: { id }, data: { ...standing, approvalRef: `ZZ/FRA/${name}` } });
  await publishStructure(accounts, id);
  return id;
}

beforeAll(async () => {
  ids.college = (await db.school.create({ data: { name: `ZZ TAF College ${STAMP}`, slug: `zz-taf-college-${STAMP}`, code: `ZTC${SUFFIX}`, contactEmail: MAIL("office"), timezone: "Asia/Kolkata", kind: "COLLEGE", isTestFixture: true }, select: { id: true } })).id;
  ids.other = (await db.school.create({ data: { name: `ZZ TAF College Other ${STAMP}`, slug: `zz-taf-college-o-${STAMP}`, code: `ZTO${SUFFIX}`, contactEmail: MAIL("other"), timezone: "Asia/Kolkata", kind: "COLLEGE", isTestFixture: true }, select: { id: true } })).id;
  await db.schoolModule.create({ data: { schoolId: ids.college, module: "ACADEMICS" } });
  await person("accounts", "ACCOUNTS", ids.college);
  await person("admin", "ADMIN", ids.college);
  await person("otherAccounts", "ACCOUNTS", ids.other);
  const adult = { isMinor: false, birthdate: new Date("2006-01-01T00:00:00Z") };
  await person("open", "STUDENT", ids.college, adult);
  await person("payer", "STUDENT", ids.college, adult);
  // A first-year who is still a minor, so their guardian reads their money without a grant (assertGuardianAccess).
  await person("minor", "STUDENT", ids.college, { isMinor: true, birthdate: new Date("2010-01-01T00:00:00Z") });
  ids.parent = (await db.user.create({ data: { name: "ZZ TAF College parent", email: MAIL("parent"), prefs: "{}" }, select: { id: true } })).id;
  await db.guardianship.create({ data: { parentUserId: ids.parent, studentMembershipId: ids.minorM!, studentSchoolId: ids.college, status: "ACTIVE" } });
  ids.year = (await db.academicYear.create({ data: { schoolId: ids.college, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-05-31T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  await db.academicYear.create({ data: { schoolId: ids.other, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-05-31T00:00:00Z"), isCurrent: true } });
  const dept = await db.department.create({ data: { schoolId: ids.college, code: "MAT", name: "ZZ TAF Maths" }, select: { id: true } });
  ids.programme = (await db.programme.create({ data: { schoolId: ids.college, departmentId: dept.id, code: "BSCMAT", name: "ZZ TAF BSc Maths", level: "UG", durationYears: 3, regulator: "UGC" }, select: { id: true } })).id;
  ids.tuition = await saveHead(await as("accounts", "ACCOUNTS"), { name: "ZZ TAF Tuition", code: "TUI", kind: "TUITION" });
  for (const m of [ids.openM!, ids.payerM!, ids.minorM!]) await db.programmeEnrolment.create({ data: { schoolId: ids.college, studentMembershipId: m, programmeId: ids.programme, yearOfEntry: 2026, category: "OPEN", quota: "CAP" } });
  ids.openStructure = await structure("OPEN", 2_500_000, { programmeId: ids.programme, yearOfStudy: 1, category: "OPEN" });
  ids.obcStructure = await structure("OBC", 500_000, { programmeId: ids.programme, yearOfStudy: 1, category: "OBC" });
  ids.plainStructure = await structure("Anything", 100_000, null);
}, 120_000);

afterAll(async () => {
  const people = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.notification.deleteMany({ where: { userId: { in: people.map((p) => p.id) } } });
  await db.auditLog.deleteMany({ where: { schoolId: { in: [ids.college!, ids.other!] } } });
  await db.school.deleteMany({ where: { id: { in: [ids.college!, ids.other!] } } });
  await db.user.deleteMany({ where: { id: { in: people.map((p) => p.id) } } });
  await db.$disconnect();
}, 60_000);

describe("TA-082: the plan doors at a college", { timeout: 60_000 }, () => {
  it("TA-082: the accounts desk cannot put an OPEN-category student on the cheaper OBC structure, nor on a structure with no programme", async () => {
    const accounts = await as("accounts", "ACCOUNTS");
    await expect(assignPlans(accounts, { structureId: ids.obcStructure!, studentMembershipIds: [ids.openM!] })).rejects.toThrow("fees.refuseCollegeStanding");
    await expect(assignPlans(accounts, { structureId: ids.plainStructure!, studentMembershipIds: [ids.openM!] })).rejects.toThrow("fees.refuseCollegeStanding");
    expect(await db.studentFeePlan.count({ where: { studentMembershipId: ids.openM } })).toBe(0);
    expect(await db.feeDemand.count({ where: { studentMembershipId: ids.openM } })).toBe(0);
    // Their own structure is theirs to be put on.
    expect(await assignPlans(accounts, { structureId: ids.openStructure!, studentMembershipIds: [ids.openM!] })).toEqual({ assigned: 1, moved: 0, unchanged: 0, refused: [] });
    // And a move to the cheaper one, before anything is paid, is refused the same way.
    await expect(assignPlans(accounts, { structureId: ids.obcStructure!, studentMembershipIds: [ids.openM!] })).rejects.toThrow("fees.refuseCollegeStanding");
    expect((await db.studentFeePlan.findFirstOrThrow({ where: { studentMembershipId: ids.openM }, select: { structureId: true } })).structureId).toBe(ids.openStructure);
  });

  it("TA-082: a guardian choosing a structure opened to families cannot put an OPEN-category student on the cheaper OBC one", async () => {
    await db.feeStructure.updateMany({ where: { id: { in: [ids.openStructure!, ids.obcStructure!] } }, data: { selfEnrol: true } });
    const parent: ActiveContext = {
      sessionId: "zz-tafees-college-parent",
      membershipId: null,
      schoolId: null,
      role: "PARENT",
      user: { id: ids.parent!, name: "ZZ TAF College parent", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", locale: "en", channels: { push: true, email: true }, quietHours: null } as never },
    };
    await expect(selfEnrolPlan(parent, { student: ids.minorM!, planId: ids.obcStructure! })).rejects.toThrow("fees.refuseCollegeStanding");
    expect(await db.studentFeePlan.count({ where: { studentMembershipId: ids.minorM } })).toBe(0);
    expect(await db.feeDemand.count({ where: { studentMembershipId: ids.minorM } })).toBe(0);
    // The structure their standing calls for is still theirs to choose.
    expect((await selfEnrolPlan(parent, { student: ids.minorM!, planId: ids.openStructure! })).structureId).toBe(ids.openStructure);
  });

  it("TA-082: the remove door is the office's, as its button is: the accounts desk is refused 403 and the plan stays", async () => {
    await as("accounts", "ACCOUNTS");
    const refused = await removePost(new Request("http://localhost/api/v1/fees/plans/remove", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ studentMembershipId: ids.openM, academicYearId: ids.year }) }));
    expect(refused.status).toBe(403);
    expect(await db.studentFeePlan.count({ where: { studentMembershipId: ids.openM } })).toBe(1);
  });
});

describe("TA-337: the receipt door and the accounts desk", { timeout: 60_000 }, () => {
  it("TA-337: the accounts desk opens the receipt it has just issued; another college's desk is answered 404", async () => {
    const accounts = await as("accounts", "ACCOUNTS");
    await assignPlans(accounts, { structureId: ids.openStructure!, studentMembershipIds: [ids.payerM!] });
    const paid = await recordCounterPayment(accounts, { studentMembershipId: ids.payerM!, amountPaise: 1_000_00, method: "CASH" });
    const own = await receiptGet(new Request(`http://localhost/api/v1/fees/receipts/${paid.receiptId}`), { params: Promise.resolve({ receiptId: paid.receiptId }) });
    expect(own.status).toBe(200);
    expect(((await own.json()) as { serial: string }).serial).toBe(paid.serial);
    await as("otherAccounts", "ACCOUNTS", ids.other!);
    const other = await receiptGet(new Request(`http://localhost/api/v1/fees/receipts/${paid.receiptId}`), { params: Promise.resolve({ receiptId: paid.receiptId }) });
    expect(other.status).toBe(404);
  });
});
