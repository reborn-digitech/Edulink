/**
 * WHICH REQUESTS ARE A SCHOOL WEBSITE'S, AND WHAT A SCHOOL MAY TYPE AS ITS DOMAIN (website-builder B, 15 October
 * 2026). Pure functions over a host, a path and the environment (src/lib/site-env.ts), so the middleware, the
 * library and the tests share one reading.
 *
 * A SITE HOST is a request host that is not the app's: `<slug>.<SITE_DOMAIN>`, `<slug>.localhost` in development,
 * or — once the app's own hosts are known (APP_HOSTS, or the development default) — any other named host, which
 * is a school's own domain. Never a site host: one of APP_HOSTS, a bare IP address (the platform's health checks
 * and machines reach the app by address), a name with no dot, and the platform's private names (.internal,
 * .flycast). On a site host the middleware rewrites every path to /sites/by-host/<host>, which answers /,
 * /robots.txt and /sitemap.xml and 404s the rest — the sign-in, the app's pages and its API are not there — except
 * the few paths a published page itself loads: Next's own files, the platform's file route (pictures), the bundled
 * fonts and marks, the health check, the public sites doors (the enquiry form), and /sites/ itself.
 *
 * NO IMPORTS, on purpose: the middleware runs on the edge.
 */

export type HostEnv = {
  /** SITE_DOMAIN, lowercase. */
  siteDomain: string;
  /** APP_HOSTS, lowercase, each with its port where it has one. */
  appHosts: readonly string[];
  /** Whether APP_HOSTS is known (set, or the development default): only then is another named host a custom domain. */
  appHostsKnown: boolean;
  /** A development process: `<slug>.localhost` is a site host. */
  dev: boolean;
};

