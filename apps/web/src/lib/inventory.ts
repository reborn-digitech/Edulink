import "server-only";
import {
  ASSET_STATUSES,
  type AssetAction,
  type AssetSave,
  type AssetStatus,
  type AssetView,
  type InventoryItemSave,
  type InventoryItemView,
  type InventoryReports,
  type InventoryRequestView,
  type InventorySetup,
  type InventorySummary,
  type MyInventory,
  type PurchaseRecordSave,
  type PurchaseRecordView,
  type StockMovementSave,
  type StockMovementView,
  type VendorView,
  type DepreciationMethod,
  type StockMovementKind,
} from "@edulink/contracts";
import { db } from "./db";
import { AccessError } from "./access-error";
import { assertModuleOn } from "./modules";
import { audit } from "./audit";
import { notify } from "./notify";
import { todayKey, dateKeyInZone } from "./dates";
import { toCsv } from "./csv";
import { FILE_HEADINGS, rowOf } from "./module-file-headings";
import { readJsonArray } from "./json";
import { SCHOOL_STAFF_ROLES } from "./staff-records";
import { RuleRefusal } from "./rule-refusal";
import { deltaFor, depreciation, rateFor } from "./inventory-rules";
import type { ActiveContext } from "./session";
import type { Role } from "./constants";

/**
 * Inventory and assets — the INVENTORY module (the owner's decision of
 * 3 October 2026), the ADMIN's to run; the head reads.
 *
 * STOCK. An item is kept at one or more places (the store, the science lab).
 * What is on hand at a place is InventoryStock.quantity, a stored copy of the
 * sum of the item's movements there, and it has ONE WRITER: `applyMovement`
 * below, which locks the row, refuses a change that would take it below
 * nothing, and writes the movement beside it in the same transaction.
 * data:audit recomputes every row from its movements.
 *
 * ASSETS. Each under a tag number unique in the school, with one custodian
 * at most (a column, so two is impossible), a place, a status and a
 * condition; every change is an AssetEvent. What it is worth is worked out on
 * every read (inventory-rules.ts), never stored.
 *
 * PURCHASES are bills the school paid outside the app (decision 0003): the
 * record and the scanned bill, and the stock the bill brought in.
 *
 * Every write is audited under the school with what changed, never a name.
 */

type Office = ActiveContext & { schoolId: string; membershipId: string; role: Role };
type Tx = typeof db;

/** The office: the admin writes, the head reads. The module must be on. */
/** The office, and at a college the accounts desk: who writes here. */
const keeps = (role: string | null) => role === "ADMIN" || role === "ACCOUNTS";

async function office(ctx: ActiveContext, write: boolean): Promise<Office> {
  // At a college the ACCOUNTS desk keeps this with the office (4 Oct 2026); the principal reads.
  const roles: Role[] = write ? ["ADMIN", "ACCOUNTS"] : ["ADMIN", "PRINCIPAL", "ACCOUNTS"];
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !roles.includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "INVENTORY");
  return ctx as Office;
}

/** Anyone who works at the school, for their own things and asks. */
async function staffMember(ctx: ActiveContext): Promise<Office> {
  if (!ctx.schoolId || !ctx.membershipId || !ctx.role || !(SCHOOL_STAFF_ROLES as readonly string[]).includes(ctx.role)) throw new AccessError("access.wrongRoleForThisAction");
  await assertModuleOn(ctx.schoolId, "INVENTORY");
  return ctx as Office;
}

async function zoneOf(schoolId: string): Promise<string> {
  const s = await db.school.findUnique({ where: { id: schoolId }, select: { timezone: true } });
  return s?.timezone ?? "Asia/Kolkata";
}

const nameOf = (u: { name: string; preferredName: string | null } | null | undefined) => (u ? (u.preferredName ?? u.name) : "");

/** The school's staff on the roll, by membership id. */
async function staffOf(schoolId: string): Promise<{ membershipId: string; name: string; role: string }[]> {
  const rows = await db.membership.findMany({
    where: { schoolId, role: { in: [...SCHOOL_STAFF_ROLES] }, status: "ACTIVE", leftAt: null },
    select: { id: true, role: true, user: { select: { name: true, preferredName: true } } },
    orderBy: { user: { name: "asc" } },
  });
  return rows.map((r) => ({ membershipId: r.id, name: nameOf(r.user), role: r.role }));
}

async function userNames(ids: (string | null | undefined)[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((x): x is string => Boolean(x)))];
  if (!unique.length) return new Map();
  const users = await db.user.findMany({ where: { id: { in: unique } }, select: { id: true, name: true, preferredName: true } });
  return new Map(users.map((u) => [u.id, nameOf(u)]));
}

async function membershipNames(ids: (string | null | undefined)[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids.filter((x): x is string => Boolean(x)))];
  if (!unique.length) return new Map();
  const rows = await db.membership.findMany({ where: { id: { in: unique } }, select: { id: true, user: { select: { name: true, preferredName: true } } } });
  return new Map(rows.map((r) => [r.id, nameOf(r.user)]));
}

/** A member of staff at THIS school, on the roll — the only people stock is issued to or an asset is held by. */
async function assertStaffHere(schoolId: string, membershipId: string): Promise<void> {
  const m = await db.membership.findFirst({ where: { id: membershipId, schoolId, role: { in: [...SCHOOL_STAFF_ROLES] }, status: "ACTIVE", leftAt: null }, select: { id: true } });
  if (!m) throw new RuleRefusal("inventory.refuseNotStaff", 422, undefined, "custodianMembershipId");
}

/* ------------------------------------------------------------------ setup */

export async function inventorySetup(ctx: ActiveContext): Promise<InventorySetup> {
  const caller = await office(ctx, false);
  const schoolId = caller.schoolId;
  const [categories, vendors, stockPlaces, assetPlaces, staff] = await Promise.all([
    db.inventoryCategory.findMany({ where: { schoolId }, orderBy: { name: "asc" }, select: { id: true, name: true, depreciationRateBp: true, _count: { select: { items: true, assets: true } } } }),
    db.vendor.findMany({ where: { schoolId }, orderBy: { name: "asc" }, select: { id: true, name: true, phone: true, gstin: true, address: true } }),
    db.inventoryStock.findMany({ where: { schoolId }, distinct: ["location"], select: { location: true } }),
    db.asset.findMany({ where: { schoolId }, distinct: ["location"], select: { location: true } }),
    staffOf(schoolId),
  ]);
  const locations = [...new Set([...stockPlaces, ...assetPlaces].map((r) => r.location))].sort((a, b) => a.localeCompare(b));
  return {
    categories: categories.map((c) => ({ id: c.id, name: c.name, depreciationRateBp: c.depreciationRateBp, items: c._count.items, assets: c._count.assets })),
    vendors,
    locations,
    staff,
    canEdit: keeps(caller.role),
  };
}

