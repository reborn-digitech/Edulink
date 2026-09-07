import { describe, expect, it } from "vitest";
import { z } from "zod";
import { fieldErrors, registerSchoolSchema, loginSchema } from "@/lib/validation";
import { translator } from "@/lib/i18n/dictionary";

/**
 * ⚠ THE ZOD DEFAULTS ANSWER IN THE READER'S LANGUAGE.
 *
 * A bare `.min(2)` used to answer "String must contain at least 2
 * character(s)" in English on a Marathi form — zod's words, not ours. The fix
 * lives at the `fieldErrors` chokepoint: the issue CODE is read, the bound is
 * spliced into a key, and `issue.message` survives only as the fallback for
 * shapes no schema in validation.ts produces. These tests pin each mapping,
 * in Marathi where a regression would actually be seen.
 */

const mr = translator("mr");
const en = translator("en");

const bounds = z.object({
  name: z.string().trim().min(2).max(120),
  points: z.number().min(0).max(100),
  tags: z.array(z.string()).min(1).max(8),
  bigTags: z.array(z.string()).min(3),
  status: z.enum(["PRESENT", "ABSENT"]),
});

function errsFor(input: unknown, t = mr) {
  const parsed = bounds.safeParse(input);
  if (parsed.success) throw new Error("expected a refusal");
  return fieldErrors(parsed.error, t);
}

describe("zod defaults are minted from keys, with the bound spliced in", () => {
  const ok = { name: "Asha", points: 50, tags: ["a"], bigTags: ["a", "b", "c"], status: "PRESENT" };

  it("a missing field says required, not 'Required'", () => {
    expect(errsFor({ ...ok, name: undefined }).name).toBe(mr("refusal.required"));
  });

  it("a too-short string carries its minimum", () => {
    expect(errsFor({ ...ok, name: "A" }).name).toBe(mr("refusal.atLeastChars", { count: 2 }));
  });

  it("min(1) on a string reads as required, not 'at least 1 character'", () => {
    const one = z.object({ v: z.string().min(1) }).safeParse({ v: "" });
    if (one.success) throw new Error("expected a refusal");
    expect(fieldErrors(one.error, mr).v).toBe(mr("refusal.required"));
  });

  it("a too-long string carries its maximum", () => {
    expect(errsFor({ ...ok, name: "x".repeat(130) }).name).toBe(
      mr("refusal.tooLongMax", { count: 120 }),
    );
  });

  it("number bounds carry the number", () => {
    expect(errsFor({ ...ok, points: -1 }).points).toBe(mr("refusal.numberAtLeast", { min: 0 }));
    expect(errsFor({ ...ok, points: 101 }).points).toBe(mr("refusal.numberAtMost", { max: 100 }));
  });

  it("array bounds distinguish one from many", () => {
    expect(errsFor({ ...ok, tags: [] }).tags).toBe(mr("refusal.addAtLeastOne"));
    expect(errsFor({ ...ok, bigTags: [] }).bigTags).toBe(mr("refusal.addAtLeastMany", { count: 3 }));
    expect(errsFor({ ...ok, tags: Array(9).fill("t") }).tags).toBe(
      mr("refusal.tooManyItems", { count: 8 }),
    );
  });

  it("a value outside an enum is 'not one of the choices'", () => {
    expect(errsFor({ ...ok, status: "TELEPORTED" }).status).toBe(mr("refusal.notValidChoice"));
  });

  it("a wrong TYPE — tampering, not typing — is refused as not valid", () => {
    expect(errsFor({ ...ok, name: 42 }).name).toBe(mr("refusal.notValid"));
  });

  it("without t, the English defaults still come through untranslated", () => {
    const parsed = bounds.safeParse({});
    if (parsed.success) throw new Error("expected a refusal");
    expect(fieldErrors(parsed.error).name).toBe("Required");
  });
});

describe("custom key messages still win over the code mapping", () => {
  it("the login schema's keyed messages arrive translated", () => {
    const parsed = loginSchema.safeParse({ identifier: "", password: "" });
    if (parsed.success) throw new Error("expected a refusal");
    const errs = fieldErrors(parsed.error, mr);
    expect(errs.identifier).toBe(mr("refusal.enterIdentifier"));
    expect(errs.password).toBe(mr("refusal.enterPassword"));
  });

  it("the register schema's consent key arrives translated, defaults beside it", () => {
    const parsed = registerSchoolSchema.safeParse({
      school: { name: "Z", contactEmail: "not-an-email", timezone: "Asia/Kolkata" },
      admin: { name: "Asha", email: "admin@example.org", password: "a-long-enough-password" },
      acceptedTerms: false,
    });
    if (parsed.success) throw new Error("expected a refusal");
    const errs = fieldErrors(parsed.error, en);
    expect(errs.acceptedTerms).toBe(en("refusal.acceptTerms"));
    expect(errs["school.contactEmail"]).toBe(en("register.enterValidEmail"));
    expect(errs["school.name"]).toBe(en("refusal.atLeastChars", { count: 2 }));
  });
});
