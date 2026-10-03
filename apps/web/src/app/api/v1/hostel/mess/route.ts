import { messAttendanceResultSchema, messAttendanceSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { saveMessAttendance } from "@/lib/hostel";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/hostel/mess — Who ate at a meal, where the house marks it. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("WARDEN", "ADMIN");
    const parsed = messAttendanceSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const b = parsed.data;
    return ok(messAttendanceResultSchema.parse(await saveMessAttendance(ctx, b)));
  } catch (error) {
    return apiFailure(error, "api/v1/hostel/mess");
  }
}
