/**
 * Chapter selection for the generator: the chapter's chunks in order from ContentChunk and
 * ContentDocument (the assistant's corpus, Phase A), with the edition and the figures the chunks
 * reference, captions read from the ingest's `<base>.captions.json` beside the PNGs.
 *
 * NCERT is one document per chapter (extra.chapter); Balbharati one document per book, cut by the
 * chapter name at the head of each chunk's headingPath ("3. Force and Pressure"; scripts/corpus-balbharati-chapters.ts
 * writes them from the book's contents page). A Balbharati class and subject plans one book of each edition and its
 * parts in order, a later part's chapters numbered on after the earlier's (planBalbharati, owner-batch-item7). An NCERT
 * class and subject plans its books the same way (planNcert, owner-batch-item8): a book another has replaced is left out
 * (class 8's 2024 Science and Mathematics), the parts of one book are numbered on (Mathematics Part II's "Integrals" is
 * chapter 7, as the book prints it and the authored bank numbers it), and two different books that carry one number
 * (class 12 political science: Contemporary World Politics and Politics in India since Independence) are both planned,
 * each chapter naming its book in the bank's line, the batch file and the run's chapter. `--book=<code>` picks one.
 *
 * Reads as the app role: the content tables are outside the tenant fence.
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import type { Prisma, PrismaClient } from "@prisma/client";
import type { AssistantEndpoint } from "../../src/lib/assistant-env";
import { asQuery, embedTexts, vectorLiteral } from "../../src/lib/assistant-model";
import { CORPUS_ROOT } from "../corpus-lib";
import { chapterLineFor, chapterNameOf, chapterNumberOf } from "./checks";
// owner-batch-item6 (30 Oct 2026): a chapter's name is its book's title, never a fragment of one (corpus-titles' rules).
import { loadDictionary, titleCase, titleFragment, vocabularyOf } from "../corpus-titles";
import { fixTitleCase } from "../../src/lib/chapter-title-case";
// owner-batch-item7 (30 Oct 2026): which documents of a class and subject are one Balbharati book (editions, parts, misfiled).
import { chooseBooks, type BookChoice } from "../corpus-contents";

export type SelectedChunk = {
  id: string;
  ordinal: number;
  headingPath: string[];
  pageStart: number;
  pageEnd: number;
  text: string;
  tokens: number;
  figureKeys: string[];
};

export type Figure = { key: string; caption: string | null; page: number; exists: boolean };

export type SelectedChapter = {
  board: string;
  /** college-content (12 Oct 2026): "syllabi" for a college unit (scripts/quiz-gen/college.ts). */
  source: "ncert" | "balbharati" | "syllabi";
  book: string;
  bookCode: string | null;
  documentPath: string;
  classLevel: number;
  subject: string;
  /** The bank's subject code: SCIENCE, MATHS… */
  subjectCode: string;
  chapterNumber: number;
  chapterName: string;
  /** "Chapter 4 — Electricity: Magnetic and Heating Effects", as the bank writes it. */
  chapterLabel: string;
  edition: string | null;
  sourceUrl: string;
  chunks: SelectedChunk[];
  figures: Map<string, Figure>;
  headings: string[];
  /**
   * owner-batch-item7: where a Balbharati chapter sits when its class and subject plan more than one book or part
   * ("९ वी गणित भाग-२ इंग्रजी", chapter 3): the plan's number then runs on from the earlier book's chapters.
   */
  bookPlace?: string;
  /**
   * owner-batch-item8: the book, when the class and subject's NCERT plan carries more than one book under one chapter
   * number (planNcert): the bank's chapter line, the batch file's name and the run's chapter then name it.
   */
  planBook?: { code: string; title: string };
  /**
   * college-content (12 Oct 2026): a line the drafting prompt carries for a college unit (the passage is a
   * university syllabus, not a textbook: ask about what it lists, never about the syllabus itself).
   */
  draftNote?: string;
};

export type Board = "NCERT" | "Balbharati";

export function boardSource(board: string): { source: "ncert" | "balbharati"; board: Board } {
  const b = board.trim().toLowerCase();
  if (b === "ncert") return { source: "ncert", board: "NCERT" };
  if (b === "balbharati" || b === "msbshse") return { source: "balbharati", board: "Balbharati" };
  throw new Error(`--board is NCERT or Balbharati, not "${board}"`);
}

/** The bank's subject codes (scripts/verify-quiz.ts SUBJECTS) from the corpus's subject names. */
export function subjectCodeOf(subject: string): string {
  const s = subject.trim().toLowerCase();
  const table: [RegExp, string][] = [
    [/^math/, "MATHS"],
    [/^science|^general science/, "SCIENCE"],
    [/^physics/, "PHYSICS"],
    [/^chemistry/, "CHEMISTRY"],
    [/^biology/, "BIOLOGY"],
    [/^evs|environmental/, "EVS"],
    [/^history/, "HISTORY"],
    [/^geograph/, "GEOGRAPHY"],
    [/^civics|^political|^social and political/, "CIVICS"],
    [/^economics/, "ECONOMICS"],
  ];
  for (const [re, code] of table) if (re.test(s)) return code;
  throw new Error(`the bank has no subject code for "${subject}" (scripts/verify-quiz.ts SUBJECTS)`);
}

