import "server-only";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { notify } from "./notify";
import { ageInYears, parseDateOnly } from "./dates";
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

  const member = await db.membership.findFirst({
    where: { id: membershipId, schoolId: ctx.schoolId, status: { not: "REMOVED" } },
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
      // The minor flag follows the date for a pupil; an unknown date keeps
      // the cautious default, which is what sign-up does too.
      ...(member.role === "STUDENT"
        ? { isMinor: parsed.date ? ageInYears(parsed.date) < 18 : true }
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
      ...(ctx.role === "STUDENT" ? { isMinor: ageInYears(parsed.date) < 18 } : {}),
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
