import { randomInt } from "node:crypto";

/**
 * Human-typed codes: school join codes, class join codes, student claim codes.
 *
 * The alphabet excludes 0/O/1/I/L/5/S/2/Z/8/B and all vowels. Two reasons:
 *   * an 8-year-old copying a code off a whiteboard confuses 0 with O;
 *   * removing vowels makes it very unlikely a random code spells something
 *     a class of teenagers will find funny.
 */
const ALPHABET = "CDFGHJKMNPQRTVWXY3467";

/** Cryptographically uniform pick — `Math.random()` is not acceptable here
 *  because a guessable class code is an unauthorised-enrolment vector. */
export function randomCode(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return out;
}

/**
 * School code: a readable prefix from the school name plus 4 random chars.
 * "Riverside Primary" -> "RIVER-7X9K". Uniqueness is enforced by the unique
 * index; callers retry on collision.
 */
export function schoolCode(schoolName: string): string {
  const letters = schoolName.toUpperCase().replace(/[^A-Z]/g, "");
  const prefix = (letters.slice(0, 5) || "SCHOOL").padEnd(5, "X");
  return `${prefix}-${randomCode(4)}`;
}

/** Class join code, e.g. "K7M-3QF4". Short enough to read aloud. */
export function classCode(): string {
  return `${randomCode(3)}-${randomCode(4)}`;
}

/**
 * Student claim code, e.g. "STU-9KDF-3MQ7". A parent needs this *and* the
 * child's birthdate to claim, so it is not a bearer credential on its own,
 * but 7 random chars from a 21-char alphabet is still ~30 bits.
 */
export function studentCode(): string {
  return `STU-${randomCode(4)}-${randomCode(4)}`;
}

/** URL-safe slug with a numeric suffix reserved for collision resolution. */
export function slugify(input: string): string {
  return (
    input
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "") // strip combining diacritics
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "school"
  );
}

/** Accepts user input in any case/spacing and returns the canonical form. */
export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/\s+/g, "").trim();
}

/**
 * Whether a class name already carries its section — "Class 7A", "7 A",
 * "Grade 3 · A" — so a page that appends the section does not print "7A · A".
 * The year-end planner names sections this way on purpose; the fixtures did it
 * by accident; either way the letter should appear once.
 */
export function nameCarriesSection(name: string, section: string | null | undefined): boolean {
  if (!section) return false;
  const s = section.trim().toLowerCase();
  const n = name.trim().toLowerCase();
  if (!s || !n.endsWith(s)) return false;
  const before = n.slice(0, -s.length);
  // A letter section needs a boundary before it ("7a", "7 a", "· a"); a longer
  // section ("sunflower") is a word and needs a space or the start.
  return before === "" || /[\s\d·\-–(]$/.test(before);
}

/**
 * Adds a section to a class name — "Class 6" + "A" → "Class 6A" — leaving a
 * name that already carries the section alone.
 *
 * A STREAM IS NOT A LETTER. When the section is a short code the name already
 * spells out — "Sci" under "Grade 11 Science", "Com" under "Grade 11 Commerce"
 * — suffixing produced "Grade 11 Science Sci", which a real senior-school split
 * walkthrough hit at the promotion planner's "Add a section" button. A last
 * word longer than the code and beginning with it is treated as already
 * carrying the section; only bare letters (or codes the name does not already
 * express) are appended, and a trailing digit binds the letter tight ("6A").
 */
export function withSection(name: string, section: string): string {
  const trimmed = name.trim();
  if (!section) return trimmed;
  const upperSection = section.toUpperCase();
  if (trimmed.toUpperCase().endsWith(upperSection)) return trimmed;
  const lastWord = trimmed.split(/\s+/).pop() ?? "";
  if (lastWord.length > section.length && lastWord.toUpperCase().startsWith(upperSection)) return trimmed;
  return /\d$/.test(trimmed) ? `${trimmed}${section}` : `${trimmed} ${section}`;
}
