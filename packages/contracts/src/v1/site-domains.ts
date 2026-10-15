import { z } from "zod";

/**
 * A SCHOOL'S OWN DOMAIN FOR ITS PUBLIC WEBSITE (the WEBSITE module, 15 October 2026; website-builder B).
 *
 * The office or the head types a domain on the website flow's sixth screen (/admin/website/domain), adds the
 * records shown at their registrar and presses Verify: the DNS is checked, a certificate is asked of the hosting
 * platform, and the domain is LIVE once it is issued. Every failure is a code the page words, never a resolver's
 * or a platform's message. The doors: GET/POST/DELETE /api/v1/admin/site/domain, POST /api/v1/admin/site/domain/verify.
 */

export const SITE_DOMAIN_STATUSES = ["PENDING_DNS", "VERIFYING", "LIVE", "FAILED"] as const;
export const siteDomainStatusSchema = z.enum(SITE_DOMAIN_STATUSES);
export type SiteDomainStatus = z.infer<typeof siteDomainStatusSchema>;

export const SITE_CERT_STATUSES = ["NONE", "REQUESTED", "ISSUED", "FAILED"] as const;
export const siteCertStatusSchema = z.enum(SITE_CERT_STATUSES);
export type SiteCertStatus = z.infer<typeof siteCertStatusSchema>;

/** Why the DNS check did not pass: nothing there yet, something else there (`found`), or the resolver did not answer. */
export const SITE_DNS_ERRORS = ["NO_RECORD", "WRONG_TARGET", "LOOKUP_FAILED"] as const;
/** Why there is no certificate: not issued here (development), the platform did not answer, or it refused. */
export const SITE_CERT_ERRORS = ["NOT_CONFIGURED", "FLY_ERROR", "CERT_FAILED"] as const;

export const siteDnsErrorSchema = z.object({ code: z.enum(SITE_DNS_ERRORS), host: z.string(), found: z.string().optional() });
export const siteCertErrorSchema = z.object({ code: z.enum(SITE_CERT_ERRORS), host: z.string().optional() });
export type SiteDnsError = z.infer<typeof siteDnsErrorSchema>;
export type SiteCertError = z.infer<typeof siteCertErrorSchema>;

/** One record to add at the registrar. REDIRECT is the registrar's forwarding of the bare domain to www. */
export const siteDnsRecordSchema = z.object({ type: z.enum(["CNAME", "A", "REDIRECT"]), name: z.string(), host: z.string(), value: z.string() });
export type SiteDnsRecord = z.infer<typeof siteDnsRecordSchema>;

const iso = z.string().datetime();

export const siteDomainSchema = z.object({
  domain: z.string(),
  status: siteDomainStatusSchema,
  certStatus: siteCertStatusSchema,
  dnsCheckedAt: iso.nullable(),
  dnsError: siteDnsErrorSchema.nullable(),
  certCheckedAt: iso.nullable(),
  certError: siteCertErrorSchema.nullable(),
  createdAt: iso,
  verifiedAt: iso.nullable(),
  /** Exactly the records to add, in order. */
  records: z.array(siteDnsRecordSchema),
  /** The hosts the platform answers for this domain. */
  hosts: z.array(z.string()),
});
export type SiteDomain = z.infer<typeof siteDomainSchema>;

/** GET /api/v1/admin/site/domain, and the answer to a save or a verify. */
export const siteDomainViewSchema = z.object({
  /** Whether the school's site is published now. It is reachable only at its own domain once that is LIVE (16 Oct 2026). */
  published: z.boolean(),
  /** SITE_CNAME_TARGET: where a www record points. */
  target: z.string(),
  /** Whether certificates are issued here (false in development: the hosted platform issues them). */
  certificatesHere: z.boolean(),
  domain: siteDomainSchema.nullable(),
});
export type SiteDomainView = z.infer<typeof siteDomainViewSchema>;

/** POST /api/v1/admin/site/domain: the domain as typed; a hostname alone (no scheme, no path). */
export const siteDomainSaveBodySchema = z.object({ domain: z.string().trim().min(1).max(300) });
/** POST …/verify and DELETE: the domain the page shows, so a stale screen acts on nothing else. */
export const siteDomainConfirmBodySchema = z.object({ domain: z.string().trim().min(1).max(300) });
export const siteDomainRemovedSchema = z.object({ removed: z.boolean() });