function editionOf(doc: { edition: string | null; year: string | null; extra: unknown }): string | null {
  if (doc.edition) return doc.edition;
  if (doc.year) return `${doc.year} edition`;
  const lm = (doc.extra as { lastModified?: string } | null)?.lastModified;
  const year = lm ? /\b(20\d\d)\b/.exec(lm)?.[1] : null;
  return year ? `${year} edition (the site's Last-Modified)` : null;
}

function readFigures(documentPath: string, keys: string[]): Map<string, Figure> {
  const out = new Map<string, Figure>();
  if (!keys.length) return out;
  const dir = dirname(join(CORPUS_ROOT, documentPath));
  const base = basename(documentPath).replace(/\.pdf$/i, "");
  let captions: Record<string, { page: number; caption: string | null }> = {};
  const captionFile = join(dir, "figures", `${base}.captions.json`);
  if (existsSync(captionFile)) {
    try {
      captions = JSON.parse(readFileSync(captionFile, "utf8"));
    } catch {
      captions = {};
    }
  }
  for (const key of keys) {
    const name = basename(key);
    const c = captions[name];
    const page = c?.page ?? Number(/-p(\d+)-\d+\.png$/.exec(name)?.[1] ?? 0);
    out.set(key, { key, caption: c?.caption ?? null, page, exists: existsSync(join(CORPUS_ROOT, key)) });
  }
  return out;
}

type DocRow = { id: string; path: string; board: string; subject: string; title: string; edition: string | null; year: string | null; sourceUrl: string; extra: unknown; gradeOrProgramme: string };

async function books(db: PrismaClient, source: "ncert" | "balbharati", grade: number, subject: string): Promise<DocRow[]> {
  return db.contentDocument.findMany({
    where: { source, kind: "textbook", gradeOrProgramme: String(grade), subject: { equals: subject, mode: "insensitive" } },
    select: { id: true, path: true, board: true, subject: true, title: true, edition: true, year: true, sourceUrl: true, extra: true, gradeOrProgramme: true },
    orderBy: { path: "asc" },
  });
}

/** The chapter's label from the first chunk that carries one: a title page's chunk may carry none. */
function firstLabel(rows: { chapter: string | null; headingPath: string[] }[]): string {
  for (const r of rows) {
    const label = (r.chapter ?? r.headingPath[0] ?? "").trim();
    if (label) return label;
  }
  return "";
}

/**
 * owner-batch-item6: the chapter's title out of its corpus label: the label's name ("Chapter 9: 9. Up You Go!" → "Up You
 * Go!", the number printed again in front dropped; "early societies" → "Early Societies") under the case rule
 * (src/lib/chapter-title-case.ts). "" when bare. Pure.
 */
export function chapterTitleOf(label: string, chapterNumber: number): string {
  const name = chapterNameOf(label)
    .replace(new RegExp(`^${chapterNumber}\\s*[.:)]\\s+`), "")
    .trim();
  if (!name) return "";
  // A title the text layer gave in lower case ("early societies") is put in title case.
  return fixTitleCase(/^\p{Ll}/u.test(name) ? titleCase(name, true) : name);
}

function bookCodeOf(doc: DocRow): string | null {
  const extra = doc.extra as { bookCode?: string; bookId?: string } | null;
  return extra?.bookCode ?? extra?.bookId ?? null;
}

/**
 * owner-batch-item7: a Balbharati chunk's chapter label read: "3. Triangles" (as class 8 science prints its headings, and
 * scripts/corpus-balbharati-chapters.ts writes them), or a second numbered sequence of the same book "Political Science ·
 * 2. India's Foreign Policy" (a History and Political Science book), whose part checks.ts chapterNumberOf never reads, so
 * an older reader cannot mix its chapter 2 with the history's. Pure.
 */
export function bookChapterOf(label: string): { part: string | null; number: number; label: string } | null {
  const t = label.trim();
  const sep = t.indexOf(" · ");
  const part = sep > 0 && sep <= 60 ? t.slice(0, sep).trim() : null;
  const rest = part ? t.slice(sep + 3).trim() : t;
  const n = chapterNumberOf(rest);
  return n === null ? null : { part, number: n, label: rest };
}

export type PlannedChapter<D> = {
  /** The number the bank and the generator use: the book's own, run on after an earlier book or part of the same class and subject. */
  planNumber: number;
  /** The number the book prints. */
  number: number;
  part: string | null;
  label: string;
  doc: D;
};

