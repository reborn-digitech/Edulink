/**
 * The numeric side of the refurbished bank — for maths chapters, where a
 * computed question is the honest form and the machine CAN prove the answer.
 *
 * Every question built here carries a `checkExpr` the verifier evaluates, and
 * its wrong options are NEAR MISSES — off-by-one, off-by-ten, digit swaps,
 * the result of the classic wrong move — because "47, 12, 3000 and the
 * answer" teaches option-elimination, not arithmetic. Authors pass the wrong
 * numbers explicitly, so every distractor is a mistake a real child makes.
 *
 * Stems are trilingual like everything else; digits stay digits in all three.
 */
import type { L, OutQuestion, TopicFileOut } from "./engine";
import { rng, shuffled } from "./engine";

export type NumQ = {
  level: number;
  stem: L;
  /** The right number, provable: checkExpr must evaluate to exactly this. */
  answer: number;
  /** Three near-miss wrong numbers, all distinct from answer and each other. */
  wrong: [number, number, number];
  /** Arithmetic the verifier can evaluate, e.g. "354+238". Omit only where
   *  the answer is a choice, not a computation (e.g. "which is greatest"). */
  checkExpr?: string;
  solution: L;
  /** Optional unit rendering, e.g. n → "₹n" or "n metres" per language. */
  fmt?: (n: number) => L;
};

const plain = (n: number): L => ({ en: String(n), hi: String(n), mr: String(n) });

export function numQ(q: NumQ, rand: () => number): OutQuestion {
  const values = [q.answer, ...q.wrong];
  if (new Set(values).size !== 4) {
    throw new Error(`numeric: options collide for "${q.stem.en}" — ${values.join(", ")}`);
  }
  const render = q.fmt ?? plain;
  const options = values.map((v) => ({ value: v, text: render(v) }));
  const order = shuffled(options, rand);
  const answerIndex = order.findIndex((o) => o.value === q.answer);
  return {
    difficulty: q.level,
    stem: q.stem.en,
    choices: order.map((o) => o.text.en),
    answerIndex,
    solution: q.solution.en,
    checkExpr: q.checkExpr ?? null,
    translations: {
      hi: { stem: q.stem.hi, choices: order.map((o) => o.text.hi), solution: q.solution.hi },
      mr: { stem: q.stem.mr, choices: order.map((o) => o.text.mr), solution: q.solution.mr },
    },
  };
}

/** ₹-amount rendering, shared by money chapters. */
export const rupees = (n: number): L => ({ en: `₹${n}`, hi: `₹${n}`, mr: `₹${n}` });

/** Unit rendering for the sciences — the number is the same in all three. */
export const unit = (suffix: string) => (n: number): L => ({
  en: `${n} ${suffix}`,
  hi: `${n} ${suffix}`,
  mr: `${n} ${suffix}`,
});

/**
 * Bolts computed problems onto a chapter the conceptual engine has already
 * built — the shape Classes 11 and 12 need and the earlier grades did not.
 *
 * Up to Class 10 a chapter was one thing or the other: maths computed, science
 * conceptual. Class 11 physics is both at once, and splitting one NCERT chapter
 * into a "concepts" topic and a "problems" topic would be an artefact of this
 * code rather than of the subject — a student revising projectiles wants the
 * definition of the independence of the components AND the range of a 20 m/s
 * throw, from the same card. So the numeric questions join the ladder the
 * engine generated, in the same topic file, and the verifier proves every one
 * of them arithmetically while the conceptual half stays honestly unproven.
 *
 * The seed is suffixed so option order in the numeric half cannot shift if a
 * conceptual fact is added above it — diffs stay about the row that changed.
 */
export function withNumeric(topic: TopicFileOut, questions: NumQ[]): TopicFileOut {
  if (questions.length === 0) return topic;
  const rand = rng(`${topic.slug}-numeric`);
  return { ...topic, questions: [...topic.questions, ...questions.map((q) => numQ(q, rand))] };
}
