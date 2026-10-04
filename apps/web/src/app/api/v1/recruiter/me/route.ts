import { recruiterMeSchema } from "@edulink/contracts";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiUser } from "@/lib/tenancy";
import { myRecruiterProfile } from "@/lib/recruiters";

/** GET /api/v1/recruiter/me — the recruiter's own account (4 Oct 2026): their name, the company, whether the address is confirmed. */
export async function GET() {
  try {
    const ctx = await requireApiUser();
    const me = await myRecruiterProfile(ctx);
    return ok(recruiterMeSchema.parse({ ...me, createdAt: me.createdAt.toISOString() }));
  } catch (error) {
    return apiFailure(error, "api/v1/recruiter/me");
  }
}
