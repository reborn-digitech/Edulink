import * as c from "@edulink/contracts";
import type { RoleCode } from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * assistant: the help and tutor chat (docs/plans/assistant.md Phase B, decision 0005). The person's
 * own doors are open to every role that belongs to a school — platform help is for everyone — and
 * the tutor inside them is decided by the role policy table (src/lib/assistant/policy.ts), not here.
 * The expert and the recruiter belong to no school and are not offered it.
 *
 * The module gate: opening a conversation and asking are behind ASSISTANT; reading, deleting and
 * the feedback are not, so a school that switches the assistant off leaves its people able to read
 * and delete what they wrote. The office's card and switch are never behind it (the switch must be
 * able to turn it back on); the family's opt-out and the teacher's per-assignment switch neither.
 *
 * Sweep notes: opening needs a language and asking needs a text, so an empty body is 422 and the
 * sweep never opens a conversation or calls the model. The conversation doors are sampled with an
 * id no school holds, answered 404.
 */
const PEOPLE: RoleCode[] = ["ADMIN", "PRINCIPAL", "TEACHER", "STUDENT", "PARENT", "DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS", "FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS"];
const NO_CONVERSATION = "/api/v1/assistant/conversations/zz-sweep-no-such-conversation";

export const ASSISTANT: Endpoint[] = [
  { method: "GET", path: "/api/v1/assistant", feature: "ASSISTANT", summary: "Whether I may use the assistant now (and if not, why, as a code), whether the tutor is mine, my day's questions against the cap", access: PEOPLE, response: c.assistantStatusSchema },
  { method: "POST", path: "/api/v1/assistant/conversations", feature: "ASSISTANT", summary: "Open a conversation (refused by the module, the platform's switch, a guardian's opt-out and the caps); a guardian's is filed under a child's school", access: PEOPLE, module: "ASSISTANT", request: c.assistantOpenSchema, response: c.assistantConversationSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/assistant/conversations", feature: "ASSISTANT", summary: "My conversations of the last thirty days, newest first", access: PEOPLE, response: c.assistantConversationListSchema },
  { method: "GET", path: "/api/v1/assistant/conversations/{conversationId}", feature: "ASSISTANT", summary: "One of my conversations with every message, its citations and verdicts", access: PEOPLE, response: c.assistantConversationDetailSchema, sample: NO_CONVERSATION, emptyBodyStatus: 404 },
  { method: "DELETE", path: "/api/v1/assistant/conversations/{conversationId}", feature: "ASSISTANT", summary: "Delete one of my conversations now", access: PEOPLE, response: c.assistantDeletedSchema, sample: NO_CONVERSATION, emptyBodyStatus: 404 },
  { method: "POST", path: "/api/v1/assistant/conversations/{conversationId}/messages", feature: "ASSISTANT", summary: "Ask: the gate before the model, the answer, the gate after it; streamed over /api/v1/events once checked, and whole in the response; with the mode I picked, the page I am on, \"go on\" for a cut answer, or the row an \"Explain this to me\" link names (read again through my own door)", access: PEOPLE, module: "ASSISTANT", request: c.assistantAskSchema, response: c.assistantAnswerSchema, sample: `${NO_CONVERSATION}/messages`, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/assistant/conversations/{conversationId}/feedback", feature: "ASSISTANT", summary: "Say whether one answer was helpful", access: PEOPLE, request: c.assistantFeedbackSchema, response: c.assistantFeedbackSavedSchema, sample: `${NO_CONVERSATION}/feedback`, emptyBodyStatus: 422 },
  // Vidura pass 1 (17 Oct 2026): three questions for an empty drawer, per role and page, from the help index.
  { method: "GET", path: "/api/v1/assistant/suggestions", feature: "ASSISTANT", summary: "Three questions for an empty drawer, for my role and the page I am on (?page=), in my language, from the help index", access: PEOPLE, module: "ASSISTANT", response: c.assistantSuggestionsSchema },
  { method: "GET", path: "/api/v1/admin/assistant/usage", feature: "ASSISTANT", summary: "The school's month of assistant use in counts against its budget, the switch and the helpline sentence", access: ["ADMIN", "PRINCIPAL"], response: c.assistantUsageSchema },
  // An empty body changes nothing and answers the card (200); the sweep's empty body may also be read as no body (422).
  { method: "POST", path: "/api/v1/admin/assistant/settings", feature: "ASSISTANT", summary: "Set the helpline sentence the counsellor route names; the assistant itself is switched on for a school by the platform's operator, so `on` asking for a change is refused (403) and `on` naming the current state changes nothing", access: ["ADMIN"], request: c.assistantSettingsSchema, response: c.assistantUsageSchema, emptyBodyStatus: [200, 422], sampleBody: () => ({}) },
  { method: "GET", path: "/api/v1/family/assistant", feature: "ASSISTANT", summary: "Each child: whether their school has the assistant on and whether I turned it off for them", access: ["PARENT"], response: c.familyAssistantSchema },
  { method: "POST", path: "/api/v1/family/assistant/opt-out", feature: "ASSISTANT", summary: "Turn the assistant off, or back on, for one of my children", access: ["PARENT"], request: c.familyAssistantOptOutSchema, response: c.familyAssistantOptOutSavedSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/teacher/assignments/{assignmentId}/assistant", feature: "ASSISTANT", summary: "Whether a second ask of a question matching this assignment gets the worked answer or stays a hint", access: ["TEACHER", "FACULTY", "HOD"], response: c.assignmentAssistantSchema, sample: (f) => (f.assignmentId ? `/api/v1/teacher/assignments/${f.assignmentId}/assistant` : null), statusByRole: { FACULTY: [403, 404], HOD: [403, 404] } },
  // Vidura pass 2 (17 Oct 2026): the guide's Hindi and Marathi renderings, read by the content team and the operator, and the
  // operator's word on each (src/lib/assistant/renderings.ts). The write is sampled on an id no rendering holds: every sweep
  // role is refused (403) before the id is read, the operator answers 404.
  { method: "GET", path: "/api/v1/appadmin/vidura/renderings", summary: "The user guide's Hindi and Marathi renderings by language, status and kind, a page at a time, with the counts waiting for a speaker, approved and rejected, and whether this reader may act on them", access: "app-admin", request: c.viduraRenderingsQuerySchema, response: c.viduraRenderingsSchema },
  { method: "POST", path: "/api/v1/operator/vidura/renderings/{renderingId}", summary: "Approve, edit (the speaker's words in use, checked like the model's) or reject one rendering of the guide; a rejected one leaves retrieval and the suggestions at once; audited, and the same act again changes nothing", access: "operator", request: c.viduraRenderingReviewSchema, response: c.viduraRenderingSchema, emptyBodyStatus: 422, sample: "/api/v1/operator/vidura/renderings/zz-sweep-no-such-rendering" },
  // Vidura pass 3 (18 Oct 2026): the operator's standard answers, the unanswered report and the evaluation runs
  // (src/lib/assistant/standard.ts, gaps.ts, src/lib/eval-jobs.ts). Every write is sampled with an empty body (422) or on an
  // id nothing holds (404 for the operator, 403 for every sweep role before the id is read): the sweep never asks the model
  // and never starts a run.
  { method: "GET", path: "/api/v1/operator/vidura/answers", summary: "The standard answers for common how-to questions with their hits across every school, the drafts the operator's own questions got (cleared after seven days) and the revoked ones", access: "operator", response: c.viduraAnswersSchema },
  { method: "POST", path: "/api/v1/operator/vidura/answers", summary: "Ask Vidura a question as a role, through the same gates and model as everyone (no standard answer served); the answer is kept as a draft to mark as the standard one; 201; audited", access: "operator", request: c.viduraAnswerTrySchema, response: c.viduraAnswerSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/operator/vidura/answers/{answerId}", summary: "Mark a draft as the standard answer (an answered, \"Using Shalaghar\" how-to or where-is answer only; an earlier one to the same question is revoked), revoke a standard answer, or discard a draft; audited, the same act again changes nothing", access: "operator", request: c.viduraAnswerActSchema, response: c.viduraAnswerReadSchema, emptyBodyStatus: 422, sample: "/api/v1/operator/vidura/answers/zz-sweep-no-such-answer" },
  { method: "GET", path: "/api/v1/operator/vidura/unanswered", summary: "The last thirty days of Vidura's refusals and discards by mode, role, school, verdict and reason, counts only (the counsellor routes never), and the stems of questions that found no page or passage, asked by two people or more", access: "operator", response: c.viduraUnansweredSchema },
  { method: "GET", path: "/api/v1/operator/vidura/unanswered/export", summary: "The unanswered report as CSV (text/csv), a section per table; audited", access: "operator", response: c.okSchema },
  { method: "GET", path: "/api/v1/operator/vidura/evals", summary: "The evaluation run in hand, or the last, with its live line (the set, the cases done and passed, the seconds); the latest ten runs with their scores; the model servers; whether a generation run or a crawl holds the model", access: "operator", response: c.viduraEvalsSchema },
  { method: "POST", path: "/api/v1/operator/vidura/evals", summary: "Start the harness on the sets named (at least one) on this machine, bringing up the model servers it needs that are down; 201 with the run, 409 while one runs or while a generation run or a crawl holds the model; audited", access: "operator", request: c.viduraEvalRequestSchema, response: c.viduraEvalReadSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/operator/vidura/evals/{jobId}/stop", summary: "Stop a run: the runner finishes the case in hand, keeps the scores of what it ran, and the model servers it brought up go down with it; an ended run is left as it is; audited", access: "operator", response: c.viduraEvalReadSchema, sample: "/api/v1/operator/vidura/evals/zz-sweep-no-such-run/stop" },
  // Vidura pass 4 (18 Oct 2026): the reference allow-list (src/lib/assistant/references.ts). Every write is sampled with an
  // empty body (422 for the operator, 403 for every sweep role first) or on an id nothing holds: the sweep adds nothing.
  { method: "GET", path: "/api/v1/operator/vidura/references", summary: "Vidura's reference allow-list: the public education sources linked beside a Learning answer (name, host, kind, licence as published, the roles shown, on or off), each link built from the source's https template and the cited passage's heading; shown to staff and adult college students, never to a pupil while decision 0002 stands", access: "operator", response: c.viduraReferenceSourcesSchema },
  { method: "POST", path: "/api/v1/operator/vidura/references", summary: "Add a reference source, on at once: its host, an https template on that host with {topic}, its licence and the roles shown; Medium is refused; 201; audited", access: "operator", request: c.viduraReferenceAddSchema, response: c.viduraReferenceReadSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/operator/vidura/references/{sourceId}", summary: "Switch a reference source on or off, or edit it (checked again as if new); audited, the same act again changes nothing", access: "operator", request: c.viduraReferenceActSchema, response: c.viduraReferenceReadSchema, emptyBodyStatus: 422, sample: "/api/v1/operator/vidura/references/zz-sweep-no-such-source" },
  { method: "POST", path: "/api/v1/teacher/assignments/{assignmentId}/assistant", feature: "ASSISTANT", summary: "The teacher's per-assignment switch: the worked answer on a second ask, or hints only", access: ["TEACHER", "FACULTY", "HOD"], request: c.assignmentAssistantSaveSchema, response: c.assignmentAssistantSchema, sample: (f) => (f.assignmentId ? `/api/v1/teacher/assignments/${f.assignmentId}/assistant` : null), emptyBodyStatus: 422 },
];
