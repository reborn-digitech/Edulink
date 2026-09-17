import { familyFeesQuerySchema, familyFeesSchema } from "@edulink/contracts";
import { requireApiParent } from "@/lib/api-reads/family";
import { feesFamilyRead } from "@/lib/api-reads/fees";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/fees/family?childId — the child's dues, what has been paid, and how this school takes payment. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiParent();
    const parsed = familyFeesQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(familyFeesSchema.parse(await feesFamilyRead(ctx, parsed.data.childId)));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/family");
  }
}
