/**
 * Whose session a script may mint (A3-S-15, 5 Oct 2026, risks batch): only a ZZ
 * fixture person (`@zz.test`) or a demo account (`@demo.relay.test`), the two
 * kinds CLAUDE.md lets a script create, sign in as or destroy. zz-token's
 * branches that take an email on the command line all ask this first; the
 * RECRUITER branch used to look the recruiter up by any email it was given, so
 * a typo or a real recruiter's address minted a live session for that person.
 */
export const FIXTURE_EMAIL_DOMAINS = ["@zz.test", "@demo.relay.test"] as const;

export function isFixtureEmail(email: string): boolean {
  const e = email.trim().toLowerCase();
  return FIXTURE_EMAIL_DOMAINS.some((d) => e.endsWith(d)) && e.indexOf("@") === e.lastIndexOf("@");
}

/** Throws the sentence zz-token has always thrown for anyone else. */
export function assertFixtureEmail(email: string): void {
  if (!isFixtureEmail(email)) throw new Error("only ZZ and demo people");
}
