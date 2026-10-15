import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * website-builder B (15 October 2026): a school's own domain for its public website, the flow's sixth screen
 * (/admin/website/domain). The office and the head, behind the WEBSITE module (403 MODULE_OFF while it is off).
 * The library is src/lib/site-domains.ts; every write is audited (site.domain.save, .verify, .remove; the job's
 * flips as site.domain.status). Verify and Remove take the domain the page shows, so the sweep's empty body is a
 * 422 and the sweep never removes or re-checks ZZ Northgate's fixture domain (www.zz-northgate.test).
 * tests/site-domains.test.ts.
 */
const OFFICE = ["ADMIN", "PRINCIPAL"] as const;

export const WEBSITE_DOMAINS: Endpoint[] = [
  { method: "GET", path: "/api/v1/admin/site/domain", summary: "The school website's address (its subdomain), whether it is published, and the school's own domain with its state and the DNS records to add", access: [...OFFICE], module: "WEBSITE", response: c.siteDomainViewSchema, sample: "/api/v1/admin/site/domain" },
  { method: "POST", path: "/api/v1/admin/site/domain", summary: "Save the school's own domain for its website (a hostname, no scheme or path), replacing the one it had; audited", access: [...OFFICE], module: "WEBSITE", request: c.siteDomainSaveBodySchema, response: c.siteDomainViewSchema, emptyBodyStatus: 422, sample: "/api/v1/admin/site/domain" },
  { method: "DELETE", path: "/api/v1/admin/site/domain", summary: "Remove the school's own domain (the one named in the body); its certificate is taken off the platform; audited", access: [...OFFICE], module: "WEBSITE", request: c.siteDomainConfirmBodySchema, response: c.siteDomainRemovedSchema, emptyBodyStatus: 422, sample: "/api/v1/admin/site/domain" },
  { method: "POST", path: "/api/v1/admin/site/domain/verify", summary: "Check the school's own domain's DNS now, ask for its certificate, and answer its new state (Waiting for DNS, Verifying, Live, Failed); audited", access: [...OFFICE], module: "WEBSITE", request: c.siteDomainConfirmBodySchema, response: c.siteDomainViewSchema, emptyBodyStatus: 422, sample: "/api/v1/admin/site/domain/verify" },
];
