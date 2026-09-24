"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { prefsSchema, fieldErrors, type FieldErrors } from "@/lib/validation";
import { saveUserPrefs, setUserLocale, signOutOneDevice, signOutOtherDevices } from "@/lib/account";
import { LOCALE_COOKIE, normaliseLocale, type Locale } from "@/lib/i18n";
import { getT } from "@/lib/i18n/server";
import { refusalText } from "@/lib/i18n/refusal";
import { requireApiUser } from "@/lib/tenancy";
import {
  startPhoneChange,
  confirmPhoneChange,
  removePhone,
  startEmailChange,
  confirmEmailChange,
} from "@/lib/passwords";

export type PrefsState = { ok: boolean; errors: FieldErrors };

/**
 * Saves appearance and notification preferences.
 *
 * The client also mirrors appearance into localStorage so the blocking theme
 * script can apply it before first paint; this row is the source of truth that
 * follows the user to a new device.
 */
export async function savePrefs(input: unknown): Promise<PrefsState> {
  const t = await getT();
  const session = await getSession();
  if (!session) return { ok: false, errors: { _form: t("common.logInAgain") } };

  const parsed = prefsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error, t) };

  // The rule and the write live in lib/account.ts, which the phone's
  // /api/v1/account/prefs calls too.
  const result = await saveUserPrefs(session, parsed.data);
  if (!result.ok) return { ok: false, errors: { [result.field]: t(result.errorKey) } };

  revalidatePath("/account");
  return { ok: true, errors: {} };
}

/**
 * Changes the language, everywhere at once.
 *
 * WRITES BOTH PLACES, and they are not redundant. `prefs.locale` is the truth:
 * it follows the account to a borrowed laptop and a school computer. The cookie
 * is a copy for the pages rendered before a session is resolved — the login
 * form, an invite landing, and `<html lang>` on first paint, which a screen
 * reader reads before any of this code runs.
 *
 * The SAME FIELD Practice already read. This is deliberately not a second
 * setting: a child who switches the app to मराठी gets Marathi questions, and one
 * who switches the questions gets a Marathi app. Two switches for one preference
 * is how you end up with a Marathi app asking questions in Hindi.
 *
 * Accepts an unvalidated value on purpose and narrows it here rather than
 * trusting the caller — `normaliseLocale` turns anything unrecognised into
 * English instead of writing junk onto the user row.
 */
export async function setLocale(raw: string): Promise<{ ok: boolean; locale: Locale }> {
  const locale = normaliseLocale(raw);
  const session = await getSession();

  if (session) await setUserLocale(session.user.id, locale);

  // Set even when signed out, so the login page can be read in the language the
  // reader picked on the way in. Not httpOnly and not a security boundary: the
  // worst a forged value can do is show somebody the wrong language.
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 365 * 86_400,
  });

  revalidatePath("/", "layout");
  return { ok: true, locale };
}

/** Device management — the reason sessions are server-side and revocable. */
export async function signOutDevice(sessionId: string): Promise<{ ok: boolean; error?: string }> {
  const t = await getT();
  const session = await getSession();
  if (!session) return { ok: false, error: t("common.logInAgain") };

  const result = await signOutOneDevice(session, sessionId);
  if (!result.ok) return { ok: false, error: t(result.errorKey) };

  revalidatePath("/account");
  return { ok: true };
}

export async function signOutEverywhereElse(): Promise<{ ok: boolean; count: number }> {
  const session = await getSession();
  if (!session) return { ok: false, count: 0 };

  const count = await signOutOtherDevices(session);

  revalidatePath("/account");
  return { ok: true, count };
}

/* -------------------------------------------------------------------------- */
/* Your mobile number                                                          */
/* -------------------------------------------------------------------------- */

export type PhoneState = { ok: boolean; error?: string; hint?: string };

/**
 * TWO STEPS, AND THE FIRST ONE WRITES NOTHING.
 *
 * This was one step: type a number, it lands on the account, `phoneVerifiedAt`
 * stays null, and the page apologises for that in small print. Which meant a
 * mistyped digit pointed somebody's password-reset codes at a stranger's phone
 * permanently — and they would not find out until the day they needed one.
 *
 * Now the number waits in a token until a code sent TO IT comes back. Nothing
 * that looks up an account by phone can see it in the meantime, so an
 * unconfirmed number is not a login and not a reset destination.
 */
/** The lib mints a KEY; this boundary turns it into the reader's words. */
async function phoneState(result: Awaited<ReturnType<typeof startPhoneChange>>): Promise<PhoneState> {
  if (result.ok || !result.errorKey) return { ok: result.ok, hint: result.hint };
  const t = await getT();
  return {
    ok: false,
    hint: result.hint,
    error: refusalText(t, { errorKey: result.errorKey, retryAfterSeconds: result.retryAfterSeconds }),
  };
}

/**
 * WITH THE PASSWORD. A session is what somebody with a borrowed laptop has;
 * the password is what they do not, and a number is where reset codes go.
 */
export async function sendMobileCode(raw: string, password: string): Promise<PhoneState> {
  const session = await requireApiUser();
  return phoneState(await startPhoneChange(session.user.id, raw, password ?? ""));
}

export async function confirmMobile(code: string): Promise<PhoneState> {
  const session = await requireApiUser();
  // This session stays; every other device is signed out by the lib.
  const result = await confirmPhoneChange(session.user.id, code, session.sessionId);
  if (result.ok) revalidatePath("/account");
  return phoneState(result);
}

/** Taking it off needs no code — see the note on `removePhone`. */
export async function clearMobile(): Promise<PhoneState> {
  const session = await requireApiUser();
  const result = await removePhone(session.user.id);
  revalidatePath("/account");
  return phoneState(result);
}

/* -------------------------------------------------------------------------- */
/* Your email address                                                          */
/* -------------------------------------------------------------------------- */

export type EmailState = { ok: boolean; error?: string; sentTo?: string };

/**
 * THE SAME TWO STEPS AS THE MOBILE NUMBER, and that is the point rather than
 * duplication. An address and a number are the two things this account can be
 * reached at, and "prove you hold it" should not be two different experiences
 * depending on which one somebody is changing.
 *
 * There is no `clearEmail` to match `clearMobile`. `User.email` is the login
 * key — for a pupil who joined with a class code it holds their handle, which is
 * the only thing they sign in with — so emptying it makes an account nobody can
 * get into. Changing replaces; it never clears.
 */
async function emailState(result: Awaited<ReturnType<typeof startEmailChange>>): Promise<EmailState> {
  if (result.ok || !result.errorKey) return { ok: result.ok, sentTo: result.sentTo };
  const t = await getT();
  return {
    ok: false,
    error: refusalText(t, { errorKey: result.errorKey, retryAfterSeconds: result.retryAfterSeconds }),
  };
}

/** With the password, for the reason `sendMobileCode` gives — and the address is the login. */
export async function sendEmailCode(raw: string, password: string): Promise<EmailState> {
  const session = await requireApiUser();
  return emailState(await startEmailChange(session.user.id, raw, password ?? ""));
}

export async function confirmEmail(code: string): Promise<EmailState> {
  const session = await requireApiUser();
  const result = await confirmEmailChange(session.user.id, code, session.sessionId);
  // The header on this page shows the address, and so does the shell.
  if (result.ok) revalidatePath("/account");
  return emailState(result);
}
