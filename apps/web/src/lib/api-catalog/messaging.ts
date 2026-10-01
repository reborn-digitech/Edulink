import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * messaging: texts to families by SMS and WhatsApp. The office (ADMIN)
 * switches channels, sends notices and reads the reports; the head
 * (PRINCIPAL) reads. A guardian's own switches live on /family/settings and
 * /account/prefs (channels.sms, channels.whatsapp).
 *
 * The sweep sends the notice preview (writes nothing) and proves every
 * other write's 422; a real notice would text the fixture's families.
 */
export const MESSAGING: Endpoint[] = [
  { method: "GET", path: "/api/v1/messaging/overview", summary: "Channels, this month's counts and cap, template readiness, recent notices and automatic texts", access: ["ADMIN", "PRINCIPAL"], response: c.messagingOverviewSchema },
  { method: "POST", path: "/api/v1/messaging/settings", summary: "Switch SMS and WhatsApp on or off, set the monthly cap, choose which events may text, and whether absence notices, fee reminders and circulars may go to the guardian phone the office typed on a pupil's record (textOfficePhones)", access: ["ADMIN"], request: c.messagingSettingsSaveSchema, response: c.messagingOkSchema },
  { method: "POST", path: "/api/v1/messaging/test", summary: "Text the office's own number, past the caps, to prove the wiring", access: ["ADMIN"], response: c.messagingTestResultSchema },
  { method: "GET", path: "/api/v1/messaging/broadcasts", summary: "Every notice the office sent to many families, with its counts", access: ["ADMIN", "PRINCIPAL"], response: c.broadcastsSchema },
  { method: "POST", path: "/api/v1/messaging/broadcasts/preview", summary: "Who a notice would reach, on which channel, and roughly how many segments (writes nothing)", access: ["ADMIN"], request: c.broadcastPreviewBodySchema, response: c.broadcastPreviewSchema, emptyBodyStatus: 422, sampleBody: () => ({ audience: { kind: "ALL_PARENTS" }, body: "ZZ sweep preview" }) },
  { method: "POST", path: "/api/v1/messaging/broadcasts", summary: "Send a notice to an audience by text and/or app notification", access: ["ADMIN"], request: c.broadcastCreateBodySchema, response: c.broadcastCreatedSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/messaging/broadcasts/{broadcastId}", summary: "One notice's delivery report, person by person", access: ["ADMIN", "PRINCIPAL"], response: c.broadcastDetailSchema, sample: (f) => (f.broadcastId ? `/api/v1/messaging/broadcasts/${f.broadcastId}` : null) },
  // No body: the call is the act, and a resend texts guardians. Sampled only with a notice that has no failed or undelivered message, so it queues nothing (200, requeued 0); when every notice has one, the sweep skips the door rather than text anybody.
  { method: "POST", path: "/api/v1/messaging/broadcasts/{broadcastId}/resend", summary: "Queue a notice's failed messages again", access: ["ADMIN"], response: c.broadcastResentSchema, sample: (f) => (f.quietBroadcastId ? `/api/v1/messaging/broadcasts/${f.quietBroadcastId}/resend` : null) },
];
