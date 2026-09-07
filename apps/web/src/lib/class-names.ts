/**
 * The pure string helpers that used to sit beside the code generators in
 * codes.ts. THEY LIVE APART BECAUSE OF WHAT THEY DO NOT IMPORT: codes.ts needs
 * `node:crypto` for a uniform random pick, and the year-end planner — a client
 * component — needs only `withSection` and `nameCarriesSection`. Turbopack in
 * dev shrugged at a browser bundle mentioning `node:crypto`; the production
 * webpack build refused it, and the first `next build` after the workspace
 * move was the first to say so. Nothing here touches Node.
 */

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
