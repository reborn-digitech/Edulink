import type { SiteLanguage } from "@edulink/contracts";
import { getSession } from "@/lib/session";
import { AccessError } from "@/lib/access-error";
import { previewHtml } from "@/lib/site-admin";

/**
 * /admin/website/preview?lang= — the draft as the page Publish would make (website-builder A, 15 Oct 2026), whole,
 * for the office and the head to open in a tab of its own from the Preview screen. Never cached, never indexed;
 * signed out, or not the office, or the module off, it is the 404 every refusal here is.
 */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const lang = new URL(request.url).searchParams.get("lang");
  const asked: SiteLanguage | null = lang === "en" || lang === "hi" || lang === "mr" ? lang : null;
  try {
    const ctx = await getSession();
    if (!ctx) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
    const html = await previewHtml(ctx, asked);
    return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" } });
  } catch (error) {
    if (!(error instanceof AccessError)) console.error("[admin/website/preview]", error);
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  }
}