/**
 * owner-batch-item7: the chapters a Balbharati class and subject offers, in order, from its books' chunk labels. One book
 * of each edition (corpus-contents.ts chooseBooks: the edition naming no district, else the newest; a book filed under
 * the wrong class left out); its parts in the books' order (part 1 before part 2, a stream's books together) and, in a
 * book, the second numbered sequence after the first. A chapter's plan number is its printed number for the first book
 * and part, and runs on after the highest number of the ones before it otherwise ("९ वी गणित भाग-२", chapter 1 is 9 when
 * part 1 ends at 8): the bank, the batch files and a run's progress know a chapter by one number. Pure.
 */
export function planBalbharati<D extends { id: string; path: string; title: string; gradeOrProgramme: string; extra: unknown }>(
  docs: readonly D[],
  labelsOf: (doc: D) => readonly string[],
): { chapters: PlannedChapter<D>[]; choice: BookChoice<D> } {
  const choice = chooseBooks(docs);
  const chapters: PlannedChapter<D>[] = [];
  let offset = 0;
  for (const doc of choice.books) {
    const parts = new Map<string, Map<number, string>>();
    for (const label of labelsOf(doc)) {
      const c = bookChapterOf(label);
      if (!c) continue;
      const key = c.part ?? "";
      const numbers = parts.get(key) ?? new Map<number, string>();
      if (!numbers.has(c.number)) numbers.set(c.number, c.label);
      parts.set(key, numbers);
    }
    const keys = [...parts.keys()].sort((a, b) => Number(a !== "") - Number(b !== ""));
    for (const key of keys) {
      const numbers = parts.get(key)!;
      const sorted = [...numbers.keys()].sort((a, b) => a - b);
      for (const n of sorted) chapters.push({ planNumber: offset + n, number: n, part: key || null, label: numbers.get(n)!, doc });
      offset += sorted[sorted.length - 1] ?? 0;
    }
  }
  return { chapters, choice };
}

/* ---------------------------------------------------------------------------------------------------------------
   owner-batch-item8 (31 October 2026): the NCERT plan of a class and subject — which books, under which numbers
   --------------------------------------------------------------------------------------------------------------- */

/**
 * NCERT books the plan leaves out while the book that replaced them is in the corpus (a per-book rule). The owner chose
 * the current books for class 8 on 23 October 2026 (57794753): Curiosity, not the 2024 Science; Ganita Prakash Parts I
 * and II, not the 2024 Mathematics. Class 5's Math-Magic (2024) is replaced by Math-Mela (2026) the same way; it was
 * never drafted (the newest book took every number) and stays out. Their authored chapters keep serving.
 * `--book=<code>` still drafts one on purpose.
 */
export const NCERT_SUPERSEDED: Readonly<Record<string, { by: readonly string[]; why: string }>> = {
  hesc1: { by: ["hecu1"], why: "class 8 Science (2024) is replaced by Curiosity: the owner's choice of 23 October 2026 keeps class 8 on the current books" },
  hemh1: { by: ["hegp1", "hegp2"], why: "class 8 Mathematics (2024) is replaced by Ganita Prakash Parts I and II: the owner's choice of 23 October 2026" },
  eemh1: { by: ["eemm1"], why: "class 5 Math-Magic (2024) is replaced by Math-Mela (2026), as class 8's older books are" },
};

/**
 * A book's title as the book prints it, where the site's listing (ContentDocument.title) spells it otherwise: the name a
 * chapter line carries beside its number when the plan names the book. Only books a plan names are listed.
 */
export const NCERT_BOOK_TITLES: Readonly<Record<string, string>> = {
  kegy2: "Fundamentals of Physical Geography",
  kegy3: "Practical Work in Geography Part I",
  legy2: "India: People and Economy",
};

/** "Physics Part-II" → { work: "physics", part: 2 }; "Chemistry-I", "Ganita Manjari PART-II", "Themes in Indian History-III"; no mark is part 1. Pure. */
export function ncertPartOf(title: string): { work: string; part: number } {
  const t = title.trim().replace(/\s+/g, " ");
  const m = /^(.*?\S)\s*(?:[-–]\s*|\s+)(?:part\s*[-–]?\s*)?(IV|I{1,3}|[1-4])$/i.exec(t);
  const roman: Record<string, number> = { i: 1, ii: 2, iii: 3, iv: 4 };
  const work = (m ? m[1]! : t).replace(/\s*\bpart\s*$/i, "");
  const part = m ? (roman[m[2]!.toLowerCase()] ?? Number(m[2])) : 1;
  return { work: work.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim(), part };
}

export type NcertDoc = { id: string; path: string; title: string; extra: unknown };

export type NcertChapter<D> = {
  /** The number the bank, the batch file and a run know the chapter by. */
  planNumber: number;
  /** The number the chapter's own heading carries ("Chapter 8: Fractions in Disguise"), else the file's. */
  number: number;
  /** The file's number (extra.chapter): what an older plan called the chapter. */
  fileNumber: number;
  label: string;
  doc: D;
  /** Set when the class and subject plan more than one book under one number: the book the chapter is of. */
  book: { code: string; title: string } | null;
};

