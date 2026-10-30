/**
 * The curriculum corpus into the content tables (docs/plans/assistant.md §5, Phase A; runbook
 * docs/runbooks/assistant-local.md).
 *
 *   npm run corpus:ingest -- [--source=ncert,…] [--prefix=ncert/8] [--reembed] [--reextract]
 *                            [--extract-only | --embed-only] [--shard=1/6] [--limit=20] [--no-figures]
 *
 * TWO PASSES, EACH RESUMABLE.
 *   Extract: every fetched PDF in storage/corpus (by its folder's manifest.json) is read page by
 *   page (scripts/corpus-pdf.ts), its figures cut to `<folder>/figures/<file>-p<page>-<n>.png`
 *   with the nearest caption, its text chunked by chapter and section (scripts/corpus-chunk.ts),
 *   and written as one ContentDocument and its ContentChunks. A document whose checksum is already
 *   in the table is skipped; a changed file replaces its chunks.
 *   A past paper (source "papers", 10 Oct 2026) is read with its short runs kept and no figures, cut by
 *   question (scripts/corpus-papers-chunk.ts), its chunks given a kind and its document `styleOnly`, so
 *   the tutor's search never returns it (docs/runbooks/assistant-local.md §8).
 *   Embed: every chunk without a vector is embedded through ASSISTANT_EMBED_URL's /embeddings in
 *   batches, and the rate is printed in chunks per minute. --reembed clears the vectors first
 *   (of --source or --prefix only, when given).
 *
 * --shard=k/n runs the extract pass over every n-th document from the k-th, so several processes
 * can share it (pdfjs is single-threaded); run the embed pass once, after, in one process. (Three
 * embeddings servers side by side were tried on 8 Oct 2026: no faster, the GPU is the limit, and
 * beside the chat model they failed with Metal compute errors.)
 *
 * Runs as the OWNER (npm run corpus:ingest wraps it in with-admin-db.mjs): the content tables are
 * written by the owner only. Refuses a database that is not on this machine, and refuses to start
 * without the embedding endpoint configured.
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { mkdirSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import { basename, join, relative } from "node:path";
import { config } from "dotenv";
import { CORPUS_ROOT, SOURCES, walkManifests, type ManifestEntry, type SourceKey } from "./corpus-lib";
import { closeOcr, contrastOcr, extractPdf, toPng, type OcrReader } from "./corpus-pdf";
import { chunk, chunkPlainText, editionIn, chapterNameFromTitle, lettersOfTitle, type Element, type Structured } from "./corpus-chunk";
import { splitBookWithOcr, withChapterHeadings } from "./corpus-contents";
import { chunkPaper, type PaperChunk } from "./corpus-papers-chunk";
import { refuseUnlessLocalDatabase } from "./local-db-guard.mjs";
import { requireEmbedConfig } from "../src/lib/assistant-env";
import { EmbeddingBroken, embedTexts, vectorLiteral } from "../src/lib/assistant-model";

config();

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  return hit.includes("=") ? hit.slice(hit.indexOf("=") + 1) : "true";
}

const SOURCE_ARG = arg("source");
const PREFIX = arg("prefix")?.replace(/^\/+|\/+$/g, "");
const REEMBED = arg("reembed") === "true";
const REEXTRACT = arg("reextract") === "true";
const EXTRACT_ONLY = arg("extract-only") === "true";
const EMBED_ONLY = arg("embed-only") === "true";
const FIGURES = arg("no-figures") !== "true";
const OCR = process.env.CORPUS_OCR !== "0";
const LIMIT = arg("limit") ? Number(arg("limit")) : Infinity;
const [SHARD_K = 1, SHARD_N = 1] = (arg("shard") ?? "1/1").split("/").map(Number);
const BATCH = Number(process.env.CORPUS_EMBED_BATCH ?? 32) || 32;
const IN_FLIGHT = Number(process.env.CORPUS_EMBED_PARALLEL ?? 2) || 2;

const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });

const sources: SourceKey[] | undefined = SOURCE_ARG ? (SOURCE_ARG.split(",") as SourceKey[]) : undefined;

/** Tesseract languages for a scanned page, by the document's language. */
function ocrLangsFor(language: string): string {
  if (language.startsWith("mr")) return "mar+eng";
  if (language.includes("hi")) return "eng+hin";
  return "eng";
}

