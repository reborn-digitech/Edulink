/**
 * THE TWO GATES (the owner's rules 1–3), code and not a prompt.
 *
 * BEFORE THE MODEL, on the question (`gateQuestion`): the injection and refusal tables (no model), then
 * the retrieval thresholds (below both: the fixed sentence, and nothing is sent to the answering model),
 * then the constrained classification call — one word of PLATFORM, CURRICULUM or REFUSE, forced by a
 * grammar, with its probability; any other output, a parse failure, a timeout or a low probability is
 * REFUSE — and the label must agree with the retrieval (PLATFORM needs a help passage above its
 * threshold, CURRICULUM a curriculum one).
 *
 * AFTER THE MODEL, on the answer (`gateAnswer`): the same tables, the same classifier (the answer's
 * label must be the question's), no link, e-mail, phone number, address or another person's name, no
 * placeholder but [YOU], every [n] citing a passage that was retrieved, and a hint short enough to be a
 * hint. Any failure discards the answer for the fixed sentence.
 *
 * The model is a port (`ClassifyPort`) so the tests can hand in a fake that records every call.
 */
import type { AssistantLanguage, AssistantVerdict } from "@edulink/contracts";
import { CLASSIFIER_MIN_CONFIDENCE, CLASSIFY_TIMEOUT_MS, CURRICULUM_THRESHOLD, HELP_THRESHOLD, HINT_MAX_WORDS } from "./config";
import { CLASSIFIER_GRAMMAR, CLASSIFIER_LABELS, classifierMessages, type ClassifierLabel } from "./prompt";
import { detectInjection, detectRefusal } from "./refusals";
import { answerProblems, type AnswerProblem, type NameEntry } from "./strip";
import type { ChatMessage, ChatOptions, ChatResult } from "../assistant-model";
import type { RolePolicy } from "./policy";

export type ClassifyPort = { chat: (messages: ChatMessage[], opts: ChatOptions) => Promise<ChatResult> };

/** `unavailable` (TA-025): the call itself threw (unreachable, timed out), so the model gave no word at all. */
export type Classification = { label: ClassifierLabel; confidence: number | null; tokens: number; failed: boolean; unavailable?: boolean };

/** The constrained call. Never throws: a failure is REFUSE with `failed`. */
export async function classify(model: ClassifyPort, kind: "question" | "answer", text: string): Promise<Classification> {
  try {
    const res = await model.chat(classifierMessages(kind, text), { maxTokens: 4, temperature: 0, grammar: CLASSIFIER_GRAMMAR, logprobs: true, timeoutMs: CLASSIFY_TIMEOUT_MS });
    const tokens = (res.usage?.promptTokens ?? 0) + (res.usage?.completionTokens ?? 0);
    const word = res.content.trim();
    if (!(CLASSIFIER_LABELS as readonly string[]).includes(word)) return { label: "REFUSE", confidence: null, tokens, failed: true };
    const confidence = res.firstTokenLogprob === null ? null : Math.exp(res.firstTokenLogprob);
    if (confidence !== null && confidence < CLASSIFIER_MIN_CONFIDENCE) return { label: "REFUSE", confidence, tokens, failed: false };
    return { label: word as ClassifierLabel, confidence, tokens, failed: false };
  } catch {
    return { label: "REFUSE", confidence: null, tokens: 0, failed: true, unavailable: true };
  }
}

export type QuestionGate =
  /**
   * `label`: the classifier's word when it was asked (pass 3, the unanswered report: a PLATFORM or CURRICULUM question
   * refused with no page or passage close enough found nothing; a REFUSE was the classifier's).
   */
  | { pass: false; verdict: AssistantVerdict; modelCalled: boolean; tokens: number; label?: ClassifierLabel; unavailable?: boolean }
  | { pass: true; mode: "HELP" | "TUTOR"; label: "PLATFORM" | "CURRICULUM"; confidence: number | null; tokens: number };

/** The table checks alone: the counsellor routes (SELF_HARM, ABUSE_DISCLOSURE) first, then injection, then the other categories. No retrieval, no model. */
export function tableVerdict(original: string, role: string | null = null): AssistantVerdict | null {
  const first = detectRefusal(original, role);
  if (first === "SELF_HARM" || first === "ABUSE_DISCLOSURE") return first;
  if (detectInjection(original)) return "INJECTION";
  return first;
}

/** Which scopes the retrieval allows, by the thresholds of the question's language. */
export function scopesFromRetrieval(input: { language: AssistantLanguage; helpTop: number; curriculumTop: number }): { help: boolean; curriculum: boolean } {
  return { help: input.helpTop >= HELP_THRESHOLD[input.language], curriculum: input.curriculumTop >= CURRICULUM_THRESHOLD[input.language] };
}

