import { officeHousekeepingBodySchema, okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { setNotifThresholds, AUTO_READ_RANGE, EXPIRE_RANGE } from "@/lib/notification-housekeeping";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/** POST /api/v1/office/notifications/housekeeping — how long this school's notices live; null is the platform default. Out-of-range days are a 422 naming the range. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const parsed = officeHousekeepingBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await setNotifThresholds(ctx, parsed.data);
    if (!result.ok) {
      const range = result.errorKey === "notif.autoReadOutOfRange" ? AUTO_READ_RANGE : EXPIRE_RANGE;
      return apiRefused({ errorKey: result.errorKey, errorVars: { min: range.min, max: range.max } });
    }
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/office/notifications/housekeeping");
  }
}
