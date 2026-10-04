import { lecturesQuerySchema, lecturesSchema } from "@edulink/contracts";
import { requireApiRoles } from "@/lib/api-roles";
import { myLectures } from "@/lib/academics-attendance";
import { apiInvalid, ok } from "@/lib/api-v1";
import { moduleFailure } from "@/lib/rule-refusal";

/** GET /api/v1/academics/lectures — My lectures on a day (today by default), made from the timetable on first read. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRoles("FACULTY", "HOD");
    const parsed = lecturesQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const q = parsed.data;
    return ok(lecturesSchema.parse(await myLectures(ctx, q.date)));
  } catch (error) {
    return moduleFailure(error, "api/v1/academics/lectures");
  }
}
