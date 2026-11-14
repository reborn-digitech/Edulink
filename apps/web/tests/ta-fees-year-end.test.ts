/**
 * The fees batch of the testing analysis of 13 November 2026: the year end and the reminders.
 *
 *   TA-127  reversing or refunding a payment after its demand was carried forward changed nothing that is owed.
 *   TA-130  the carry-forward read the open demands before its transaction and marked them CARRIED without a
 *           condition: two runs at once carried twice, and a payment settling in between was overwritten.
 *   TA-132  the whole-school fee writes ran in one transaction with Prisma's five-second default.
 *   TA-412  "Remind overdue" had no repeat guard: a second press texted every overdue family again.
 *   TA-417  the daily reminder told first and marked after, so two runners told each family twice.
 *
 * The races are played the way the finding describes them: a row lock held as a payment holds it, the work started
 * while it is held, and the lock let go once the work is waiting behind it. At a ZZ school of this suite's own.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { db as appDb } from "@/lib/db";
import { assignPlans, createStructure, publishStructure, saveHead } from "@/lib/fees";
import { recordCounterPayment, requestRefund, reversePayment } from "@/lib/fees-payments";
import { carryForward, remindNow, sendFeeReminders } from "@/lib/fees-reports";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const mail = (who: string) => `zz-tafees-year-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function ctx(userId: string, role: ActiveContext["role"], schoolId: string | null, membershipId: string | null = null): ActiveContext {
  return { sessionId: "t", membershipId, schoolId, role, user: { id: userId, name: "ZZ", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: {} as never } } as ActiveContext;
}
const admin = () => ctx(ids.admin!, "ADMIN", ids.school!, ids.adminM!);

let pupils = 0;
async function pupil(): Promise<string> {
  pupils += 1;
  const user = await db.user.create({ data: { name: `ZZ TAF Year Pupil ${pupils}`, email: mail(`pupil${pupils}`) }, select: { id: true } });
  const m = await db.membership.create({ data: { userId: user.id, schoolId: ids.school!, role: "STUDENT", status: "ACTIVE", studentCode: `ZTY${SUFFIX}${pupils}` }, select: { id: true } });
  await db.guardianship.create({ data: { parentUserId: ids.parent!, studentMembershipId: m.id, studentSchoolId: ids.school!, status: "ACTIVE" } });
  return m.id;
}
async function year(name: string, start: string, isCurrent = false): Promise<string> {
  return (await db.academicYear.create({ data: { schoolId: ids.school!, name, startDate: new Date(`${start}T00:00:00Z`), endDate: new Date(new Date(`${start}T00:00:00Z`).getTime() + 330 * 86_400_000), isCurrent }, select: { id: true } })).id;
}
async function demandIn(academicYearId: string, studentMembershipId: string, dueKey: string, paise = 1_000_00): Promise<string> {
  return (await db.feeDemand.create({ data: { schoolId: ids.school!, studentMembershipId, academicYearId, label: `ZZ Due ${dueKey}`, dueDate: new Date(`${dueKey}T00:00:00Z`), grossPaise: paise, netPaise: paise, status: "OPEN" }, select: { id: true } })).id;
}
const openingBalances = (academicYearId: string, studentMembershipId: string) => db.feeDemand.count({ where: { academicYearId, studentMembershipId, instalmentId: null, linesJson: { contains: '"code":"OB"' } } });

/**
 * Holds `lock` (a row lock, as a payment settling holds it) in a transaction of the owner's, starts `start` while it
 * is held, waits until `blocked` sessions are waiting behind it (directly, or behind one that is), and commits.
 */
