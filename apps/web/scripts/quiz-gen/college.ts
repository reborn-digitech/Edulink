/**
 * THE GENERATOR'S COLLEGE SCOPE (college-content, the owner's decisions of 12 October 2026).
 *
 * A college unit is a unit of a syllabus document of the stream (ContentDocument source "syllabi"),
 * cut by its chunks' level-one headings (src/lib/college-syllabi.ts `unitsOf`, the same cut the desk's
 * card lists). The selection names the programme and the unit; the pipeline is the textbook chapters'
 * own (scripts/quiz-gen/pipeline.ts), with a note in the drafting prompt that the passage is a university
 * syllabus; the batch file carries `audience: "COLLEGE"`, the stream, the programme and the year or
 * semester, no school board, and lands as a COLLEGE topic (scripts/quiz-queue-load.ts).
 *
 *   in the bank: subject = the stream code (LAW), classLevel = 13 (the college level), chapter =
 *   "Unit 2 — Science and Technology Law", programme = "LL.M.", yearOrSemester from the unit's heading or
 *   the document's title ("Semester II" → S2), streams = [the stream].
 *
 * Reads the corpus as the app role; writes files only (the job loads them).
 */
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { PrismaClient } from "@prisma/client";
import { COLLEGE_CLASS_LEVEL, type CollegeSyllabusBoard, type CollegeTerm, type QuizGenRequest, type StreamCode } from "@edulink/contracts";
import { requireAssistantConfig } from "../../src/lib/assistant-env";
import { collegeTermOf, programmeOf, readCollegeSyllabi, studyChunks, syllabusStreamOf, tidyTitle, unitsOf } from "../../src/lib/college-syllabi";
import { collegeSyllabusBoardOf } from "@edulink/contracts";
import { slugify } from "./checks";
import { loadDictionary, titleFragment, vocabularyOf } from "../corpus-titles";
import { generatorClient } from "./model";
import { runChapter } from "./pipeline";
import { bankStems, styleExcerpts, type SelectedChapter, type SelectedChunk } from "./select";
import { LICENCE, OUT_DIR, type ChapterHooks, type GeneratedChapter } from "./cli";
import type { GeneratedTopicFile } from "./shape";

/** A college unit, as the pipeline reads a chapter, with what the bank needs beside it. */
export type CollegeUnit = SelectedChapter & {
  stream: StreamCode;
  syllabusBoard: CollegeSyllabusBoard;
  programme: string;
  yearOrSemester: CollegeTerm | null;
  unitNumber: number;
  unitName: string;
};

/** What the drafting prompt is told about a syllabus passage. */
export const SYLLABUS_NOTE =
  "This passage is a unit of a university syllabus, not a textbook: it lists what the course teaches. Write questions on that subject matter, at the level the programme examines, from what a student of the programme is taught about the topics listed; never a question about the syllabus itself (its credits, marks, paper codes, hours, rules or reading list).";

/** "college-law-ll-m-<doc>-u2": a slug that names the stream, the programme, the document and the unit, stable across runs. */
export function collegeTopicSlug(stream: StreamCode, programme: string, documentPath: string, unit: number): string {
  const doc = createHash("sha1").update(documentPath).digest("hex").slice(0, 8);
  return `college-${slugify(stream, 20)}-${slugify(programme, 24) || "programme"}-${doc}-u${unit}`;
}

/** The batch file's name, without .json: the topic's slug. */
export function collegeFileName(unit: Pick<CollegeUnit, "stream" | "programme" | "documentPath" | "unitNumber">): string {
  return collegeTopicSlug(unit.stream, unit.programme, unit.documentPath, unit.unitNumber);
}

