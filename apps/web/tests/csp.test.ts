/**
 * The Content Security Policy and the two things beside it: what a page is
 * promised, what everything else is, and that the middleware mints a nonce
 * per response and tells both the page and the browser the same one.
 */
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { contentSecurityPolicy, isPage, NONCE_HEADER } from "@/lib/csp";
import { config, middleware } from "@/middleware";

const directive = (policy: string, name: string) => policy.split("; ").find((d) => d.startsWith(`${name} `)) ?? "";

describe("the policy", () => {
  it("⚠ a page's scripts run by nonce, and nothing inline runs without it", () => {
    const policy = contentSecurityPolicy({ nonce: "abc123", dev: false });
    const script = directive(policy, "script-src");
    expect(script).toContain("'nonce-abc123'");
    expect(script).toContain("'strict-dynamic'");
    expect(script).not.toContain("'unsafe-inline'");
    expect(script).not.toContain("'unsafe-eval'");
    // The school's gateway's checkout stays named, for a browser that does not know 'strict-dynamic'.
    expect(script).toContain("https://checkout.razorpay.com");
  });

  it("everything that is not a page has no nonce and no inline script at all", () => {
    const script = directive(contentSecurityPolicy({ dev: false }), "script-src");
    expect(script).toBe("script-src 'self' https://checkout.razorpay.com");
  });

  it("keeps what it closed before: no framing, no plugins, forms and base to this host only", () => {
    const policy = contentSecurityPolicy({ nonce: "n", dev: false });
    for (const d of ["default-src 'self'", "frame-ancestors 'none'", "object-src 'none'", "form-action 'self'", "base-uri 'self'"]) expect(policy.split("; ")).toContain(d);
    expect(directive(policy, "connect-src")).not.toContain("ws:");
  });

  it("development adds eval and the websocket the dev server needs, and nothing else", () => {
    const dev = contentSecurityPolicy({ nonce: "n", dev: true });
    expect(directive(dev, "script-src")).toContain("'unsafe-eval'");
    expect(directive(dev, "script-src")).not.toContain("'unsafe-inline'");
    expect(directive(dev, "connect-src")).toContain("ws:");
  });
});

describe("what is a page", () => {
  it("documents are; the API, Next's files and anything with an extension are not", () => {
    for (const p of ["/", "/login", "/bulletin/cmabc", "/root/abc/inside", "/certificate/x", "/offline"]) expect(isPage(p), p).toBe(true);
    for (const p of ["/api/health", "/api/v1/me", "/api/files/a.png", "/_next/static/chunks/x.js", "/sw.js", "/manifest.webmanifest", "/icons/icon-192.png", "/favicon.ico"]) expect(isPage(p), p).toBe(false);
  });

  it("the matcher sends the middleware every page, the three CORS doors and the three locked cookie doors, and nothing else under /api", () => {
    expect(config.matcher).toHaveLength(7);
    expect(config.matcher.slice(1)).toEqual(["/api/v1/:path*", "/api/attendance", "/api/files/:path*", "/api/push", "/api/practice/:path*", "/api/auth/:path*"]);
  });
});

describe("the middleware, on a page", () => {
  const get = (path: string) => middleware(new NextRequest(`http://localhost:3000${path}`));
  const nonceOf = (policy: string | null) => policy?.match(/'nonce-([^']+)'/)?.[1] ?? null;

  it("⚠ mints a nonce, puts it in the response's policy, and hands the page the same one", () => {
    const response = get("/login");
    const nonce = nonceOf(response.headers.get("content-security-policy"));
    expect(nonce).toMatch(/^[A-Za-z0-9+/]{22}==$/);
    // What Next and the layout read: the request's headers, carried on the response as overrides.
    expect(response.headers.get(`x-middleware-request-${NONCE_HEADER}`)).toBe(nonce);
    expect(nonceOf(response.headers.get("x-middleware-request-content-security-policy"))).toBe(nonce);
  });

  it("⚠ never the same nonce twice", () => {
    const seen = new Set(Array.from({ length: 50 }, () => nonceOf(get("/").headers.get("content-security-policy"))));
    expect(seen.size).toBe(50);
  });

  it("writes no nonce on the API, whose policy is the nonce-less one from the config", () => {
    expect(get("/api/v1/me").headers.get("content-security-policy")).toBeNull();
    expect(get("/api/health").headers.get("content-security-policy")).toBeNull();
  });
});

describe("the session cookie's name", () => {
  it("is plain in development and under test; production's carries the __Host- prefix", async () => {
    const { SESSION_COOKIE } = await import("@/lib/constants");
    expect(process.env.NODE_ENV).not.toBe("production");
    expect(SESSION_COOKIE).toBe("edulink_session");
  });
});
