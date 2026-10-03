import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/** Auth, me, devices, events, and the outbox's two writes. */
export const CORE: Endpoint[] = [
  // ---- auth ---------------------------------------------------------------
  { method: "POST", path: "/api/v1/auth/login", summary: "Sign in with a password (a person with two-step sign-in on gets TWO_FACTOR and a challenge for /auth/totp instead of a session)", access: "anyone", request: c.passwordLoginSchema, response: c.signInResponseSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/auth/magic-link", summary: "Email a sign-in link", access: "anyone", request: c.magicLinkRequestSchema, response: c.okSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/auth/magic-link/consume", summary: "Turn a sign-in link's token into a session (or TWO_FACTOR and a challenge, as /auth/login)", access: "anyone", request: c.magicLinkConsumeSchema, response: c.signInResponseSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/auth/first-signin", summary: "A pupil's first sign-in with the code the school issued", access: "anyone", request: c.firstSignInSchema, response: c.sessionResponseSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/auth/sso/exchange", summary: "Exchange the one-time code from the SSO deep link for a session (or TWO_FACTOR and a challenge, as /auth/login)", access: "anyone", request: c.ssoExchangeSchema, response: c.signInResponseSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/auth/totp", summary: "The second step of a two-step sign-in: the challenge and a code from the authenticator app, or one recovery code, for the session the first step would have minted", access: "anyone", request: c.totpSignInSchema, response: c.sessionResponseSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/auth/logout", summary: "Revoke this session", access: "signed-in", limitedRoles: ["DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS"], response: c.okSchema },
  // ---- me -----------------------------------------------------------------
  { method: "GET", path: "/api/v1/me", summary: "Who I am, where I belong, what is active", access: "signed-in", limitedRoles: ["DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS"], response: c.meSchema },
  { method: "POST", path: "/api/v1/me/context", summary: "Switch the active school and role", access: "signed-in", limitedRoles: ["DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS"], request: c.switchContextSchema, response: c.meSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/me/sessions", summary: "My signed-in devices", access: "signed-in", limitedRoles: ["DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS"], response: c.sessionsListSchema },
  // The sweep's sample is a session minted for its office actor alone (scripts/api-sweep.ts doorFixture): the ADMIN signs it out (200), every other role is told it is not theirs (404), and the run deletes it at the end.
  { method: "DELETE", path: "/api/v1/me/sessions/{sessionId}", summary: "Sign a device out", access: "signed-in", limitedRoles: ["DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS"], response: c.okSchema, sample: (f) => (f.mySessionId ? `/api/v1/me/sessions/${f.mySessionId}` : null) },
  { method: "POST", path: "/api/v1/me/devices", summary: "Register this device for push", access: "signed-in", limitedRoles: ["DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS"], request: c.deviceRegisterSchema, response: c.okSchema, emptyBodyStatus: 422 },
  { method: "DELETE", path: "/api/v1/me/devices", summary: "Stop push to this device", access: "signed-in", limitedRoles: ["DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS"], request: c.deviceRemoveSchema, response: c.okSchema, emptyBodyStatus: 422 },
  { method: "GET", path: "/api/v1/events", summary: "Live events for this session (server-sent events)", access: "signed-in", limitedRoles: ["DRIVER", "LIBRARIAN", "WARDEN", "ALUMNUS"], response: c.okSchema },
  // A signed link writes nothing. The sample is a document of the sweep parent's application: the parent and the office get a link (200), everyone else the 404 the file route gives.
  { method: "POST", path: "/api/v1/files/{fileId}/link", summary: "A five-minute link that opens one file outside the app (a PDF in the phone's browser), for someone allowed to read it", access: "signed-in", response: c.fileLinkSchema, sample: (f) => (f.fileId ? `/api/v1/files/${encodeURIComponent(f.fileId)}/link` : null) },
  // ---- writes the outbox replays -------------------------------------------
  { method: "POST", path: "/api/v1/marks", summary: "Save one exam sheet for one class", access: ["TEACHER", "ADMIN"], request: c.marksBatchSchema, response: c.marksSavedSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/messages", summary: "Send one message into a room", access: "signed-in", limitedRoles: ["ALUMNUS"], request: c.conversationMessageSchema, response: c.messageSentSchema, emptyBodyStatus: 422 },
];
