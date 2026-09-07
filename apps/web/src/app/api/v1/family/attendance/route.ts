import { familyParentAttendanceQuerySchema, familyParentAttendanceSchema } from "@edulink/contracts";
import { parentAttendance, requireApiParent } from "@/lib/api-reads/family";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { query } from "../_shared";

/** GET /api/v1/family/attendance?childId=&month= — one month of a child's register, any month up to this one. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiParent();
    const parsed = familyParentAttendanceQuerySchema.safeParse(query(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(familyParentAttendanceSchema.parse(await parentAttendance(ctx, parsed.data.childId, parsed.data.month)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/attendance");
  }
}
