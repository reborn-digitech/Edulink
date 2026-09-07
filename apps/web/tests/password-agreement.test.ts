import { describe, expect, it } from "vitest";
import { passwordStrength } from "@/lib/password-strength";
import { passwordProblems } from "@/lib/crypto";

/**
 * The signup meter (client) and the server gate describe ONE rule. Nothing
 * pinned that they agree, and they had drifted: the meter tested the local
 * part of an email ("priya" from priya@school.org) and the gate did not, so
 * the meter said "contains your name" for a password the server then
 * accepted. Every case here must produce the same problem keys from both.
 */
const CASES: { password: string; context: string[] }[] = [
  { password: "short", context: [] },
  { password: "password1", context: [] },
  { password: "aaaaaaaaaaaa", context: [] },
  { password: " leading-space-1", context: [] },
  { password: "Priya12345!", context: ["Priya Sharma"] },
  { password: "priya12345!", context: ["priya@school.org"] },
  { password: "Sharma-is-here-2026", context: ["Priya Sharma"] },
  { password: "Correct Horse Battery", context: ["priya@school.org"] },
  { password: "x".repeat(201), context: [] },
  { password: "fine-and-long-enough-9", context: ["ann@x.org"] },
];

describe("password meter and server gate agree", () => {
  for (const { password, context } of CASES) {
    it(`agrees on ${JSON.stringify(password.slice(0, 12))} with context ${JSON.stringify(context)}`, () => {
      expect(passwordStrength(password, context).problemKeys).toEqual(passwordProblems(password, context));
    });
  }

  it("the meter scores a good password above a weak one", () => {
    expect(passwordStrength("Correct Horse Battery 9!").score).toBeGreaterThan(passwordStrength("abcdefghij").score);
  });
});
