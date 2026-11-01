import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * contest: the competition writes for the phone (hand-in, withdraw, post,
 * organise, results) and the content team's platform competitions and
 * question bank. Every handler is thin over the same src/lib function the
 * web's server action calls, with the form's rules shared through
 * src/lib/competition-forms.ts and readPlatformCompetitionForm. The suite is
 * tests/api-v1-contest.test.ts.
 *
 * Sweep notes: a body-taking write answers 422 to the sweep's empty body, so
 * sampling it with the fixture's competition (ZZ Northgate's own, open for
 * entries: scripts/sweep-doors.ts) changes nothing. The withdrawal names an
 * entry nobody made, for the reason on its entry. The content team's endpoints refuse
 * every school role (403) wherever they are sampled, before the id is read.
 */
const competition = (f: { competitionId: string | null }, tail: string) => (f.competitionId ? `/api/v1/contest/competitions/${f.competitionId}${tail}` : null);

export const CONTEST: Endpoint[] = [
  // ---- a pupil and a guardian ---------------------------------------------------
  { method: "POST", path: "/api/v1/contest/competitions/{competitionId}/submit", summary: "A pupil hands in, or replaces, the https link to their work", access: ["STUDENT"], request: c.contestSubmitSchema, reach: "self", response: c.okSchema, emptyBodyStatus: 422, sample: (f) => competition(f, "/submit") },
  // An entry NOBODY MADE (SWEEPS-1, 4 Oct 2026). The call deletes the entry, so a real one would be gone after
  // the pupil's turn; this id is refused 403 to every role outside `access` (withdrawEntry asks the role before
  // it reads the id, which it did not on 2026-10-01, when the expert's 404 stopped the sample) and 404 to the
  // pupil and the guardian, and nothing is deleted. tests/api-v1-contest.test.ts proves the withdrawal itself.
  { method: "DELETE", path: "/api/v1/contest/entries/{entryId}", summary: "The pupil withdraws their entry, or their guardian says not this time", access: ["STUDENT", "PARENT"], reach: { STUDENT: "self", PARENT: "ownChild" }, response: c.okSchema, sample: "/api/v1/contest/entries/zz-sweep-no-such-entry" },
  // ---- a school admin organising one ---------------------------------------------
  { method: "POST", path: "/api/v1/contest/competitions", summary: "A school admin posts a competition, saved as a draft", access: ["ADMIN"], request: c.contestCreateSchema, response: c.contestCreatedSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/contest/competitions/{competitionId}/status", summary: "The organising school publishes, withdraws or re-drafts its competition", access: ["ADMIN"], request: c.contestStatusSchema, response: c.contestStatusSetSchema, emptyBodyStatus: 422, sample: (f) => competition(f, "/status") },
  { method: "POST", path: "/api/v1/contest/competitions/{competitionId}/leaderboard", summary: "The organising school publishes or takes down the schools' leaderboard", access: ["ADMIN"], request: c.contestLeaderboardSchema, response: c.contestLeaderboardSetSchema, emptyBodyStatus: 422, sample: (f) => competition(f, "/leaderboard") },
  // ---- staff and results -----------------------------------------------------------
  { method: "GET", path: "/api/v1/contest/competitions/{competitionId}/entries", summary: "This school's entries in a competition and what they scored", access: ["ADMIN", "TEACHER"], response: c.contestEntriesSchema, sample: (f) => competition(f, "/entries") },
  // An empty body is refused before the entry is read (422); an empty score and place is a valid body that CLEARS a result, so no sampleBody.
  { method: "POST", path: "/api/v1/contest/entries/{entryId}/result", summary: "Staff record, change or clear an entry's score and place", access: ["ADMIN", "TEACHER"], request: c.contestResultSchema, response: c.contestResultSetSchema, emptyBodyStatus: 422, sample: (f) => (f.competitionEntryId ? `/api/v1/contest/entries/${f.competitionEntryId}/result` : null) },
  // ---- the content team ----------------------------------------------------------------
  { method: "POST", path: "/api/v1/appadmin/competitions/drafts", summary: "The content team posts a competition for every school, saved as a draft", access: "app-admin", request: c.contestPlatformCreateSchema, response: c.contestCreatedSchema, emptyBodyStatus: 422, sample: "/api/v1/appadmin/competitions/drafts" },
  { method: "POST", path: "/api/v1/appadmin/competitions/{competitionId}/status", summary: "The content team publishes, withdraws or re-drafts a platform competition", access: "app-admin", request: c.contestStatusSchema, response: c.contestStatusSetSchema, emptyBodyStatus: 422, sample: (f) => (f.competitionId ? `/api/v1/appadmin/competitions/${f.competitionId}/status` : null) },
  { method: "GET", path: "/api/v1/appadmin/bank", summary: "The practice question bank's chapters and their question counts", access: "app-admin", response: c.contestBankSchema },
  { method: "GET", path: "/api/v1/appadmin/bank/{topicId}", summary: "One chapter of the question bank and every question in it", access: "app-admin", response: c.contestBankTopicSchema, sample: (f) => (f.bankTopicId ? `/api/v1/appadmin/bank/${f.bankTopicId}` : null) },
  { method: "POST", path: "/api/v1/appadmin/bank/{topicId}/questions", summary: "Add a question to a chapter, translated to Hindi and Marathi on save", access: "app-admin", request: c.contestQuestionSchema, response: c.contestQuestionSavedSchema, emptyBodyStatus: 422, sample: (f) => (f.bankTopicId ? `/api/v1/appadmin/bank/${f.bankTopicId}/questions` : null) },
  { method: "POST", path: "/api/v1/appadmin/bank/{topicId}/questions/{questionId}", summary: "Edit a question and re-translate it", access: "app-admin", request: c.contestQuestionSchema, response: c.contestQuestionSavedSchema, emptyBodyStatus: 422, sample: (f) => (f.bankTopicId && f.bankQuestionId ? `/api/v1/appadmin/bank/${f.bankTopicId}/questions/${f.bankQuestionId}` : null) },
  // Deleting is one way, so the sample names a question no chapter holds; every sweep role is refused (403) before the ids are read, and tests/api-v1-appadmin-bank-delete.test.ts takes the delete.
  { method: "DELETE", path: "/api/v1/appadmin/bank/{topicId}/questions/{questionId}", summary: "Take a question out of the bank; the answers pupils gave it go with it, earned badges stay", access: "app-admin", response: c.okSchema, sample: (f) => (f.bankTopicId ? `/api/v1/appadmin/bank/${f.bankTopicId}/questions/zz-sweep-no-such-question` : null) },
];
