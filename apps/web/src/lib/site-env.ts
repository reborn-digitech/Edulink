/**
 * THE SCHOOL WEBSITES' ENVIRONMENT (the WEBSITE module, website-builder B, 15 October 2026), read in one place.
 *
 * A school's website lives ONLY on the school's own domain (the owner's decision of 16 October 2026): there is no
 * platform subdomain, so no `<slug>.<sites domain>` and no SITE_DOMAIN.
 *
 *   SITE_CNAME_TARGET  where a school's www record points: the sites app's own name. Default "sites.shalaghar.com".
 *   APP_HOSTS      a comma list of the app's own hosts (with the port where there is one). A request whose host is
 *                  not one of them may be a website's (src/lib/site-host-match.ts); the route serves it only when
 *                  it is a LIVE school domain. Unset in development it is "localhost:3000,127.0.0.1:3000"; unset in
 *                  production NO host is a site, so a deployment that forgot it never serves its own pages as
 *                  somebody's website.
 *   SITE_APEX_IP   the address a school's bare domain (example.in) may point an A record at; unset, the page tells
 *                  the school to send the bare domain to www with its registrar's redirect.
 *   FLY_API_TOKEN, FLY_SITES_APP   the hosting platform's API token and the app the sites are served from, for
 *                  the certificates (src/lib/fly-certs.ts). Unset, as in development, no certificate is asked for.
 *
 * NO IMPORTS, on purpose: the middleware runs on the edge and reads this file. Each variable is read by its own
 * name (never `process.env[name]`), which is how the edge build hands variables to the middleware.
 */

export type SiteEnv = {
  SITE_CNAME_TARGET?: string;
  APP_HOSTS?: string;
  SITE_APEX_IP?: string;
  FLY_API_TOKEN?: string;
  FLY_SITES_APP?: string;
  NODE_ENV?: string;
};

/** The process's own environment, each variable read by name. */
export function processSiteEnv(): SiteEnv {
  return {
    SITE_CNAME_TARGET: process.env.SITE_CNAME_TARGET,
    APP_HOSTS: process.env.APP_HOSTS,
    SITE_APEX_IP: process.env.SITE_APEX_IP,
    FLY_API_TOKEN: process.env.FLY_API_TOKEN,
    FLY_SITES_APP: process.env.FLY_SITES_APP,
    NODE_ENV: process.env.NODE_ENV,
  };
}

export const DEFAULT_SITE_CNAME_TARGET = "sites.shalaghar.com";
export const DEV_APP_HOSTS = ["localhost:3000", "127.0.0.1:3000"];

/** Where a school's www record points (SITE_CNAME_TARGET), lowercase, with no leading or trailing dot. */
export function sitesTarget(env: SiteEnv = processSiteEnv()): string {
  const raw = (env.SITE_CNAME_TARGET ?? "").trim().toLowerCase().replace(/^\.+|\.+$/g, "");
  return raw || DEFAULT_SITE_CNAME_TARGET;
}

/** Whether this is a development process (the `<slug>.localhost` site hosts, the default APP_HOSTS). */
export function isDevelopment(env: SiteEnv = processSiteEnv()): boolean {
  return env.NODE_ENV === "development";
}

/** Whether APP_HOSTS was set (or the development default stands in for it): only then is any other host a custom domain. */
export function appHostsKnown(env: SiteEnv = processSiteEnv()): boolean {
  return Boolean((env.APP_HOSTS ?? "").trim()) || isDevelopment(env);
}

/** The app's own hosts, lowercase, each as written (with its port where it has one). */
export function appHosts(env: SiteEnv = processSiteEnv()): string[] {
  const configured = (env.APP_HOSTS ?? "")
    .split(",")
    .map((h) => h.trim().toLowerCase().replace(/\.+$/, ""))
    .filter(Boolean);
  if (configured.length > 0) return configured;
  return isDevelopment(env) ? [...DEV_APP_HOSTS] : [];
}

/** SITE_APEX_IP when it is a plain IPv4 address, else null. */
export function siteApexIp(env: SiteEnv = processSiteEnv()): string | null {
  const raw = (env.SITE_APEX_IP ?? "").trim();
  if (!/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.test(raw)) return null;
  return raw.split(".").every((part) => Number(part) <= 255) ? raw : null;
}

/** The hosting platform's API token and sites app, or null when either is unset (development). */
export function flyConfig(env: SiteEnv = processSiteEnv()): { token: string; app: string } | null {
  const token = (env.FLY_API_TOKEN ?? "").trim();
  const app = (env.FLY_SITES_APP ?? "").trim();
  return token && app ? { token, app } : null;
}
