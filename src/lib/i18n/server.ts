import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { getSession } from "../session";
import { normaliseLocale, LOCALE_COOKIE, type Locale } from "./locales";
import { translator, type Translate } from "./dictionary";

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
  const session = await getSession();
  if (session) return normaliseLocale(session.user.prefs.locale);
  const jar = await cookies();
  return normaliseLocale(jar.get(LOCALE_COOKIE)?.value);
});

/** The `t` for this request. Server components only. */
export async function getT(): Promise<Translate> {
  return translator(await getLocale());
}
