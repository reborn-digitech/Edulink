/**
 * TA-182 (testing analysis of 13 November 2026, Medium, Concurrency): the
 * application steps other than Admit were read-then-write with no guard.
 *
 * Admit locks the application's row for its whole transaction (QA-04). A
 * family's Withdraw that read ACCEPTED before Admit committed waited on that
 * lock and then wrote WITHDRAWN over ADMITTED: a child on the roll whose
 * application says withdrawn, the grade's seat given again, and a later purge
 * deleting the form of an admitted child. The family's Accept and the office's
 * back-to-the-pool crossed the same way; and apply looked for the same child's
 * application before, and outside, the transaction that locks the cycle for
 * the serial, so two presses of a slow apply made two applications.
 *
 * Here the lock-holder is played by a transaction on the owner connection that
 * locks the row as Admit does, holds it while the family's step reads, and
 * then writes the state Admit (or the office) would, so the crossing happens
 * every run rather than one run in many. EXPECTED ONCE FIXED: the step that
 * read the old state is refused, and the state the lock-holder wrote stands.
 *
 * One ZZ school of this suite's own, removed afterwards with its people.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { apply, respond, withdraw } from "@/lib/admissions";
import { AccessError } from "@/lib/access-error";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const MAIL = (who: string) => `zz-tapia-races-${who}-${STAMP}@test.invalid`;
const ids = { school: "", year: "", cycle: "", admin: "", adminM: "", family: "" };
let serial = 0;

function ctx(userId: string, role: "PARENT" | "ADMIN", membershipId: string | null = null): ActiveContext {
  return {
    sessionId: "test-session",
    membershipId,
    schoolId: role === "PARENT" ? null : ids.school,
    role,
    user: { id: userId, name: "ZZ TAPIA Races", preferredName: null, email: MAIL("family"), avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", locale: "en", channels: { push: false, email: false }, quietHours: null } as never },
  };
}
const family = () => ctx(ids.family, "PARENT");

async function application(status: string, childName: string): Promise<string> {
  serial += 1;
  return (
    await db.application.create({
      data: { schoolId: ids.school, cycleId: ids.cycle, number: -serial, serial: `ZZT-${SUFFIX}-${serial}`, applicantUserId: ids.family, applicantName: "ZZ TAPIA Races Family", childName, childBirthdate: new Date("2016-02-02T00:00:00Z"), gradeApplied: "5", status, relation: "PARENT", ...(status === "OFFERED" ? { offeredAt: new Date() } : {}) },
      select: { id: true },
    })
  ).id;
}

/** Locks the application as Admit does, lets `step` read and queue behind the lock, then writes `to` and commits. */
async function crossing(applicationId: string, to: string, step: () => Promise<unknown>): Promise<{ stepRefusedWith: string | null; status: string }> {
  let locked!: () => void;
  const isLocked = new Promise<void>((resolve) => (locked = resolve));
  const holder = db.$transaction(
    async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "Application" WHERE "id" = ${applicationId} FOR UPDATE`;
      locked();
      await new Promise((r) => setTimeout(r, 1500));
      await tx.application.update({ where: { id: applicationId }, data: { status: to } });
    },
    { timeout: 30_000 },
  );
  await isLocked;
  const outcome = step().then(
    () => null,
    (error: unknown) => (error instanceof AccessError ? error.key : String(error)),
  );
  await holder;
  const stepRefusedWith = await outcome;
  const { status } = await db.application.findUniqueOrThrow({ where: { id: applicationId }, select: { status: true } });
  return { stepRefusedWith, status };
}

beforeAll(async () => {
  ids.school = (
    await db.school.create({
      data: { name: `ZZ TAPIA Races ${STAMP}`, slug: `zz-tapia-races-${STAMP}`, code: `ZPR${SUFFIX}`, contactEmail: MAIL("contact"), timezone: "Asia/Kolkata", locale: "en", verifiedAt: new Date(), profilePublishedAt: new Date(), isTestFixture: true },
      select: { id: true },
    })
  ).id;
  ids.admin = (await db.user.create({ data: { name: "ZZ TAPIA Races Admin", email: MAIL("admin"), prefs: "{}" }, select: { id: true } })).id;
  ids.adminM = (await db.membership.create({ data: { userId: ids.admin, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  ids.family = (await db.user.create({ data: { name: "ZZ TAPIA Races Family", email: MAIL("family"), prefs: "{}" }, select: { id: true } })).id;
  ids.year = (await db.academicYear.create({ data: { schoolId: ids.school, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
  ids.cycle = (await db.admissionCycle.create({ data: { schoolId: ids.school, academicYearId: ids.year, name: "ZZ TAPIA Races cycle", gradesJson: JSON.stringify([{ grade: "5", seats: 5 }]), testRequired: false, status: "OPEN" }, select: { id: true } })).id;
}, 60_000);

afterAll(async () => {
  const userIds = [ids.admin, ids.family].filter(Boolean);
  await db.rateLimit.deleteMany({ where: { bucket: `admissions-apply:${ids.family}` } });
  await db.notification.deleteMany({ where: { OR: [{ schoolId: ids.school }, { userId: { in: userIds } }] } });
  if (ids.school) {
    await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
    await db.school.deleteMany({ where: { id: ids.school } });
  }
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("TA-182: an application step that read the old state does not write over the new one", () => {
  it("TA-182: the family's Withdraw that read ACCEPTED while Admit held the row is refused, and the application stays ADMITTED", async () => {
    const id = await application("ACCEPTED", "ZZ TAPIA Withdraw Child");
    const out = await crossing(id, "ADMITTED", () => withdraw(family(), id));
    expect(out).toEqual({ stepRefusedWith: "admissions.refuseAdmitted", status: "ADMITTED" });
  });

  it("TA-182: the family's Accept that read OFFERED while the office took the offer back is refused, and the application stays in the pool", async () => {
    const id = await application("OFFERED", "ZZ TAPIA Accept Child");
    const out = await crossing(id, "SUBMITTED", () => respond(family(), id, { answer: "ACCEPT" }));
    expect(out).toEqual({ stepRefusedWith: "admissions.refuseNoOffer", status: "SUBMITTED" });
  });

  it("TA-182: two presses of a slow apply at once make one application with one serial", async () => {
    const input = { schoolId: ids.school, cycleId: ids.cycle, childName: "ZZ TAPIA Twice Child", childBirthdate: "2016-02-02", gradeApplied: "5" };
    const results = await Promise.allSettled([apply(family(), input), apply(family(), input)]);
    expect(results.map((r) => r.status)).toEqual(["fulfilled", "fulfilled"]);
    const made = await db.application.findMany({ where: { cycleId: ids.cycle, childName: "ZZ TAPIA Twice Child" }, select: { id: true } });
    expect(made).toHaveLength(1);
    const answered = results.map((r) => (r.status === "fulfilled" ? r.value.id : null));
    expect(answered).toEqual([made[0]!.id, made[0]!.id]);
  });

  it("TA-182: a Withdraw with nothing crossing it still withdraws, and twice is a no-op (unchanged)", async () => {
    const id = await application("SUBMITTED", "ZZ TAPIA Plain Withdraw");
    await withdraw(family(), id);
    await withdraw(family(), id);
    expect((await db.application.findUniqueOrThrow({ where: { id }, select: { status: true } })).status).toBe("WITHDRAWN");
  });
});
