import { familyTransportQuerySchema, familyTransportSchema } from "@edulink/contracts";
import { requireApiReader } from "@/lib/api-reads/family";
import { familyTransport } from "@/lib/transport";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/family/transport?childId= — a child's bus for their family (the guardianship decides), or the pupil's own. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiReader();
    const parsed = familyTransportQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(familyTransportSchema.parse(await familyTransport(ctx, ctx.role === "STUDENT" ? null : (parsed.data.childId ?? null))));
  } catch (error) {
    return apiFailure(error, "api/v1/family/transport");
  }
}
