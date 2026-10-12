import "server-only";
import { Prisma } from "@prisma/client";
import {
  COMPETITION_DISMISS_REASONS,
  COMPETITION_LEVELS,
  competitionCrawlSourceResultSchema,
  competitionDiffSchema,
  type CompetitionCrawlJob,
  type CompetitionCrawlRequest,
  type CompetitionCrawlState,
  type CompetitionDismissReason,
  type CompetitionDraftEdit,
  type CompetitionSource,
  type CompetitionSourceAdd,
  type CompetitionSourceKind,
  type CompetitionSuggestion,
  type CompetitionSuggestionShow,
  type CompetitionSuggestions,
} from "@edulink/contracts";
import { cleanTopicStreams, sourceKindAudience } from "@edulink/contracts"; // college-content (12 Oct 2026)
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { db } from "./db";
import { audit } from "./audit";
import { reviewerRole } from "./quiz-review";
import { isHttpsUrl } from "./app-admin";
import { CRAWL_MACHINE, readCrawl, readCrawls, startCrawl, stopCrawl, type CrawlJobDb } from "./competition-crawl-jobs";
import type { JobDeps } from "./quiz-jobs";
import type { ActiveContext } from "./session";

/**
 * THE COMPETITIONS DESK'S GATE (competitions-crawler, 12 October 2026): the crawl's Start and Stop, the
 * sources (list, add, disable, enable, remove) and the "Suggested from the web" tab (the list, Edit,
 * Dismiss, and "reviewed" on a published one the crawler found changed). Every function asserts the
 * content team's gate (the operator passes it), names the role the person stood in, and audits each
 * write. The doors under /api/v1/appadmin/competition-crawl and /api/v1/appadmin/competitions/{id}/…
 * and the desk's server actions call these and nothing else. Publish is the existing status door
 * (setPlatformCompetitionStatus in src/lib/app-admin.ts), which marks a crawled one verified when its
 * source is an official organiser.
 */

const jobDb = db as unknown as CrawlJobDb;
let deps: JobDeps = CRAWL_MACHINE;

/** The suites' seam: a fake machine. Tests only. */
export function useCrawlDepsForTests(fake: JobDeps | null): void {
  if (process.env.NODE_ENV !== "test") throw new Error("useCrawlDepsForTests is for the test suites");
  deps = fake ?? CRAWL_MACHINE;
}

/** A refusal the desk says in words: 404 for nothing there, 409 for a clash, 422 for a field. */
export class DeskRefusal extends Error {
  constructor(
    readonly errorKey: TranslationKey,
    readonly status: 404 | 409 | 422,
  ) {
    super(errorKey);
  }
}

/* ---- the crawl ------------------------------------------------------------------------------------ */

export async function deskCrawls(session: ActiveContext): Promise<CompetitionCrawlState> {
  reviewerRole(session);
  return readCrawls(jobDb, deps);
}

export async function deskCrawl(session: ActiveContext, jobId: string): Promise<CompetitionCrawlJob> {
  reviewerRole(session);
  return readCrawl(jobDb, jobId, deps);
}

export async function deskStartCrawl(session: ActiveContext, request: CompetitionCrawlRequest): Promise<CompetitionCrawlJob> {
  const role = reviewerRole(session);
  const job = await startCrawl(jobDb, { userId: session.user.id, role }, request, deps);
  await audit({ schoolId: null, actorUserId: session.user.id, action: "appadmin.competitionCrawl.start", targetType: "CompetitionCrawlJob", targetId: job.id, meta: { role, request, startedServers: job.startedServers } });
  return job;
}

export async function deskStopCrawl(session: ActiveContext, jobId: string): Promise<CompetitionCrawlJob> {
  const role = reviewerRole(session);
  const job = await stopCrawl(jobDb, jobId, { userId: session.user.id }, deps);
  await audit({ schoolId: null, actorUserId: session.user.id, action: "appadmin.competitionCrawl.stop", targetType: "CompetitionCrawlJob", targetId: jobId, meta: { role, state: job.state } });
  return job;
}

/* ---- the sources ---------------------------------------------------------------------------------- */

type SourceRow = Prisma.CompetitionSourceGetPayload<object>;

