/**
 * Scholarship claims on the ledger: findings TA-080, TA-542 and TA-436 of the testing analysis of 13 November 2026,
 * held by cases that FAIL while the defect stands and pass once it is fixed.
 *
 *   TA-080  A disbursement larger than what the student still owed could not be recorded: the whole of it went in
 *           as one counter payment, which the ledger refuses past what is open.
 *   TA-542  A disbursement and a rejection sent at once both passed; the claim ended in the last write's status.
 *   TA-436  The student's lapse or rejection notice was sent urgent, which breaks their quiet hours.
 *
 * One scratch ZZ college of this suite's own (its stamp in every name and address), made through the owner
 * connection and removed in afterAll.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient, type Prisma } from "@prisma/client";

const pushes = vi.hoisted(() => ({ to: [] as string[] }));
vi.mock("@/lib/expo-push", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/expo-push")>();
  return { ...real, sendExpoPush: async (userId: string) => void pushes.to.push(userId) };
});

const { updateClaim } = await import("@/lib/scholarships");
type Ctx = import("@/lib/session").ActiveContext;

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-ta-com-sch-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};

function accounts(): Ctx {
  return {
    sessionId: "zz-ta-com-sch",
    membershipId: ids.accountsM!,
    schoolId: ids.college!,
    role: "ACCOUNTS",
    user: {
      id: ids.accounts!, name: "ZZ COM SCH accounts", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}

type Settled<T> = { ok: true; v: T } | { ok: false; e: unknown };
async function whileHeld<T>(lock: (tx: Prisma.TransactionClient) => Promise<unknown>, calls: () => Promise<T>[], ms = 1500): Promise<Settled<T>[]> {
  let release!: () => void;
  const gate = new Promise<void>((r) => (release = r));
  let ready!: () => void;
  const isReady = new Promise<void>((r) => (ready = r));
  const holder = db.$transaction(
    async (tx) => {
      await lock(tx);
      ready();
      await gate;
    },
    { timeout: 60_000, maxWait: 10_000 },
  );
  await isReady;
  const runs = calls().map((p) => p.then((v): Settled<T> => ({ ok: true, v }), (e: unknown): Settled<T> => ({ ok: false, e })));
  await new Promise((r) => setTimeout(r, ms));
  release();
  await holder;
  return Promise.all(runs);
}

async function student(who: string, prefs: object = {}): Promise<void> {
  ids[who] = (await db.user.create({ data: { name: `ZZ COM SCH ${who}`, email: MAIL(who), prefs: JSON.stringify(prefs), isMinor: false, birthdate: new Date("2005-01-01T00:00:00Z") }, select: { id: true } })).id;
  ids[`${who}M`] = (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.college!, role: "STUDENT", status: "ACTIVE", studentCode: `ZZS${who.slice(0, 3)}${SUFFIX}` }, select: { id: true } })).id;
}

const term = (who: string, label: string, due: string, paid: boolean) =>
  db.feeDemand.create({ data: { schoolId: ids.college!, studentMembershipId: ids[`${who}M`]!, academicYearId: ids.year!, label, dueDate: new Date(`${due}T00:00:00Z`), grossPaise: 1_000_000, netPaise: 1_000_000, paidPaise: paid ? 1_000_000 : 0, status: paid ? "PAID" : "OPEN", linesJson: JSON.stringify([{ headId: ids.tui, code: "TUI", name: "ZZ Tuition", grossPaise: 1_000_000, concessionPaise: 0 }]) }, select: { id: true } });

const claim = (who: string, status: string, sanctioned: number | null) =>
  db.scholarshipClaim.create({ data: { schoolId: ids.college!, studentMembershipId: ids[`${who}M`]!, scheme: "GOI_POST_MATRIC_SC", academicYear: "2026-27", expectedPaise: 2_000_000, status, sanctionedPaise: sanctioned, sanctionedAt: sanctioned ? new Date() : null }, select: { id: true } });

beforeAll(async () => {
  ids.college = (await db.school.create({ data: { name: `ZZ TA-COM Scholarships ${STAMP}`, slug: `zz-ta-com-sch-${STAMP}`, code: `ZZCS${SUFFIX}`, contactEmail: MAIL("office"), timezone: "Asia/Kolkata", kind: "COLLEGE", isTestFixture: true }, select: { id: true } })).id;
  await db.schoolModule.create({ data: { schoolId: ids.college, module: "SCHOLARSHIPS" } });
  ids.accounts = (await db.user.create({ data: { name: "ZZ COM SCH accounts", email: MAIL("accounts"), prefs: "{}" }, select: { id: true } })).id;
  ids.accountsM = (await db.membership.create({ data: { userId: ids.accounts, schoolId: ids.college, role: "ACCOUNTS", status: "ACTIVE" }, select: { id: true } })).id;
  ids.year = (await db.academicYear.create({ data: { schoolId: ids.college, name: `ZZ 2026-27 ${STAMP}`, startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-05-31T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  ids.tui = (await db.feeHead.create({ data: { schoolId: ids.college, name: "ZZ Tuition", code: "TUI", kind: "TUITION" }, select: { id: true } })).id;
  await student("paidFirst");
  await student("racer");
  // Quiet hours all day, push on.
  await student("sleeper", { theme: "system", locale: "en", channels: { push: true, email: false }, quietHours: { start: "00:00", end: "23:59" } });
});

afterAll(async () => {
  if (ids.college) {
    await db.notification.deleteMany({ where: { schoolId: ids.college } });
    await db.auditLog.deleteMany({ where: { schoolId: ids.college } });
    await db.school.deleteMany({ where: { id: ids.college } });
  }
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-080: the state's whole credit is recorded", () => {
  it("TA-080: a disbursement above what is open is DISBURSED in full, the open term paid and the rest held for the student", async () => {
    await term("paidFirst", "ZZ Term 1", "2026-07-15", true);
    const second = await term("paidFirst", "ZZ Term 2", "2026-12-15", false);
    const c = await claim("paidFirst", "SANCTIONED", 2_000_000);
    const done = await updateClaim(accounts(), c.id, { action: "DISBURSE", amountPaise: 2_000_000, on: "2026-11-10", reference: "ZZSTATE001" });
    expect(done).toMatchObject({ status: "DISBURSED", disbursedPaise: 2_000_000 });
    expect((await db.feeDemand.findUniqueOrThrow({ where: { id: second.id }, select: { status: true } })).status).toBe("PAID");
    const payments = await db.feePayment.findMany({ where: { studentMembershipId: ids.paidFirstM }, orderBy: { amountPaise: "asc" }, select: { amountPaise: true, status: true, method: true } });
    expect(payments).toEqual([
      { amountPaise: 1_000_000, status: "PAID", method: "BANK" },
      { amountPaise: 1_000_000, status: "UNALLOCATED", method: "BANK" },
    ]);
    // Again: the same claim, nothing more.
    await updateClaim(accounts(), c.id, { action: "DISBURSE", amountPaise: 2_000_000, on: "2026-11-10", reference: "ZZSTATE001" });
    expect(await db.feePayment.count({ where: { studentMembershipId: ids.paidFirstM } })).toBe(2);
  });
});

describe("TA-542: one step wins a claim", () => {
  it("TA-542: a disbursement and a rejection at once: exactly one passes, and the claim and the ledger agree", async () => {
    await term("racer", "ZZ Term 1", "2026-07-15", false);
    const c = await claim("racer", "SANCTIONED", 1_000_000);
    const [disburse, reject] = await whileHeld(
      (tx) => tx.$queryRaw`SELECT "id" FROM "ScholarshipClaim" WHERE "id" = ${c.id} FOR UPDATE`,
      () => [updateClaim(accounts(), c.id, { action: "DISBURSE", amountPaise: 1_000_000, on: "2026-11-10", reference: "ZZSTATE002" }), updateClaim(accounts(), c.id, { action: "REJECT", reason: "ZZ documents" })],
      2500,
    );
    expect([disburse!.ok, reject!.ok].filter(Boolean)).toHaveLength(1);
    const row = await db.scholarshipClaim.findUniqueOrThrow({ where: { id: c.id }, select: { status: true } });
    const paid = await db.feePayment.count({ where: { studentMembershipId: ids.racerM, status: { in: ["PAID", "UNALLOCATED"] } } });
    const told = await db.notification.count({ where: { userId: ids.racer, schoolId: ids.college } });
    if (row.status === "DISBURSED") {
      expect(paid).toBe(1);
      expect(told).toBe(0);
    } else {
      expect(row.status).toBe("REJECTED");
      expect(paid).toBe(0);
    }
  });
});

describe("TA-436: a money notice keeps the student's quiet hours", () => {
  it("TA-436: a lapse writes the student's notice and sends no push during their quiet hours", async () => {
    const c = await claim("sleeper", "APPLIED", null);
    pushes.to = [];
    await updateClaim(accounts(), c.id, { action: "LAPSE", reason: "ZZ portal deadline missed" });
    expect(await db.notification.count({ where: { userId: ids.sleeper, schoolId: ids.college } })).toBe(1);
    expect(pushes.to).not.toContain(ids.sleeper);
  });
});
