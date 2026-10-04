import type { Translate } from "./i18n/dictionary";

/**
 * THE COUNTED LINES OF THE COLLEGE PAGES, CHOSEN BY COUNT (B-17, 4 Oct 2026).
 *
 * The dictionary has no plural machinery by design (see the head of
 * packages/i18n/src/en.ts): a string that needs agreement gets a `…One`
 * sibling and the caller picks. These lines read "Mentoring (1 groups)",
 * "1 parts" and "1 companies to check" in the walk because every caller
 * passed the count straight in; the choice lives here once, so the faculty's
 * and the HOD's homes cannot pick differently, and a test reads it.
 *
 * A course with no plan says so instead of "0 of 0 weeks taught".
 */
export function weeksTaughtText(t: Translate, taught: number, planned: number): string {
  if (planned === 0) return t("academics.planNone");
  return planned === 1 ? t("academics.weeksTaughtOne", { taught }) : t("academics.weeksTaught", { taught, planned });
}

export function coverageLineText(t: Translate, c: { taught: number; planned: number; expected: number; elapsed: number }): string {
  if (c.planned === 0) return t("academics.planNone");
  if (c.planned === 1) return t("academics.coverageLineOne", { taught: c.taught, expected: c.expected, elapsed: c.elapsed });
  return t("academics.coverageLine", { taught: c.taught, planned: c.planned, expected: c.expected, elapsed: c.elapsed });
}

export function componentsStateText(t: Translate, s: { components: number; moderated: number; released: number }): string {
  return s.components === 1
    ? t("academics.componentsStateOne", { moderated: s.moderated, released: s.released })
    : t("academics.componentsState", { components: s.components, moderated: s.moderated, released: s.released });
}

export function mentoringLinkText(t: Translate, groups: number): string {
  return groups === 1 ? t("academics.mentoringLinkOne") : t("academics.mentoringLink", { n: groups });
}

export function mentoringSummaryText(t: Translate, groups: number, mentees: number): string {
  if (groups === 1 && mentees === 1) return t("academics.mentoringSummaryOne");
  if (groups === 1) return t("academics.mentoringSummaryOneGroup", { mentees });
  if (mentees === 1) return t("academics.mentoringSummaryOneMentee", { groups });
  return t("academics.mentoringSummary", { groups, mentees });
}

export function waitingCompaniesText(t: Translate, count: number): string {
  return count === 1 ? t("placement.waitingCompaniesOne") : t("placement.waitingCompanies", { count });
}
