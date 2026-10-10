/**
 * THE ASSESSMENT RULE, ONE TABLE beside the role policy (docs/plans/assistant.md §5 Phase B, §8.3, §9.1–
 * 9.5, §9.12). It applies to a pupil's topic questions only (ROLE_POLICY.assessed): a teacher is never
 * limited by sittings or subjects. Matching is by embedding cosine against the pupil's OWN items
 * (assessment.ts reads them), one CPU embedding, no model call; a question matching nothing of the
 * pupil's own is answered in full. Pure: tests/assistant-assessment.test.ts holds the four cases.
 */
import { ASSESSMENT_MATCH_THRESHOLD } from "./config";

export type AssessmentKind = "CONTEST" | "TIMED_PRACTICE" | "SCHOOL_EXAM" | "COLLEGE_EXAM_SESSION" | "HAND_IN";

export const ASSESSMENT_RULES: { kind: AssessmentKind; effect: "CLOSED" | "HINT_FIRST"; open: string }[] = [
  { kind: "CONTEST", effect: "CLOSED", open: "a published competition the pupil entered, from its start to its end" },
  { kind: "TIMED_PRACTICE", effect: "CLOSED", open: "the pupil's unfinished practice attempt, for PRACTICE_SITTING_MINUTES after it began" },
  { kind: "SCHOOL_EXAM", effect: "CLOSED", open: "a paper of a published exam series for the pupil's class, on its day (within its hours when it has them)" },
  { kind: "COLLEGE_EXAM_SESSION", effect: "CLOSED", open: "the exam cell's session for the student's registered courses, from its first paper's start to its last paper's end" },
  { kind: "HAND_IN", effect: "HINT_FIRST", open: "a published assignment of the pupil's class or registered offering, not an exam sitting, due ahead or within HAND_IN_GRACE_DAYS past" },
];

export type AssessmentItem = {
  kind: AssessmentKind;
  id: string;
  /** What the question is compared with: the title, subject and body as the pupil's own door shows them. */
  text: string;
  assignmentId?: string;
  /** HAND_IN only: the teacher's switch (Assignment.assistantAnswers). */
  workedAllowed?: boolean;
};

export type AssessmentDecision =
  /** Nothing of the pupil's matched: answer in full. */
  | { kind: "FREE" }
  /** A contest, a sitting or an exam session is open on this topic: the fixed sentence, no model call. */
  | { kind: "CLOSED"; item: AssessmentItem; similarity: number }
  /** A hand-in assignment matched: a hint (first ask, or the teacher keeps it to hints). */
  | { kind: "HINT"; item: AssessmentItem; similarity: number; secondAsk: boolean }
  /** The same question asked again right after its hint, in the same conversation, and the teacher allows it: the worked answer. */
  | { kind: "WORKED"; item: AssessmentItem; similarity: number };

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

const EFFECT = new Map(ASSESSMENT_RULES.map((r) => [r.kind, r.effect]));

/**
 * The rule itself. `matches` are the pupil's items with their similarity to the question; `previous`
 * is the conversation's last two turns (§9.4): whether the previous question was this same question,
 * and which assignment the previous answer was a hint for.
 */
export function decideAssessment(input: {
  matches: { item: AssessmentItem; similarity: number }[];
  previous: { sameQuestion: boolean; hintForAssignmentId: string | null } | null;
  threshold?: number;
}): AssessmentDecision {
  const threshold = input.threshold ?? ASSESSMENT_MATCH_THRESHOLD;
  const hits = input.matches.filter((m) => m.similarity >= threshold).sort((a, b) => b.similarity - a.similarity);
  // A closed sitting wins over a hint: nothing on the topic while it is open.
  const closed = hits.find((m) => EFFECT.get(m.item.kind) === "CLOSED");
  if (closed) return { kind: "CLOSED", item: closed.item, similarity: closed.similarity };
  const handIn = hits.find((m) => EFFECT.get(m.item.kind) === "HINT_FIRST");
  if (!handIn) return { kind: "FREE" };
  const secondAsk = !!input.previous && input.previous.sameQuestion && input.previous.hintForAssignmentId === handIn.item.assignmentId;
  if (secondAsk && handIn.item.workedAllowed !== false) return { kind: "WORKED", item: handIn.item, similarity: handIn.similarity };
  return { kind: "HINT", item: handIn.item, similarity: handIn.similarity, secondAsk };
}
