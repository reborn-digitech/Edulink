import { okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";
import { removeMySignature } from "@/lib/signatures";

/** POST /api/v1/office/signatures/mine/remove — takes the reader's signature away; papers already signed keep their copy. */
export async function POST() {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    await removeMySignature(ctx);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/office/signatures/mine/remove");
  }
}
