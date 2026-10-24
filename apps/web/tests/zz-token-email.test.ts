/**
 * A3-S-15 (5 Oct 2026, risks batch): zz-token's RECRUITER branch minted a
 * session for whichever recruiter the email on the line named. Every branch
 * that takes an email now asks scripts/fixture-email.ts first.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { assertFixtureEmail, isFixtureEmail } from "../scripts/fixture-email";

describe("whose session zz-token may mint", () => {
  it("a ZZ fixture person or a demo account, and nobody else", () => {
    for (const ok of ["zz.recruiter01@zz.test", "sac.tpo@demo.relay.test", " ZZ.Admin@ZZ.TEST "]) expect(isFixtureEmail(ok)).toBe(true);
    for (const no of ["hr@realcompany.com", "someone@zz.test.example.com", "a@zz.test@gmail.com", "zz.test", "x@demo.relay.test.evil.io", ""]) expect(isFixtureEmail(no)).toBe(false);
    expect(() => assertFixtureEmail("hr@realcompany.com")).toThrow("only ZZ and demo people");
  });

  it("the RECRUITER branch, like the others that take an email, asks before it looks anybody up", () => {
    const src = readFileSync(join(process.cwd(), "scripts", "zz-token.ts"), "utf8");
    const recruiter = src.slice(src.indexOf('role === "RECRUITER") {'), src.indexOf('role === "ADMIN" || role === "PRINCIPAL"'));
    expect(recruiter).toMatch(/if \(email\) assertFixtureEmail\(email\);[\s\S]*recruiterProfile\.findFirstOrThrow/);
    // No branch keeps its own copy of the rule.
    expect(src).not.toMatch(/endsWith\("@zz\.test"\) && !email\.endsWith/);
    expect(src.match(/assertFixtureEmail\(email\)/g)?.length).toBe(4);
  });

  // fix-lows-D (QA-74): `zz:token EXPERT zz.expert2@zz.test` minted zz.expert1's (or any ZZ expert's) session: the
  // EXPERT branch ignored the email. It now asks first and looks the profile up by that address; unnamed, it picks the
  // first ZZ expert by address, so the answer no longer depends on the table's order.
  it("the EXPERT branch honours the email it is given, and picks zz.expert1 when given none", () => {
    const src = readFileSync(join(process.cwd(), "scripts", "zz-token.ts"), "utf8");
    const expert = src.slice(src.indexOf('role === "EXPERT") {'), src.indexOf('role === "OPERATOR" || role === "APPADMIN") {'));
    expect(expert).toMatch(/if \(email\) assertFixtureEmail\(email\);[\s\S]*expertProfile\.findFirstOrThrow/);
    expect(expert).toMatch(/where: \{ user: email \? \{ email \} :/);
    expect(expert).toMatch(/orderBy: \{ user: \{ email: "asc" \} \}/);
  });
});
