import type { MetadataRoute } from "next";

/**
 * /robots.txt on the app's own host (company-site, 16 Oct 2026): the company's site at the root is for search engines,
 * and so are the other public pages (src/lib/robots.ts INDEXED); every signed-in page says noindex itself, and the API
 * is not for crawling. A school website's host never reaches this: the middleware serves that site's own robots.txt.
 * Read per request, so the address is the one the server runs with.
 */
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${base}/sitemap.xml`,
  };
}
