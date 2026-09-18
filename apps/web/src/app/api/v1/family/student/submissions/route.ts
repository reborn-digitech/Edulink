import { familyStudentSubmissionSchema, familyStudentSubmittedSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { submitStudentWork } from "@/lib/api-reads/family";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";

/**
 * POST /api/v1/family/student/submissions — hand a piece of work in, words
 * and/or photographs of it (ids from POST /api/v1/uploads). Safe to send
 * again: a second delivery replaces the body and the file list until the
 * teacher marks it, after which it is refused rather than silently orphaning
 * the mark.
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("STUDENT");
    const parsed = familyStudentSubmissionSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const { submittedAt, attachments } = await submitStudentWork(ctx, parsed.data.assignmentId, parsed.data.body, parsed.data.attachments);
    return ok(familyStudentSubmittedSchema.parse({ submittedAt: submittedAt.toISOString(), attachments }));
  } catch (error) {
    return apiFailure(error, "api/v1/family/student/submissions");
  }
}
