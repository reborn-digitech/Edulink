import { z } from "zod";

/**
 * Inventory and assets (module INVENTORY, the owner's decision of 3 October
 * 2026): what the school keeps in its stores and hands out (chalk, registers,
 * cleaning stock), what it owns that lasts (a projector, a bench, a bus's
 * first-aid box), who holds each asset and where it stands, what the bills
 * were, and what the auditor reads as the fixed-asset register. A purchase
 * record is a bill the school PAID OUTSIDE THE APP — nothing here moves
 * money (decision 0003).
 */
const cuid = z.string().regex(/^c[a-z0-9]{20,}$/, "id");
const iso = z.string().datetime();
const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date");
const monthKey = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "month");
const count = z.number().int().min(0);
const paise = z.number().int().min(0).max(2_000_000_000);
const text = (max: number) => z.string().trim().max(max);

export const INVENTORY_ITEM_KINDS = ["CONSUMABLE", "ASSET"] as const;
export const inventoryItemKindSchema = z.enum(INVENTORY_ITEM_KINDS);
export type InventoryItemKind = z.infer<typeof inventoryItemKindSchema>;

/** PURCHASE comes in with a purchase record; the rest are the office's own entries. */
export const STOCK_MOVEMENT_KINDS = ["PURCHASE", "ISSUE", "RETURN", "ADJUST", "WRITE_OFF"] as const;
export const stockMovementKindSchema = z.enum(STOCK_MOVEMENT_KINDS);
export type StockMovementKind = z.infer<typeof stockMovementKindSchema>;

export const ASSET_STATUSES = ["IN_USE", "IN_STORE", "REPAIR", "DISPOSED"] as const;
export const assetStatusSchema = z.enum(ASSET_STATUSES);
export type AssetStatus = z.infer<typeof assetStatusSchema>;

export const ASSET_EVENT_KINDS = ["CREATED", "ASSIGNED", "MOVED", "REPAIR", "REPAIRED", "AUDITED", "DISPOSED"] as const;
export type AssetEventKind = (typeof ASSET_EVENT_KINDS)[number];

export const ASSET_CONDITIONS = ["GOOD", "FAIR", "POOR"] as const;
export const assetConditionSchema = z.enum(ASSET_CONDITIONS);
export type AssetCondition = z.infer<typeof assetConditionSchema>;

/**
 * How an asset loses value, worked out on every read (never stored):
 * STRAIGHT_LINE takes the same share of the cost each year until nothing is
 * left (the default); WDV takes the share of what is left (written-down
 * value, the Income-tax Act's way); NONE keeps the cost (land, a library's
 * rare books). The rate is the asset's own, else its category's, else
 * DEFAULT_DEPRECIATION_BP.
 */
export const DEPRECIATION_METHODS = ["STRAIGHT_LINE", "WDV", "NONE"] as const;
export const depreciationMethodSchema = z.enum(DEPRECIATION_METHODS);
export type DepreciationMethod = z.infer<typeof depreciationMethodSchema>;
export const DEFAULT_DEPRECIATION_BP = 1000;

export const INVENTORY_REQUEST_STATUSES = ["PENDING", "FULFILLED", "DECLINED", "CANCELLED"] as const;
export type InventoryRequestStatus = (typeof INVENTORY_REQUEST_STATUSES)[number];

/** An item's code: what a label, a stock-take sheet and the API name it by. */
export const itemCodeSchema = z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9-]{1,29}$/, "code");
/** An asset's tag number, painted or stuck on it. */
export const assetTagSchema = z.string().trim().toUpperCase().regex(/^[A-Z0-9][A-Z0-9/-]{1,29}$/, "tag");

/* ------------------------------------------------------------ setup */

export const inventoryCategorySchema = z.object({ id: z.string(), name: z.string(), depreciationRateBp: count.nullable(), items: count, assets: count });
export const vendorSchema = z.object({ id: z.string(), name: z.string(), phone: z.string().nullable(), gstin: z.string().nullable(), address: z.string().nullable() });
export type VendorView = z.infer<typeof vendorSchema>;
export const inventorySetupSchema = z.object({
  categories: z.array(inventoryCategorySchema),
  vendors: z.array(vendorSchema),
  /** Every place stock or an asset is kept, from the rows themselves. */
  locations: z.array(z.string()),
  /** Staff to issue to or name as an asset's custodian. */
  staff: z.array(z.object({ membershipId: z.string(), name: z.string(), role: z.string() })),
  canEdit: z.boolean(),
});
export type InventorySetup = z.infer<typeof inventorySetupSchema>;
/** POST /api/v1/admin/inventory/categories — with an id rewrites, without one makes. */
export const inventoryCategorySaveSchema = z.object({ id: cuid.optional(), name: text(60).min(1), depreciationRateBp: z.number().int().min(0).max(10_000).nullable().default(null) });
/** POST /api/v1/admin/inventory/vendors — with an id rewrites, without one makes. */
export const vendorSaveSchema = z.object({
  id: cuid.optional(),
  name: text(120).min(1),
  phone: text(20).default(""),
  gstin: z.string().trim().toUpperCase().regex(/^([0-9]{2}[A-Z0-9]{13})?$/, "gstin").default(""),
  address: text(300).default(""),
});

