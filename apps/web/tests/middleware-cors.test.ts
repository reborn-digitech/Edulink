import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { config, middleware } from "@/middleware";

/** Only named origins, only preflights they send, nothing added for anyone else. */
describe("CORS on /api/v1", () => {
  beforeAll(() => {
    process.env.API_CORS_ORIGINS = "http://localhost:8081";
  });
  afterAll(() => {
    delete process.env.API_CORS_ORIGINS;
  });
  const req = (method: string, origin?: string) => new NextRequest("http://localhost:3000/api/v1/me", { method, headers: origin ? { origin } : {} });

  it("answers a preflight from the development app origin and refuses a stranger's", async () => {
    const ok = middleware(req("OPTIONS", "http://localhost:8081"));
    expect(ok.status).toBe(204);
    expect(ok.headers.get("access-control-allow-origin")).toBe("http://localhost:8081");
    expect(ok.headers.get("access-control-allow-headers")).toContain("Authorization");
    expect(middleware(req("OPTIONS", "https://evil.example")).status).toBe(403);
  });

  it("adds the allow-origin header to a real request only for a named origin", () => {
    expect(middleware(req("GET", "http://localhost:8081")).headers.get("access-control-allow-origin")).toBe("http://localhost:8081");
    expect(middleware(req("GET", "https://evil.example")).headers.get("access-control-allow-origin")).toBeNull();
    expect(middleware(req("GET")).headers.get("access-control-allow-origin")).toBeNull();
  });

  it("covers the API and the files it names, and nothing else under /api", () => {
    // A picture in a post is fetched with the bearer token, so the browser asks first: the same answer, the same list of origins.
    // The middleware sees every request but Next's own files (A3-S-3, tests/csp.test.ts); CORS_PATHS picks the doors
    // CORS answers at, so a path outside them gets no CORS header (below).
    expect(config.matcher).toEqual(["/((?!_next/).*)"]);
    // An API path outside those doors passes through with nothing added, whoever asks.
    const other = middleware(new NextRequest("http://localhost:3000/api/push", { method: "OPTIONS", headers: { origin: "http://localhost:8081" } }));
    expect(other.status).toBe(200);
    expect(other.headers.get("access-control-allow-origin")).toBeNull();
    // The three cookie doors take the Origin lock and no CORS: a cross-site
    // POST with the session cookie is refused, the app's own page and a
    // bearer call (no cookie) pass, and no origin is ever named back.
    for (const path of ["/api/push", "/api/practice/answer", "/api/auth/logout"]) {
      const locked = (origin: string, cookie: boolean) =>
        middleware(new NextRequest(`http://localhost:3000${path}`, { method: "POST", headers: { origin, host: "localhost:3000", ...(cookie ? { cookie: "edulink_session=x" } : {}) } }));
      expect(locked("https://evil.example", true).status, path).toBe(403);
      expect(locked("http://localhost:3000", true).status, path).toBe(200);
      expect(locked("https://evil.example", false).status, path).toBe(200);
      expect(locked("http://localhost:8081", true).headers.get("access-control-allow-origin"), path).toBeNull();
    }
    const file = (method: string, origin: string) => new NextRequest("http://localhost:3000/api/files/abc.png?w=640", { method, headers: { origin } });
    expect(middleware(file("OPTIONS", "http://localhost:8081")).status).toBe(204);
    expect(middleware(file("OPTIONS", "https://evil.example")).status).toBe(403);
    expect(middleware(file("GET", "https://evil.example")).headers.get("access-control-allow-origin")).toBeNull();
  });

  it("with nothing configured and outside development, names no origin at all", () => {
    const saved = process.env.API_CORS_ORIGINS;
    delete process.env.API_CORS_ORIGINS;
    try {
      expect(process.env.NODE_ENV).not.toBe("development");
      expect(middleware(req("OPTIONS", "http://localhost:8081")).status).toBe(403);
      expect(middleware(req("GET", "http://localhost:8081")).headers.get("access-control-allow-origin")).toBeNull();
    } finally {
      process.env.API_CORS_ORIGINS = saved;
    }
  });
});
