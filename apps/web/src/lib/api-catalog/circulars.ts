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
  { method: "GET", path: "/api/v1/office/circulars", summary: "Every circular of the school with its reach, newest first", access: ["ADMIN", "PRINCIPAL"], response: c.officeCircularsSchema },
];
