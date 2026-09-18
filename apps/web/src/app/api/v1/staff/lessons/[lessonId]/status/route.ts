import { lessonStatusSaveSchema, okSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { setLessonStatus } from "@/lib/syllabus";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/staff/lessons/{lessonId}/status — planned, taught or skipped. */
export async function POST(request: Request, { params }: { params: Promise<{ lessonId: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const { lessonId } = await params;
    const parsed = lessonStatusSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await setLessonStatus(ctx, lessonId, parsed.data.status);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/lessons/status");
  }
}
