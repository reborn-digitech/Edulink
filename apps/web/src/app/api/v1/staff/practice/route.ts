import { practiceCreatedSchema, practiceQuerySchema, setPracticeSchema, staffPracticeSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { staffPractice } from "@/lib/api-reads/staff";
import { createPracticeAssignment } from "@/lib/practice-insights";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** GET /api/v1/staff/practice?classId= — one class's practice picture: the heatmap, what is set, the week's movement, where the class is stuck. */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER");
    const parsed = practiceQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(staffPracticeSchema.parse(await staffPractice(ctx, parsed.data.classId)));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/practice");
  }
}

/**
 * POST /api/v1/staff/practice — set a chapter and a rung for a class. The
 * class and the topic are re-checked against THIS teacher's classes inside
 * the lib; a class from another school is a 404, not an assignment.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER");
    const parsed = setPracticeSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { classId, topicSlug, targetLevel, note, dueDate } = parsed.data;
    const dueAt = dueDate ? new Date(`${dueDate}T23:59:59`) : null;
    const result = await createPracticeAssignment(ctx, { classId, topicSlug, targetLevel, note, dueAt: dueAt && !Number.isNaN(dueAt.getTime()) ? dueAt : null });
    return ok(practiceCreatedSchema.parse(result));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/practice");
  }
}
