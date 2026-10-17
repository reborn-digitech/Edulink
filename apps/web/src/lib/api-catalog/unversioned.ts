import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/**
 * The day the API sweep takes its register on: a fixed school day before any
 * of the fixture's years, so no report card, term or month the fixtures read
 * counts it. The first run writes pupil 01 PRESENT in the sampled class; every
 * later run sends the same mark with the same clientId, which the register
 * skips as a replay (saveAttendanceBatch) — a write the sweep may make, the
 * same answer each time. Present, so no guardian is told anything.
 */
export const SWEEP_REGISTER_DAY = "2020-01-08";
export const SWEEP_REGISTER_CLIENT_ID = "api-sweep-register-0001";

/**
 * THE /api ROUTES OUTSIDE /api/v1 (A3-inventory-9, audit of 5 October 2026).
 *
 * Two lists, and tests/api-catalog.test.ts holds every route file under
 * src/app/api to exactly one of them (or to the versioned catalog): a new
 * /api route that is neither catalogued nor named below with its reason fails
 * the suite, so a door can no longer sit outside the docs, the sweep and the
 * phone's access gate without anybody having decided it should.
 *
 * UNVERSIONED: doors a person's session calls with JSON in and out, which the
 * web's offline outbox (and, for the register, the phone's) replays by URL —
 * so the path cannot move to /api/v1 without stranding every queued write on
 * every device. They are catalogued as they stand: in openapi.json with
 * `x-access`, walked by api:sweep, read by the phone's matrix. The session's
 * gate (role-gate.ts) reads `module`, `duties` and `limitedRoles` under
 * /api/v1 only, so an entry here names none of them (the test refuses one
 * that does); each handler checks its own roles, as it always did.
 */
export const UNVERSIONED: Endpoint[] = [
  {
    method: "POST",
    path: "/api/attendance",
    summary: "Take or correct a class's register for a day: one mark per pupil, each with the device's idempotency key; safe to replay (a stored key is skipped, an older mark never overwrites a newer one); a future day, a class one may not mark that day, or an archived class is refused",
    access: ["TEACHER", "ADMIN"],
    request: c.attendanceRegisterBodySchema,
    response: c.attendanceRegisterSavedSchema,
    emptyBodyStatus: 422,
    sampleBody: (f) =>
      f.classId && f.studentMembershipId
        ? { classId: f.classId, dateKey: SWEEP_REGISTER_DAY, marks: [{ studentMembershipId: f.studentMembershipId, status: "PRESENT", clientId: SWEEP_REGISTER_CLIENT_ID, markedAt: `${SWEEP_REGISTER_DAY}T03:45:00.000Z` }] }
        : null,
  },
  {
    method: "GET",
    path: "/api/attendance",
    summary: "One class's roster for a day with the marks already made and any absence note from the family (?classId=&date=, today in the school's zone by default); read by whoever may mark it that day",
    access: ["TEACHER", "ADMIN"],
    request: c.attendanceRegisterQuerySchema,
    response: c.attendanceRegisterRosterSchema,
    sample: (f) => (f.classId ? `/api/attendance?classId=${f.classId}&date=${SWEEP_REGISTER_DAY}` : null),
  },
  // No sampleBody: an answer needs a sitting the pupil opened, and answering is the act. The handler refuses a body without its three fields with 422 (R-51; it was 400), before it looks at the sitting.
  {
    method: "POST",
    path: "/api/practice/answer", feature: "QUESTION_BANK",
    summary: "The web's practice answer, the target of its offline outbox and replay-safe as its twin POST /api/v1/practice/answer is (a second delivery returns the stored verdict, replayed: true)",
    access: ["STUDENT"],
    request: c.webPracticeAnswerBodySchema,
    response: c.webPracticeAnsweredSchema,
    emptyBodyStatus: 422,
  },
];

/** A route file that is right to stay out of the catalog, and why. */
export type OutsideTheCatalog = { path: `/api/${string}`; methods: Endpoint["method"][]; reason: string };

/**
 * THE EXCLUSIONS, each with its reason. None of these is a door a person's
 * session calls for JSON: a probe, a scheduler's kick, a browser's redirect
 * handshake, a provider's signed callback, a file's bytes, or the web's own
 * twin of a door the catalog already lists.
 */
export const OUTSIDE_THE_CATALOG: OutsideTheCatalog[] = [
  { path: "/api/health", methods: ["GET"], reason: "The liveness probe for the platform, CI and the sweeps (they stop when it does not answer): no session, no data, not part of the app's contract." },
  { path: "/api/internal/jobs", methods: ["POST"], reason: "The scheduler's kick: answered only by the jobs runner on loopback (404 everywhere else), called by scripts/jobs-runner.mjs in the same container, never by a person." },
  { path: "/api/files/{fileId}", methods: ["GET"], reason: "A stored file's bytes, not JSON. Who may read is decided by the record that holds the file (authorizeFileRead) or a signed ?t= ticket, never by a role, and every refusal is a 404 by design; the doors that list a file or hand out its link are catalogued." },
  { path: "/api/sso/{provider}/start", methods: ["GET"], reason: "A browser redirect to the identity provider (state, nonce and PKCE in a transient cookie); signed out by nature, answering a redirect, not JSON." },
  { path: "/api/sso/{provider}/callback", methods: ["GET", "POST"], reason: "The identity provider's answer to the browser (Apple posts it as a cross-site form); it ends in a session cookie and a redirect, not JSON." },
  // meta-posting (16 Oct 2026)
  { path: "/api/social/meta/start", methods: ["GET"], reason: "A browser redirect to Facebook Login for the school's admin (the state in a transient cookie bound to the school and the admin); answering a redirect, not JSON." },
  { path: "/api/social/meta/callback", methods: ["GET"], reason: "Facebook Login's answer to the browser: the code exchanged and the admin's Pages listed, ending in a sealed ten-minute cookie and a redirect to /admin/settings/social, not JSON." },
  // end meta-posting
  { path: "/api/webhooks/razorpay/{schoolId}", methods: ["POST"], reason: "Razorpay's signed callback for one school's fees account: verified by that school's webhook secret, no session; a person never calls it." },
  { path: "/api/webhooks/gateway/sessions", methods: ["POST"], reason: "The company gateway's signed callback for paid seats and the expert's held share (decision 0004): verified by the company's secret, no session." },
  // plans-pay (17 Oct 2026)
  { path: "/api/webhooks/razorpay/platform", methods: ["POST"], reason: "The company gateway's signed callback for passes bought for a plan (decision 0006): verified by the company's secret, no session; a person never calls it." },
  // end plans-pay
  { path: "/api/webhooks/twilio/status/{schoolId}", methods: ["POST"], reason: "Twilio's signed delivery report for one school's messages: verified by the request signature, no session." },
  { path: "/api/auth/logout", methods: ["POST"], reason: "The web's sign-out form: clears the cookie and redirects to /login. The phone's and the docs' door is POST /api/v1/auth/logout, which is catalogued." },
  { path: "/api/push", methods: ["GET", "POST", "DELETE"], reason: "A browser's Web Push subscription (a PushSubscription object with VAPID keys), which only a browser holds; the phone registers its device through the catalogued /api/v1/me/devices." },
];
