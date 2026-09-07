/**
 * Mobile numbers, and the one rule that decides whether they work at all.
 *
 * NO `server-only` HERE, deliberately: the login form, the account form and
 * every server action that accepts a number all have to agree about what
 * `98765 43210` means, and one definition is the only way that holds. Same split
 * as `school-day.ts` and `leave-kinds.ts`.
 *
 * ONE STORED SHAPE: E.164, `+` followed by digits, nothing else. A person typing
 * `+91 98765 43210`, `09876543210`, `98765-43210` and `919876543210` is one
 * person with one account, and if any two of those stored differently they would
 * become two accounts with the same phone — which is not a cosmetic problem,
 * because `User.phone` is UNIQUE and the second one simply fails to register
 * with an error nobody can act on.
 *
 * A DEFAULT COUNTRY IS REQUIRED, AND IT IS A SETTING. Ten digits alone are not a
 * phone number anywhere on earth; they are a phone number *in a country*. This
 * app is built for schools in India, so the default is +91 — but it is read from
 * the environment rather than baked in, because the first deployment outside
 * India would otherwise silently file every parent under the wrong country.
 */

/** Read once. `+91` unless the deployment says otherwise. */
export const DEFAULT_COUNTRY_CODE = normaliseCountryCode(
  process.env.NEXT_PUBLIC_DEFAULT_COUNTRY_CODE ?? "+91",
);

function normaliseCountryCode(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // Falls back rather than throwing at module load: a mistyped env var should
  // not take the whole app down at import time, and +91 is this build's default.
  if (digits.length < 1 || digits.length > 3) return "+91";
  return `+${digits}`;
}

/**
 * The shortest and longest a subscriber number may be, after the country code.
 *
 * E.164 caps the whole thing at 15 digits including the country code. The lower
 * bound is not from the standard — it exists so that a half-typed number is
 * refused with a message rather than stored as somebody's login.
 */
const MIN_NATIONAL_DIGITS = 6;
/**
 * The shortest whole E.164 number. Separate from the national minimum because
 * the two catch different mistakes: `12345` is a short NATIONAL number that the
 * default country code would inflate to a plausible-looking `+9112345`, and
 * `+1234` is a short WHOLE number with no national part to measure.
 */
const MIN_E164_DIGITS = 8;
const MAX_E164_DIGITS = 15;

/**
 * `"98765 43210"` → `"+919876543210"`, or null if that is not a number.
 *
 * REFUSES RATHER THAN GUESSES, the same rule as `displayDateToIso` and
 * `parseTimeOfDay`. A number that comes back null gets a message; a number that
 * gets silently mangled becomes an account nobody can sign in to and a password
 * reset that goes to a stranger.
 *
 * Accepted, in this order:
 *   `+<cc><national>`  — already E.164, kept as it is
 *   `00<cc><national>` — the international prefix much of the world dials
 *   `0<national>`      — the trunk prefix, dropped, default country applied
 *   `<national>`       — bare, default country applied
 *
 * Separators (spaces, dashes, dots, brackets) are stripped anywhere, because
 * people type what their keyboard and their memory make easy.
 */
export function normalisePhone(
  raw: string | null | undefined,
  defaultCountryCode: string = DEFAULT_COUNTRY_CODE,
): string | null {
  if (!raw) return null;

  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;

  /**
   * A `+` IS ONLY MEANINGFUL AT THE FRONT, AND ONLY ONCE.
   *
   * `9+919876543210` is somebody's thumb, not a country code — and stripping
   * non-digits first and asking about the `+` afterwards accepted it as a
   * fifteen-digit number in a country nobody dials. Refused outright: this is
   * exactly the "reduce a string to whichever digits it contains" failure the
   * letter check below exists to prevent, arriving through a character that
   * looks like it belongs.
   */
  const plusLed = trimmed.startsWith("+");
  const plusCount = (trimmed.match(/\+/g) ?? []).length;
  if (plusCount > 1) return null;
  if (plusCount === 1 && !plusLed) return null;

  const digits = trimmed.replace(/\D/g, "");
  if (digits.length === 0) return null;

  // Anything that is not a digit or an allowed separator means this was never a
  // phone number — an email, a handle, a sentence. Refused rather than reduced
  // to whichever digits it happened to contain.
  if (/[^\d\s+().-]/.test(trimmed)) return null;

  let e164: string;
  if (plusLed) {
    e164 = `+${digits}`;
  } else if (digits.startsWith("00")) {
    const rest = digits.slice(2);
    if (rest.length === 0) return null;
    e164 = `+${rest}`;
  } else if (digits.startsWith("0")) {
    // The trunk prefix. `09876543210` is `+919876543210`, not `+910987…`.
    const national = digits.replace(/^0+/, "");
    if (national.length === 0) return null;
    e164 = `${defaultCountryCode}${national}`;
  } else {
    e164 = `${defaultCountryCode}${digits}`;
  }

  const total = e164.slice(1);
  if (total.length > MAX_E164_DIGITS) return null;
  if (total.length < MIN_E164_DIGITS) return null;
  /**
   * …and the NATIONAL part on its own, when we supplied the country code.
   * Without this, `12345` becomes `+9112345` — eight digits, long enough to
   * pass the check above, and a number that belongs to nobody. Only checkable
   * on this branch: when the caller wrote `+`, which digits are the country
   * code is not knowable from the string.
   */
  if (!plusLed && !digits.startsWith("00")) {
    const national = total.slice(defaultCountryCode.length - 1);
    if (national.length < MIN_NATIONAL_DIGITS) return null;
  }

  return e164;
}

