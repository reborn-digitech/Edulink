/**
 * Every Balbharati textbook gets its chapters (owner-batch-item7, 30 October 2026), so the generator can plan them.
 *
 *   npm run corpus:balbharati-chapters                 the review: per book the chapters found, their pages, the chunks each gets
 *   npm run corpus:balbharati-chapters -- --apply      writes each chunk's chapter and the first of its heading path
 *   [--prefix=balbharati/9]                            only documents under that folder
 *   [--all-subjects]                                   every subject, not only those the generator plans (QUIZ_GEN_SUBJECTS)
 *   [--grades=3-12]                                    the classes (default 3 to 12)
 *   [--no-ocr]                                         never read a contents page drawn as a picture
 *   [--skip=path,path]                                 leave these documents out (see "A RUN IN PROGRESS" below)
 *
 * THE FAULT AND THE METHOD are in scripts/corpus-contents.ts: the chunker's level-0 heading in a whole-book file is the
 * book's largest face, which in a Balbharati book is its cover title, so every chunk carried one label ("Mathematics")
 * and the generator's listChapters found no chapter numbers. Here each book's PDF is read again with the ingest's own
 * pdfjs path (scripts/corpus-pdf.ts, no figures), its contents page found (OCR'd, front pages only, when the page is a
 * picture), each title placed on its opening page, and every chunk given its chapter by the page it starts on.
 *
 * WHAT IT WRITES (--apply, as the owner: the script is wrapped in with-admin-db.mjs). `chapter` and the first of
 * `headingPath` of every chunk of a split book: "N. Title" ("3. Triangles"), a second numbered sequence of the same file
 * "Civics · 2. Title"; below the label the chunk's own headings, the front matter's headings that ran on and the
 * chapter titles the old path carried as sections dropped. Nothing else: not the text, not the pages, not the vectors
 * (the heading path is the first line of what corpus-ingest.ts embeddingInput() embeds, a few dozen characters of about
 * two thousand; `npm run corpus:ingest -- --reembed --prefix=balbharati/…` would refresh them). A book already split by
 * its own "N. Title" headings (class 8 science) is left as it is. A book that cannot be split is REFUSED and listed,
 * never guessed. Idempotent: a second run finds nothing to change. The project audits corpus changes in a decisions
 * file, as corpus:titles does: storage/corpus/balbharati-chapters-<date>.json for an applied run (never overwritten:
 * -2, -3… after it), …-review.json for a review.
 *
 * A RUN IN PROGRESS. A generation run started before this change reads Balbharati with the old selection (the first
 * document by path, chapter numbers per document): where that first document is not the plan's first book (class 3
 * EVS, whose part 2, 303000869, sorts before the district editions of part 1) it would draft part 2's chapters under
 * part 1's numbers. Such a document is left out with --skip until the run has been restarted on this code.
 *
 * WHICH DOCUMENTS ARE ONE BOOK is decided where the generator reads them (corpus-contents.ts chooseBooks, called by
 * scripts/quiz-gen/select.ts): district editions collapse to one, a misfiled book is set aside; this script reports it.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient, type Prisma } from "@prisma/client";
import { config } from "dotenv";
import { QUIZ_GEN_SUBJECTS } from "@edulink/contracts";
import { CORPUS_ROOT } from "./corpus-lib";
import { closeOcr, contrastOcr, extractPdf, type PageContent } from "./corpus-pdf";
import { chapterLabel, chooseBooks, labelChunks, splitBookWithOcr, type BookSplit } from "./corpus-contents";
import { loadDictionary, titleFragment, vocabularyOf } from "./corpus-titles";
import { chapterNumberOf } from "./quiz-gen/checks";
import { subjectCodeOf } from "./quiz-gen/select";
import { refuseUnlessLocalDatabase } from "./local-db-guard.mjs";

config();

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  return hit.includes("=") ? hit.slice(hit.indexOf("=") + 1) : "true";
}

const APPLY = arg("apply") === "true";
const PREFIX = arg("prefix")?.replace(/^\/+|\/+$/g, "");
const ALL_SUBJECTS = arg("all-subjects") === "true";
const OCR = arg("no-ocr") !== "true";
const SKIP = new Set((arg("skip") ?? "").split(",").map((x) => x.trim()).filter(Boolean));
const [GRADE_FROM, GRADE_TO] = (arg("grades") ?? "3-12").split("-").map(Number) as [number, number];
/** The front pages a contents page is looked for in, and OCR'd when they are pictures. */
const FRONT = 24;

const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });

type Doc = { id: string; path: string; title: string; subject: string; gradeOrProgramme: string; extra: Prisma.JsonValue; pageCount: number };

