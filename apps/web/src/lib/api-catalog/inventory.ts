import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * inventory: the INVENTORY module (3 October 2026). The office runs the
 * stores and the asset register under /admin/inventory (the admin writes,
 * the head reads); every member of staff reads what was issued to them and
 * asks for more under /account/inventory. Every door names the module, so a
 * school that has it off answers MODULE_OFF before a handler runs.
 *
 * Samples come from fixed fixture names (zz-fixtures-modules.ts), since the
 * sweep's fixture type carries no inventory ids: the asset ZZ-A-0001.
 * Writes that make a row (a movement, a purchase, an asset) carry no valid
 * body — the sweep would make one on every run — and are proved by
 * tests/inventory.test.ts instead.
 */
export const ZZ_ASSET_TAG = "ZZ-A-0001";
const STAFF: c.RoleCode[] = ["TEACHER", "PRINCIPAL", "ADMIN", "DRIVER", "LIBRARIAN", "WARDEN"];
const M = { module: "INVENTORY" as const };

export const INVENTORY: Endpoint[] = [
  { ...M, method: "GET", path: "/api/v1/admin/inventory", summary: "Inventory at a glance: counts, what is running low, assets by status, the last movements and the asks waiting (the office and the head)", access: ["ADMIN", "PRINCIPAL"], response: c.inventorySummarySchema },
  { ...M, method: "GET", path: "/api/v1/admin/inventory/setup", summary: "Categories (with their depreciation rate), vendors, the places stock and assets are kept, and the staff to issue to", access: ["ADMIN", "PRINCIPAL"], response: c.inventorySetupSchema },
  { ...M, method: "POST", path: "/api/v1/admin/inventory/categories", summary: "Make or rename a category and set its yearly depreciation rate (basis points; null takes the default)", access: ["ADMIN"], request: c.inventoryCategorySaveSchema, response: c.inventorySetupSchema, emptyBodyStatus: 422 },
  { ...M, method: "POST", path: "/api/v1/admin/inventory/vendors", summary: "Make or rewrite a vendor (name, phone, GSTIN, address)", access: ["ADMIN"], request: c.vendorSaveSchema, response: c.vendorSchema, emptyBodyStatus: 422 },
  { ...M, method: "GET", path: "/api/v1/admin/inventory/items", summary: "Every item the stores keep with its stock at each place and whether it is at or below its reorder level", access: ["ADMIN", "PRINCIPAL"], response: c.inventoryItemsSchema },
  { ...M, method: "POST", path: "/api/v1/admin/inventory/items", summary: "An item by its code: a new code makes it, a known one rewrites it (archived: true takes it out of the lists)", access: ["ADMIN"], request: c.inventoryItemSaveSchema, response: c.inventoryItemSchema, emptyBodyStatus: 422 },
  { ...M, method: "GET", path: "/api/v1/admin/inventory/movements", summary: "Stock movements newest first, for one item (?itemCode=) or one month (?month=YYYY-MM)", access: ["ADMIN", "PRINCIPAL"], request: c.stockMovementsQuerySchema, response: c.stockMovementsSchema },
  { ...M, method: "POST", path: "/api/v1/admin/inventory/movements", summary: "Record an issue (to a member of staff, a room or a department), a return, an adjustment or a write-off; refused 409 past what is on hand — stock is never negative", access: ["ADMIN"], request: c.stockMovementSaveSchema, response: c.stockMovementSchema, emptyBodyStatus: 422 },
  { ...M, method: "POST", path: "/api/v1/admin/inventory/stock-take", summary: "What was counted at one place; each difference becomes an adjustment referenced stock-take, all or nothing", access: ["ADMIN"], request: c.stockTakeSaveSchema, response: c.stockTakeResultSchema, emptyBodyStatus: 422 },
  { ...M, method: "GET", path: "/api/v1/admin/inventory/purchases", summary: "Purchase records: bills the school paid outside the app, with their lines, totals and scanned bills", access: ["ADMIN", "PRINCIPAL"], response: c.purchaseRecordsSchema },
  { ...M, method: "POST", path: "/api/v1/admin/inventory/purchases", summary: "Record a bill the school paid (never a payment): its lines naming an item bring that stock in; billFileId is an upload ticket of the caller's", access: ["ADMIN"], request: c.purchaseRecordSaveSchema, response: c.purchaseRecordSchema, emptyBodyStatus: 422 },
  { ...M, method: "GET", path: "/api/v1/admin/inventory/assets", summary: "The asset register with each asset's custodian, place, status and depreciation worked out to today (?status=, ?location=)", access: ["ADMIN", "PRINCIPAL"], request: c.assetsQuerySchema, response: c.assetsSchema },
  { ...M, method: "POST", path: "/api/v1/admin/inventory/assets", summary: "A new asset under a tag no other asset of the school carries, with at most one custodian", access: ["ADMIN"], request: c.assetSaveSchema, response: c.assetSchema, emptyBodyStatus: 422 },
  { ...M, method: "GET", path: "/api/v1/admin/inventory/assets/{tag}", summary: "One asset by its tag, with what has happened to it", access: ["ADMIN", "PRINCIPAL"], response: c.assetDetailSchema, sample: `/api/v1/admin/inventory/assets/${ZZ_ASSET_TAG}` },
  { ...M, method: "POST", path: "/api/v1/admin/inventory/assets/{tag}", summary: "Something happening to an asset: assign or take back, move, send for repair and back, audit, dispose of (final)", access: ["ADMIN"], request: c.assetActionSchema, response: c.assetSchema, emptyBodyStatus: 422, sample: `/api/v1/admin/inventory/assets/${ZZ_ASSET_TAG}` },
  { ...M, method: "GET", path: "/api/v1/admin/inventory/tag-sheet", summary: "Printable asset tags as a PDF (application/pdf): three across, eight down, each with a QR code that opens the asset (?location=). Audited", access: ["ADMIN"], response: c.okSchema },
  { ...M, method: "GET", path: "/api/v1/admin/inventory/requests", summary: "Staff asks for items, the waiting ones first", access: ["ADMIN", "PRINCIPAL"], response: c.inventoryRequestsSchema },
  { ...M, method: "POST", path: "/api/v1/admin/inventory/requests/decide", summary: "Answer an ask: FULFIL issues the item to the asker from a place (in one transaction); DECLINE says why", access: ["ADMIN"], request: c.inventoryRequestDecideSchema, response: c.inventoryRequestSchema, emptyBodyStatus: 422 },
  { ...M, method: "GET", path: "/api/v1/admin/inventory/reports", summary: "Stock on hand, consumption by month, assets by place and by custodian", access: ["ADMIN", "PRINCIPAL"], response: c.inventoryReportsSchema },
  { ...M, method: "GET", path: "/api/v1/admin/inventory/export/fixed-assets", summary: "The auditor's fixed-asset register as CSV: cost, method, rate, depreciation to date and book value of every asset. Audited", access: ["ADMIN"], response: c.inventoryExportSchema },
  { ...M, method: "GET", path: "/api/v1/admin/inventory/export/stock", summary: "Stock on hand by item and place as CSV. Audited", access: ["ADMIN"], response: c.inventoryExportSchema },
  { ...M, method: "GET", path: "/api/v1/account/inventory", summary: "What the stores issued to me and I still hold, the assets I am custodian of, my asks, and the items I may ask for", access: STAFF, response: c.myInventorySchema },
  { ...M, method: "POST", path: "/api/v1/account/inventory/requests", summary: "Ask the office for an item (by its code, or in words when the stores do not keep it)", access: STAFF, request: c.inventoryRequestAskSchema, response: c.inventoryRequestSchema, emptyBodyStatus: 422 },
  { ...M, method: "POST", path: "/api/v1/account/inventory/requests/cancel", summary: "Take back one of my own waiting asks", access: STAFF, request: c.inventoryRequestCancelSchema, response: c.okSchema, emptyBodyStatus: 422 },
];
