/**
 * Moving the school up: findings TA-201 and TA-202 of the testing analysis of
 * 13 November 2026, held by cases that FAIL while the defect stands and pass
 * once it is fixed.
 *
 *   TA-201  Promotion set every graduate's stored grade to null inside its
 *           transaction (syncGradeLevel over the leavers, whose enrolment had
 *           just closed), and the leaving record written after it froze that
 *           null: every graduate's record, and a certificate's
 *           [[class.grade]], had no grade.
 *   TA-202  A whole-school promotion ran its grade sync inside the loop over
 *           classes, over everybody moved so far, two statements a pupil, so
 *           the statements grew with classes times pupils, in one
 *           transaction left at Prisma's five-second default.
 *
 * Each case counts what the promotion's own transaction issues by handing the
 * work a client that counts every statement, and reads the transaction's
 * options. One scratch ZZ school of this suite's own (its stamp in every name
 * and address), made through the owner connection and removed in afterAll.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { db as appDb } from "@/lib/db";
import { promoteSchool } from "@/lib/promotion";
import { classCode } from "@/lib/codes";

const db = new PrismaClient();
const STAMP = Date.now();
const MAIL = (who: string) => `zz-ta-rl-promo-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};
const CLASSES = 8;
const PER_CLASS = 5;

function admin(): ActiveContext {
  return {
    sessionId: "zz-ta-rl-promo",
    membershipId: ids.adminM!,
    schoolId: ids.school!,
    role: "ADMIN",
    user: {
      id: ids.admin!, name: "ZZ RL Promo Admin", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null },
    },
  };
}

async function classOf(name: string, gradeLevel: string, pupils: number): Promise<{ id: string; pupils: string[] }> {
  const klass = await db.class.create({ data: { schoolId: ids.school!, name, gradeLevel, section: "A", joinCode: classCode() }, select: { id: true } });
  const members: string[] = [];
  for (let i = 0; i < pupils; i++) {
    const who = `${name.replace(/\s+/g, "")}-${i}`;
    const user = await db.user.create({ data: { name: `ZZ RL ${name} pupil ${i}`, email: MAIL(who), prefs: "{}" }, select: { id: true } });
    const m = await db.membership.create({ data: { userId: user.id, schoolId: ids.school!, role: "STUDENT", status: "ACTIVE", gradeLevel, joinedAt: new Date(Date.now() - 400 * 86_400_000) }, select: { id: true } });
    await db.enrollment.create({ data: { classId: klass.id, schoolId: ids.school!, studentMembershipId: m.id, status: "ACTIVE" } });
    members.push(m.id);
  }
  return { id: klass.id, pupils: members };
}

/** The promotion's transaction, watched: every statement its work issues is counted, and its options kept. */
function watchTransactions() {
  const seen: { statements: number; opts?: { timeout?: number; maxWait?: number } }[] = [];
  const original = appDb.$tenantTransaction;
  const counting = (tx: unknown, run: { statements: number }) =>
    new Proxy(tx as object, {
      get(target, prop) {
        const value = (target as Record<string | symbol, unknown>)[prop];
        if (typeof prop === "string" && !prop.startsWith("$") && value && typeof value === "object") {
          return new Proxy(value as object, {
            get(delegate, method) {
              const fn = (delegate as Record<string | symbol, unknown>)[method];
              return typeof fn === "function" ? (...args: unknown[]) => { run.statements++; return (fn as (...a: unknown[]) => unknown).apply(delegate, args); } : fn;
            },
          });
        }
        if (typeof value === "function") return (...args: unknown[]) => { if (typeof prop === "string" && /^\$(query|execute)/.test(prop)) run.statements++; return (value as (...a: unknown[]) => unknown).apply(target, args); };
        return value;
      },
    });
  vi.spyOn(appDb, "$tenantTransaction").mockImplementation(((work: (tx: unknown) => Promise<unknown>, opts?: { timeout?: number; maxWait?: number }) => {
    const run = { statements: 0, opts };
    seen.push(run);
    return original.call(appDb, (tx: unknown) => work(counting(tx, run)), opts);
  }) as typeof original);
  return seen;
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TA-RL Promotion ${STAMP}`, slug: `zz-ta-rl-promo-${STAMP}`, code: `ZZRLP${STAMP}`, contactEmail: MAIL("office"), timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  ids.admin = (await db.user.create({ data: { name: "ZZ RL Promo Admin", email: MAIL("admin"), prefs: "{}" }, select: { id: true } })).id;
  ids.adminM = (await db.membership.create({ data: { userId: ids.admin, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
});

afterAll(async () => {
  const users = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  const userIds = users.map((u) => u.id);
  await db.notification.deleteMany({ where: { userId: { in: userIds } } });
  if (ids.school) {
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: ids.school }, { actorUserId: { in: userIds } }] } });
    await db.school.deleteMany({ where: { id: ids.school } });
  }
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-201: a graduate's leaving record keeps the grade of the class they left", () => {
  it("TA-201: after the top class LEAVEs, each graduate's record and stored grade read 10", async () => {
    const ten = await classOf("ZZ RL 10", "10", 2);
    const result = await promoteSchool(admin(), [{ fromClassId: ten.id, to: { kind: "LEAVE" }, holdBack: [] }]);
    expect(result).toMatchObject({ ok: true, left: 2 });
    const records = await db.schoolRecord.findMany({ where: { studentMembershipId: { in: ten.pupils } }, select: { gradeLevel: true, className: true } });
    expect(records).toEqual([{ gradeLevel: "10", className: "ZZ RL 10 A" }, { gradeLevel: "10", className: "ZZ RL 10 A" }]);
    // What a certificate issued afterwards reads for [[class.grade]] when the pupil has no live class (certificates.ts factsFor).
    const stored = await db.membership.findMany({ where: { id: { in: ten.pupils } }, select: { gradeLevel: true, leftAt: true } });
    expect(stored.map((m) => [m.gradeLevel, m.leftAt !== null])).toEqual([["10", true], ["10", true]]);
  });
});

describe("TA-202: a whole-school promotion issues statements in proportion to its pupils, under a limit sized for a school", () => {
  it("TA-202: eight classes of five, each to a new class: everybody moved, the grades right, few statements and a long enough limit", async () => {
    const made: { id: string; pupils: string[] }[] = [];
    for (let c = 1; c <= CLASSES; c++) made.push(await classOf(`ZZ RL G${c}`, String(c), PER_CLASS));
    const seen = watchTransactions();
    const started = Date.now();
    const result = await promoteSchool(admin(), made.map((k, i) => ({ fromClassId: k.id, to: { kind: "NEW" as const, name: `ZZ RL G${i + 2} next`, gradeLevel: String(i + 2) }, holdBack: [] })));
    const took = Date.now() - started;
    expect(result).toMatchObject({ ok: true, moved: CLASSES * PER_CLASS, created: CLASSES });
    const promotion = seen[0]!;
    const pupils = CLASSES * PER_CLASS;
    // Linear: a handful per class and at most two per pupil. The sync inside the loop alone was 2 × 5 × (1 + … + 8) = 360.
    expect(promotion.statements, `the promotion issued ${promotion.statements} statements in ${took} ms`).toBeLessThanOrEqual(2 * pupils + 10 * CLASSES);
    expect(promotion.opts?.timeout ?? 5_000).toBeGreaterThanOrEqual(30_000);
    // Each pupil carries the grade of the class they now sit in.
    const grades = await db.membership.findMany({ where: { id: { in: made.flatMap((k) => k.pupils) } }, select: { id: true, gradeLevel: true } });
    const expected = new Map(made.flatMap((k, i) => k.pupils.map((p) => [p, String(i + 2)] as const)));
    expect(grades.filter((g) => g.gradeLevel !== expected.get(g.id))).toEqual([]);
  });
});