export type NcertPlan<D> = {
  chapters: NcertChapter<D>[];
  /** Books left out because another replaced them (NCERT_SUPERSEDED). */
  superseded: { code: string; title: string; docs: D[]; why: string }[];
  /** True when two books share a number: every chapter then names its book. */
  named: boolean;
};

const codeOf = (extra: unknown): string | null => {
  const e = extra as { bookCode?: string; bookId?: string } | null;
  return e?.bookCode ?? e?.bookId ?? null;
};

/** owner-batch-item8: the title a chapter line names a book by. Pure. */
export function ncertBookTitle(code: string, title: string): string {
  return NCERT_BOOK_TITLES[code] ?? title.trim().replace(/\s+/g, " ");
}

/**
 * owner-batch-item8: the chapters an NCERT class and subject offers, in the order a run takes them. Pure.
 *
 *   1. A book another has replaced (NCERT_SUPERSEDED) is left out while the other is in the corpus.
 *   2. A chapter's number is the one its own heading carries (the corpus numbers Ganita Prakash Part II 8 to 14 and
 *      Ganita Manjari Part II 9 to 14, the owner's serial of 23 October), else the file's (extra.chapter).
 *   3. The parts of one book (titles alike but for "Part II", "-II": Physics, Mathematics and Chemistry of classes 11
 *      and 12, Themes in Indian History I to III, Ganita Prakash) are numbered on: a later part keeps its numbers when
 *      they already start past the earlier parts' last, else runs on from it (Mathematics Part II's chapter 1 is 7). This
 *      is how the books print them and how the authored bank numbers them.
 *   4. Two different books left with one number (Contemporary World Politics and Politics in India since Independence,
 *      class 12; Political Theory and Indian Constitution at Work, class 11; the economics and geography books of 11 and
 *      12) are both planned, every chapter naming its book (`book`); the batch file is ncert-12-civics-leps1-5.json and
 *      the bank's line "Chapter 5 (Contemporary World Politics) — Security in the Contemporary World".
 */
export function planNcert<D extends NcertDoc>(docs: readonly D[], labelOf: (doc: D) => string): NcertPlan<D> {
  const chapterDocs = docs.filter((d) => typeof (d.extra as { chapter?: unknown } | null)?.chapter === "number");
  const codes = new Set(chapterDocs.map((d) => codeOf(d.extra) ?? ""));
  const superseded: NcertPlan<D>["superseded"] = [];
  const books = new Map<string, { code: string; title: string; docs: D[] }>();
  for (const d of chapterDocs) {
    const code = codeOf(d.extra) ?? "";
    const rule = NCERT_SUPERSEDED[code];
    if (rule && rule.by.some((b) => codes.has(b))) {
      const s = superseded.find((x) => x.code === code) ?? superseded[superseded.push({ code, title: d.title, docs: [], why: rule.why }) - 1]!;
      s.docs.push(d);
      continue;
    }
    const b = books.get(code) ?? { code, title: d.title, docs: [] };
    b.docs.push(d);
    books.set(code, b);
  }
  // The works: books whose titles are one but for the part, parts in order; works in the order of their first code.
  const works = new Map<string, { code: string; title: string; docs: D[]; part: number }[]>();
  for (const b of books.values()) {
    const { work, part } = ncertPartOf(b.title);
    works.set(work, [...(works.get(work) ?? []), { ...b, part }]);
  }
  const ordered = [...works.values()].map((parts) => parts.sort((a, b) => a.part - b.part || a.code.localeCompare(b.code))).sort((a, b) => a[0]!.code.localeCompare(b[0]!.code));
  const perWork: NcertChapter<D>[][] = [];
  for (const parts of ordered) {
    const out: NcertChapter<D>[] = [];
    let offset = 0;
    for (const part of parts) {
      const own: { doc: D; number: number; fileNumber: number; label: string }[] = [];
      for (const d of part.docs) {
        const fileNumber = (d.extra as { chapter: number }).chapter;
        const label = labelOf(d);
        own.push({ doc: d, number: chapterNumberOf(label) ?? fileNumber, fileNumber, label });
      }
      own.sort((a, b) => a.number - b.number || a.doc.path.localeCompare(b.doc.path));
      const first = own[0]?.number ?? 0;
      const shift = first > offset ? 0 : offset;
      for (const o of own) {
        const planNumber = o.number + shift;
        if (out.some((c) => c.planNumber === planNumber)) continue;
        out.push({ planNumber, number: o.number, fileNumber: o.fileNumber, label: o.label, doc: o.doc, book: { code: part.code, title: ncertBookTitle(part.code, part.title) } });
      }
      offset = Math.max(offset, ...out.map((c) => c.planNumber));
    }
    perWork.push(out);
  }
  const seen = new Set<number>();
  let named = false;
  for (const w of perWork) {
    const mine = new Set(w.map((c) => c.planNumber));
    for (const n of mine) if (seen.has(n)) named = true;
    for (const n of mine) seen.add(n);
  }
  const chapters = named ? perWork.flat() : perWork.flat().map((c) => ({ ...c, book: null })).sort((a, b) => a.planNumber - b.planNumber);
  return { chapters, superseded, named };
}

