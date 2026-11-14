import "server-only";
import { db } from "./db";
import { generateToken, hashToken } from "./crypto";
import { localeForAddress, sendParentLinkInvite, sendTeacherInvite } from "./email";
import { audit } from "./audit";
import { INVITE_TTL_DAYS } from "./constants";
import { consume, INVITE_EMAILS_DAILY, INVITE_RESENDS } from "./rate-limit";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "./i18n/dictionary";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/**
 * The invitations this school has written in the last day: what INVITE_EMAILS_DAILY caps. The list import
 * counts the same rows (admin/invites/actions.ts); a parent's invitation and a resend now count them too
 * (TA-180, TA-286), so no door of the office's mails past the day's ceiling.
 */
export async function invitesSentToday(schoolId: string): Promise<number> {
  return db.invite.count({ where: { schoolId, createdAt: { gte: new Date(Date.now() - INVITE_EMAILS_DAILY.windowMs) } } });
}

/**
 * Issues a fresh token for a pending invitation and emails it again. The old
 * link stops working the moment the new hash is written. Shared by the
 * invitations page's resend button and POST /api/v1/office/invites/{id}/resend,
 * so both say the same thing about an invite that cannot be resent.
 */
export async function resendInviteFor(
  ctx: ActiveContext & { schoolId: string },
  inviteId: string,
): Promise<{ ok: true } | { ok: false; errorKey: TranslationKey }> {
  const invite = await db.invite.findFirst({
    where: { id: inviteId, schoolId: ctx.schoolId, status: "PENDING" },
    include: { school: { select: { name: true, locale: true } } },
  });
  if (!invite?.email) return { ok: false, errorKey: "invites.cannotResend" };

  // TA-552: a parent's invitation goes again in its own words — the child's name and what the guardian will see —
  // as its first mail did (parent-link.ts), not as a staff invitation to join the school and set a password.
  let childName: string | null = null;
  if (invite.role === "PARENT") {
    const pupil = invite.studentMembershipId
      ? await db.membership.findFirst({
          where: { id: invite.studentMembershipId, schoolId: ctx.schoolId, role: "STUDENT" },
          select: { user: { select: { name: true, preferredName: true } } },
        })
      : null;
    if (!pupil) return { ok: false, errorKey: "invites.cannotResend" };
    childName = pupil.user.preferredName ?? pupil.user.name;
  }

  // A resend is a mail like any other (TA-286): none once the school's day is spent, and a few a day for one
  // invitation, so a loop on one pending row is not a way to fill somebody's inbox with the school's name.
  if ((await invitesSentToday(ctx.schoolId)) >= INVITE_EMAILS_DAILY.limit) return { ok: false, errorKey: "invites.dailyCapToday" };
  const again = await consume(`invite-resend:${invite.id}`, INVITE_RESENDS.limit, INVITE_RESENDS.windowMs);
  if (!again.allowed) return { ok: false, errorKey: "invites.resendLimit" };

  const token = generateToken();
  await db.invite.update({
    where: { id: invite.id },
    data: {
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000),
    },
  });

  const locale = await localeForAddress(invite.email, invite.school.locale);
  const inviter = ctx.user.preferredName ?? ctx.user.name;
  if (childName !== null) await sendParentLinkInvite(invite.email, `${APP_URL}/invite/${token}`, childName, invite.school.name, inviter, locale);
  else await sendTeacherInvite(invite.email, `${APP_URL}/invite/${token}`, invite.school.name, inviter, locale);

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "invite.resend",
    targetType: "Invite",
    targetId: invite.id,
  });

  return { ok: true };
}

/**
 * Every pending invitation past its date is marked EXPIRED, in one statement
 * across schools, for the daily `accounts:tidy` job. The accept path already
 * writes the status when somebody follows a dead link; nothing wrote it for
 * the links nobody followed, so "invites waiting" and the operator's "no admin
 * yet" counted every invitation that had quietly lapsed. Counts are per school,
 * never a name or an address.
 */
export async function expireInvites(now: Date = new Date(), scope: { schoolIds?: string[] } = {}): Promise<{ expired: number; perSchool: Record<string, { invitesExpired: number }> }> {
  // `scope.schoolIds` is for a test or a simulated year (LIFECYCLE-10): the cron expires every school's.
  const where = { status: "PENDING", expiresAt: { lt: now }, ...(scope.schoolIds ? { schoolId: { in: scope.schoolIds } } : {}) };
  const due = await db.invite.groupBy({ by: ["schoolId"], where, _count: { _all: true } });
  if (due.length === 0) return { expired: 0, perSchool: {} };
  const moved = await db.invite.updateMany({ where, data: { status: "EXPIRED" } });
  const perSchool: Record<string, { invitesExpired: number }> = {};
  for (const g of due) perSchool[g.schoolId] = { invitesExpired: g._count._all };
  return { expired: moved.count, perSchool };
}
