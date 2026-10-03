"use server";

import { inventoryRequestAskSchema } from "@edulink/contracts";
import { requireApiUser } from "@/lib/tenancy";
import { askForItem, cancelMyRequest } from "@/lib/inventory";
import { field, intField, runAction } from "@/lib/module-actions";

/** A member of staff asks the stores for something, or takes an ask back. Only async functions are exported. */
export async function askItemAction(form: FormData): Promise<void> {
  await runAction("/account/items", async () => {
    const ctx = await requireApiUser();
    await askForItem(ctx, inventoryRequestAskSchema.parse({ itemCode: field(form, "itemCode") || null, itemText: field(form, "itemText"), quantity: intField(form, "quantity"), note: field(form, "note") }));
    return "inventory.askSent";
  });
}

export async function cancelAskAction(form: FormData): Promise<void> {
  await runAction("/account/items", async () => {
    const ctx = await requireApiUser();
    await cancelMyRequest(ctx, field(form, "requestId"));
    return "inventory.askCancelled";
  });
}
