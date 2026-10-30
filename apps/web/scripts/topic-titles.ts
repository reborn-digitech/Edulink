/**
 * A PRACTICE CHAPTER'S NAME IS ITS BOOK'S CHAPTER TITLE (owner-batch-item6, 30 October 2026). No main: read by the
 * one-off repair of that day and by data:audit's "bank-names" check (tests/data-audit.test.ts).
 *
 * THE FAULT. 147 of the 631 live school chapters had a name that disagreed with the words of their slug. Most were
 * benign (a slug cut short), but two sets were not. The authored bank of August 2026 (content/quiz/*.json, loaded by
 * scripts/import-quiz.ts) named NCERT class 11 biology's chapters in phrases of its own ("How a Leaf Spends Light" for
 * Photosynthesis in Higher Plants); and the corpus's chapter headings that title recovery could not mend ("NIT", "Nit
 * of", "Roducts and Their", "REAS ELATED TO IRCLES", "In this chapter…") named the topics a generation run made from
 * them, whose slugs the next chapter with the same fragment then collided with. The model never wrote an English name.
 *
 * THE RULE. For each school chapter of the NCERT and Balbharati bank, its corpus chapter is a document (NCERT: one a
 * chapter; Balbharati: a book's chapter by its heading) of the same board, class, subject code and chapter number whose
 * recovered title (scripts/quiz-gen/select.ts chapterTitleOf) AGREES with the topic: three fifths of the content words
 * of the title or of the topic's slug, chapter line or name found in the other, or the book its generated batch was
 * drafted from. Agreement is required even with one candidate, because two books may carry one number (class 8 science
 * and mathematics, class 12 political science) and the authored bank was written against older books. A title is KNOWN
 * when it passes corpus-titles' refusal rules for a name (titleFragment, with the chapter's words) and every word of four
 * letters or more is the chapter's or the dictionary's.
 */
import type { PrismaClient } from "@prisma/client";
import { inDictionary, loadDictionary, REVIEWED_TITLES, titleFragment, vocabularyOf, type Vocabulary } from "./corpus-titles";
import { chapterBookOf, chapterNameOf, chapterNumberOf, words } from "./quiz-gen/checks";
import { bookChapterOf, chapterTitleOf, planBalbharati, planNcert, subjectCodeOf } from "./quiz-gen/select";

export type CorpusChapter = {
  board: "NCERT" | "BALBHARATI";
  grade: number;
  subjectCode: string;
  number: number;
  /** The recovered title as the generator reads it ("" when the heading is bare). */
  title: string;
  /** Why the title is not known (bare, a fragment, a word nobody knows), or null when it is. */
  refusal: string | null;
  book: string;
  bookCode: string | null;
  /** owner-batch-item8: the book a chapter line names beside its number when the NCERT plan names its books (planNcert). */
  planBook?: string | null;
  path: string;
  vocab: Vocabulary;
};

export type TopicForTitle = { id: string; slug: string; board: string | null; classLevel: number; subject: string; chapter: string; name: string };

const STOP = new Set(["and", "the", "of", "in", "a", "an", "its", "their", "to", "on", "for", "with", "that", "which", "is", "are", "it", "some", "chapter"]);
const content = (s: string) => new Set(words(s).filter((w) => w.length > 1 && !STOP.has(w)));
const squash = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");

/** The words of a topic's slug after its board, subject and class ("biology-11-photosynthesis-in-higher-plants" → "photosynthesis in higher plants"). */
export function slugWords(slug: string): string {
  return slug.replace(/^(?:balbharati-)?[a-z]+-\d{1,2}-/, "").replace(/-/g, " ");
}

/** Whether two titles agree: three fifths of the content words of either found in the other. Pure. */
export function titlesAgree(a: string, b: string): boolean {
  const A = content(a);
  const B = content(b);
  if (A.size === 0 || B.size === 0) return false;
  let both = 0;
  for (const w of A) if (B.has(w)) both++;
  return both / A.size >= 0.6 || both / B.size >= 0.6;
}

/** Why a corpus title cannot name a chapter, or null: titleFragment (corpus-titles' refusal rules for a name), and no word of four letters or more that neither the chapter nor the dictionary knows. Pure but for the word list. */
export function titleRefusal(title: string, ctx: { vocab: Vocabulary; bookTitle: string; dictionary?: ReadonlySet<string>; path?: string }): string | null {
  if (!title) return "only the chapter's label";
  // owner-batch-item8: a title a person read from the book (corpus-titles' REVIEWED_TITLES) is known.
  if (ctx.path && REVIEWED_TITLES[ctx.path]?.title === title) return null;
  const why = titleFragment(title, ctx);
  if (why) return why;
  const odd = (title.toLowerCase().match(/\p{L}+/gu) ?? []).filter((w) => w.length >= 4 && !(ctx.vocab.get(w) ?? 0) && !(ctx.dictionary ? inDictionary(w, ctx.dictionary) : true));
  return odd.length ? `"${odd[0]}" is a word neither the chapter nor the dictionary knows` : null;
}

