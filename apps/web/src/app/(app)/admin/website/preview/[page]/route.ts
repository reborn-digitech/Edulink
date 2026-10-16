import { previewSitePage } from "@/lib/site-routes";

/** /admin/website/preview/<page> — one more page of the draft, opened in a tab (website-two, 16 Oct 2026; src/lib/site-routes.ts). */
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ page: string }> }) {
  return previewSitePage(request, (await params).page);
}
