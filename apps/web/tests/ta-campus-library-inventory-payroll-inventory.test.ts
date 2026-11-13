/**
 * TA-581 (testing analysis of 13 November 2026, batch campus-library-inventory-payroll, Low): the stock movements
 * list took month 2026-13 or 2026-00, rolled it into January of the next year or December of the one before with
 * Date.UTC, and answered that month's movements under the impossible label. Now the door's query schema, the library
 * and the page take a real month only (01 to 12).
 *
 * One scratch ZZ school of this suite's own with INVENTORY on, one item and three movements (December 2025, October
 * 2026 and January 2027); removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { GET as movementsGet } from "@/app/api/v1/admin/inventory/movements/route";
import { listMovements } from "@/lib/inventory";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const ids = { school: "", admin: "", adminM: "", item: "" };

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TA Inventory ${STAMP}`, slug: `zz-ta-inventory-${STAMP}`, code: `ZTI${SUFFIX}`, contactEmail: `zz-ta-inventory-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  await db.schoolModule.create({ data: { schoolId: ids.school, module: "INVENTORY" } });
  ids.admin = (await db.user.create({ data: { name: "ZZ TA Inventory Admin", email: `zz-ta-inventory-admin-${STAMP}@test.invalid` }, select: { id: true } })).id;
  ids.adminM = (await db.membership.create({ data: { userId: ids.admin, schoolId: ids.school, role: "ADMIN", status: "ACTIVE" }, select: { id: true } })).id;
  ids.item = (await db.inventoryItem.create({ data: { schoolId: ids.school, code: `ZZTA${SUFFIX}`, name: "ZZ chalk", unit: "box" }, select: { id: true } })).id;
  await db.stockMovement.createMany({
    data: [
      { schoolId: ids.school, itemId: ids.item, kind: "ADJUST", delta: 1, location: "Store", at: new Date("2025-12-15T06:00:00Z"), reference: "zz-december" },
      { schoolId: ids.school, itemId: ids.item, kind: "ADJUST", delta: 1, location: "Store", at: new Date("2026-10-15T06:00:00Z"), reference: "zz-october" },
      { schoolId: ids.school, itemId: ids.item, kind: "ADJUST", delta: 1, location: "Store", at: new Date("2027-01-15T06:00:00Z"), reference: "zz-january" },
    ],
  });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { userId: ids.admin } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("TA-581: an impossible month on the stock movements list", () => {
  it("TA-581: the door answers 422 on month 2026-13 and 2026-00, and 2026-10 lists October's movement alone", async () => {
    __resetCookies();
    __setHeaders({});
    await createSession(ids.admin, { schoolId: ids.school, role: "ADMIN" });
    const at = (month: string) => movementsGet(new Request(`http://localhost/api/v1/admin/inventory/movements?month=${month}`));
    expect((await at("2026-13")).status).toBe(422);
    expect((await at("2026-00")).status).toBe(422);
    const ok = await at("2026-10");
    expect(ok.status).toBe(200);
    const body = (await ok.json()) as { month: string; movements: { reference: string | null }[] };
    expect(body.month).toBe("2026-10");
    expect(body.movements.map((m) => m.reference)).toEqual(["zz-october"]);
  });

  it("TA-581: the library itself takes no impossible month as one (the web page's path): it lists every movement unlabelled", async () => {
    const ctx = { sessionId: "test", membershipId: ids.adminM, schoolId: ids.school, role: "ADMIN", user: { id: ids.admin, name: "ZZ", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } } } as unknown as ActiveContext;
    for (const month of ["2026-13", "2026-00"]) {
      const r = await listMovements(ctx, { month });
      expect(r.month).toBeNull();
      expect(r.movements).toHaveLength(3);
    }
  });
});
