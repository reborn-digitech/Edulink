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
  { method: "GET", path: "/api/v1/account", summary: "My account: names, how I sign in, my preferences", access: "signed-in", response: c.accountOverviewSchema },
  { method: "POST", path: "/api/v1/account/prefs", summary: "Save preferences; a key left out stays as it was", access: "signed-in", request: c.accountPrefsSchema, response: c.okSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/account/locale", summary: "Change my language (prefs.locale)", access: "signed-in", request: c.accountLocaleSchema, response: c.accountLocaleSavedSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/account/avatar", summary: "Set my avatar to one of the preset drawings", access: "signed-in", request: c.accountAvatarSchema, response: c.okSchema, emptyBodyStatus: 422 },
  // ---- devices ----------------------------------------------------------------
  { method: "POST", path: "/api/v1/account/devices/sign-out", summary: "Sign one of my other devices out (this one is a 403)", access: "signed-in", request: c.accountSignOutDeviceSchema, response: c.okSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/account/devices/sign-out-others", summary: "Sign every other device out", access: "signed-in", request: c.accountSignOutOthersSchema, response: c.accountSignedOutSchema, emptyBodyStatus: 422 },
  // ---- the mobile number and the address: code first, then the change ---------
  { method: "POST", path: "/api/v1/account/mobile/code", summary: "Text a code to a new mobile number; nothing is saved yet (429 with Retry-After at the limit)", access: "signed-in", request: c.accountMobileCodeSchema, response: c.accountMobileCodeSentSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/account/mobile/confirm", summary: "The code that came back puts the number on the account", access: "signed-in", request: c.accountCodeConfirmSchema, response: c.okSchema, emptyBodyStatus: 422 },
  { method: "DELETE", path: "/api/v1/account/mobile", summary: "Take my mobile number off the account", access: "signed-in", request: c.accountMobileRemoveSchema, response: c.okSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/account/email/code", summary: "Email a code to a new address; nothing changes yet (429 with Retry-After at the limit)", access: "signed-in", request: c.accountEmailCodeSchema, response: c.accountEmailCodeSentSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/account/email/confirm", summary: "The code that came back moves the address; the old one is told", access: "signed-in", request: c.accountCodeConfirmSchema, response: c.okSchema, emptyBodyStatus: 422 },
  // ---- composing a post -------------------------------------------------------
  { method: "GET", path: "/api/v1/account/post-options", summary: "What the composer may offer me: classes, grades, whole school", access: ["ADMIN", "PRINCIPAL", "TEACHER", "STUDENT"], response: c.accountPostOptionsSchema },
  // ---- an expert booking ------------------------------------------------------
  { method: "GET", path: "/api/v1/account/bookings/{bookingId}", summary: "One expert booking and its conversation", access: BOOKING_SIDES, response: c.accountBookingSchema, sample: () => null },
  { method: "POST", path: "/api/v1/account/bookings/{bookingId}/messages", summary: "Write in a booking's conversation", access: BOOKING_SIDES, request: c.accountBookingMessageSchema, response: c.okSchema, emptyBodyStatus: 422, sample: () => null },
  { method: "POST", path: "/api/v1/account/bookings/{bookingId}/cancel", summary: "Cancel a booking (either side; the hour goes back on offer)", access: BOOKING_SIDES, response: c.okSchema, sample: () => null },
  // ---- two-step sign-in (TOTP): the office, the head and the operator ------------
  // The status is every signed-in person's (it says whether they may turn it on); turning it on and off is theirs alone, and the lib refuses the rest with 403. No sampleBody: a valid code is a secret only an authenticator app holds.
  { method: "GET", path: "/api/v1/account/totp", summary: "Two-step sign-in: whether it is on for me, and whether I may turn it on", access: "signed-in", response: c.totpStatusSchema },
  { method: "POST", path: "/api/v1/account/totp/start", summary: "Start two-step sign-in: a fresh secret and its otpauth:// link for the app; nothing guards the sign-in until confirmed", access: ["ADMIN", "PRINCIPAL"], response: c.totpStartedSchema },
  { method: "POST", path: "/api/v1/account/totp/confirm", summary: "One right code from the app turns two-step sign-in on and answers the eight recovery codes, this once", access: ["ADMIN", "PRINCIPAL"], request: c.totpConfirmSchema, response: c.totpConfirmedSchema, emptyBodyStatus: 422 },
  { method: "POST", path: "/api/v1/account/totp/disable", summary: "A code from the app, or a recovery code, turns two-step sign-in off", access: ["ADMIN", "PRINCIPAL"], request: c.totpDisableSchema, response: c.okSchema, emptyBodyStatus: 422 },
];
