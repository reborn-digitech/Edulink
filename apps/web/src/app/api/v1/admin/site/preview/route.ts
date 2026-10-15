import { adminSitePreviewQuerySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, apiInvalid } from "@/lib/api-v1";
import { previewHtml } from "@/lib/site-admin";

/**
 * GET /api/v1/admin/site/preview — the draft as the page it would publish (text/html), ?lang= en, hi or mr
 * (website-builder A, 15 Oct 2026); the office and the head. Never cached, never indexed.
 */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = adminSitePreviewQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    const html = await previewHtml(ctx, parsed.data.lang ?? null);
    return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" } });
  } catch (error) {
    return apiFailure(error, "api/v1/admin/site/preview");
  }
}