type ChunkRow = { chapter: string | null; headingPath: string[]; text: string };

const labelOf = (r: Pick<ChunkRow, "chapter" | "headingPath">) => (r.chapter ?? r.headingPath[0] ?? "").trim();

/** Every NCERT and Balbharati textbook chapter of classes 1–12 the corpus holds, with its recovered title and whether it is known. Reads as any role. */
export async function corpusChapters(db: PrismaClient): Promise<CorpusChapter[]> {
  const dictionary = loadDictionary();
  const docs = await db.contentDocument.findMany({
    where: { kind: "textbook", source: { in: ["ncert", "balbharati"] } },
    select: { id: true, path: true, source: true, title: true, subject: true, gradeOrProgramme: true, extra: true },
    orderBy: { path: "asc" },
  });
  const out: CorpusChapter[] = [];
  // owner-batch-item7 (30 Oct 2026): a Balbharati class and subject is read the way the generator plans it (one book of
  // each edition, its parts numbered on: scripts/quiz-gen/select.ts planBalbharati), so the bank's "Chapter 12" of class
  // 9 mathematics finds part 2's chapter 3. owner-batch-item8 (31 Oct 2026): an NCERT one likewise (planNcert): parts
  // numbered on, two books under one number named; a book another replaced is read under its own numbers.
  const balbharati = new Map<string, typeof docs>();
  const ncert = new Map<string, typeof docs>();
  for (const d of docs) {
    const grade = Number(d.gradeOrProgramme);
    if (!Number.isInteger(grade) || grade < 1 || grade > 12) continue;
    try {
      subjectCodeOf(d.subject);
    } catch {
      continue;
    }
    const extra = (d.extra ?? {}) as { chapter?: number };
    if (d.source !== "ncert") {
      const key = `${grade}|${d.subject.toLowerCase()}`;
      balbharati.set(key, [...(balbharati.get(key) ?? []), d]);
      continue;
    }
    if (!extra.chapter) continue;
    const key = `${grade}|${d.subject.toLowerCase()}`;
    ncert.set(key, [...(ncert.get(key) ?? []), d]);
  }
  for (const group of ncert.values()) {
    const grade = Number(group[0]!.gradeOrProgramme);
    const subjectCode = subjectCodeOf(group[0]!.subject);
    const rowsOf = new Map<string, ChunkRow[]>();
    for (const d of group) rowsOf.set(d.id, await db.contentChunk.findMany({ where: { documentId: d.id }, orderBy: { ordinal: "asc" }, select: { chapter: true, headingPath: true, text: true } }));
    const firstOf = (d: (typeof group)[number]) => (rowsOf.get(d.id) ?? []).map(labelOf).find(Boolean) ?? "";
    const plan = planNcert(group, firstOf);
    const entries = [
      ...plan.chapters.map((c) => ({ doc: c.doc, number: c.planNumber, own: c.number, planBook: c.book?.title ?? null })),
      ...plan.superseded.flatMap((s) => s.docs.map((d) => ({ doc: d, number: chapterNumberOf(firstOf(d)) ?? (d.extra as { chapter: number }).chapter, own: chapterNumberOf(firstOf(d)) ?? (d.extra as { chapter: number }).chapter, planBook: null }))),
    ];
    for (const e of entries) {
      const rows = rowsOf.get(e.doc.id) ?? [];
      const title = chapterTitleOf(firstOf(e.doc), e.own);
      const vocab = vocabularyOf([...rows.map((r) => r.text), ...rows.flatMap((r) => r.headingPath.slice(1))]);
      const extra = (e.doc.extra ?? {}) as { bookCode?: string; bookId?: string };
      out.push({ board: "NCERT", grade, subjectCode, number: e.number, title, refusal: titleRefusal(title, { vocab, bookTitle: e.doc.title, dictionary, path: e.doc.path }), book: e.doc.title, bookCode: extra.bookCode ?? extra.bookId ?? null, planBook: e.planBook, path: e.doc.path, vocab });
    }
  }
  for (const group of balbharati.values()) {
    const grade = Number(group[0]!.gradeOrProgramme);
    const subjectCode = subjectCodeOf(group[0]!.subject);
    const rowsOf = new Map<string, ChunkRow[]>();
    for (const d of group) rowsOf.set(d.id, await db.contentChunk.findMany({ where: { documentId: d.id }, orderBy: { ordinal: "asc" }, select: { chapter: true, headingPath: true, text: true } }));
    const { chapters } = planBalbharati(group, (d) => (rowsOf.get(d.id) ?? []).map(labelOf));
    for (const c of chapters) {
      const mine = (rowsOf.get(c.doc.id) ?? []).filter((r) => {
        const b = bookChapterOf(labelOf(r));
        return b !== null && b.number === c.number && b.part === c.part;
      });
      const title = chapterTitleOf(c.label, c.number);
      const vocab = vocabularyOf([...mine.map((r) => r.text), ...mine.flatMap((r) => r.headingPath.slice(1))]);
      const extra = (c.doc.extra ?? {}) as { bookCode?: string; bookId?: string };
      out.push({ board: "BALBHARATI", grade, subjectCode, number: c.planNumber, title, refusal: titleRefusal(title, { vocab, bookTitle: c.doc.title, dictionary, path: c.doc.path }), book: c.doc.title, bookCode: extra.bookCode ?? extra.bookId ?? null, planBook: null, path: c.doc.path, vocab });
    }
  }
  return out;
}

