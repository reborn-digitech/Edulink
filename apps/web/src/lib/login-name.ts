/**
 * What somebody types into the "who are you" box, and what we show back.
 *
 * A nine-year-old joining with a class code has no email address — demanding one
 * either blocks them or teaches them to invent one — so `joinAsStudent` gives
 * them a readable handle instead and stores it against a domain that does not
 * route. One unique column, `User.email`, therefore serves both account kinds,
 * and one lookup serves both logins.
 *
 * THIS FILE EXISTS BECAUSE THAT RULE WAS WRITTEN OUT THREE TIMES. The handle
 * domain was a string literal in `joinAsStudent` (minting it), in `login`
 * (accepting it) and about to be a third in the account merge (accepting it
 * again). Three copies of a rule is three chances for one of them to drift, and
 * the drift here is a child who cannot sign in to the account they made ninety
 * seconds ago — the exact bug the normaliser was added to fix in the first
 * place.
 */

/**
 * Never routable, deliberately. Mail to it must fail rather than silently reach
 * somebody, so a school that types a child's handle into a mailing list finds
 * out immediately.
 */
export const HANDLE_DOMAIN = "edulink.local";

const HANDLE_SUFFIX = `@${HANDLE_DOMAIN}`;

/**
 * Turns whatever was typed into the thing `User.email` is keyed on.
 *
 * A bare handle gets the internal domain; anything with an `@` is left alone and
 * validated as an email by the caller's schema. Trimmed and lowercased either
 * way, because a phone keyboard capitalises the first letter of everything and a
 * child who types `Amara.k4f9` has not got their name wrong.
 */
export function toLoginEmail(raw: string): string {
  const trimmed = raw.trim().toLowerCase();
  if (trimmed.length === 0 || trimmed.includes("@")) return trimmed;
  return `${trimmed}${HANDLE_SUFFIX}`;
}

/**
 * Is this a real address somebody could be emailed at?
 *
 * A HANDLE IS NOT AN ADDRESS. `amara.k4f9@edulink.local` is a lookup key
 * wearing the shape of an email so that one unique index serves every account
 * type — nobody reads mail there, the domain is not ours, and `.local` is
 * reserved for mDNS and will never route.
 *
 * This exists because the password reset sent a code to one. In the dev mailbox
 * that looks harmless; with a real transport configured it is a message to a
 * domain we do not control, carrying a credential for a child's account. The
 * shape that made handles convenient is exactly the shape that made them look
 * deliverable.
 */
export function isDeliverableEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes("@")) return false;
  return !trimmed.endsWith(HANDLE_SUFFIX);
}

/**
 * The other direction, for anything that shows an account back to a person.
 *
 * Showing `amara.k4f9@edulink.local` invites somebody to email it, and it is the
 * one address in the system guaranteed to bounce. Real addresses come back
 * untouched.
 */
export function toDisplayLoginName(email: string | null | undefined): string {
  if (!email) return "";
  return email.endsWith(HANDLE_SUFFIX) ? email.slice(0, -HANDLE_SUFFIX.length) : email;
}
