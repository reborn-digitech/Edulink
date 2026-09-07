import { periodCreateBodySchema, savedIdSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { createPeriod } from "@/lib/timetable";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/** POST /api/v1/admin/timetable/periods — add a period to the school day. Overlaps and backwards times are refused with the reason. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = periodCreateBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await createPeriod(ctx, parsed.data);
    if (!result.ok) return apiRefused(result);
    return ok(savedIdSchema.parse({ ok: true, id: result.id }), 201);
  } catch (error) {
    return apiFailure(error, "api/v1/admin/timetable/periods");
  }
}