/* ------------------------------------------------------------ items */

export const inventoryItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  categoryId: z.string().nullable(),
  categoryName: z.string().nullable(),
  unit: z.string(),
  reorderLevel: count,
  kind: inventoryItemKindSchema,
  onHand: z.number().int(),
  stock: z.array(z.object({ location: z.string(), quantity: z.number().int() })),
  /** At or below the reorder level. */
  low: z.boolean(),
  archived: z.boolean(),
});
export type InventoryItemView = z.infer<typeof inventoryItemSchema>;
export const inventoryItemsSchema = z.object({ items: z.array(inventoryItemSchema), canEdit: z.boolean() });
/** POST /api/v1/admin/inventory/items — an item by its code: a new code makes it, a known one rewrites it. */
export const inventoryItemSaveSchema = z.object({
  code: itemCodeSchema,
  name: text(120).min(1),
  categoryId: cuid.nullable().default(null),
  unit: text(20).min(1),
  reorderLevel: z.number().int().min(0).max(1_000_000).default(0),
  kind: inventoryItemKindSchema.default("CONSUMABLE"),
  archived: z.boolean().optional(),
});
export type InventoryItemSave = z.infer<typeof inventoryItemSaveSchema>;

/* -------------------------------------------------------- movements */

export const stockMovementSchema = z.object({
  id: z.string(),
  itemCode: z.string(),
  itemName: z.string(),
  unit: z.string(),
  kind: stockMovementKindSchema,
  /** The change to the stock at `location`: a purchase or a return adds, an issue or a write-off takes. */
  delta: z.number().int(),
  location: z.string(),
  toName: z.string().nullable(),
  toRoom: z.string().nullable(),
  toDepartment: z.string().nullable(),
  reference: z.string().nullable(),
  note: z.string(),
  byName: z.string(),
  at: iso,
});
export type StockMovementView = z.infer<typeof stockMovementSchema>;
export const stockMovementsQuerySchema = z.object({ itemCode: z.string().max(30).optional(), month: monthKey.optional() });
export const stockMovementsSchema = z.object({ movements: z.array(stockMovementSchema), month: monthKey.nullable() });

/**
 * POST /api/v1/admin/inventory/movements — the office's entry. ISSUE and
 * WRITE_OFF take `quantity` from the stock at `location` and are refused
 * past what is there (stock is never negative); RETURN puts it back; ADJUST
 * is signed (a count that found more, or fewer). An issue names who or
 * where it went: a member of staff, a room or a department.
 */
export const stockMovementSaveSchema = z
  .object({
    itemCode: itemCodeSchema,
    kind: z.enum(["ISSUE", "RETURN", "ADJUST", "WRITE_OFF"]),
    quantity: z.number().int().min(-1_000_000).max(1_000_000).refine((n) => n !== 0, "quantity"),
    location: text(60).min(1),
    toMembershipId: cuid.nullable().default(null),
    toRoom: text(60).default(""),
    toDepartment: text(60).default(""),
    reference: text(60).default(""),
    note: text(300).default(""),
  })
  .refine((b) => b.kind === "ADJUST" || b.quantity > 0, { message: "quantity", path: ["quantity"] })
  .refine((b) => b.kind !== "ISSUE" || Boolean(b.toMembershipId || b.toRoom || b.toDepartment), { message: "issuedTo", path: ["toRoom"] });
export type StockMovementSave = z.infer<typeof stockMovementSaveSchema>;

/** POST /api/v1/admin/inventory/stock-take — what was counted at one place; each difference is an ADJUST, referenced "stock-take". */
export const stockTakeSaveSchema = z.object({
  location: text(60).min(1),
  counts: z.array(z.object({ itemCode: itemCodeSchema, counted: z.number().int().min(0).max(1_000_000) })).min(1).max(500),
  note: text(300).default(""),
});
export const stockTakeResultSchema = z.object({ location: z.string(), checked: count, adjusted: count, movements: z.array(stockMovementSchema) });

