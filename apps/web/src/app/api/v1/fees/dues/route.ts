import { feeDuesQuerySchema, feeDuesSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { duesList } from "@/lib/fees-reports";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/fees/dues — every pupil with what is due, paid and overdue; filtered by status, class and search; paged. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL", "ACCOUNTS");
    const parsed = feeDuesQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(feeDuesSchema.parse(await duesList(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/dues");
  }
}
