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
 * School code: a readable prefix from the school name plus 8 random chars.
 * "Riverside Primary" -> "RIVER-7X9K-M3QT". Uniqueness is enforced by the
 * unique index; callers retry on collision.
 *
 * EIGHT, NOT FOUR. The prefix is the school's name, which is public, so four
 * characters from a 21-letter alphabet left ~194,000 codes to try per school
 * — and a school code, unlike a class code, makes an ACTIVE pupil on the
 * roll the moment it is typed. Two groups of four are ~38 bits, still read
 * aloud in two breaths. Codes already issued keep their length.
 */
export function schoolCode(schoolName: string): string {
  const letters = schoolName.toUpperCase().replace(/[^A-Z]/g, "");
  const prefix = (letters.slice(0, 5) || "SCHOOL").padEnd(5, "X");
  return `${prefix}-${randomCode(4)}-${randomCode(4)}`;
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

// The name and slug helpers moved to class-names.ts so a client component can
// use them without dragging `node:crypto` into a browser bundle; every server
// importer keeps its old import path through this line.
export { slugify, normalizeCode, nameCarriesSection, withSection } from "./class-names";
