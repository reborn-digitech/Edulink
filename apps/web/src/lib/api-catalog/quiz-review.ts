import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * quiz-review: the generated bank's desk, the web's /appadmin/quiz-review and /root/quiz-review (a review
 * queue from 10 October 2026; a bank desk since the owner's decision of 11 October: the generated items
 * are published without review, and the operator or the content team edit or take one down afterwards).
 * Access "app-admin", which the operator passes too (assertAppAdmin), so every role token the sweep holds
 * expects 403 and signed out is a 401. The suite that proves the 2xx, the take-down's effect on serving
 * and the 403 for a school's ADMIN and TEACHER is tests/quiz-review.test.ts. The writes are sampled on an
 * id no question holds: every sweep role is refused (403) before the id is read, and a fence that failed
 * would still change nothing (404). Thin over src/lib/quiz-review.ts.
 */
const NO_SUCH = "/api/v1/appadmin/quiz-review/zz-sweep-no-such-question";

export const QUIZ_REVIEW: Endpoint[] = [
  { method: "GET", path: "/api/v1/appadmin/quiz-review", summary: "The generated questions, served, taken down or held for a figure, by board, class, subject, chapter and level (filters ?board=&grade=&subject=&topic=&level=&state=), with the bank's counts and each person's edits and take-downs", access: "app-admin", request: c.quizReviewQuerySchema, response: c.quizReviewListSchema },
  { method: "GET", path: "/api/v1/appadmin/quiz-review/next", summary: "The next generated item in the desk's order (classes 6 to 10 mathematics and science first) under the filters, skipping the ids in ?skip=; null when none is left", access: "app-admin", request: c.quizReviewQuerySchema, response: c.quizReviewNextSchema },
  { method: "GET", path: "/api/v1/appadmin/quiz-review/{questionId}", summary: "One generated item in any state: the key, the solution, the check, the distractor reasons, the solver's answers, the figure, the Hindi and Marathi rows, pupils' answers so far and everything done to it", access: "app-admin", response: c.quizReviewNextSchema, sample: NO_SUCH },
  { method: "POST", path: "/api/v1/appadmin/quiz-review/{questionId}/edit", summary: "Correct the item in English and, when sent, in Hindi and Marathi: served as edited at once; the earlier words kept on the record and named in the audit log, the solver's answers kept with an edited-after-solving mark", access: "app-admin", request: c.quizReviewEditBodySchema, response: c.quizBankStandingSchema, emptyBodyStatus: 422, sample: `${NO_SUCH}/edit` },
  { method: "POST", path: "/api/v1/appadmin/quiz-review/{questionId}/take-down", summary: "Take the item down with a reason from the coded list: not served from this moment, the answers pupils gave kept; taking it down again changes nothing", access: "app-admin", request: c.quizTakeDownBodySchema, response: c.quizBankStandingSchema, emptyBodyStatus: 422, sample: `${NO_SUCH}/take-down` },
  // bank-desk (20 Oct 2026): the whole bank, authored and generated, by class and subject, and a chapter's questions in three languages. The bank's, not a person's data.
  { method: "GET", path: "/api/v1/appadmin/quiz-review/matrix", summary: "The practice bank by class and subject (?board= NCERT or BALBHARATI, absent both): for classes 3 to 12 and each subject the generator has a code for, the questions served, the chapters and how many have reached the target (the running generation's, else 100); a college row per stream when the bank has college chapters", access: "app-admin", request: c.quizBankMatrixQuerySchema, response: c.quizBankMatrixSchema },
  { method: "GET", path: "/api/v1/appadmin/quiz-review/chapters", summary: "The practice bank's chapters grouped by class, subject and board in their book's order (?board=&grade=&subject=), each with its served questions by level, what is taken down or held, and whether the generator, the authored bank or both made them", access: "app-admin", request: c.quizBankChaptersQuerySchema, response: c.quizBankChaptersSchema },
  { method: "GET", path: "/api/v1/appadmin/quiz-review/chapters/{slug}", summary: "One chapter's questions, fifty a page (?page=), served unless ?state= asks for the taken-down or held ones, in English, Hindi or Marathi (?lang=): each with its level, options and key, solution, figure, who made it and when, and a note where the language's words are missing, stale or were taken down as wrong", access: "app-admin", request: c.quizBankChapterQuerySchema, response: c.quizBankChapterSchema, sample: "/api/v1/appadmin/quiz-review/chapters/zz-sweep-no-such-chapter" },
  { method: "POST", path: "/api/v1/appadmin/quiz-review/{questionId}/put-back", summary: "Put a taken-down item back: served again at once (unless its figure is still to be drawn); putting it back again changes nothing", access: "app-admin", response: c.quizBankStandingSchema, sample: `${NO_SUCH}/put-back` },
];