function sourceOut(row: SourceRow, waiting: number): CompetitionSource {
  const result = competitionCrawlSourceResultSchema.safeParse(row.lastResult);
  return {
    id: row.id,
    name: row.name,
    rootUrl: row.rootUrl,
    organiser: row.organiser,
    kind: row.kind as CompetitionSourceKind,
    enabled: row.enabled,
    official: row.official,
    addedByRole: row.addedByRole,
    lastCrawledAt: row.lastCrawledAt?.toISOString() ?? null,
    lastResult: result.success ? result.data : null,
    waiting,
    streams: cleanTopicStreams(row.streams), // college-content (12 Oct 2026)
  };
}

const SUGGESTED_WHERE: Prisma.CompetitionCrawlWhereInput = { matchedExisting: false, dismissedAt: null, competition: { status: "DRAFT", organizerSchoolId: null } };

export async function deskSources(session: ActiveContext): Promise<CompetitionSource[]> {
  reviewerRole(session);
  const [rows, waiting] = await Promise.all([
    db.competitionSource.findMany({ where: { removedAt: null }, orderBy: { createdAt: "asc" } }),
    db.competitionCrawl.groupBy({ by: ["sourceId"], where: SUGGESTED_WHERE, _count: { _all: true } }),
  ]);
  const counts = new Map(waiting.map((w) => [w.sourceId, w._count._all]));
  return rows.map((r) => sourceOut(r, counts.get(r.id) ?? 0));
}

/** An organiser's root URL, as the desk types it: http(s), a host with a dot, no credentials, no fragment. */
export function normaliseRootUrl(raw: string): string | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "https:" && u.protocol !== "http:") return null;
    if (!u.hostname.includes(".") || u.username || u.password) return null;
    u.hash = "";
    return u.toString();
  } catch {
    return null;
  }
}

/** Adds a source; a source removed earlier with the same root comes back with the new words. */
export async function deskAddSource(session: ActiveContext, input: CompetitionSourceAdd): Promise<CompetitionSource> {
  const role = reviewerRole(session);
  const rootUrl = normaliseRootUrl(input.rootUrl);
  if (!rootUrl) throw new DeskRefusal("competitionCrawl.badRootUrl", 422);
  const existing = await db.competitionSource.findUnique({ where: { rootUrl } });
  if (existing && !existing.removedAt) throw new DeskRefusal("competitionCrawl.sourceExists", 409);
  // college-content (12 Oct 2026): a college organiser's streams (none for a school organiser's kinds).
  const streams = sourceKindAudience(input.kind) === "SCHOOL" ? [] : cleanTopicStreams(input.streams);
  const data = { name: input.name.trim(), organiser: input.organiser.trim(), kind: input.kind, official: input.official, enabled: true, addedByUserId: session.user.id, addedByRole: role, streams };
  const row = existing
    ? await db.competitionSource.update({ where: { id: existing.id }, data: { ...data, removedAt: null, removedByUserId: null } })
    : await db.competitionSource.create({ data: { ...data, rootUrl } });
  await audit({ schoolId: null, actorUserId: session.user.id, action: "appadmin.competitionSource.add", targetType: "CompetitionSource", targetId: row.id, meta: { role, rootUrl, kind: input.kind, official: input.official, restored: Boolean(existing) } });
  return sourceOut(row, 0);
}

/** Switch a source off or on, or remove it (a stamp: what it suggested stays on the desk; the seed never brings it back). */
export async function deskSourceAction(session: ActiveContext, sourceId: string, action: "ENABLE" | "DISABLE" | "REMOVE"): Promise<CompetitionSource | null> {
  const role = reviewerRole(session);
  const row = await db.competitionSource.findUnique({ where: { id: sourceId } });
  if (!row || row.removedAt) throw new DeskRefusal("competitionCrawl.noSuchSource", 404);
  const data = action === "REMOVE" ? { removedAt: new Date(), removedByUserId: session.user.id, enabled: false } : { enabled: action === "ENABLE" };
  const updated = await db.competitionSource.update({ where: { id: sourceId }, data });
  await audit({ schoolId: null, actorUserId: session.user.id, action: `appadmin.competitionSource.${action.toLowerCase()}`, targetType: "CompetitionSource", targetId: sourceId, meta: { role, rootUrl: row.rootUrl } });
  return action === "REMOVE" ? null : sourceOut(updated, 0);
}

/* ---- suggested from the web ----------------------------------------------------------------------- */

const SHOW_WHERE: Record<CompetitionSuggestionShow, Prisma.CompetitionCrawlWhereInput> = {
  SUGGESTED: SUGGESTED_WHERE,
  CHANGED: { changedSinceReview: true, competition: { organizerSchoolId: null } },
  DISMISSED: { dismissedAt: { not: null }, competition: { organizerSchoolId: null } },
};

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);

