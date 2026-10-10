import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * quiz-review: the generated bank's review queue (10 October 2026), the web's /appadmin/quiz-review and
 * /root/quiz-review. The app admins and the operator review, never teachers (the owner's amendment of
 * Phase 1 "Output and review"): access "app-admin", which the operator passes too (assertAppAdmin), so
 * every role token the sweep holds expects 403 and signed out is a 401. The suite that proves the 2xx,
 * the stamp's effect on serving and the 403 for a school's ADMIN and TEACHER is tests/quiz-review.test.ts.
 * The writes are sampled on an id no question holds: every sweep role is refused (403) before the id is
 * read, and a fence that failed would still change nothing (404). Thin over src/lib/quiz-review.ts.
 */
const NO_SUCH = "/api/v1/appadmin/quiz-review/zz-sweep-no-such-question";

export const QUIZ_REVIEW: Endpoint[] = [
  { method: "GET", path: "/api/v1/appadmin/quiz-review", summary: "The generated questions waiting for review, by board, class, subject, chapter and level (filters ?board=&grade=&subject=&topic=&level=), with the queue's remaining count, the languages waiting, and each reviewer's count", access: "app-admin", request: c.quizReviewQuerySchema, response: c.quizReviewListSchema },
  { method: "GET", path: "/api/v1/appadmin/quiz-review/next", summary: "The next waiting item in the queue's order (classes 6 to 10 mathematics and science first) under the filters, skipping the ids in ?skip=; null when none is left", access: "app-admin", request: c.quizReviewQuerySchema, response: c.quizReviewNextSchema },
  { method: "GET", path: "/api/v1/appadmin/quiz-review/{questionId}", summary: "One generated item, waiting or not: the key, the solution, the check, the distractor reasons, the solver's answers, the figure, the Hindi and Marathi rows and every stamp", access: "app-admin", response: c.quizReviewNextSchema, sample: NO_SUCH },
  { method: "POST", path: "/api/v1/appadmin/quiz-review/{questionId}/stamp", summary: "Accept the item: the first stamp serves it to pupils; accepting it again changes nothing; refused while a figure it needs is not drawn", access: "app-admin", response: c.quizReviewStampedSchema, sample: `${NO_SUCH}/stamp` },
  { method: "POST", path: "/api/v1/appadmin/quiz-review/{questionId}/edit", summary: "Correct the English and accept it in one press: the earlier words kept on the stamp and named in the audit log, the solver's answers kept with an edited-after-solving mark, any language stamp taken off", access: "app-admin", request: c.quizReviewEditBodySchema, response: c.quizReviewStampedSchema, emptyBodyStatus: 422, sample: `${NO_SUCH}/edit` },
  { method: "POST", path: "/api/v1/appadmin/quiz-review/{questionId}/discard", summary: "Discard the item with a reason from the coded list: never served, out of the queue; discarding it again changes nothing", access: "app-admin", request: c.quizReviewDiscardBodySchema, response: c.quizReviewStampedSchema, emptyBodyStatus: 422, sample: `${NO_SUCH}/discard` },
  { method: "POST", path: "/api/v1/appadmin/quiz-review/{questionId}/stamp-translation", summary: "Stamp the item's Hindi or Marathi row read (served from then on, once the English is), or take the stamp off", access: "app-admin", request: c.quizReviewTranslationBodySchema, response: c.quizReviewStampedSchema, emptyBodyStatus: 422, sample: `${NO_SUCH}/stamp-translation` },
];
