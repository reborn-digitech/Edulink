import { studentConsentSetSchema } from "@edulink/contracts";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { requireApiRole } from "@/lib/tenancy";
import { setStudentConsent } from "@/lib/student-consent";
import { studentConsentBody } from "@/lib/student-consent-view";

/**
 * GET /api/v1/student/consent — what this student lets each guardian see (4 Oct 2026; per guardian since TA-555), and
 * the claims waiting on their own yes; `applies` is false for a minor or a pupil at a school.
 */
export async function GET() {
  try {
    const ctx = await requireApiRole("STUDENT");
    return ok(await studentConsentBody(ctx));
  } catch (error) {
    return apiFailure(error, "api/v1/student/consent");
  }
}

/**
 * POST /api/v1/student/consent — grant or revoke one, to the guardian named or, with none named, to every family
 * guardian linked now; an adult at a college alone (audited student.consent.grant|revoke).
 */
export async function POST(request: Request) {
  try {
    const ctx = await requireApiRole("STUDENT");
    const parsed = studentConsentSetSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    await setStudentConsent(ctx, parsed.data.grant, parsed.data.on, parsed.data.guardianshipId);
    return ok(await studentConsentBody(ctx));
  } catch (error) {
    return apiFailure(error, "api/v1/student/consent");
  }
}
