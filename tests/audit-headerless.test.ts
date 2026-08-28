import { afterAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

/**
 * The audit line written where no request exists — cron, scripts, the
 * simulation harness.
 *
 * ⚠ THE THROW IS SYNCHRONOUS, and that is the whole test. Outside a request
 * scope Next throws from the `headers()` CALL itself, before any promise
 * exists — so guarding it with `.catch()` on the returned promise guards
 * nothing, and the first fix for lost script-side audit rows shipped exactly
 * that. Under vitest the module resolves differently and `headers()` rejects
 * asynchronously instead, which is why audit.test.ts stayed green while every
 * tsx-run script still lost its rows. This file mocks next/headers to throw
 * the way the real runtime does, and asserts the row survives anyway.
 */
vi.mock("next/headers", () => ({
  headers: () => {
    throw new Error("`headers` was called outside a request scope.");
  },
}));

import { audit } from "@/lib/audit";

const db = new PrismaClient();
const ACTION = "test.audit.headerless";

afterAll(async () => {
  await db.auditLog.deleteMany({ where: { action: ACTION } });
  await db.$disconnect();
});

describe("audit() where headers() throws synchronously", () => {
  it("⚠ still writes the row, with a null ip", async () => {
    await db.auditLog.deleteMany({ where: { action: ACTION } });
    const school = await db.school.findFirstOrThrow();

    await audit({ action: ACTION, schoolId: school.id, meta: { from: "script" } });

    const row = await db.auditLog.findFirst({ where: { action: ACTION } });
    expect(row).not.toBeNull();
    expect(row?.ip).toBeNull();
    expect(row?.schoolId).toBe(school.id);
  });
});
