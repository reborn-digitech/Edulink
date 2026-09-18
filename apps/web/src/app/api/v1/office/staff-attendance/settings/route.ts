import { okSchema, staffAttendanceSettingsSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { saveStaffAttendanceSettings } from "@/lib/staff-attendance";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/office/staff-attendance/settings — the staff day's start and grace. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = staffAttendanceSettingsSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await saveStaffAttendanceSettings(ctx, parsed.data);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/office/staff-attendance/settings");
  }
}
