import { db } from "@/lib/db";
import { DEFAULT_PREFS, revokeOtherSessions, revokeSession, type ActiveContext, type UserPrefs } from "@/lib/session";
import { readJson, writeJson } from "@/lib/json";
import { audit } from "@/lib/audit";
import { normaliseLocale, type Locale } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AccessError } from "@/lib/tenancy";
import { HANDLE_DOMAIN, toDisplayLoginName } from "@/lib/login-name";
import { hasRecord } from "@/lib/student-record";
import { postableClasses } from "@/lib/bulletin";
import { AVATAR_PRESETS } from "@/components/ui/avatar";

/**
 * Your own account, as the library rather than as a page.
 *
 * These used to live inside `app/account/actions.ts`, which meant the phone
 * could only reach them by re-implementing them — and a second copy of "quiet
 * hours cannot start and end at the same minute" is a copy that drifts. The
 * server actions and the /api/v1/account handlers now both call what is here;
 * the actions keep what is theirs alone (the language cookie, revalidation,
 * turning a key into the reader's words).
 */

/* -------------------------------------------------------------------------- */
/* Preferences                                                                 */
/* -------------------------------------------------------------------------- */

export type PrefsResult = { ok: true } | { ok: false; field: string; errorKey: TranslationKey };

/**
 * Saves preferences over what is on the row.
 *
 * A PATCH, deliberately: the web form sends every field (its parse fills the
 * defaults), so for it this is the same merge it always was; the phone sends
 * only the notification section it shows, and must not reset the colour scheme
 * somebody chose on a laptop by leaving it out.
 */
export async function saveUserPrefs(ctx: ActiveContext, next: Partial<UserPrefs>): Promise<PrefsResult> {
  // Quiet hours with identical start and end would silence everything forever
  // — almost certainly not what someone means by "22:00 to 22:00".
  if (next.quietHours && next.quietHours.start === next.quietHours.end) {
    return { ok: false, field: "quietHours.end", errorKey: "account.quietSameTime" };
  }

  const current = readJson<UserPrefs>(
    (await db.user.findUniqueOrThrow({ where: { id: ctx.user.id }, select: { prefs: true } })).prefs,
    DEFAULT_PREFS,
  );

  await db.user.update({
    where: { id: ctx.user.id },
    data: { prefs: writeJson({ ...current, ...next }) },
  });

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "prefs.update",
    meta: { theme: next.theme, contrast: next.contrast, font: next.font },
  });

  return { ok: true };
}

/**
 * The language, on the account — `prefs.locale`, the same field Practice reads.
 * Narrowed here rather than trusted: anything unrecognised becomes English.
 */
export async function setUserLocale(userId: string, raw: string): Promise<Locale> {
  const locale = normaliseLocale(raw);
  const current = readJson<UserPrefs>(
    (await db.user.findUniqueOrThrow({ where: { id: userId }, select: { prefs: true } })).prefs,
    DEFAULT_PREFS,
  );
  await db.user.update({ where: { id: userId }, data: { prefs: writeJson({ ...current, locale }) } });
  return locale;
}

/* -------------------------------------------------------------------------- */
/* Devices                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Signs one of MY OTHER devices out. The one in hand is refused: signing
 * yourself out is the sign-out button, which also clears what the device holds.
 */
export async function signOutOneDevice(
  ctx: ActiveContext,
  sessionId: string,
): Promise<{ ok: true } | { ok: false; errorKey: TranslationKey }> {
  if (sessionId === ctx.sessionId) return { ok: false, errorKey: "account.thisDeviceUseSignOut" };
  const revoked = await revokeSession(sessionId, ctx.user.id);
  if (!revoked) return { ok: false, errorKey: "account.deviceAlreadyOut" };
  await audit({ actorUserId: ctx.user.id, action: "session.revoke", targetType: "Session", targetId: sessionId });
  return { ok: true };
}

