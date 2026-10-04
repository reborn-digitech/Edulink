import { vendorSaveSchema, vendorSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { saveVendor } from "@/lib/inventory";
import { moduleFailure } from "@/lib/rule-refusal";

/** POST /api/v1/admin/inventory/vendors — make or rewrite a vendor. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const parsed = vendorSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(vendorSchema.parse(await saveVendor(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/inventory/vendors");
  }
}
