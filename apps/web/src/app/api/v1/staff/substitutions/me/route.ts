import { myCoversQuerySchema, myCoversSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { myCovers } from "@/lib/substitutions";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/staff/substitutions/me?date= — the lessons I am covering on a day. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const parsed = myCoversQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(myCoversSchema.parse(await myCovers(ctx, parsed.data.date)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/substitutions/me");
  }
}
