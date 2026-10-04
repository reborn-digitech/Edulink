import "server-only";
import { db } from "./db";
import { generateToken, hashToken } from "./crypto";
import { localeForAddress, sendTeacherInvite } from "./email";
import { audit } from "./audit";
import { INVITE_TTL_DAYS } from "./constants";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "./i18n/dictionary";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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

  const token = generateToken();
  await db.invite.update({
    where: { id: invite.id },
    data: {
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000),
    },
  });

  await sendTeacherInvite(invite.email, `${APP_URL}/invite/${token}`, invite.school.name, ctx.user.preferredName ?? ctx.user.name, await localeForAddress(invite.email, invite.school.locale));

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
