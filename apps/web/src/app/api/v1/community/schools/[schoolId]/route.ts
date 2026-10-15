import { communitySchoolProfileSchema } from "@edulink/contracts";
import { AccessError } from "@/lib/tenancy";
import { readSchoolProfile } from "@/lib/school-profile";
import { findMyOpenEnquiry } from "@/lib/enquiries";
import { apiFailure, ok } from "@/lib/api-v1";
import { requireApiSession } from "@/lib/api-reads/shared";
import { mayUse } from "@/lib/platform-features";

/**
 * GET /api/v1/community/schools/{schoolId} — the web's /explore/[schoolId]:
 * one school's prospectus, readable while it is published or has an open
 * vacancy, 404 otherwise. For a guardian: whether they may ask about
 * admission, and the thread they already have open so the phone offers that
 * rather than a second composer. The contact address and phone stay off it,
 * as they stay off the web page.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ schoolId: string }> }) {
  try {
    const ctx = await requireApiSession();
    if (!ctx.role) throw new AccessError("access.wrongRoleForThisAction");
    const { schoolId } = await params;
    const school = await readSchoolProfile(ctx, schoolId);
    if (!school) throw new AccessError("access.entryNotFound", "NOT_FOUND");
    const myEnquiryId = school.canEnquire ? await findMyOpenEnquiry(ctx, schoolId, "ADMISSION", null) : null;
    const { contactEmail: _email, contactPhone: _phone, ...shown } = school;
    void _email;
    void _phone;
    return ok(
      communitySchoolProfileSchema.parse({
        ...shown,
        highlights: shown.highlights.map((h) => ({ ...h, createdAt: h.createdAt.toISOString() })),
        // No vacancies while the platform has the job board off (15 Oct 2026); they come back, still open, when it is on.
        vacancies: (await mayUse("JOB_BOARD", ctx)) ? shown.vacancies.map((v) => ({ ...v, createdAt: v.createdAt.toISOString() })) : [],
        myEnquiryId,
      }),
    );
  } catch (error) {
    return apiFailure(error, "api/v1/community/schools/[schoolId]");
  }
}
