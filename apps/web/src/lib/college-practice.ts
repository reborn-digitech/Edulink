import { collegeTermParts, sortCollegeTerms, STREAMS, type CollegeTerm, type PracticeSection } from "@edulink/contracts";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";

/**
 * A COLLEGE'S PRACTICE PAGE, the pure half (college-content, the owner's decisions of 12 October 2026).
 * The rule for what lists is the contract's (practiceSectionOf) and the query's (src/lib/practice-audience.ts);
 * this file arranges what listed: the stream section by programme and subject with a year or semester
 * filter, the prep section by class and subject, paged. Client-safe; the web page and the tests read it,
 * and the phone does the same arithmetic on its own (apps/mobile src/screens/family/practice.tsx).
 */

export const PREP_PAGE_SIZE = 24;

type Listed = { subject: string; classLevel: number; programme: string | null; yearOrSemester: CollegeTerm | null; section: PracticeSection | null };

/** The section asked for in the URL, or STREAM. */
export function sectionFromQuery(value: string | null | undefined): PracticeSection {
  return value === "prep" || value === "PREP" ? "PREP" : "STREAM";
}

/** "Year 2" or "Semester 3", in the reader's language. */
export function collegeTermLabel(t: Translate, term: CollegeTerm): string {
  const { kind, n } = collegeTermParts(term);
  return t(kind === "YEAR" ? "collegePractice.termYEAR" : "collegePractice.termSEMESTER", { n });
}

/** A college chapter's subject: a stream's name (the generated banks' subject is the stream code), else the school's subject word, else the code. */
export function collegeSubjectLabel(t: Translate, subject: string, subjectKey: Partial<Record<string, TranslationKey>>): string {
  if ((STREAMS as readonly string[]).includes(subject)) return t(`streams.${subject}.name` as TranslationKey);
  const key = subjectKey[subject];
  return key ? t(key) : subject;
}

export type StreamGroup<T> = { programme: string | null; subjects: { subject: string; topics: T[] }[] };

/**
 * The stream section: the programmes and the terms to offer (from every stream chapter), and the chapters
 * the chosen programme and term leave, grouped by programme (the college-wide banks, with none, last) and
 * then by subject. An unknown programme or term in the URL is ignored.
 */
export function streamListing<T extends Listed>(topics: T[], opts: { programme?: string | null; term?: string | null }) {
  const stream = topics.filter((t) => t.section === "STREAM");
  const programmes = [...new Set(stream.map((t) => t.programme).filter((p): p is string => !!p))].sort((a, b) => a.localeCompare(b));
  const terms = sortCollegeTerms(stream.map((t) => t.yearOrSemester));
  const programme = opts.programme && programmes.includes(opts.programme) ? opts.programme : null;
  const term = opts.term && (terms as string[]).includes(opts.term) ? (opts.term as CollegeTerm) : null;
  // A term filter keeps the chapters of that term and those that name none (a college-wide bank applies to every year).
  const shown = stream.filter((t) => (!programme || t.programme === programme) && (!term || t.yearOrSemester === term || t.yearOrSemester === null));
  const order = [...new Set(shown.map((t) => t.programme))].sort((a, b) => (a === null ? 1 : b === null ? -1 : a.localeCompare(b)));
  const groups: StreamGroup<T>[] = order.map((p) => {
    const mine = shown.filter((t) => t.programme === p);
    return { programme: p, subjects: [...new Set(mine.map((t) => t.subject))].map((subject) => ({ subject, topics: mine.filter((t) => t.subject === subject) })) };
  });
  return { programmes, terms, programme, term, groups, total: shown.length, available: stream.length };
}

/** The prep section: NCERT's chapters by class and subject, paged as the school page is. */
export function prepListing<T extends Listed>(topics: T[], opts: { grade?: string | null; subject?: string | null; page?: string | null }) {
  const prep = topics.filter((t) => t.section === "PREP");
  const grades = [...new Set(prep.map((t) => t.classLevel))].sort((a, b) => a - b);
  const asked = opts.grade ? Number(opts.grade) : NaN;
  const grade = Number.isInteger(asked) && grades.includes(asked) ? asked : null;
  const subjects = [...new Set(prep.filter((t) => grade === null || t.classLevel === grade).map((t) => t.subject))];
  const subject = opts.subject && subjects.includes(opts.subject) ? opts.subject : null;
  const filtered = prep.filter((t) => (grade === null || t.classLevel === grade) && (subject === null || t.subject === subject));
  const pages = Math.max(1, Math.ceil(filtered.length / PREP_PAGE_SIZE));
  const n = Number.parseInt(opts.page ?? "1", 10);
  const page = Number.isFinite(n) ? Math.min(Math.max(1, n), pages) : 1;
  return { grades, grade, subjects, subject, shown: filtered.slice((page - 1) * PREP_PAGE_SIZE, page * PREP_PAGE_SIZE), total: filtered.length, page, pages, available: prep.length };
}
