import "server-only";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { generateToken, hashToken } from "./crypto";
import { localeForAddress, sendParentLinkInvite } from "./email";
import { GUARDIAN_RELATIONS, INVITE_TTL_DAYS, type GuardianRelation } from "./constants";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "./i18n/dictionary";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * The office links a parent to a child.
 *
 * THE CLAIM IS THE FAMILY'S PROOF; THIS IS THE SCHOOL'S. A parent claiming a
 * child proves it with the student code and the date of birth. When that
 * fails — a birthday never entered, a code lost — the office, which knows
 * the family, vouches instead. What it does NOT do is create the link on the
 * parent's behalf: it sends an invitation to the address the office has, and
 * the guardianship exists only when that person accepts it, which is where
 * consent to see a child's record is given. The pending invitation is
 * visible on the pupil's row and on the Invites tab, and can be withdrawn.
 *
 * One per address per child at a time; an address already linked is told so
 * rather than sent a second link.
 */

export type ParentLinkInput = { email: string; name?: string; relation: GuardianRelation };

export type ParentLinkResult =
  | { ok: true; inviteId: string }
  | { ok: false; errorKey: TranslationKey };

function requireAdmin(ctx: ActiveContext): string {
  if (ctx.role !== "ADMIN" || !ctx.schoolId || !ctx.membershipId) {
    throw new AccessError("access.onlyAnAdminCanLinkAParent");
  }
  return ctx.schoolId;
}

export async function inviteParent(
  ctx: ActiveContext,
  studentMembershipId: string,
  input: ParentLinkInput,
): Promise<ParentLinkResult> {
  const schoolId = requireAdmin(ctx);

  const email = input.email.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, errorKey: "refusal.thatIsNotAnEmailAddress" };
  if (!GUARDIAN_RELATIONS.includes(input.relation)) return { ok: false, errorKey: "refusal.sayHowTheyAreRelated" };

  const pupil = await db.membership.findFirst({
    where: { id: studentMembershipId, schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null },
    select: { id: true, user: { select: { name: true, preferredName: true, email: true } } },
  });
  if (!pupil) return { ok: false, errorKey: "refusal.notPupilsHere" };
  if (pupil.user.email?.toLowerCase() === email) return { ok: false, errorKey: "refusal.thatIsTheChildsOwnAddress" };

  const holder = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (holder) {
    const linked = await db.guardianship.findUnique({
      where: { parentUserId_studentMembershipId: { parentUserId: holder.id, studentMembershipId: pupil.id } },
      select: { status: true },
    });
    if (linked?.status === "ACTIVE") return { ok: false, errorKey: "refusal.alreadyLinkedToThisChild" };
  }

  const pending = await db.invite.findFirst({
    where: { schoolId, role: "PARENT", email, studentMembershipId: pupil.id, status: "PENDING" },
    select: { id: true },
  });
  if (pending) return { ok: false, errorKey: "invites.alreadyInvited" };

  const [school, inviter] = await Promise.all([
    db.school.findUniqueOrThrow({ where: { id: schoolId }, select: { name: true, locale: true } }),
    db.membership.findUniqueOrThrow({
      where: { id: ctx.membershipId! },
      select: { user: { select: { name: true, preferredName: true } } },
    }),
  ]);

  const token = generateToken();
  const invite = await db.invite.create({
    data: {
      schoolId,
      role: "PARENT",
      email,
      name: input.name?.trim() || null,
      studentMembershipId: pupil.id,
      relation: input.relation,
      tokenHash: hashToken(token),
      createdByMembershipId: ctx.membershipId,
      expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 86_400_000),
    },
    select: { id: true },
  });

  const childName = pupil.user.preferredName ?? pupil.user.name;
  await sendParentLinkInvite(
    email,
    `${APP_URL}/invite/${token}`,
    childName,
    school.name,
    inviter.user.preferredName ?? inviter.user.name,
    // The family's own language when the address is already an account, else the school's.
    await localeForAddress(email, school.locale),
  );

  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "parent.invite",
    targetType: "Membership",
    targetId: pupil.id,
    meta: { inviteId: invite.id, relation: input.relation },
  });

  return { ok: true, inviteId: invite.id };
}

/** Pending parent invitations for the pupils of one school, keyed by pupil. */
export async function pendingParentInvites(
  ctx: ActiveContext,
): Promise<Map<string, { email: string; name: string | null }[]>> {
  const schoolId = requireAdmin(ctx);
  const rows = await db.invite.findMany({
    where: { schoolId, role: "PARENT", status: "PENDING", expiresAt: { gt: new Date() } },
    select: { email: true, name: true, studentMembershipId: true },
  });
  const out = new Map<string, { email: string; name: string | null }[]>();
  for (const row of rows) {
    if (!row.studentMembershipId || !row.email) continue;
    const list = out.get(row.studentMembershipId) ?? [];
    list.push({ email: row.email, name: row.name });
    out.set(row.studentMembershipId, list);
  }
  return out;
}
