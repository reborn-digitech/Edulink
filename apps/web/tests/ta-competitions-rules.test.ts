/**
 * Competitions, the pure rules (testing analysis of 13 November 2026, the 'competitions' batch).
 *
 *   TA-102  A closing or end date typed as a day (the phone's and the web's YYYY-MM-DD) was stored as 00:00 UTC,
 *           05:30 in India, by the school's older form and the content team's form, and a crawled one at noon
 *           UTC (17:30): entries closed, and the work stopped, hours into the day the page names.
 *   TA-574  The calendar event's class band was free text: 10 to 9 refused every pupil and "IX" to "X" was no
 *           band at all, both saved without a word.
 *   TA-478  The crawler's engineering words matched the English word "be", so a stream the model wrongly gave a
 *           page was never taken off for engineering.
 */
import { describe, expect, it } from "vitest";
import { translator } from "@/lib/i18n/dictionary";
import { competitionFormSchema } from "@/lib/competition-forms";
import { readPlatformCompetitionForm } from "@/lib/app-admin";
import { comparable, diffFields, groundClasses, toCompetitionFields, yearOf } from "@/lib/competition-crawl-rules";
import { registrationOpen, submissionOpen } from "@/lib/competitions";
import { normaliseEvent } from "@/lib/competition-events";
import type { CompetitionExtractEntry } from "@edulink/contracts";

const t = translator("en");
const DAY = "2026-11-20";
/** Instants on the closing day and just after it, read in India. */
const at = (iso: string) => new Date(iso);
const morning = at("2026-11-20T09:00:00+05:30");
const night = at("2026-11-20T23:00:00+05:30");
const nextDay = at("2026-11-21T00:30:00+05:30");

const FORM = { title: "ZZ TA-102 Essay", summary: "ZZ one line", requiresParentConsent: true, leaderboardEnabled: false };

describe("TA-102: a day typed as a closing or end date is the whole of that day in the school's zone", () => {
  it("TA-102: the school's older form (web and the phone's door) closes entries and work at the end of the day named, in the school's zone", () => {
    const parsed = competitionFormSchema(t, "Asia/Kolkata").parse({ ...FORM, registrationClosesAt: DAY, startsAt: DAY, endsAt: DAY });
    const c = { registrationOpensAt: null, registrationClosesAt: parsed.registrationClosesAt ?? null, endsAt: parsed.endsAt ?? null };
    expect([registrationOpen(c, morning), registrationOpen(c, night), registrationOpen(c, nextDay)]).toEqual([true, true, false]);
    expect([submissionOpen(c, morning), submissionOpen(c, night), submissionOpen(c, nextDay)]).toEqual([true, true, false]);
    // The day starts at the school's midnight.
    expect(parsed.startsAt?.toISOString()).toBe("2026-11-19T18:30:00.000Z");
  });

  it("TA-102: entries may still close on the day it starts, as before, and not after it", () => {
    const schema = competitionFormSchema(t, "Asia/Kolkata");
    expect(schema.safeParse({ ...FORM, registrationClosesAt: DAY, startsAt: DAY, endsAt: "2026-11-22" }).success).toBe(true);
    const late = schema.safeParse({ ...FORM, registrationClosesAt: "2026-11-21", startsAt: DAY, endsAt: "2026-11-22" });
    expect(late.success).toBe(false);
    expect(schema.safeParse({ ...FORM, startsAt: "2026-11-22", endsAt: DAY }).success).toBe(false);
  });

  it("TA-102: the content team's form closes a platform competition at the end of the day in India", () => {
    const read = readPlatformCompetitionForm({ ...FORM, requiresParentConsent: true, registrationClosesAt: DAY, endsAt: DAY });
    if (!read.ok) throw new Error(read.errorKey);
    const c = { registrationOpensAt: null, registrationClosesAt: read.input.registrationClosesAt ?? null, endsAt: read.input.endsAt ?? null };
    expect([registrationOpen(c, morning), registrationOpen(c, night), registrationOpen(c, nextDay)]).toEqual([true, true, false]);
    expect([submissionOpen(c, morning), submissionOpen(c, night), submissionOpen(c, nextDay)]).toEqual([true, true, false]);
  });

  it("TA-102: a crawled competition's closing and end days run to the end of the day in India, and still read as that day", () => {
    const entry = { title: "ZZ TA-102 Olympiad", summary: "ZZ", organiser: "ZZ Trust", subject: "MATHS", classFrom: 6, classTo: 8, forCollege: false, website: "https://example.invalid/zz", registrationOpens: null, registrationCloses: DAY, eventStarts: null, eventEnds: DAY, eligibility: null, prizes: null, streams: [], audience: null } as unknown as CompetitionExtractEntry;
    const f = toCompetitionFields(entry, "https://example.invalid/zz");
    const c = { registrationOpensAt: f.registrationOpensAt, registrationClosesAt: f.registrationClosesAt, endsAt: f.endsAt };
    expect([registrationOpen(c, night), registrationOpen(c, nextDay)]).toEqual([true, false]);
    expect([submissionOpen(c, night), submissionOpen(c, nextDay)]).toEqual([true, false]);
    expect(f.registrationClosesAt?.toISOString().slice(0, 10)).toBe(DAY);
  });

  it("TA-102: the content team's start day stays the day typed, so a crawl of the same page flags no change and the year holds at 1 January", () => {
    const read = readPlatformCompetitionForm({ ...FORM, requiresParentConsent: true, registrationClosesAt: DAY, startsAt: DAY, endsAt: DAY });
    if (!read.ok) throw new Error(read.errorKey);
    const entry = { title: "ZZ TA-102 Olympiad", summary: "ZZ", organiser: "ZZ Trust", subject: "MATHS", classFrom: 6, classTo: 8, forCollege: false, website: "https://example.invalid/zz", registrationOpens: null, registrationCloses: DAY, eventStarts: DAY, eventEnds: DAY, eligibility: null, prizes: null, streams: [], audience: null } as unknown as CompetitionExtractEntry;
    const crawled = toCompetitionFields(entry, "https://example.invalid/zz");
    const pick = (f: { registrationClosesAt?: Date | null; startsAt?: Date | null; endsAt?: Date | null }) => comparable({ registrationClosesAt: f.registrationClosesAt ?? null, startsAt: f.startsAt ?? null, endsAt: f.endsAt ?? null });
    expect(pick(read.input).startsAt).toBe(DAY);
    expect(diffFields(pick(read.input), pick(crawled))).toEqual({});
    const newYear = readPlatformCompetitionForm({ ...FORM, requiresParentConsent: true, startsAt: "2027-01-01" });
    if (!newYear.ok) throw new Error(newYear.errorKey);
    expect(yearOf([newYear.input.startsAt])).toBe(2027);
  });
});

