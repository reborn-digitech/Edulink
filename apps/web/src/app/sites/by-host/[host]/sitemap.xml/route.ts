import { siteSitemap } from "@/lib/site-host-routes";

/** /sitemap.xml on a school website's host (website-builder B): one URL per language the site offers; 404 noindex for no site. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ host: string }> }) {
  return siteSitemap(request, (await params).host);
}
