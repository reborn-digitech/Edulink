/**
 * Inventory and assets (the INVENTORY module, 3 October 2026).
 *
 * Two ZZ schools of this suite's own: Elm has INVENTORY on, Fir has it off.
 * What is proved: stock is never negative (a single issue past what is on
 * hand, and two issues of the last box at once); the stored stock is the sum
 * of its movements; a bill's lines bring stock in and its total is their
 * sum, with its scan spent from the uploader's ticket once and readable by
 * the office alone; an asset has one custodian at most and a disposed one
 * takes nothing more; depreciation worked out on read (straight line, WDV,
 * none, frozen at disposal); a stock-take's differences become adjustments;
 * a member of staff's ask is fulfilled as an issue to them; the head reads
 * and never writes; MODULE_OFF where it is off.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { depreciation, deltaFor, rateFor } from "@/lib/inventory-rules";
import { actOnAsset, askForItem, assetDetail, cancelMyRequest, createAsset, decideRequest, inventorySummary, listAssets, myInventory, recordMovement, recordPurchase, saveCategory, saveItem, stockTake, fixedAssetRegisterExport, inventoryReports } from "@/lib/inventory";
import { authorizeFileRead } from "@/lib/files";
import { RuleRefusal } from "@/lib/rule-refusal";
import { AccessError } from "@/lib/access-error";
import { GET as summaryGet } from "@/app/api/v1/admin/inventory/route";
import { POST as movementPost } from "@/app/api/v1/admin/inventory/movements/route";

const db = new PrismaClient();
const STAMP = Date.now();
const ids = { elm: "", fir: "", admin: "", principal: "", teacher: "", teacher2: "", firAdmin: "", mTeacher: "", mTeacher2: "", category: "" };

async function as(userId: string, role: string, schoolId: string, route: string | null = null) {
  __resetCookies();
  __setHeaders(route ? { "x-edulink-route": route } : {});
  await createSession(userId, { schoolId, role: role as never });
  return route ? (null as never) : (await getSession())!;
}
const post = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const stockOf = async (code: string, location: string) => {
  const item = await db.inventoryItem.findFirstOrThrow({ where: { schoolId: ids.elm, code } });
  return (await db.inventoryStock.findUnique({ where: { itemId_location: { itemId: item.id, location } } }))?.quantity ?? 0;
};

beforeAll(async () => {
  const mk = (tag: string) => db.school.create({ data: { name: `ZZ Stores ${tag} ${STAMP}`, slug: `zz-inv-${tag.toLowerCase()}-${STAMP}`, code: `ZIV${tag[0]}${String(STAMP).slice(-5)}`, contactEmail: `zz-inv-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } });
  ids.elm = (await mk("Elm")).id;
  ids.fir = (await mk("Fir")).id;
  await db.schoolModule.create({ data: { schoolId: ids.elm, module: "INVENTORY" } });
  const user = (who: string) => db.user.create({ data: { name: `ZZ Inv ${who}`, email: `zz-inv-${who.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
  const [a, p, t, t2, fa] = await Promise.all([user("Admin"), user("Principal"), user("Teacher"), user("TeacherTwo"), user("FirAdmin")]);
  Object.assign(ids, { admin: a.id, principal: p.id, teacher: t.id, teacher2: t2.id, firAdmin: fa.id });
  const mem = (userId: string, schoolId: string, role: string) => db.membership.create({ data: { userId, schoolId, role, status: "ACTIVE" }, select: { id: true } });
  await mem(a.id, ids.elm, "ADMIN");
  await mem(p.id, ids.elm, "PRINCIPAL");
  ids.mTeacher = (await mem(t.id, ids.elm, "TEACHER")).id;
  ids.mTeacher2 = (await mem(t2.id, ids.elm, "TEACHER")).id;
  await mem(fa.id, ids.fir, "ADMIN");
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.uploadTicket.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.school.deleteMany({ where: { id: { in: [ids.elm, ids.fir] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("depreciation, worked out on read", () => {
  it("straight line takes the same share each year, never more than the cost", () => {
    expect(depreciation({ costPaise: 10_000_000, purchaseDateKey: "2024-10-04", method: "STRAIGHT_LINE", rateBp: 1000, asOfKey: "2026-10-04" })).toMatchObject({ accumulatedPaise: Math.round(10_000_000 * 0.1 * (730 / 365)), bookValuePaise: 10_000_000 - Math.round(10_000_000 * 0.1 * 2) });
    expect(depreciation({ costPaise: 10_000_000, purchaseDateKey: "2010-01-01", method: "STRAIGHT_LINE", rateBp: 1000, asOfKey: "2026-10-04" }).bookValuePaise).toBe(0);
  });

  it("WDV takes the share of what is left; NONE keeps the cost; no purchase date has not begun", () => {
    const w = depreciation({ costPaise: 10_000_000, purchaseDateKey: "2024-10-04", method: "WDV", rateBp: 2000, asOfKey: "2026-10-04" });
    expect(w.bookValuePaise).toBe(Math.round(10_000_000 * Math.pow(0.8, 730 / 365)));
    expect(depreciation({ costPaise: 10_000_000, purchaseDateKey: "2024-10-04", method: "NONE", rateBp: 2000, asOfKey: "2026-10-04" }).bookValuePaise).toBe(10_000_000);
    expect(depreciation({ costPaise: 10_000_000, purchaseDateKey: null, method: "STRAIGHT_LINE", rateBp: 2000, asOfKey: "2026-10-04" }).accumulatedPaise).toBe(0);
  });

  it("stands still once disposed of, and takes the asset's rate, else the category's, else 10 %", () => {
    const sold = depreciation({ costPaise: 10_000_000, purchaseDateKey: "2024-10-04", method: "STRAIGHT_LINE", rateBp: 1000, asOfKey: "2030-01-01", disposedKey: "2025-10-04" });
    expect(sold.accumulatedPaise).toBe(1_000_000);
    expect(rateFor(1500, 2000)).toBe(1500);
    expect(rateFor(null, 2000)).toBe(2000);
    expect(rateFor(null, null)).toBe(1000);
    expect(deltaFor("ISSUE", 3)).toBe(-3);
    expect(deltaFor("ADJUST", -2)).toBe(-2);
  });
});

describe("the stores", () => {
  it("answers MODULE_OFF at a school that has it off", async () => {
    await as(ids.firAdmin, "ADMIN", ids.fir, "GET /api/v1/admin/inventory");
    const res = await summaryGet();
    expect(res.status).toBe(403);
    expect(((await res.json()) as { code: string }).code).toBe("MODULE_OFF");
  });

  it("brings a bill's items into stock, its total the sum of its lines, its scan spent once and read by the office alone", async () => {
    const ctx = await as(ids.admin, "ADMIN", ids.elm);
    ids.category = (await saveCategory(ctx, { name: "ZZ Stationery", depreciationRateBp: null })).id;
    await saveItem(ctx, { code: "ZZ-CHALK", name: "ZZ White chalk", categoryId: ids.category, unit: "box", reorderLevel: 3, kind: "CONSUMABLE" });
    await saveItem(ctx, { code: "ZZ-REG", name: "ZZ Register", categoryId: null, unit: "piece", reorderLevel: 0, kind: "CONSUMABLE" });
    const fileId = `${crypto.randomUUID()}.pdf`;
    await db.uploadTicket.create({ data: { fileId, userId: ids.admin, mime: "application/pdf", size: 1000 } });
    const bill = await recordPurchase(ctx, { vendorId: null, vendorName: "ZZ Stationers", dateKey: "2026-09-30", invoiceRef: "ZZ/INV/1", location: "Store", lines: [{ itemCode: "ZZ-CHALK", description: "", quantity: 4, unitPaise: 12_000 }, { itemCode: null, description: "ZZ Delivery", quantity: 1, unitPaise: 5_000 }], billFileId: null, note: "" }, { ticket: fileId });
    expect(bill.totalPaise).toBe(4 * 12_000 + 5_000);
    expect(bill.lines[0]!.description).toBe("ZZ White chalk");
    expect(await stockOf("ZZ-CHALK", "Store")).toBe(4);
    // The same ticket cannot be named twice.
    await expect(recordPurchase(ctx, { vendorId: null, vendorName: "ZZ Stationers", dateKey: "2026-09-30", invoiceRef: "ZZ/INV/2", location: "Store", lines: [{ itemCode: null, description: "ZZ x", quantity: 1, unitPaise: 1 }], billFileId: fileId, note: "" }, { ticket: fileId })).rejects.toMatchObject({ key: "inventory.refuseBillTicket" });
    expect((await authorizeFileRead(fileId, ctx)).allowed).toBe(true);
    const teacher = await as(ids.teacher, "TEACHER", ids.elm);
    expect((await authorizeFileRead(fileId, teacher)).allowed).toBe(false);
  });

  it("never lets stock go below nothing: an issue past what is on hand is refused 409 and nothing moves", async () => {
    const ctx = await as(ids.admin, "ADMIN", ids.elm);
    await expect(recordMovement(ctx, { itemCode: "ZZ-CHALK", kind: "ISSUE", quantity: 5, location: "Store", toMembershipId: ids.mTeacher, toRoom: "", toDepartment: "", reference: "", note: "" })).rejects.toMatchObject({ key: "inventory.refuseNegativeStock", status: 409 });
    expect(await stockOf("ZZ-CHALK", "Store")).toBe(4);
    await as(ids.admin, "ADMIN", ids.elm, "POST /api/v1/admin/inventory/movements");
    const res = await movementPost(post("/api/v1/admin/inventory/movements", { itemCode: "ZZ-CHALK", kind: "WRITE_OFF", quantity: 99, location: "Store" }));
    expect(res.status).toBe(409);
    // An issue must say who or where.
    const res2 = await movementPost(post("/api/v1/admin/inventory/movements", { itemCode: "ZZ-CHALK", kind: "ISSUE", quantity: 1, location: "Store" }));
    expect(res2.status).toBe(422);
  });

  it("refuses the second of two issues of the last boxes at once", async () => {
    const ctx = await as(ids.admin, "ADMIN", ids.elm);
    const issue = () => recordMovement(ctx, { itemCode: "ZZ-CHALK", kind: "ISSUE", quantity: 3, location: "Store", toMembershipId: null, toRoom: "ZZ Room 4", toDepartment: "", reference: "", note: "" });
    const results = await Promise.allSettled([issue(), issue()]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const refused = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect(refused.reason).toBeInstanceOf(RuleRefusal);
    expect(await stockOf("ZZ-CHALK", "Store")).toBe(1);
  });

  it("keeps each place's stock the sum of its movements", async () => {
    const rows = await db.inventoryStock.findMany({ where: { schoolId: ids.elm } });
    for (const r of rows) {
      const sum = await db.stockMovement.aggregate({ where: { itemId: r.itemId, location: r.location }, _sum: { delta: true } });
      expect(r.quantity).toBe(sum._sum.delta ?? 0);
      expect(r.quantity).toBeGreaterThanOrEqual(0);
    }
  });

  it("turns a stock-take's differences into adjustments, all at once", async () => {
    const ctx = await as(ids.admin, "ADMIN", ids.elm);
    const result = await stockTake(ctx, { location: "Store", counts: [{ itemCode: "ZZ-CHALK", counted: 2 }, { itemCode: "ZZ-REG", counted: 0 }], note: "ZZ count" });
    expect(result.adjusted).toBe(1);
    expect(result.movements[0]).toMatchObject({ kind: "ADJUST", delta: 1, reference: "stock-take" });
    expect(await stockOf("ZZ-CHALK", "Store")).toBe(2);
    await expect(stockTake(ctx, { location: "Store", counts: [{ itemCode: "ZZ-NOPE", counted: 2 }], note: "" })).rejects.toMatchObject({ key: "inventory.refuseUnknownItem" });
  });

  it("fulfils a member of staff's ask as an issue to them, which their own page then shows", async () => {
    const me = await as(ids.teacher, "TEACHER", ids.elm);
    const ask = await askForItem(me, { itemCode: "ZZ-CHALK", itemText: "", quantity: 1, note: "ZZ for 5A" });
    const other = await askForItem(me, { itemCode: null, itemText: "ZZ A globe", quantity: 1, note: "" });
    await cancelMyRequest(me, other.id);
    const admin = await as(ids.admin, "ADMIN", ids.elm);
    const done = await decideRequest(admin, { requestId: ask.id, decision: "FULFIL", location: "Store", note: "" });
    expect(done.status).toBe("FULFILLED");
    await expect(decideRequest(admin, { requestId: ask.id, decision: "DECLINE", location: "", note: "" })).rejects.toMatchObject({ key: "inventory.refuseAnswered" });
    const mine = await myInventory(await as(ids.teacher, "TEACHER", ids.elm));
    expect(mine.issued).toEqual([{ itemCode: "ZZ-CHALK", itemName: "ZZ White chalk", unit: "box", quantity: 1 }]);
    expect(mine.requests.map((r) => r.status).sort()).toEqual(["CANCELLED", "FULFILLED"]);
    // Another teacher's page is their own.
    expect((await myInventory(await as(ids.teacher2, "TEACHER", ids.elm))).issued).toEqual([]);
  });
});

describe("the asset register", () => {
  it("keeps one custodian per asset, refuses a tag twice, and works out its worth", async () => {
    const ctx = await as(ids.admin, "ADMIN", ids.elm);
    await saveCategory(ctx, { id: ids.category, name: "ZZ Stationery", depreciationRateBp: 2000 });
    const a = await createAsset(ctx, { tagNumber: "ZZ-PRJ-1", name: "ZZ Projector", itemCode: null, categoryId: ids.category, purchaseDateKey: "2025-10-04", costPaise: 5_000_000, vendorId: null, warrantyUntilKey: null, location: "ZZ Room 4", custodianMembershipId: ids.mTeacher, method: "STRAIGHT_LINE", depreciationRateBp: null, condition: "GOOD", note: "" });
    expect(a.status).toBe("IN_USE");
    expect(a.rateBp).toBe(2000);
    expect(a.bookValuePaise).toBeLessThan(5_000_000);
    await expect(createAsset(ctx, { tagNumber: "ZZ-PRJ-1", name: "ZZ Another", itemCode: null, categoryId: null, purchaseDateKey: null, costPaise: 1, vendorId: null, warrantyUntilKey: null, location: "x", custodianMembershipId: null, method: "NONE", depreciationRateBp: null, condition: "GOOD", note: "" })).rejects.toMatchObject({ key: "inventory.refuseTagTaken" });
    const moved = await actOnAsset(ctx, "zz-prj-1", { action: "ASSIGN", custodianMembershipId: ids.mTeacher2, note: "" });
    expect(moved.custodianMembershipId).toBe(ids.mTeacher2);
    const held = await db.asset.count({ where: { schoolId: ids.elm, tagNumber: "ZZ-PRJ-1", custodianMembershipId: ids.mTeacher } });
    expect(held).toBe(0);
    expect((await myInventory(await as(ids.teacher2, "TEACHER", ids.elm))).assets.map((x) => x.tagNumber)).toEqual(["ZZ-PRJ-1"]);
  });

  it("goes for repair and back, is audited, and once disposed of takes nothing more", async () => {
    const ctx = await as(ids.admin, "ADMIN", ids.elm);
    await actOnAsset(ctx, "ZZ-PRJ-1", { action: "REPAIR", note: "ZZ lamp" });
    await expect(actOnAsset(ctx, "ZZ-PRJ-1", { action: "ASSIGN", custodianMembershipId: null, note: "" })).rejects.toMatchObject({ key: "inventory.refuseInRepair" });
    const back = await actOnAsset(ctx, "ZZ-PRJ-1", { action: "REPAIRED", condition: "FAIR", note: "" });
    expect(back.status).toBe("IN_USE");
    expect(back.condition).toBe("FAIR");
    await actOnAsset(ctx, "ZZ-PRJ-1", { action: "AUDIT", note: "" });
    const gone = await actOnAsset(ctx, "ZZ-PRJ-1", { action: "DISPOSE", note: "ZZ scrapped" });
    expect(gone.status).toBe("DISPOSED");
    expect(gone.custodianMembershipId).toBeNull();
    await expect(actOnAsset(ctx, "ZZ-PRJ-1", { action: "MOVE", location: "x", note: "" })).rejects.toMatchObject({ key: "inventory.refuseDisposed" });
    const detail = await assetDetail(ctx, "ZZ-PRJ-1");
    // Newest first; the two rows made in one transaction (CREATED and its first ASSIGNED) may share a millisecond, so the set is compared and the newest checked.
    expect(detail.events[0]!.kind).toBe("DISPOSED");
    expect(detail.events.map((e) => e.kind).sort()).toEqual(["ASSIGNED", "ASSIGNED", "AUDITED", "CREATED", "DISPOSED", "REPAIR", "REPAIRED"]);
    const register = await fixedAssetRegisterExport(ctx);
    expect(register.csv).toContain("ZZ-PRJ-1");
    expect(register.rows).toBe(1);
  });

  it("lets the head read the stores and the register, never write", async () => {
    const head = await as(ids.principal, "PRINCIPAL", ids.elm);
    const s = await inventorySummary(head);
    expect(s.canEdit).toBe(false);
    expect((await listAssets(head)).assets).toHaveLength(1);
    expect((await inventoryReports(head)).stockOnHand.length).toBeGreaterThan(0);
    await expect(saveItem(head, { code: "ZZ-X", name: "ZZ", categoryId: null, unit: "x", reorderLevel: 0, kind: "CONSUMABLE" })).rejects.toBeInstanceOf(AccessError);
    await expect(recordMovement(head, { itemCode: "ZZ-CHALK", kind: "RETURN", quantity: 1, location: "Store", toMembershipId: null, toRoom: "", toDepartment: "", reference: "", note: "" })).rejects.toBeInstanceOf(AccessError);
  });
});