type CrawlWithAll = Prisma.CompetitionCrawlGetPayload<{ include: { competition: true; source: true } }>;

function suggestionOut(row: CrawlWithAll): CompetitionSuggestion {
  const c = row.competition;
  const extracted = (row.extracted ?? {}) as { level?: string; fee?: string | null };
  const diff = competitionDiffSchema.safeParse(row.diff);
  return {
    competitionId: c.id,
    title: c.title,
    summary: c.summary,
    organizerName: c.organizerName,
    status: c.status,
    verified: c.verified,
    subject: c.subject,
    gradeLow: c.gradeLow,
    gradeHigh: c.gradeHigh,
    level: (COMPETITION_LEVELS as readonly string[]).includes(extracted.level ?? "") ? (extracted.level as CompetitionSuggestion["level"]) : null,
    fee: typeof extracted.fee === "string" ? extracted.fee : null,
    eligibility: c.eligibility,
    prizes: c.prizes,
    externalUrl: c.externalUrl,
    registrationOpensAt: iso(c.registrationOpensAt),
    registrationClosesAt: iso(c.registrationClosesAt),
    startsAt: iso(c.startsAt),
    endsAt: iso(c.endsAt),
    source: { id: row.source.id, name: row.source.name, organiser: row.source.organiser, official: row.source.official },
    pageUrl: row.pageUrl,
    crawledAt: row.crawledAt.toISOString(),
    lastCheckedAt: row.lastCheckedAt.toISOString(),
    confidence: Math.max(0, Math.min(1, row.confidence)),
    matchedExisting: row.matchedExisting,
    changedSinceReview: row.changedSinceReview,
    diff: row.changedSinceReview && diff.success ? diff.data : null,
    dismissedAt: iso(row.dismissedAt),
    dismissedReason: (COMPETITION_DISMISS_REASONS as readonly string[]).includes(row.dismissedReason ?? "") ? (row.dismissedReason as CompetitionDismissReason) : null,
    // college-content (12 Oct 2026)
    audience: c.audience === "SCHOOL" || c.audience === "COLLEGE" ? c.audience : null,
    streams: c.streams,
  };
}

export async function deskSuggestions(session: ActiveContext, show: CompetitionSuggestionShow): Promise<CompetitionSuggestions> {
  reviewerRole(session);
  const [rows, suggested, changed, dismissed] = await Promise.all([
    db.competitionCrawl.findMany({
      where: SHOW_WHERE[show],
      include: { competition: true, source: true },
      orderBy: show === "CHANGED" ? [{ changedAt: "desc" }] : show === "DISMISSED" ? [{ dismissedAt: "desc" }] : [{ crawledAt: "desc" }],
      take: 200,
    }),
    db.competitionCrawl.count({ where: SHOW_WHERE.SUGGESTED }),
    db.competitionCrawl.count({ where: SHOW_WHERE.CHANGED }),
    db.competitionCrawl.count({ where: SHOW_WHERE.DISMISSED }),
  ]);
  return { show, counts: { suggested, changed, dismissed }, items: rows.map(suggestionOut) };
}

async function crawled(competitionId: string): Promise<CrawlWithAll> {
  const row = await db.competitionCrawl.findFirst({ where: { competitionId, competition: { organizerSchoolId: null } }, include: { competition: true, source: true } });
  if (!row) throw new DeskRefusal("competitionCrawl.noSuchSuggestion", 404);
  return row;
}

export async function deskSuggestion(session: ActiveContext, competitionId: string): Promise<CompetitionSuggestion> {
  reviewerRole(session);
  return suggestionOut(await crawled(competitionId));
}

/** DISMISS a suggestion with a coded reason; it is not suggested again unless its page changes. Idempotent. */
export async function deskDismiss(session: ActiveContext, competitionId: string, reason: CompetitionDismissReason): Promise<CompetitionSuggestion> {
  const role = reviewerRole(session);
  const row = await crawled(competitionId);
  if (row.matchedExisting || row.competition.status !== "DRAFT") throw new DeskRefusal("competitionCrawl.onlyDraftsDismissed", 409);
  if (!row.dismissedAt || row.dismissedReason !== reason) {
    await db.competitionCrawl.update({ where: { id: row.id }, data: { dismissedAt: row.dismissedAt ?? new Date(), dismissedReason: reason, dismissedByUserId: session.user.id, dismissedPageHash: row.pageHash } });
    await audit({ schoolId: null, actorUserId: session.user.id, action: "appadmin.competition.dismiss", targetType: "Competition", targetId: competitionId, meta: { role, reason, pageUrl: row.pageUrl } });
  }
  return suggestionOut(await crawled(competitionId));
}

