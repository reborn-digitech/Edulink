/**
 * The ID-check page's promise: finding TA-430 of the testing analysis of
 * 13 November 2026, held by a case that FAILS while the defect stands and
 * passes once it is fixed.
 *
 *   TA-430  Signed out, /id-check said "you will come back here" and linked to
 *           /login?next=…, and the sign-in never reads next (by design: it is
 *           why the login has no open redirect), so the guard landed on their
 *           role's home and had to scan the card again.
 *
 * The page now says what happens — sign in, then scan the card again — and
 * sends no parameter the sign-in would drop. Read from the source and the
 * dictionaries, as tests/router-nudge.test.ts reads src: the page renders
 * outside a request only with a session store this suite does not have.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { en } from "@edulink/i18n/en";

const page = readFileSync(resolve(__dirname, "../src/app/id-check/page.tsx"), "utf8");
const login = readFileSync(resolve(__dirname, "../src/app/login/page.tsx"), "utf8");

describe("TA-430: the ID-check page promises only what the sign-in does", () => {
  it("TA-430: signed out, the page neither sends next nor says the guard will come back, while the sign-in reads no next", () => {
    // The sign-in takes no `next` (no open redirect), so nothing may promise one.
    expect(/const \{[^}]*\bnext\b[^}]*\} = await searchParams/.test(login)).toBe(false);
    expect(page).not.toContain("/login?next=");
    const signInBlock = page.slice(page.indexOf('view.state === "signIn"'), page.indexOf('view.state === "staffOnly"'));
    const keys = [...signInBlock.matchAll(/t\("collegeDesks\.(\w+)"\)/g)].map((m) => m[1]!);
    const desks = (en as unknown as { collegeDesks: Record<string, string> }).collegeDesks;
    const said = keys.map((k) => desks[k] ?? "").join(" ");
    expect(said).not.toMatch(/come back here/i);
    expect(said).toMatch(/scan/i);
  });
});
