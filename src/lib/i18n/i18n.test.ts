import { describe, expect, it } from "vitest";
import { en } from "./en";
import { DICTIONARIES, format, resolve, translator, type Dictionary } from "./dictionary";
import { LOCALES, normaliseLocale, localeMeta } from "./locales";
import { NAV, PRIMARY_ACTION, QUICK_ACTIONS } from "../nav";
import { ROLES, ROLE_META } from "../constants";

/**
 * The dictionaries, checked for the things TypeScript cannot see.
 *
 * The `Dictionary` annotation on `hi` and `mr` already makes a MISSING key a
 * build error, so none of the tests below need to re-check that. What the type
 * system cannot notice is a key that is present and wrong: an empty string, an
 * English value pasted in and never translated, or — the one that actually bit
 * every i18n project I have seen — a translation that quietly drops a `{count}`
 * placeholder and renders "Notifications, unread" forever.
 *
 * Those three are the whole point of this file.
 */

/** Flattens to `"nav.practice" -> "Practice"`, which is how `t` addresses it. */
function flatten(node: Record<string, unknown>, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") out.set(path, value);
    else for (const [k, v] of flatten(value as Record<string, unknown>, path)) out.set(k, v);
  }
  return out;
}

const FLAT = new Map(LOCALES.map((l) => [l.code, flatten(DICTIONARIES[l.code])] as const));
const ENGLISH = flatten(en);

/**
 * Values that are the SAME in every language, for a reason.
 *
 * An example email address is not prose. Translating "you@school.org" produces
 * an address that reads as native and does not exist, which is worse than one
 * that reads as foreign and is obviously a placeholder.
 *
 * Everything not listed here must differ from English in every other language.
 * That check is what catches the real failure mode: a key copied from `en.ts`
 * into `hi.ts` during a hurried addition and never actually translated.
 */
const SHARED_WITH_ENGLISH = new Set([
  "login.emailPlaceholder",
  /**
   * A DATE MASK IS NOT PROSE. `dd/mm/yyyy` is the shape of what to type, and the
   * letters are the widely-understood mnemonic — translating them to दद/मम/वववव
   * would produce a pattern nobody has seen on a form, on a passport or on a
   * bank slip. The words AROUND it are translated (`field.dateHint` says day,
   * month and year in the reader's own language); the mask stays put.
   */
  "field.datePlaceholder",
  /**
   * An EXAMPLE ADDRESS, on the same grounds as `login.emailPlaceholder` above.
   * A reader typing their school's real URL over it is helped by seeing the
   * shape of one; `your-school` is not a word being withheld from them.
   */
  "settings.websitePlaceholder",
  /**
   * AN IANA TIME ZONE IDENTIFIER, which is an ASCII key in a global database
   * and not a word. `Asia/Kolkata` is what the field must contain to work — the
   * expert types their real zone over it, and every zone in the list is spelt
   * this way whatever language is reading. एशिया/कोलकाता would be a placeholder
   * showing the shape of something the input cannot accept.
   *
   * The sentence around it IS translated: `expert.timezoneHint` explains what
   * the field is for in the reader's own language. A key rather than a literal
   * so a deployment outside India can suggest its own zone.
   */
  "expert.timezonePlaceholder",
  /**
   * EXAMPLE ADDRESSES ON THE REGISTRATION FORM, on exactly the grounds
   * `login.emailPlaceholder` and `settings.websitePlaceholder` are already here
   * for: a head teacher typing their school's real address over the top is
   * helped by seeing the shape of one, and `riverside.school` is not a word
   * being withheld from them. The NAMES beside them are translated —
   * `register.schoolNamePlaceholder` and `register.yourNamePlaceholder` read as
   * रिवरसाइड and प्रिया, because those are words.
   */
  "register.contactEmailPlaceholder",
  "register.websitePlaceholder",
  "register.yourEmailPlaceholder",
  /**
   * URL SCHEMES. `https://…` is the shape the input must start with to be
   * accepted at all — the validation refuses anything else — and a scheme is
   * ASCII protocol syntax, not a word. The hint sentences around both ARE
   * translated (`competitions.linkToWork`, `competitions.externalUrlHint`).
   */
  "competitions.urlPlaceholder",
  "competitions.exampleUrlPlaceholder",
  /**
   * An EXAMPLE ADDRESS on the guardian sign-up, same grounds as the three
   * above.
   */
  "join.genericEmailPlaceholder",
  /**
   * A CODE MASK, not prose — the same argument as `field.datePlaceholder`.
   * `ABC-1234` shows the shape of what to type, and join codes are generated
   * from ASCII letters and digits: अबक-१२३४ would be a pattern the input
   * cannot accept and no teacher has ever written on a board.
   */
  "join.codePlaceholder",
]);

const placeholdersIn = (value: string): Set<string> =>
  new Set([...value.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!));

