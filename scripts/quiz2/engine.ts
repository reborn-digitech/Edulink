/**
 * The conceptual question engine — the 2026 bank refurbishment's answer to
 * "history practice must not be adding years to dates".
 *
 * WHAT IT DOES. A chapter is authored as FACTS — entities with a recall
 * prompt, true entity-specific sentences, an optional association pair and an
 * optional place in the chapter's ordering — plus a handful of fully-authored
 * hard questions. The engine turns those into a six-level ladder:
 *
 *   L1 RECALL      the fact's own prompt → its name
 *   L2 UNDERSTAND  "which statement about X is correct?" — truths as options
 *   L3 APPLY       a description → which entity it describes
 *   L4 ANALYSE     "which pairing is correct?" — associations, mismatched
 *   L5 COMPETITIVE "which came earliest?" — the chapter's own ordering
 *   L6 OLYMPIAD    "all of these are true of X EXCEPT —" + authored items
 *
 * WHY THIS IS STILL HONEST. Every generated answer is DERIVED from a fact row
 * — the correct option is the row's own name, sentence or pair, and every
 * distractor is a SIBLING row's, so a generated question can never contradict
 * its own table. What the machine cannot prove is the table itself: whether
 * Ashoka's statement is true is a fact about the world, not about this code.
 * That is the same boundary verify-quiz.ts documents, and the reason
 * `reviewedAt` exists. Nothing here carries a checkExpr; the unproven count
 * says so out loud.
 *
 * DISTRACTOR DISCIPLINE, the one rule authoring must keep: a fact's
 * `statement`/`detail`/`extra` must be specific enough to be FALSE of every
 * other entity in the chapter — "he was a great ruler" would be true of six
 * options at once and mark a child wrong for reading carefully.
 */

export type L = { en: string; hi: string; mr: string };

export type Fact = {
  /** Unique within the chapter; used for deterministic variety only. */
  id: string;
  /** The entity, as it appears as an answer option. */
  name: L;
  /** Distractor pool — names of the SAME kind supply wrong options. */
  kind: string;
  /** L1 recall question whose answer is `name`. */
  prompt: L;
  /** A true sentence specific to this entity alone. */
  statement: L;
  /** A second independent truth (unlocks richer L2/L6). */
  detail?: L;
  /** A third truth (unlocks the generated EXCEPT form at L6). */
  extra?: L;
  /** "{left} — {right}" association for L4 matching. */
  pair?: { left: L; right: L };
  /** Position in the chapter's ordering, where ordering is meaningful. */
  seq?: number;
};

export type HardQuestion = {
  level: 5 | 6;
  stem: L;
  choices: L[];
  answerIndex: number;
  solution: L;
};

export type Chapter = {
  slug: string;
  subject: string;
  classLevel: number;
  /** "Chapter 7 — Ashoka, the Emperor Who Gave Up War", as the syllabus writes it. */
  chapter: L;
  /** Card title. */
  name: L;
  summary: L;
  position: number;
  source: string;
  licence: string;
  /** Short chapter tag woven into generic stems so no two chapters collide. */
  tag: L;
  /** What the ordering means, e.g. "in this chapter's story" — L5 phrasing. */
  facts: Fact[];
  hard: HardQuestion[];
};

type OutQuestion = {
  difficulty: number;
  stem: string;
  choices: string[];
  answerIndex: number;
  solution: string;
  checkExpr: null;
  translations: {
    hi: { stem: string; choices: string[]; solution: string };
    mr: { stem: string; choices: string[]; solution: string };
  };
};

export type TopicFileOut = {
  subject: string;
  classLevel: number;
  chapter: string;
  name: string;
  slug: string;
  summary: string;
  position: number;
  source: string;
  licence: string;
  translations: Record<string, { name: string; summary: string }>;
  questions: OutQuestion[];
};

const MIN_QUESTIONS = 50;
const LANGS = ["en", "hi", "mr"] as const;

/**
 * Deterministic tiny PRNG (mulberry32 over a string seed) — the same chapter
 * always generates the same bank, so re-imports are no-ops and diffs are real.
 */
