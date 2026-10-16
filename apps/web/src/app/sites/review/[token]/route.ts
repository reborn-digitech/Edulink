import { reviewSitePage } from "@/lib/site-routes";

/**
 * /sites/review/<token> — a link to review the website's draft, signed out (website-two, 16 Oct 2026): read-only,
 * never cached or indexed, valid up to seven days, revocable from the editor; 404 once revoked or expired
 * (src/lib/site-share.ts, src/lib/site-routes.ts). A school whose slug is "review" is shadowed here, as "by-host" is.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  return reviewSitePage(request, (await params).token, "");
}