export async function saveCategory(ctx: ActiveContext, input: { id?: string; name: string; depreciationRateBp: number | null }): Promise<{ id: string }> {
  const caller = await office(ctx, true);
  const clash = await db.inventoryCategory.findFirst({ where: { schoolId: caller.schoolId, name: input.name, ...(input.id ? { id: { not: input.id } } : {}) }, select: { id: true } });
  if (clash) throw new RuleRefusal("inventory.refuseCategoryTaken", 409, undefined, "name");
  let id: string;
  if (input.id) {
    const found = await db.inventoryCategory.findFirst({ where: { id: input.id, schoolId: caller.schoolId }, select: { id: true } });
    if (!found) throw new AccessError("access.entryNotFound", "NOT_FOUND");
    id = (await db.inventoryCategory.update({ where: { id: found.id }, data: { name: input.name, depreciationRateBp: input.depreciationRateBp }, select: { id: true } })).id;
  } else {
    id = (await db.inventoryCategory.create({ data: { schoolId: caller.schoolId, name: input.name, depreciationRateBp: input.depreciationRateBp }, select: { id: true } })).id;
  }
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "inventory.category.save", targetType: "InventoryCategory", targetId: id, meta: { created: !input.id, rateBp: input.depreciationRateBp } });
  return { id };
}

export async function saveVendor(ctx: ActiveContext, input: { id?: string; name: string; phone: string; gstin: string; address: string }): Promise<VendorView> {
  const caller = await office(ctx, true);
  const clash = await db.vendor.findFirst({ where: { schoolId: caller.schoolId, name: input.name, ...(input.id ? { id: { not: input.id } } : {}) }, select: { id: true } });
  if (clash) throw new RuleRefusal("inventory.refuseVendorTaken", 409, undefined, "name");
  const data = { name: input.name, phone: input.phone || null, gstin: input.gstin || null, address: input.address || null };
  let row: VendorView;
  const select = { id: true, name: true, phone: true, gstin: true, address: true } as const;
  if (input.id) {
    const found = await db.vendor.findFirst({ where: { id: input.id, schoolId: caller.schoolId }, select: { id: true } });
    if (!found) throw new AccessError("access.entryNotFound", "NOT_FOUND");
    row = await db.vendor.update({ where: { id: found.id }, data, select });
  } else {
    row = await db.vendor.create({ data: { schoolId: caller.schoolId, ...data }, select });
  }
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "inventory.vendor.save", targetType: "Vendor", targetId: row.id, meta: { created: !input.id } });
  return row;
}

/* ------------------------------------------------------------------ items */

const ITEM_SELECT = { id: true, code: true, name: true, categoryId: true, unit: true, reorderLevel: true, kind: true, archivedAt: true, category: { select: { name: true } }, stock: { select: { location: true, quantity: true }, orderBy: { location: "asc" as const } } } as const;
type ItemRow = { id: string; code: string; name: string; categoryId: string | null; unit: string; reorderLevel: number; kind: string; archivedAt: Date | null; category: { name: string } | null; stock: { location: string; quantity: number }[] };

function itemView(r: ItemRow): InventoryItemView {
  const onHand = r.stock.reduce((a, s) => a + s.quantity, 0);
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    categoryId: r.categoryId,
    categoryName: r.category?.name ?? null,
    unit: r.unit,
    reorderLevel: r.reorderLevel,
    kind: r.kind as InventoryItemView["kind"],
    onHand,
    stock: r.stock.filter((s) => s.quantity !== 0),
    low: !r.archivedAt && r.kind === "CONSUMABLE" && onHand <= r.reorderLevel,
    archived: Boolean(r.archivedAt),
  };
}

export async function listItems(ctx: ActiveContext, opts: { archived?: boolean } = {}): Promise<{ items: InventoryItemView[]; canEdit: boolean }> {
  const caller = await office(ctx, false);
  const rows = await db.inventoryItem.findMany({ where: { schoolId: caller.schoolId, ...(opts.archived ? {} : { archivedAt: null }) }, orderBy: [{ name: "asc" }], select: ITEM_SELECT });
  return { items: rows.map(itemView), canEdit: keeps(caller.role) };
}

export async function saveItem(ctx: ActiveContext, input: InventoryItemSave): Promise<InventoryItemView> {
  const caller = await office(ctx, true);
  if (input.categoryId) {
    const cat = await db.inventoryCategory.findFirst({ where: { id: input.categoryId, schoolId: caller.schoolId }, select: { id: true } });
    if (!cat) throw new RuleRefusal("inventory.refuseUnknownCategory", 422, undefined, "categoryId");
  }
  const existing = await db.inventoryItem.findUnique({ where: { schoolId_code: { schoolId: caller.schoolId, code: input.code } }, select: { id: true, archivedAt: true } });
  const data = { name: input.name, categoryId: input.categoryId, unit: input.unit, reorderLevel: input.reorderLevel, kind: input.kind, ...(input.archived === undefined ? {} : { archivedAt: input.archived ? (existing?.archivedAt ?? new Date()) : null }) };
  const row = existing
    ? await db.inventoryItem.update({ where: { id: existing.id }, data, select: ITEM_SELECT })
    : await db.inventoryItem.create({ data: { schoolId: caller.schoolId, code: input.code, ...data }, select: ITEM_SELECT });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "inventory.item.save", targetType: "InventoryItem", targetId: row.id, meta: { code: input.code, created: !existing, archived: input.archived ?? null } });
  return itemView(row);
}

/* -------------------------------------------------------------- movements */

type MovementInput = {
  schoolId: string;
  itemId: string;
  kind: StockMovementKind;
  delta: number;
  location: string;
  toMembershipId?: string | null;
  toRoom?: string | null;
  toDepartment?: string | null;
  reference?: string | null;
  note?: string;
  purchaseRecordId?: string | null;
  requestId?: string | null;
  byUserId: string;
};

/**
 * THE ONE WRITER of InventoryStock. Inside the caller's tenant transaction:
 * make the row if the place is new, lock it, refuse a change that takes it
 * below nothing, move it, and write the movement. Two issues of the last box
 * at once: the second waits on the lock, reads nothing left, and is refused.
 */
async function applyMovement(tx: Tx, m: MovementInput): Promise<{ id: string; quantity: number }> {
  await tx.inventoryStock.upsert({ where: { itemId_location: { itemId: m.itemId, location: m.location } }, create: { schoolId: m.schoolId, itemId: m.itemId, location: m.location, quantity: 0 }, update: {}, select: { id: true } });
  const [row] = await tx.$queryRaw<{ quantity: number }[]>`SELECT "quantity" FROM "InventoryStock" WHERE "itemId" = ${m.itemId} AND "location" = ${m.location} FOR UPDATE`;
  const now = row?.quantity ?? 0;
  if (now + m.delta < 0) throw new RuleRefusal("inventory.refuseNegativeStock", 409, { onHand: now, location: m.location }, "quantity");
  await tx.inventoryStock.update({ where: { itemId_location: { itemId: m.itemId, location: m.location } }, data: { quantity: { increment: m.delta } }, select: { id: true } });
  const mv = await tx.stockMovement.create({
    data: {
      schoolId: m.schoolId,
      itemId: m.itemId,
      kind: m.kind,
      delta: m.delta,
      location: m.location,
      toMembershipId: m.toMembershipId ?? null,
      toRoom: m.toRoom || null,
      toDepartment: m.toDepartment || null,
      reference: m.reference || null,
      note: m.note ?? "",
      purchaseRecordId: m.purchaseRecordId ?? null,
      requestId: m.requestId ?? null,
      byUserId: m.byUserId,
    },
    select: { id: true },
  });
  return { id: mv.id, quantity: now + m.delta };
}

