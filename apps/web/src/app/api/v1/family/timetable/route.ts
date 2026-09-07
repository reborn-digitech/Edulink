import { familyTimetableQuerySchema, familyTimetableSchema } from "@edulink/contracts";
import { familyTimetable, requireApiReader } from "@/lib/api-reads/family";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { query } from "../_shared";

/** GET /api/v1/family/timetable?childId=&week= — a pupil's own dated week, or a guardian's child's: the same resolved grid, cover and closures included. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiReader();
    const parsed = familyTimetableQuerySchema.safeParse(query(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(familyTimetableSchema.parse(await familyTimetable(ctx, parsed.data.childId, parsed.data.week)));
  } catch (error) {
    return apiFailure(error, "api/v1/family/timetable");
  }
}
