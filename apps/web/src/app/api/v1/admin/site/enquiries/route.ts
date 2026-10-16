import { siteEnquiriesQuerySchema, siteEnquiriesSchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, apiInvalid, ok } from "@/lib/api-v1";
import { siteInbox } from "@/lib/site-inbox";

/** GET /api/v1/admin/site/enquiries?status= — the website's enquiries, newest first, with the count in each state (website-two, 16 Oct 2026). */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = siteEnquiriesQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    return ok(siteEnquiriesSchema.parse(await siteInbox(ctx, parsed.data.status)));
  } catch (error) {
    return apiFailure(error, "api/v1/admin/site/enquiries");
  }
}
