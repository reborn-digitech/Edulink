/**
 * The provenance tags a bank question carries in QuizQuestion.source when it
 * was made IN THE APP rather than loaded from content/quiz/*.json. Read by
 * scripts/import-quiz.ts, which deletes any question the files no longer hold
 * UNLESS its source is one of these — so a question the content team typed
 * (src/lib/app-admin.ts), one that came in through the sheet
 * (src/lib/bank-tools.ts) or one a teacher wrote and the team added
 * (src/lib/gig-questions.ts) survives every import.
 *
 * One module, no imports, so the three writers and the one reader cannot
 * drift: when the product was renamed from Relay to Shalaghar on 2 October
 * 2026 the tag was a string literal in three files, and changing it in the
 * code alone would have made every question written in the app an orphan on
 * the next import. The rows were rewritten by the migration
 * bank_source_shalaghar, and tests/data-audit.test.ts fails if one still
 * carries the old name. A rename of this tag needs a migration of the rows
 * with it, in the same commit.
 */

/** The product's content team: typed in the bank page, or arrived through its sheet. */
export const CONTENT_TEAM_SOURCE = "Shalaghar content team";

/** The tag the rows carried before 2 October 2026; here only so the audit can look for it. */
export const CONTENT_TEAM_SOURCE_BEFORE_RENAME = "Relay content team";

/** A teacher's question the content team added to the bank (gigs). */
export const TEACHER_CONTRIBUTION_SOURCE = "teacher contribution";

/** Every tag that marks a question made in the app; the importer never orphans one of these. */
export const AUTHORED_IN_THE_APP: ReadonlySet<string> = new Set([CONTENT_TEAM_SOURCE, TEACHER_CONTRIBUTION_SOURCE]);
