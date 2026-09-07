import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "@/middleware";

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
});