/** Every session of mine but this one. Answers how many went. */
export async function signOutOtherDevices(ctx: ActiveContext): Promise<number> {
  const count = await revokeOtherSessions(ctx.user.id, ctx.sessionId);
  await audit({ actorUserId: ctx.user.id, action: "session.revoke.others", meta: { count } });
  return count;
}

/* -------------------------------------------------------------------------- */
/* Avatar                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Sets my avatar to one of the preset drawings — the only kind there is. Pupils
 * and teachers save theirs with the rest of their profile; this is for the
 * person whose profile form has no avatar field, which today is the expert.
 * Anything that is not a preset is refused, for the reason `saveProfile` gives:
 * otherwise the key is an unsanitised string rendered into other people's pages.
 */
export async function setOwnAvatar(
  ctx: ActiveContext,
  avatarKey: string,
): Promise<{ ok: true } | { ok: false; errorKey: TranslationKey }> {
  if (!AVATAR_PRESETS.includes(avatarKey)) return { ok: false, errorKey: "common.checkTheForm" };
  await db.user.update({ where: { id: ctx.user.id }, data: { avatarKey } });
  await audit({ actorUserId: ctx.user.id, action: "profile.avatar", meta: { avatarKey } });
  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Reads                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * What the account page shows about the person: the names, how they sign in,
 * their preferences and whether they have a school record to open. A
 * self-joined pupil's handle lives in the email column against a non-routable
 * domain, so it comes back as a login name and never as an email.
 */
export async function accountOverview(ctx: ActiveContext) {
  const user = await db.user.findUniqueOrThrow({
    where: { id: ctx.user.id },
    select: {
      name: true,
      preferredName: true,
      email: true,
      phone: true,
      phoneVerifiedAt: true,
      avatarKey: true,
      prefs: true,
      emailVerifiedAt: true,
      createdAt: true,
    },
  });
  const prefs = readJson<UserPrefs>(user.prefs, DEFAULT_PREFS);
  const isHandle = user.email?.endsWith(`@${HANDLE_DOMAIN}`) ?? false;
  return {
    name: user.name,
    preferredName: user.preferredName,
    email: isHandle ? null : user.email,
    loginName: isHandle ? toDisplayLoginName(user.email) : null,
    emailConfirmed: user.emailVerifiedAt !== null,
    phone: user.phone,
    phoneConfirmed: user.phoneVerifiedAt !== null,
    avatarKey: user.avatarKey,
    createdAt: user.createdAt.toISOString(),
    prefs: {
      locale: normaliseLocale(prefs.locale),
      theme: prefs.theme,
      contrast: prefs.contrast,
      font: prefs.font,
      motion: prefs.motion,
      channels: prefs.channels,
      quietHours: prefs.quietHours,
    },
    showRecord: await hasRecord(ctx),
  };
}

/**
 * What the composer may offer this person: the classes they may post to, the
 * grades a staff notice can be narrowed to, and whether "whole school" is
 * theirs to choose. The same reads /bulletin/new makes; `createPost` still
 * decides what actually lands.
 */
export async function bulletinComposeOptions(ctx: ActiveContext) {
  if (!ctx.schoolId || !ctx.role) throw new AccessError("access.noActiveSchoolSelected");
  const classes = await postableClasses(ctx);
  const isStudent = ctx.role === "STUDENT";
  const grades = isStudent
    ? []
    : (
        await db.class.findMany({
          where: { schoolId: ctx.schoolId, archivedAt: null, gradeLevel: { not: null } },
          select: { gradeLevel: true },
          distinct: ["gradeLevel"],
        })
      )
        .map((c) => c.gradeLevel!)
        .sort((a, b) => Number(a) - Number(b) || a.localeCompare(b));
  return {
    role: ctx.role,
    classes: classes.map((c) => ({ id: c.id, name: c.name })),
    grades,
    // Students cannot post school-wide; their posts are read first.
    allowSchoolWide: !isStudent,
    reviewedFirst: isStudent,
  };
}