/* -------------------------------------------------------- purchases */

export const purchaseLineSchema = z.object({ itemCode: z.string().nullable(), description: z.string(), quantity: count, unitPaise: count, totalPaise: count });
export const purchaseRecordSchema = z.object({
  id: z.string(),
  vendorId: z.string().nullable(),
  vendorName: z.string(),
  dateKey,
  invoiceRef: z.string(),
  location: z.string(),
  lines: z.array(purchaseLineSchema),
  totalPaise: count,
  /** The scanned bill, read through /api/files/{fileId} by the office and the head. */
  billFileId: z.string().nullable(),
  note: z.string(),
  byName: z.string(),
  createdAt: iso,
});
export type PurchaseRecordView = z.infer<typeof purchaseRecordSchema>;
export const purchaseRecordsSchema = z.object({ purchases: z.array(purchaseRecordSchema), canEdit: z.boolean() });
/**
 * POST /api/v1/admin/inventory/purchases — a bill the school paid. A line
 * naming an item code brings its quantity into stock at `location` (a
 * PURCHASE movement); a line without one (a repair, a service) is the
 * bill's alone. `billFileId` is an upload ticket of the caller's.
 */
export const purchaseRecordSaveSchema = z.object({
  vendorId: cuid.nullable().default(null),
  vendorName: text(120).default(""),
  dateKey,
  invoiceRef: text(60).min(1),
  location: text(60).min(1),
  lines: z.array(z.object({ itemCode: itemCodeSchema.nullable().default(null), description: text(120).default(""), quantity: z.number().int().min(1).max(1_000_000), unitPaise: paise })).min(1).max(100),
  billFileId: z.string().max(80).nullable().default(null),
  note: text(300).default(""),
});
export type PurchaseRecordSave = z.infer<typeof purchaseRecordSaveSchema>;

/* ------------------------------------------------------------ assets */

export const assetEventSchema = z.object({ id: z.string(), kind: z.enum(ASSET_EVENT_KINDS), note: z.string(), byName: z.string(), at: iso });
export const assetSchema = z.object({
  id: z.string(),
  tagNumber: z.string(),
  name: z.string(),
  itemCode: z.string().nullable(),
  categoryId: z.string().nullable(),
  categoryName: z.string().nullable(),
  purchaseDateKey: dateKey.nullable(),
  costPaise: count,
  vendorName: z.string().nullable(),
  warrantyUntilKey: dateKey.nullable(),
  location: z.string(),
  custodianMembershipId: z.string().nullable(),
  custodianName: z.string().nullable(),
  status: assetStatusSchema,
  condition: assetConditionSchema,
  method: depreciationMethodSchema,
  rateBp: count,
  /** As of today, or the day it was disposed of. */
  accumulatedPaise: count,
  bookValuePaise: count,
  lastAuditedAt: iso.nullable(),
  disposedAt: iso.nullable(),
});
export type AssetView = z.infer<typeof assetSchema>;
export const assetsSchema = z.object({ assets: z.array(assetSchema), asOf: dateKey, costPaise: count, bookValuePaise: count, canEdit: z.boolean() });
export const assetDetailSchema = z.object({ asset: assetSchema, events: z.array(assetEventSchema), canEdit: z.boolean() });
export const assetsQuerySchema = z.object({ status: assetStatusSchema.optional(), location: z.string().max(60).optional() });

/** POST /api/v1/admin/inventory/assets — a new asset under a tag no other asset of the school carries. */
export const assetSaveSchema = z.object({
  tagNumber: assetTagSchema,
  name: text(120).min(1),
  itemCode: itemCodeSchema.nullable().default(null),
  categoryId: cuid.nullable().default(null),
  purchaseDateKey: dateKey.nullable().default(null),
  costPaise: paise,
  vendorId: cuid.nullable().default(null),
  warrantyUntilKey: dateKey.nullable().default(null),
  location: text(60).min(1),
  custodianMembershipId: cuid.nullable().default(null),
  method: depreciationMethodSchema.default("STRAIGHT_LINE"),
  depreciationRateBp: z.number().int().min(0).max(10_000).nullable().default(null),
  condition: assetConditionSchema.default("GOOD"),
  note: text(300).default(""),
});
export type AssetSave = z.infer<typeof assetSaveSchema>;

