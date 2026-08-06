import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { normaliseLocale } from "@/lib/i18n/locales";

/**
 * ⚠ THE LANGUAGE YOU SIGNED UP IN IS THE LANGUAGE YOU GET.
 *
 * Every account-creation path in this app wrote a fixed language onto the new
 * user. A head teacher who read the landing page in Marathi, filled the
 * registration form in in Marathi and pressed the button was signed straight
 * into an English dashboard — and the way back was a settings page they now
 * could not read. The same line appeared FIVE times: register, student join,
 * guardian sign-up, accepting a school invitation, and accepting an expert one
 * (that last wrote `prefs: "{}"`, which is the same bug wearing a different
 * hat, since an absent locale resolves to English).
 *
 * WHY A TEST AND NOT A WALKTHROUGH. The bug is invisible on the page that
 * causes it — the form renders in Marathi either way, and the damage only shows
 * on the NEXT page, after a redirect. That is exactly the shape of thing a
 * browser walkthrough skims past, and one assignment per file is exactly the
 * shape of thing a careless edit puts back.
 *
 * ⚠ WHAT THIS DELIBERATELY DOES NOT DO, AND WHY — because the first version did
 * it and was flaky. It does not call `getLocale()`. That function is wrapped in
 * React `cache()`, which memoises per request scope, and outside a render there
 * is no request scope: whether a second call re-resolves or replays the first
 * depends on what else ran in the same worker. Asserting three cookie values
 * through it in a loop passed alone and failed about one full-suite run in
 * eight. A test that reports the scheduler is worse than no test.
 *
 * So the cookie-to-locale wiring is proven where it is deterministic:
 * `normaliseLocale` below, which is pure, and thirty real HTTP renders of the
 * signed-out pages against a running server, each of which resolves its
 * language through `getLocale()` and nothing else. What is left here is the
 * part a unit test is genuinely good at — the pure mapping, and a structural
 * guard on the call sites.
 */

describe("⚠ a new account keeps the language it was created in", () => {
  it("maps a cookie value to a language we have", () => {
    expect(normaliseLocale("hi")).toBe("hi");
    expect(normaliseLocale("mr")).toBe("mr");
    expect(normaliseLocale("en")).toBe("en");
    // A region tag is not a different language. A browser or an older cookie
    // may carry one, and dropping to English for "mr-IN" would be the same
    // defect this file exists for.
    expect(normaliseLocale("mr-IN")).toBe("mr");
    expect(normaliseLocale("hi_IN")).toBe("hi");
  });

  it("falls back to English for nothing, or for a language we do not have", () => {
    expect(normaliseLocale(undefined)).toBe("en");
    expect(normaliseLocale(null)).toBe("en");
    expect(normaliseLocale("")).toBe("en");
    // This fallback is what made the bug invisible: `prefs: "{}"` lands here.
    expect(normaliseLocale("kl")).toBe("en");
  });

  /**
   * ⚠ THE GUARD THAT ACTUALLY STOPS THE REGRESSION.
   *
   * The mapping above cannot prove the call sites use it. This reads them. A
   * literal `locale: "en"` in an account creation is the exact line that was
   * wrong five times over, and it must not come back — including in a sixth
   * path somebody adds next year.
   */
  it("⚠ no account-creation path hardcodes a locale", () => {
    function walk(dir: string): string[] {
      const out: string[] = [];
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) out.push(...walk(path));
        else if (path.endsWith(".ts") || path.endsWith(".tsx")) out.push(path);
      }
      return out;
    }

    const offenders: string[] = [];
    for (const file of [...walk("src/app"), ...walk("src/lib")]) {
      const source = readFileSync(file, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      // `prefs: writeJson({ … locale: "en" … })` — the shape of the bug.
      const hardcoded = /prefs:\s*writeJson\(\{[^}]*locale:\s*["'][a-z]{2}["']/s.test(source);
      // `prefs: "{}"` on a create is the same bug wearing a different hat:
      // no locale resolves to English, so the account comes out English.
      const empty = /prefs:\s*"\{\}"/.test(source);
      if (hardcoded || empty) offenders.push(file);
    }

    expect(
      offenders,
      "These write a fixed language onto a brand-new account. Read it from " +
        "`getLocale()` instead — the reader chose it on the page they were just on.",
    ).toEqual([]);
  });
});
