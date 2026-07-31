"use server";

import { db } from "@/lib/db";
import { hashPassword, hashToken, passwordProblems } from "@/lib/crypto";
import { createSession } from "@/lib/session";
import { acceptInviteSchema, fieldErrors, type FieldErrors } from "@/lib/validation";
import { studentCode } from "@/lib/codes";
import { audit } from "@/lib/audit";
import { forJoinCode, forSchool } from "@/lib/tenant-context";
import { writeJson } from "@/lib/json";
import { ROLE_HOME, type Role } from "@/lib/constants";

export type AcceptState = { ok: boolean; errors: FieldErrors; redirectTo?: string };

/**
 * Accepts an invitation and creates (or links) the account.
 *
 * The token is the only credential here, so it is checked the same way a
 * session is: looked up by hash, and re-validated for status and expiry inside
 * the same transaction that consumes it. Two people clicking the same link
 * cannot both get a membership.
 */
export async function acceptInvite(input: unknown): Promise<AcceptState> {
  const parsed = acceptInviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };

  const { token, name, password, title, bio, subjects } = parsed.data;

  // The token opens exactly its own invitation and nothing else — including
  // not the school it belongs to, whose row the token does not name. So the
  // school is read in a second pass, scoped by the id the invitation gives us.
  const invite = await forJoinCode(hashToken(token), () =>
    db.invite.findUnique({ where: { tokenHash: hashToken(token) } }),
  );

  if (!invite || invite.status !== "PENDING") {
    return { ok: false, errors: { _form: "That invitation is no longer valid." } };
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    await db.invite.update({ where: { id: invite.id }, data: { status: "EXPIRED" } });
    return {
      ok: false,
      errors: { _form: "That invitation has expired. Ask your admin to send a new one." },
    };
  }

  const school = await forSchool(invite.schoolId, () =>
    db.school.findUniqueOrThrow({ where: { id: invite.schoolId }, select: { name: true } }),
  );

  const problems = passwordProblems(password, [name, invite.email ?? "", school.name]);
  if (problems.length > 0) return { ok: false, errors: { password: problems[0]! } };

  const email = invite.email?.toLowerCase() ?? null;
  if (!email) {
    return { ok: false, errors: { _form: "That invitation has no email address attached." } };
  }

  const role = invite.role as Role;
  const passwordHash = await hashPassword(password);

  let userId: string;

  try {
    // Bound to the school the invitation is for, and through
    // `$tenantTransaction` — the callback of a plain `db.$transaction` gets a
    // raw client that sets no tenant, so the membership INSERT is refused. There
    // is no session yet; the invite is what names the school.
    userId = await forSchool(invite.schoolId, () =>
      db.$tenantTransaction(async (rawTx) => {
        const tx = rawTx as typeof db;
      // Re-read inside the transaction: between the checks above and here,
      // another tab may have consumed it.
      const fresh = await tx.invite.findUnique({
        where: { id: invite.id },
        select: { status: true },
      });
      if (fresh?.status !== "PENDING") throw new Error("ALREADY_USED");

      const existing = await tx.user.findUnique({
        where: { email },
        select: { id: true, passwordHash: true },
      });

      let user = existing;
      if (!user) {
        user = await tx.user.create({
          data: {
            email,
            name,
            passwordHash,
            // Clicking a link we emailed proves control of the address.
            emailVerifiedAt: new Date(),
            bio: bio || null,
            prefs: writeJson({ theme: "system", locale: "en" }),
          },
          select: { id: true, passwordHash: true },
        });
      } else if (!user.passwordHash) {
        // Account existed without a password (e.g. created by a parent link).
        // Setting one here is legitimate; overwriting an existing one is not.
        await tx.user.update({
          where: { id: user.id },
          data: { passwordHash, emailVerifiedAt: new Date() },
        });
      }

      await tx.membership.upsert({
        where: {
          userId_schoolId_role: { userId: user.id, schoolId: invite.schoolId, role: invite.role },
        },
        create: {
          userId: user.id,
          schoolId: invite.schoolId,
          role: invite.role,
          status: "ACTIVE",
          title: title || null,
          subjects: subjects.length > 0 ? JSON.stringify(subjects) : null,
          studentCode: invite.role === "STUDENT" ? studentCode() : null,
        },
        update: { status: "ACTIVE", leftAt: null },
      });

      // If the invite named a class, enrol or assign them to it now.
      if (invite.classId) {
        const membership = await tx.membership.findFirstOrThrow({
          where: { userId: user.id, schoolId: invite.schoolId, role: invite.role },
          select: { id: true },
        });

        if (invite.role === "STUDENT") {
          await tx.enrollment.upsert({
            where: {
              classId_studentMembershipId: {
                classId: invite.classId,
                studentMembershipId: membership.id,
              },
            },
            create: {
              classId: invite.classId,
              schoolId: invite.schoolId,
              studentMembershipId: membership.id,
            },
            update: { status: "ACTIVE", removedAt: null },
          });
        } else if (invite.role === "TEACHER") {
          await tx.classTeacher.upsert({
            where: {
              classId_teacherMembershipId: {
                classId: invite.classId,
                teacherMembershipId: membership.id,
              },
            },
            create: {
              classId: invite.classId,
              schoolId: invite.schoolId,
              teacherMembershipId: membership.id,
              role: "LEAD",
            },
            update: {},
          });
        }
      }

      await tx.invite.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED", acceptedAt: new Date(), acceptedByUserId: user.id },
      });

        return user.id;
      }),
    );
  } catch (error) {
    if (error instanceof Error && error.message === "ALREADY_USED") {
      return { ok: false, errors: { _form: "That invitation has already been used." } };
    }
    console.error("[acceptInvite]", error);
    return { ok: false, errors: { _form: "We could not complete that. Please try again." } };
  }

  await audit({
    schoolId: invite.schoolId,
    actorUserId: userId,
    action: "invite.accept",
    targetType: "Invite",
    targetId: invite.id,
    meta: { role: invite.role },
  });

  await createSession(userId, { schoolId: invite.schoolId, role });

  return { ok: true, errors: {}, redirectTo: ROLE_HOME[role] };
}
