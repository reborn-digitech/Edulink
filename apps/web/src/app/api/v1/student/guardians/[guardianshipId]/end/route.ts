import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiRole } from "@/lib/tenancy";
import { endGuardianLinkAsStudent } from "@/lib/guardianship";
import { studentConsentBody } from "@/lib/student-consent-view";

/**
 * POST /api/v1/student/guardians/{guardianshipId}/end — an adult student at a college ends one of their own family
 * guardians' links (TA-555): the link's grants go with it, the guardian and the office are told, audited
 * guardianship.endedByStudent. No body: the call is the act; a link already ended changes nothing. Answers the
 * student's consent list as it now stands.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ guardianshipId: string }> }) {
  try {
    const ctx = await requireApiRole("STUDENT");
    const { guardianshipId } = await params;
    await endGuardianLinkAsStudent(ctx, guardianshipId);
    return ok(await studentConsentBody(ctx));
  } catch (error) {
    return apiFailure(error, "api/v1/student/guardians/[guardianshipId]/end");
  }
}