const DEVANAGARI = /[\u0900-\u097F]/g;
function chunkLanguage(docLanguage: string, text: string): string {
  const letters = text.replace(/[^\p{L}]/gu, "").length || 1;
  const deva = (text.match(DEVANAGARI) ?? []).length;
  if (deva / letters < 0.3) return "en";
  return docLanguage.startsWith("mr") ? "mr" : "hi";
}

/** One-chapter files: NCERT serves a PDF per chapter, NIOS a PDF per lesson. */
function perChapterFile(e: ManifestEntry): boolean {
  if (e.source === "ncert") return typeof e.extra?.chapter === "number";
  if (e.source === "nios") return true;
  return false;
}

function chapterLabel(e: ManifestEntry, found: string | null): string | null {
  const n = e.extra?.chapter;
  // The publisher's own name for the chapter beats a title page short of its letters or printed over itself (10 Oct 2026).
  const listed = chapterNameFromTitle(e.title);
  const name = listed && (!found || lettersOfTitle(found, listed)) ? listed : found;
  if (typeof n === "number" && name) return `Chapter ${n}: ${name}`;
  if (typeof n === "number") return `Chapter ${n}`;
  return name;
}

/** NCERT prints the edition in a book's prelims, not its chapters: read once per book. */
const prelimsEdition = new Map<string, string | null>();
async function bookEdition(dir: string, e: ManifestEntry): Promise<string | null> {
  const code = typeof e.extra?.bookCode === "string" ? e.extra.bookCode : null;
  if (e.source !== "ncert" || !code) return null;
  const key = `${dir}/${code}`;
  if (prelimsEdition.has(key)) return prelimsEdition.get(key) ?? null;
  const prelims = join(dir, `${code}ps.pdf`);
  let edition: string | null = null;
  if (existsSync(prelims)) {
    try {
      const { pages } = await extractPdf(new Uint8Array(readFileSync(prelims)), { figures: false, ocrLangs: null });
      edition = editionIn(pages.flatMap((p) => p.runs.map((r) => r.text)));
    } catch {
      edition = null;
    }
  }
  prelimsEdition.set(key, edition);
  return edition;
}

type Totals = { documents: number; skipped: number; failed: number; pages: number; ocrPages: number; chunks: number; figures: number };
const totals: Totals = { documents: 0, skipped: 0, failed: 0, pages: 0, ocrPages: 0, chunks: 0, figures: 0 };

