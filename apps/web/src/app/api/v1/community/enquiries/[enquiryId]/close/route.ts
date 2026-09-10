import { okSchema } from "@edulink/contracts";
import { AccessError } from "@/lib/tenancy";
import { closeEnquiry } from "@/lib/enquiries";
import { apiFailure, ok } from "@/lib/api-v1";
import { apiRefused } from "@/lib/api-reads/admin";
import { requireApiSession } from "@/lib/api-reads/shared";

/**
 * POST /api/v1/community/enquiries/{enquiryId}/close — the web's `close`: the
 * school's side ends the conversation and nobody can reply after. The person
 * who asked cannot close it (403); an id that does not exist is a 404; one
 * already closed is a 422 with the reason.
 */
export async function POST(_request: Request, { params }: { params: Promise<{ enquiryId: string }> }) {
  try {
    const ctx = await requireApiSession();
    const { enquiryId } = await params;
    const result = await closeEnquiry(ctx, enquiryId).catch((error: unknown) => {
      if (error instanceof AccessError && error.key === "access.thereIsNoSuchEnquiry") throw new AccessError(error.key, "NOT_FOUND");
      throw error;
    });
    if (!result.ok) return apiRefused(result);
    return ok(okSchema.parse({ ok: true }));
  } catch (error) {
    return apiFailure(error, "api/v1/community/enquiries/[enquiryId]/close");
  }
}
