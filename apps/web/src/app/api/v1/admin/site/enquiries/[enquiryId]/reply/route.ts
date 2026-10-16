import { NextResponse } from "next/server";
import { apiErrorSchema, siteEnquiryReplySchema, siteEnquiryRowSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { getT } from "@/lib/i18n/server";
import { replyToSiteEnquiry } from "@/lib/site-inbox";

/**
 * POST /api/v1/admin/site/enquiries/{enquiryId}/reply — answer an enquiry by email in the enquirer's language ({ text });
 * it becomes REPLIED with the words kept; audited. 409 when the enquirer gave no email (website-two, 16 Oct 2026).
 */
export async function POST(request: Request, { params }: { params: Promise<{ enquiryId: string }> }) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = siteEnquiryReplySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const made = await replyToSiteEnquiry(ctx, (await params).enquiryId, parsed.data.text);
    if (!made.ok) {
      const t = await getT();
      return NextResponse.json(apiErrorSchema.parse({ error: t(made.errorKey), code: made.status === 409 ? "CONFLICT" : "BAD_REQUEST" }), { status: made.status });
    }
    return ok(siteEnquiryRowSchema.parse(made.enquiry));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/site/enquiries/reply");
  }
}