const MOVEMENT_SELECT = { id: true, kind: true, delta: true, location: true, toMembershipId: true, toRoom: true, toDepartment: true, reference: true, note: true, byUserId: true, at: true, item: { select: { code: true, name: true, unit: true } } } as const;
type MovementRow = { id: string; kind: string; delta: number; location: string; toMembershipId: string | null; toRoom: string | null; toDepartment: string | null; reference: string | null; note: string; byUserId: string | null; at: Date; item: { code: string; name: string; unit: string } };

async function movementViews(rows: MovementRow[]): Promise<StockMovementView[]> {
  const [members, users] = await Promise.all([membershipNames(rows.map((r) => r.toMembershipId)), userNames(rows.map((r) => r.byUserId))]);
  return rows.map((r) => ({
    id: r.id,
    itemCode: r.item.code,
    itemName: r.item.name,
    unit: r.item.unit,
    kind: r.kind as StockMovementKind,
    delta: r.delta,
    location: r.location,
    toName: r.toMembershipId ? (members.get(r.toMembershipId) ?? null) : null,
    toRoom: r.toRoom,
    toDepartment: r.toDepartment,
    reference: r.reference,
    note: r.note,
    byName: r.byUserId ? (users.get(r.byUserId) ?? "") : "",
    at: r.at.toISOString(),
  }));
}

async function itemByCode(schoolId: string, code: string, opts: { live?: boolean } = {}) {
  const item = await db.inventoryItem.findUnique({ where: { schoolId_code: { schoolId, code } }, select: { id: true, code: true, name: true, unit: true, kind: true, archivedAt: true } });
  if (!item || (opts.live && item.archivedAt)) throw new RuleRefusal("inventory.refuseUnknownItem", 422, { code }, "itemCode");
  return item;
}

/** The office's own entry: an issue, a return, an adjustment or a write-off. */
export async function recordMovement(ctx: ActiveContext, input: StockMovementSave): Promise<StockMovementView> {
  const caller = await office(ctx, true);
  const item = await itemByCode(caller.schoolId, input.itemCode, { live: input.kind === "ISSUE" });
  if (input.toMembershipId) await assertStaffHere(caller.schoolId, input.toMembershipId);
  const delta = deltaFor(input.kind, input.quantity);
  const result = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    return applyMovement(tx, {
      schoolId: caller.schoolId,
      itemId: item.id,
      kind: input.kind,
      delta,
      location: input.location,
      toMembershipId: input.kind === "ISSUE" || input.kind === "RETURN" ? input.toMembershipId : null,
      toRoom: input.toRoom,
      toDepartment: input.toDepartment,
      reference: input.reference,
      note: input.note,
      byUserId: caller.user.id,
    });
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "inventory.movement", targetType: "StockMovement", targetId: result.id, meta: { kind: input.kind, code: item.code, delta, location: input.location, toPerson: Boolean(input.toMembershipId) } });
  const row = await db.stockMovement.findUniqueOrThrow({ where: { id: result.id }, select: MOVEMENT_SELECT });
  return (await movementViews([row]))[0]!;
}

export async function listMovements(ctx: ActiveContext, opts: { itemCode?: string; month?: string } = {}): Promise<{ movements: StockMovementView[]; month: string | null }> {
  const caller = await office(ctx, false);
  const tz = await zoneOf(caller.schoolId);
  const month = opts.month && /^\d{4}-\d{2}$/.test(opts.month) ? opts.month : null;
  let range: { gte: Date; lt: Date } | undefined;
  if (month) {
    const [y, m] = month.split("-").map(Number) as [number, number];
    // A month in the school's zone: from its first day's midnight there to the next month's.
    const start = new Date(Date.UTC(y, m - 1, 1) - offsetMs(tz, new Date(Date.UTC(y, m - 1, 1))));
    const end = new Date(Date.UTC(y, m, 1) - offsetMs(tz, new Date(Date.UTC(y, m, 1))));
    range = { gte: start, lt: end };
  }
  const item = opts.itemCode ? await db.inventoryItem.findUnique({ where: { schoolId_code: { schoolId: caller.schoolId, code: opts.itemCode.toUpperCase() } }, select: { id: true } }) : null;
  if (opts.itemCode && !item) return { movements: [], month };
  const rows = await db.stockMovement.findMany({ where: { schoolId: caller.schoolId, ...(item ? { itemId: item.id } : {}), ...(range ? { at: range } : {}) }, orderBy: { at: "desc" }, take: 500, select: MOVEMENT_SELECT });
  return { movements: await movementViews(rows), month };
}

/** The zone's offset from UTC at an instant, in ms (Kolkata: +5:30). */
function offsetMs(timeZone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).formatToParts(at);
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  return Date.UTC(n("year"), n("month") - 1, n("day"), n("hour") % 24, n("minute"), n("second")) - at.getTime();
}

/**
 * A stock-take at one place: each count against what the rows say, and each
 * difference written as an ADJUST referenced "stock-take", in one
 * transaction so a half-entered sheet changes nothing.
 */
export async function stockTake(ctx: ActiveContext, input: { location: string; counts: { itemCode: string; counted: number }[]; note: string }): Promise<{ location: string; checked: number; adjusted: number; movements: StockMovementView[] }> {
  const caller = await office(ctx, true);
  const codes = [...new Set(input.counts.map((c) => c.itemCode))];
  if (codes.length !== input.counts.length) throw new RuleRefusal("inventory.refuseDuplicateCount", 422, undefined, "counts");
  const items = await db.inventoryItem.findMany({ where: { schoolId: caller.schoolId, code: { in: codes } }, select: { id: true, code: true } });
  const byCode = new Map(items.map((i) => [i.code, i.id]));
  const unknown = codes.find((c) => !byCode.has(c));
  if (unknown) throw new RuleRefusal("inventory.refuseUnknownItem", 422, { code: unknown }, "counts");
  const ids = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    const made: string[] = [];
    for (const c of input.counts) {
      const itemId = byCode.get(c.itemCode)!;
      const stock = await tx.inventoryStock.findUnique({ where: { itemId_location: { itemId, location: input.location } }, select: { quantity: true } });
      const diff = c.counted - (stock?.quantity ?? 0);
      if (diff === 0) continue;
      made.push((await applyMovement(tx, { schoolId: caller.schoolId, itemId, kind: "ADJUST", delta: diff, location: input.location, reference: "stock-take", note: input.note, byUserId: caller.user.id })).id);
    }
    return made;
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "inventory.stocktake", targetType: "School", targetId: caller.schoolId, meta: { location: input.location, checked: input.counts.length, adjusted: ids.length } });
  const rows = ids.length ? await db.stockMovement.findMany({ where: { id: { in: ids } }, orderBy: { at: "asc" }, select: MOVEMENT_SELECT }) : [];
  return { location: input.location, checked: input.counts.length, adjusted: ids.length, movements: await movementViews(rows) };
}

