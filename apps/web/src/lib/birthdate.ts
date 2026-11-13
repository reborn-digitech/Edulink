import "server-only";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { notify } from "./notify";
import { ageInYears, parseDateOnly } from "./dates";
import { adultCutoff } from "./adulthood";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * Who may write a date of birth, and when.
 *
 * The date was only ever captured at sign-up, and a mistyped or missing one
 * could not be corrected by anybody — which mattered because a parent's claim
 * is the student code AND this date. Two writers now, deliberately narrow:
 *
 *   - the SCHOOL OFFICE, for any member of its school, audited with the old
 *     and the new value and told to the person it concerns. The office holds
 *     the admission form; it is the one party that can say what the date is.
 *   - the PERSON THEMSELVES, only while NOBODY IS LINKED TO THEM. A pupil
 *     whose parent already proved the claim with this date must not be able
 *     to change the thing the claim was proved against; staff have no claim
 *     on them and may always edit their own.
 *
 * Clearing is allowed for the office only: a wrong date is worse than none,
 * and "none" is something only the office should decide on the family's
 * behalf.
 */

export type BirthdateResult = { ok: true } | { ok: false; errorKey: TranslationKey };

const EARLIEST = new Date("1900-01-01T00:00:00.000Z");

function validate(dateKey: string | null): { date: Date | null } | { errorKey: TranslationKey } {
  if (dateKey === null || dateKey.trim() === "") return { date: null };
  const date = parseDateOnly(dateKey);
  if (!date) return { errorKey: "invite.useRealDate" };
  if (date.getTime() > Date.now()) return { errorKey: "invite.dateInFuture" };
  if (date.getTime() < EARLIEST.getTime()) return { errorKey: "invite.useRealDate" };
  return { date };
}

/** The office sets (or clears) a member's date of birth. */
export async function setMemberBirthdate(
  ctx: ActiveContext,
  membershipId: string,
  dateKey: string | null,
): Promise<BirthdateResult> {
  if (ctx.role !== "ADMIN" || !ctx.schoolId) throw new AccessError("access.onlyTheOfficeSetsBirthdates");

  const parsed = validate(dateKey);
  if ("errorKey" in parsed) return { ok: false, errorKey: parsed.errorKey };

  // A member on the roll today: a school the person has left no longer writes their shared account (TA-175).
  const member = await db.membership.findFirst({
    // leftAt null (TA-175, TA-204): the date is on the shared account; a school the person has left corrects nobody, and a pupil who has left is the new school's to correct.
    where: { id: membershipId, schoolId: ctx.schoolId, status: { not: "REMOVED" }, leftAt: null },
    select: { id: true, role: true, userId: true, user: { select: { birthdate: true } } },
  });
  if (!member) return { ok: false, errorKey: "refusal.notAMemberHere" };

  const before = member.user.birthdate?.toISOString().slice(0, 10) ?? null;
  const after = parsed.date?.toISOString().slice(0, 10) ?? null;
  if (before === after) return { ok: true };

  await db.user.update({
    where: { id: member.userId },
    data: {
      birthdate: parsed.date,
      // The minor flag follows the date, whoever the member is (the data audit
      // checks it exactly); a pupil's unknown date keeps the cautious default,
      // which is what sign-up does too, and anyone else's keeps their flag.
      ...(parsed.date
        ? { isMinor: ageInYears(parsed.date) < 18 }
        : member.role === "STUDENT"
          ? { isMinor: true }
          : {}),
    },
  });

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "user.birthdate.set",
    targetType: "Membership",
    targetId: member.id,
    meta: { from: before, to: after },
  });

  // Told, because a date of birth is theirs and somebody else just wrote it.
  await notify({
    userId: member.userId,
    schoolId: ctx.schoolId,
    kind: "SYSTEM",
    titleKey: "notifTitle.birthdateSet",
    bodyKey: after ? "notifBody.birthdateSet" : "notifBody.birthdateCleared",
    url: member.role === "STUDENT" ? "/student/profile" : "/teacher/profile",
  }).catch(() => {});

  return { ok: true };
}

/**
 * Whether this person may edit their own date of birth right now: staff
 * always; a pupil only while no guardian is linked.
 */
export async function mayEditOwnBirthdate(ctx: ActiveContext): Promise<boolean> {
  if (!ctx.membershipId) return false;
  if (ctx.role !== "STUDENT") return ctx.role === "TEACHER" || ctx.role === "PRINCIPAL" || ctx.role === "ADMIN";
  const linked = await db.guardianship.count({
    where: { studentMembershipId: ctx.membershipId, status: "ACTIVE" },
  });
  return linked === 0;
}

/** A person sets their own date of birth, within the rule above. */
export async function setOwnBirthdate(ctx: ActiveContext, dateKey: string): Promise<BirthdateResult> {
  if (!(await mayEditOwnBirthdate(ctx))) return { ok: false, errorKey: "refusal.askTheOfficeToChangeYourBirthday" };
  const parsed = validate(dateKey);
  if ("errorKey" in parsed) return { ok: false, errorKey: parsed.errorKey };
  if (!parsed.date) return { ok: false, errorKey: "invite.useRealDate" };

  const current = await db.user.findUniqueOrThrow({ where: { id: ctx.user.id }, select: { birthdate: true } });
  const before = current.birthdate?.toISOString().slice(0, 10) ?? null;
  const after = parsed.date.toISOString().slice(0, 10);
  if (before === after) return { ok: true };

  await db.user.update({
    where: { id: ctx.user.id },
    data: {
      birthdate: parsed.date,
      isMinor: ageInYears(parsed.date) < 18,
    },
  });
  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "user.birthdate.set",
    targetType: "Membership",
    targetId: ctx.membershipId ?? undefined,
    meta: { from: before, to: after, own: true },
  });
  return { ok: true };
}

/**
 * `User.isMinor` is a stored copy of "under eighteen by the date of birth" —
 * read by the moderation, the push wording, the feed and the session in too
 * many places to derive on every read. Every writer of a date writes the flag
 * with it; the calendar alone moves it once a year, so the daily
 * `accounts:tidy` job runs this. For an account with a date on record the
 * date wins, in both directions: a pupil who turned eighteen stops counting
 * as a child, and a dated account under eighteen that somehow says adult
 * (a date written before the writers above followed it) is put right. An
 * account with no date keeps whatever its sign-up said. The data audit's
 * `user-minor` check is exact against this rule, allowing the job's two days.
 *
 * `scope.userIds` is for tests alone (the retention sweep's precedent): the
 * cron fixes the whole server, a test only its own accounts.
 */
export async function refreshMinority(now: Date = new Date(), scope: { userIds?: string[] } = {}): Promise<{ adults: number; minors: number }> {
  const cutoff = adultCutoff(now);
  const only = scope.userIds ? { id: { in: scope.userIds } } : {};
  const adults = await db.user.updateMany({ where: { ...only, isMinor: true, birthdate: { not: null, lte: cutoff } }, data: { isMinor: false } });
  const minors = await db.user.updateMany({ where: { ...only, isMinor: false, birthdate: { not: null, gt: cutoff } }, data: { isMinor: true } });
  return { adults: adults.count, minors: minors.count };
}