function rng(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: T[], rand: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Pick n distractor facts: same kind first, then anything else. */
function distractors(all: Fact[], self: Fact, n: number, rand: () => number): Fact[] {
  const sameKind = all.filter((f) => f.id !== self.id && f.kind === self.kind);
  const rest = all.filter((f) => f.id !== self.id && f.kind !== self.kind);
  const pool = [...shuffled(sameKind, rand), ...shuffled(rest, rand)];
  return pool.slice(0, n);
}

/** Compose one output question from L10n parts, options shuffled once for all languages. */
function compose(
  level: number,
  stem: L,
  options: { text: L; correct: boolean }[],
  solution: L,
  rand: () => number,
): OutQuestion {
  const order = shuffled(options, rand);
  const answerIndex = order.findIndex((o) => o.correct);
  return {
    difficulty: level,
    stem: stem.en,
    choices: order.map((o) => o.text.en),
    answerIndex,
    solution: solution.en,
    checkExpr: null,
    translations: {
      hi: { stem: stem.hi, choices: order.map((o) => o.text.hi), solution: solution.hi },
      mr: { stem: stem.mr, choices: order.map((o) => o.text.mr), solution: solution.mr },
    },
  };
}

const because = (fact: Fact): L => ({
  en: `${fact.statement.en} That is the fact this question turns on.`,
  hi: `${fact.statement.hi} यही तथ्य इस प्रश्न की कुंजी है।`,
  mr: `${fact.statement.mr} हेच तथ्य या प्रश्नाची गुरुकिल्ली आहे.`,
});

export function generateChapter(chapter: Chapter): TopicFileOut {
  const rand = rng(chapter.slug);
  const { facts } = chapter;
  const questions: OutQuestion[] = [];

  /* L1 — every fact's own recall prompt. */
  for (const fact of facts) {
    const wrong = distractors(facts, fact, 3, rand);
    questions.push(
      compose(
        1,
        fact.prompt,
        [
          { text: fact.name, correct: true },
          ...wrong.map((w) => ({ text: w.name, correct: false })),
        ],
        because(fact),
        rand,
      ),
    );
  }

  /* L2 — which statement about X is correct? Truth from the row, lies from siblings. */
  for (const fact of facts) {
    const wrong = distractors(facts, fact, 3, rand);
    const stem: L = {
      en: `Which of these statements about ${fact.name.en} is correct?`,
      hi: `${fact.name.hi} के बारे में इनमें से कौन-सा कथन सही है?`,
      mr: `${fact.name.mr} विषयी यांपैकी कोणते विधान बरोबर आहे?`,
    };
    questions.push(
      compose(
        2,
        stem,
        [
          { text: fact.statement, correct: true },
          ...wrong.map((w) => ({ text: w.statement, correct: false })),
        ],
        because(fact),
        rand,
      ),
    );
  }

  /* L3 — description → name. Uses `detail` when present so the sentence a child
     saw as an L2 option is not simply re-asked. */
  for (const fact of facts) {
    const description = fact.detail ?? fact.statement;
    const wrong = distractors(facts, fact, 3, rand);
    const stem: L = {
      en: `"${description.en}" — which of these is this about?`,
      hi: `"${description.hi}" — यह इनमें से किसके बारे में है?`,
      mr: `"${description.mr}" — हे यांपैकी कोणाविषयी आहे?`,
    };
    questions.push(
      compose(
        3,
        stem,
        [
          { text: fact.name, correct: true },
          ...wrong.map((w) => ({ text: w.name, correct: false })),
        ],
        because(fact),
        rand,
      ),
    );
  }

  /* L4 — the association test: the stem names the entity, the options offer
     four right-hand sides from the chapter's own pairs, one of which belongs.
     Naming the entity in the stem keeps every stem unique, and drawing the
     wrong rights from sibling pairs keeps them recognisable rather than
     absurd — the child must know WHICH association is this entity's. */
  const paired = facts.filter((f) => f.pair);
  for (const fact of paired) {
    const others = shuffled(paired.filter((f) => f.id !== fact.id), rand).slice(0, 3);
    if (others.length < 3) break;
    const stem: L = {
      en: `In ${chapter.tag.en}, "${fact.pair!.left.en}" goes correctly with which of these?`,
      hi: `${chapter.tag.hi} में, "${fact.pair!.left.hi}" का सही मेल इनमें से किससे है?`,
      mr: `${chapter.tag.mr} मध्ये, "${fact.pair!.left.mr}" ची योग्य जोडी यांपैकी कोणाशी आहे?`,
    };
    questions.push(
      compose(
        4,
        stem,
        [
          { text: fact.pair!.right, correct: true },
          ...others.map((o) => ({ text: o.pair!.right, correct: false })),
        ],
        because(fact),
        rand,
      ),
    );
  }

  /* L5 — the chapter's own ordering: which came earliest? Several distinct
     4-subsets, each asked once. */
  const ordered = facts.filter((f) => f.seq !== undefined).sort((a, b) => a.seq! - b.seq!);
  if (ordered.length >= 4) {
    const rounds = Math.min(ordered.length - 3, 8);
    for (let r = 0; r < rounds; r++) {
      const window = ordered.slice(r, r + 4);
      const earliest = window[0]!;
      const stem: L = {
        en: `In ${chapter.tag.en}, which of these came earliest: ${window
          .map((w) => w.name.en)
          .join(", ")}?`,
        hi: `${chapter.tag.hi} में, इनमें से सबसे पहले कौन आया: ${window
          .map((w) => w.name.hi)
          .join(", ")}?`,
        mr: `${chapter.tag.mr} मध्ये, यांपैकी सर्वांत आधी कोणते आले: ${window
          .map((w) => w.name.mr)
          .join(", ")}?`,
      };
      questions.push(
        compose(
          5,
          stem,
          window.map((w) => ({ text: w.name, correct: w === earliest })),
          because(earliest),
          rand,
        ),
      );
    }
  }

  /* L6 — generated EXCEPT for fully-attributed facts… */
  for (const fact of facts.filter((f) => f.detail && f.extra)) {
    const foreign = distractors(facts, fact, 1, rand)[0];
    if (!foreign) continue;
    const stem: L = {
      en: `All of the following are true of ${fact.name.en} EXCEPT —`,
      hi: `${fact.name.hi} के बारे में निम्नलिखित सभी सही हैं, सिवाय —`,
      mr: `${fact.name.mr} विषयी पुढील सर्व बरोबर आहे, अपवाद —`,
    };
    const solution: L = {
      en: `${foreign.statement.en} That belongs to ${foreign.name.en}, not ${fact.name.en} — the other three are all true here.`,
      hi: `${foreign.statement.hi} यह ${foreign.name.hi} की बात है, ${fact.name.hi} की नहीं — बाक़ी तीनों यहाँ सही हैं।`,
      mr: `${foreign.statement.mr} हे ${foreign.name.mr} चे आहे, ${fact.name.mr} चे नाही — बाकी तिन्ही इथे बरोबर आहेत.`,
    };
    questions.push(
      compose(
        6,
        stem,
        [
          { text: fact.statement, correct: false },
          { text: fact.detail!, correct: false },
          { text: fact.extra!, correct: false },
          { text: foreign.statement, correct: true },
        ],
        solution,
        rand,
      ),
    );
  }

  /* …and the authored hard questions, exactly as written. */
  for (const hq of chapter.hard) {
    questions.push({
      difficulty: hq.level,
      stem: hq.stem.en,
      choices: hq.choices.map((c) => c.en),
      answerIndex: hq.answerIndex,
      solution: hq.solution.en,
      checkExpr: null,
      translations: {
        hi: {
          stem: hq.stem.hi,
          choices: hq.choices.map((c) => c.hi),
          solution: hq.solution.hi,
        },
        mr: {
          stem: hq.stem.mr,
          choices: hq.choices.map((c) => c.mr),
          solution: hq.solution.mr,
        },
      },
    });
  }

  /* The floor, enforced at the door of generation so an authoring gap names its
     chapter here rather than failing verify later. */
  const byLevel = new Map<number, number>();
  for (const q of questions) byLevel.set(q.difficulty, (byLevel.get(q.difficulty) ?? 0) + 1);
  for (let l = 1; l <= 6; l++) {
    if (!byLevel.get(l)) {
      throw new Error(`${chapter.slug}: generated nothing at level ${l} — add facts or hard questions`);
    }
  }
  if (questions.length < MIN_QUESTIONS) {
    throw new Error(
      `${chapter.slug}: generated ${questions.length} questions — the floor is ${MIN_QUESTIONS}. Add facts (each adds 3+ questions) or hard questions.`,
    );
  }

  for (const lang of LANGS) void lang; // (languages are woven in above; nothing to do per-language here)

  return {
    subject: chapter.subject,
    classLevel: chapter.classLevel,
    chapter: chapter.chapter.en,
    name: chapter.name.en,
    slug: chapter.slug,
    summary: chapter.summary.en,
    position: chapter.position,
    source: chapter.source,
    licence: chapter.licence,
    translations: {
      hi: { name: chapter.name.hi, summary: chapter.summary.hi },
      mr: { name: chapter.name.mr, summary: chapter.summary.mr },
    },
    questions,
  };
}
