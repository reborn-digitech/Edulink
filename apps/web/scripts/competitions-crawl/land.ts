/**
 * WHERE AN EXTRACTED ENTRY LANDS (competitions-crawler, 12 October 2026), the one writer of a crawled
 * competition's fields and of its CompetitionCrawl record (the desk writes only its review stamps).
 *
 *   refused  by code (src/lib/competition-crawl-rules.ts rejectReason): counted by reason, nothing written.
 *   new      a platform competition (organizerSchoolId null) in DRAFT, `verified` false, parental consent
 *            required, no leaderboard, with its source record: the source, the page, the page's hash, when,
 *            the confidence, the extracted JSON.
 *   the same competition again (organiser + title by embedding similarity ≥ 0.9, and the same year,
 *   against every platform competition, crawled or hand-posted):
 *     a crawled DRAFT         its fields are updated where the page now says something different;
 *     a crawled one PUBLISHED  (or withdrawn) NEVER EDITED: `changedSinceReview` is set and the diff kept;
 *     a hand-posted one       never edited either: the crawler's note is attached, flagged when the
 *                             dates or classes differ;
 *     a DISMISSED one         left dismissed ("dismissed and unchanged") unless the page it came from has
 *                             changed since the dismissal, when it is suggested again with the new fields.
 */
import type { Prisma, PrismaClient } from "@prisma/client";
import type { CompetitionDiff, CompetitionExtractEntry, CrawlRejectReason } from "@edulink/contracts";
import { comparable, crawledAudience, dedupeText, diffFields, findDuplicate, groundClasses, groundDates, rejectReason, titleText, toCompetitionFields, yearOf, type CrawledFields, type DedupeCandidate } from "../../src/lib/competition-crawl-rules";

export type LandDb = Pick<PrismaClient, "competition" | "competitionCrawl">;
export type Embed = (texts: string[]) => Promise<number[][]>;

export type LandOutcome = "DRAFTED" | "UPDATED" | "UNCHANGED" | "DISMISSED_UNCHANGED" | "CHANGED_PUBLISHED" | { rejected: CrawlRejectReason };

export type LandContext = {
  /** college-content (12 Oct 2026): the source's kind and streams give an entry its audience when the page does not. */
  source: { id: string; rootUrl: string; kind?: string; streams?: string[] };
  organiserRoots: string[];
  pageUrl: string;
  pageHash: string;
  now: Date;
  /** When this crawl began: a competition already landed from another page in this crawl only has its gaps filled. */
  runStartedAt: Date;
  /** The competitions already landed from this page in this crawl: never this entry's duplicate. */
  samePage?: Set<string>;
  /** The page's words: a date the page does not print is taken out of the entry before anything else. */
  pageText?: string;
};

/** Every platform competition, embedded once per crawl, for the dedupe. */
export async function buildDedupeIndex(db: LandDb, embed: Embed): Promise<DedupeCandidate[]> {
  const rows = await db.competition.findMany({
    where: { organizerSchoolId: null },
    select: { id: true, title: true, organizerName: true, registrationOpensAt: true, registrationClosesAt: true, startsAt: true, endsAt: true },
  });
  if (!rows.length) return [];
  const vectors = await embed(rows.flatMap((r) => [dedupeText(r.organizerName, r.title), titleText(r.title)]));
  return rows.map((r, i) => ({ competitionId: r.id, vector: vectors[2 * i]!, titleVector: vectors[2 * i + 1]!, year: yearOf([r.registrationOpensAt, r.registrationClosesAt, r.startsAt, r.endsAt]) }));
}

const FIELD_KEYS = ["title", "summary", "organizerName", "subject", "gradeLow", "gradeHigh", "eligibility", "prizes", "externalUrl", "registrationOpensAt", "registrationClosesAt", "startsAt", "endsAt", /* college-content (12 Oct 2026) */ "audience", "streams"] as const;