/* -------------------------------------------------------------- purchases */

type PurchaseLine = { itemCode: string | null; description: string; quantity: number; unitPaise: number; totalPaise: number };

/** What a bill adds up to: the sum of quantity × unit price, line by line — the stored total's one formula (data:audit "inventory-purchase"). */
export function purchaseTotal(lines: { quantity: number; unitPaise: number }[]): number {
  return lines.reduce((a, l) => a + l.quantity * l.unitPaise, 0);
}

async function purchaseViews(rows: { id: string; vendorId: string | null; vendorName: string; dateKey: string; invoiceRef: string; location: string; linesJson: string; totalPaise: number; billFileId: string | null; note: string; createdByUserId: string | null; createdAt: Date }[]): Promise<PurchaseRecordView[]> {
  const users = await userNames(rows.map((r) => r.createdByUserId));
  return rows.map((r) => ({
    id: r.id,
    vendorId: r.vendorId,
    vendorName: r.vendorName,
    dateKey: r.dateKey,
    invoiceRef: r.invoiceRef,
    location: r.location,
    lines: readJsonArray<PurchaseLine>(r.linesJson),
    totalPaise: r.totalPaise,
    billFileId: r.billFileId,
    note: r.note,
    byName: r.createdByUserId ? (users.get(r.createdByUserId) ?? "") : "",
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function listPurchases(ctx: ActiveContext): Promise<{ purchases: PurchaseRecordView[]; canEdit: boolean }> {
  const caller = await office(ctx, false);
  const rows = await db.purchaseRecord.findMany({ where: { schoolId: caller.schoolId }, orderBy: [{ dateKey: "desc" }, { createdAt: "desc" }], take: 300 });
  return { purchases: await purchaseViews(rows), canEdit: keeps(caller.role) };
}

/**
 * Records a bill. `bill` is how the scan arrived: from the phone an upload
 * TICKET of the caller's, spent here so its id cannot be named twice; from
 * the web page a file the page's own action has just stored. Lines naming an
 * item bring it into stock at the bill's place, in the same transaction.
 */
export async function recordPurchase(ctx: ActiveContext, input: PurchaseRecordSave, bill: { ticket?: string | null; storedFileId?: string | null } = {}): Promise<PurchaseRecordView> {
  const caller = await office(ctx, true);
  let vendorName = input.vendorName;
  if (input.vendorId) {
    const v = await db.vendor.findFirst({ where: { id: input.vendorId, schoolId: caller.schoolId }, select: { name: true } });
    if (!v) throw new RuleRefusal("inventory.refuseUnknownVendor", 422, undefined, "vendorId");
    vendorName = v.name;
  }
  if (!vendorName) throw new RuleRefusal("inventory.refuseNoVendor", 422, undefined, "vendorName");
  const codes = [...new Set(input.lines.map((l) => l.itemCode).filter((c): c is string => Boolean(c)))];
  const items = codes.length ? await db.inventoryItem.findMany({ where: { schoolId: caller.schoolId, code: { in: codes } }, select: { id: true, code: true, name: true } }) : [];
  const byCode = new Map(items.map((i) => [i.code, i]));
  const unknown = codes.find((c) => !byCode.has(c));
  if (unknown) throw new RuleRefusal("inventory.refuseUnknownItem", 422, { code: unknown }, "lines");
  const lines: PurchaseLine[] = input.lines.map((l) => ({ itemCode: l.itemCode, description: l.description || (l.itemCode ? byCode.get(l.itemCode)!.name : ""), quantity: l.quantity, unitPaise: l.unitPaise, totalPaise: l.quantity * l.unitPaise }));
  if (lines.some((l) => !l.description)) throw new RuleRefusal("inventory.refuseLineNoDescription", 422, undefined, "lines");
  const totalPaise = purchaseTotal(lines);
  if (totalPaise > 2_000_000_000) throw new RuleRefusal("inventory.refuseTooLarge", 422, undefined, "lines");
  let billFileId: string | null = bill.storedFileId ?? null;
  const ticketId = bill.ticket ?? input.billFileId;
  if (!billFileId && ticketId) {
    const spent = await db.uploadTicket.updateMany({ where: { fileId: ticketId, userId: caller.user.id, consumedAt: null }, data: { consumedAt: new Date() } });
    if (spent.count === 0) throw new RuleRefusal("inventory.refuseBillTicket", 422, undefined, "billFileId");
    billFileId = ticketId;
  }
  const id = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    const rec = await tx.purchaseRecord.create({
      data: { schoolId: caller.schoolId, vendorId: input.vendorId, vendorName, dateKey: input.dateKey, invoiceRef: input.invoiceRef, location: input.location, linesJson: JSON.stringify(lines), totalPaise, billFileId, note: input.note, createdByUserId: caller.user.id },
      select: { id: true },
    });
    for (const l of lines) {
      if (!l.itemCode) continue;
      await applyMovement(tx, { schoolId: caller.schoolId, itemId: byCode.get(l.itemCode)!.id, kind: "PURCHASE", delta: l.quantity, location: input.location, reference: input.invoiceRef, purchaseRecordId: rec.id, byUserId: caller.user.id });
    }
    return rec.id;
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "inventory.purchase", targetType: "PurchaseRecord", targetId: id, meta: { lines: lines.length, totalPaise, bill: Boolean(billFileId) } });
  const row = await db.purchaseRecord.findUniqueOrThrow({ where: { id } });
  return (await purchaseViews([row]))[0]!;
}

/* ----------------------------------------------------------------- assets */

const ASSET_SELECT = {
  id: true,
  tagNumber: true,
  name: true,
  categoryId: true,
  purchaseDate: true,
  costPaise: true,
  warrantyUntil: true,
  location: true,
  custodianMembershipId: true,
  status: true,
  condition: true,
  depreciationMethod: true,
  depreciationRateBp: true,
  lastAuditedAt: true,
  disposedAt: true,
  item: { select: { code: true } },
  category: { select: { name: true, depreciationRateBp: true } },
  vendor: { select: { name: true } },
  custodian: { select: { user: { select: { name: true, preferredName: true } } } },
} as const;
type AssetRow = {
  id: string;
  tagNumber: string;
  name: string;
  categoryId: string | null;
  purchaseDate: Date | null;
  costPaise: number;
  warrantyUntil: Date | null;
  location: string;
  custodianMembershipId: string | null;
  status: string;
  condition: string;
  depreciationMethod: string;
  depreciationRateBp: number | null;
  lastAuditedAt: Date | null;
  disposedAt: Date | null;
  item: { code: string } | null;
  category: { name: string; depreciationRateBp: number | null } | null;
  vendor: { name: string } | null;
  custodian: { user: { name: string; preferredName: string | null } } | null;
};
const dayOf = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

function assetView(r: AssetRow, asOf: string, tz: string): AssetView {
  const method = r.depreciationMethod as DepreciationMethod;
  const rateBp = method === "NONE" ? 0 : rateFor(r.depreciationRateBp, r.category?.depreciationRateBp);
  const dep = depreciation({ costPaise: r.costPaise, purchaseDateKey: dayOf(r.purchaseDate), method, rateBp, asOfKey: asOf, disposedKey: r.disposedAt ? dateKeyInZone(r.disposedAt, tz) : null });
  return {
    id: r.id,
    tagNumber: r.tagNumber,
    name: r.name,
    itemCode: r.item?.code ?? null,
    categoryId: r.categoryId,
    categoryName: r.category?.name ?? null,
    purchaseDateKey: dayOf(r.purchaseDate),
    costPaise: r.costPaise,
    vendorName: r.vendor?.name ?? null,
    warrantyUntilKey: dayOf(r.warrantyUntil),
    location: r.location,
    custodianMembershipId: r.custodianMembershipId,
    custodianName: r.custodian ? nameOf(r.custodian.user) : null,
    status: r.status as AssetStatus,
    condition: r.condition as AssetView["condition"],
    method,
    rateBp,
    accumulatedPaise: dep.accumulatedPaise,
    bookValuePaise: dep.bookValuePaise,
    lastAuditedAt: r.lastAuditedAt?.toISOString() ?? null,
    disposedAt: r.disposedAt?.toISOString() ?? null,
  };
}

export async function listAssets(ctx: ActiveContext, filter: { status?: AssetStatus; location?: string } = {}): Promise<{ assets: AssetView[]; asOf: string; costPaise: number; bookValuePaise: number; canEdit: boolean }> {
  const caller = await office(ctx, false);
  const tz = await zoneOf(caller.schoolId);
  const asOf = todayKey(tz);
  const rows = await db.asset.findMany({ where: { schoolId: caller.schoolId, ...(filter.status ? { status: filter.status } : {}), ...(filter.location ? { location: filter.location } : {}) }, orderBy: { tagNumber: "asc" }, take: 2000, select: ASSET_SELECT });
  const assets = rows.map((r) => assetView(r, asOf, tz));
  const live = assets.filter((a) => a.status !== "DISPOSED");
  return { assets, asOf, costPaise: live.reduce((a, x) => a + x.costPaise, 0), bookValuePaise: live.reduce((a, x) => a + x.bookValuePaise, 0), canEdit: keeps(caller.role) };
}

async function assetByTag(schoolId: string, tag: string): Promise<AssetRow> {
  const row = await db.asset.findUnique({ where: { schoolId_tagNumber: { schoolId, tagNumber: tag.trim().toUpperCase() } }, select: ASSET_SELECT });
  if (!row) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  return row;
}

export async function assetDetail(ctx: ActiveContext, tag: string): Promise<{ asset: AssetView; events: { id: string; kind: "CREATED" | "ASSIGNED" | "MOVED" | "REPAIR" | "REPAIRED" | "AUDITED" | "DISPOSED"; note: string; byName: string; at: string }[]; canEdit: boolean }> {
  const caller = await office(ctx, false);
  const tz = await zoneOf(caller.schoolId);
  const row = await assetByTag(caller.schoolId, tag);
  const events = await db.assetEvent.findMany({ where: { assetId: row.id }, orderBy: [{ at: "desc" }, { id: "desc" }], take: 200, select: { id: true, kind: true, note: true, byUserId: true, at: true } });
  const users = await userNames(events.map((e) => e.byUserId));
  return {
    asset: assetView(row, todayKey(tz), tz),
    events: events.map((e) => ({ id: e.id, kind: e.kind as "CREATED", note: e.note, byName: e.byUserId ? (users.get(e.byUserId) ?? "") : "", at: e.at.toISOString() })),
    canEdit: keeps(caller.role),
  };
}

const dateOf = (key: string | null) => (key ? new Date(`${key}T00:00:00Z`) : null);

export async function createAsset(ctx: ActiveContext, input: AssetSave): Promise<AssetView> {
  const caller = await office(ctx, true);
  const tz = await zoneOf(caller.schoolId);
  const taken = await db.asset.findUnique({ where: { schoolId_tagNumber: { schoolId: caller.schoolId, tagNumber: input.tagNumber } }, select: { id: true } });
  if (taken) throw new RuleRefusal("inventory.refuseTagTaken", 409, { tag: input.tagNumber }, "tagNumber");
  const item = input.itemCode ? await itemByCode(caller.schoolId, input.itemCode) : null;
  if (input.categoryId && !(await db.inventoryCategory.findFirst({ where: { id: input.categoryId, schoolId: caller.schoolId }, select: { id: true } }))) throw new RuleRefusal("inventory.refuseUnknownCategory", 422, undefined, "categoryId");
  if (input.vendorId && !(await db.vendor.findFirst({ where: { id: input.vendorId, schoolId: caller.schoolId }, select: { id: true } }))) throw new RuleRefusal("inventory.refuseUnknownVendor", 422, undefined, "vendorId");
  if (input.custodianMembershipId) await assertStaffHere(caller.schoolId, input.custodianMembershipId);
  if (input.purchaseDateKey && input.purchaseDateKey > todayKey(tz)) throw new RuleRefusal("inventory.refuseFutureDate", 422, undefined, "purchaseDateKey");
  const id = await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    const a = await tx.asset.create({
      data: {
        schoolId: caller.schoolId,
        itemId: item?.id ?? null,
        categoryId: input.categoryId,
        vendorId: input.vendorId,
        tagNumber: input.tagNumber,
        name: input.name,
        purchaseDate: dateOf(input.purchaseDateKey),
        costPaise: input.costPaise,
        warrantyUntil: dateOf(input.warrantyUntilKey),
        location: input.location,
        custodianMembershipId: input.custodianMembershipId,
        status: input.custodianMembershipId ? "IN_USE" : "IN_STORE",
        condition: input.condition,
        depreciationMethod: input.method,
        depreciationRateBp: input.depreciationRateBp,
      },
      select: { id: true },
    });
    await tx.assetEvent.create({ data: { schoolId: caller.schoolId, assetId: a.id, kind: "CREATED", note: input.note, byUserId: caller.user.id } });
    if (input.custodianMembershipId) await tx.assetEvent.create({ data: { schoolId: caller.schoolId, assetId: a.id, kind: "ASSIGNED", note: "", byUserId: caller.user.id } });
    return a.id;
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "inventory.asset.create", targetType: "Asset", targetId: id, meta: { tag: input.tagNumber, costPaise: input.costPaise, custodian: Boolean(input.custodianMembershipId) } });
  return assetView(await assetByTag(caller.schoolId, input.tagNumber), todayKey(tz), tz);
}

