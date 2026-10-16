import { reviewSitePage } from "@/lib/site-routes";

/** /sites/review/<token>/<page> — one more page of the draft under review (website-two, 16 Oct 2026; src/lib/site-routes.ts). */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ token: string; page: string }> }) {
  const { token, page } = await params;
  return reviewSitePage(request, token, page);
}