/**
 * A value with no letters of its own — `"{period}, {day}"`, `"{label} ({count})"`.
 *
 * ⚠ A RULE RATHER THAN A LIST, and the difference matters. These arrived when
 * the admin surface needed strings that join two already-translated pieces, and
 * the two checks below both flagged them: identical to English (of course — a
 * comma is a comma) and containing no Devanagari (of course — it contains no
 * letters at all). Adding each one to `SHARED_WITH_ENGLISH` would have worked
 * and would have been a lie: that set means "a word we are deliberately not
 * translating", and there is no word here. A predicate keeps the next one from
 * needing a decision.
 *
 * Deliberately narrow. The moment a template carries ONE real word —
 * `"{count} students"` — it has letters and both checks apply again.
 */
function isPureTemplate(value: string): boolean {
  return !/\p{L}/u.test(value.replace(/\{\w+\}/g, ""));
}

describe("every language says the same things", () => {
  it("has a dictionary for every language offered in the switcher", () => {
    for (const language of LOCALES) {
      expect(DICTIONARIES[language.code], `no dictionary for ${language.code}`).toBeDefined();
    }
  });

  it("⚠ has exactly the English key set — no missing keys and no strays", () => {
    // The type catches missing. This also catches a key that survived a rename
    // in one file and not another, which the type does not.
    for (const [code, flat] of FLAT) {
      expect([...flat.keys()].sort(), `${code} key set`).toEqual([...ENGLISH.keys()].sort());
    }
  });

  it("⚠ has no blank value anywhere", () => {
    // A blank renders as a button with no words on it — the failure that looks
    // like a layout bug and gets debugged in CSS for an hour.
    for (const [code, flat] of FLAT) {
      const blank = [...flat].filter(([, value]) => value.trim().length === 0).map(([k]) => k);
      expect(blank, `${code} has blank values`).toEqual([]);
    }
  });
});

describe("⚠ nothing was left in English by accident", () => {
  it.each(LOCALES.filter((l) => l.code !== "en"))("$english translates every string", (language) => {
    const flat = FLAT.get(language.code)!;
    const untranslated = [...flat]
      .filter(([key]) => !SHARED_WITH_ENGLISH.has(key))
      .filter(([, value]) => !isPureTemplate(value))
      .filter(([key, value]) => value === ENGLISH.get(key))
      .map(([key]) => key);

    expect(
      untranslated,
      `Still English in ${language.english}: ${untranslated.join(", ")}. If one of ` +
        "these is a name, an address or a font that should not be translated, add " +
        "it to SHARED_WITH_ENGLISH with a reason.",
    ).toEqual([]);
  });

  it("⚠ writes Hindi and Marathi in Devanagari, not transliterated", () => {
    // A stray "Kaksha" instead of "कक्षा" passes every other check here.
    for (const code of ["hi", "mr"] as const) {
      const noDevanagari = [...FLAT.get(code)!]
        .filter(([key]) => !SHARED_WITH_ENGLISH.has(key))
        .filter(([, value]) => !isPureTemplate(value))
        .filter(([, value]) => !/[ऀ-ॿ]/.test(value))
        .map(([key]) => key);
      expect(noDevanagari, `${code} values with no Devanagari at all`).toEqual([]);
    }
  });

  it("does not translate Hindi and Marathi identically to each other", () => {
    // They are different languages. Some words genuinely coincide — शिक्षक,
    // सुरक्षा, संदेश — but if MOST of the file matched, one had been copied.
    const hi = FLAT.get("hi")!;
    const mr = FLAT.get("mr")!;
    const same = [...hi].filter(([key, value]) => mr.get(key) === value);
    expect(same.length).toBeLessThan(hi.size / 2);
  });
});

describe("⚠ placeholders survive translation", () => {
  it.each(LOCALES)("$english keeps every {placeholder} English has", (language) => {
    const flat = FLAT.get(language.code)!;
    const broken: string[] = [];

    for (const [key, english] of ENGLISH) {
      const expected = placeholdersIn(english);
      const actual = placeholdersIn(flat.get(key)!);
      const missing = [...expected].filter((p) => !actual.has(p));
      const invented = [...actual].filter((p) => !expected.has(p));
      if (missing.length || invented.length) {
        broken.push(`${key} (missing ${missing.join(",") || "none"}; extra ${invented.join(",") || "none"})`);
      }
    }

    // A dropped {count} renders "Notifications, unread" and nothing throws.
    expect(broken, `${language.english} placeholder mismatch`).toEqual([]);
  });
});