/**
 * Everything before the answer. `stripped` is what the classifier may read; `original` is what the
 * tables read (a name does not hide a category). `helpTop` and `curriculumTop` are the best cosine
 * similarities the person's own scopes returned (curriculum: within the board and band, widened once;
 * for a role without the tutor, the whole corpus, only to tell a topic question from a platform one).
 */
export async function gateQuestion(
  input: {
    original: string;
    stripped: string;
    language: AssistantLanguage;
    policy: RolePolicy;
    helpTop: number;
    /**
     * The best curriculum passage's similarity, or the search that finds it (Vidura pass 3, 18 Oct 2026): the gate asks
     * for it only when its answer can change the verdict — the help scope closed, the classifier saying CURRICULUM, or
     * the person's pick of Learning. A help question the classifier calls PLATFORM never waits for the corpus's exact
     * scan (two to three seconds of the time to the first word on 18 October), and the verdicts are the same as before.
     */
    curriculumTop: number | (() => Promise<number>);
    /**
     * The question asks for one of this role's own doors by its intent (tools.ts `toolsFor`): a guardian's
     * fees, a pupil's timetable. The door's data is then the answer whatever the help index holds, so it
     * marks the platform scope beside the retrieval threshold (Phase D's pilot, 10 Oct 2026: "माझ्या
     * मुलाची किती फी बाकी आहे" found no Marathi help passage and fell out of scope with the fees door
     * waiting). The classifier still has to call it PLATFORM, and the tables still come first.
     */
    ownDoor?: boolean;
    /** The asker's role: the money row reads "loan" by it (refusals.ts STAFF_ROLES_FOR_LOANS). */
    role?: string | null;
    /**
     * THE PERSON'S PICK OF MODE (Vidura pass 1, 17 Oct 2026): "Using Shalaghar" or "My records" prefer PLATFORM,
     * "Learning" prefers CURRICULUM. It re-routes only between the scopes this gate already allows: the tables come
     * first, a question below both thresholds is still out of scope, the classifier's REFUSE still refuses, and the
     * tutor is still only for its roles. Never a way past a refusal.
     */
    prefer?: "PLATFORM" | "CURRICULUM" | null;
  },
  model: ClassifyPort,
): Promise<QuestionGate> {
  const table = tableVerdict(input.original, input.role ?? null);
  if (table) return { pass: false, verdict: table, modelCalled: false, tokens: 0 };
  const help = input.policy.help && (input.helpTop >= HELP_THRESHOLD[input.language] || input.ownDoor === true);
  // The curriculum's scope, read once and only when it can change the verdict (pass 3).
  let curriculumOpen: boolean | null = typeof input.curriculumTop === "number" ? input.curriculumTop >= CURRICULUM_THRESHOLD[input.language] : null;
  const curriculum = async (): Promise<boolean> => {
    if (curriculumOpen === null) curriculumOpen = (await (input.curriculumTop as () => Promise<number>)()) >= CURRICULUM_THRESHOLD[input.language];
    return curriculumOpen;
  };
  // Below both thresholds: the sentence saying what the assistant is for, and nothing sent to the model.
  if (!help && !(await curriculum())) return { pass: false, verdict: "OUT_OF_SCOPE", modelCalled: false, tokens: 0 };
  const c = await classify(model, "question", input.stripped);
  // TA-025: a classifier that gave no word (it threw) is still no pass, and says so: the service answers MODEL_UNAVAILABLE
  // and gives the question back, as for an answering model that did not answer.
  if (c.label === "REFUSE") return { pass: false, verdict: "OUT_OF_SCOPE", modelCalled: true, tokens: c.tokens, label: "REFUSE", ...(c.unavailable ? { unavailable: true } : {}) };
  // The person's pick, only where its own scope is open (the retrieval above its threshold, the tutor's role).
  const label = input.prefer === "CURRICULUM" && input.policy.tutor && (await curriculum()) ? "CURRICULUM" : input.prefer === "PLATFORM" && help ? "PLATFORM" : c.label;
  if (label === "PLATFORM") {
    if (!help) return { pass: false, verdict: "OUT_OF_SCOPE", modelCalled: true, tokens: c.tokens, label: "PLATFORM" };
    return { pass: true, mode: "HELP", label: "PLATFORM", confidence: c.confidence, tokens: c.tokens };
  }
  // CURRICULUM: only with a curriculum passage close enough, and only for the tutor's roles.
  if (!(await curriculum())) return { pass: false, verdict: "OUT_OF_SCOPE", modelCalled: true, tokens: c.tokens, label: "CURRICULUM" };
  if (!input.policy.tutor) return { pass: false, verdict: "TUTOR_NOT_FOR_ROLE", modelCalled: true, tokens: c.tokens, label: "CURRICULUM" };
  return { pass: true, mode: "TUTOR", label: "CURRICULUM", confidence: c.confidence, tokens: c.tokens };
}

