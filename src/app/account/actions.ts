"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getSession, DEFAULT_PREFS, type UserPrefs } from "@/lib/session";
import { prefsSchema, fieldErrors, type FieldErrors } from "@/lib/validation";
import { readJson, writeJson } from "@/lib/json";
import { audit } from "@/lib/audit";
import { revokeOtherSessions, revokeSession } from "@/lib/session";
import { LOCALE_COOKIE, normaliseLocale, type Locale } from "@/lib/i18n";
import { normalisePhone } from "@/lib/phone";
import { requireApiUser } from "@/lib/tenancy";

export type PrefsState = { ok: boolean; errors: FieldErrors };

/**
 * Saves appearance and notification preferences.
 *
 * The client also mirrors appearance into localStorage so the blocking theme
 * script can apply it before first paint; this row is the source of truth that
 * follows the user to a new device.
 */
export async function savePrefs(input: unknown): Promise<PrefsState> {
  const session = await getSession();
  if (!session) return { ok: false, errors: { _form: "Please log in again." } };

  const parsed = prefsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const next = parsed.data;

  // Quiet hours with identical start and end would silence everything forever
  // — almost certainly not what someone means by "22:00 to 22:00".
  if (next.quietHours && next.quietHours.start === next.quietHours.end) {
    return {
      ok: false,
      errors: { "quietHours.end": "Start and end cannot be the same time." },
    };
  }

  const current = readJson<UserPrefs>(
    (await db.user.findUniqueOrThrow({ where: { id: session.user.id }, select: { prefs: true } }))
      .prefs,
    DEFAULT_PREFS,
  );

  await db.user.update({
    where: { id: session.user.id },
    data: { prefs: writeJson({ ...current, ...next }) },
  });

  await audit({
    schoolId: session.schoolId,
    actorUserId: session.user.id,
    action: "prefs.update",
    meta: { theme: next.theme, contrast: next.contrast, font: next.font },
  });

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

  if (session) {
    const current = readJson<UserPrefs>(
      (await db.user.findUniqueOrThrow({ where: { id: session.user.id }, select: { prefs: true } }))
        .prefs,
      DEFAULT_PREFS,
    );
    await db.user.update({
      where: { id: session.user.id },
      data: { prefs: writeJson({ ...current, locale }) },
    });
  }

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
  const session = await getSession();
  if (!session) return { ok: false, error: "Please log in again." };

  if (sessionId === session.sessionId) {
    return { ok: false, error: "That is this device. Use Sign out instead." };
  }

  const revoked = await revokeSession(sessionId, session.user.id);
  if (!revoked) return { ok: false, error: "That device is already signed out." };

  await audit({
    actorUserId: session.user.id,
    action: "session.revoke",
    targetType: "Session",
    targetId: sessionId,
  });

  revalidatePath("/account");
  return { ok: true };
}

export async function signOutEverywhereElse(): Promise<{ ok: boolean; count: number }> {
  const session = await getSession();
  if (!session) return { ok: false, count: 0 };

  const count = await revokeOtherSessions(session.user.id, session.sessionId);

  await audit({
    actorUserId: session.user.id,
    action: "session.revoke.others",
    meta: { count },
  });

  revalidatePath("/account");
  return { ok: true, count };
}

/* -------------------------------------------------------------------------- */
/* Your mobile number                                                          */
/* -------------------------------------------------------------------------- */

export type PhoneState = { ok: boolean; error?: string; phone?: string | null };

/**
 * Adds, changes or removes the mobile number this account signs in with.
 *
 * NORMALISED BEFORE IT IS STORED, always, through the same function the login
 * box and the reset form use. `User.phone` is unique, so two spellings of one
 * number are two accounts — or, more often, one account and one unique-constraint
 * error that means nothing to the person reading it.
 *
 * THE CLASH IS REPORTED PLAINLY, and that is a deliberate exception to the
 * enumeration rule this codebase follows everywhere else. Refusing with "that
 * did not work" would leave somebody retyping a number that is correct; and the
 * person being told is signed in, on their own settings page, typing a number
 * they claim is theirs. The failure they need to hear is "somebody already has
 * this", because the answer is to talk to their school rather than to try again.
 *
 * NOT VERIFIED YET. Storing a number nobody has proved they hold means a reset
 * code can be sent to it — so `phoneVerifiedAt` stays null and is the hook for
 * a confirm-by-code step. Said out loud on the page rather than implied.
 */
export async function saveMobile(raw: string): Promise<PhoneState> {
  const session = await requireApiUser();
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    await db.user.update({
      where: { id: session.user.id },
      data: { phone: null, phoneVerifiedAt: null },
    });
    await audit({ actorUserId: session.user.id, action: "account.mobile.remove" });
    revalidatePath("/account");
    return { ok: true, phone: null };
  }

  const phone = normalisePhone(trimmed);
  if (!phone) {
    return {
      ok: false,
      error: "That is not a mobile number we can use. Try it with the country code, like +91 98765 43210.",
    };
  }

  const taken = await db.user.findFirst({
    where: { phone, id: { not: session.user.id } },
    select: { id: true },
  });
  if (taken) {
    return {
      ok: false,
      error: "Another account already uses that number. If it is yours, ask your school for help.",
    };
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { phone, phoneVerifiedAt: null },
  });
  await audit({ actorUserId: session.user.id, action: "account.mobile.set" });
  revalidatePath("/account");
  return { ok: true, phone };
}
