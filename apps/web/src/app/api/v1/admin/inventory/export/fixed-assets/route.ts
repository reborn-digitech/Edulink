import { inventoryExportSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { ok } from "@/lib/api-v1";
import { fixedAssetRegisterExport } from "@/lib/inventory";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/admin/inventory/export/fixed-assets — the auditor's fixed-asset register as CSV text for the phone's share sheet. Audited. */
export async function GET() {
  try {
    const ctx = await requireApiRole("ADMIN");
    return ok(inventoryExportSchema.parse(await fixedAssetRegisterExport(ctx)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/inventory/export/fixed-assets");
  }
}
