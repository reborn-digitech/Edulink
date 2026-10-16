import { officeSitePage } from "@/lib/site-routes";

/** /sites/<slug>/<page> — one more page of the published website, for its own office and head (website-two, 16 Oct 2026; src/lib/site-routes.ts). */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ slug: string; page: string }> }) {
  const { slug, page } = await params;
  return officeSitePage(request, slug, page);
}
