/**
 * The generator's passes over one chapter, in the brief's order (docs/plans/assistant-and-quiz-bank.md,
 * Phase 1, with the owner's amendments of 10 October 2026):
 *
 *   1. drafting, in English, per chunk group, a fixed number per level, through the JSON schema;
 *   2. the critique pass (a second call, another seed): one defensible answer, each distractor wrong,
 *      each reason a real misconception; failures rejected with the reason kept;
 *   3. the blind-solver pass: five runs, different seeds, no solution; levels 1–2 missed or 4–6 always
 *      right are flagged; a distractor nobody picks AND whose reason the critique found no misconception
 *      is redrafted once, the item re-solved, then rejected; a distractor picked more than the key rejects;
 *   4. form checks (checks.ts), then the bank's own per-question checks (scripts/verify-quiz.ts);
 *   5. near-duplicates dropped by embedding similarity against the served bank and the batch;
 *   6. every item that reaches the file translated into Hindi and Marathi, one critique each, the
 *      glossary lines in the prompt where the corpus has a glossary for the subject.
 *
 * The run log counts every stage's calls, seconds and rejects, and keeps a timing per item.
 */
import { devanagariPunctuation, formChecks, groupChunks, ladderToBank, nearDuplicates, perLevelTargets, solverVerdict, stripListMarker, DUPLICATE_THRESHOLD, REFERS_TO_PASSAGE } from "./checks";
import type { ChatClient } from "./model";
import { seedFor } from "./model";
import { isLiteralFigureLabel } from "@edulink/contracts";
import { figureProblems } from "./figures/check";
import { critiqueUser, draftUser, redraftFigureUser, redraftUser, rewriteSolutionUser, solverUser, SYSTEM_CRITIQUE, SYSTEM_DRAFT, SYSTEM_REDRAFT, SYSTEM_REDRAFT_FIGURE, SYSTEM_REWRITE_SOLUTION, SYSTEM_SOLVER, SYSTEM_TOPIC_WORDS, systemTranslate, systemTranslationCritique, topicWordsUser, translateUser, translationCritiqueUser } from "./prompts";
import { glossaryLinesFor, type SelectedChapter, type SelectedChunk, type StyleBlock } from "./select";
import {
  CRITIQUE_SCHEMA,
  DRAFT_SCHEMA,
  LEVELS,
  REDRAFT_FIGURE_SCHEMA,
  REDRAFT_SCHEMA,
  REWRITE_SOLUTION_SCHEMA,
  SOLVER_SCHEMA,
  STYLE_LEVELS,
  TOPIC_WORDS_SCHEMA,
  TRANSLATION_CRITIQUE_SCHEMA,
  TRANSLATION_SCHEMA,
  type CritiqueVerdict,
  type DraftItem,
  type GeneratedQuestion,
  type GeneratedTranslation,
  type Level,
  type RedraftDistractor,
  type RedraftFigure,
  type Reject,
  type RewrittenSolution,
  type SolverAnswer,
  type Stage,
  type TopicWords,
  type TranslationCritique,
  type TranslationDraft,
} from "./shape";
import { questionErrors } from "../verify-quiz";
import { aboutTheSyllabus } from "../../src/lib/college-syllabi"; // college-content (12 Oct 2026)

export const SOLVER_RUNS = 5;

/** The drafting schema with the array bounded to the count asked for: the model once wrote five where one was wanted. */
export function draftSchemaFor(count: number): Record<string, unknown> {
  const n = Math.max(1, Math.min(14, count));
  return { ...DRAFT_SCHEMA, properties: { items: { ...DRAFT_SCHEMA.properties.items, minItems: n, maxItems: n } } };
}

export type StageCount = { calls: number; ms: number; in: number; out: number; rejects: number; promptTokens: number; completionTokens: number };

export type ItemTiming = { level: Level; stem: string; ms: Partial<Record<Stage, number>>; outcome: "kept" | Stage; flag: string | null };

export type RunLog = {
  task: "quiz-gen";
  startedAt: string;
  finishedAt: string;
  seconds: number;
  model: string;
  chapter: { board: string; book: string; bookCode: string | null; document: string; classLevel: number; subject: string; chapter: string; edition: string | null; chunks: number; groups: number };
  targets: Record<Level, number>;
  style: StyleBlock;
  glossary: string;
  stages: Record<Stage, StageCount>;
  kept: number;
  keptByLevel: Record<Level, number>;
  flagged: number;
  needsFigure: number;
  duplicateThreshold: number;
  items: ItemTiming[];
  rejects: Reject[];
  notes: string[];
};

