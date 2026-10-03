import { assetActionSchema, assetDetailSchema, assetSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { actOnAsset, assetDetail } from "@/lib/inventory";
import { moduleFailure } from "@/lib/rule-refusal";

type Params = { params: Promise<{ tag: string }> };

/** GET /api/v1/admin/inventory/assets/{tag} — one asset and what has happened to it. */
export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const { tag } = await params;
    return ok(assetDetailSchema.parse(await assetDetail(ctx, decodeURIComponent(tag))));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/inventory/assets/[tag]");
  }
}

/** POST /api/v1/admin/inventory/assets/{tag} — assign, move, repair, audit or dispose of it. */
export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { tag } = await params;
    const parsed = assetActionSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(assetSchema.parse(await actOnAsset(ctx, decodeURIComponent(tag), parsed.data)));
  } catch (error) {
    return moduleFailure(error, "api/v1/admin/inventory/assets/[tag]");
  }
}
