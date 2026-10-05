/**
 * THE BARE CLIENT INSIDE A TENANT TRANSACTION THROWS (R-49, the risks batch
 * of 5 October 2026). A3-journeys-10: `raiseDemand` read the current
 * academic year through the app's `db` from inside `$tenantTransaction`. That
 * read did not join the transaction; it ran on another pooled connection
 * with no tenant set, so under row-level security it found no year, and the
 * revaluation fee was silently skipped. Every suite runs as the owner, which
 * bypasses RLS, so none saw it. Now any query through `db` while a tenant
 * transaction's work is running throws in development and test, naming the
 * model and operation, so the whole suite finds every such read.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { BareClientInTransactionError, db } from "@/lib/db";
import { forSchool } from "@/lib/tenant-context";

const owner = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";

/** The old raiseDemand's shape: the year read through `db` inside the transaction's work. */
async function oldShape(): Promise<string | null> {
  return forSchool(schoolId, () =>
    db.$tenantTransaction(async () => {
      const year = await db.academicYear.findFirst({ where: { schoolId, isCurrent: true }, select: { id: true } });
      return year?.id ?? null;
    }),
  );
}
/** The fixed shape: the same read on the transaction's own client. */
async function fixedShape(): Promise<string | null> {
  return forSchool(schoolId, () =>
    db.$tenantTransaction(async (raw) => {
      const tx = raw as typeof db;
      const year = await tx.academicYear.findFirst({ where: { schoolId, isCurrent: true }, select: { id: true } });
      return year?.id ?? null;
    }),
  );
}

beforeAll(async () => {
  schoolId = (await owner.school.create({ data: { name: `ZZ Tx Guard ${STAMP}`, slug: `zz-txguard-${STAMP}`, code: `ZTG${String(STAMP).slice(-6)}`, contactEmail: `zz-txguard-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  await owner.academicYear.create({ data: { schoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true } });
});

afterAll(async () => {
  delete process.env.TENANT_TX_GUARD;
  await owner.school.deleteMany({ where: { id: schoolId } });
  await owner.$disconnect();
});

describe("the bare client inside $tenantTransaction (R-49)", () => {
  it("throws in test, naming the model and the operation", async () => {
    const error = await oldShape().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BareClientInTransactionError);
    expect((error as Error).message).toContain("db.academicYear.findFirst");
  });

  it("the same read on the transaction's client works, and so does db outside one", async () => {
    expect(await fixedShape()).toEqual(expect.any(String));
    expect(await forSchool(schoolId, () => db.academicYear.count({ where: { schoolId } }))).toBe(1);
  });

  it("TENANT_TX_GUARD=0 turns the throw off (a development server that must limp on)", async () => {
    process.env.TENANT_TX_GUARD = "0";
    try {
      // As production runs it: outside the transaction (the owner here, so the row is found).
      await expect(oldShape()).resolves.toEqual(expect.any(String));
    } finally {
      delete process.env.TENANT_TX_GUARD;
    }
  });
});
