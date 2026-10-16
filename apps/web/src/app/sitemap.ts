import type { MetadataRoute } from "next";
import { SITEMAP_PATHS } from "@/lib/robots";

/** /sitemap.xml on the app's own host (company-site, 16 Oct 2026): the fixed public pages, the company's site first. */
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return SITEMAP_PATHS.map((path) => ({ url: `${base}${path}`, priority: path === "/" ? 1 : 0.5 }));
}