async function ingestOne(dir: string, e: ManifestEntry): Promise<void> {
  const file = join(dir, e.file);
  const path = relative(CORPUS_ROOT, file).split("\\").join("/");
  const existing = await db.contentDocument.findUnique({ where: { path }, select: { id: true, sha256: true } });
  if (existing && existing.sha256 === e.sha256 && !REEXTRACT) {
    totals.skipped++;
    return;
  }
  // VIDURA PASS 4 (18 Oct 2026): a plain-text article (the Wikipedia subset, scripts/corpus-college.ts) is cut by its
  // "== Heading ==" sections, carries its attribution, audience and streams, and has no pages or figures.
  if (/\.txt$/i.test(e.file)) {
    await ingestText(path, readFileSync(file, "utf8"), e);
    return;
  }
  const bytes = new Uint8Array(readFileSync(file));
  // A past paper (source "papers", 10 Oct 2026): a STYLE document, cut by question, no figures kept
  // (the generator never takes a paper's drawing); its numbers and option letters are short runs kept,
  // its pictures read by OCR where the questions are pictures (JEE (Main)), a two-column scan read
  // half by half (NEET (UG) 2020).
  const isPaper = e.source === "papers";
  // A scanned or garbled page of a paper is rendered and read (a landscape sheet half by half); a paper
  // whose questions turn out to be pictures beside a text layer of labels (JEE (Advanced) 2007–2010) is
  // read again with its pictures read too.
  const paperOptions = (pictures: boolean) => ({ figures: false, ocrLangs: OCR ? ocrLangsFor(e.language) : null, keepShortRuns: true, ocrPictures: pictures, ocrHalves: !!e.paper?.twoColumns, ocrRenderAll: true, ocrGarbled: true });
  const paperChunks = (pages: Awaited<ReturnType<typeof extractPdf>>["pages"]) => chunkPaper(pages, { title: e.title, part: e.paper?.part ?? "paper", subjects: e.subject.split(/\s*,\s*/).filter(Boolean) });
  // pdfjs takes the bytes' buffer for itself: each read gets its own copy, so the retry has bytes to read.
  let { pages } = await extractPdf(bytes.slice(), isPaper ? paperOptions(!!e.paper?.textInPictures) : { figures: FIGURES, ocrLangs: OCR ? ocrLangsFor(e.language) : null });
  let paper = isPaper ? paperChunks(pages) : null;
  if (paper && OCR && !e.paper?.textInPictures && e.paper?.part !== "answer-key" && paper.chunks.filter((c) => c.kind === "question").length < 3) {
    const again = await extractPdf(bytes.slice(), paperOptions(true));
    const retry = paperChunks(again.pages);
    if (retry.chunks.filter((c) => c.kind === "question").length > paper.chunks.filter((c) => c.kind === "question").length) {
      pages = again.pages;
      paper = retry;
    }
  }
  const base = basename(e.file).replace(/\.pdf$/i, "");
  const figureDir = join(dir, "figures");
  // owner-batch-item7 (30 Oct 2026): a Balbharati book is one file whose chapters its contents page gives (the chunker's
  // largest-face rule took the cover's title for the one chapter of every chunk): each chapter starts a chunk of its own
  // under "N. Title" (scripts/corpus-contents.ts). A book that cannot be split keeps the chunker's own headings, said so.
  let transformElements: ((elements: Element[]) => Element[]) | undefined;
  if (!isPaper && e.source === "balbharati" && e.kind === "textbook") {
    const front = (ocr?: OcrReader) => async () => (await extractPdf(bytes.slice(), { figures: false, ocrLangs: ocrLangsFor(e.language), ocrRenderAll: true, ocrPages: (p) => p <= 24, ...(ocr ? { ocr } : {}) })).pages;
    const { split } = await splitBookWithOcr(pages, OCR ? [front(), front(contrastOcr(120)), front(contrastOcr(170))] : null);
    if (split.refusal) console.log(`  ${path}: chapters not split (${split.refusal}); its chunks keep the chunker's own headings`);
    else transformElements = (elements) => withChapterHeadings(elements, split.chapters);
  }
  const structured: Omit<Structured, "chunks"> & { chunks: (Structured["chunks"][number] & { kind?: PaperChunk["kind"] })[] } = paper
    ? { ...paper, figures: [], edition: null, bodySize: 0, chapter: e.title }
    : chunk(pages, {
        perChapterFile: perChapterFile(e),
        chapterLabel: (found) => chapterLabel(e, found),
        figureKey: (page, n) => relative(CORPUS_ROOT, join(figureDir, `${base}-p${page}-${n}.png`)).split("\\").join("/"),
        transformElements,
      });
  const edition = isPaper ? null : (e.edition ?? structured.edition ?? (await bookEdition(dir, e)));

  if (FIGURES && structured.figures.length) {
    mkdirSync(figureDir, { recursive: true });
    const captions: Record<string, { page: number; caption: string | null }> = {};
    for (const f of structured.figures) {
      const out = join(CORPUS_ROOT, f.key);
      if (!existsSync(out)) writeFileSync(out, await toPng(f.image));
      captions[basename(f.key)] = { page: f.page, caption: f.caption };
    }
    // The captions beside the pictures, so a figure can be described without re-reading the PDF.
    const captionFile = join(figureDir, `${base}.captions.json`);
    writeFileSync(captionFile, JSON.stringify(captions, null, 2) + "\n");
  }

  const data = {
    source: e.source,
    kind: e.kind,
    board: e.board,
    gradeOrProgramme: e.gradeOrProgramme,
    subject: e.subject,
    title: e.title,
    language: e.language,
    edition,
    year: e.year,
    sourceUrl: e.sourceUrl,
    licenceUrl: e.licence.url,
    licenceText: e.licence.text ?? null,
    retrievedAt: new Date(e.retrievedAt),
    sha256: e.sha256 ?? "",
    bytes: e.bytes ?? bytes.length,
    pageCount: pages.length,
    extra: (e.paper ? { ...(e.extra ?? {}), paper: e.paper } : (e.extra ?? {})) as Prisma.InputJsonValue,
    // The tutor never cites a paper (searchCurriculum excludes styleOnly); the quiz generator reads it for style.
    styleOnly: isPaper,
    ...collegeFields(e),
  };
  await db.$transaction(async (tx) => {
    const doc = await tx.contentDocument.upsert({ where: { path }, create: { path, ...data }, update: data, select: { id: true } });
    await tx.contentChunk.deleteMany({ where: { documentId: doc.id } });
    if (structured.chunks.length) {
      await tx.contentChunk.createMany({
        data: structured.chunks.map((c) => ({
          documentId: doc.id,
          ordinal: c.ordinal,
          chapter: c.chapter,
          section: c.section,
          headingPath: c.headingPath,
          pageStart: c.pageStart,
          pageEnd: c.pageEnd,
          text: c.text,
          language: chunkLanguage(e.language, c.text),
          tokens: c.tokens,
          figureKeys: c.figureKeys,
          edition,
          kind: c.kind ?? null,
        })),
      });
    }
  }, { timeout: 120_000 });
  totals.documents++;
  totals.pages += pages.length;
  totals.ocrPages += pages.filter((p) => p.ocr).length;
  totals.chunks += structured.chunks.length;
  totals.figures += structured.figures.length;
}