/** True if this is something we would store. */
export function isPhone(raw: string | null | undefined): boolean {
  return normalisePhone(raw) !== null;
}

/**
 * `"+919876543210"` → `"+91 98765 43210"`, for reading back to a person.
 *
 * DISPLAY ONLY. Nothing compares, looks up or stores this — the grouping is a
 * guess that happens to be right for ten-digit numbers and merely harmless
 * elsewhere, and a lookup against it would fail for every number it guessed
 * differently.
 */
export function formatPhone(
  e164: string | null | undefined,
  defaultCountryCode: string = DEFAULT_COUNTRY_CODE,
): string {
  if (!e164) return "";
  /**
   * ONLY THE DEFAULT COUNTRY IS SPLIT, and everything else is left exactly as
   * it is. Where the country code ends is NOT knowable from an E.164 string —
   * codes are one to three digits and `+9198…` could be +9, +91 or +919. A
   * greedy `\d{1,3}` took three every time and rendered an Indian number as
   * `+919 876543210`, which is not that person's number in any grouping.
   * Guessing wrong on a page whose job is "is that your phone?" is worse than
   * not grouping at all.
   */
  if (!e164.startsWith(defaultCountryCode)) return e164;
  const national = e164.slice(defaultCountryCode.length);
  if (national.length === 10) {
    return `${defaultCountryCode} ${national.slice(0, 5)} ${national.slice(5)}`;
  }
  return `${defaultCountryCode} ${national}`;
}

/**
 * The last few digits, for saying WHERE a code went without printing a number.
 *
 * "We sent a code to the number ending 3210" tells the right person which phone
 * to pick up and tells the wrong person nothing they did not already type. The
 * same reasoning as never confirming whether an account exists.
 */
export function phoneHint(e164: string | null | undefined): string {
  if (!e164) return "";
  const digits = e164.replace(/\D/g, "");
  if (digits.length < 4) return "";
  return digits.slice(-4);
}

/* -------------------------------------------------------------------------- */
/* What did somebody just type into the one login box?                         */
/* -------------------------------------------------------------------------- */

export type IdentifierKind = "EMAIL" | "PHONE" | "HANDLE";

/**
 * One box, three kinds of thing, decided by shape.
 *
 * ONE FIELD RATHER THAN A TOGGLE, because a person signing in knows what their
 * own login is and should not have to tell the form which category it falls in
 * before typing it. The rules are in this order and each excludes the next:
 *
 *   AN `@` MEANS EMAIL. Nothing else in this app contains one — a handle is
 *   turned into `name@edulink.local` only after this decision, never before.
 *
 *   A LEADING `+`, OR NOTHING BUT DIGITS AND SEPARATORS, MEANS PHONE.
 *
 *   ANYTHING ELSE IS A HANDLE — `amara.k4f9`, the login a pupil who joined with
 *   a class code was given.
 *
 * THE HONEST LIMIT: a handle consisting only of digits would be read as a phone
 * number. Handles are minted as `<name>.<suffix>` and always carry a dot and
 * letters, so this cannot happen today — but it is a property of the minting
 * rule rather than of this function, which is why it is written down here and
 * asserted in `login-name`'s tests rather than assumed.
 */
export function identifierKind(raw: string): IdentifierKind {
  const trimmed = raw.trim();
  if (trimmed.includes("@")) return "EMAIL";
  if (/^\+?[\d\s().-]+$/.test(trimmed) && /\d/.test(trimmed)) return "PHONE";
  return "HANDLE";
}