async function whileLocked<T>(lock: (tx: PrismaClient) => Promise<void>, start: () => Promise<T>, blocked = 1): Promise<{ work: Promise<T> }> {
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
        const n = (
          await tx.$queryRaw<{ n: number }[]>`
            WITH RECURSIVE waiting(pid) AS (
              SELECT a.pid FROM pg_stat_activity a WHERE ${pid}::int = ANY(pg_blocking_pids(a.pid))
              UNION
              SELECT a.pid FROM pg_stat_activity a JOIN waiting w ON w.pid = ANY(pg_blocking_pids(a.pid))
            ) SELECT count(*)::int AS n FROM waiting`
        )[0]!.n;
        if (n >= blocked) break;
        await sleep(250);
      }
      await sleep(300);
    },
    { timeout: 150_000, maxWait: 10_000 },
  );
  if (!box.work) throw new Error("the work was never started");
  return { work: box.work };
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TAF Year ${STAMP}`, slug: `zz-taf-year-${STAMP}`, code: `ZTY${SUFFIX}`, contactEmail: mail("school"), timezone: "Asia/Kolkata", locale: "en", isTestFixture: true }, select: { id: true } })).id;
  for (const who of ["admin", "parent"]) ids[who] = (await db.user.create({ data: { name: `ZZ TAF Year ${who}`, email: mail(who) }, select: { id: true } })).id;
  ids.adminM = (await db.membership.create({ data: { userId: ids.admin!, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  ids.current = await year("2026–27", "2026-06-01", true);
}, 60_000);

afterAll(async () => {
  vi.restoreAllMocks();
  const people = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.notification.deleteMany({ where: { userId: { in: people.map((p) => p.id) } } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
  await db.guardianship.deleteMany({ where: { studentSchoolId: ids.school } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { id: { in: people.map((p) => p.id) } } });
  await db.$disconnect();
}, 60_000);

describe("TA-127: a payment whose dues were carried forward", { timeout: 60_000 }, () => {
  it("TA-127: after the carry-forward, the part payment cannot be reversed or refunded, and the opening balance stands as carried", async () => {
    const from = await year("2020–21", "2020-06-01");
    const to = await year("2021–22", "2021-06-01");
    const p = await pupil();
    const d = await demandIn(from, p, "2020-07-01");
    const pay = await recordCounterPayment(admin(), { studentMembershipId: p, amountPaise: 400_00, method: "CHEQUE", reference: `ZZCHQ${SUFFIX}` });
    expect(await carryForward(admin(), { fromYearId: from, toYearId: to })).toEqual({ pupils: 1, carriedPaise: 600_00 });
    await expect(reversePayment(admin(), pay.paymentId, "The cheque bounced")).rejects.toThrow("fees.refuseReverseCarried");
    await expect(requestRefund(admin(), { paymentId: pay.paymentId, amountPaise: 400_00, reason: "Paid back by hand" })).rejects.toThrow("fees.refuseReverseCarried");
    expect((await db.feePayment.findUniqueOrThrow({ where: { id: pay.paymentId }, select: { status: true } })).status).toBe("PAID");
    expect(await db.feeDemand.findUniqueOrThrow({ where: { id: d }, select: { status: true, paidPaise: true } })).toEqual({ status: "CARRIED", paidPaise: 400_00 });
  });
});

describe("TA-130 and TA-132: the carry-forward", { timeout: 200_000 }, () => {
  it("TA-130: two carry-forwards at once write one opening balance a pupil", async () => {
    const from = await year("2022–23", "2022-06-01");
    const to = await year("2023–24", "2023-06-01");
    const kids = [await pupil(), await pupil(), await pupil()];
    for (const k of kids) await demandIn(from, k, "2022-07-01");
    const results = await Promise.allSettled([carryForward(admin(), { fromYearId: from, toYearId: to }), carryForward(admin(), { fromYearId: from, toYearId: to })]);
    const answers = results.map((r) => (r.status === "fulfilled" ? r.value.pupils : -1)).sort();
    expect(answers).toEqual([0, 3]);
    for (const k of kids) expect(await openingBalances(to, k)).toBe(1);
  });

  it("TA-130: a demand paid while the carry-forward waits is left PAID and not carried", async () => {
    const from = await year("2018–19", "2018-06-01");
    const to = await year("2019–20", "2019-06-01");
    const payer = await pupil();
    const other = await pupil();
    const paid = await demandIn(from, payer, "2018-07-01");
    await demandIn(from, other, "2018-07-01");
    const carry = await whileLocked(
      async (tx) => {
        // The counter's payment, in flight: the pupil's open demand locked and paid in full, not yet committed.
        await tx.$queryRaw`SELECT "id" FROM "FeeDemand" WHERE "id" = ${paid} FOR UPDATE`;
        await tx.feeDemand.update({ where: { id: paid }, data: { paidPaise: 1_000_00, status: "PAID" } });
      },
      () => carryForward(admin(), { fromYearId: from, toYearId: to }),
    );
    expect(await carry.work).toEqual({ pupils: 1, carriedPaise: 1_000_00 });
    expect((await db.feeDemand.findUniqueOrThrow({ where: { id: paid }, select: { status: true } })).status).toBe("PAID");
    expect(await openingBalances(to, payer)).toBe(0);
    expect(await openingBalances(to, other)).toBe(1);
  });

  it("TA-132: the carry-forward and a class assignment ask for more than Prisma's five-second default", async () => {
    const spy = vi.spyOn(appDb, "$tenantTransaction");
    try {
      const from = await year("2016–17", "2016-06-01");
      const to = await year("2017–18", "2017-06-01");
      await demandIn(from, await pupil(), "2016-07-01");
      await carryForward(admin(), { fromYearId: from, toYearId: to });
      const head = await saveHead(admin(), { name: "ZZ Year Tuition", code: "YTU", kind: "TUITION" });
      const structure = await createStructure(admin(), { name: "ZZ Year Plan", gradeLevel: null, instalments: [{ label: "Term 1", dueDateKey: "2026-07-01", lines: [{ headId: head, amountPaise: 1_000_00 }] }] });
      await publishStructure(admin(), structure);
      await assignPlans(admin(), { structureId: structure, studentMembershipIds: [await pupil()] });
      const limits = spy.mock.calls.map((call) => (call[1] as { timeout?: number } | undefined)?.timeout ?? 5_000);
      expect(limits.filter((ms) => ms >= 60_000).length).toBeGreaterThanOrEqual(2);
    } finally {
      spy.mockRestore();
    }
  });
});

describe("TA-412 and TA-417: reminders are claimed before they are sent", { timeout: 200_000 }, () => {
  const toldAbout = (demandId: string) => db.notification.count({ where: { userId: ids.parent, kind: "FEES", meta: { contains: demandId } } });

  it("TA-412: two presses of 'Remind overdue' tell an overdue family once, and a third the same day tells nobody", async () => {
    const p = await pupil();
    const overdue = await demandIn(ids.current!, p, "2026-07-01");
    const presses = await whileLocked(
      async (tx) => void (await tx.$queryRaw`SELECT "id" FROM "FeeDemand" WHERE "id" = ${overdue} FOR UPDATE`),
      () => Promise.all([remindNow(admin(), { studentMembershipIds: [p] }), remindNow(admin(), { studentMembershipIds: [p] })]),
      2,
    );
    const answers = await presses.work;
    expect(answers.map((a) => a.families).sort()).toEqual([0, 1]);
    expect(await toldAbout(overdue)).toBe(1);
    expect(await remindNow(admin(), { studentMembershipIds: [p] })).toEqual({ families: 0, demands: 0 });
    expect(await toldAbout(overdue)).toBe(1);
  });

  it("TA-417: two runners of the daily reminder at once tell a family once about a demand's bucket", async () => {
    const p = await pupil();
    // Due a week before the far-off day the runs are dated: the D+7 bucket, this suite's demand alone.
    const due = await demandIn(ids.current!, p, "2999-06-01");
    const now = new Date("2999-06-08T03:00:00Z");
    const runs = await whileLocked(
      async (tx) => void (await tx.$queryRaw`SELECT "id" FROM "FeeDemand" WHERE "id" = ${due} FOR UPDATE`),
      () => Promise.all([sendFeeReminders(now), sendFeeReminders(now)]),
      2,
    );
    const answers = await runs.work;
    expect(answers.map((a) => a.perSchool[ids.school!]?.reminders ?? 0).sort()).toEqual([0, 1]);
    expect(await toldAbout(due)).toBe(1);
  });
});
