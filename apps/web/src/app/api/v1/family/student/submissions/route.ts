import { familyStudentSubmissionSchema, familyStudentSubmittedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { submitStudentWork } from "@/lib/api-reads/family";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/family/student/submissions — hand a piece of work in. Safe to
 * send again: a second delivery replaces the body until the teacher marks it,
 * after which it is refused rather than silently orphaning the mark.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("STUDENT");
    const parsed = familyStudentSubmissionSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { submittedAt } = await submitStudentWork(ctx, parsed.data.assignmentId, parsed.data.body);
    return ok(familyStudentSubmittedSchema.parse({ submittedAt: submittedAt.toISOString() }));
  } catch (error) {
    return apiFailure(error, "api/v1/family/student/submissions");
  }
}
