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
 *
 * WEBSITE-TWO (16 October 2026): the editor's doors — the versions with Restore and Back to published (each a write of
 * the draft, so each asks for `{ confirm: true }` and the sweep's empty body is a 422), review links to the draft
 * (POST asks for `{ days }`, so the sweep makes none; DELETE of an id that is not one is the 404), the enquiries inbox
 * (reply by email, close or open again: each asks for a body, and the sweep's samples name no real enquiry), the
 * page-view counts and the files uploaded for the site. tests/site-two.test.ts.
 *
 * WEBSITE-THREE (17 October 2026): a file uploaded for the site deleted from the editor's Files panel (the sweep's sample
 * names no file, so it is the 404), and the phone's read-only summary. PUT takes `If-Match: <draftVersion>` (409 when
 * someone else saved since). tests/site-three.test.ts.
 */
const OFFICE = ["ADMIN", "PRINCIPAL"] as const;

export const WEBSITE: Endpoint[] = [
  { method: "GET", path: "/api/v1/admin/site", summary: "The school website's draft (look, words, sections, numbers, news, gallery with consent), whether a version is live and since when, its address (the school's own domain once live, else null), and the preview's warnings", access: [...OFFICE], module: "WEBSITE", response: c.adminSiteSchema },
  { method: "PUT", path: "/api/v1/admin/site", summary: "Replace the website's draft with the whole config; each field checked (a bundled face, an https map link, the school's own approved posts and their pictures, at most 12 and 24); the consent tick on a picture is stamped with who and when by the server; nothing is published; If-Match: <draftVersion> (GET's) makes it conditional, 409 when someone else saved the draft since", access: [...OFFICE], module: "WEBSITE", request: c.siteConfigSchema, response: c.adminSiteSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/admin/site/preview", summary: "The draft as the page it would publish (text/html), with today's numbers, ?lang= en, hi or mr, ?page= a page's path (the home page without one); never cached", access: [...OFFICE], module: "WEBSITE", request: c.adminSitePreviewQuerySchema, response: c.okSchema, sample: "/api/v1/admin/site/preview?lang=en" },
  { method: "POST", path: "/api/v1/admin/site/unpublish", summary: "Take the website down: its domain answers 404 with noindex; the versions are kept; audited when something was live", access: [...OFFICE], module: "WEBSITE", response: c.okSchema },
  { method: "POST", path: "/api/v1/admin/site/publish", summary: "Render the draft in every language the site offers and make it the live version, served at the school's own domain once that is live (the address is null until then); audited", access: [...OFFICE], module: "WEBSITE", response: c.adminSitePublishedSchema },
  // website-two (16 Oct 2026)
  { method: "GET", path: "/api/v1/admin/site/versions", summary: "Every version of the website kept (the live one and up to twenty before it), newest first, with who published it or that the nightly refresh cut it", access: [...OFFICE], module: "WEBSITE", response: c.siteVersionsSchema },
  { method: "POST", path: "/api/v1/admin/site/versions/{versionId}/restore", summary: "Restore: a version's config becomes the draft ({ confirm: true }), the draft's changes thrown away; nothing is published; audited", access: [...OFFICE], module: "WEBSITE", request: c.siteRestoreBodySchema, response: c.siteRestoredSchema, sample: "/api/v1/admin/site/versions/zz-sweep-no-such-version/restore", emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/admin/site/revert", summary: "Back to published: the live version's config becomes the draft ({ confirm: true }), the draft's changes thrown away; 404 when nothing is published; audited", access: [...OFFICE], module: "WEBSITE", request: c.siteRestoreBodySchema, response: c.siteRestoredSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/admin/site/shares", summary: "The links to review the draft that are still open (made, expires, by whom), never their tokens", access: [...OFFICE], module: "WEBSITE", response: c.siteSharesSchema },
  { method: "POST", path: "/api/v1/admin/site/shares", summary: "Make a link to review the draft signed out ({ days: 1–7 }), revoking the one before; the URL with its token is shown this once; audited", access: [...OFFICE], module: "WEBSITE", request: c.siteShareCreateSchema, response: c.siteShareMadeSchema, emptyBodyStatus: 422 },
  { method: "DELETE", path: "/api/v1/admin/site/shares/{shareId}", summary: "Revoke a review link: it answers 404 from the next request; audited", access: [...OFFICE], module: "WEBSITE", response: c.okSchema, sample: "/api/v1/admin/site/shares/zz-sweep-no-such-share", emptyBodyStatus: 404 },
  { method: "GET", path: "/api/v1/admin/site/enquiries", summary: "The website's enquiries, newest first, ?status= NEW, REPLIED or CLOSED, with the count in each; an enquiry is deleted 180 days after it is closed or last touched", access: [...OFFICE], module: "WEBSITE", request: c.siteEnquiriesQuerySchema, response: c.siteEnquiriesSchema },
  { method: "POST", path: "/api/v1/admin/site/enquiries/{enquiryId}/reply", summary: "Reply to an enquiry by email in the enquirer's language ({ text }); it becomes REPLIED with the words kept; 409 when the enquirer gave no email; audited", access: [...OFFICE], module: "WEBSITE", request: c.siteEnquiryReplySchema, response: c.siteEnquiryRowSchema, sample: "/api/v1/admin/site/enquiries/zz-sweep-no-such-enquiry/reply", emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/admin/site/enquiries/{enquiryId}/status", summary: "Close an enquiry, or open it again ({ status }); audited when it changes", access: [...OFFICE], module: "WEBSITE", request: c.siteEnquiryStatusSchema, response: c.siteEnquiryRowSchema, sample: "/api/v1/admin/site/enquiries/zz-sweep-no-such-enquiry/status", emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/admin/site/visits", summary: "The website's page views of the last thirty days by day and by page, counted on the server with no cookie and no address", access: [...OFFICE], module: "WEBSITE", response: c.siteVisitsSchema },
  { method: "GET", path: "/api/v1/admin/site/files", summary: "The pictures and PDFs uploaded for the website (the editor uploads them), newest first, each with where the saved draft and the live site use it, and the count against the 120 a site keeps", access: [...OFFICE], module: "WEBSITE", response: c.siteFilesSchema },
  // end website-two
  // website-three (17 Oct 2026)
  { method: "DELETE", path: "/api/v1/admin/site/files/{fileId}", summary: "Delete a picture or PDF uploaded for the website: 409 naming where while the saved draft or the live site uses it, 404 for a file that is not this school's upload; the row and the bytes go at once otherwise; audited", access: [...OFFICE], module: "WEBSITE", response: c.okSchema, sample: "/api/v1/admin/site/files/zz-sweep-no-such-file.png", emptyBodyStatus: 404 },
  { method: "GET", path: "/api/v1/admin/site/summary", summary: "The website at a glance for the phone, read-only: draft or published and since when, the live address, the \"Ready: n of 7\" list, the enquiries waiting with the newest three (a name, when, the state) and the page views of the last thirty days; editing is on the web", access: [...OFFICE], module: "WEBSITE", response: c.siteSummarySchema },
  // end website-three
];
