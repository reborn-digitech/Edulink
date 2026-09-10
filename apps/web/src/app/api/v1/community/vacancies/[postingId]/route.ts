import { communityVacancySchema } from "@edulink/contracts";
import { AccessError, requireApiRole } from "@/lib/tenancy";
import { readPosting } from "@/lib/vacancies";
import { findMyOpenEnquiry, listEnquiries } from "@/lib/enquiries";
import { apiFailure, ok } from "@/lib/api-v1";

/**
 * GET /api/v1/community/vacancies/{postingId} — the web's /vacancies/[postingId]:
 * the advertisement, the school behind it, and either the door to the hiring
 * team (a teacher of another school, with their open thread if they have
 * one) or, for the posting school's own staff, the contact, how many
 * enquiries it has drawn and those enquiries themselves — read through the
 * same listEnquiries the web's /enquiries desk uses, so a teacher who is not
 * the hiring contact sees the count and no threads, exactly as their desk
 * would show them. Another school's closed posting is a 404.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ postingId: string }> }) {
  try {
    const ctx = await requireApiRole("TEACHER", "ADMIN", "PRINCIPAL");
    const { postingId } = await params;
    const posting = await readPosting(ctx, postingId);
    if (!posting) throw new AccessError("access.entryNotFound", "NOT_FOUND");
    const [myEnquiryId, desk] = await Promise.all([
      posting.canEnquire ? findMyOpenEnquiry(ctx, posting.schoolId, "JOB", posting.id) : Promise.resolve(null),
      posting.ours ? listEnquiries(ctx) : Promise.resolve({ sent: [], inbox: [] }),
    ]);
    const enquiries = desk.inbox
      .filter((e) => e.jobPostingId === posting.id)
      .map((e) => ({ id: e.id, fromName: e.fromName, status: e.status, lastMessageAt: e.lastMessageAt.toISOString(), lastMessagePreview: e.lastMessagePreview, unread: e.unread }));
    return ok(communityVacancySchema.parse({ ...posting, createdAt: posting.createdAt.toISOString(), myEnquiryId, enquiries }));
  } catch (error) {
    return apiFailure(error, "api/v1/community/vacancies/[postingId]");
  }
}