export type TitleVerdict =
  | { kind: "OK"; title: string; chapter: CorpusChapter }
  /** The name (or the chapter line's name) is bare or a fragment by corpus-titles' rules. `title` is the known title of the corpus chapter that agrees with the topic, when one does. */
  | { kind: "FRAGMENT"; reason: string; title: string | null; chapter: CorpusChapter | null }
  /** The name differs from the known title of its chapter, and the topic's chapter line or slug IS that title: the name is the odd one out. */
  | { kind: "DIFFERS"; title: string; chapter: CorpusChapter }
  /** The name agrees with a known title in part but neither its chapter line nor its slug is the title (a slug cut short, a corpus title cut short, an older book's chapter): listed, not changed. */
  | { kind: "CLOSE"; title: string; chapter: CorpusChapter }
  /** No corpus chapter with a known title agrees with the topic: nothing to compare with. */
  | { kind: "UNKNOWN"; reason: string };

/**
 * The topic's corpus chapter and how its name stands against the title. `batchBook` is the book its generated batch was
 * drafted from, when one exists: it settles which of two agreeing books is the topic's, never more. Pure but for the
 * word list.
 */
export function titleVerdict(topic: TopicForTitle, corpus: readonly CorpusChapter[], batchBook: string | null = null): TitleVerdict {
  const n = chapterNumberOf(topic.chapter);
  const lineName = chapterNameOf(topic.chapter);
  // owner-batch-item8: a line that names its book ("Chapter 5 (Contemporary World Politics) — …") is that book's chapter.
  const lineBook = chapterBookOf(topic.chapter);
  const candidates = n === null ? [] : corpus.filter((c) => c.board === topic.board && c.grade === topic.classLevel && c.subjectCode === topic.subject && c.number === n && (lineBook === null || c.planBook === lineBook));
  const known = candidates.filter((c) => !c.refusal);
  const exact = (c: CorpusChapter) => squash(c.title) === squash(lineName) || squash(c.title) === squash(slugWords(topic.slug)) || squash(c.title) === squash(topic.name);
  const agreeing = known.filter((c) => exact(c) || titlesAgree(c.title, slugWords(topic.slug)) || titlesAgree(c.title, lineName) || titlesAgree(c.title, topic.name));
  const settle = (list: CorpusChapter[]) => (list.length === 1 ? list[0]! : (list.filter((c) => batchBook !== null && c.book === batchBook).length === 1 ? list.find((c) => c.book === batchBook)! : null));
  const chapter = settle(known.filter(exact)) ?? settle(agreeing);
  const vocab: Vocabulary = chapter?.vocab ?? new Map(candidates.flatMap((c) => [...c.vocab]));
  const ctx = { vocab, bookTitle: chapter?.book ?? "", dictionary: loadDictionary() };
  // The name the chapter line or the slug spells is the title: the strong sign the name alone is wrong.
  const spelled = chapter && (squash(chapter.title) === squash(lineName) || squash(chapter.title) === squash(slugWords(topic.slug))) ? chapter : null;
  const fragment = titleFragment(topic.name, ctx) ?? (lineName ? titleFragment(lineName, ctx) : null);
  // A broken name takes the known title of the chapter that agrees with it, even in part.
  if (fragment) return { kind: "FRAGMENT", reason: fragment, title: chapter?.title ?? null, chapter };
  if (!chapter) {
    if (n === null) return { kind: "UNKNOWN", reason: `its chapter line "${topic.chapter}" carries no number` };
    if (candidates.length === 0) return { kind: "UNKNOWN", reason: `no ${topic.board} class ${topic.classLevel} ${topic.subject} chapter ${n} in the corpus` };
    if (known.length === 0) return { kind: "UNKNOWN", reason: `the corpus's title is not known (${candidates.map((c) => `"${c.title}": ${c.refusal}`).join("; ")})` };
    if (agreeing.length > 1) return { kind: "UNKNOWN", reason: `${agreeing.length} books' chapter ${n} agree with it (${agreeing.map((c) => c.bookCode ?? c.book).join(", ")})` };
    return { kind: "UNKNOWN", reason: `no known title of chapter ${n} agrees with its slug, chapter line or name (${known.map((c) => `"${c.title}"`).join(", ")})` };
  }
  if (squash(chapter.title) === squash(topic.name)) return { kind: "OK", title: chapter.title, chapter };
  return spelled ? { kind: "DIFFERS", title: chapter.title, chapter } : { kind: "CLOSE", title: chapter.title, chapter };
}
