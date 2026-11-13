/**
 * Plans held per person: findings of the testing analysis of 13 November 2026, each held by a case that fails while
 * the defect stands.
 *
 *   TA-185  A feature added to a plan later (COMPETITIONS to STUDENT, QUESTION_BANK to TEACHER) was locked for the
 *           plan's holders until their window ended: the lock was per feature row, and no row was ever written.
 *   TA-415  A new window started where the holder's last one ended, read with no lock: two passes settled together
 *           (or a grant beside a pass) started at the same instant and the holder lost a month.
 *   TA-597  The operator's "ending within seven days" counted holders who had already renewed.
 *
 * As the database's owner (tests/setup.ts). The people and their entitlement rows are this suite's own (the stamp in
 * each address and order id) and are removed; the plan rows are read, never changed; which plans are active is the
 * suite's own (setActivePlansForTests), not the shared rows'.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { addMonths, grantPassFromOrder, grantPlan, listPersonPlans, planForCard, planLockFor, setActivePlansForTests } from "@/lib/person-plans";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
const DAY = 86_400_000;
const ids: Record<string, string> = {};
const operator = (): ActiveContext => ({ sessionId: "test", membershipId: null, schoolId: null, role: null, user: { id: ids.operator!, name: "ZZ operator", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: true, isAppAdmin: false } }) as unknown as ActiveContext;
type Client = Parameters<typeof grantPassFromOrder>[2];

beforeAll(async () => {
  for (const key of ["teacher", "pupil", "renewer", "operator"]) {
    ids[key] = (await db.user.create({ data: { name: `ZZ TA plans ${key} ${STAMP}`, email: `zz-taplans-${key}-${STAMP}@test.invalid`, ...(key === "operator" ? { isSuperuser: true } : {}) }, select: { id: true } })).id;
  }
});

afterAll(async () => {
  setActivePlansForTests([]);
  const users = Object.values(ids);
  await db.entitlement.deleteMany({ where: { userId: { in: users } } });
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await db.auditLog.deleteMany({ where: { OR: [{ actorUserId: { in: users } }, { targetId: { in: users } }] } }).catch(() => {});
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

describe("a plan's features", () => {
  it("TA-185: a holder of the plan gets a feature added to it later, while a feature row the operator revoked stays shut", async () => {
    setActivePlansForTests(["TEACHER"]);
    expect((await planForCard("TEACHER")).features).toContain("QUESTION_BANK");
    const now = Date.now();
    // A window written before the bank joined the plan: the four features it had then.
    for (const feature of ["ASSISTANT", "QUESTION_GIG", "TEACHER_SESSIONS", "JOB_BOARD"]) {
      await db.entitlement.create({ data: { userId: ids.teacher!, feature, source: "GRANT", planCode: "TEACHER", validFrom: new Date(now - DAY), validTo: new Date(now + 300 * DAY), ...(feature === "JOB_BOARD" ? { revokedAt: new Date(now - 1000) } : {}) } });
    }
    expect(await planLockFor("QUESTION_BANK", { userId: ids.teacher!, role: "TEACHER" })).toBeNull();
    expect(await planLockFor("ASSISTANT", { userId: ids.teacher!, role: "TEACHER" })).toBeNull();
    expect(await planLockFor("JOB_BOARD", { userId: ids.teacher!, role: "TEACHER" })).toBe("TEACHER");
    // Somebody holding no window of the plan is still asked for it.
    expect(await planLockFor("QUESTION_BANK", { userId: ids.pupil!, role: "TEACHER" })).toBe("TEACHER");
  });
});

describe("a new window starts where the last one ends", () => {
  /** A pass settled inside a transaction that stays open (its rows written, not committed) while `second` runs. */
  async function besideAnOpenPass<T>(userId: string, key: string, now: Date, second: () => Promise<T>) {
    let opened!: () => void;
    let release!: () => void;
    const isOpen = new Promise<void>((r) => (opened = r));
    const gate = new Promise<void>((r) => (release = r));
    const first = db.$transaction(
      async (tx) => {
        const w = await grantPassFromOrder({ id: `zz-ta415-${STAMP}-${key}`, userId, planCode: "STUDENT", period: "MONTH" }, now, tx as unknown as Client);
        opened();
        await gate;
        return w;
      },
      { timeout: 30_000 },
    );
    await isOpen;
    const running = second();
    await new Promise((r) => setTimeout(r, 600));
    release();
    return { first: await first, second: await running };
  }

  it("TA-415: two passes settled at the same moment for one holder run end to end, and so do a grant and a pass", async () => {
    const now = new Date();
    const passes = await besideAnOpenPass(ids.pupil!, "a", now, () => db.$transaction((tx) => grantPassFromOrder({ id: `zz-ta415-${STAMP}-b`, userId: ids.pupil!, planCode: "STUDENT", period: "MONTH" }, now, tx as unknown as Client), { timeout: 30_000 }));
    expect(passes.first.validFrom.getTime()).toBe(now.getTime());
    expect(passes.second.validFrom.getTime()).toBe(passes.first.validTo.getTime());

    const mixed = await besideAnOpenPass(ids.renewer!, "c", now, () => grantPlan(operator(), { email: `zz-taplans-renewer-${STAMP}@test.invalid`, plan: "STUDENT", months: 1 }, now));
    expect(mixed.first.validFrom.getTime()).toBe(now.getTime());
    expect(mixed.second.validFrom.getTime()).toBe(mixed.first.validTo.getTime());
  });
});

describe("the operator's count of plans ending soon", () => {
  it("TA-597: a holder who has already renewed is a holder now and is not ending within seven days", async () => {
    const now = new Date();
    const before = (await listPersonPlans(operator(), now)).find((p) => p.code === "EXPERT")!;
    const end = new Date(now.getTime() + 3 * DAY);
    const holder = ids.operator!;
    await db.entitlement.create({ data: { userId: holder, feature: "EXPERT_SESSIONS", source: "GRANT", planCode: "EXPERT", validFrom: new Date(now.getTime() - DAY), validTo: end } });
    await db.entitlement.create({ data: { userId: holder, feature: "EXPERT_SESSIONS", source: "GRANT", planCode: "EXPERT", validFrom: end, validTo: addMonths(end, 1) } });
    const after = (await listPersonPlans(operator(), now)).find((p) => p.code === "EXPERT")!;
    expect(after.entitledNow - before.entitledNow).toBe(1);
    expect(after.expiringSoon - before.expiringSoon).toBe(0);
  });
});
