import { feeRemindBodySchema, feeRemindResultSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { remindNow } from "@/lib/fees-reports";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/fees/remind — one notice per overdue pupil, now, to every guardian; the pupils named, or everyone overdue. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "ACCOUNTS");
    const parsed = feeRemindBodySchema.safeParse((await readJson(request)) ?? {});
    if (!parsed.success) return apiInvalid(parsed);
    return ok(feeRemindResultSchema.parse(await remindNow(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/fees/remind");
  }
}
