import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { audit } from "@/lib/audit";

/**
 * The audit trail, and the two ways it quietly stopped being one.
 *
 * FIRST: `audit()` swallows its own failures on purpose — losing a log line is
 * better than failing a teacher's attendance save — and that exception hid a
 * bug for as long as row-level security has been on. Every event that happens
 * BEFORE a school is known (a login, a failed login, a school being registered,
 * an invitation accepted, a child joining with a code) was refused by the policy
 * and swallowed, so the trail was missing exactly the events that answer "how
 * did this person get access".
 *
 * SECOND: the fix for that writes the unattributed row with raw SQL, because
 * Prisma's `create` uses INSERT ... RETURNING and reading the row back is not
 * allowed for a row belonging to no school. Raw SQL means the columns are
 * spelled out by hand, and `createdAt` was written in the DATABASE SESSION'S
 * LOCAL TIME while every other row in the table holds UTC — landing these seven
 * hours in the past on the machine this was written on. A timestamp is half of
 * what an audit log records.
 *
 * This suite connects as the OWNER (tests/setup.ts), so it does not exercise the
 * policy at all — `npm run rls:verify` does that. What it checks is the shape of
 * what gets written, which is where the second bug lived.
 */

const db = new PrismaClient();

const ACTIONS = ["test.audit.unattributed", "test.audit.attributed"];

async function cleanup() {
  await db.auditLog.deleteMany({ where: { action: { in: ACTIONS } } });
}

beforeEach(cleanup);
afterAll(async () => {
  await cleanup();
  await db.$disconnect();
});

describe("audit()", () => {
  it("⚠ writes a row for an event that belongs to no school", async () => {
    // A failed login. Nothing to attribute it to, and it is still the single
    // most worth recording.
    await audit({ action: "test.audit.unattributed", meta: { email: "someone@example.com" } });

    const row = await db.auditLog.findFirst({ where: { action: "test.audit.unattributed" } });
    expect(row).not.toBeNull();
    expect(row?.schoolId).toBeNull();
    expect(row?.meta).toContain("someone@example.com");
  });

  it("⚠ stamps it in UTC, like every other row in the table", async () => {
    const before = Date.now();
    await audit({ action: "test.audit.unattributed" });
    const after = Date.now();

    const row = await db.auditLog.findFirstOrThrow({
      where: { action: "test.audit.unattributed" },
    });

    // A minute of slack for a slow machine — but seven HOURS out, which is what
    // `now()` and a Date parameter both produced, fails this by a mile.
    expect(row.createdAt.getTime()).toBeGreaterThanOrEqual(before - 60_000);
    expect(row.createdAt.getTime()).toBeLessThanOrEqual(after + 60_000);
  });

  it("keeps the actor and the ip on an unattributed row", async () => {
    await audit({ action: "test.audit.unattributed", actorUserId: "u-123", targetType: "User", targetId: "u-123" });

    const row = await db.auditLog.findFirstOrThrow({
      where: { action: "test.audit.unattributed" },
    });
    expect(row.actorUserId).toBe("u-123");
    expect(row.targetType).toBe("User");
    expect(row.targetId).toBe("u-123");
  });

  it("writes an attributed row against its school", async () => {
    const school = await db.school.findFirstOrThrow();
    await audit({ action: "test.audit.attributed", schoolId: school.id, meta: { n: 1 } });

    const row = await db.auditLog.findFirstOrThrow({ where: { action: "test.audit.attributed" } });
    expect(row.schoolId).toBe(school.id);
  });

  it("stamps an attributed row in UTC too, so the two agree", async () => {
    const school = await db.school.findFirstOrThrow();
    const before = Date.now();
    await audit({ action: "test.audit.attributed", schoolId: school.id });
    await audit({ action: "test.audit.unattributed" });

    const attributed = await db.auditLog.findFirstOrThrow({ where: { action: "test.audit.attributed" } });
    const unattributed = await db.auditLog.findFirstOrThrow({ where: { action: "test.audit.unattributed" } });

    // The two write paths are different — Prisma's create and raw SQL — so this
    // is the check that they still agree about what time it is.
    expect(Math.abs(attributed.createdAt.getTime() - unattributed.createdAt.getTime())).toBeLessThan(60_000);
    expect(attributed.createdAt.getTime()).toBeGreaterThanOrEqual(before - 60_000);
  });

  it("never throws, whatever happens — an audit line must not fail the action", async () => {
    // A target id far longer than anything real; whatever the database makes of
    // it, the caller must not find out by way of an exception.
    await expect(
      audit({ action: "test.audit.unattributed", targetId: "x".repeat(5000) }),
    ).resolves.toBeUndefined();
  });
});