/** A published one the crawler found changed: the reviewer has looked. The diff goes into the audit line; the flag comes off. */
export async function deskMarkReviewed(session: ActiveContext, competitionId: string): Promise<CompetitionSuggestion> {
  const role = reviewerRole(session);
  const row = await crawled(competitionId);
  if (row.changedSinceReview) {
    await db.competitionCrawl.update({ where: { id: row.id }, data: { changedSinceReview: false, diff: Prisma.DbNull, reviewedAt: new Date(), reviewedByUserId: session.user.id } });
    await audit({ schoolId: null, actorUserId: session.user.id, action: "appadmin.competition.reviewed", targetType: "Competition", targetId: competitionId, meta: { role, diff: row.diff } });
  }
  return suggestionOut(await crawled(competitionId));
}

function day(value: string | null | undefined): Date | null {
  if (!value || !value.trim()) return null;
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value.trim()) ? `${value.trim()}T12:00:00.000Z` : value.trim());
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * EDIT A PLATFORM COMPETITION'S DRAFT in place (the content team's draft edit; the web's form and the
 * door). A published one is put back to a draft first through the status door; a school's own
 * competition matches nothing here. The words before are kept in the audit line.
 */
export async function deskEditDraft(session: ActiveContext, competitionId: string, input: CompetitionDraftEdit): Promise<{ changed: string[] }> {
  const role = reviewerRole(session);
  const title = input.title.trim();
  const summary = input.summary.trim();
  if (title.length < 3) throw new DeskRefusal("appadmin.titleTooShort", 422);
  if (summary.length < 3) throw new DeskRefusal("appadmin.summaryTooShort", 422);
  const externalUrl = input.externalUrl?.trim() || null;
  if (externalUrl && !isHttpsUrl(externalUrl)) throw new DeskRefusal("appadmin.linkMustBeHttps", 422);
  const current = await db.competition.findFirst({ where: { id: competitionId, organizerSchoolId: null } });
  if (!current) throw new DeskRefusal("competitionCrawl.noSuchSuggestion", 404);
  if (current.status !== "DRAFT") throw new DeskRefusal("competitionCrawl.onlyDraftsEdited", 409);
  // A field the body leaves out keeps what it was; a field sent empty is cleared.
  const keep = <K extends keyof typeof current>(k: K, v: string | null | undefined) => (v === undefined ? current[k] : (v ?? "").trim() || null);
  const keepDay = <K extends "registrationOpensAt" | "registrationClosesAt" | "startsAt" | "endsAt">(k: K, v: string | null | undefined) => (v === undefined ? current[k] : day(v));
  const next = {
    title,
    summary,
    body: input.body === undefined ? current.body : (input.body ?? "").trim(),
    organizerName: (input.organizerName ?? "").trim() || current.organizerName,
    subject: keep("subject", input.subject),
    gradeLow: keep("gradeLow", input.gradeLow),
    gradeHigh: keep("gradeHigh", input.gradeHigh),
    eligibility: keep("eligibility", input.eligibility),
    rules: keep("rules", input.rules),
    prizes: keep("prizes", input.prizes),
    externalUrl: input.externalUrl === undefined ? current.externalUrl : externalUrl,
    registrationOpensAt: keepDay("registrationOpensAt", input.registrationOpensAt),
    registrationClosesAt: keepDay("registrationClosesAt", input.registrationClosesAt),
    startsAt: keepDay("startsAt", input.startsAt),
    endsAt: keepDay("endsAt", input.endsAt),
  };
  const before: Record<string, unknown> = {};
  const changed: string[] = [];
  for (const [k, v] of Object.entries(next)) {
    const was = (current as Record<string, unknown>)[k];
    const same = v instanceof Date || was instanceof Date ? (v as Date | null)?.getTime() === (was as Date | null)?.getTime() : (v ?? null) === (was ?? null);
    if (!same) {
      changed.push(k);
      before[k] = was instanceof Date ? was.toISOString() : was;
    }
  }
  if (changed.length) {
    await db.competition.update({ where: { id: competitionId }, data: Object.fromEntries(changed.map((k) => [k, next[k as keyof typeof next]])) });
    await audit({ schoolId: null, actorUserId: session.user.id, action: "appadmin.competition.edit", targetType: "Competition", targetId: competitionId, meta: { role, changed, before } });
  }
  return { changed };
}