/** owner-batch-item8: what an NCERT plan leaves out or names, one line, for the run log. */
function ncertNote(plan: NcertPlan<DocRow>, args: { grade: number; subject: string }): string | null {
  const out: string[] = [];
  for (const s of plan.superseded) out.push(`${s.code} "${s.title}" left out (${s.why})`);
  if (plan.named) out.push(`two books share chapter numbers, so each chapter names its book: ${[...new Map(plan.chapters.map((c) => [c.book!.code, c.book!.title])).entries()].map(([c, t]) => `${c} "${t}"`).join(", ")}`);
  return out.length ? `  NCERT class ${args.grade} ${args.subject}: ${out.join("; ")}` : null;
}

/**
 * owner-batch-item8: the bank's chapter lines of one chapter (QuizTopic.chapter), the line the generator writes: "Chapter
 * N (Book) — …" for a chapter of a named book; otherwise "Chapter N …" and never another book's "Chapter N (…".
 */
export function chapterLineFilter(number: number, book: string | null): Prisma.StringFilter {
  return book ? { startsWith: `Chapter ${number} (${book}) ` } : { startsWith: `Chapter ${number} `, not: { startsWith: `Chapter ${number} (` } };
}

/** owner-batch-item7: what a Balbharati plan leaves out, one line each, for the run log. */
function choiceNote(choice: BookChoice<DocRow>, args: { grade: number; subject: string }): string | null {
  const out: string[] = [];
  if (choice.editions.length) out.push(`${choice.editions.length} edition(s) set aside for ${choice.editions[0]!.of.path} ("${choice.editions[0]!.of.title}")`);
  for (const m of choice.misfiled) out.push(`${m.doc.path} set aside (${m.reason})`);
  for (const m of choice.otherStream) out.push(`${m.doc.path} "${m.doc.title}" left out (${m.reason})`);
  if (choice.books.length > 1) out.push(`${choice.books.length} books planned in this order: ${choice.books.map((b) => `"${b.title}"`).join(", ")}`);
  return out.length ? `  Balbharati class ${args.grade} ${args.subject}: ${out.join("; ")}` : null;
}

async function labelsByDoc(db: PrismaClient, docs: readonly DocRow[]): Promise<Map<string, string[]>> {
  const rows = await db.contentChunk.findMany({ where: { documentId: { in: docs.map((d) => d.id) } }, orderBy: [{ documentId: "asc" }, { ordinal: "asc" }], select: { documentId: true, chapter: true, headingPath: true } });
  const out = new Map<string, string[]>();
  for (const r of rows) out.set(r.documentId, [...(out.get(r.documentId) ?? []), r.chapter ?? r.headingPath[0] ?? ""]);
  return out;
}

/** One chapter of a plan as listChapters gives it. `planBook` is the book's title when the plan names the book (planNcert). */
export type ListedChapter = { number: number; name: string; bookCode: string | null; book: string; planBook: string | null };

/** owner-batch-item8: an NCERT class and subject's plan, read from the corpus; a `book` the plan leaves out is planned alone when asked for by name. */
async function ncertPlanOf(db: PrismaClient, docs: DocRow[], book?: string): Promise<NcertPlan<DocRow>> {
  const labels = await labelsByDoc(db, docs);
  const first = (d: DocRow) => (labels.get(d.id) ?? []).find((l) => l.trim()) ?? "";
  const plan = planNcert(docs, first);
  if (book && !plan.chapters.some((c) => bookCodeOf(c.doc) === book)) return planNcert(docs.filter((d) => bookCodeOf(d) === book), first);
  return plan;
}

/**
 * The chapters a board's book offers for a class and subject: number and name, for `--all-chapters` and for the usage
 * message. A chapter whose heading carries no title has the name "" and is reported through `log` (chapter-titles,
 * 19 Oct 2026: npm run corpus:titles mends most; the rest are listed in its decisions file).
 */
