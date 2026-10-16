import { adminSitePreviewQuerySchema } from "@edulink/contracts";
import { requireApiRole } from "@/lib/tenancy";
import { apiFailure, apiInvalid } from "@/lib/api-v1";
import { previewHtml } from "@/lib/site-admin";
import { finishSiteHtml } from "@/lib/site-render";
import { appUrl } from "@/lib/site-publish";

/**
 * GET /api/v1/admin/site/preview — the draft as the page it would publish (text/html), ?lang= en, hi or mr, ?page= a
 * page's path (website-two, 16 Oct 2026; the home page without one)
 * (website-builder A, 15 Oct 2026); the office and the head. Never cached, never indexed.
 */
export async function GET(request: Request) {
  try {
    const ctx = await requireApiRole("ADMIN", "PRINCIPAL");
    const parsed = adminSitePreviewQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
    if (!parsed.success) return apiInvalid(parsed);
    // The page's links between pages point at the editor's own preview in a tab (website-two: every page).
    const html = finishSiteHtml(await previewHtml(ctx, parsed.data.lang ?? null, parsed.data.page ?? ""), { base: "/admin/website/preview", origin: appUrl() });
    return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" } });
  } catch (error) {
    return apiFailure(error, "api/v1/admin/site/preview");
  }
}