type Working = {
  key: string;
  level: Level;
  stem: string;
  choices: string[];
  answerIndex: number;
  solution: string;
  checkExpr: string | null;
  figure: GeneratedQuestion["figure"];
  imageAlt: string | null;
  distractorReason: (string | null)[];
  sources: GeneratedQuestion["sources"];
  passage: string;
  critique: string | null;
  weakReasons: Set<number>;
  solverAnswers: number[];
  levelFlag: string | null;
  ms: Partial<Record<Stage, number>>;
};

export type PipelineOptions = {
  limit: number;
  perLevel: number;
  bankStems: { id: string; stem: string }[];
  glossary: { text: string }[];
  style: StyleBlock;
  log: (line: string) => void;
  /** Pinned for the tests; the run's clock otherwise. */
  now?: () => Date;
  /**
   * quiz-publish-jobs (11 Oct 2026): told after every draft group, every item checked and every item
   * translated — the generation job's live line (scripts/quiz-gen/job.ts).
   */
  onProgress?: (p: ChapterProgress) => void;
  /**
   * quiz-publish-jobs: asked before the next group, item or translation is taken up. True halts the
   * chapter once the items in hand are done: the chapter returns `stopped` with no questions, so nothing
   * half-written is written, and a later run generates it again from the start (the seeds repeat).
   */
  shouldStop?: () => boolean;
};

/** The chapter so far: items drafted, items through every check, rejects per stage. */
export type ChapterProgress = { drafted: number; kept: number; rejects: Record<Stage, number> };

function emptyStage(): StageCount {
  return { calls: 0, ms: 0, in: 0, out: 0, rejects: 0, promptTokens: 0, completionTokens: 0 };
}

/** The drafting fields onto the file's: the figure with its alt, the three reasons onto four slots, the expression trimmed. */
export function fromDraft(d: DraftItem, group: SelectedChunk[], documentPath: string, key: string): Working | { error: string } {
  if (!Number.isInteger(d.answerIndex) || d.answerIndex < 0 || d.answerIndex > 3) return { error: `answerIndex ${d.answerIndex} is not 0–3` };
  if (!Array.isArray(d.options) || d.options.length !== 4) return { error: "not four options" };
  if (!Array.isArray(d.distractorReasons) || d.distractorReasons.length !== 3) return { error: "not three distractor reasons" };
  let level: Level;
  try {
    level = ladderToBank(d.difficulty);
  } catch (e) {
    return { error: (e as Error).message };
  }
  const reasons: (string | null)[] = [];
  let r = 0;
  for (let i = 0; i < 4; i++) reasons.push(i === d.answerIndex ? null : (d.distractorReasons[r++] ?? null));
  const kind = d.figure?.kind ?? "";
  const figure = kind ? { kind, spec: d.figure.spec ?? {}, labels: d.figure.labels ?? {} } : null;
  return {
    key,
    level,
    stem: d.stem.trim(),
    choices: d.options.map((o) => o.trim()),
    answerIndex: d.answerIndex,
    solution: d.solution.trim(),
    checkExpr: d.checkExpr?.trim() ? d.checkExpr.trim() : null,
    figure,
    imageAlt: figure ? d.figureAlt?.trim() || null : null,
    distractorReason: reasons,
    sources: group.map((c) => ({ document: documentPath, ordinal: c.ordinal, pageStart: c.pageStart, pageEnd: c.pageEnd, headingPath: c.headingPath })),
    passage: group.map((c) => c.text).join("\n\n"),
    critique: null,
    weakReasons: new Set(),
    solverAnswers: [],
    levelFlag: null,
    ms: {},
  };
}

/** The critique's verdict in words, or null when the item passes. The weak reasons are kept for the solver pass. */
export function critiqueOutcome(item: { answerIndex: number }, v: CritiqueVerdict): { reject: string | null; weak: number[] } {
  const problems: string[] = [];
  if (v.correctIndex !== item.answerIndex) problems.push(`the critic finds option ${v.correctIndex} correct, the key is ${item.answerIndex}`);
  if (!v.oneAnswer) problems.push("more than one defensible answer, or none");
  if (!v.solutionSound) problems.push("the solution's working is not sound");
  const weak: number[] = [];
  for (const d of v.distractors ?? []) {
    if (d.index === item.answerIndex) continue;
    if (!d.isWrong) problems.push(`option ${d.index} is not wrong`);
    if (!d.reasonIsRealMisconception) weak.push(d.index);
  }
  return { reject: problems.length ? problems.join("; ") : null, weak };
}