/** Vidura pass 4: who a document is searched for, its streams, its licence's name and the attribution its passages carry. */
function collegeFields(e: ManifestEntry) {
  return {
    audience: e.audience ?? null,
    streams: e.streams ?? [],
    licenceName: e.licence.name ?? null,
    attribution: e.attribution ? (e.attribution as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
  };
}

/** A plain-text article into one document and its chunks (Vidura pass 4). */
async function ingestText(path: string, text: string, e: ManifestEntry): Promise<void> {
  const structured = chunkPlainText(text, { title: e.title });
  const data = {
    source: e.source,
    kind: e.kind,
    board: e.board,
    gradeOrProgramme: e.gradeOrProgramme,
    subject: e.subject,
    title: e.title,
    language: e.language,
    edition: e.edition,
    year: e.year,
    sourceUrl: e.sourceUrl,
    licenceUrl: e.licence.url,
    licenceText: e.licence.text ?? null,
    retrievedAt: new Date(e.retrievedAt),
    sha256: e.sha256 ?? "",
    bytes: e.bytes ?? Buffer.byteLength(text, "utf8"),
    pageCount: 1,
    extra: (e.extra ?? {}) as Prisma.InputJsonValue,
    styleOnly: false,
    ...collegeFields(e),
  };
  await db.$transaction(async (tx) => {
    const doc = await tx.contentDocument.upsert({ where: { path }, create: { path, ...data }, update: data, select: { id: true } });
    await tx.contentChunk.deleteMany({ where: { documentId: doc.id } });
    if (structured.chunks.length) {
      await tx.contentChunk.createMany({
        data: structured.chunks.map((c) => ({
          documentId: doc.id,
          ordinal: c.ordinal,
          chapter: c.chapter,
          section: c.section,
          headingPath: c.headingPath,
          pageStart: c.pageStart,
          pageEnd: c.pageEnd,
          text: c.text,
          language: chunkLanguage(e.language, c.text),
          tokens: c.tokens,
          figureKeys: [],
          edition: e.edition,
          kind: null,
        })),
      });
    }
  }, { timeout: 120_000 });
  totals.documents++;
  totals.pages += 1;
  totals.chunks += structured.chunks.length;
}

async function extractPass() {
  const entries = walkManifests(CORPUS_ROOT, sources)
    // A PDF, or (Vidura pass 4) a plain-text article.
    .filter(({ entry }) => entry.fetched && (/\.pdf$/i.test(entry.file) || (/\.txt$/i.test(entry.file) && entry.source === "wikipedia")))
    // A book's prelims carry its edition and contents, not teaching text: read for the edition only.
    .filter(({ entry }) => entry.extra?.part !== "prelims")
    .filter(({ dir, entry }) => !PREFIX || relative(CORPUS_ROOT, join(dir, entry.file)).startsWith(PREFIX))
    .sort((a, b) => join(a.dir, a.entry.file).localeCompare(join(b.dir, b.entry.file)))
    .filter((_, i) => i % SHARD_N === SHARD_K - 1)
    .slice(0, LIMIT);
  console.log(`Extract: ${entries.length} documents${SHARD_N > 1 ? ` (shard ${SHARD_K}/${SHARD_N})` : ""}`);
  const started = Date.now();
  let n = 0;
  for (const { dir, entry } of entries) {
    n++;
    try {
      await ingestOne(dir, entry);
    } catch (err) {
      totals.failed++;
      console.error(`  failed ${relative(CORPUS_ROOT, join(dir, entry.file))}: ${err instanceof Error ? err.message || err.stack : typeof err === "object" ? JSON.stringify(err) : String(err)}`);
    }
    if (n % 25 === 0 || n === entries.length) {
      const min = (Date.now() - started) / 60000;
      console.log(`  ${n}/${entries.length} — ${totals.documents} written, ${totals.skipped} unchanged, ${totals.failed} failed; ${totals.pages} pages (${totals.ocrPages} by OCR), ${totals.chunks} chunks, ${totals.figures} figures; ${(totals.pages / Math.max(min, 1e-6)).toFixed(0)} pages/min`);
    }
  }
  await closeOcr();
}

/** The endpoint refused an input longer than its context window (llama-server's exceed_context_size_error). */
function tooLong(err: unknown): boolean {
  return err instanceof Error && /exceeds the available context size|input is too large|too many tokens/i.test(err.message);
}

/** The text a chunk is embedded as: its book and heading path first, so a bare paragraph still says what it is about. */
function embeddingInput(r: { title: string; headingPath: string[]; text: string }): string {
  const head = [r.title, ...r.headingPath].filter(Boolean).join(" › ");
  // 3,500 characters stays under the embeddings server's 4k-token window (scripts/model-serve.sh)
  // even for text that tokenises badly; a chunk is about 2,000.
  return `${head}\n\n${r.text}`.slice(0, 3500);
}

async function embedPass() {
  const ep = requireEmbedConfig("corpus:ingest");
  const scope = Prisma.sql`${sources ? Prisma.sql`AND d."source" IN (${Prisma.join(sources)})` : Prisma.empty} ${PREFIX ? Prisma.sql`AND d."path" LIKE ${PREFIX + "%"}` : Prisma.empty}`;
  if (REEMBED) {
    const cleared = await db.$executeRaw`UPDATE "ContentChunk" c SET "embedding" = NULL, "embeddedAt" = NULL FROM "ContentDocument" d WHERE d."id" = c."documentId" AND c."embedding" IS NOT NULL ${scope}`;
    console.log(`Re-embed: cleared ${cleared} vectors`);
  }
  const pendingRows = await db.$queryRaw<{ pending: bigint }[]>`SELECT count(*)::bigint AS pending FROM "ContentChunk" c JOIN "ContentDocument" d ON d."id" = c."documentId" WHERE c."embedding" IS NULL ${scope}`;
  const pending = pendingRows[0]?.pending ?? 0n;
  console.log(`Embed: ${pending} chunks without a vector (${ep.model} at ${ep.url}, batches of ${BATCH}, ${IN_FLIGHT} in flight)`);
  const started = Date.now();
  let done = 0;
  let broken = 0;
  let lastId = "";
  let lastReport = Date.now();
  for (;;) {
    const rows = await db.$queryRaw<{ id: string; title: string; headingPath: string[]; text: string }[]>`
      SELECT c."id", d."title", c."headingPath", c."text"
        FROM "ContentChunk" c JOIN "ContentDocument" d ON d."id" = c."documentId"
       WHERE c."embedding" IS NULL AND c."id" > ${lastId} ${scope}
       ORDER BY c."id" LIMIT ${BATCH * IN_FLIGHT}`;
    if (rows.length === 0) break;
    lastId = rows[rows.length - 1]!.id;
    const batches: (typeof rows)[] = [];
    for (let i = 0; i < rows.length; i += BATCH) batches.push(rows.slice(i, i + BATCH));
    await Promise.all(
      batches.map(async (batch) => {
        // A broken answer (non-finite values, EmbeddingBroken) is retried, then the batch is sent one
        // chunk at a time; a chunk that still fails keeps a null vector and is counted, never stored as zeros.
        const write = async (rows: typeof batch, vectors: number[][]) => {
          await db.$executeRaw`
            UPDATE "ContentChunk" c SET "embedding" = v.e::vector, "embeddedAt" = now()
              FROM (SELECT unnest(${rows.map((r) => r.id)}::text[]) AS id, unnest(${vectors.map(vectorLiteral)}::text[]) AS e) v
             WHERE c."id" = v.id`;
        };
        let vectors: number[][] | null = null;
        for (let attempt = 1; attempt <= 3 && !vectors; attempt++) {
          try {
            vectors = await embedTexts(ep, batch.map(embeddingInput), { timeoutMs: 300_000 });
          } catch (err) {
            if (tooLong(err)) break; // one input is over the window: the singles below shorten it
            if (!(err instanceof EmbeddingBroken) && attempt === 3) throw err;
            await new Promise((r) => setTimeout(r, 1000 * attempt));
          }
        }
        if (vectors) await write(batch, vectors);
        else {
          let brokenHere = 0;
          for (const row of batch) {
            // Text that tokenises at more than a token a character (formulae, tables, a legacy font)
            // can pass 3,500 characters and still overflow the 4k window: halve it until it fits.
            let input = embeddingInput(row);
            for (let cut = 0; cut < 4; cut++) {
              try {
                await write([row], await embedTexts(ep, [input], { timeoutMs: 120_000 }));
                break;
              } catch (err) {
                if (tooLong(err) && cut < 3) {
                  input = input.slice(0, Math.floor(input.length / 2));
                  continue;
                }
                if (!(err instanceof EmbeddingBroken) && !tooLong(err)) throw err;
                broken++;
                // Every input broken, one at a time too: the server itself is in the broken state seen
                // on 8 Oct 2026, and only a restart mends it. Stop rather than crawl through the corpus.
                if (err instanceof EmbeddingBroken && ++brokenHere === 3 && brokenHere === batch.indexOf(row) + 1) {
                  throw new Error("the embeddings server answers broken vectors for every input: restart it (npm run model:serve -- restart-embed) and run the ingest again; nothing broken was stored");
                }
                break;
              }
            }
          }
        }
        done += batch.length;
      }),
    );
    if (Date.now() - lastReport > 30_000) {
      lastReport = Date.now();
      const min = (Date.now() - started) / 60000;
      console.log(`  ${done}/${pending} embedded — ${(done / min).toFixed(0)} chunks/min`);
    }
  }
  const min = (Date.now() - started) / 60000;
  console.log(`Embedded ${done - broken} chunks in ${min.toFixed(1)} min — ${done ? ((done - broken) / Math.max(min, 1e-6)).toFixed(0) : 0} chunks/min${broken ? `; ${broken} could not be embedded (a broken answer, or too long at an eighth of its length) and stay without a vector` : ""}`);
  return { done, minutes: min };
}

async function main() {
  if (sources) for (const s of sources) if (!SOURCES.includes(s)) throw new Error(`unknown source "${s}" — one of ${SOURCES.join(", ")}`);
  if (!(SHARD_N >= 1 && SHARD_K >= 1 && SHARD_K <= SHARD_N)) throw new Error("--shard is k/n with 1 ≤ k ≤ n");
  await refuseUnlessLocalDatabase(db, "corpus:ingest");
  // Checked before any work: the extract pass is long, and an ingest that cannot embed is half a run.
  requireEmbedConfig("corpus:ingest");
  if (!EMBED_ONLY) {
    await extractPass();
    // Vidura pass 4 (18 Oct 2026): fresh statistics after the documents changed, so the planner reads the books and the
    // college sources at their real sizes (a stale estimate once turned a 22 ms keyword search into 43 s).
    await db.$executeRawUnsafe(`ANALYZE "ContentDocument"`);
    await db.$executeRawUnsafe(`ANALYZE "ContentChunk"`);
  }
  let embedded: { done: number; minutes: number } | null = null;
  if (!EXTRACT_ONLY) embedded = await embedPass();
  const [counts = { documents: 0n, chunks: 0n, embedded: 0n }] = await db.$queryRaw<{ documents: bigint; chunks: bigint; embedded: bigint }[]>`
    SELECT (SELECT count(*) FROM "ContentDocument")::bigint AS documents,
           (SELECT count(*) FROM "ContentChunk")::bigint AS chunks,
           (SELECT count(*) FROM "ContentChunk" WHERE "embedding" IS NOT NULL)::bigint AS embedded`;
  console.log(`\nThis run: ${totals.documents} documents written, ${totals.skipped} unchanged, ${totals.failed} failed; ${totals.pages} pages (${totals.ocrPages} by OCR); ${totals.chunks} chunks; ${totals.figures} figures.`);
  if (embedded) console.log(`Embedding: ${embedded.done} chunks in ${embedded.minutes.toFixed(1)} min.`);
  console.log(`In the tables: ${counts.documents} documents, ${counts.chunks} chunks, ${counts.embedded} with a vector.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
