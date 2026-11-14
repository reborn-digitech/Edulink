/**
 * The fees batch of the testing analysis of 13 November 2026: plans and demands.
 *
 *   TA-126  a demand a reversed or refunded payment once sat on survived a move to another structure, or an
 *           unassignment, and stayed owed beside the new plan's demands.
 *   TA-133  the ledger's writers that skipped the locks settle relies on: a claim rejected while it is being
 *           confirmed, and a concession rewriting a demand while it is being paid.
 *   TA-584  two guardians choosing a plan for one child at the same moment both succeeded.
 *
 * At a ZZ school of this suite's own, removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { assignPlans, createStructure, grantConcession, publishStructure, pupilLedger, saveFeeSettings, saveHead, setStructureSelfEnrol, unassignPlan } from "@/lib/fees";
import { claimUpiPayment, recordCounterPayment, rejectClaim, requestRefund, reversePayment, startUpiPayment } from "@/lib/fees-payments";
import { selfEnrolPlan } from "@/lib/fees-family";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const TODAY = "2026-11-14";
const mail = (who: string) => `zz-tafees-ledger-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function ctx(userId: string, role: ActiveContext["role"], schoolId: string | null, membershipId: string | null = null): ActiveContext {
  return { sessionId: "t", membershipId, schoolId, role, user: { id: userId, name: "ZZ", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: {} as never } } as ActiveContext;
}
const admin = () => ctx(ids.admin!, "ADMIN", ids.school!, ids.adminM!);
const parent = (who = "parent") => ctx(ids[who]!, "PARENT", null);

let pupilCount = 0;
async function pupil(label: string, guardians: string[] = ["parent"]): Promise<string> {
  pupilCount += 1;
  const user = await db.user.create({ data: { name: `ZZ TAF Ledger ${label}`, email: mail(`pupil${pupilCount}`) }, select: { id: true } });
  const m = await db.membership.create({ data: { userId: user.id, schoolId: ids.school!, role: "STUDENT", status: "ACTIVE", gradeLevel: "3", studentCode: `ZTL${SUFFIX}${pupilCount}` }, select: { id: true } });
  for (const g of guardians) await db.guardianship.create({ data: { parentUserId: ids[g]!, studentMembershipId: m.id, studentSchoolId: ids.school!, status: "ACTIVE" } });
  return m.id;
}
const demandsOf = (studentMembershipId: string) => db.feeDemand.findMany({ where: { studentMembershipId }, orderBy: [{ dueDate: "asc" }, { label: "asc" }], select: { id: true, label: true, status: true, netPaise: true, paidPaise: true, instalmentId: true } });
const owing = (studentMembershipId: string) => demandsOf(studentMembershipId).then((rows) => rows.filter((d) => d.status === "OPEN" || d.status === "PART"));

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TAF Ledger ${STAMP}`, slug: `zz-taf-ledger-${STAMP}`, code: `ZTL${SUFFIX}`, contactEmail: mail("school"), timezone: "Asia/Kolkata", locale: "en", isTestFixture: true }, select: { id: true } })).id;
  ids.year = (await db.academicYear.create({ data: { schoolId: ids.school, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  for (const who of ["admin", "parent", "parent2"]) ids[who] = (await db.user.create({ data: { name: `ZZ TAF Ledger ${who}`, email: mail(who) }, select: { id: true } })).id;
  ids.adminM = (await db.membership.create({ data: { userId: ids.admin!, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  ids.head = await saveHead(admin(), { name: "ZZ Tuition", code: "TUI", kind: "TUITION" });
  ids.structA = await createStructure(admin(), { name: "ZZ Plan A", gradeLevel: null, instalments: [{ label: "A Term 1", dueDateKey: "2026-07-01", lines: [{ headId: ids.head, amountPaise: 1_000_00 }] }, { label: "A Term 2", dueDateKey: "2026-12-01", lines: [{ headId: ids.head, amountPaise: 1_000_00 }] }] });
  ids.structB = await createStructure(admin(), { name: "ZZ Plan B", gradeLevel: null, instalments: [{ label: "B Term 1", dueDateKey: "2026-07-01", lines: [{ headId: ids.head, amountPaise: 1_500_00 }] }, { label: "B Term 2", dueDateKey: "2026-12-01", lines: [{ headId: ids.head, amountPaise: 1_500_00 }] }] });
  await publishStructure(admin(), ids.structA);
  await publishStructure(admin(), ids.structB);
  await setStructureSelfEnrol(admin(), ids.structA, true);
  await setStructureSelfEnrol(admin(), ids.structB, true);
  await saveFeeSettings(admin(), { upiId: "zzledger@okaxis", upiPayee: "ZZ Ledger School" });
}, 60_000);

afterAll(async () => {
  const people = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.notification.deleteMany({ where: { userId: { in: people.map((p) => p.id) } } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
  await db.guardianship.deleteMany({ where: { studentSchoolId: ids.school } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { id: { in: people.map((p) => p.id) } } });
  await db.$disconnect();
}, 60_000);

describe("TA-126: a demand emptied by a reversal or a refund", { timeout: 60_000 }, () => {
  it("TA-126: moved to another structure after Term 1's payment was reversed, the pupil owes exactly the new structure's terms", async () => {
    const p = await pupil("reversed and moved");
    await assignPlans(admin(), { structureId: ids.structA!, studentMembershipIds: [p] });
    const pay = await recordCounterPayment(admin(), { studentMembershipId: p, amountPaise: 1_000_00, method: "CASH" });
    await reversePayment(admin(), pay.paymentId, "Bounced, entered against the wrong child");
    const moved = await assignPlans(admin(), { structureId: ids.structB!, studentMembershipIds: [p] });
    expect(moved.moved).toBe(1);
    expect((await owing(p)).map((d) => d.label)).toEqual(["B Term 1", "B Term 2"]);
    expect((await pupilLedger(ids.school!, p, { todayKey: TODAY })).totals.outstandingPaise).toBe(3_000_00);
    // The emptied demand is kept for the trail of the reversed payment, cancelled, and opened again on a move back.
    expect((await demandsOf(p)).filter((d) => d.label === "A Term 1").map((d) => d.status)).toEqual(["CANCELLED"]);
    await assignPlans(admin(), { structureId: ids.structA!, studentMembershipIds: [p] });
    expect((await owing(p)).map((d) => d.label)).toEqual(["A Term 1", "A Term 2"]);
    expect((await pupilLedger(ids.school!, p, { todayKey: TODAY })).totals.outstandingPaise).toBe(2_000_00);
  });

  it("TA-126: moved after Term 1 was refunded in full, the pupil owes exactly the new structure's terms", async () => {
    const p = await pupil("refunded and moved");
    await assignPlans(admin(), { structureId: ids.structA!, studentMembershipIds: [p] });
    const pay = await recordCounterPayment(admin(), { studentMembershipId: p, amountPaise: 1_000_00, method: "CASH" });
    await requestRefund(admin(), { paymentId: pay.paymentId, amountPaise: 1_000_00, reason: "Paid twice by mistake" });
    await assignPlans(admin(), { structureId: ids.structB!, studentMembershipIds: [p] });
    expect((await owing(p)).map((d) => d.label)).toEqual(["B Term 1", "B Term 2"]);
    expect((await pupilLedger(ids.school!, p, { todayKey: TODAY })).totals.outstandingPaise).toBe(3_000_00);
  });

  it("TA-126: taken off the plan after Term 1's payment was reversed, the pupil owes nothing", async () => {
    const p = await pupil("reversed and unassigned");
    await assignPlans(admin(), { structureId: ids.structA!, studentMembershipIds: [p] });
    const pay = await recordCounterPayment(admin(), { studentMembershipId: p, amountPaise: 1_000_00, method: "CASH" });
    await reversePayment(admin(), pay.paymentId, "Bounced cheque, keyed as cash");
    await unassignPlan(admin(), p, ids.year!);
    expect(await owing(p)).toEqual([]);
    expect((await pupilLedger(ids.school!, p, { todayKey: TODAY })).totals.outstandingPaise).toBe(0);
  });
});

/**
 * Holds a row lock the way a settling payment does (FOR UPDATE, then its write, not yet committed), starts `start`
 * while it is held, waits until that work is blocked behind it (or a few seconds pass), and commits.
 */
