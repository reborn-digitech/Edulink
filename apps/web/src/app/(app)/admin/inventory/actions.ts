"use server";

import {
  assetActionSchema,
  assetSaveSchema,
  inventoryCategorySaveSchema,
  inventoryItemSaveSchema,
  inventoryRequestDecideSchema,
  purchaseRecordSaveSchema,
  stockMovementSaveSchema,
  stockTakeSaveSchema,
  vendorSaveSchema,
} from "@edulink/contracts";
import { requireApiUser } from "@/lib/tenancy";
import { actOnAsset, createAsset, decideRequest, recordMovement, recordPurchase, saveCategory, saveItem, saveVendor, stockTake } from "@/lib/inventory";
import { field, intField, runAction, rupeesField } from "@/lib/module-actions";
import { storeAttachments, discard } from "@/lib/uploads";

/**
 * The inventory pages' writes. Who may make each is the library's to decide
 * (the admin; the head reads); this file reads the form, checks its shape
 * with the same contract the API uses, and goes back to the page with the
 * outcome. Only async functions are exported (tests/use-server-exports).
 */
const blankToNull = (v: string) => (v ? v : null);

export async function saveItemAction(form: FormData): Promise<void> {
  await runAction("/admin/inventory/items", async () => {
    const ctx = await requireApiUser();
    await saveItem(ctx, inventoryItemSaveSchema.parse({ code: field(form, "code"), name: field(form, "name"), categoryId: blankToNull(field(form, "categoryId")), unit: field(form, "unit"), reorderLevel: intField(form, "reorderLevel"), kind: field(form, "kind") || "CONSUMABLE", archived: form.get("archived") === "on" }));
    return "inventory.itemSaved";
  });
}

export async function saveCategoryAction(form: FormData): Promise<void> {
  await runAction("/admin/inventory/setup", async () => {
    const ctx = await requireApiUser();
    const rate = field(form, "ratePercent");
    await saveCategory(ctx, inventoryCategorySaveSchema.parse({ id: field(form, "id") || undefined, name: field(form, "name"), depreciationRateBp: rate ? Math.round(Number(rate) * 100) : null }));
    return "inventory.categorySaved";
  });
}

export async function saveVendorAction(form: FormData): Promise<void> {
  await runAction("/admin/inventory/setup", async () => {
    const ctx = await requireApiUser();
    await saveVendor(ctx, vendorSaveSchema.parse({ id: field(form, "id") || undefined, name: field(form, "name"), phone: field(form, "phone"), gstin: field(form, "gstin"), address: field(form, "address") }));
    return "inventory.vendorSaved";
  });
}

export async function recordMovementAction(form: FormData): Promise<void> {
  await runAction("/admin/inventory/movements", async () => {
    const ctx = await requireApiUser();
    await recordMovement(ctx, stockMovementSaveSchema.parse({ itemCode: field(form, "itemCode"), kind: field(form, "kind"), quantity: intField(form, "quantity"), location: field(form, "location"), toMembershipId: blankToNull(field(form, "toMembershipId")), toRoom: field(form, "toRoom"), toDepartment: field(form, "toDepartment"), reference: field(form, "reference"), note: field(form, "note") }));
    return "inventory.movementSaved";
  });
}

export async function stockTakeAction(form: FormData): Promise<void> {
  const location = field(form, "location");
  await runAction(`/admin/inventory/movements?location=${encodeURIComponent(location)}`, async () => {
    const ctx = await requireApiUser();
    const counts: { itemCode: string; counted: number }[] = [];
    for (const [k, v] of form.entries()) {
      if (!k.startsWith("count:")) continue;
      const raw = String(v).trim();
      if (raw === "") continue;
      counts.push({ itemCode: k.slice(6), counted: Number.parseInt(raw, 10) });
    }
    const result = await stockTake(ctx, stockTakeSaveSchema.parse({ location, counts, note: field(form, "note") }));
    return result.adjusted ? "inventory.stockTakeAdjusted" : "inventory.stockTakeMatched";
  });
}

