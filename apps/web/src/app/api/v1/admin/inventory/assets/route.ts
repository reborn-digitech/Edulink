import { assetSaveSchema, assetSchema, assetsQuerySchema, assetsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { createAsset, listAssets } from "@/lib/inventory";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/admin/inventory/assets?status=&location= — the register, depreciation worked out to today. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL", "ACCOUNTS");
    const params = new URL(request.url).searchParams;
    const parsed = assetsQuerySchema.safeParse({ status: params.get("status") ?? undefined, location: params.get("location") ?? undefined });
    if (!parsed.success) return apiInvalid(parsed);
    return ok(assetsSchema.parse(await listAssets(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/inventory/assets");
  }
}

/** POST /api/v1/admin/inventory/assets — a new asset under a tag of its own. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const parsed = assetSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(assetSchema.parse(await createAsset(ctx, parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/inventory/assets");
  }
}