describe("TA-574: the class band is two classes, low not above high", () => {
  const EVENT = { title: "ZZ TA-574 Quiz", summary: "ZZ one line", startDateKey: "2026-12-11", enrolmentOpen: true, internalBoard: "OFF" as const };

  it("TA-574: the calendar event refuses a reversed band and a band that is not a class number, and keeps a good one", () => {
    expect(() => normaliseEvent({ ...EVENT, gradeLow: "10", gradeHigh: "9" })).toThrow("competitions.classBandReversed");
    expect(() => normaliseEvent({ ...EVENT, gradeLow: "IX", gradeHigh: "X" })).toThrow("competitions.classBandNotANumber");
    expect(() => normaliseEvent({ ...EVENT, gradeLow: "5", gradeHigh: "VII" })).toThrow("competitions.classBandNotANumber");
    const ok = normaliseEvent({ ...EVENT, gradeLow: " 9 ", gradeHigh: "10" });
    expect([ok.gradeLow, ok.gradeHigh]).toEqual(["9", "10"]);
    const open = normaliseEvent({ ...EVENT, gradeLow: "", gradeHigh: "12" });
    expect([open.gradeLow, open.gradeHigh]).toEqual([null, "12"]);
  });

  it("TA-574: the school's older form names the field it refuses", () => {
    const schema = competitionFormSchema(t);
    const reversed = schema.safeParse({ ...FORM, gradeLow: "9", gradeHigh: "5" });
    expect(reversed.success).toBe(false);
    if (!reversed.success) expect(reversed.error.issues.map((i) => i.path[0])).toContain("gradeHigh");
    const roman = schema.safeParse({ ...FORM, gradeLow: "V", gradeHigh: "7" });
    expect(roman.success).toBe(false);
    if (!roman.success) expect(roman.error.issues.map((i) => i.path[0])).toContain("gradeLow");
    expect(schema.safeParse({ ...FORM, gradeLow: "5", gradeHigh: "7" }).success).toBe(true);
  });
});

describe("TA-478: the engineering words are not the English word 'be'", () => {
  it("TA-478: a moot court page that says 'will be released' keeps LAW and drops ENGINEERING", () => {
    const out = groundClasses({ classFrom: null, classTo: null, streams: ["LAW", "ENGINEERING"] }, "A moot court for law students; the problem will be released on 1 May. Entries will be judged by a panel of advocates.");
    expect(out.entry.streams).toEqual(["LAW"]);
    expect(out.dropped).toBe(1);
  });

  it("TA-478: B.E., B.Tech and the word engineering still name the stream", () => {
    for (const text of ["Open to B.E. and B.Tech students", "Open to B.E students of any branch", "For ENGINEERING colleges", "Final-year engineering students", "Diploma students of a polytechnic"]) {
      expect(groundClasses({ classFrom: null, classTo: null, streams: ["ENGINEERING"] }, text).entry.streams, text).toEqual(["ENGINEERING"]);
    }
  });
});