/** One unit of one syllabus document, as the pipeline reads a chapter. */
export async function selectCollegeUnit(db: PrismaClient, args: { path: string; unit: number }): Promise<CollegeUnit> {
  const doc = await db.contentDocument.findUnique({
    where: { path: args.path },
    select: { id: true, path: true, source: true, board: true, gradeOrProgramme: true, subject: true, title: true, edition: true, year: true, sourceUrl: true },
  });
  if (!doc || doc.source !== "syllabi") throw new Error(`no syllabus document "${args.path}" in the corpus (ContentDocument source "syllabi")`);
  const stream = syllabusStreamOf(doc);
  const board = collegeSyllabusBoardOf(doc.board);
  if (!stream || !board) throw new Error(`"${doc.title}" is not for one stream (a common course, or a board the generator does not read)`);
  const rows = await db.contentChunk.findMany({
    where: { documentId: doc.id },
    orderBy: { ordinal: "asc" },
    select: { id: true, ordinal: true, headingPath: true, pageStart: true, pageEnd: true, text: true, tokens: true, figureKeys: true },
  });
  const units = unitsOf(rows, tidyTitle(doc.title));
  const unit = units.find((u) => u.number === args.unit);
  if (!unit) throw new Error(`"${tidyTitle(doc.title)}" has ${units.length} unit(s); there is no unit ${args.unit}`);
  // qb-A (QB-01): a unit headed by the document's furniture ("Notes:", "Syllabus", "Intake: 60 Duration: 4 Year") or its title page is not drafted.
  if (unit.refusal) throw new Error(`unit ${unit.number} ("${unit.heading}") of "${tidyTitle(doc.title)}" is not drafted: its heading is ${unit.refusal}`);
  const chunks: SelectedChunk[] = studyChunks(unit).map((r) => ({ id: r.id, ordinal: r.ordinal, headingPath: r.headingPath, pageStart: r.pageStart, pageEnd: r.pageEnd, text: r.text, tokens: r.tokens, figureKeys: [] }));
  if (!chunks.length) throw new Error(`unit ${unit.number} ("${unit.name}") of "${tidyTitle(doc.title)}" is only a reading list`);
  // qb-A (QB-01): the school chapters' fragment rule too (corpus-titles' titleFragment), judged against the unit's own words.
  const fragment = titleFragment(unit.name, { vocab: vocabularyOf(chunks.map((c) => c.text)), bookTitle: "", dictionary: loadDictionary() });
  if (fragment) throw new Error(`unit ${unit.number} ("${unit.name}") of "${tidyTitle(doc.title)}" is not drafted: its name is ${fragment}`);
  const programme = programmeOf(doc);
  return {
    board,
    source: "syllabi",
    book: tidyTitle(doc.title),
    bookCode: null,
    documentPath: doc.path,
    classLevel: COLLEGE_CLASS_LEVEL,
    subject: `${stream.charAt(0)}${stream.slice(1).toLowerCase().replace(/_/g, " ")} (${programme})`,
    subjectCode: stream,
    chapterNumber: unit.number,
    chapterName: unit.name,
    chapterLabel: `Unit ${unit.number} — ${unit.name}`,
    edition: doc.edition ?? (doc.year ? `${doc.year}` : null),
    sourceUrl: doc.sourceUrl,
    chunks,
    // A syllabus has no figures of its own; an item may still draw its own spec.
    figures: new Map(),
    headings: [...new Set(chunks.flatMap((c) => c.headingPath.slice(1)))],
    draftNote: SYLLABUS_NOTE,
    stream,
    syllabusBoard: board,
    programme,
    yearOrSemester: collegeTermOf(unit.name) ?? collegeTermOf(tidyTitle(doc.title)),
    unitNumber: unit.number,
    unitName: unit.name,
  };
}

/** The batch file a college unit writes: the bank's own shape, the college fields beside it, no school board. */
export type CollegeTopicFile = Omit<GeneratedTopicFile, "board"> & {
  audience: "COLLEGE";
  streams: StreamCode[];
  programme: string;
  yearOrSemester: CollegeTerm | null;
  syllabusBoard: CollegeSyllabusBoard;
  document: string;
};