async function whileLocked<T>(lock: (tx: PrismaClient) => Promise<void>, start: () => Promise<T>): Promise<{ work: Promise<T> }> {
  const box: { work: Promise<T> | null } = { work: null };
  await db.$transaction(
    async (raw) => {
      const tx = raw as unknown as PrismaClient;
      await lock(tx);
      const pid = (await tx.$queryRaw<{ pid: number }[]>`SELECT pg_backend_pid() AS pid`)[0]!.pid;
      const work = start();
      work.catch(() => undefined);
      box.work = work;
      for (let i = 0; i < 12; i += 1) {
        const n = (await tx.$queryRaw<{ n: number }[]>`SELECT count(*)::int AS n FROM pg_stat_activity WHERE ${pid}::int = ANY(pg_blocking_pids(pid))`)[0]!.n;
        if (n > 0) break;
        await sleep(250);
      }
      await sleep(300);
    },
    { timeout: 30_000 },
  );
  if (!box.work) throw new Error("the work was never started");
  return { work: box.work };
}
const outcome = (p: Promise<unknown>) => p.then(() => "done", (error: unknown) => (error instanceof Error ? error.message : String(error)));

describe("TA-133: the ledger's writers wait for the locks a payment holds", { timeout: 60_000 }, () => {
  it("TA-133: a claim rejected while the office confirms it stays PAID with its receipt, and the rejection is refused", async () => {
    const p = await pupil("claim confirm and reject");
    await assignPlans(admin(), { structureId: ids.structA!, studentMembershipIds: [p] });
    const term1 = (await owing(p))[0]!;
    const upi = await startUpiPayment(parent(), { studentMembershipId: p, demandIds: [term1.id] });
    await claimUpiPayment(parent(), { paymentId: upi.paymentId, utr: `ZZUTR${SUFFIX}133A` });
    // The confirm, in flight: the payment row locked and turned PAID, not yet committed. The rejection read CLAIMED.
    const rejection = await whileLocked(
      async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "FeePayment" WHERE "id" = ${upi.paymentId} FOR UPDATE`;
        await tx.feePayment.update({ where: { id: upi.paymentId }, data: { status: "PAID", paidAt: new Date() } });
      },
      () => rejectClaim(admin(), upi.paymentId, "No such credit on the statement"),
    );
    expect(await outcome(rejection.work)).toBe("fees.refuseNotClaimed");
    expect((await db.feePayment.findUniqueOrThrow({ where: { id: upi.paymentId }, select: { status: true } })).status).toBe("PAID");
  });

  it("TA-133: a concession granted while Term 1 is being paid leaves the paid demand as it was paid", async () => {
    const p = await pupil("concession while paying");
    await assignPlans(admin(), { structureId: ids.structA!, studentMembershipIds: [p] });
    const term1 = (await owing(p))[0]!;
    // The payment, in flight: the pupil's open demands locked (openDemands) and Term 1 paid in full, not yet committed.
    const grant = await whileLocked(
      async (tx) => {
        await tx.$queryRaw`SELECT "id" FROM "FeeDemand" WHERE "schoolId" = ${ids.school!} AND "studentMembershipId" = ${p} AND "status" IN ('OPEN', 'PART') ORDER BY "id" FOR UPDATE`;
        await tx.feeDemand.update({ where: { id: term1.id }, data: { paidPaise: 1_000_00, status: "PAID" } });
      },
      () => grantConcession(admin(), { studentMembershipId: p, headId: null, kind: "PERCENT", value: 1000, reason: "Sibling discount" }),
    );
    expect(await outcome(grant.work)).toBe("done");
    const after = await db.feeDemand.findUniqueOrThrow({ where: { id: term1.id }, select: { status: true, netPaise: true, paidPaise: true } });
    expect(after).toEqual({ status: "PAID", netPaise: 1_000_00, paidPaise: 1_000_00 });
  });
});

describe("TA-584: two guardians choosing at the same moment", { timeout: 120_000 }, () => {
  it("TA-584: of two choices for one child made together, one stands and the other is refused, never moved and never a 500", async () => {
    for (let round = 0; round < 6; round += 1) {
      const p = await pupil(`two guardians ${round}`, ["parent", "parent2"]);
      const results = await Promise.allSettled([selfEnrolPlan(parent("parent"), { student: p, planId: ids.structA! }), selfEnrolPlan(parent("parent2"), { student: p, planId: ids.structB! })]);
      const won = results.filter((r) => r.status === "fulfilled") as PromiseFulfilledResult<{ structureId: string; demands: number }>[];
      const lost = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
      expect(won).toHaveLength(1);
      expect(lost.map((r) => (r.reason as Error).message)).toEqual(["fees.refuseSelfEnrolHasPlan"]);
      const plan = await db.studentFeePlan.findFirstOrThrow({ where: { studentMembershipId: p }, select: { structureId: true } });
      expect(plan.structureId).toBe(won[0]!.value.structureId);
      expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "fees.plan.selfEnrolled", targetId: p } })).toBe(1);
    }
  });
});
