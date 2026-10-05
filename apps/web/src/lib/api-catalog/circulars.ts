import * as c from "@edulink/contracts";
import type { Endpoint, SweepFixture } from "./types";

/**
 * circulars: a notice that asks for an acknowledgement, and how far it got.
 * Readers acknowledge; staff read the reach; the office chases the rest.
 */
const post = (rest: string) => (f: SweepFixture) => (f.circularId ? `/api/v1/shared/bulletin/${f.circularId}${rest}` : null);

export const CIRCULARS: Endpoint[] = [
  { method: "POST", path: "/api/v1/shared/bulletin/{postId}/ack", summary: "The one tap a circular asks for: seen and understood (idempotent)", access: "signed-in", response: c.okSchema, sample: post("/ack") },
  { method: "GET", path: "/api/v1/shared/bulletin/{postId}/reach", summary: "Who a circular has reached — told, seen, acknowledged — family by family, class by class (a teacher: own classes)", access: ["TEACHER", "ADMIN", "PRINCIPAL"], response: c.circularReachSchema, sample: post("/reach") },
  { method: "POST", path: "/api/v1/shared/bulletin/{postId}/remind", summary: "Chase the families not yet acknowledged: a push and the text on the second channel; once a day, a no-op with zeros until then (the office and the head)", access: ["ADMIN", "PRINCIPAL"], response: c.circularRemindResultSchema, emptyBodyStatus: 200, sample: post("/remind") },
  // Permission slips (5 Oct 2026, permission-slips.ts): a circular's yes-or-no per child. The sweep's circular asks none, so every reader's 404 is right.
  { method: "GET", path: "/api/v1/shared/bulletin/{postId}/consent", summary: "A permission slip as its reader answers it: their children in its audience (an adult student: themself) and each one's answer", access: ["PARENT", "STUDENT"], response: c.slipViewSchema, sample: post("/consent") },
  { method: "POST", path: "/api/v1/shared/bulletin/{postId}/consent", summary: "A guardian's yes or no for one child in the slip's audience (an adult student's own), changeable until the slip's day; counts as seen and understood", access: ["PARENT", "STUDENT"], request: c.slipAnswerSchema, response: c.slipViewSchema, emptyBodyStatus: 422, sample: post("/consent") },
  { method: "GET", path: "/api/v1/shared/bulletin/{postId}/consent/report", summary: "A permission slip's answers child by child, who gave each, the unanswered first (a teacher: their class's slip or their own)", access: ["TEACHER", "ADMIN", "PRINCIPAL"], response: c.slipReportSchema, sample: post("/consent/report") },
  { method: "GET", path: "/api/v1/office/circulars", summary: "Every circular of the school with its reach, newest first", access: ["ADMIN", "PRINCIPAL"], response: c.officeCircularsSchema },
];
