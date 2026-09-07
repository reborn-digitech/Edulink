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
  /**
   * Extra plausible wrong names for thin kinds — a chapter with only two
   * people still needs four convincing options, and "a rock, a river and the
   * right answer" is not a question. Decoys never become correct answers.
   */
  decoys?: L[];
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
  facts: Fact[];
  hard: HardQuestion[];
};

export type OutQuestion = {
  difficulty: number;
  stem: string;
  choices: string[];
  answerIndex: number;
  solution: string;
  checkExpr: string | null;
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

const LANGS = ["en", "hi", "mr"] as const;

/**
 * Deterministic tiny PRNG (mulberry32 over a string seed) — the same chapter
 * always generates the same bank, so re-imports are no-ops and diffs are real.
 */
export function rng(seed: string): () => number {
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

export function shuffled<T>(items: T[], rand: () => number): T[] {
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

/**
 * Wrong NAMES for a name-answer question: same-kind siblings first, then the
 * fact's own decoys, then anything left — so the options a child weighs are
 * the ones genuinely confusable with the answer.
 */
function wrongNames(all: Fact[], self: Fact, n: number, rand: () => number): L[] {
  const sameKind = all.filter((f) => f.id !== self.id && f.kind === self.kind).map((f) => f.name);
  const decoys = self.decoys ?? [];
  const rest = all.filter((f) => f.id !== self.id && f.kind !== self.kind).map((f) => f.name);
  const pool = [...shuffled(sameKind, rand), ...shuffled(decoys, rand), ...shuffled(rest, rand)];
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

  /* L1/L2/L3 — EACH FACT IS ASKED EXACTLY ONE WAY. Generating all three forms
     from every fact made a chapter re-ask itself in different clothes; the
     rotation below sends each fact to one of recall (its own prompt),
     understanding (spot the true statement) or application (description to
     name), so no piece of knowledge appears twice at the lower rungs. */
  facts.forEach((fact, index) => {
    const form = index % 3;
    if (form === 0) {
      questions.push(
        compose(
          1,
          fact.prompt,
          [
            { text: fact.name, correct: true },
            ...wrongNames(facts, fact, 3, rand).map((w) => ({ text: w, correct: false })),
          ],
          because(fact),
          rand,
        ),
      );
    } else if (form === 1) {
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
    } else {
      const description = fact.detail ?? fact.statement;
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
            ...wrongNames(facts, fact, 3, rand).map((w) => ({ text: w, correct: false })),
          ],
          because(fact),
          rand,
        ),
      );
    }
  });

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
      en: `"${fact.pair!.left.en}" goes correctly with which of these?`,
      hi: `"${fact.pair!.left.hi}" का सही मेल इनमें से किससे है?`,
      mr: `"${fact.pair!.left.mr}" ची योग्य जोडी यांपैकी कोणाशी आहे?`,
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

  /* L5 — the chapter's own ordering, asked at most twice and never as the
     same question: once "which came earliest" over the opening four, once
     "which came last" over the closing four. Sliding a window one step at a
     time produced near-identical siblings; two ends of the story do not. */
  const ordered = facts.filter((f) => f.seq !== undefined).sort((a, b) => a.seq! - b.seq!);
  if (ordered.length >= 4) {
    const first = ordered.slice(0, 4);
    questions.push(
      compose(
        5,
        {
          en: `Which of these came earliest: ${first.map((w) => w.name.en).join(", ")}?`,
          hi: `इनमें से सबसे पहले कौन आया: ${first.map((w) => w.name.hi).join(", ")}?`,
          mr: `यांपैकी सर्वांत आधी कोणते आले: ${first.map((w) => w.name.mr).join(", ")}?`,
        },
        first.map((w) => ({ text: w.name, correct: w === first[0] })),
        because(first[0]!),
        rand,
      ),
    );
    const last = ordered.slice(-4);
    const latest = last[last.length - 1]!;
    questions.push(
      compose(
        5,
        {
          en: `Which of these came last: ${last.map((w) => w.name.en).join(", ")}?`,
          hi: `इनमें से सबसे बाद में कौन आया: ${last.map((w) => w.name.hi).join(", ")}?`,
          mr: `यांपैकी सर्वांत शेवटी कोणते आले: ${last.map((w) => w.name.mr).join(", ")}?`,
        },
        last.map((w) => ({ text: w.name, correct: w === latest })),
        because(latest),
        rand,
      ),
    );
  }

  /* L6 — generated EXCEPT for fully-attributed facts, at most four per
     chapter so the form stays a surprise rather than a routine… */
  for (const fact of facts.filter((f) => f.detail && f.extra).slice(0, 4)) {
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

  /* The bar is COVERAGE, not a count: every level present, enforced at the
     door of generation so an authoring gap names its chapter here rather than
     failing verify later. How many questions a chapter carries follows from
     how much the chapter actually holds. */
  const byLevel = new Map<number, number>();
  for (const q of questions) byLevel.set(q.difficulty, (byLevel.get(q.difficulty) ?? 0) + 1);
  for (let l = 1; l <= 6; l++) {
    if (!byLevel.get(l)) {
      throw new Error(`${chapter.slug}: generated nothing at level ${l} — add facts or hard questions`);
    }
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
