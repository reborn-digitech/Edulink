import "server-only";
import { db } from "./db";
import { generateToken, hashToken } from "./crypto";
import { sendTeacherInvite } from "./email";
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
    include: { school: { select: { name: true } } },
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

  await sendTeacherInvite(invite.email, `${APP_URL}/invite/${token}`, invite.school.name, ctx.user.preferredName ?? ctx.user.name);

  await audit({
    schoolId: ctx.schoolId,
    actorUserId: ctx.user.id,
    action: "invite.resend",
    targetType: "Invite",
    targetId: invite.id,
  });

  return { ok: true };
}