export async function listChapters(
  db: PrismaClient,
  args: { board: string; grade: number; subject: string; book?: string },
  log: (line: string) => void = () => {},
): Promise<ListedChapter[]> {
  const { source } = boardSource(args.board);
  const docs = await books(db, source, args.grade, args.subject);
  const out: ListedChapter[] = [];
  if (source === "ncert") {
    // owner-batch-item8: the plan (planNcert): books replaced left out, parts numbered on, two books under one number named.
    const plan = await ncertPlanOf(db, docs, args.book);
    const note = ncertNote(plan, args);
    if (note) log(note);
    for (const c of plan.chapters) {
      const code = bookCodeOf(c.doc);
      if (args.book && code !== args.book) continue;
      const name = chapterTitleOf(c.label, c.number);
      if (!name) log(`  ${args.board} class ${args.grade} ${args.subject}, chapter ${c.planNumber} ("${c.doc.title}", ${c.doc.path}) has no title in the corpus`);
      out.push({ number: c.planNumber, name, bookCode: code, book: c.doc.title, planBook: c.book?.title ?? null });
    }
    // A plan that names its books keeps its order (one book's chapters, then the next's).
    return plan.named ? out : out.sort((a, b) => a.number - b.number);
  } else {
    // owner-batch-item7: one book of each edition, its parts in order, a chapter known by its plan number.
    const mine = args.book ? docs.filter((d) => bookCodeOf(d) === args.book) : docs;
    const labels = await labelsByDoc(db, mine);
    const { chapters, choice } = planBalbharati(mine, (d) => labels.get(d.id) ?? []);
    const note = choiceNote(choice, args);
    if (note) log(note);
    for (const c of chapters) {
      const name = chapterTitleOf(c.label, c.number);
      if (!name) log(`  ${args.board} class ${args.grade} ${args.subject}, chapter ${c.planNumber} ("${c.doc.title}", ${c.doc.path}${c.part ? `, ${c.part}` : ""}, chapter ${c.number}) has no title in the corpus`);
      out.push({ number: c.planNumber, name, bookCode: bookCodeOf(c.doc), book: c.doc.title, planBook: null });
    }
  }
  return out.sort((a, b) => a.number - b.number);
}