/**
 * POST /api/v1/admin/inventory/assets/{tag} — one thing happening to an
 * asset: ASSIGN (a custodian, or null to take it back into the store), MOVE
 * (a new location), REPAIR (sent away) and REPAIRED (back), AUDIT (seen in a
 * stock-take, with its condition), DISPOSE (final). A disposed asset takes
 * nothing more.
 */
export const assetActionSchema = z.object({
  action: z.enum(["ASSIGN", "MOVE", "REPAIR", "REPAIRED", "AUDIT", "DISPOSE"]),
  custodianMembershipId: cuid.nullable().optional(),
  location: text(60).optional(),
  condition: assetConditionSchema.optional(),
  note: text(300).default(""),
});
export type AssetAction = z.infer<typeof assetActionSchema>;

/* ---------------------------------------------------------- requests */

export const inventoryRequestSchema = z.object({
  id: z.string(),
  requesterMembershipId: z.string(),
  requesterName: z.string(),
  itemCode: z.string().nullable(),
  itemName: z.string(),
  quantity: count,
  note: z.string(),
  status: z.enum(INVENTORY_REQUEST_STATUSES),
  decisionNote: z.string().nullable(),
  decidedAt: iso.nullable(),
  createdAt: iso,
});
export type InventoryRequestView = z.infer<typeof inventoryRequestSchema>;
export const inventoryRequestsSchema = z.object({ requests: z.array(inventoryRequestSchema), canEdit: z.boolean() });
/** POST /api/v1/account/inventory/requests — a member of staff asks for something: an item the stores keep, or a sentence when it is not one. */
export const inventoryRequestAskSchema = z
  .object({ itemCode: itemCodeSchema.nullable().default(null), itemText: text(120).default(""), quantity: z.number().int().min(1).max(10_000), note: text(300).default("") })
  .refine((b) => Boolean(b.itemCode || b.itemText), { message: "item", path: ["itemText"] });
/** POST /api/v1/account/inventory/requests/cancel — take back one of my own waiting asks. */
export const inventoryRequestCancelSchema = z.object({ requestId: cuid });
/** POST /api/v1/admin/inventory/requests/decide — FULFIL issues it from `location` (an ISSUE to the asker when it names an item); DECLINE says why. */
export const inventoryRequestDecideSchema = z.object({ requestId: cuid, decision: z.enum(["FULFIL", "DECLINE"]), location: text(60).default(""), note: text(300).default("") });

/* ----------------------------------------------------- summary, reports */

export const inventorySummarySchema = z.object({
  counts: z.object({ items: count, lowStock: count, assets: count, inRepair: count, openRequests: count }),
  lowStock: z.array(inventoryItemSchema),
  assetsByStatus: z.record(assetStatusSchema, count),
  costPaise: count,
  bookValuePaise: count,
  recentMovements: z.array(stockMovementSchema),
  openRequests: z.array(inventoryRequestSchema),
  canEdit: z.boolean(),
});
export type InventorySummary = z.infer<typeof inventorySummarySchema>;

export const inventoryReportsSchema = z.object({
  asOf: dateKey,
  stockOnHand: z.array(z.object({ itemCode: z.string(), itemName: z.string(), unit: z.string(), location: z.string(), quantity: z.number().int() })),
  /** Issued and written off per month, the last twelve months. */
  consumption: z.array(z.object({ month: monthKey, itemCode: z.string(), itemName: z.string(), unit: z.string(), issued: count, writtenOff: count })),
  assetsByLocation: z.array(z.object({ location: z.string(), count, costPaise: count, bookValuePaise: count })),
  assetsByCustodian: z.array(z.object({ membershipId: z.string().nullable(), name: z.string().nullable(), count, bookValuePaise: count })),
});
export type InventoryReports = z.infer<typeof inventoryReportsSchema>;

/** GET /api/v1/admin/inventory/export/{kind} — the auditor's fixed-asset register, or the stock on hand, as CSV. Audited. */
export const inventoryExportSchema = z.object({ filename: z.string(), csv: z.string(), rows: count });

/* ------------------------------------------------------ the staff's own */

export const myInventorySchema = z.object({
  /** What has been issued to me and not returned, by item. */
  issued: z.array(z.object({ itemCode: z.string(), itemName: z.string(), unit: z.string(), quantity: z.number().int() })),
  /** The assets I am the custodian of. */
  assets: z.array(z.object({ tagNumber: z.string(), name: z.string(), location: z.string(), condition: assetConditionSchema })),
  requests: z.array(inventoryRequestSchema),
  /** What the stores keep, for the ask. */
  items: z.array(z.object({ code: z.string(), name: z.string(), unit: z.string() })),
});
export type MyInventory = z.infer<typeof myInventorySchema>;
