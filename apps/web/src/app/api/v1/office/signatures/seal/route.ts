import { okSchema, signatureSaveSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { saveSeal } from "@/lib/signatures";

/** POST /api/v1/office/signatures/seal — the school's seal, a PNG; the admin's to set. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = signatureSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await saveSeal(ctx, parsed.data.image);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/office/signatures/seal");
  }
}
