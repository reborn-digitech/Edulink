/** Shared with the client (the intake result page); the lib itself is server-only. */
export const FIRST_SIGNIN_TTL_DAYS = 14;
/**
 * TA-037: the office's reset code for a pupil who forgot the password works for a day, not a fortnight. The sentences
 * firstSignin.resetPanelBody, notifResetBody and notifResetHeadBody say "24 hours" in words (a count placeholder there
 * would need a form for one it never takes); tests/ta-decision-037-office-reset.test.ts holds the two together.
 */
export const OFFICE_RESET_TTL_HOURS = 24;
