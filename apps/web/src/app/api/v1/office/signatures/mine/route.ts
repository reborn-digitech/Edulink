import { okSchema, signatureSaveSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { saveMySignature } from "@/lib/signatures";

/** POST /api/v1/office/signatures/mine — the reader's own signature, a PNG. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL", "TEACHER");
    const parsed = signatureSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await saveMySignature(ctx, parsed.data.image);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/office/signatures/mine");
  }
}
