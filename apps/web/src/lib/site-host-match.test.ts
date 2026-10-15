/**
 * THE SITE-HOST MATCHER (website-builder B, 15 October 2026; src/lib/site-host-match.ts, read by the edge
 * middleware). Which hosts are a school website's, which paths a site host passes through, what the rewrite is, and
 * what a school may type as its own domain. Since 16 October 2026 a site lives only on its school's own domain:
 * no platform subdomain, no SITE_DOMAIN, and `<slug>.localhost` only in development. Pure: no database, no network.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { apexOf, canonicalDomain, counterpartOf, DENIED_PUBLIC, devSlugOfHost, isApex, isSiteHost, normaliseHost, siteRewritePath, SITE_PASS_FILES, SITE_PASS_PREFIXES, type HostEnv } from "./site-host-match";
import * as siteEnv from "./site-env";
import { appHosts, appHostsKnown, flyConfig, siteApexIp, sitesTarget } from "./site-env";

const DEV: HostEnv = { appHosts: ["localhost:3000", "127.0.0.1:3000"], appHostsKnown: true, dev: true };
const PROD: HostEnv = { appHosts: ["app.shalaghar.in", "edulink-web.fly.dev"], appHostsKnown: true, dev: false };
const PROD_UNSET: HostEnv = { appHosts: [], appHostsKnown: false, dev: false };

describe("the environment", () => {
  it("defaults SITE_CNAME_TARGET and reads APP_HOSTS, with the development default only in development; no SITE_DOMAIN", () => {
    expect(sitesTarget({})).toBe("sites.shalaghar.com");
    expect(sitesTarget({ SITE_CNAME_TARGET: " .Sites.Example.IN. " })).toBe("sites.example.in");
    expect(Object.keys(siteEnv)).not.toContain("siteDomain");
    expect(Object.keys(siteEnv.processSiteEnv())).not.toContain("SITE_DOMAIN");
    expect(appHosts({ NODE_ENV: "development" })).toEqual(["localhost:3000", "127.0.0.1:3000"]);
    expect(appHosts({ NODE_ENV: "production" })).toEqual([]);
    expect(appHostsKnown({ NODE_ENV: "production" })).toBe(false);
    expect(appHosts({ APP_HOSTS: "App.Shalaghar.in , edulink-web.fly.dev", NODE_ENV: "production" })).toEqual(["app.shalaghar.in", "edulink-web.fly.dev"]);
    expect(appHostsKnown({ APP_HOSTS: "app.shalaghar.in", NODE_ENV: "production" })).toBe(true);
  });

  it("takes SITE_APEX_IP only as an IPv4 address, and Fly only with both its values", () => {
    expect(siteApexIp({ SITE_APEX_IP: "66.241.124.10" })).toBe("66.241.124.10");
    expect(siteApexIp({ SITE_APEX_IP: "300.1.1.1" })).toBeNull();
    expect(siteApexIp({ SITE_APEX_IP: "sites.example" })).toBeNull();
    expect(flyConfig({ FLY_API_TOKEN: "t" })).toBeNull();
    expect(flyConfig({ FLY_API_TOKEN: "t", FLY_SITES_APP: "edulink-sites" })).toEqual({ token: "t", app: "edulink-sites" });
  });
});

describe("which hosts are a school website's", () => {
  it("never the app's own hosts, an address, a dotless name or the platform's private names", () => {
    for (const host of ["localhost:3000", "127.0.0.1:3000", "localhost:3001", "192.168.1.5:3000", "[::1]:3000", "edulink-web.internal:3000", "x.flycast", "mac.local:3000", "", null]) {
      expect(isSiteHost(host, DEV), String(host)).toBe(false);
    }
    expect(isSiteHost("app.shalaghar.in", PROD)).toBe(false);
    expect(isSiteHost("APP.SHALAGHAR.IN.", PROD)).toBe(false);
    expect(isSiteHost("edulink-web.fly.dev:443", PROD)).toBe(false);
  });

  it("<slug>.localhost in development, and any other named host once APP_HOSTS is known (the route then serves only a LIVE domain)", () => {
    expect(isSiteHost("zz-northgate-school.localhost:3000", DEV)).toBe(true);
    expect(isSiteHost("zz-northgate-school.localhost:3000", PROD)).toBe(false);
    expect(isSiteHost("www.zz-northgate.test", DEV)).toBe(true);
    expect(isSiteHost("www.example.in", PROD)).toBe(true);
  });

  it("⚠ with APP_HOSTS unset in production, no host at all: the app is never served as a website", () => {
    for (const host of ["app.shalaghar.in", "www.example.in", "abc.shalaghar.site", "zz-northgate-school.localhost:3000"]) {
      expect(isSiteHost(host, PROD_UNSET), host).toBe(false);
      expect(siteRewritePath(host, "/", PROD_UNSET), host).toBeNull();
    }
  });

  it("reads a school's slug from <slug>.localhost in development only: there is no platform subdomain", () => {
    expect(devSlugOfHost("zz-northgate-school.localhost:3000", true)).toBe("zz-northgate-school");
    expect(devSlugOfHost("zz-northgate-school.localhost:3000", false)).toBeNull();
    expect(devSlugOfHost("a.b.localhost", true)).toBeNull();
    expect(devSlugOfHost("zz-northgate-school.shalaghar.site", true)).toBeNull();
    expect(devSlugOfHost("www.example.in", true)).toBeNull();
    expect(normaliseHost("Example.IN.:8080")).toEqual({ host: "example.in:8080", hostname: "example.in" });
    expect(normaliseHost("bad host")).toBeNull();
  });
});

describe("the rewrite", () => {
  it("sends every page path of a site host to /sites/by-host/<hostname>, port dropped", () => {
    expect(siteRewritePath("zz-northgate-school.localhost:3000", "/", DEV)).toBe("/sites/by-host/zz-northgate-school.localhost");
    expect(siteRewritePath("www.example.in", "/robots.txt", PROD)).toBe("/sites/by-host/www.example.in/robots.txt");
    expect(siteRewritePath("www.example.in", "/sitemap.xml", PROD)).toBe("/sites/by-host/www.example.in/sitemap.xml");
    // The app's pages and its API are not on a site's host: they reach the 404.
    expect(siteRewritePath("www.example.in", "/login", PROD)).toBe("/sites/by-host/www.example.in/login");
    expect(siteRewritePath("www.example.in", "/api/v1/me", PROD)).toBe("/sites/by-host/www.example.in/api/v1/me");
    expect(siteRewritePath("www.example.in", "/sw.js", PROD)).toBe("/sites/by-host/www.example.in/sw.js");
  });

  it("passes through what a published page loads itself, and touches nothing on the app's hosts", () => {
    for (const path of ["/_next/static/x.js", "/api/files/abc?w=640", "/fonts/NotoSans-Regular.ttf", "/brand/mark.svg", "/icons/192.png", "/favicon.ico", "/api/health"]) {
      expect(siteRewritePath("www.example.in", path.split("?")[0]!, PROD), path).toBeNull();
    }
    // The enquiry form posts to /enquiry on its own host, rewritten like every page; no slug path passes (16 Oct 2026).
    expect(siteRewritePath("www.example.in", "/enquiry", PROD)).toBe("/sites/by-host/www.example.in/enquiry");
    expect(siteRewritePath("www.example.in", "/sites/zz-northgate-school", PROD)).toBe("/sites/by-host/www.example.in/sites/zz-northgate-school");
    expect(siteRewritePath("www.example.in", "/api/v1/public/sites/x/enquiry", PROD)).toBe("/sites/by-host/www.example.in/api/v1/public/sites/x/enquiry");
    expect(siteRewritePath("localhost:3000", "/", DEV)).toBeNull();
    expect(siteRewritePath("app.shalaghar.in", "/admin", PROD)).toBeNull();
    expect(siteRewritePath("www.example.in", "/api/healthz", PROD)).toBe("/sites/by-host/www.example.in/api/healthz");
  });

  it("⚠ decides every top-level entry of public/: served on a site host or deliberately not", () => {
    const passed = new Set([...SITE_PASS_PREFIXES.map((p) => p.replace(/^\/|\/$/g, "")), ...SITE_PASS_FILES.map((f) => f.slice(1)), ...DENIED_PUBLIC]);
    const undecided = readdirSync(join(process.cwd(), "public")).filter((name) => !name.startsWith(".") && !passed.has(name));
    expect(undecided, "a new public/ entry: add it to SITE_PASS_PREFIXES/SITE_PASS_FILES or DENIED_PUBLIC in site-host-match.ts").toEqual([]);
  });

  it("⚠ is imported by the middleware, and neither file imports anything (the edge)", () => {
    const middleware = readFileSync(join(process.cwd(), "src/middleware.ts"), "utf8");
    expect(middleware).toContain('from "@/lib/site-host-match"');
    for (const file of ["src/lib/site-host-match.ts", "src/lib/site-env.ts"]) {
      expect(readFileSync(join(process.cwd(), file), "utf8"), file).not.toMatch(/^import\s/m);
    }
  });
});

describe("what a school may type as its domain", () => {
  const env = { appHosts: ["app.shalaghar.in", "localhost:3000"], target: "sites.shalaghar.com" };
  it("accepts www.example.in and example.in, lowercase, and an internationalised name in punycode", () => {
    expect(canonicalDomain("www.Example.in", env)).toEqual({ ok: true, domain: "www.example.in" });
    expect(canonicalDomain(" example.in. ", env)).toEqual({ ok: true, domain: "example.in" });
    expect(canonicalDomain("school.ac.in", env)).toEqual({ ok: true, domain: "school.ac.in" });
    expect(canonicalDomain("शाळा.भारत", env)).toEqual({ ok: true, domain: "xn--w2bfyb.xn--h2brj9c" });
  });

  it("refuses a scheme, a path, a port, an address, a single label, the app's hosts and the CNAME target", () => {
    const reason = (s: string) => {
      const r = canonicalDomain(s, env);
      return r.ok ? "ok" : r.reason;
    };
    expect(reason("")).toBe("EMPTY");
    expect(reason("https://www.example.in")).toBe("SCHEME");
    expect(reason("www.example.in/admissions")).toBe("PATH");
    expect(reason("www.example.in?x=1")).toBe("PATH");
    expect(reason("www.example.in:8080")).toBe("INVALID");
    expect(reason("exa mple.in")).toBe("INVALID");
    expect(reason("example")).toBe("INVALID");
    expect(reason("-bad.example.in")).toBe("INVALID");
    expect(reason("203.0.113.9")).toBe("IP");
    expect(reason("app.shalaghar.in")).toBe("APP_HOST");
    expect(reason("zz.localhost")).toBe("APP_HOST");
    expect(reason("sites.shalaghar.com")).toBe("APP_HOST");
    // No platform subdomain any more: a name under the old sites domain is just a domain a school might own.
    expect(reason("zz-northgate-school.shalaghar.site")).toBe("ok");
  });

  it("tells a bare domain from a subdomain, India's second-level names included", () => {
    expect(isApex("example.in")).toBe(true);
    expect(isApex("www.example.in")).toBe(false);
    expect(isApex("school.ac.in")).toBe(true);
    expect(apexOf("www.school.co.in")).toBe("school.co.in");
    expect(counterpartOf("example.in")).toBe("www.example.in");
    expect(counterpartOf("www.example.in")).toBe("example.in");
    expect(counterpartOf("site.example.in")).toBeNull();
  });
});

describe("the middleware's rewrite (src/middleware.ts)", () => {
  it("rewrites a site host's page to /sites/by-host, keeps the query, and leaves the app's host alone", async () => {
    const { NextRequest } = await import("next/server");
    const { middleware } = await import("@/middleware");
    const saved = { APP_HOSTS: process.env.APP_HOSTS };
    process.env.APP_HOSTS = "localhost:3000,127.0.0.1:3000";
    try {
      const at = (url: string, host: string) => middleware(new NextRequest(url, { headers: { host } }));
      const site = at("http://www.example.in/?lang=hi", "www.example.in");
      expect(site.headers.get("x-middleware-rewrite")).toBe("http://www.example.in/sites/by-host/www.example.in?lang=hi");
      expect(at("http://www.example.in/login", "www.example.in").headers.get("x-middleware-rewrite")).toBe("http://www.example.in/sites/by-host/www.example.in/login");
      expect(at("http://www.example.in/api/files/f1?w=640", "www.example.in").headers.get("x-middleware-rewrite")).toBeNull();
      const app = at("http://localhost:3000/login", "localhost:3000");
      expect(app.headers.get("x-middleware-rewrite")).toBeNull();
      expect(app.headers.get("content-security-policy")).toContain("nonce-");
      // ⚠ The by-host routes are reached only through the rewrite: typed on the app's host they are the 404.
      const direct = at("http://localhost:3000/sites/by-host/www.example.in", "localhost:3000");
      expect(direct.status).toBe(404);
      expect(direct.headers.get("x-robots-tag")).toBe("noindex");
      expect(at("http://localhost:3000/sites/by-host/www.example.in/sitemap.xml", "localhost:3000").status).toBe(404);
      // The office's own view by slug passes on the app's host, under the site's no-script policy.
      const preview = at("http://localhost:3000/sites/zz-northgate-school", "localhost:3000");
      expect(preview.status).toBe(200);
      expect(preview.headers.get("content-security-policy")).toContain("default-src 'none'");
    } finally {
      for (const [k, v] of Object.entries(saved)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  });
});
