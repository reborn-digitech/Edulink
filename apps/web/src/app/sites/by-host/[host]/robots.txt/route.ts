import { siteRobots } from "@/lib/site-host-routes";

/** /robots.txt on a school website's host (website-builder B): everything readable, the sitemap named; 404 noindex for no site. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ host: string }> }) {
  return siteRobots(request, (await params).host);
}
