import { describe, expect, it } from "vitest";
import { INSIGHT_CTAS, insightCtaSchema } from "./index";

/**
 * A call to action's href is one of our own web paths (A3-S-14, audit of
 * 5 October 2026): the phone opens it on the API's host, so a single-slash
 * path only — "@evil.example/x" or "//host" would move the host.
 */
describe("insightCtaSchema.href", () => {
  const cta = (href: string) => insightCtaSchema.safeParse({ code: "PEOPLE", href, roles: ["ADMIN"], label: "People and invitations — the office" });
  it("takes every coded CTA's path", () => {
    for (const [code, c] of Object.entries(INSIGHT_CTAS)) expect({ code, ok: cta(c.href).success }).toEqual({ code, ok: true });
  });
  it("refuses a path that could move the host or is not a path", () => {
    for (const bad of ["@evil.example/x", "//evil.example/x", "/\\evil.example", "\\\\evil.example", "/\t/evil.example", "https://evil.example/x", "javascript:alert(1)", "admin/people", ""]) {
      expect({ bad, ok: cta(bad).success }).toEqual({ bad, ok: false });
    }
  });
});