describe("resolving a language", () => {
  it("takes the three we have", () => {
    expect(normaliseLocale("en")).toBe("en");
    expect(normaliseLocale("hi")).toBe("hi");
    expect(normaliseLocale("mr")).toBe("mr");
  });

  it("accepts a region tag as the language it is a region of", () => {
    expect(normaliseLocale("hi-IN")).toBe("hi");
    expect(normaliseLocale("mr_IN")).toBe("mr");
    expect(normaliseLocale("en-GB")).toBe("en");
  });

  it("is not fussy about case or spacing", () => {
    expect(normaliseLocale("  HI  ")).toBe("hi");
    expect(normaliseLocale("Mr")).toBe("mr");
  });

  it("⚠ falls back to English rather than throwing on anything else", () => {
    // This value arrives from a cookie anyone can edit.
    for (const junk of [null, undefined, "", "  ", "fr", "zz-ZZ", "../../etc/passwd", "<script>"]) {
      expect(normaliseLocale(junk)).toBe("en");
    }
  });

  it("describes each language in its own script", () => {
    expect(localeMeta("hi").native).toBe("हिन्दी");
    expect(localeMeta("mr").native).toBe("मराठी");
  });
});

describe("substituting values", () => {
  it("replaces a named placeholder", () => {
    expect(format("Notifications, {count} unread", { count: 3 })).toBe("Notifications, 3 unread");
  });

  it("replaces the same name more than once", () => {
    expect(format("{a} and {a}", { a: "x" })).toBe("x and x");
  });

  it("⚠ leaves an unknown placeholder visible rather than blanking it", () => {
    // Visible braces get reported. A silently empty gap gets shipped.
    expect(format("Hello {name}", {})).toBe("Hello {name}");
    expect(format("Hello {name}")).toBe("Hello {name}");
  });

  it("passes a string with no placeholders through untouched", () => {
    expect(format("Practice", { count: 1 })).toBe("Practice");
  });
});

describe("t", () => {
  it("reads the language it was built for", () => {
    expect(translator("hi")("nav.practice")).toBe("अभ्यास");
    expect(translator("mr")("nav.practice")).toBe("सराव");
    expect(translator("en")("nav.practice")).toBe("Practice");
  });

  it("interpolates", () => {
    expect(translator("en")("shell.notificationsUnread", { count: 4 })).toBe(
      "Notifications, 4 unread",
    );
    expect(translator("hi")("shell.notificationsUnread", { count: 4 })).toContain("4");
  });

  it("⚠ falls back to English for a key a language somehow lacks", () => {
    // Unreachable while the types hold, which is exactly why it is tested
    // through `resolve` with a hand-gutted dictionary rather than by mutating
    // the real one. A blank value must behave as absent, not render as blank.
    const gutted: Dictionary = { ...DICTIONARIES.hi, nav: { ...DICTIONARIES.hi.nav, practice: "" } };
    expect(resolve(gutted, "nav.practice")).toBe("Practice");
    // The key next to it is untouched, so this is a per-key fallback and not a
    // whole-dictionary one.
    expect(resolve(gutted, "nav.grades")).toBe("अंक");
  });

  it("falls back when the key is missing outright, not merely blank", () => {
    const { nav, ...withoutNav } = DICTIONARIES.hi;
    expect(resolve(withoutNav as Dictionary, "nav.practice")).toBe("Practice");
  });

  it("returns the key itself when nothing anywhere has it", () => {
    // Last resort. "nav.nope" on screen is ugly and diagnosable; "" is neither.
    expect(translator("en")("nav.nope" as never)).toBe("nav.nope");
    expect(resolve(DICTIONARIES.hi, "totally.made.up")).toBe("totally.made.up");
  });

  it("still interpolates a value it had to fall back for", () => {
    const gutted: Dictionary = {
      ...DICTIONARIES.mr,
      shell: { ...DICTIONARIES.mr.shell, notificationsUnread: "" },
    };
    expect(resolve(gutted, "shell.notificationsUnread", { count: 7 })).toBe(
      "Notifications, 7 unread",
    );
  });
});

describe("⚠ everything the navigation asks for actually exists", () => {
  // The types make these keys valid. They do not make them RESOLVE — a key can
  // typecheck against `en` and still be the one string somebody deleted from a
  // language file by hand. This walks the real nav in every real language.
  const keys = [
    ...ROLES.flatMap((role) => NAV[role].map((item) => item.labelKey)),
    ...ROLES.flatMap((role) => QUICK_ACTIONS[role].flatMap((a) => [a.labelKey, a.descriptionKey])),
    ...ROLES.flatMap((role) => {
      const action = PRIMARY_ACTION[role];
      return action ? [action.labelKey, action.descriptionKey] : [];
    }),
    ...ROLES.flatMap((role) => [ROLE_META[role].labelKey, ROLE_META[role].pluralKey]),
  ];

  it.each(LOCALES)("$english has a real word for every nav entry", (language) => {
    const t = translator(language.code);
    const unresolved = keys.filter((key) => t(key) === key);
    expect(unresolved, `${language.english} renders these as raw keys`).toEqual([]);
  });

  it("covers every role, so a new role cannot ship with no labels", () => {
    expect(ROLES.every((role) => NAV[role].length > 0)).toBe(true);
  });
});