export async function runChapter(client: ChatClient, chapter: SelectedChapter, opts: PipelineOptions): Promise<{ questions: GeneratedQuestion[]; log: RunLog; topicWords: TopicWords | null; stopped: boolean }> {
  const now = opts.now ?? (() => new Date());
  const started = now();
  const stages: Record<Stage, StageCount> = { draft: emptyStage(), critique: emptyStage(), solver: emptyStage(), form: emptyStage(), verify: emptyStage(), dedupe: emptyStage(), translation: emptyStage() };
  const rejects: Reject[] = [];
  const timings: ItemTiming[] = [];
  const notes: string[] = [];
  const log = opts.log;

  const targets = perLevelTargets(opts.limit, opts.perLevel);
  if (!opts.style.present) {
    for (const l of STYLE_LEVELS) targets[l] = 0;
    notes.push(opts.style.note);
    log(`  levels 5–6: ${opts.style.note}`);
  } else {
    notes.push(`levels 5–6 drafted with a style block: ${opts.style.note}`);
    log(`  levels 5–6: ${opts.style.note}`);
  }
  const groups = groupChunks(chapter.chunks);
  log(`  ${chapter.chunks.length} chunks in ${groups.length} groups; targets ${LEVELS.map((l) => `L${l}:${targets[l]}`).join(" ")}`);

  const captions = [...chapter.figures.values()].filter((f) => f.caption).map((f) => f.caption!);
  const generatedAt = started.toISOString();
  const kept: Working[] = [];
  const remaining: Record<Level, number> = { ...targets };
  const glossaryNote = opts.glossary.length ? `glossary lines from the corpus for ${chapter.subject} in the prompt` : `no glossary in the corpus for ${chapter.subject} (NCERT's trilingual dictionaries cover economics, geography and sociology only): the model's own terms`;

  function summary(questions: GeneratedQuestion[]): RunLog {
    const finished = now();
    const keptByLevel = {} as Record<Level, number>;
    for (const l of LEVELS) keptByLevel[l] = questions.filter((q) => q.difficulty === l).length;
    return {
      task: "quiz-gen",
      startedAt: generatedAt,
      finishedAt: finished.toISOString(),
      seconds: Math.round((finished.getTime() - started.getTime()) / 1000),
      model: client.model,
      chapter: { board: chapter.board, book: chapter.book, bookCode: chapter.bookCode, document: chapter.documentPath, classLevel: chapter.classLevel, subject: chapter.subject, chapter: chapter.chapterLabel, edition: chapter.edition, chunks: chapter.chunks.length, groups: groups.length },
      targets,
      style: opts.style,
      glossary: glossaryNote,
      stages,
      kept: questions.length,
      keptByLevel,
      flagged: questions.filter((q) => q.levelFlag).length,
      needsFigure: questions.filter((q) => q.needsFigure).length,
      duplicateThreshold: DUPLICATE_THRESHOLD,
      items: timings,
      rejects,
      notes,
    };
  }
  const halted = () => opts.shouldStop?.() === true;
  const progress = () =>
    opts.onProgress?.({ drafted: stages.draft.out, kept: kept.length, rejects: Object.fromEntries(Object.entries(stages).map(([k, v]) => [k, v.rejects])) as Record<Stage, number> });

  async function callJson<T>(stage: Stage, call: Parameters<ChatClient["json"]>[0]): Promise<T> {
    const r = await client.json<T>(call);
    stages[stage].calls++;
    stages[stage].ms += r.ms;
    stages[stage].promptTokens += r.promptTokens;
    stages[stage].completionTokens += r.completionTokens;
    return r.value;
  }

  function reject(w: Working, stage: Stage, reason: string) {
    rejects.push({ stage, level: w.level, stem: w.stem, reason });
    stages[stage].rejects++;
    timings.push({ level: w.level, stem: w.stem, ms: w.ms, outcome: stage, flag: null });
    log(`    ✗ ${stage} L${w.level} "${w.stem.slice(0, 60)}…" — ${reason}`);
  }

  /* ---- 1. drafting ---------------------------------------------------------------------------- */
  async function draftRound(round: number): Promise<Working[]> {
    const drafts: Working[] = [];
    const order = round === 1 ? groups : [...groups].reverse();
    for (let g = 0; g < order.length; g++) {
      if (halted()) break;
      const counts: Partial<Record<Level, number>> = {};
      let total = 0;
      // One item per level per group: a call of at most six items stays well inside the answer's
      // token budget (a call of eight once ran past it and was cut mid-item).
      for (const l of LEVELS) {
        const n = Math.min(remaining[l], 1);
        if (n > 0) {
          counts[l] = n;
          total += n;
        }
      }
      if (total === 0) break;
      const group = order[g]!;
      const passage = group.map((c) => c.text).join("\n\n");
      const captionsHere = group.flatMap((c) => c.figureKeys).map((k) => chapter.figures.get(k)?.caption).filter((c): c is string => Boolean(c));
      const t0 = Date.now();
      let items: DraftItem[];
      try {
        const out = await callJson<{ items: DraftItem[] }>("draft", {
          system: SYSTEM_DRAFT,
          user: draftUser({
            board: chapter.board,
            book: chapter.book,
            classLevel: chapter.classLevel,
            subject: chapter.subject,
            chapter: chapter.chapterLabel,
            edition: chapter.edition,
            passage,
            captions: [...new Set(captionsHere.length ? captionsHere : captions.slice(0, 6))],
            counts,
            style: Object.keys(counts).some((l) => STYLE_LEVELS.includes(Number(l) as Level)) ? opts.style.excerpts : [],
            note: chapter.draftNote, // college-content (12 Oct 2026)
          }),
          schema: draftSchemaFor(total),
          seed: seedFor(`${chapter.documentPath}#${group[0]!.ordinal}`, round),
          temperature: 0.8,
          maxTokens: 3000,
        });
        items = out.items ?? [];
      } catch (e) {
        stages.draft.rejects++;
        rejects.push({ stage: "draft", level: 1, stem: `(group ${g}, round ${round})`, reason: (e as Error).message });
        log(`    ✗ draft group ${g}: ${(e as Error).message}`);
        continue;
      }
      const ms = Date.now() - t0;
      stages.draft.in += items.length;
      let n = 0;
      for (const d of items) {
        const w = fromDraft(d, group, chapter.documentPath, `${chapter.documentPath}#${group[0]!.ordinal}#${round}#${n++}`);
        if ("error" in w) {
          stages.draft.rejects++;
          rejects.push({ stage: "draft", level: (d.difficulty as Level) || 1, stem: d.stem ?? "", reason: w.error });
          continue;
        }
        // A level the group was not asked for is counted where the model put it, if there is room.
        if (remaining[w.level] <= 0) {
          stages.draft.rejects++;
          rejects.push({ stage: "draft", level: w.level, stem: w.stem, reason: `level ${w.level} already has its ${targets[w.level]}` });
          continue;
        }
        remaining[w.level]--;
        w.ms.draft = Math.round(ms / Math.max(1, items.length));
        drafts.push(w);
        stages.draft.out++;
      }
      log(`    draft round ${round}, group ${g} (pp. ${group[0]!.pageStart}–${group[group.length - 1]!.pageEnd}): ${items.length} items in ${(ms / 1000).toFixed(1)} s`);
      progress();
    }
    return drafts;
  }

  /* ---- 2–4. critique, solver, form, verify, per item ------------------------------------------ */
  async function critique(w: Working): Promise<{ reject: string | null; weak: number[]; note: string }> {
    const v = await callJson<CritiqueVerdict>("critique", {
      system: SYSTEM_CRITIQUE,
      user: critiqueUser({ classLevel: chapter.classLevel, subject: chapter.subject, chapter: chapter.chapterLabel, level: w.level, stem: w.stem, choices: w.choices, answerIndex: w.answerIndex, solution: w.solution, reasons: w.distractorReason, figureAlt: w.imageAlt }),
      schema: CRITIQUE_SCHEMA,
      seed: seedFor(w.key, 11),
      temperature: 0.3,
      maxTokens: 400,
    });
    const o = critiqueOutcome(w, v);
    return { ...o, note: v.note };
  }

  async function solve(w: Working): Promise<number[]> {
    const runs = await Promise.all(
      Array.from({ length: SOLVER_RUNS }, (_, i) =>
        callJson<SolverAnswer>("solver", {
          system: SYSTEM_SOLVER,
          user: solverUser({ classLevel: chapter.classLevel, subject: chapter.subject, stem: w.stem, choices: w.choices, figureAlt: w.imageAlt }),
          schema: SOLVER_SCHEMA,
          seed: seedFor(w.key, 21 + i),
          temperature: 0.7,
          maxTokens: 20,
        }),
      ),
    );
    return runs.map((r) => r.answerIndex);
  }

  async function process(w: Working): Promise<boolean> {
    // 2. the critique
    let t0 = Date.now();
    stages.critique.in++;
    let c: Awaited<ReturnType<typeof critique>>;
    try {
      c = await critique(w);
    } catch (e) {
      reject(w, "critique", `call failed: ${(e as Error).message}`);
      return false;
    }
    w.ms.critique = Date.now() - t0;
    w.critique = c.note;
    w.weakReasons = new Set(c.weak);
    if (c.reject) {
      reject(w, "critique", c.reject);
      return false;
    }
    stages.critique.out++;

    // 3. the blind solver, with one redraft of a dead distractor
    t0 = Date.now();
    stages.solver.in++;
    try {
      w.solverAnswers = await solve(w);
      let verdict = solverVerdict(w.level, w.answerIndex, w.solverAnswers);
      if (verdict.reject) {
        w.ms.solver = Date.now() - t0;
        reject(w, "solver", verdict.reject);
        return false;
      }
      const dead = verdict.unpicked.filter((i) => w.weakReasons.has(i));
      if (dead.length) {
        for (const i of dead) {
          const r = await callJson<RedraftDistractor>("solver", {
            system: SYSTEM_REDRAFT,
            user: redraftUser({ stem: w.stem, choices: w.choices, answerIndex: w.answerIndex, replaceIndex: i, passage: w.passage }),
            schema: REDRAFT_SCHEMA,
            seed: seedFor(w.key, 31 + i),
            temperature: 0.8,
            maxTokens: 120,
          });
          w.choices[i] = r.option.trim();
          w.distractorReason[i] = r.reason.trim();
        }
        // The item as it now stands: critiqued again, solved again.
        const again = await critique(w);
        w.critique = again.note;
        w.weakReasons = new Set(again.weak);
        if (again.reject) {
          w.ms.solver = Date.now() - t0;
          reject(w, "solver", `after redrafting distractor${dead.length > 1 ? "s" : ""} ${dead.join(", ")}: ${again.reject}`);
          return false;
        }
        w.solverAnswers = await solve(w);
        verdict = solverVerdict(w.level, w.answerIndex, w.solverAnswers);
        if (verdict.reject) {
          w.ms.solver = Date.now() - t0;
          reject(w, "solver", `after redraft: ${verdict.reject}`);
          return false;
        }
        const stillDead = verdict.unpicked.filter((i) => w.weakReasons.has(i));
        if (stillDead.length) {
          w.ms.solver = Date.now() - t0;
          reject(w, "solver", `distractor${stillDead.length > 1 ? "s" : ""} ${stillDead.join(", ")} picked by nobody and no real misconception, after one redraft`);
          return false;
        }
      }
      w.levelFlag = verdict.levelFlag;
    } catch (e) {
      w.ms.solver = Date.now() - t0;
      reject(w, "solver", `call failed: ${(e as Error).message}`);
      return false;
    }
    w.ms.solver = Date.now() - t0;
    stages.solver.out++;

    // 4. form checks, then the bank's own. A solution written with the passage in view ("the text
    // says") is rewritten once from the science before the checks see it; a stem that does is the item.
    t0 = Date.now();
    stages.form.in++;
    if (REFERS_TO_PASSAGE.test(w.solution) && !REFERS_TO_PASSAGE.test(w.stem)) {
      try {
        const r = await callJson<RewrittenSolution>("form", {
          system: SYSTEM_REWRITE_SOLUTION,
          user: rewriteSolutionUser({ stem: w.stem, choices: w.choices, answerIndex: w.answerIndex, solution: w.solution }),
          schema: REWRITE_SOLUTION_SCHEMA,
          seed: seedFor(w.key, 95),
          temperature: 0.4,
          maxTokens: 400,
        });
        if (r.solution?.trim().length >= 20) w.solution = r.solution.trim();
      } catch (e) {
        notes.push(`solution rewrite failed for "${w.stem.slice(0, 40)}…": ${(e as Error).message}`);
      }
    }
    const form = formChecks({ stem: w.stem, choices: w.choices, answerIndex: w.answerIndex, solution: w.solution, checkExpr: w.checkExpr, distractorReason: w.distractorReason, figure: w.figure, imageAlt: w.imageAlt });
    // college-content (12 Oct 2026): a college unit's passage is a syllabus; a question about the syllabus itself is no question.
    if (chapter.source === "syllabi") {
      const about = aboutTheSyllabus(w);
      if (about) form.push(`about the syllabus, not its subject: ${about}`);
    }
    w.ms.form = Date.now() - t0;
    if (form.length) {
      reject(w, "form", form.join("; "));
      return false;
    }
    // The figure against the builder's contract and a dry draw in English; one repair with the refusal, then the item goes.
    if (w.figure) {
      let problems = figureProblems({ figure: w.figure, imageAlt: w.imageAlt });
      if (problems.length) {
        try {
          const r = await callJson<RedraftFigure>("form", {
            system: SYSTEM_REDRAFT_FIGURE,
            user: redraftFigureUser({ stem: w.stem, choices: w.choices, figure: w.figure, figureAlt: w.imageAlt, problems }),
            schema: REDRAFT_FIGURE_SCHEMA,
            seed: seedFor(w.key, 91),
            temperature: 0.5,
            maxTokens: 1200,
          });
          if (r.figure?.kind) {
            w.figure = { kind: r.figure.kind, spec: r.figure.spec ?? {}, labels: r.figure.labels ?? {} };
            w.imageAlt = r.figureAlt?.trim() || w.imageAlt;
          }
          problems = figureProblems({ figure: w.figure, imageAlt: w.imageAlt });
        } catch (e) {
          problems = [...problems, `repair call failed: ${(e as Error).message}`];
        }
        if (problems.length) {
          reject(w, "form", `figure: ${problems.join("; ")}`);
          return false;
        }
      }
    }
    stages.form.out++;
    stages.verify.in++;
    const bank = questionErrors({ difficulty: w.level, stem: w.stem, choices: w.choices, answerIndex: w.answerIndex, solution: w.solution, checkExpr: w.checkExpr, figure: w.figure, imageAlt: w.imageAlt, stamps: [] });
    if (bank.length) {
      reject(w, "verify", bank.join("; "));
      return false;
    }
    stages.verify.out++;
    return true;
  }

  async function processAll(drafts: Working[]) {
    // Three items in flight at most (the client's own slot cap bounds the calls).
    const queue = [...drafts];
    const workers = Array.from({ length: 3 }, async () => {
      for (;;) {
        if (halted()) return;
        const w = queue.shift();
        if (!w) return;
        const ok = await process(w);
        if (ok) kept.push(w);
        else remaining[w.level]++;
        progress();
      }
    });
    await Promise.all(workers);
  }

  const round1 = await draftRound(1);
  await processAll(round1);
  const short = LEVELS.filter((l) => remaining[l] > 0 && targets[l] > 0);
  if (short.length && !halted()) {
    log(`  second drafting round for the shortfall: ${short.map((l) => `L${l}:${remaining[l]}`).join(" ")}`);
    const round2 = await draftRound(2);
    await processAll(round2);
  }

  // Halted: the items in hand are done; the chapter is written by nobody (see shouldStop).
  const stoppedHere = () => ({ questions: [] as GeneratedQuestion[], log: summary([]), topicWords: null, stopped: true });
  if (halted()) return stoppedHere();

  /* ---- 5. near-duplicates ---------------------------------------------------------------------- */
  const t0 = Date.now();
  stages.dedupe.in = kept.length;
  if (kept.length) {
    const texts = kept.map((w) => `${w.stem} ${w.choices[w.answerIndex]}`);
    const bankTexts = opts.bankStems.map((b) => b.stem);
    const [batchVectors, bankVectors] = await Promise.all([client.embed(texts), client.embed(bankTexts)]);
    stages.dedupe.calls = Math.ceil(texts.length / 16) + Math.ceil(bankTexts.length / 16);
    const dups = nearDuplicates(batchVectors, opts.bankStems.map((b, i) => ({ id: b.id, vector: bankVectors[i]! })));
    const drop = new Set(dups.map((d) => d.index));
    for (const d of dups) {
      const w = kept[d.index]!;
      const against = d.against.startsWith("batch:") ? `batch item "${kept[Number(d.against.slice(6))]!.stem.slice(0, 50)}…"` : `served question ${d.against.slice(5)}`;
      reject(w, "dedupe", `near-duplicate of ${against} (cosine ${d.similarity.toFixed(3)} ≥ ${DUPLICATE_THRESHOLD})`);
    }
    for (let i = kept.length - 1; i >= 0; i--) if (drop.has(i)) kept.splice(i, 1);
  }
  stages.dedupe.ms = Date.now() - t0;
  stages.dedupe.out = kept.length;

  /* ---- 6. translations, every item that reaches the file ---------------------------------------- */
  notes.push(glossaryNote);
  log(`  translations: ${glossaryNote}`);

  /** The prompt's header echoed before the translation (up to and through "Target language: …" and a "STEM:"/"प्रश्न:" label), cut off. */
  function stripPromptEcho(text: string): string {
    let out = text;
    const header = /^[\s\S]*?(?:Target language|लक्ष्य भाषा)[^\n]*\n+/i.exec(out);
    if (header) out = out.slice(header[0].length);
    return out.replace(/^\s*(?:STEM|प्रश्न)\s*[:：]\s*/i, "").trim();
  }

  async function translate(w: Working, language: "hi" | "mr"): Promise<GeneratedTranslation & { figureLabels: Record<string, string> }> {
    const glossary = glossaryLinesFor(opts.glossary, { stem: w.stem, choices: w.choices });
    // The figure's label texts to translate: every key that is not a literal (a point's name, a number).
    const labelKeys = w.figure ? Object.keys(w.figure.labels).filter((k) => !isLiteralFigureLabel(k) && w.figure!.labels[k]?.en) : [];
    const ask = async (mend: string | null, pass: number) =>
      callJson<TranslationDraft>("translation", {
        system: systemTranslate(language),
        user: translateUser({ language, classLevel: chapter.classLevel, subject: chapter.subject, stem: w.stem, choices: w.choices, solution: w.solution, figureAlt: w.imageAlt, figureLabels: labelKeys.map((k) => w.figure!.labels[k]!.en), glossary, mend }),
        schema: TRANSLATION_SCHEMA,
        seed: seedFor(w.key, (language === "hi" ? 41 : 51) + pass),
        temperature: 0.4,
        maxTokens: 1400,
      });
    const judge = async (t: TranslationDraft, pass: number) =>
      callJson<TranslationCritique>("translation", {
        system: systemTranslationCritique(language),
        user: translationCritiqueUser({ language, original: { stem: w.stem, choices: w.choices, solution: w.solution, answerIndex: w.answerIndex }, translated: { stem: t.stem, choices: t.options, solution: t.solution } }),
        schema: TRANSLATION_CRITIQUE_SCHEMA,
        seed: seedFor(w.key, (language === "hi" ? 61 : 71) + pass),
        temperature: 0.3,
        maxTokens: 300,
      });
    const problems = (v: TranslationCritique) =>
      [!v.sameMeaning && "meaning changed", !v.oneAnswer && "not one answer at the same position", !v.distractorsStillWrong && "a distractor no longer wrong", !v.termsAreTheBoards && "terms not the board's"].filter(Boolean).join("; ");
    let draft = await ask(null, 0);
    let verdict = await judge(draft, 0);
    let flag: string | null = null;
    let p = problems(verdict);
    if (p) {
      const second = await ask(`${p}. ${verdict.note}`, 1);
      const v2 = await judge(second, 1);
      const p2 = problems(v2);
      if (!p2 || p2.length < p.length) {
        draft = second;
        verdict = v2;
        p = p2;
      }
      if (p) flag = `translation critique: ${p}`;
    }
    if (p) stages.translation.rejects++;
    const figureLabels: Record<string, string> = {};
    labelKeys.forEach((k, i) => {
      const text = (draft.figureLabels ?? [])[i]?.trim();
      // A label the translation left out keeps its English text, so the figure still draws; the native speaker sees it.
      figureLabels[k] = text || w.figure!.labels[k]!.en;
      if (!text) flag = flag ? `${flag}; figure label "${k}" untranslated` : `figure label "${k}" untranslated`;
    });
    // college-content (12 Oct 2026): a model that echoed the prompt's header ("… Target language: Marathi.\n\nप्रश्न: …", seen live on a
    // college unit) has the echo cut off, so only the translated text is kept.
    const fix = (t: string) => devanagariPunctuation(stripListMarker(stripPromptEcho(t)), language);
    return { stem: fix(draft.stem), choices: draft.options.map(fix), solution: fix(draft.solution), imageAlt: w.imageAlt ? fix(draft.figureAlt ?? "") || w.imageAlt : null, critique: verdict.note, flag, figureLabels };
  }

  const translations = new Map<string, Partial<Record<"hi" | "mr", GeneratedTranslation>>>();
  {
    const queue = [...kept];
    stages.translation.in = kept.length * 2;
    const workers = Array.from({ length: 3 }, async () => {
      for (;;) {
        if (halted()) return;
        const w = queue.shift();
        if (!w) return;
        const t0 = Date.now();
        const out: Partial<Record<"hi" | "mr", GeneratedTranslation>> = {};
        for (const language of ["hi", "mr"] as const) {
          try {
            const { figureLabels, ...tr } = await translate(w, language);
            out[language] = tr;
            if (w.figure) for (const [k, text] of Object.entries(figureLabels)) w.figure.labels[k] = { ...w.figure.labels[k]!, [language]: text };
            stages.translation.out++;
          } catch (e) {
            // The item stays; the language is missing and the log says so (every item is to be translated: a rerun fills it).
            rejects.push({ stage: "translation", level: w.level, stem: w.stem, reason: `${language}: ${(e as Error).message}` });
            stages.translation.rejects++;
          }
        }
        if (w.figure) {
          // A dry draw in each translated language: a label the model gave no text for falls back to the English above,
          // so what remains here is a refusal worth the reviewer's eye, kept on the translation, never a drop.
          for (const problem of figureProblems({ figure: w.figure, imageAlt: w.imageAlt, translations: out })) {
            const lang = /in (hi|mr)\b|its (hi|mr) translation/.exec(problem);
            const code = (lang?.[1] ?? lang?.[2]) as "hi" | "mr" | undefined;
            if (code && out[code]) out[code]!.flag = out[code]!.flag ? `${out[code]!.flag}; ${problem}` : problem;
            else notes.push(`figure of "${w.stem.slice(0, 40)}…": ${problem}`);
          }
        }
        w.ms.translation = Date.now() - t0;
        translations.set(w.key, out);
        log(`    translated L${w.level} "${w.stem.slice(0, 50)}…" in ${((Date.now() - t0) / 1000).toFixed(1)} s${out.hi?.flag || out.mr?.flag ? " (flagged)" : ""}`);
        progress();
      }
    });
    await Promise.all(workers);
  }
  if (halted()) return stoppedHere();

  /* ---- the topic's words ------------------------------------------------------------------------ */
  let topicWords: TopicWords | null = null;
  try {
    topicWords = await callJson<TopicWords>("translation", {
      system: SYSTEM_TOPIC_WORDS,
      user: topicWordsUser({ board: chapter.board, classLevel: chapter.classLevel, subject: chapter.subject, chapter: chapter.chapterLabel, headings: chapter.headings.slice(0, 24) }),
      schema: TOPIC_WORDS_SCHEMA,
      seed: seedFor(chapter.documentPath, 81),
      temperature: 0.4,
      maxTokens: 500,
    });
    topicWords = { ...topicWords, nameHi: devanagariPunctuation(topicWords.nameHi, "hi"), summaryHi: devanagariPunctuation(topicWords.summaryHi, "hi"), nameMr: devanagariPunctuation(topicWords.nameMr, "mr"), summaryMr: devanagariPunctuation(topicWords.summaryMr, "mr") };
  } catch (e) {
    notes.push(`topic words not written: ${(e as Error).message}`);
  }

  /* ---- the file's items -------------------------------------------------------------------------- */
  const questions: GeneratedQuestion[] = kept
    .sort((a, b) => a.level - b.level || a.key.localeCompare(b.key))
    .map((w) => {
      timings.push({ level: w.level, stem: w.stem, ms: w.ms, outcome: "kept", flag: w.levelFlag });
      return {
        difficulty: w.level,
        stem: w.stem,
        choices: w.choices,
        answerIndex: w.answerIndex,
        solution: w.solution,
        checkExpr: w.checkExpr,
        reviewedAt: null,
        reviewedBy: null,
        translations: translations.get(w.key) ?? {},
        imageKey: null,
        imageAlt: w.imageAlt,
        figure: w.figure,
        needsFigure: w.figure !== null,
        distractorReason: w.distractorReason,
        solverAnswers: w.solverAnswers,
        levelFlag: w.levelFlag,
        critique: w.critique,
        sources: w.sources,
        edition: chapter.edition,
        generatedAt,
        model: client.model,
        stamps: [],
      };
    });

  return { questions, log: summary(questions), topicWords, stopped: false };
}