/**
 * One thing happening to an asset. The custodian is a single column, so
 * assigning another person replaces the first; a disposed asset is final and
 * refuses everything after.
 */
export async function actOnAsset(ctx: ActiveContext, tag: string, input: AssetAction): Promise<AssetView> {
  const caller = await office(ctx, true);
  const tz = await zoneOf(caller.schoolId);
  const row = await assetByTag(caller.schoolId, tag);
  if (row.status === "DISPOSED") throw new RuleRefusal("inventory.refuseDisposed", 409, { tag: row.tagNumber });
  const data: Record<string, unknown> = {};
  let kind: "ASSIGNED" | "MOVED" | "REPAIR" | "REPAIRED" | "AUDITED" | "DISPOSED";
  switch (input.action) {
    case "ASSIGN": {
      if (input.custodianMembershipId === undefined) throw new RuleRefusal("inventory.refuseNoCustodian", 422, undefined, "custodianMembershipId");
      if (input.custodianMembershipId) await assertStaffHere(caller.schoolId, input.custodianMembershipId);
      if (row.status === "REPAIR") throw new RuleRefusal("inventory.refuseInRepair", 409, { tag: row.tagNumber });
      data.custodianMembershipId = input.custodianMembershipId;
      data.status = input.custodianMembershipId ? "IN_USE" : "IN_STORE";
      if (input.location) data.location = input.location;
      kind = "ASSIGNED";
      break;
    }
    case "MOVE":
      if (!input.location) throw new RuleRefusal("inventory.refuseNoLocation", 422, undefined, "location");
      data.location = input.location;
      kind = "MOVED";
      break;
    case "REPAIR":
      if (row.status === "REPAIR") throw new RuleRefusal("inventory.refuseInRepair", 409, { tag: row.tagNumber });
      data.status = "REPAIR";
      kind = "REPAIR";
      break;
    case "REPAIRED":
      if (row.status !== "REPAIR") throw new RuleRefusal("inventory.refuseNotInRepair", 409, { tag: row.tagNumber });
      data.status = row.custodianMembershipId ? "IN_USE" : "IN_STORE";
      if (input.condition) data.condition = input.condition;
      kind = "REPAIRED";
      break;
    case "AUDIT":
      data.lastAuditedAt = new Date();
      if (input.condition) data.condition = input.condition;
      if (input.location) data.location = input.location;
      kind = "AUDITED";
      break;
    case "DISPOSE":
      data.status = "DISPOSED";
      data.disposedAt = new Date();
      data.custodianMembershipId = null;
      kind = "DISPOSED";
      break;
  }
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    // Guarded on the status read above, so two presses at once write one event.
    const moved = await tx.asset.updateMany({ where: { id: row.id, status: row.status, custodianMembershipId: row.custodianMembershipId }, data });
    if (moved.count === 0) throw new RuleRefusal("inventory.refuseChanged", 409, { tag: row.tagNumber });
    await tx.assetEvent.create({ data: { schoolId: caller.schoolId, assetId: row.id, kind, note: input.note, byUserId: caller.user.id } });
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: `inventory.asset.${input.action.toLowerCase()}`, targetType: "Asset", targetId: row.id, meta: { tag: row.tagNumber, location: input.location ?? null, custodian: input.custodianMembershipId === undefined ? undefined : Boolean(input.custodianMembershipId) } });
  return assetView(await assetByTag(caller.schoolId, row.tagNumber), todayKey(tz), tz);
}

