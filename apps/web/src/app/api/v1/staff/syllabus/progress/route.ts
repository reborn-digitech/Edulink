import { okSchema, syllabusProgressSaveSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { saveSyllabusProgress } from "@/lib/syllabus";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/staff/syllabus/progress — move a unit along for a class. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const parsed = syllabusProgressSaveSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await saveSyllabusProgress(ctx, parsed.data);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/staff/syllabus/progress");
  }
}
