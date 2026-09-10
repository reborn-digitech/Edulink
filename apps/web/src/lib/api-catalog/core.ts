import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/** Auth, me, devices, events, and the outbox's two writes. */
export const CORE: Endpoint[] = [
  // ---- auth ---------------------------------------------------------------
  { method: "POST", path: "/api/v1/auth/login", summary: "Sign in with a password", access: "anyone", request: c.passwordLoginSchema, response: c.sessionResponseSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/auth/magic-link", summary: "Email a sign-in link", access: "anyone", request: c.magicLinkRequestSchema, response: c.okSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/auth/magic-link/consume", summary: "Turn a sign-in link's token into a session", access: "anyone", request: c.magicLinkConsumeSchema, response: c.sessionResponseSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/auth/first-signin", summary: "A pupil's first sign-in with the code the school issued", access: "anyone", request: c.firstSignInSchema, response: c.sessionResponseSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/auth/sso/exchange", summary: "Exchange the one-time code from the SSO deep link for a session", access: "anyone", request: c.ssoExchangeSchema, response: c.sessionResponseSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/auth/logout", summary: "Revoke this session", access: "signed-in", response: c.okSchema },
  // ---- me -----------------------------------------------------------------
  { method: "GET", path: "/api/v1/me", summary: "Who I am, where I belong, what is active", access: "signed-in", response: c.meSchema },
  { method: "POST", path: "/api/v1/me/context", summary: "Switch the active school and role", access: "signed-in", request: c.switchContextSchema, response: c.meSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/me/sessions", summary: "My signed-in devices", access: "signed-in", response: c.sessionsListSchema },
  { method: "DELETE", path: "/api/v1/me/sessions/{sessionId}", summary: "Sign a device out", access: "signed-in", response: c.okSchema },
  { method: "POST", path: "/api/v1/me/devices", summary: "Register this device for push", access: "signed-in", request: c.deviceRegisterSchema, response: c.okSchema, emptyBodyStatus: 422 },
  { method: "DELETE", path: "/api/v1/me/devices", summary: "Stop push to this device", access: "signed-in", request: c.deviceRemoveSchema, response: c.okSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/events", summary: "Live events for this session (server-sent events)", access: "signed-in", response: c.okSchema },
  { method: "POST", path: "/api/v1/files/{fileId}/link", summary: "A five-minute link that opens one file outside the app (a PDF in the phone's browser), for someone allowed to read it", access: "signed-in", response: c.fileLinkSchema },
  // ---- writes the outbox replays -------------------------------------------
  { method: "POST", path: "/api/v1/marks", summary: "Save one exam sheet for one class", access: ["TEACHER", "ADMIN"], request: c.marksBatchSchema, response: c.marksSavedSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/messages", summary: "Send one message into a room", access: "signed-in", request: c.conversationMessageSchema, response: c.messageSentSchema, emptyBodyStatus: 422 },
];
