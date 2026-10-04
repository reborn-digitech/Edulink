/**
 * THE YEAR'S CLOSING ACTIONS ON A DASHBOARD (B-18, campaign of 4 October
 * 2026). "Finish Term 1" and "Finish 2026–27" sat as outline buttons in the
 * first card of the head's dashboard and the office's overview from the
 * first day of the year — a year-closing action on the page people read
 * every morning (Nielsen's error prevention). They are offered there only
 * once they are due: the running term from its last day on, the year from
 * its last day on or once every term of it is finished. Before that, the
 * calendar page (/admin/calendar) still carries both with their
 * confirmations, for a school that closes early.
 */
export type MilestoneTerm = { endDateKey: string; finishedAt: Date | null };

export function milestoneOffers(input: { todayKey: string; runningTerm: MilestoneTerm | null; terms: MilestoneTerm[]; yearEndKey: string | null }): { finishTerm: boolean; finishYear: boolean } {
  const finishTerm = input.runningTerm !== null && input.runningTerm.finishedAt === null && input.todayKey >= input.runningTerm.endDateKey;
  const allTermsDone = input.terms.length > 0 && input.terms.every((t) => t.finishedAt !== null);
  const finishYear = input.yearEndKey !== null && (input.todayKey >= input.yearEndKey || allTermsDone);
  return { finishTerm, finishYear };
}
