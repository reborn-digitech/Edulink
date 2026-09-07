import { principalClassesQuerySchema, principalClassesSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { principalClasses } from "@/lib/api-reads/staff";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/staff/principal/classes?days=&sort=&grade= — class insights, lowest first when sorted by a figure. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("PRINCIPAL", "ADMIN");
    const parsed = principalClassesQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(principalClassesSchema.parse(await principalClasses(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/principal/classes");
  }
}
