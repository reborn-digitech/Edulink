import { purchaseRecordSaveSchema, purchaseRecordSchema, purchaseRecordsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { listPurchases, recordPurchase } from "@/lib/inventory";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/admin/inventory/purchases — the bills, newest first. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    return ok(purchaseRecordsSchema.parse(await listPurchases(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/inventory/purchases");
  }
}

/** POST /api/v1/admin/inventory/purchases — a bill the school paid outside the app; billFileId is the caller's upload ticket. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = purchaseRecordSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(purchaseRecordSchema.parse(await recordPurchase(ctx, parsed.data, { ticket: parsed.data.billFileId })));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/inventory/purchases");
  }
}
