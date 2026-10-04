import { describe, expect, it } from "vitest";
import { milestoneOffers } from "./milestones";

/** B-18: the closing actions are offered on a dashboard only once they are due. */
describe("milestoneOffers", () => {
  const term1 = { endDateKey: "2026-10-20", finishedAt: null };
  const term2 = { endDateKey: "2027-03-31", finishedAt: null };
  const year = "2027-03-31";

  it("offers neither in the middle of a term — the old dashboard offered both from day one", () => {
    expect(milestoneOffers({ todayKey: "2026-10-04", runningTerm: term1, terms: [term1, term2], yearEndKey: year })).toEqual({ finishTerm: false, finishYear: false });
  });
  it("offers finishing the term from its last day on, and not the year", () => {
    expect(milestoneOffers({ todayKey: "2026-10-20", runningTerm: term1, terms: [term1, term2], yearEndKey: year })).toEqual({ finishTerm: true, finishYear: false });
    expect(milestoneOffers({ todayKey: "2026-10-28", runningTerm: term1, terms: [term1, term2], yearEndKey: year }).finishTerm).toBe(true);
  });
  it("offers finishing the year on its last day, or once every term is finished", () => {
    expect(milestoneOffers({ todayKey: "2027-03-31", runningTerm: term2, terms: [term1, term2], yearEndKey: year })).toEqual({ finishTerm: true, finishYear: true });
    const done = { endDateKey: "2026-10-20", finishedAt: new Date() };
    const done2 = { endDateKey: "2027-03-31", finishedAt: new Date() };
    expect(milestoneOffers({ todayKey: "2027-03-20", runningTerm: null, terms: [done, done2], yearEndKey: year })).toEqual({ finishTerm: false, finishYear: true });
  });
  it("does not offer the year for a year with no terms before its end", () => {
    expect(milestoneOffers({ todayKey: "2026-06-10", runningTerm: null, terms: [], yearEndKey: year }).finishYear).toBe(false);
  });
});