/** The new fields that say something (a page silent on a field leaves it as it was). */
function stated(fields: CrawledFields, onlyGaps: Partial<CrawledFields> | null): Prisma.CompetitionUpdateInput {
  const data: Record<string, unknown> = {};
  for (const k of FIELD_KEYS) {
    const v = fields[k];
    if (v === null || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    if (onlyGaps && onlyGaps[k] !== null && onlyGaps[k] !== undefined && onlyGaps[k] !== "") continue;
    data[k] = v;
  }
  return data as Prisma.CompetitionUpdateInput;
}

/** Two diffs of one unreviewed competition kept as one: the first "before", the latest "after". */
function mergeDiff(old: unknown, next: CompetitionDiff): CompetitionDiff {
  const out: CompetitionDiff = { ...((old && typeof old === "object" ? old : {}) as CompetitionDiff) };
  for (const [k, v] of Object.entries(next)) out[k] = { before: out[k]?.before ?? v.before, after: v.after };
  return out;
}

function previousFields(extracted: unknown, pageUrl: string): (CrawledFields & { fee: string | null }) | null {
  if (!extracted || typeof extracted !== "object") return null;
  try {
    const e = extracted as CompetitionExtractEntry;
    return { ...toCompetitionFields(e, pageUrl), fee: e.fee ?? null };
  } catch {
    return null;
  }
}

export async function landEntry(db: LandDb, given: CompetitionExtractEntry, ctx: LandContext, index: DedupeCandidate[], embed: Embed): Promise<{ outcome: LandOutcome; competitionId?: string; datesDropped?: number }> {
  const grounded = ctx.pageText === undefined ? { entry: given, dropped: 0 } : groundDates(given, ctx.pageText);
  // college-content (12 Oct 2026): classes and streams the page does not print go too, as its dates do.
  const entry = ctx.pageText === undefined ? grounded.entry : groundClasses(grounded.entry, ctx.pageText).entry;
  const reason = rejectReason(entry, { sourceRoot: ctx.source.rootUrl, organiserRoots: ctx.organiserRoots, today: ctx.now });
  if (reason) return { outcome: { rejected: reason }, datesDropped: grounded.dropped };

  // college-content: who it is for, from the page and the source's kind.
  const who = crawledAudience(entry, ctx.pageText ?? null, ctx.source.kind ? { kind: ctx.source.kind, streams: ctx.source.streams } : null);
  const fields = toCompetitionFields(entry, ctx.pageUrl, who);
  const year = yearOf([fields.registrationOpensAt, fields.registrationClosesAt, fields.startsAt, fields.endsAt]);
  const [vector, titleVector] = await embed([dedupeText(fields.organizerName, fields.title), titleText(fields.title)]);
  const extracted = { ...entry, pageUrl: ctx.pageUrl } as Prisma.InputJsonValue;
  const record = { sourceId: ctx.source.id, pageUrl: ctx.pageUrl, pageHash: ctx.pageHash, crawledAt: ctx.now, lastCheckedAt: ctx.now, confidence: entry.confidence, extracted, year };
  const match = findDuplicate(vector!, titleVector!, year, index, ctx.samePage);
  const landed = <T extends { outcome: LandOutcome; competitionId?: string }>(r: T): T & { datesDropped: number } => {
    if (r.competitionId) ctx.samePage?.add(r.competitionId);
    return { ...r, datesDropped: grounded.dropped };
  };

  if (!match) {
    const created = await db.competition.create({
      data: {
        ...fields,
        body: "",
        organizerSchoolId: null,
        status: "DRAFT",
        verified: false,
        requiresParentConsent: true,
        leaderboardEnabled: false,
        crawl: { create: record },
      },
      select: { id: true },
    });
    index.push({ competitionId: created.id, vector: vector!, titleVector: titleVector!, year });
    return landed({ outcome: "DRAFTED" as const, competitionId: created.id });
  }

  const existing = await db.competition.findUnique({ where: { id: match.competitionId }, include: { crawl: true } });
  if (!existing) return { outcome: "UNCHANGED" };
  const crawl = existing.crawl;
  const columns = { ...comparable(existing), fee: null as string | null };
  const incoming = { ...comparable(fields), fee: entry.fee ?? null };

  // A hand-posted competition: never edited. Compared on its dates and classes; flagged when they differ.
  if (!crawl || crawl.matchedExisting) {
    const handFacts = ["gradeLow", "gradeHigh", "registrationOpensAt", "registrationClosesAt", "startsAt", "endsAt"] as const;
    const pick = (c: typeof columns) => Object.fromEntries(handFacts.map((k) => [k, c[k] ?? null]));
    const diff = diffFields(pick(columns), pick(incoming));
    const changed = Object.keys(diff).length > 0;
    if (!crawl) {
      await db.competitionCrawl.create({ data: { ...record, competitionId: existing.id, matchedExisting: true, changedSinceReview: changed, diff: changed ? (diff as Prisma.InputJsonValue) : undefined, changedAt: changed ? ctx.now : null } });
    } else {
      await db.competitionCrawl.update({
        where: { id: crawl.id },
        data: { ...record, ...(changed ? { changedSinceReview: true, diff: mergeDiff(crawl.changedSinceReview ? crawl.diff : null, diff) as Prisma.InputJsonValue, changedAt: ctx.now } : {}) },
      });
    }
    return landed({ outcome: changed ? "CHANGED_PUBLISHED" : "UNCHANGED", competitionId: existing.id });
  }

  // Dismissed: stays dismissed unless the page it came from has changed since.
  if (crawl.dismissedAt) {
    const pageChanged = crawl.pageUrl === ctx.pageUrl && crawl.dismissedPageHash !== null && crawl.dismissedPageHash !== ctx.pageHash;
    if (!pageChanged || existing.status !== "DRAFT") {
      await db.competitionCrawl.update({ where: { id: crawl.id }, data: { lastCheckedAt: ctx.now } });
      return landed({ outcome: "DISMISSED_UNCHANGED", competitionId: existing.id });
    }
    await db.competition.update({ where: { id: existing.id }, data: stated(fields, null) });
    await db.competitionCrawl.update({ where: { id: crawl.id }, data: { ...record, dismissedAt: null, dismissedReason: null, dismissedByUserId: null, dismissedPageHash: null } });
    return landed({ outcome: "UPDATED", competitionId: existing.id });
  }

  // A crawled DRAFT: its fields follow the page.
  if (existing.status === "DRAFT") {
    const before = { ...columns, fee: (crawl.extracted as { fee?: string | null } | null)?.fee ?? null };
    const diff = diffFields(before, incoming);
    const sameRunOtherPage = crawl.crawledAt >= ctx.runStartedAt && crawl.pageUrl !== ctx.pageUrl;
    if (!Object.keys(diff).length) {
      await db.competitionCrawl.update({ where: { id: crawl.id }, data: { lastCheckedAt: ctx.now } });
      return landed({ outcome: "UNCHANGED", competitionId: existing.id });
    }
    if (sameRunOtherPage) {
      // Two pages of one crawl describe it: the second only fills what the first left blank.
      const data = stated(fields, existing);
      if (Object.keys(data).length) await db.competition.update({ where: { id: existing.id }, data });
      await db.competitionCrawl.update({ where: { id: crawl.id }, data: { lastCheckedAt: ctx.now } });
      return landed({ outcome: Object.keys(data).length ? "UPDATED" : "UNCHANGED", competitionId: existing.id });
    }
    await db.competition.update({ where: { id: existing.id }, data: stated(fields, null) });
    await db.competitionCrawl.update({ where: { id: crawl.id }, data: record });
    const i = index.findIndex((c) => c.competitionId === existing.id);
    if (i >= 0) index[i] = { competitionId: existing.id, vector: vector!, titleVector: titleVector!, year };
    return landed({ outcome: "UPDATED", competitionId: existing.id });
  }

  // A crawled one PUBLISHED or withdrawn: never edited. What the page now says against what it said.
  const previous = previousFields(crawl.extracted, crawl.pageUrl);
  const diff = diffFields(previous ? { ...comparable(previous), fee: previous.fee } : columns, incoming);
  if (!Object.keys(diff).length) {
    await db.competitionCrawl.update({ where: { id: crawl.id }, data: { lastCheckedAt: ctx.now } });
    return landed({ outcome: "UNCHANGED", competitionId: existing.id });
  }
  await db.competitionCrawl.update({
    where: { id: crawl.id },
    data: { ...record, changedSinceReview: true, diff: mergeDiff(crawl.changedSinceReview ? crawl.diff : null, diff) as Prisma.InputJsonValue, changedAt: ctx.now },
  });
  return landed({ outcome: "CHANGED_PUBLISHED", competitionId: existing.id });
}