export async function recordPurchaseAction(form: FormData): Promise<void> {
  await runAction("/admin/inventory/purchases", async () => {
    const ctx = await requireApiUser();
    const lines: { itemCode: string | null; description: string; quantity: number; unitPaise: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const qty = intField(form, `qty${i}`);
      const desc = field(form, `desc${i}`);
      const code = field(form, `code${i}`);
      if (!qty && !desc && !code) continue;
      lines.push({ itemCode: code || null, description: desc, quantity: qty, unitPaise: rupeesField(form, `unit${i}`) ?? 0 });
    }
    const input = purchaseRecordSaveSchema.parse({ vendorId: blankToNull(field(form, "vendorId")), vendorName: field(form, "vendorName"), dateKey: field(form, "dateKey"), invoiceRef: field(form, "invoiceRef"), location: field(form, "location"), lines, note: field(form, "note") });
    // The scan is stored first and thrown away again if the record is refused.
    const file = form.get("bill");
    const stored = file instanceof File && file.size > 0 ? await storeAttachments([file], { max: 1 }) : [];
    try {
      await recordPurchase(ctx, input, { storedFileId: stored[0]?.fileId ?? null });
    } catch (error) {
      await discard(stored.map((s) => s.fileId));
      throw error;
    }
    return "inventory.purchaseSaved";
  });
}

export async function createAssetAction(form: FormData): Promise<void> {
  await runAction("/admin/inventory/assets", async () => {
    const ctx = await requireApiUser();
    const rate = field(form, "ratePercent");
    await createAsset(
      ctx,
      assetSaveSchema.parse({
        tagNumber: field(form, "tagNumber"),
        name: field(form, "name"),
        itemCode: blankToNull(field(form, "itemCode")),
        categoryId: blankToNull(field(form, "categoryId")),
        purchaseDateKey: blankToNull(field(form, "purchaseDateKey")),
        costPaise: rupeesField(form, "cost") ?? 0,
        vendorId: blankToNull(field(form, "vendorId")),
        warrantyUntilKey: blankToNull(field(form, "warrantyUntilKey")),
        location: field(form, "location"),
        custodianMembershipId: blankToNull(field(form, "custodianMembershipId")),
        method: field(form, "method") || "STRAIGHT_LINE",
        depreciationRateBp: rate ? Math.round(Number(rate) * 100) : null,
        condition: field(form, "condition") || "GOOD",
        note: field(form, "note"),
      }),
    );
    return "inventory.assetSaved";
  });
}

export async function assetActionAction(form: FormData): Promise<void> {
  const tag = field(form, "tag");
  await runAction(`/admin/inventory/assets/${encodeURIComponent(tag)}`, async () => {
    const ctx = await requireApiUser();
    const action = field(form, "action");
    const custodian = field(form, "custodianMembershipId");
    await actOnAsset(
      ctx,
      tag,
      assetActionSchema.parse({
        action,
        ...(action === "ASSIGN" ? { custodianMembershipId: custodian || null } : {}),
        ...(field(form, "location") ? { location: field(form, "location") } : {}),
        ...(field(form, "condition") ? { condition: field(form, "condition") } : {}),
        note: field(form, "note"),
      }),
    );
    return "inventory.assetUpdated";
  }, ["/admin/inventory/assets"]);
}

export async function decideRequestAction(form: FormData): Promise<void> {
  await runAction("/admin/inventory/requests", async () => {
    const ctx = await requireApiUser();
    const input = inventoryRequestDecideSchema.parse({ requestId: field(form, "requestId"), decision: field(form, "decision"), location: field(form, "location"), note: field(form, "note") });
    await decideRequest(ctx, input);
    return input.decision === "FULFIL" ? "inventory.requestFulfilled" : "inventory.requestDeclined";
  });
}