/** The rows a tag sheet prints: every asset not disposed of, or those at one place. */
export async function tagSheetAssets(ctx: ActiveContext, filter: { location?: string } = {}): Promise<{ schoolName: string; assets: { tagNumber: string; name: string; location: string }[] }> {
  const caller = await office(ctx, true);
  const [school, assets] = await Promise.all([
    db.school.findUniqueOrThrow({ where: { id: caller.schoolId }, select: { name: true } }),
    db.asset.findMany({ where: { schoolId: caller.schoolId, status: { not: "DISPOSED" }, ...(filter.location ? { location: filter.location } : {}) }, orderBy: { tagNumber: "asc" }, take: 400, select: { tagNumber: true, name: true, location: true } }),
  ]);
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "inventory.tags.print", targetType: "School", targetId: caller.schoolId, meta: { count: assets.length, location: filter.location ?? null } });
  return { schoolName: school.name, assets };
}

/* --------------------------------------------------------------- requests */

const REQUEST_SELECT = { id: true, requesterMembershipId: true, itemText: true, quantity: true, note: true, status: true, decisionNote: true, decidedAt: true, createdAt: true, item: { select: { code: true, name: true } }, requester: { select: { user: { select: { name: true, preferredName: true } } } } } as const;
type RequestRow = { id: string; requesterMembershipId: string; itemText: string; quantity: number; note: string; status: string; decisionNote: string | null; decidedAt: Date | null; createdAt: Date; item: { code: string; name: string } | null; requester: { user: { name: string; preferredName: string | null } } };
const requestView = (r: RequestRow): InventoryRequestView => ({
  id: r.id,
  requesterMembershipId: r.requesterMembershipId,
  requesterName: nameOf(r.requester.user),
  itemCode: r.item?.code ?? null,
  itemName: r.item?.name ?? r.itemText,
  quantity: r.quantity,
  note: r.note,
  status: r.status as InventoryRequestView["status"],
  decisionNote: r.decisionNote,
  decidedAt: r.decidedAt?.toISOString() ?? null,
  createdAt: r.createdAt.toISOString(),
});

export async function listRequests(ctx: ActiveContext): Promise<{ requests: InventoryRequestView[]; canEdit: boolean }> {
  const caller = await office(ctx, false);
  const rows = await db.inventoryRequest.findMany({ where: { schoolId: caller.schoolId }, orderBy: [{ status: "desc" }, { createdAt: "desc" }], take: 300, select: REQUEST_SELECT });
  // Waiting ones first, then the rest newest first.
  const waiting = rows.filter((r) => r.status === "PENDING");
  return { requests: [...waiting, ...rows.filter((r) => r.status !== "PENDING")].map(requestView), canEdit: keeps(caller.role) };
}

