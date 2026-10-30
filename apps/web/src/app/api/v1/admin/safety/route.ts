import { adminSafetyQuerySchema, adminSafetySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { adminSafety } from "@/lib/api-reads/admin";

/** GET /api/v1/admin/safety — the safety centre: who outside the school has looked inside it, then the open reports, the closed ones, or the audit trail, by tab. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = adminSafetyQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(adminSafetySchema.parse(await adminSafety(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/safety");
  }
}
