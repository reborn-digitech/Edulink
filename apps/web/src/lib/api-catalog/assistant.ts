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
  { method: "POST", path: "/api/v1/assistant/conversations/{conversationId}/messages", feature: "ASSISTANT", summary: "Ask: the gate before the model, the answer, the gate after it; streamed over /api/v1/events once checked, and whole in the response", access: PEOPLE, module: "ASSISTANT", request: c.assistantAskSchema, response: c.assistantAnswerSchema, sample: `${NO_CONVERSATION}/messages`, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/assistant/conversations/{conversationId}/feedback", feature: "ASSISTANT", summary: "Say whether one answer was helpful", access: PEOPLE, request: c.assistantFeedbackSchema, response: c.assistantFeedbackSavedSchema, sample: `${NO_CONVERSATION}/feedback`, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/admin/assistant/usage", feature: "ASSISTANT", summary: "The school's month of assistant use in counts against its budget, the switch and the helpline sentence", access: ["ADMIN", "PRINCIPAL"], response: c.assistantUsageSchema },
  // An empty body changes nothing and answers the card (200); the sweep's empty body may also be read as no body (422).
  { method: "POST", path: "/api/v1/admin/assistant/settings", feature: "ASSISTANT", summary: "Set the helpline sentence the counsellor route names; the assistant itself is switched on for a school by the platform's operator, so `on` asking for a change is refused (403) and `on` naming the current state changes nothing", access: ["ADMIN"], request: c.assistantSettingsSchema, response: c.assistantUsageSchema, emptyBodyStatus: [200, 422], sampleBody: () => ({}) },
  { method: "GET", path: "/api/v1/family/assistant", feature: "ASSISTANT", summary: "Each child: whether their school has the assistant on and whether I turned it off for them", access: ["PARENT"], response: c.familyAssistantSchema },
  { method: "POST", path: "/api/v1/family/assistant/opt-out", feature: "ASSISTANT", summary: "Turn the assistant off, or back on, for one of my children", access: ["PARENT"], request: c.familyAssistantOptOutSchema, response: c.familyAssistantOptOutSavedSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/teacher/assignments/{assignmentId}/assistant", feature: "ASSISTANT", summary: "Whether a second ask of a question matching this assignment gets the worked answer or stays a hint", access: ["TEACHER", "FACULTY", "HOD"], response: c.assignmentAssistantSchema, sample: (f) => (f.assignmentId ? `/api/v1/teacher/assignments/${f.assignmentId}/assistant` : null), statusByRole: { FACULTY: [403, 404], HOD: [403, 404] } },
  { method: "POST", path: "/api/v1/teacher/assignments/{assignmentId}/assistant", feature: "ASSISTANT", summary: "The teacher's per-assignment switch: the worked answer on a second ask, or hints only", access: ["TEACHER", "FACULTY", "HOD"], request: c.assignmentAssistantSaveSchema, response: c.assignmentAssistantSchema, sample: (f) => (f.assignmentId ? `/api/v1/teacher/assignments/${f.assignmentId}/assistant` : null), emptyBodyStatus: 422 },
];
