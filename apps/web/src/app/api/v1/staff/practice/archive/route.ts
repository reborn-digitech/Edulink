import { archivePracticeSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { archivePracticeAssignment } from "@/lib/practice-insights";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/** POST /api/v1/staff/practice/archive — take a set chapter down. Another school's id is a 404. */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("TEACHER");
    const parsed = archivePracticeSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await archivePracticeAssignment(ctx, parsed.data.id);
    return ok({ ok: true });
  } catch (error) {
    return apiFailure(error, "api/v1/staff/practice/archive");
  }
}
