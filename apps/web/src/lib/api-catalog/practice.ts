import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * practice: endpoints added for the phone's remaining screens (September 2026)
 * — the pupil's practice player (the web's /student/practice/{slug} and
 * /student/practice/revision) and the teacher's worksheets (/teacher/worksheets).
 * Each is thin over the lib the web's server actions and pages call: quiz.ts
 * for a sitting, practice-insights.ts for revision and the chapters a teacher
 * set, worksheets.ts for the paper.
 *
 * No path parameters: an attempt, a question or a chapter travels in the body
 * or the query, so every entry is swept without a fixture. The writes carry no
 * sampleBody — each would open a sitting or record an answer on every sweep —
 * so the sweep proves their 422 and leaves the ZZ fixture as it found it.
 */
export const PRACTICE: Endpoint[] = [
  // ---- /student/practice/{slug} --------------------------------------------
  {
    method: "POST",
    path: "/api/v1/practice/attempts", feature: "QUESTION_BANK",
    summary: "Open a sitting on a chapter (or on a chapter the teacher set), or pick up the one left half-way, with the question to answer now",
    access: ["STUDENT"],
    request: c.practiceBeginBodySchema,
    reach: "ownWork", response: c.practiceBeganSchema,
    emptyBodyStatus: 422,
  },
  // The sweep's samples for the three reads that need a query name an attempt,
  // a question and a chapter nobody has: a permitted role gets the 404, not a bare call's 422.
  { method: "GET", path: "/api/v1/practice/next", feature: "QUESTION_BANK", summary: "The question to answer now in a sitting; null once the chapter is done", access: ["STUDENT"], request: c.practiceNextQuerySchema, response: c.practiceNextSchema, sample: "/api/v1/practice/next?attemptId=czzsweepnoattempt000000000" },
  {
    method: "POST",
    path: "/api/v1/practice/answer", feature: "QUESTION_BANK",
    summary: "Answer a question, with the verdict and the working — replay-safe, so the outbox may deliver it twice",
    access: ["STUDENT"],
    request: c.practiceAnswerBodySchema,
    reach: "self", response: c.practiceAnsweredSchema,
    emptyBodyStatus: 422,
  },
  {
    method: "POST",
    path: "/api/v1/practice/reveal", feature: "QUESTION_BANK",
    summary: "Show the working before answering; costs the chapter's badge for this sitting",
    access: ["STUDENT"],
    request: c.practiceRevealBodySchema,
    reach: "self", response: c.practiceRevealedSchema,
    emptyBodyStatus: 422,
  },
  // ---- /student/practice/revision ------------------------------------------
  { method: "GET", path: "/api/v1/practice/revision", feature: "QUESTION_BANK", summary: "Smart revision: the pupil's own missed questions, rested and ready again", access: ["STUDENT"], request: c.practiceLanguageQuerySchema, response: c.practiceRevisionSchema },
  { method: "GET", path: "/api/v1/practice/journey", feature: "QUESTION_BANK", summary: "The pupil's own journey: every badge newest first (sixty at most), the tier badges of the last six months, the weeks in a row with practice and the totals; compared with their own past only", access: ["STUDENT"], response: c.practiceJourneySchema },
  { method: "GET", path: "/api/v1/practice/revision/question", feature: "QUESTION_BANK", summary: "One queued revision question, without its answer", access: ["STUDENT"], request: c.practiceRevisionQuestionQuerySchema, response: c.practiceRevisionQuestionSchema, sample: "/api/v1/practice/revision/question?questionId=zz-sweep-no-question" },
  {
    method: "POST",
    path: "/api/v1/practice/revision/answer", feature: "QUESTION_BANK",
    summary: "Answer a revision question through the chapter's own sitting, so it moves the same ladder",
    access: ["STUDENT"],
    request: c.practiceRevisionAnswerBodySchema,
    response: c.practiceRevisionAnsweredSchema,
    emptyBodyStatus: 422,
  },
  // ---- one-time practice (decision 0008, 7 Nov 2026): a pupil without the plan opens an assigned set once ----
  // `planFree`: the platform switch alone; the handler decides nothing about the plan (a pupil with it plays the
  // chapter through /attempts, and the pages draw these for a locked pupil). The open and the answer carry no
  // sampleBody: each would fix a draw or record an answer on every sweep.
  { method: "GET", path: "/api/v1/practice/once", feature: "QUESTION_BANK", planFree: "a pupil without the Student plan opens a set a teacher assigned once, scored (decision 0008); the bank itself stays behind the plan", summary: "The sets a teacher assigned to the pupil's classes, with where each one-time attempt stands: not opened, open with so many answered, or done with the score", access: ["STUDENT"], reach: "self", reachRefusal: "filters", request: c.practiceLanguageQuerySchema, response: c.practiceOnceListSchema, sample: "/api/v1/practice/once" },
  { method: "POST", path: "/api/v1/practice/once", feature: "QUESTION_BANK", planFree: "a pupil without the Student plan opens a set a teacher assigned once, scored (decision 0008); the bank itself stays behind the plan", summary: "Open an assigned set once — a fixed draw of the chapter's questions nearest the target rung, at most ten — or read it back as it stands; a finished set answers with no question and the score", access: ["STUDENT"], request: c.practiceOnceOpenBodySchema, reach: "self", response: c.practiceOnceSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/practice/once/answer", feature: "QUESTION_BANK", planFree: "a pupil without the Student plan opens a set a teacher assigned once, scored (decision 0008); the bank itself stays behind the plan", summary: "Answer one question of a one-time set, with the verdict and the working, and the next question; replay-safe, and the last answer fixes the score; nothing moves a rung or earns a badge", access: ["STUDENT"], request: c.practiceOnceAnswerBodySchema, reach: "self", response: c.practiceOnceAnsweredSchema, emptyBodyStatus: 422 },
  // ---- /teacher/worksheets -------------------------------------------------
  { method: "GET", path: "/api/v1/practice/worksheets", feature: "QUESTION_BANK", summary: "The chapters a worksheet can be built from, the rungs, and the most a paper holds", access: ["TEACHER"], response: c.practiceWorksheetTopicsSchema },
  { method: "GET", path: "/api/v1/practice/worksheets/sheet", feature: "QUESTION_BANK", summary: "A worksheet and its answer key: the same chapter, rung, count and seed always build the same paper", access: ["TEACHER"], request: c.practiceWorksheetQuerySchema, response: c.practiceWorksheetSchema, sample: "/api/v1/practice/worksheets/sheet?slug=zz-sweep-no-chapter" },
];