export async function askForItem(ctx: ActiveContext, input: { itemCode: string | null; itemText: string; quantity: number; note: string }): Promise<InventoryRequestView> {
  const caller = await staffMember(ctx);
  const item = input.itemCode ? await itemByCode(caller.schoolId, input.itemCode, { live: true }) : null;
  const waiting = await db.inventoryRequest.count({ where: { requesterMembershipId: caller.membershipId, status: "PENDING" } });
  if (waiting >= 20) throw new RuleRefusal("inventory.refuseTooManyAsks", 409);
  const row = await db.inventoryRequest.create({ data: { schoolId: caller.schoolId, requesterMembershipId: caller.membershipId, itemId: item?.id ?? null, itemText: item ? "" : input.itemText, quantity: input.quantity, note: input.note }, select: REQUEST_SELECT });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "inventory.request.ask", targetType: "InventoryRequest", targetId: row.id, meta: { code: item?.code ?? null, quantity: input.quantity } });
  // The office hears of it; the admins only, whose desk it is.
  const admins = await db.membership.findMany({ where: { schoolId: caller.schoolId, role: "ADMIN", status: "ACTIVE", leftAt: null }, select: { userId: true } });
  for (const a of admins) {
    if (a.userId === caller.user.id) continue;
    await notify({ userId: a.userId, schoolId: caller.schoolId, kind: "SYSTEM", titleKey: "inventory.notifyAskTitle", bodyKey: "inventory.notifyAskBody", bodyVars: { name: nameOf(row.requester.user), item: row.item?.name ?? row.itemText, quantity: row.quantity }, url: "/admin/inventory/requests" }).catch(() => {});
  }
  return requestView(row);
}

/** The office answers an ask. FULFIL with an item issues it to the asker from `location`, in one transaction with the answer. */
export async function decideRequest(ctx: ActiveContext, input: { requestId: string; decision: "FULFIL" | "DECLINE"; location: string; note: string }): Promise<InventoryRequestView> {
  const caller = await office(ctx, true);
  const req = await db.inventoryRequest.findFirst({ where: { id: input.requestId, schoolId: caller.schoolId }, select: { id: true, status: true, itemId: true, quantity: true, requesterMembershipId: true, requester: { select: { userId: true } } } });
  if (!req) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  if (req.status !== "PENDING") throw new RuleRefusal("inventory.refuseAnswered", 409);
  if (input.decision === "FULFIL" && req.itemId && !input.location) throw new RuleRefusal("inventory.refuseNoLocation", 422, undefined, "location");
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as Tx;
    const claimed = await tx.inventoryRequest.updateMany({ where: { id: req.id, status: "PENDING" }, data: { status: input.decision === "FULFIL" ? "FULFILLED" : "DECLINED", decidedByUserId: caller.user.id, decidedAt: new Date(), decisionNote: input.note || null } });
    if (claimed.count === 0) throw new RuleRefusal("inventory.refuseAnswered", 409);
    if (input.decision === "FULFIL" && req.itemId) {
      await applyMovement(tx, { schoolId: caller.schoolId, itemId: req.itemId, kind: "ISSUE", delta: -req.quantity, location: input.location, toMembershipId: req.requesterMembershipId, reference: "request", note: input.note, requestId: req.id, byUserId: caller.user.id });
    }
  });
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: input.decision === "FULFIL" ? "inventory.request.fulfil" : "inventory.request.decline", targetType: "InventoryRequest", targetId: req.id, meta: { issued: Boolean(req.itemId && input.decision === "FULFIL") } });
  const row = await db.inventoryRequest.findUniqueOrThrow({ where: { id: req.id }, select: REQUEST_SELECT });
  await notify({ userId: req.requester.userId, schoolId: caller.schoolId, kind: "SYSTEM", titleKey: input.decision === "FULFIL" ? "inventory.notifyFulfilledTitle" : "inventory.notifyDeclinedTitle", bodyKey: "inventory.notifyAnsweredBody", bodyVars: { item: row.item?.name ?? row.itemText, quantity: row.quantity }, url: "/account/items" }).catch(() => {});
  return requestView(row);
}

/* ------------------------------------------------------- summary, reports */

export async function inventorySummary(ctx: ActiveContext): Promise<InventorySummary> {
  const caller = await office(ctx, false);
  const tz = await zoneOf(caller.schoolId);
  const asOf = todayKey(tz);
  const [items, assets, moves, requests] = await Promise.all([
    db.inventoryItem.findMany({ where: { schoolId: caller.schoolId, archivedAt: null }, select: ITEM_SELECT, orderBy: { name: "asc" } }),
    db.asset.findMany({ where: { schoolId: caller.schoolId }, select: ASSET_SELECT }),
    db.stockMovement.findMany({ where: { schoolId: caller.schoolId }, orderBy: { at: "desc" }, take: 10, select: MOVEMENT_SELECT }),
    db.inventoryRequest.findMany({ where: { schoolId: caller.schoolId, status: "PENDING" }, orderBy: { createdAt: "asc" }, take: 10, select: REQUEST_SELECT }),
  ]);
  const views = items.map(itemView);
  const low = views.filter((i) => i.low);
  const assetViews = assets.map((a) => assetView(a, asOf, tz));
  const live = assetViews.filter((a) => a.status !== "DISPOSED");
  const byStatus = Object.fromEntries(ASSET_STATUSES.map((s) => [s, assetViews.filter((a) => a.status === s).length])) as Record<AssetStatus, number>;
  const openCount = await db.inventoryRequest.count({ where: { schoolId: caller.schoolId, status: "PENDING" } });
  return {
    counts: { items: views.length, lowStock: low.length, assets: live.length, inRepair: byStatus.REPAIR, openRequests: openCount },
    lowStock: low.slice(0, 10),
    assetsByStatus: byStatus,
    costPaise: live.reduce((a, x) => a + x.costPaise, 0),
    bookValuePaise: live.reduce((a, x) => a + x.bookValuePaise, 0),
    recentMovements: await movementViews(moves),
    openRequests: requests.map(requestView),
    canEdit: keeps(caller.role),
  };
}

