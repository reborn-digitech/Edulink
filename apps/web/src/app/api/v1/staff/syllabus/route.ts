import { staffSyllabusQuerySchema, staffSyllabusSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { staffSyllabus } from "@/lib/syllabus";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";

/** GET /api/v1/staff/syllabus?classId=&subject= — a class's units with progress, and its lessons. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const parsed = staffSyllabusQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(staffSyllabusSchema.parse(await staffSyllabus(ctx, parsed.data)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/syllabus");
  }
}
