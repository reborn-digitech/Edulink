/**
 * THE SITE-HOST MATCHER (website-builder B, 15 October 2026; src/lib/site-host-match.ts, read by the edge
 * middleware). Which hosts are a school website's, which paths a site host passes through, what the rewrite is, and
 * what a school may type as its own domain. Pure: no database, no network.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { apexOf, canonicalDomain, counterpartOf, DENIED_PUBLIC, isApex, isSiteHost, normaliseHost, siteRewritePath, slugOfSiteHost, SITE_PASS_FILES, SITE_PASS_PREFIXES, type HostEnv } from "./site-host-match";
import { appHosts, appHostsKnown, flyConfig, siteApexIp, siteDomain, sitesTarget } from "./site-env";

const DEV: HostEnv = { siteDomain: "shalaghar.site", appHosts: ["localhost:3000", "127.0.0.1:3000"], appHostsKnown: true, dev: true };
const PROD: HostEnv = { siteDomain: "shalaghar.site", appHosts: ["app.shalaghar.in", "edulink-web.fly.dev"], appHostsKnown: true, dev: false };
const PROD_UNSET: HostEnv = { siteDomain: "shalaghar.site", appHosts: [], appHostsKnown: false, dev: false };

describe("the environment", () => {
  it("defaults SITE_DOMAIN and reads APP_HOSTS, with the development default only in development", () => {
    expect(siteDomain({})).toBe("shalaghar.site");
    expect(siteDomain({ SITE_DOMAIN: " .Sites.Example.IN. " })).toBe("sites.example.in");
    expect(sitesTarget({ SITE_DOMAIN: "x.in" })).toBe("sites.x.in");
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

  it("a subdomain of SITE_DOMAIN, <slug>.localhost in development, and any other named host once APP_HOSTS is known", () => {
    expect(isSiteHost("zz-northgate-school.shalaghar.site", PROD)).toBe(true);
    expect(isSiteHost("zz-northgate-school.localhost:3000", DEV)).toBe(true);
    expect(isSiteHost("zz-northgate-school.localhost:3000", PROD)).toBe(false);
    expect(isSiteHost("www.zz-northgate.test", DEV)).toBe(true);
    expect(isSiteHost("www.example.in", PROD)).toBe(true);
  });

  it("⚠ with APP_HOSTS unset in production, only the sites' own subdomains: the app is never served as a website", () => {
    expect(isSiteHost("app.shalaghar.in", PROD_UNSET)).toBe(false);
    expect(isSiteHost("www.example.in", PROD_UNSET)).toBe(false);
    expect(isSiteHost("abc.shalaghar.site", PROD_UNSET)).toBe(true);
  });

  it("reads the slug of a sites subdomain", () => {
    expect(slugOfSiteHost("zz-northgate-school.shalaghar.site", PROD)).toBe("zz-northgate-school");
    expect(slugOfSiteHost("zz-northgate-school.localhost:3000", DEV)).toBe("zz-northgate-school");
    expect(slugOfSiteHost("a.b.shalaghar.site", PROD)).toBeNull();
    expect(slugOfSiteHost("www.example.in", PROD)).toBeNull();
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
    for (const path of ["/_next/static/x.js", "/api/files/abc?w=640", "/fonts/NotoSans-Regular.ttf", "/brand/mark.svg", "/icons/192.png", "/favicon.ico", "/sites/zz-northgate-school/enquiry", "/api/health", "/api/v1/public/sites/x/enquiry"]) {
      expect(siteRewritePath("www.example.in", path.split("?")[0]!, PROD), path).toBeNull();
    }
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
  const env = { siteDomain: "shalaghar.site", appHosts: ["app.shalaghar.in", "localhost:3000"] };
  it("accepts www.example.in and example.in, lowercase, and an internationalised name in punycode", () => {
    expect(canonicalDomain("www.Example.in", env)).toEqual({ ok: true, domain: "www.example.in" });
    expect(canonicalDomain(" example.in. ", env)).toEqual({ ok: true, domain: "example.in" });
    expect(canonicalDomain("school.ac.in", env)).toEqual({ ok: true, domain: "school.ac.in" });
    expect(canonicalDomain("शाळा.भारत", env)).toEqual({ ok: true, domain: "xn--w2bfyb.xn--h2brj9c" });
  });

  it("refuses a scheme, a path, a port, an address, a single label, the app's hosts and SITE_DOMAIN", () => {
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
    expect(reason("shalaghar.site")).toBe("SITE_DOMAIN");
    expect(reason("zz-northgate-school.shalaghar.site")).toBe("SITE_DOMAIN");
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
    const saved = { APP_HOSTS: process.env.APP_HOSTS, SITE_DOMAIN: process.env.SITE_DOMAIN };
    process.env.APP_HOSTS = "localhost:3000,127.0.0.1:3000";
    process.env.SITE_DOMAIN = "shalaghar.site";
    try {
      const at = (url: string, host: string) => middleware(new NextRequest(url, { headers: { host } }));
      const site = at("http://www.example.in/?lang=hi", "www.example.in");
      expect(site.headers.get("x-middleware-rewrite")).toBe("http://www.example.in/sites/by-host/www.example.in?lang=hi");
      expect(at("http://abc.shalaghar.site/login", "abc.shalaghar.site").headers.get("x-middleware-rewrite")).toBe("http://abc.shalaghar.site/sites/by-host/abc.shalaghar.site/login");
      expect(at("http://www.example.in/api/files/f1?w=640", "www.example.in").headers.get("x-middleware-rewrite")).toBeNull();
      const app = at("http://localhost:3000/login", "localhost:3000");
      expect(app.headers.get("x-middleware-rewrite")).toBeNull();
      expect(app.headers.get("content-security-policy")).toContain("nonce-");
    } finally {
      for (const [k, v] of Object.entries(saved)) {
        if (v === undefined) delete process.env[k];
        else process.env[k] = v;
      }
    }
  });
});
