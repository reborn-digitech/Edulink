import "server-only";
import { db } from "./db";
import { toDisplayLoginName, HANDLE_DOMAIN } from "./login-name";
import type { ActiveContext } from "./session";

/**
 * The pupil's welcome, once.
 *
 * ITS REAL JOB IS THE LOGIN NAME. A child who joined with a code has no
 * email address; the name the wizard made for them is how they get back in.
 * The welcome used to be a flag in the address bar (`?welcome=1&handle=…`)
 * set by the join itself. A join now waits for a yes (lib/join-requests.ts),
 * and the first page a newly admitted pupil reaches is the role picker, which
 * carries no flag onward — so the welcome is decided here instead:
 *
 *   the membership is a pupil's, made in the last fourteen days, and the
 *   pupil has not put the welcome away.
 *
 * THE NAME IS READ FROM THE ACCOUNT, never from the address bar: a link
 * could put anybody's login name on a child's screen.
 */
export const WELCOME_DAYS = 14;

export type StudentWelcome = { handle: string | null };

export async function welcomeFor(ctx: ActiveContext, now: Date = new Date()): Promise<StudentWelcome | null> {
  if (ctx.role !== "STUDENT" || !ctx.membershipId) return null;
  const membership = await db.membership.findFirst({
    where: { id: ctx.membershipId, userId: ctx.user.id },
    select: { joinedAt: true, welcomedAt: true },
  });
  if (!membership || membership.welcomedAt) return null;
  if (membership.joinedAt.getTime() < now.getTime() - WELCOME_DAYS * 86_400_000) return null;
  const email = ctx.user.email;
  return { handle: email?.endsWith(`@${HANDLE_DOMAIN}`) ? toDisplayLoginName(email) : null };
}

/** The pupil put it away. Their own membership only; a second press changes nothing. */
export async function markWelcomed(ctx: ActiveContext): Promise<void> {
  if (ctx.role !== "STUDENT" || !ctx.membershipId) return;
  await db.membership.updateMany({ where: { id: ctx.membershipId, userId: ctx.user.id, welcomedAt: null }, data: { welcomedAt: new Date() } });
}
