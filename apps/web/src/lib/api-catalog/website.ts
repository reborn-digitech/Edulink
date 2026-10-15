import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * website-builder A (15 October 2026): a school's public website — the draft, the preview, Publish and
 * Unpublish for the office and the head behind the WEBSITE module (403 MODULE_OFF while it is off), and the
 * published site itself with its admission form, signed out. The libraries are src/lib/site-admin.ts,
 * site-publish.ts, site-render.ts and site-enquiry.ts; the domain doors are builder B's (website-domains.ts).
 *
 * THE ORDER IS FOR THE SWEEP: the public read comes before Unpublish, and Publish last, so a run leaves ZZ
 * Northgate's fixture site as it found it (published). PUT takes the whole draft, so the sweep's empty body is
 * a 422 and never a write; the enquiry door's empty body is a 422 too, so the sweep never files an enquiry.
 * tests/site-flow.test.ts.
 */
const OFFICE = ["ADMIN", "PRINCIPAL"] as const;

export const WEBSITE: Endpoint[] = [
  { method: "GET", path: "/api/v1/admin/site", summary: "The school website's draft (look, words, sections, numbers, news, gallery with consent), whether a version is live and since when, its address, and the preview's warnings", access: [...OFFICE], module: "WEBSITE", response: c.adminSiteSchema },
  { method: "PUT", path: "/api/v1/admin/site", summary: "Replace the website's draft with the whole config; each field checked (a bundled face, an https map link, the school's own approved posts and their pictures, at most 12 and 24); the consent tick on a picture is stamped with who and when by the server; nothing is published", access: [...OFFICE], module: "WEBSITE", request: c.siteConfigSchema, response: c.adminSiteSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/admin/site/preview", summary: "The draft as the page it would publish (text/html), with today's numbers, ?lang= en, hi or mr; never cached", access: [...OFFICE], module: "WEBSITE", request: c.adminSitePreviewQuerySchema, response: c.okSchema, sample: "/api/v1/admin/site/preview?lang=en" },
  { method: "GET", path: "/api/v1/public/sites/{slug}", summary: "A school's published website (text/html), signed out: static, no script, `Cache-Control: public, max-age=300`, ?lang= en, hi or mr where the site offers them; 404 with noindex while it is not published or the module is off", access: "anyone", request: c.publicSiteQuerySchema, response: c.okSchema, sample: "/api/v1/public/sites/zz-northgate-school" },
  { method: "POST", path: "/api/v1/public/sites/{slug}/enquiry", summary: "An admission enquiry through a school's published website, signed out (name, a phone or email, the class asked about, the question); the admissions contact is told in the app; 201, 404 while the site carries no form, 422 for the form, 429 past five an hour per address", access: "anyone", request: c.siteEnquiryBodySchema, response: c.siteEnquiryReceivedSchema, emptyBodyStatus: 422, sample: "/api/v1/public/sites/zz-northgate-school/enquiry" },
  { method: "POST", path: "/api/v1/admin/site/unpublish", summary: "Take the website down: its address answers 404 with noindex; the versions are kept; audited when something was live", access: [...OFFICE], module: "WEBSITE", response: c.okSchema },
  { method: "POST", path: "/api/v1/admin/site/publish", summary: "Render the draft in every language the site offers and make it the live version at its address; audited", access: [...OFFICE], module: "WEBSITE", response: c.adminSitePublishedSchema },
];
