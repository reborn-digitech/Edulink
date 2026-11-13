/**
 * TA-247 (testing analysis of 13 November 2026, Medium): two patterns run over one pasted cell take
 * quadratic time, and Node runs a pattern on the one thread that serves every school.
 *
 *   The address pattern /^[^@\s]+@[^@\s]+\.[^@\s]+$/ (src/lib/csv.ts, the invite and intake parsers,
 *   and src/lib/parent-link.ts) on "a@", a long run of dots, then "@".
 *   The accession pattern /^(.*?)(\d+)$/ (accessionsOf, src/lib/library.ts) on a long run of digits
 *   followed by a letter.
 *
 * Each case times one parse of a cell of 60,000 characters (about two seconds of backtracking on
 * today's code on this machine, growing with the square of the length; the bodies admit 500,000) and
 * expects it to finish in a fraction of a second with the row refused. No database.
 */
import { describe, expect, it } from "vitest";
import { parseInviteCsv, parseIntakeCsv } from "@/lib/csv";
import { accessionsOf } from "@/lib/library";
import { inviteParent } from "@/lib/parent-link";
import type { ActiveContext } from "@/lib/session";

const N = 60_000;
const DOTS = `a@${".".repeat(N)}@`;
const BUDGET_MS = 200;

function timed<T>(run: () => T): { value: T; ms: number } {
  const start = performance.now();
  const value = run();
  return { value, ms: performance.now() - start };
}

describe("TA-247: a pasted cell cannot hold the server's thread", () => {
  it("TA-247: parseInviteCsv with an email header refuses the long cell at once", () => {
    const { value, ms } = timed(() => parseInviteCsv(`email\n${DOTS}`));
    expect(ms).toBeLessThan(BUDGET_MS);
    expect(value.valid).toEqual([]);
    expect(value.problems.map((p) => p.reasonKey)).toEqual(["invites.emailTooLong"]);
  });

  it("TA-247: parseInviteCsv on a headerless paste refuses the long cell at once", () => {
    const { value, ms } = timed(() => parseInviteCsv(`ZZ Asha,${DOTS}`));
    expect(ms).toBeLessThan(BUDGET_MS);
    expect(value.valid).toEqual([]);
    expect(value.problems).toHaveLength(1);
  });

  it("TA-247: parseIntakeCsv refuses a long pupil email and a long guardian email at once", () => {
    const pupil = timed(() => parseIntakeCsv(`name,pupil email\nZZ Asha,${DOTS}`, "2026-11-13"));
    expect(pupil.ms).toBeLessThan(BUDGET_MS);
    expect(pupil.value.valid).toEqual([]);
    expect(pupil.value.problems.map((p) => p.reasonKey)).toEqual(["invites.invalidEmail"]);
    const guardian = timed(() => parseIntakeCsv(`name,guardian email\nZZ Asha,${DOTS}`, "2026-11-13"));
    expect(guardian.ms).toBeLessThan(BUDGET_MS);
    expect(guardian.value.valid).toEqual([]);
    expect(guardian.value.problems.map((p) => p.reasonKey)).toEqual(["intake.badGuardianEmail"]);
  });

  it("TA-247: ordinary addresses still pass both parsers", () => {
    expect(parseInviteCsv("email\nzz.teacher@zz.test").valid.map((r) => r.email)).toEqual(["zz.teacher@zz.test"]);
    expect(parseInviteCsv("ZZ Asha,zz.asha@zz.test").valid.map((r) => r.email)).toEqual(["zz.asha@zz.test"]);
    const intake = parseIntakeCsv("name,pupil email,guardian email\nZZ Asha,zz.asha@zz.test,zz.parent@zz.test", "2026-11-13");
    expect(intake.problems).toEqual([]);
    expect(intake.valid).toHaveLength(1);
  });

  it("TA-247: inviteParent (the office's parent link, whose server action caps no length) refuses the long address at once", async () => {
    const office = { sessionId: "test", membershipId: "zz-none", schoolId: "zz-none", role: "ADMIN", user: { id: "zz-none" } } as unknown as ActiveContext;
    const start = performance.now();
    const result = await inviteParent(office, "zz-none", { email: DOTS, name: "", relation: "MOTHER" as never });
    expect(performance.now() - start).toBeLessThan(BUDGET_MS);
    expect(result).toEqual({ ok: false, errorKey: "refusal.thatIsNotAnEmailAddress" });
  });

  it("TA-247: accessionsOf refuses a long run of digits followed by a letter at once", () => {
    const { value, ms } = timed(() => accessionsOf(`${"1".repeat(N)}x`, 2));
    expect(ms).toBeLessThan(BUDGET_MS);
    expect(value).toBeNull();
  });

  it("TA-247: accessionsOf still counts on from a short accession", () => {
    expect(accessionsOf("B-0098", 3)).toEqual(["B-0098", "B-0099", "B-0100"]);
  });
});
