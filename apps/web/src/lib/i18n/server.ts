import "server-only";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { sessionForLocale } from "../session";
import { bearerToken } from "../bearer";
import { SESSION_COOKIE } from "../constants";
import { normaliseLocale, LOCALE_COOKIE, LOCALES, type Locale } from "./locales";
import { translator, type Translate } from "./dictionary";
import { relativeTime } from "../dates";

/**
 * Which language this request is answered in.
 *
 * THE USER ROW WINS. `prefs.locale` follows the account to a new phone, a
 * borrowed laptop and a school computer; the cookie does not. The cookie exists
 * for the pages rendered BEFORE a session is known — the login form, an invite
 * landing, the `<html lang>` on first paint — and for those it is the only
 * signal there is.
 *
 * `Accept-Language` is deliberately not consulted. A browser in an Indian school
 * lab is very often set to en-US by whoever installed it, so honouring it would
 * mostly mean overriding a deliberate choice with a default nobody picked. The
 * switcher is one tap from every page; the header is a guess.
 *
 * Wrapped in React `cache`, so a layout, a page and four server components in
 * the same render resolve it once.
 */
export const getLocale = cache(async (): Promise<Locale> => {
  // Not getSession: a request the module gate refuses is still answered in its person's language.
  const session = await sessionForLocale();
  if (session) return (await phoneLocale()) ?? normaliseLocale(session.user.prefs.locale);
  const jar = await cookies();
  return normaliseLocale(jar.get(LOCALE_COOKIE)?.value);
});

/**
 * THE PHONE'S OWN CHOICE (A3-states-16, audit of 5 October 2026). The phone
 * keeps its language in the app and sends it on every call (`X-Language`,
 * else the `Accept-Language` the api-client writes: exactly "en", "hi" or
 * "mr"), so a sentence the server builds for it — an insight's path, a
 * metric's sentence, a refusal — comes back in the language its screen is in
 * even before the account's `prefs.locale` has caught up. Read only for a
 * BEARER request (no session cookie): the web stays on the account's choice,
 * for the reason above, and a browser's header is never consulted. Anything
 * but one of the three codes is ignored.
 */
async function phoneLocale(): Promise<Locale | null> {
  const jar = await cookies();
  if (jar.get(SESSION_COOKIE)?.value) return null;
  const hdrs = await headers();
  if (!bearerToken(hdrs)) return null;
  const raw = (hdrs.get("x-language") ?? hdrs.get("accept-language") ?? "").split(/[,;]/)[0]!.trim().toLowerCase().split("-")[0]!;
  return LOCALES.some((l) => l.code === raw) ? (raw as Locale) : null;
}

/** The `t` for this request. Server components only. */
export async function getT(): Promise<Translate> {
  return translator(await getLocale());
}

/**
 * `relativeTime` bound to this request's language — "in 5 days" becomes
 * "5 दिन में" on a Hindi screen. Server components only, like `getT`.
 */
export async function getRelativeTime(): Promise<(target: Date) => string> {
  const locale = await getLocale();
  return (target: Date) => relativeTime(target, new Date(), locale);
}
