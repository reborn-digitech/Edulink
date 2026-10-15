import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * website-builder A (15 October 2026): a school's public website — the draft, the preview, Publish and
 * Unpublish for the office and the head behind the WEBSITE module (403 MODULE_OFF while it is off). The
 * libraries are src/lib/site-admin.ts, site-publish.ts, site-render.ts and site-enquiry.ts; the domain doors are
 * builder B's (website-domains.ts).
 *
 * NO PUBLIC DOOR (the owner's decision of 16 October 2026): a published site is public only on the school's own
 * domain, at /sites/by-host/<host> through the middleware, with its form posting to /enquiry there; those are
 * pages of the site, not doors of the API. The public GET by slug and the enquiry door by slug are gone.
 *
 * THE ORDER IS FOR THE SWEEP: Unpublish before Publish, so a run leaves ZZ Northgate's fixture site as it found
 * it (published). PUT takes the whole draft, so the sweep's empty body is a 422 and never a write.
 * tests/site-flow.test.ts.
 */
const OFFICE = ["ADMIN", "PRINCIPAL"] as const;

export const WEBSITE: Endpoint[] = [
  { method: "GET", path: "/api/v1/admin/site", summary: "The school website's draft (look, words, sections, numbers, news, gallery with consent), whether a version is live and since when, its address (the school's own domain once live, else null), and the preview's warnings", access: [...OFFICE], module: "WEBSITE", response: c.adminSiteSchema },
  { method: "PUT", path: "/api/v1/admin/site", summary: "Replace the website's draft with the whole config; each field checked (a bundled face, an https map link, the school's own approved posts and their pictures, at most 12 and 24); the consent tick on a picture is stamped with who and when by the server; nothing is published", access: [...OFFICE], module: "WEBSITE", request: c.siteConfigSchema, response: c.adminSiteSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/admin/site/preview", summary: "The draft as the page it would publish (text/html), with today's numbers, ?lang= en, hi or mr; never cached", access: [...OFFICE], module: "WEBSITE", request: c.adminSitePreviewQuerySchema, response: c.okSchema, sample: "/api/v1/admin/site/preview?lang=en" },
  { method: "POST", path: "/api/v1/admin/site/unpublish", summary: "Take the website down: its domain answers 404 with noindex; the versions are kept; audited when something was live", access: [...OFFICE], module: "WEBSITE", response: c.okSchema },
  { method: "POST", path: "/api/v1/admin/site/publish", summary: "Render the draft in every language the site offers and make it the live version, served at the school's own domain once that is live (the address is null until then); audited", access: [...OFFICE], module: "WEBSITE", response: c.adminSitePublishedSchema },
];
