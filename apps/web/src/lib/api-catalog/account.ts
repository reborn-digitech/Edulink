import * as c from "@edulink/contracts";
import type { Endpoint } from "./types";

/** Who a booking's conversation is between: the booking school's staff and the expert. getBooking 404s everyone else. */
const BOOKING_SIDES: c.RoleCode[] = ["ADMIN", "TEACHER", "EXPERT"];

/**
 * account: endpoints added for the phone's remaining screens (September 2026)
 * — the account page, the avatar, the two code steps for the mobile number and
 * the address, the composer's choices and a booking's conversation. None of
 * the body-taking entries carries a sampleBody: a valid body here changes the
 * sweep actor's own account (their language, their devices, a code texted),
 * so the sweep asserts the 422 alone.
 */
export const ACCOUNT: Endpoint[] = [
  // ---- the account page -------------------------------------------------------
  { method: "GET", path: "/api/v1/account", summary: "My account: names, how I sign in, my preferences", access: "signed-in", limitedRoles: c.ALL_LIMITED_ROLES, response: c.accountOverviewSchema },
  { method: "POST", path: "/api/v1/account/prefs", summary: "Save preferences: the channels and the quiet hours are required every time (quiet hours null turns them off); a theme, contrast, font or motion left out stays as it was", access: "signed-in", limitedRoles: c.ALL_LIMITED_ROLES, request: c.accountPrefsSchema, response: c.okSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/account/locale", summary: "Change my language (prefs.locale)", access: "signed-in", limitedRoles: c.ALL_LIMITED_ROLES, request: c.accountLocaleSchema, response: c.accountLocaleSavedSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/account/avatar", summary: "Set my avatar to one of the preset drawings", access: "signed-in", limitedRoles: c.ALL_LIMITED_ROLES, request: c.accountAvatarSchema, response: c.okSchema, emptyBodyStatus: 422 },
  // ---- devices ----------------------------------------------------------------
  { method: "POST", path: "/api/v1/account/devices/sign-out", summary: "Sign one of my other devices out (this one is a 403)", access: "signed-in", limitedRoles: c.ALL_LIMITED_ROLES, request: c.accountSignOutDeviceSchema, response: c.okSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/account/devices/sign-out-others", summary: "Sign every other device out", access: "signed-in", limitedRoles: c.ALL_LIMITED_ROLES, request: c.accountSignOutOthersSchema, response: c.accountSignedOutSchema, emptyBodyStatus: 422 },
  // ---- the mobile number and the address: code first, then the change ---------
  { method: "POST", path: "/api/v1/account/mobile/code", summary: "Text a code to a new mobile number; nothing is saved yet (429 with Retry-After at the limit)", access: "signed-in", limitedRoles: c.ALL_LIMITED_ROLES, request: c.accountMobileCodeSchema, response: c.accountMobileCodeSentSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/account/mobile/confirm", summary: "The code that came back puts the number on the account", access: "signed-in", limitedRoles: c.ALL_LIMITED_ROLES, request: c.accountCodeConfirmSchema, response: c.okSchema, emptyBodyStatus: 422 },
  { method: "DELETE", path: "/api/v1/account/mobile", summary: "Take my mobile number off the account", access: "signed-in", limitedRoles: c.ALL_LIMITED_ROLES, request: c.accountMobileRemoveSchema, response: c.okSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/account/email/code", summary: "Email a code to a new address; nothing changes yet (429 with Retry-After at the limit)", access: "signed-in", limitedRoles: c.ALL_LIMITED_ROLES, request: c.accountEmailCodeSchema, response: c.accountEmailCodeSentSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/account/email/confirm", summary: "The code that came back moves the address; the old one is told", access: "signed-in", limitedRoles: c.ALL_LIMITED_ROLES, request: c.accountCodeConfirmSchema, response: c.okSchema, emptyBodyStatus: 422 },
  // ---- composing a post -------------------------------------------------------
  { method: "GET", path: "/api/v1/account/post-options", summary: "What the composer may offer me: classes, grades, whole school (a college's six staff roles too)", access: ["ADMIN", "PRINCIPAL", "TEACHER", "STUDENT", "FACULTY", "HOD", "EXAM_CONTROLLER", "IQAC", "TPO", "ACCOUNTS"], response: c.accountPostOptionsSchema },
  // ---- an expert booking ------------------------------------------------------
  // LEFT SKIPPED ON PURPOSE. A role that is never a side of a booking (the head, a pupil, a guardian) is
  // answered 404 by design, never "not yours", so ids cannot be probed — and for the write, the empty
  // body's 422 comes before the side is asked. The sweep expects 403 from every role outside `access`, so
  // any sample here would be counted unexpected for three roles; widening `access` to make it pass would
  // tell the phone's gate a pupil may open a booking. tests/api-v1-account.test.ts proves the three doors.
  { method: "GET", path: "/api/v1/account/bookings/{bookingId}", summary: "One expert booking and its conversation", access: BOOKING_SIDES, response: c.accountBookingSchema, emptyBodyStatus: 404, sample: "/api/v1/account/bookings/zz-sweep-no-such-booking" }, // R-30: zz:fixtures makes no expert booking; an id no school holds, 404 to every side
  { method: "POST", path: "/api/v1/account/bookings/{bookingId}/messages", summary: "Write in a booking's conversation", access: BOOKING_SIDES, request: c.accountBookingMessageSchema, response: c.okSchema, emptyBodyStatus: 422, sample: "/api/v1/account/bookings/zz-sweep-no-such-booking/messages" }, // R-30: no expert booking in the fixtures; the empty body's 422
  { method: "POST", path: "/api/v1/account/bookings/{bookingId}/cancel", summary: "Cancel a booking (either side; the hour goes back on offer)", access: BOOKING_SIDES, response: c.okSchema, emptyBodyStatus: 404, sample: "/api/v1/account/bookings/zz-sweep-no-such-booking/cancel" }, // R-30: no expert booking in the fixtures, and cancelling a real one is an act; an id no school holds, 404
  // ---- two-step sign-in (TOTP): the office, the head and the operator ------------
  // The status is every signed-in person's (it says whether they may turn it on). Two-step sign-in belongs to the ACCOUNT, not to the
  // session's active role: the secret guards every sign-in whatever context follows, so two-factor.ts decides eligibility by the
  // person's memberships (an active ADMIN or PRINCIPAL anywhere, or the operator), which `start` alone checks — the role list on it is
  // that rule as the catalog can say it (a teacher who is also an office member elsewhere is admitted). `confirm` needs the pending
  // secret only `start` makes (409 otherwise) and `disable` must stay open to a person whose office role has ended, so both are any
  // signed-in person's and read the body first. No sampleBody: a valid code is a secret only an authenticator app holds.
  { method: "GET", path: "/api/v1/account/totp", summary: "Two-step sign-in: whether it is on for me, and whether I may turn it on", access: "signed-in", limitedRoles: c.ALL_LIMITED_ROLES, response: c.totpStatusSchema },
  { method: "POST", path: "/api/v1/account/totp/start", summary: "Start two-step sign-in: a fresh secret and its otpauth:// link for the app; nothing guards the sign-in until confirmed. By the account: an active ADMIN or PRINCIPAL membership at any school, or the operator, whatever the session's role (403 otherwise). The body carries the account's password (422 on `password` when missing or wrong, 429 past the per-person limit); an account with no password is 403 unless its session was signed in within ten minutes", access: "account", request: c.totpStartSchema, response: c.totpStartedSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/account/totp/confirm", summary: "One right code from the app turns two-step sign-in on and answers the eight recovery codes, this once; every other session of the account is signed out (signedOut says how many)", access: "signed-in", limitedRoles: c.ALL_LIMITED_ROLES, request: c.totpConfirmSchema, response: c.totpConfirmedSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/account/totp/disable", summary: "A code from the app, or a recovery code, turns two-step sign-in off", access: "signed-in", limitedRoles: c.ALL_LIMITED_ROLES, request: c.totpDisableSchema, response: c.okSchema, emptyBodyStatus: 422 },
];
