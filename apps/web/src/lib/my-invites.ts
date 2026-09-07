import "server-only";
import { db } from "./db";
import { forUser, forSchool } from "./tenant-context";
import { isDeliverableEmail } from "./login-name";

/**
 * The invitations waiting for the signed-in person, at their own address.
 *
 * WHY /join ASKS. A signed-in user with no school lands there and used to be
 * told to go back to their inbox — while a pending invitation to their own
 * address sat one table away. The row policy (ADDRESSEE_READABLE) opens
 * exactly those rows: PENDING, addressed to the caller's own VERIFIED email.
 * The school's name is read with that school bound, the same narrow
 * server-side bind the invite page itself uses — nothing else of the school
 * comes with it.
 */

export type WaitingInvite = {
  id: string;
  role: string;
  schoolName: string;
  expiresAt: Date;
};

export async function pendingInvitesFor(userId: string): Promise<WaitingInvite[]> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, emailVerifiedAt: true },
  });
  if (!user?.email || !user.emailVerifiedAt || !isDeliverableEmail(user.email)) return [];

  const invites = await forUser(userId, () =>
    db.invite.findMany({
      where: { email: user.email!.toLowerCase(), status: "PENDING", expiresAt: { gt: new Date() } },
      select: { id: true, role: true, schoolId: true, expiresAt: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  );

  const out: WaitingInvite[] = [];
  for (const invite of invites) {
    const school = await forSchool(invite.schoolId, () =>
      db.school.findUnique({ where: { id: invite.schoolId }, select: { name: true } }),
    );
    if (school) out.push({ id: invite.id, role: invite.role, schoolName: school.name, expiresAt: invite.expiresAt });
  }
  return out;
}
