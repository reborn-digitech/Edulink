import { siteEnquiryRowSchema, siteEnquiryStatusSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { setSiteEnquiryStatus } from "@/lib/site-inbox";

/** POST /api/v1/admin/site/enquiries/{enquiryId}/status — close an enquiry, or open it again ({ status }); audited when it changes (website-two, 16 Oct 2026). */
export async function POST(request: Request, { params }: { params: Promise<{ enquiryId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = siteEnquiryStatusSchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(siteEnquiryRowSchema.parse(await setSiteEnquiryStatus(ctx, (await params).enquiryId, parsed.data.status)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/site/enquiries/status");
  }
}