export async function inventoryReports(ctx: ActiveContext): Promise<InventoryReports> {
  const caller = await office(ctx, false);
  const tz = await zoneOf(caller.schoolId);
  const asOf = todayKey(tz);
  const since = new Date(Date.now() - 366 * 86_400_000);
  const [stock, issued, assets] = await Promise.all([
    db.inventoryStock.findMany({ where: { schoolId: caller.schoolId, quantity: { not: 0 } }, select: { location: true, quantity: true, item: { select: { code: true, name: true, unit: true } } } }),
    db.stockMovement.findMany({ where: { schoolId: caller.schoolId, kind: { in: ["ISSUE", "WRITE_OFF", "RETURN"] }, at: { gte: since } }, select: { kind: true, delta: true, at: true, item: { select: { code: true, name: true, unit: true } } } }),
    db.asset.findMany({ where: { schoolId: caller.schoolId, status: { not: "DISPOSED" } }, select: ASSET_SELECT }),
  ]);
  const consumption = new Map<string, { month: string; itemCode: string; itemName: string; unit: string; issued: number; writtenOff: number }>();
  for (const m of issued) {
    const month = dateKeyInZone(m.at, tz).slice(0, 7);
    const key = `${month}|${m.item.code}`;
    const row = consumption.get(key) ?? { month, itemCode: m.item.code, itemName: m.item.name, unit: m.item.unit, issued: 0, writtenOff: 0 };
    // A return gives back what was issued; the month's figure is what stayed out.
    if (m.kind === "ISSUE") row.issued += -m.delta;
    else if (m.kind === "RETURN") row.issued = Math.max(0, row.issued - m.delta);
    else row.writtenOff += -m.delta;
    consumption.set(key, row);
  }
  const views = assets.map((a) => assetView(a, asOf, tz));
  const byLocation = new Map<string, { location: string; count: number; costPaise: number; bookValuePaise: number }>();
  const byCustodian = new Map<string, { membershipId: string | null; name: string | null; count: number; bookValuePaise: number }>();
  for (const a of views) {
    const l = byLocation.get(a.location) ?? { location: a.location, count: 0, costPaise: 0, bookValuePaise: 0 };
    l.count += 1;
    l.costPaise += a.costPaise;
    l.bookValuePaise += a.bookValuePaise;
    byLocation.set(a.location, l);
    const k = a.custodianMembershipId ?? "";
    const c = byCustodian.get(k) ?? { membershipId: a.custodianMembershipId, name: a.custodianName, count: 0, bookValuePaise: 0 };
    c.count += 1;
    c.bookValuePaise += a.bookValuePaise;
    byCustodian.set(k, c);
  }
  return {
    asOf,
    stockOnHand: stock.map((s) => ({ itemCode: s.item.code, itemName: s.item.name, unit: s.item.unit, location: s.location, quantity: s.quantity })).sort((a, b) => a.itemName.localeCompare(b.itemName) || a.location.localeCompare(b.location)),
    consumption: [...consumption.values()].sort((a, b) => b.month.localeCompare(a.month) || a.itemName.localeCompare(b.itemName)),
    assetsByLocation: [...byLocation.values()].sort((a, b) => a.location.localeCompare(b.location)),
    assetsByCustodian: [...byCustodian.values()].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")),
  };
}

/* ---------------------------------------------------------------- exports */

/** The auditor's fixed-asset register: every asset with its cost, the depreciation to date and what it is worth, disposed ones included. Audited. */
export async function fixedAssetRegisterExport(ctx: ActiveContext): Promise<{ filename: string; csv: string; rows: number }> {
  const caller = await office(ctx, true);
  const { assets, asOf } = await listAssets(ctx);
  const rupees = (p: number) => (p / 100).toFixed(2);
  // The auditor's columns (module-file-headings.ts), the book value's dated to the day it is worked out to.
  const headers = FILE_HEADINGS.FIXED_ASSETS.map((h, n) => (n === FILE_HEADINGS.FIXED_ASSETS.length - 2 ? `${h} ${asOf} (INR)` : h));
  const rows = assets.map((a) => rowOf(headers, [a.tagNumber, a.name, a.categoryName ?? "", a.location, a.custodianName ?? "", a.status, a.condition, a.purchaseDateKey ?? "", a.vendorName ?? "", a.warrantyUntilKey ?? "", rupees(a.costPaise), a.method, (a.rateBp / 100).toFixed(2), rupees(a.accumulatedPaise), rupees(a.bookValuePaise), a.disposedAt ? a.disposedAt.slice(0, 10) : ""]));
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "inventory.export", targetType: "School", targetId: caller.schoolId, meta: { kind: "fixed-assets", rows: rows.length } });
  return { filename: `fixed-asset-register-${asOf}.csv`, csv: toCsv(rows, headers), rows: rows.length };
}

/** What is on hand, item by item and place by place. Audited. */
export async function stockExport(ctx: ActiveContext): Promise<{ filename: string; csv: string; rows: number }> {
  const caller = await office(ctx, true);
  const report = await inventoryReports(ctx);
  const rows = report.stockOnHand.map((s) => rowOf(FILE_HEADINGS.STOCK, [s.itemCode, s.itemName, s.unit, s.location, s.quantity]));
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "inventory.export", targetType: "School", targetId: caller.schoolId, meta: { kind: "stock", rows: rows.length } });
  return { filename: `stock-on-hand-${report.asOf}.csv`, csv: toCsv(rows, [...FILE_HEADINGS.STOCK]), rows: rows.length };
}

/* ---------------------------------------------------------- my own things */

/** What has been issued to me and not returned, the assets I hold, my asks, and what the stores keep for the next ask. */
export async function myInventory(ctx: ActiveContext): Promise<MyInventory> {
  const caller = await staffMember(ctx);
  const [moves, assets, requests, items] = await Promise.all([
    db.stockMovement.groupBy({ by: ["itemId"], where: { schoolId: caller.schoolId, toMembershipId: caller.membershipId, kind: { in: ["ISSUE", "RETURN"] } }, _sum: { delta: true } }),
    db.asset.findMany({ where: { schoolId: caller.schoolId, custodianMembershipId: caller.membershipId, status: { not: "DISPOSED" } }, orderBy: { tagNumber: "asc" }, select: { tagNumber: true, name: true, location: true, condition: true } }),
    db.inventoryRequest.findMany({ where: { requesterMembershipId: caller.membershipId }, orderBy: { createdAt: "desc" }, take: 50, select: REQUEST_SELECT }),
    db.inventoryItem.findMany({ where: { schoolId: caller.schoolId, archivedAt: null, kind: "CONSUMABLE" }, orderBy: { name: "asc" }, select: { code: true, name: true, unit: true } }),
  ]);
  const ids = moves.map((m) => m.itemId);
  const names = ids.length ? await db.inventoryItem.findMany({ where: { id: { in: ids } }, select: { id: true, code: true, name: true, unit: true } }) : [];
  const byId = new Map(names.map((n) => [n.id, n]));
  return {
    // An issue is negative at the store, so what I hold is minus the sum.
    issued: moves
      .map((m) => ({ item: byId.get(m.itemId), quantity: -(m._sum.delta ?? 0) }))
      .filter((m) => m.item && m.quantity > 0)
      .map((m) => ({ itemCode: m.item!.code, itemName: m.item!.name, unit: m.item!.unit, quantity: m.quantity }))
      .sort((a, b) => a.itemName.localeCompare(b.itemName)),
    assets: assets.map((a) => ({ tagNumber: a.tagNumber, name: a.name, location: a.location, condition: a.condition as MyInventory["assets"][number]["condition"] })),
    requests: requests.map(requestView),
    items,
  };
}

/** Takes back one of my own waiting asks. */
export async function cancelMyRequest(ctx: ActiveContext, requestId: string): Promise<void> {
  const caller = await staffMember(ctx);
  const done = await db.inventoryRequest.updateMany({ where: { id: requestId, requesterMembershipId: caller.membershipId, status: "PENDING" }, data: { status: "CANCELLED" } });
  if (done.count === 0) throw new AccessError("access.entryNotFound", "NOT_FOUND");
  await audit({ schoolId: caller.schoolId, actorUserId: caller.user.id, action: "inventory.request.cancel", targetType: "InventoryRequest", targetId: requestId });
}