export async function selectChapter(db: PrismaClient, args: { board: string; grade: number; subject: string; chapter: number; book?: string }, log: (line: string) => void = () => {}): Promise<SelectedChapter> {
  const { source, board } = boardSource(args.board);
  let docs = await books(db, source, args.grade, args.subject);
  if (!docs.length) throw new Error(`no ${board} textbook for class ${args.grade} ${args.subject} in the corpus (ContentDocument)`);
  if (args.book && !docs.some((d) => bookCodeOf(d) === args.book)) throw new Error(`no ${board} book with code "${args.book}" for class ${args.grade} ${args.subject}`);
  // Balbharati plans its books itself (a `book` narrows it to that book's documents, as before); NCERT plans every book
  // and the `book` picks among its chapters (owner-batch-item8), so a part's chapter keeps its plan number.
  if (args.book && source !== "ncert") docs = docs.filter((d) => bookCodeOf(d) === args.book);

  let doc: DocRow;
  let chunks: SelectedChunk[];
  let chapterLabel: string;
  // owner-batch-item7: the number the book prints (a Balbharati part's own), and where the chapter sits when it is not the plan's.
  let bookNumber = args.chapter;
  let bookPlace: string | undefined;
  let planBook: { code: string; title: string } | undefined;
  if (source === "ncert") {
    // owner-batch-item8: the chapter of the plan (planNcert) by its plan number, of the book asked for when one is. The old
    // rule took the newest book for a number two books carry, so Contemporary World Politics was never drafted.
    const plan = await ncertPlanOf(db, docs, args.book);
    const matches = plan.chapters.filter((c) => c.planNumber === args.chapter && (!args.book || bookCodeOf(c.doc) === args.book));
    if (!matches.length) throw new Error(`NCERT class ${args.grade} ${args.subject} has no chapter ${args.chapter}${args.book ? ` in ${args.book}` : ""} in the corpus`);
    const planned = matches[0]!;
    if (matches.length > 1) log(`  ${matches.length} books carry chapter ${args.chapter}: ${matches.map((c) => `${bookCodeOf(c.doc)} "${c.doc.title}"`).join("; ")} — taking ${bookCodeOf(planned.doc)}, the plan's first; --book=<code> picks another`);
    doc = planned.doc;
    const rows = await db.contentChunk.findMany({ where: { documentId: doc.id }, orderBy: { ordinal: "asc" }, select: { id: true, ordinal: true, headingPath: true, pageStart: true, pageEnd: true, text: true, tokens: true, figureKeys: true, chapter: true } });
    chunks = rows.map((r) => ({ id: r.id, ordinal: r.ordinal, headingPath: r.headingPath, pageStart: r.pageStart, pageEnd: r.pageEnd, text: r.text, tokens: r.tokens, figureKeys: r.figureKeys }));
    chapterLabel = firstLabel(rows) || `Chapter ${args.chapter}`;
    bookNumber = planned.number;
    if (planned.book) planBook = planned.book;
    // A later part's chapter numbered on (Mathematics Part II's chapter 1 is the plan's 7): the source line says where the book prints it.
    if (planned.planNumber !== planned.fileNumber) bookPlace = `"${doc.title}", chapter ${planned.fileNumber}`;
  } else {
    // owner-batch-item7: the plan listChapters gives (editions collapsed, parts in order), the chapter by its plan number.
    const labels = await labelsByDoc(db, docs);
    const { chapters, choice } = planBalbharati(docs, (d) => labels.get(d.id) ?? []);
    const planned = chapters.find((c) => c.planNumber === args.chapter);
    if (!planned) throw new Error(`Balbharati class ${args.grade} ${args.subject} has no chapter ${args.chapter} in its heading paths (${choice.books.map((b) => b.path).join(", ") || "no book"})`);
    doc = planned.doc;
    const rows = await db.contentChunk.findMany({ where: { documentId: doc.id }, orderBy: { ordinal: "asc" }, select: { id: true, ordinal: true, headingPath: true, pageStart: true, pageEnd: true, text: true, tokens: true, figureKeys: true, chapter: true } });
    const mine = rows.filter((r) => {
      const c = bookChapterOf(r.chapter ?? r.headingPath[0] ?? "");
      return c !== null && c.number === planned.number && c.part === planned.part;
    });
    if (!mine.length) throw new Error(`Balbharati "${doc.title}" has no chapter ${planned.number} in its heading paths`);
    chunks = mine.map((r) => ({ id: r.id, ordinal: r.ordinal, headingPath: r.headingPath, pageStart: r.pageStart, pageEnd: r.pageEnd, text: r.text, tokens: r.tokens, figureKeys: r.figureKeys }));
    chapterLabel = planned.label;
    bookNumber = planned.number;
    if (chapters.some((c) => c.doc !== planned.doc || c.part !== planned.part)) bookPlace = `"${doc.title}"${planned.part ? `, ${planned.part}` : ""}, chapter ${planned.number}`;
  }
  if (!chunks.length) throw new Error(`${doc.path} has no chunks; run the corpus ingest first`);

  // A heading that carries no title even after npm run corpus:titles (20 Oct 2026, the owner's rule: a chapter is never
  // shown as "Chapter N"): the bank's own title for that chapter is used when the bank already has one — the authored
  // bank names every NCERT chapter it covers — and otherwise the chapter is not drafted at all, with the reason.
  // owner-batch-item6 (30 Oct 2026): so is a heading that is a fragment of a title by corpus-titles' own rules ("NIT",
  // "Nit of", "Roducts and Their", "In this chapter…"): such a name made a new topic whose slug the next chapter with the
  // same fragment collided with. The model never names a chapter.
  let chapterName = chapterTitleOf(chapterLabel, bookNumber);
  const ctx = { vocab: vocabularyOf([...chunks.map((c) => c.text), ...chunks.flatMap((c) => c.headingPath.slice(1))]), bookTitle: doc.title, subject: doc.subject, dictionary: loadDictionary() };
  const fragment = chapterName ? titleFragment(chapterName, ctx) : null;
  if (!chapterName || fragment) {
    const known = await db.quizTopic.findFirst({
      where: { audience: "SCHOOL", retiredAt: null, board, classLevel: args.grade, subject: subjectCodeOf(args.subject), chapter: chapterLineFilter(args.chapter, planBook?.title ?? null), NOT: { name: "" } },
      orderBy: { position: "asc" },
      select: { name: true, slug: true },
    });
    const missing = fragment ? `a chapter title that is ${fragment} ("${chapterName}")` : "no chapter title";
    if (known && !titleFragment(known.name, ctx)) {
      chapterName = known.name;
      log(`  ${doc.path} has ${missing} in the corpus: the bank's own title for chapter ${args.chapter} is used ("${known.name}", ${known.slug})`);
    } else {
      throw new Error(`${doc.path} has ${missing} in the corpus and the bank has none for chapter ${args.chapter}: not drafted (npm run corpus:titles, or set the heading by hand)`);
    }
  }
  const keys = [...new Set(chunks.flatMap((c) => c.figureKeys))];
  const figures = readFigures(doc.path, keys);
  const headings = [...new Set(chunks.flatMap((c) => c.headingPath.slice(1)))];
  return {
    board,
    source,
    book: doc.title,
    bookCode: bookCodeOf(doc),
    documentPath: doc.path,
    classLevel: args.grade,
    subject: doc.subject,
    subjectCode: subjectCodeOf(doc.subject),
    chapterNumber: args.chapter,
    chapterName,
    // owner-batch-item8: the book beside the number when the plan names it ("Chapter 5 (Contemporary World Politics) — …").
    chapterLabel: chapterLineFor(args.chapter, chapterName, planBook?.title ?? null),
    edition: editionOf(doc),
    sourceUrl: doc.sourceUrl,
    chunks,
    figures,
    headings,
    ...(bookPlace ? { bookPlace } : {}),
    ...(planBook ? { planBook } : {}),
  };
}

/** The glossary chunks for a subject, when the corpus has a glossary for it (NCERT's trilingual dictionaries: economics, geography, sociology only). */
export async function glossaryFor(db: PrismaClient, subject: string): Promise<{ id: string; text: string }[]> {
  const docs = await db.contentDocument.findMany({ where: { kind: "glossary", subject: { equals: subject, mode: "insensitive" } }, select: { id: true } });
  if (!docs.length) return [];
  return db.contentChunk.findMany({ where: { documentId: { in: docs.map((d) => d.id) } }, select: { id: true, text: true }, orderBy: { ordinal: "asc" } });
}

