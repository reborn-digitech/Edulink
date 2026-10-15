import { NextResponse } from "next/server";
import { apiErrorSchema, siteEnquiryBodySchema, siteEnquiryReceivedSchema } from "@edulink/contracts";
import { apiFailure, apiInvalid, ok, readJson } from "@/lib/api-v1";
import { getT } from "@/lib/i18n/server";
import { retryHintKey } from "@/lib/rate-limit";
import { takeSiteEnquiry } from "@/lib/site-enquiry";

/**
 * POST /api/v1/public/sites/{slug}/enquiry — an admission enquiry to a school through its published website,
 * signed out (website-builder A, 15 Oct 2026). The site's own HTML form posts to /sites/<slug>/enquiry, which
 * takes the same path (src/lib/site-enquiry.ts); this is the same act as JSON. 201; 404 while the site is not
 * published or carries no enquiry form; 422 for the form; 429 with Retry-After past five an hour per address.
 */
export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const parsed = siteEnquiryBodySchema.safeParse(await readJson(request));
    if (!parsed.success) return apiInvalid(parsed);
    const t = await getT();
    const made = await takeSiteEnquiry(slug, parsed.data);
    if (made.ok) return ok(siteEnquiryReceivedSchema.parse({ ok: true }), 201);
    if (made.status === 429) {
      const hint = retryHintKey(made.retryAfterSeconds ?? 3600);
      return NextResponse.json(apiErrorSchema.parse({ error: t(made.errorKey, { when: t(hint.key, hint.vars) }), code: "RATE_LIMITED", retryAfterSeconds: made.retryAfterSeconds }), {
        status: 429,
        headers: { "Retry-After": String(made.retryAfterSeconds ?? 3600), "Cache-Control": "no-store" },
      });
    }
    if (made.status === 404) return NextResponse.json(apiErrorSchema.parse({ error: t(made.errorKey), code: "NOT_FOUND" }), { status: 404, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json(apiErrorSchema.parse({ error: t(made.errorKey), code: "BAD_REQUEST", issues: { contact: t(made.errorKey) } }), { status: 422, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return apiFailure(error, "api/v1/public/sites/enquiry");
  }
}