/** One college unit through the pipeline, its file and run log written (unless a stop halted it). */
export async function generateCollegeUnit(db: PrismaClient, args: { path: string; unit: number; limit: number; perLevel: number }, hooks: ChapterHooks = {}): Promise<GeneratedChapter & { unit: CollegeUnit }> {
  const log = hooks.log ?? ((line: string) => console.log(line));
  const unit = await selectCollegeUnit(db, args);
  log(`  "${unit.book}" (${unit.syllabusBoard}, ${unit.stream}, ${unit.programme}${unit.yearOrSemester ? `, ${unit.yearOrSemester}` : ""}), ${unit.documentPath}: ${unit.chapterLabel}`);
  log(`  ${unit.chunks.length} chunks, pp. ${unit.chunks[0]!.pageStart}–${unit.chunks[unit.chunks.length - 1]!.pageEnd}`);
  const endpoints = requireAssistantConfig("quiz:gen");
  const client = await generatorClient(endpoints, log);
  const [stems, style] = await Promise.all([
    bankStems(db, unit.subjectCode, unit.classLevel),
    // The entrance and olympiad papers are school papers: a college unit's levels 5 and 6 take no style block unless the corpus has one for the subject.
    styleExcerpts(db, endpoints.embed, { subject: unit.stream.toLowerCase(), classLevel: unit.classLevel, chapterName: unit.chapterName }),
  ]);
  const slug = collegeTopicSlug(unit.stream, unit.programme, unit.documentPath, unit.unitNumber);
  const { questions, log: runLog, topicWords, stopped } = await runChapter(client, unit, { limit: args.limit, perLevel: args.perLevel, bankStems: stems, glossary: [], style, log, onProgress: hooks.onProgress, shouldStop: hooks.shouldStop });
  if (stopped) {
    log(`  stopped: the unit was halted after the items in hand; nothing was written`);
    return { chapter: unit, unit, runLog, stopped: true, file: null, fileName: null, outPath: null, logPath: null };
  }
  const file: CollegeTopicFile = {
    subject: unit.subjectCode,
    classLevel: unit.classLevel,
    chapter: unit.chapterLabel,
    name: unit.unitName,
    slug,
    summary: topicWords?.summary ?? "",
    position: unit.unitNumber,
    source: `generated against ${unit.syllabusBoard} "${unit.book}", ${unit.programme}, unit ${unit.unitNumber}${unit.edition ? ` (${unit.edition})` : ""}`,
    licence: LICENCE,
    translations: topicWords ? { hi: { name: topicWords.nameHi, summary: topicWords.summaryHi }, mr: { name: topicWords.nameMr, summary: topicWords.summaryMr } } : {},
    audience: "COLLEGE",
    streams: [unit.stream],
    programme: unit.programme,
    yearOrSemester: unit.yearOrSemester,
    syllabusBoard: unit.syllabusBoard,
    document: unit.documentPath,
    book: unit.book,
    edition: unit.edition,
    generatedAt: runLog.startedAt,
    model: runLog.model,
    topicIsNew: true,
    questions,
  };
  mkdirSync(join(OUT_DIR, "runs"), { recursive: true });
  const name = collegeFileName(unit);
  const outPath = join(OUT_DIR, `${name}.json`);
  writeFileSync(outPath, JSON.stringify(file, null, 2) + "\n");
  const logPath = join(OUT_DIR, "runs", `${name}.${runLog.startedAt.replace(/[:.]/g, "-")}.json`);
  writeFileSync(logPath, JSON.stringify(runLog, null, 2) + "\n");
  return { chapter: unit, unit, runLog, stopped: false, file: file as unknown as GeneratedTopicFile, fileName: `${name}.json`, outPath, logPath };
}

/** One unit the run will take: the document, the unit, and what the live line names. */
export type CollegeWork = { path: string; title: string; board: CollegeSyllabusBoard; stream: StreamCode; programme: string; unit: number; unitName: string; fileName: string };

/**
 * The units a COLLEGE request covers, in order: the programme's documents (or the one named) in path order,
 * each one's units in the range asked for, the units whose heading is refused (qb-A, QB-01) left out.
 */
export function planCollegeUnits(
  request: Pick<QuizGenRequest, "stream" | "programme" | "document" | "unitFrom" | "unitTo">,
  syllabi: { doc: { path: string; title: string }; stream: StreamCode; board: CollegeSyllabusBoard; programme: string; units: { number: number; name: string; refusal?: string | null }[] }[],
): CollegeWork[] {
  const from = request.unitFrom ?? 1;
  const to = request.unitTo ?? Number.MAX_SAFE_INTEGER;
  const out: CollegeWork[] = [];
  for (const s of syllabi) {
    if (s.stream !== request.stream || s.programme !== request.programme) continue;
    if (request.document && s.doc.path !== request.document) continue;
    for (const u of s.units) {
      if (u.number < from || u.number > to) continue;
      // qb-A (QB-01): a refused unit is no work (selectCollegeUnit would refuse it too).
      if (u.refusal) continue;
      out.push({ path: s.doc.path, title: tidyTitle(s.doc.title), board: s.board, stream: s.stream, programme: s.programme, unit: u.number, unitName: u.name, fileName: `${collegeTopicSlug(s.stream, s.programme, s.doc.path, u.number)}.json` });
    }
  }
  return out;
}

/** The plan read from the corpus. */
export async function collegePlan(db: PrismaClient, request: QuizGenRequest): Promise<CollegeWork[]> {
  return planCollegeUnits(request, await readCollegeSyllabi(db));
}