/** A request's Host header, lowercase, with its trailing dot gone: the host as sent (with port) and the name alone. */
export function normaliseHost(raw: string | null | undefined): { host: string; hostname: string } | null {
  const host = (raw ?? "").trim().toLowerCase().replace(/\.(?=:\d+$)|\.$/, "");
  if (!host || /[\s/\\@?#]/.test(host)) return null;
  if (host.startsWith("[")) {
    // An IPv6 literal, [::1]:3000.
    const end = host.indexOf("]");
    return end > 0 ? { host, hostname: host.slice(0, end + 1) } : null;
  }
  const colon = host.lastIndexOf(":");
  const hostname = colon >= 0 ? host.slice(0, colon) : host;
  if (colon >= 0 && !/^\d{1,5}$/.test(host.slice(colon + 1))) return null;
  return hostname ? { host, hostname } : null;
}

/** An IPv4 or bracketed IPv6 literal. */
export function isIpLiteral(hostname: string): boolean {
  return hostname.startsWith("[") || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
}

const PRIVATE_SUFFIXES = [".internal", ".flycast", ".local"];

/** `<slug>` when the host is `<slug>.<SITE_DOMAIN>` (or `<slug>.localhost` in development), else null. */
export function slugOfSiteHost(rawHost: string | null | undefined, env: Pick<HostEnv, "siteDomain" | "dev">): string | null {
  const n = normaliseHost(rawHost);
  if (!n) return null;
  const suffixes = [`.${env.siteDomain}`, ...(env.dev ? [".localhost"] : [])];
  for (const suffix of suffixes) {
    if (!n.hostname.endsWith(suffix)) continue;
    const label = n.hostname.slice(0, -suffix.length);
    return /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/.test(label) ? label : null;
  }
  return null;
}

/** Whether a request with this Host header belongs to a school's website rather than the app. */
export function isSiteHost(rawHost: string | null | undefined, env: HostEnv): boolean {
  const n = normaliseHost(rawHost);
  if (!n) return false;
  if (env.appHosts.includes(n.host) || env.appHosts.includes(n.hostname)) return false;
  if (isIpLiteral(n.hostname)) return false;
  if (!n.hostname.includes(".")) return false;
  if (PRIVATE_SUFFIXES.some((s) => n.hostname.endsWith(s))) return false;
  if (n.hostname === env.siteDomain || n.hostname.endsWith(`.${env.siteDomain}`)) return true;
  if (n.hostname.endsWith(".localhost")) return env.dev;
  return env.appHostsKnown;
}

/**
 * The paths a site host passes through to the app untouched: what a published page itself loads, and the
 * health check. Every top-level entry of public/ is decided here or in DENIED_PUBLIC (a test holds the two lists
 * to the directory): the bundled fonts and the marks are the site's; the service worker is the app's alone.
 */
/**
 * A published site's own policy: no script, no plugin, no frame, inline styles only (the renderer writes them),
 * pictures from the platform's file route. Set by the middleware on every site response, by host or by slug,
 * because the middleware's page policy and next.config's global one would otherwise replace the route's own
 * header (15 Oct 2026). src/lib/site-host-routes.ts sets it again on the response body it builds.
 */
export const SITE_CSP = "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; font-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'";

export const SITE_PASS_PREFIXES = ["/sites/", "/_next/", "/api/files/", "/api/health", "/api/v1/public/sites/", "/fonts/", "/brand/", "/icons/"] as const;
export const SITE_PASS_FILES = ["/favicon.ico", "/icon.png"] as const;
/** public/ entries a site host does not serve. */
export const DENIED_PUBLIC = ["sw.js"] as const;

function passesThrough(pathname: string): boolean {
  if ((SITE_PASS_FILES as readonly string[]).includes(pathname)) return true;
  return SITE_PASS_PREFIXES.some((p) => (p.endsWith("/") ? pathname.startsWith(p) : pathname === p || pathname.startsWith(`${p}/`)));
}

/**
 * The path the middleware rewrites a request to, or null to leave it alone: on a site host, every path but the
 * pass-through ones becomes /sites/by-host/<hostname><path> (the query is kept by the caller). The port is
 * dropped; the hostname is a single path segment.
 */
export function siteRewritePath(rawHost: string | null | undefined, pathname: string, env: HostEnv): string | null {
  if (!isSiteHost(rawHost, env)) return null;
  if (passesThrough(pathname)) return null;
  const { hostname } = normaliseHost(rawHost)!;
  return `/sites/by-host/${hostname}${pathname === "/" ? "" : pathname}`;
}

/* -------------------------------------------------------------------------- */
/* What a school may type as its own domain                                    */
/* -------------------------------------------------------------------------- */

export type DomainRefusal = "EMPTY" | "SCHEME" | "PATH" | "INVALID" | "IP" | "APP_HOST" | "SITE_DOMAIN";

/**
 * The domain a school typed, checked and made canonical: lowercase ASCII (an internationalised name in punycode,
 * through the URL parser's own IDNA), no trailing dot. A hostname only: no scheme, no path, no port, no address.
 * Refused: one of the app's own hosts, SITE_DOMAIN and every name under it (the sites' own addresses), localhost.
 * www.example.in and example.in are both accepted as typed.
 */
export function canonicalDomain(raw: string, env: Pick<HostEnv, "siteDomain" | "appHosts">): { ok: true; domain: string } | { ok: false; reason: DomainRefusal } {
  const typed = raw.trim().toLowerCase();
  if (!typed) return { ok: false, reason: "EMPTY" };
  if (/^[a-z][a-z0-9+.-]*:\/\//.test(typed)) return { ok: false, reason: "SCHEME" };
  if (/[/?#@\\]/.test(typed)) return { ok: false, reason: "PATH" };
  if (/[\s:]/.test(typed)) return { ok: false, reason: "INVALID" };
  let hostname: string;
  try {
    hostname = new URL(`http://${typed}`).hostname;
  } catch {
    return { ok: false, reason: "INVALID" };
  }
  hostname = hostname.replace(/\.$/, "");
  if (isIpLiteral(hostname)) return { ok: false, reason: "IP" };
  const labels = hostname.split(".");
  if (hostname.length > 253 || labels.length < 2) return { ok: false, reason: "INVALID" };
  if (!labels.every((l) => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(l))) return { ok: false, reason: "INVALID" };
  const tld = labels[labels.length - 1]!;
  if (!/^(?:[a-z]{2,63}|xn--[a-z0-9-]{1,59})$/.test(tld)) return { ok: false, reason: "INVALID" };
  if (hostname === "localhost" || hostname.endsWith(".localhost")) return { ok: false, reason: "APP_HOST" };
  const appNames = env.appHosts.map((h) => normaliseHost(h)?.hostname).filter((h): h is string => Boolean(h));
  if (appNames.includes(hostname)) return { ok: false, reason: "APP_HOST" };
  if (hostname === env.siteDomain || hostname.endsWith(`.${env.siteDomain}`)) return { ok: false, reason: "SITE_DOMAIN" };
  return { ok: true, domain: hostname };
}

/**
 * Second-level suffixes under which a registrable domain has three labels (example.co.in), for telling a bare
 * domain from a subdomain. India's registry's own, and the handful a school elsewhere might hold.
 */
const TWO_LABEL_SUFFIXES = new Set([
  "co.in", "net.in", "org.in", "firm.in", "gen.in", "ind.in", "ac.in", "edu.in", "res.in", "gov.in", "nic.in", "mil.in",
  "co.uk", "org.uk", "ac.uk", "com.au", "edu.au", "org.au", "co.nz", "com.np", "edu.np", "com.bd", "edu.bd", "com.lk", "edu.lk",
]);

/** The registrable (bare) domain a name sits under: www.school.ac.in -> school.ac.in. */
export function apexOf(domain: string): string {
  const labels = domain.split(".");
  const lastTwo = labels.slice(-2).join(".");
  const take = TWO_LABEL_SUFFIXES.has(lastTwo) ? 3 : 2;
  return labels.slice(-take).join(".");
}

/** Whether the name is a bare (registrable) domain. */
export function isApex(domain: string): boolean {
  return apexOf(domain) === domain;
}

/** The other form of a www/bare pair (www.example.in <-> example.in), or null for any other subdomain. */
export function counterpartOf(domain: string): string | null {
  if (isApex(domain)) return `www.${domain}`;
  if (domain.startsWith("www.") && isApex(domain.slice(4))) return domain.slice(4);
  return null;
}
