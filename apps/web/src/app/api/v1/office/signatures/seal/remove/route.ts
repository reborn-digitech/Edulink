import { okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, ok } from "@/lib/api-v1";
import { removeSeal } from "@/lib/signatures";

/** POST /api/v1/office/signatures/seal/remove — takes the seal away; papers already sealed keep their copy. */
export async function POST() {
  try {
    const ctx = await requireApiRole("ADMIN");
    await removeSeal(ctx);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/office/signatures/seal/remove");
  }
}
