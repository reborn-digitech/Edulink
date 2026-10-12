/**
 * A WHOLE CRAWL over the enabled sources (competitions-crawler, 12 October 2026), separate from the
 * process that hosts it (job.ts) so the suites can run it with a fake network, a fake model and a fake
 * embedder. One source at a time; per source scripts/competitions-crawl/crawl.ts; per new or changed page
 * the model's extraction (extract.ts); per entry the landing rules (land.ts). The live line is written
 * after every page; each source's own numbers (or its refusal) are kept on its row for the desk.
 */
import type { Prisma, PrismaClient } from "@prisma/client";
import type { CompetitionCrawlProgress, CompetitionCrawlRequest, CompetitionCrawlSourceResult } from "@edulink/contracts";
import { crawlSource, type CachedPage, type PageCache } from "./crawl";
import { extractCompetitions, worthExtracting, type ExtractClient } from "./extract";
import { buildDedupeIndex, landEntry, type Embed } from "./land";
import type { PoliteClient } from "./http";

export type RunDb = Pick<PrismaClient, "competition" | "competitionCrawl" | "competitionSource" | "competitionCrawlPage">;

/** The page cache on CompetitionCrawlPage. */
export function dbPageCache(db: RunDb): PageCache {
  return {
    async get(url) {
      const row = await db.competitionCrawlPage.findUnique({ where: { url } });
      return row ? { url: row.url, etag: row.etag, lastModified: row.lastModified, sha256: row.sha256, links: row.links, status: row.status, refused: row.refused } : null;
    },
    async put(sourceId, page: CachedPage & { contentType: string | null; fetched: boolean }) {
      const now = new Date();
      const data = { sourceId, etag: page.etag, lastModified: page.lastModified, sha256: page.sha256, links: page.links, status: page.status, refused: page.refused, contentType: page.contentType, checkedAt: now, ...(page.fetched ? { fetchedAt: now } : {}) };
      await db.competitionCrawlPage.upsert({ where: { url: page.url }, create: { url: page.url, ...data }, update: data });
    },
  };
}

export type RunDeps = {
  client: PoliteClient;
  model: ExtractClient;
  embed: Embed;
  shouldStop: () => boolean;
  onProgress: (p: CompetitionCrawlProgress) => void | Promise<void>;
  log: (line: string) => void;
  now?: () => Date;
  pdfText?: (bytes: Uint8Array) => Promise<string>;
  maxPages?: number;
};

const emptyResult = (): CompetitionCrawlSourceResult => ({ pages: 0, cached: 0, candidates: 0, drafted: 0, updated: 0, dismissedUnchanged: 0, changedPublished: 0, rejected: 0, refused: null });

export async function crawlAll(db: RunDb, request: CompetitionCrawlRequest, progress: CompetitionCrawlProgress, deps: RunDeps): Promise<{ stopped: boolean }> {
  const now = deps.now ?? (() => new Date());
  const runStartedAt = now();
  const all = await db.competitionSource.findMany({ where: { removedAt: null }, orderBy: { createdAt: "asc" } });
  const organiserRoots = all.map((s) => s.rootUrl);
  const sources = all.filter((s) => s.enabled && (!request.sourceIds?.length || request.sourceIds.includes(s.id)));
  progress.phase = "CRAWLING";
  progress.sourcesTotal = sources.length;
  await deps.onProgress(progress);
  deps.log(`${sources.length} source(s) to crawl`);

  const index = await buildDedupeIndex(db, deps.embed);
  const cache = dbPageCache(db);
  const today = runStartedAt.toISOString().slice(0, 10);
  let stopped = false;

  for (const source of sources) {
    if (deps.shouldStop()) {
      stopped = true;
      break;
    }
    progress.source = source.name;
    await deps.onProgress(progress);
    deps.log(`${source.name} — ${source.rootUrl}`);
    const result = emptyResult();
    let seed = 1;
    const outcome = await crawlSource(source, {
      client: deps.client,
      cache,
      shouldStop: deps.shouldStop,
      log: deps.log,
      pdfText: deps.pdfText,
      maxPages: deps.maxPages,
      onPage: async (page) => {
        if (!worthExtracting(page.text)) {
          progress.pagesRead++;
          result.pages++;
          deps.log(`  read ${page.url}: no competition words and no year; not sent to the model`);
          await deps.onProgress(progress);
          return;
        }
        const extracted = await extractCompetitions(deps.model, page, { sourceName: source.name, organiser: source.organiser, today }, seed++);
        result.candidates += extracted.entries.length + extracted.shapeRejects;
        progress.candidates += extracted.entries.length + extracted.shapeRejects;
        if (extracted.shapeRejects) {
          progress.rejects.SHAPE = (progress.rejects.SHAPE ?? 0) + extracted.shapeRejects;
          result.rejected += extracted.shapeRejects;
        }
        const samePage = new Set<string>();
        for (const entry of extracted.entries) {
          const landed = await landEntry(db, entry, { source, organiserRoots, pageUrl: page.url, pageHash: page.sha256, now: now(), runStartedAt, samePage, pageText: page.text }, index, deps.embed);
          const o = landed.outcome;
          if (typeof o === "object") {
            progress.rejects[o.rejected] = (progress.rejects[o.rejected] ?? 0) + 1;
            result.rejected++;
          } else if (o === "DRAFTED") {
            progress.drafted++;
            result.drafted++;
          } else if (o === "UPDATED") {
            progress.updated++;
            result.updated++;
          } else if (o === "DISMISSED_UNCHANGED") {
            progress.dismissedUnchanged++;
            result.dismissedUnchanged++;
          } else if (o === "CHANGED_PUBLISHED") {
            progress.changedPublished++;
            result.changedPublished++;
          }
          deps.log(`    ${typeof o === "object" ? `rejected ${o.rejected}` : o.toLowerCase()}: ${entry.title} (${entry.confidence})${landed.datesDropped ? `; ${landed.datesDropped} date(s) not on the page, dropped` : ""}`);
        }
        progress.pagesRead++;
        result.pages++;
        deps.log(`  read ${page.url}: ${extracted.entries.length} entr${extracted.entries.length === 1 ? "y" : "ies"}${extracted.shapeRejects ? `, ${extracted.shapeRejects} misshapen` : ""}${extracted.cut ? " (cut to the window)" : ""}`);
        await deps.onProgress(progress);
      },
    });
    result.cached = outcome.cachedHits;
    progress.cachedHits += outcome.cachedHits;
    for (const r of outcome.pageRefusals) deps.log(`  not read ${r.url}: ${r.reason} (${r.detail})`);
    if (outcome.refused) {
      result.refused = { reason: outcome.refused.reason, detail: outcome.refused.detail.slice(0, 300) };
      progress.refused.push({ source: source.name, reason: outcome.refused.reason, detail: outcome.refused.detail.slice(0, 300) });
      deps.log(`  REFUSED: ${outcome.refused.reason} (${outcome.refused.detail})`);
    }
    progress.sourcesVisited++;
    await db.competitionSource.update({ where: { id: source.id }, data: { lastCrawledAt: now(), lastResult: result as Prisma.InputJsonValue } });
    await deps.onProgress(progress);
    if (outcome.stopped) {
      stopped = true;
      break;
    }
  }
  progress.source = null;
  return { stopped };
}
