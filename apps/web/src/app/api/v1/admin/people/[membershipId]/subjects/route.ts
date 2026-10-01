import { okSchema, subjectsBodySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { setTeacherSubjects } from "@/lib/reviews";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";

/** POST /api/v1/admin/people/{membershipId}/subjects — a teacher's subjects replaced as a set, the office's half of what the teacher chose at signup; the rule is lib/reviews.ts. */
export async function POST(request: Request, { params }: { params: Promise<{ membershipId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN");
    const { membershipId } = await params;
    const parsed = subjectsBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const result = await setTeacherSubjects(ctx, membershipId, parsed.data.subjects);
    if (!result.ok) return apiRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/people/[membershipId]/subjects");
  }
}
