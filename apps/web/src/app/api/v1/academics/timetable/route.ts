import { academicsIdResultSchema, academicsTimetableSchema, timetableQuerySchema, timetableSlotSaveSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { academicsTimetable, saveTimetableSlot } from "@/lib/academics";
import { apiInvalid, ok, readJson } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/academics/timetable — A term's weekly grid: a division's, a faculty member's, a room's, or the student's own. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN", "PRINCIPAL", "HOD", "FACULTY", "STUDENT");
    const parsed = timetableQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(academicsTimetableSchema.parse(await academicsTimetable(ctx, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/timetable");
  }
}

/** POST /api/v1/academics/timetable — One weekly hour of an offering; a clash of faculty, room, division or student, or a room too small, is refused 409. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRoles("ADMIN");
    const parsed = timetableSlotSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(academicsIdResultSchema.parse(await saveTimetableSlot(ctx, q)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/timetable");
  }
}