/**
 * The glossary lines for one item: the entries whose head word appears in the stem or an option,
 * at most `max` lines, each trimmed to one line. A keyword match, not a vector one: a glossary entry
 * is "word — शब्द", and the word is in the item or it is not.
 */
export function glossaryLinesFor(glossary: { text: string }[], item: { stem: string; choices: string[] }, max = 12): string[] {
  const hay = `${item.stem} ${item.choices.join(" ")}`.toLowerCase();
  const out: string[] = [];
  for (const g of glossary) {
    for (const line of g.text.split("\n")) {
      const head = /^([A-Za-z][A-Za-z -]{2,40}?)\s*[:—–-]/.exec(line.trim())?.[1]?.trim().toLowerCase();
      if (!head || head.length < 4) continue;
      if (new RegExp(`\\b${head.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(hay)) {
        out.push(line.trim().slice(0, 160));
        if (out.length >= max) return out;
      }
    }
  }
  return out;
}

/**
 * The served bank's questions for a subject and class, for the near-duplicate check. owner-batch-item8 (31 Oct 2026, the
 * coordinator's decision): a school chapter is compared with its own board's questions only (`board`, a QUIZ_BOARDS
 * code). NCERT and Balbharati are separate catalogues for different pupils and may hold similar questions: NCERT's
 * fraction questions had left Balbharati class 6 "Fractions" and "Decimal Fractions" with nothing new. A college unit
 * passes no board and is compared as before.
 */
export async function bankStems(db: PrismaClient, subjectCode: string, classLevel: number, board?: string): Promise<{ id: string; stem: string; topicSlug: string }[]> {
  const rows = await db.quizQuestion.findMany({
    where: { topic: { subject: subjectCode, classLevel, ...(board ? { board } : {}) } },
    select: { id: true, stem: true, topic: { select: { slug: true } } },
  });
  return rows.map((r) => ({ id: r.id, stem: r.stem, topicSlug: r.topic.slug }));
}

/** The bank's topics of a subject and class, every board's, each with its board (owner-batch-item8: the match is board-scoped, the slug check is not). */
export async function bankTopics(db: PrismaClient, subjectCode: string, classLevel: number): Promise<{ slug: string; chapter: string; name: string; position: number; retired: boolean; board: string | null }[]> {
  const rows = await db.quizTopic.findMany({ where: { subject: subjectCode, classLevel }, select: { slug: true, chapter: true, name: true, position: true, retiredAt: true, board: true } });
  return rows.map((r) => ({ slug: r.slug, chapter: r.chapter, name: r.name, position: r.position, retired: r.retiredAt !== null, board: r.board }));
}

/* ---------------------------------------------------------------------------
   The style corpus for levels 5 and 6 (the owner, 10 October 2026): the public past entrance and
   olympiad papers, ContentDocument source "papers", fetched by another builder. Absent, the two
   levels are skipped and the run log says so.
   --------------------------------------------------------------------------- */

export type StyleBlock = { present: boolean; excerpts: string[]; note: string };

export async function styleExcerpts(
  db: PrismaClient,
  embed: AssistantEndpoint,
  args: { subject: string; classLevel: number; chapterName: string; max?: number },
): Promise<StyleBlock> {
  const papers = await db.contentDocument.count({ where: { source: "papers" } });
  if (!papers) return { present: false, excerpts: [], note: 'no past papers in the corpus (ContentDocument source "papers"): levels 5 and 6 skipped' };
  const [v] = await embedTexts(embed, [asQuery("curriculum", `${args.subject} class ${args.classLevel}: ${args.chapterName}`)]);
  if (!v) throw new Error("the embeddings endpoint returned no vector for the style query");
  const vector = vectorLiteral(v);
  const max = Math.max(1, Math.min(6, args.max ?? 4));
  const rows = await db.$queryRaw<{ text: string; title: string; subject: string }[]>`
    WITH scoped AS MATERIALIZED (
      SELECT c."text", d."title", d."subject", (c."embedding" <=> ${vector}::vector) AS "distance"
        FROM "ContentChunk" c JOIN "ContentDocument" d ON d."id" = c."documentId"
       WHERE c."embedding" IS NOT NULL AND d."source" = 'papers' AND d."subject" ILIKE ${args.subject.replace(/[%_]/g, "")}
    )
    SELECT "text", "title", "subject" FROM scoped ORDER BY "distance" LIMIT ${max}`;
  const excerpts = rows.map((r) => `[${r.title}]\n${r.text.slice(0, 700)}`);
  return {
    present: excerpts.length > 0,
    excerpts,
    note: excerpts.length ? `${excerpts.length} excerpts from ${papers} paper documents` : `the papers corpus has nothing for ${args.subject}: levels 5 and 6 skipped`,
  };
}
