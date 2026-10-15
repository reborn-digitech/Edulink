import "server-only";
import { promises as nodeDns } from "node:dns";
import { apexOf, counterpartOf, isApex } from "./site-host-match";

/**
 * THE DNS A SCHOOL'S OWN DOMAIN NEEDS, AND THE CHECK THAT IT IS THERE (website-builder B, 15 October 2026).
 *
 * WHAT THE PAGE ASKS FOR (dnsRecordsFor): a www name (or any subdomain) is a CNAME to `sites.<SITE_DOMAIN>`; the bare
 * domain is an A record (or the registrar's ALIAS/ANAME) to SITE_APEX_IP when the platform has one, and otherwise
 * the registrar's own redirect to www — in which case a school that typed the bare domain is served on www.
 *
 * WHAT IS CHECKED (checkDns), for every host the platform will serve (servedHosts): a subdomain's CNAME names the
 * target, or — a registrar that flattens CNAMEs — its A records are among the target's; a bare domain's A records
 * include SITE_APEX_IP or one of the target's. Node's own resolver (dns.promises), which a test replaces.
 *
 * A failure is a code, stored on the row and worded by the page: NO_RECORD (nothing there yet — DNS takes up to a
 * day to reach everyone), WRONG_TARGET (something else is there; `found` says what), LOOKUP_FAILED (the resolver
 * did not answer). Never the resolver's own message, which a school cannot act on.
 */

export type DnsResolver = {
  resolveCname: (hostname: string) => Promise<string[]>;
  resolve4: (hostname: string) => Promise<string[]>;
};

export type DnsFailure = { code: "NO_RECORD" | "WRONG_TARGET" | "LOOKUP_FAILED"; host: string; found?: string };
export type DnsOutcome = { ok: true } | { ok: false; failure: DnsFailure };

export type DnsRecord = {
  /** CNAME, A, or REDIRECT (the registrar's forwarding, not a DNS record of ours to check). */
  type: "CNAME" | "A" | "REDIRECT";
  /** The name at the registrar: "www", "@" for the bare domain, or the subdomain's own label(s). */
  name: string;
  /** The full host the record is for. */
  host: string;
  value: string;
};

/** The hosts the platform answers for this domain (and asks certificates for). */
export function servedHosts(domain: string, apexIp: string | null): string[] {
  const other = counterpartOf(domain);
  if (other && apexIp) return isApex(domain) ? [domain, other] : [other, domain];
  if (other) return [isApex(domain) ? other : domain];
  return [domain];
}

/** The domain to store for what a school typed: a bare domain is served on www unless the platform has an apex address. */
export function storedDomainFor(domain: string, apexIp: string | null): string {
  return isApex(domain) && !apexIp ? `www.${domain}` : domain;
}

/** Exactly the records to add at the registrar, in the order the page shows them. */
export function dnsRecordsFor(domain: string, target: string, apexIp: string | null): DnsRecord[] {
  const apex = apexOf(domain);
  const other = counterpartOf(domain);
  if (!other) return [{ type: "CNAME", name: domain.slice(0, -(apex.length + 1)), host: domain, value: target }];
  const www = `www.${apex}`;
  return [
    { type: "CNAME", name: "www", host: www, value: target },
    apexIp ? { type: "A", name: "@", host: apex, value: apexIp } : { type: "REDIRECT", name: "@", host: apex, value: `https://${www}` },
  ];
}

const clean = (name: string) => name.toLowerCase().replace(/\.$/, "");
const errCode = (e: unknown) => (e && typeof e === "object" && "code" in e ? String((e as { code: unknown }).code) : "");
/** "No such record" from the resolver, as against "the resolver did not answer". */
const isAbsent = (e: unknown) => ["ENODATA", "ENOTFOUND", "NXDOMAIN", "ENONAME"].includes(errCode(e));

async function lookup(fn: () => Promise<string[]>): Promise<{ values: string[] } | { absent: true } | { failed: true }> {
  try {
    return { values: (await fn()).map(clean) };
  } catch (e) {
    return isAbsent(e) ? { absent: true } : { failed: true };
  }
}

/** Check every served host of a domain. */
export async function checkDns(domain: string, opts: { target: string; apexIp: string | null }, resolver: DnsResolver = nodeDns): Promise<DnsOutcome> {
  const target = clean(opts.target);
  // The target's own addresses, for a flattened CNAME or an ALIAS at the bare domain; looked up once.
  let targetIps: string[] | null = null;
  const targetAddresses = async () => {
    if (targetIps === null) {
      const r = await lookup(() => resolver.resolve4(target));
      targetIps = "values" in r ? r.values : [];
    }
    return targetIps;
  };

  for (const host of servedHosts(domain, opts.apexIp)) {
    if (!isApex(host)) {
      const cname = await lookup(() => resolver.resolveCname(host));
      if ("failed" in cname) return { ok: false, failure: { code: "LOOKUP_FAILED", host } };
      if ("values" in cname && cname.values.length > 0) {
        if (cname.values.includes(target)) continue;
        return { ok: false, failure: { code: "WRONG_TARGET", host, found: cname.values[0] } };
      }
    }
    // A bare domain, or a subdomain with no CNAME: its A records.
    const a = await lookup(() => resolver.resolve4(host));
    if ("failed" in a) return { ok: false, failure: { code: "LOOKUP_FAILED", host } };
    if ("absent" in a || a.values.length === 0) return { ok: false, failure: { code: "NO_RECORD", host } };
    const expected = new Set([...(isApex(host) && opts.apexIp ? [opts.apexIp] : []), ...(await targetAddresses())]);
    if (a.values.some((ip) => expected.has(ip))) continue;
    return { ok: false, failure: { code: "WRONG_TARGET", host, found: a.values[0] } };
  }
  return { ok: true };
}