type BookReport = {
  path: string;
  title: string;
  grade: number;
  subject: string;
  outcome: "split" | "kept" | "refused";
  method: BookSplit["method"] | "own-headings";
  contentsPage: number | null;
  contentsByOcr: boolean;
  reason?: string;
  notes: string[];
  chapters: { label: string; pages: string; chunks: number; how: string; titleFrom: string; noTitle?: string }[];
  chunks: number;
  outside: number;
  changed: number;
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Labels the chunks already carry that number 1, 2, 3… with a title: a book split by its own headings (class 8 science). */
function ownHeadings(rows: { chapter: string | null; headingPath: string[] }[]): number[] | null {
  const numbers = new Set<number>();
  for (const r of rows) {
    const n = chapterNumberOf(r.chapter ?? r.headingPath[0] ?? "");
    if (n !== null) numbers.add(n);
  }
  const sorted = [...numbers].sort((a, b) => a - b);
  return sorted.length >= 3 && sorted.every((n, i) => n === i + 1) ? sorted : null;
}

/** The book's pages: the text layer alone ("none"), or its front pages OCR'd plain or made black on white at a threshold. */
async function readPages(path: string, ocr: "none" | "plain" | number): Promise<PageContent[]> {
  const bytes = new Uint8Array(readFileSync(join(CORPUS_ROOT, path)));
  const { pages } = await extractPdf(bytes, ocr === "none" ? { figures: false, ocrLangs: null } : { figures: false, ocrLangs: "eng", ocrRenderAll: true, ocrPages: (p) => p <= FRONT, ...(typeof ocr === "number" ? { ocr: contrastOcr(ocr) } : {}) });
  return pages;
}

async function main() {
  await refuseUnlessLocalDatabase(db, "corpus:balbharati-chapters");
  const dictionary = loadDictionary();
  const all: Doc[] = await db.contentDocument.findMany({
    where: { source: "balbharati", kind: "textbook" },
    select: { id: true, path: true, title: true, subject: true, gradeOrProgramme: true, extra: true, pageCount: true },
    orderBy: { path: "asc" },
  });
  const planned = (d: Doc) => {
    try {
      return (QUIZ_GEN_SUBJECTS as readonly string[]).includes(subjectCodeOf(d.subject));
    } catch {
      return false;
    }
  };
  const docs = all.filter((d) => {
    const g = Number(d.gradeOrProgramme);
    return Number.isInteger(g) && g >= GRADE_FROM && g <= GRADE_TO && (ALL_SUBJECTS || planned(d)) && (!PREFIX || d.path.startsWith(PREFIX)) && !SKIP.has(d.path);
  });
  console.log(`${docs.length} Balbharati textbooks of classes ${GRADE_FROM} to ${GRADE_TO}${ALL_SUBJECTS ? "" : " in the subjects the generator plans"}${PREFIX ? ` under ${PREFIX}` : ""}${APPLY ? "" : " (review: nothing is written)"}`);

  const reports: BookReport[] = [];
  for (const d of docs) {
    const rows = await db.contentChunk.findMany({ where: { documentId: d.id }, orderBy: { ordinal: "asc" }, select: { id: true, chapter: true, headingPath: true, pageStart: true, pageEnd: true, text: true } });
    const base: Omit<BookReport, "outcome" | "method"> = { path: d.path, title: d.title, grade: Number(d.gradeOrProgramme), subject: d.subject, contentsPage: null, contentsByOcr: false, notes: [], chapters: [], chunks: rows.length, outside: 0, changed: 0 };
    const own = ownHeadings(rows);
    if (own) {
      reports.push({ ...base, outcome: "kept", method: "own-headings", reason: `already split by its own headings, chapters 1 to ${own.length}` });
      console.log(`\n${d.path} "${d.title}": kept as it is (its own headings number chapters 1 to ${own.length})`);
      continue;
    }
    if (!existsSync(join(CORPUS_ROOT, d.path))) {
      reports.push({ ...base, outcome: "refused", method: null, reason: "the PDF is not in storage/corpus" });
      continue;
    }
    const read = await splitBookWithOcr(await readPages(d.path, "none"), OCR ? [() => readPages(d.path, "plain"), () => readPages(d.path, 120), () => readPages(d.path, 170)] : null);
    const { split, byOcr } = read;
    const report: BookReport = { ...base, outcome: split.refusal ? "refused" : "split", method: split.method, contentsPage: split.contentsPage, contentsByOcr: byOcr, notes: split.notes };
    if (split.refusal) {
      report.reason = split.refusal;
      reports.push(report);
      console.log(`\n${d.path} "${d.title}": REFUSED — ${split.refusal}`);
      continue;
    }
    const chapters = split.chapters.map((c, i) => ({ chapter: c, from: read.titleFrom[i] ?? "the contents" }));
    const labelled = labelChunks(rows, chapters.map((c) => c.chapter), d.title);
    for (const { chapter: c, from } of chapters) {
      const mine = rows.filter((_, i) => labelled[i]!.chapterNo === `${c.part}:${c.number}`);
      const vocab = vocabularyOf(mine.map((r) => r.text));
      const fragment = titleFragment(c.title, { vocab, bookTitle: d.title, subject: d.subject, dictionary });
      report.chapters.push({ label: chapterLabel(c), pages: `${c.startPage}–${c.endPage}`, chunks: mine.length, how: c.how, titleFrom: from, ...(fragment ? { noTitle: fragment } : {}) });
    }
    report.outside = labelled.filter((l) => !l.chapterNo).length;
    report.changed = labelled.filter((l) => l.changed).length;
    const empty = report.chapters.filter((c) => c.chunks === 0);
    if (empty.length) {
      // A chapter whose pages hold no chunk's first page: the split is wrong somewhere, so nothing is written.
      report.outcome = "refused";
      report.reason = `${empty.length} chapter(s) would hold no chunk: ${empty.map((c) => `${c.label} (pp. ${c.pages})`).join(", ")}`;
      reports.push(report);
      console.log(`\n${d.path} "${d.title}": REFUSED — ${report.reason}`);
      continue;
    }
    reports.push(report);
    console.log(`\n${d.path} "${d.title}": ${chapters.length} chapters by ${split.method}${byOcr ? " (contents read by OCR)" : ""}, contents p. ${split.contentsPage ?? "—"}; ${rows.length} chunks, ${report.outside} outside every chapter, ${report.changed} to change`);
    for (const n of split.notes) console.log(`  · ${n}`);
    for (const c of report.chapters) console.log(`  ${c.label.padEnd(60)} pp. ${c.pages.padEnd(9)} ${String(c.chunks).padStart(3)} chunks  ${c.how}${c.noTitle ? `  NO USABLE TITLE: ${c.noTitle}` : ""}`);
    if (APPLY && report.changed) {
      const changed = labelled.filter((l) => l.changed);
      await db.$transaction(
        async (tx) => {
          for (const l of changed) await tx.contentChunk.update({ where: { id: l.id }, data: { chapter: l.chapter, headingPath: l.headingPath } });
        },
        { timeout: 120_000 },
      );
    }
  }
  await closeOcr();

  // Which documents the generator plans for each class and subject (scripts/quiz-gen/select.ts reads the same rule).
  const combos = new Map<string, Doc[]>();
  for (const d of docs) combos.set(`${d.gradeOrProgramme}|${d.subject}`, [...(combos.get(`${d.gradeOrProgramme}|${d.subject}`) ?? []), d]);
  const plan: { grade: string; subject: string; books: string[]; editions: { path: string; title: string; of: string; reason: string }[]; misfiled: { path: string; title: string; reason: string }[] }[] = [];
  for (const [key, group] of combos) {
    const [grade, subject] = key.split("|") as [string, string];
    const choice = chooseBooks(group);
    plan.push({
      grade,
      subject,
      books: choice.books.map((b) => b.path),
      editions: choice.editions.map((e) => ({ path: e.doc.path, title: e.doc.title, of: e.of.path, reason: e.reason })),
      misfiled: choice.misfiled.map((m) => ({ path: m.doc.path, title: m.doc.title, reason: m.reason })),
    });
  }
  const setAside = plan.flatMap((p) => [...p.editions.map((e) => `${e.path} (edition of ${e.of})`), ...p.misfiled.map((m) => `${m.path} (misfiled: ${m.reason})`)]);

  const split = reports.filter((r) => r.outcome === "split");
  const kept = reports.filter((r) => r.outcome === "kept");
  const refused = reports.filter((r) => r.outcome === "refused");
  console.log(`\n${split.length} books split (${split.reduce((n, r) => n + r.chapters.length, 0)} chapters, ${split.reduce((n, r) => n + r.changed, 0)} chunks ${APPLY ? "changed" : "to change"}), ${kept.length} kept as they are, ${refused.length} refused`);
  for (const r of refused) console.log(`  refused ${r.path} "${r.title}": ${r.reason}`);
  const untitled = split.flatMap((r) => r.chapters.filter((c) => c.noTitle).map((c) => `${r.path} ${c.label}: ${c.noTitle}`));
  if (untitled.length) console.log(`${untitled.length} chapters with no usable title:\n  ${untitled.join("\n  ")}`);
  console.log(`${setAside.length} documents not planned:\n  ${setAside.slice(0, 50).join("\n  ")}`);

  let out = join(CORPUS_ROOT, `balbharati-chapters-${today()}${APPLY ? "" : "-review"}.json`);
  if (APPLY) for (let i = 2; existsSync(out); i++) out = join(CORPUS_ROOT, `balbharati-chapters-${today()}-${i}.json`);
  writeFileSync(out, JSON.stringify({ at: new Date().toISOString(), applied: APPLY, via: "scripts/corpus-balbharati-chapters.ts", books: reports, plan }, null, 2) + "\n");
  console.log(`decisions: ${out}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