export type AnswerGate = { pass: true; tokens: number } | { pass: false; reasons: (AnswerProblem | "CATEGORY" | "INJECTION" | "SCOPE" | "CITATION" | "EMPTY" | "HINT_TOO_LONG")[]; tokens: number; unavailable?: boolean };

/** The [n] markers an answer cites. */
export function citedNumbers(answer: string): number[] {
  return [...new Set([...answer.matchAll(/\[(\d{1,2})\]/g)].map((m) => Number(m[1])))];
}

/**
 * F-13 (18 Oct 2026): THE MARKS AND THE SOURCES RUN 1, 2, 3. The prompt numbers every passage and row; the answer cites
 * some of them ([1], [4], [5]) and a cited row may still be dropped from the sources (another role's page, a link the
 * role may not compose). The marks whose source is kept are renumbered in the order they first appear, the sources
 * list given the same numbers and that order, and a mark whose source was dropped goes with it — so the shown answer
 * never skips a number nor points at nothing. Pure; generic over the citation shape, which keeps its other fields.
 */
export function renumberCitations<C extends { n: number }>(body: string, kept: readonly C[], opts: { keepNumbers?: boolean } = {}): { body: string; citations: C[] } {
  const byN = new Map(kept.map((c) => [c.n, c]));
  const next = new Map<number, number>();
  // keepNumbers: a part "Go on" may continue keeps the prompt's numbers, which the continuation's prompt numbers the same way; only its orphan marks go.
  for (const n of citedNumbers(body)) if (byN.has(n) && !next.has(n)) next.set(n, opts.keepNumbers ? n : next.size + 1);
  const text = body.replace(/(\s?)\[(\d{1,2})\]/g, (_mark, space: string, raw: string) => {
    const to = next.get(Number(raw));
    return to === undefined ? "" : `${space}[${to}]`;
  });
  const citations = [...next.entries()].map(([from, to]) => ({ ...byN.get(from)!, n: to }));
  return { body: text, citations };
}

/**
 * Everything after the answer. `passageCount` is how many passages the prompt numbered; `allowedText`
 * the passages' own text (a name the book prints is the book's); `label` the question's scope.
 */
export async function gateAnswer(
  input: {
    answer: string;
    label: "PLATFORM" | "CURRICULUM";
    passageCount: number;
    allowedText: string;
    lexicon: NameEntry[];
    hint: boolean;
    /**
     * A second label the answer may carry (the exam-scope reader, 10 Oct 2026): a tutor answer that names the
     * pupil's own sitting and its date beside the topic reads as PLATFORM to the classifier, and was discarded.
     */
    alsoLabel?: "PLATFORM" | "CURRICULUM";
    /** The asker's role, as for the question (a librarian's answer about books on loan is not money). */
    role?: string | null;
  },
  model: ClassifyPort,
): Promise<AnswerGate> {
  const reasons: Exclude<AnswerGate, { pass: true }>["reasons"] = [];
  const answer = input.answer.trim();
  if (!answer) return { pass: false, reasons: ["EMPTY"], tokens: 0 };
  if (detectRefusal(answer, input.role ?? null)) reasons.push("CATEGORY");
  if (detectInjection(answer)) reasons.push("INJECTION");
  reasons.push(...answerProblems(answer, input.lexicon, input.allowedText));
  const cited = citedNumbers(answer);
  if (cited.some((n) => n < 1 || n > input.passageCount)) reasons.push("CITATION");
  if (input.hint && answer.split(/\s+/).length > HINT_MAX_WORDS) reasons.push("HINT_TOO_LONG");
  // The model is asked only when the code found nothing: a discarded answer costs no second call.
  if (reasons.length) return { pass: false, reasons, tokens: 0 };
  const c = await classify(model, "answer", answer);
  if (c.label !== input.label && c.label !== input.alsoLabel) return { pass: false, reasons: ["SCOPE"], tokens: c.tokens, ...(c.unavailable ? { unavailable: true } : {}) };
  return { pass: true, tokens: c.tokens };
}
