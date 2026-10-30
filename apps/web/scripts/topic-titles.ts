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
import { inDictionary, loadDictionary, titleFragment, vocabularyOf, type Vocabulary } from "./corpus-titles";
import { chapterNameOf, chapterNumberOf, words } from "./quiz-gen/checks";
import { chapterTitleOf, subjectCodeOf } from "./quiz-gen/select";

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
export function titleRefusal(title: string, ctx: { vocab: Vocabulary; bookTitle: string; dictionary?: ReadonlySet<string> }): string | null {
  if (!title) return "only the chapter's label";
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
  for (const d of docs) {
    const grade = Number(d.gradeOrProgramme);
    if (!Number.isInteger(grade) || grade < 1 || grade > 12) continue;
    let subjectCode: string;
    try {
      subjectCode = subjectCodeOf(d.subject);
    } catch {
      continue;
    }
    const extra = (d.extra ?? {}) as { chapter?: number; bookCode?: string; bookId?: string };
    const bookCode = extra.bookCode ?? extra.bookId ?? null;
    const board = d.source === "ncert" ? "NCERT" : "BALBHARATI";
    const rows: ChunkRow[] = await db.contentChunk.findMany({ where: { documentId: d.id }, orderBy: { ordinal: "asc" }, select: { chapter: true, headingPath: true, text: true } });
    const groups = new Map<number, ChunkRow[]>();
    if (d.source === "ncert") {
      if (!extra.chapter) continue;
      groups.set(extra.chapter, rows);
    } else {
      for (const r of rows) {
        const n = chapterNumberOf(labelOf(r));
        if (n === null) continue;
        groups.set(n, [...(groups.get(n) ?? []), r]);
      }
    }
    for (const [number, mine] of groups) {
      const label = mine.map(labelOf).find(Boolean) ?? "";
      const title = chapterTitleOf(label, number);
      const vocab = vocabularyOf([...mine.map((r) => r.text), ...mine.flatMap((r) => r.headingPath.slice(1))]);
      out.push({ board, grade, subjectCode, number, title, refusal: titleRefusal(title, { vocab, bookTitle: d.title, dictionary }), book: d.title, bookCode, path: d.path, vocab });
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
  const candidates = n === null ? [] : corpus.filter((c) => c.board === topic.board && c.grade === topic.classLevel && c.subjectCode === topic.subject && c.number === n);
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
