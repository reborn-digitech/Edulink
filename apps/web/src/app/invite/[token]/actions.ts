"use server";

import { db } from "@/lib/db";
import { hashPassword, hashToken, passwordProblems } from "@/lib/crypto";
import { createSession } from "@/lib/session";
import { acceptInviteSchema, fieldErrors, type FieldErrors } from "@/lib/validation";
import { studentCode } from "@/lib/codes";
import { audit } from "@/lib/audit";
import { forJoinCode, forSchool } from "@/lib/tenant-context";
import { syncStandinGuardian } from "@/lib/standin-guardian";
import { parseDateOnly } from "@/lib/dates";
import { writeJson } from "@/lib/json";
import { ROLE_HOME, type Role } from "@/lib/constants";
import { consumeByCaller, retryHintKey, INVITE_ACCEPTS } from "@/lib/rate-limit";
import { getT, getLocale } from "@/lib/i18n/server";
import { syncGradeLevel } from "@/lib/grade-level";

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
  const t = await getT();
  // The language they accepted in. See the note in register/actions.ts.
  const locale = await getLocale();
  const parsed = acceptInviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error, t) };

  const { token, name, password, title, bio, subjects, birthdate } = parsed.data;

  /**
   * NOT ABOUT GUESSING THE TOKEN — it is 32 random bytes, brute force is
   * infeasible, and a rate limit would not be what stopped it. It is about the
   * same thing the signup limits are: this endpoint creates accounts and joins
   * them to a school, and an endpoint that does that should not be free to call
   * in a loop.
   */
  const gate = await consumeByCaller("invite-accept", INVITE_ACCEPTS);
  if (!gate.allowed) {
    return {
      ok: false,
      errors: {
        _form: (() => {
          const h = retryHintKey(gate.retryAfterSeconds);
          return t("invite.tooManyAttempts", { when: t(h.key, h.vars) });
        })(),
      },
    };
  }

  // The token opens exactly its own invitation and nothing else — including
  // not the school it belongs to, whose row the token does not name. So the
  // school is read in a second pass, scoped by the id the invitation gives us.
  const invite = await forJoinCode(hashToken(token), () =>
    db.invite.findUnique({ where: { tokenHash: hashToken(token) } }),
  );

  if (!invite || invite.status !== "PENDING") {
    return { ok: false, errors: { _form: t("invite.noLongerValid") } };
  }
  if (invite.expiresAt.getTime() < Date.now()) {
    await db.invite.update({ where: { id: invite.id }, data: { status: "EXPIRED" } });
    return {
      ok: false,
      errors: { _form: t("invite.expired") },
    };
  }

  const school = await forSchool(invite.schoolId, () =>
    db.school.findUniqueOrThrow({ where: { id: invite.schoolId }, select: { name: true } }),
  );

  const email = invite.email?.toLowerCase() ?? null;
  if (!email) {
    return { ok: false, errors: { _form: t("invite.noEmailAttached") } };
  }

  /**
   * WHO ALREADY HOLDS THIS ADDRESS, which decides whether a password is wanted
   * at all — and is the difference between joining a school and TRANSFERRING to
   * one.
   *
   * `acceptInvite` has always attached a membership to an existing account
   * rather than minting a second one, which is what makes an invitation the
   * transfer path that does not fork: the leaving certificate is already on
   * this user id and there is nothing to merge. What was wrong was the
   * conversation around it — the form asked for a password and the code below
   * kept the existing one, so the answer went nowhere. Silently. A child found
   * out weeks later, when the session had gone.
   *
   * Telling the holder of the token that this address has an account is not an
   * enumeration oracle: the token was emailed to that address, so whoever is
   * reading it already controls the mailbox.
   */
  const holder = await db.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });
  const keepsExistingPassword = Boolean(holder?.passwordHash);

  if (keepsExistingPassword && password) {
    // Refused rather than ignored. "We took your input and did nothing with it"
    // is the failure mode this whole change exists to remove, and accepting it
    // quietly here would put it straight back.
    return {
      ok: false,
      errors: {
        password: (await getT())("invite.alreadyHavePassword"),
      },
    };
  }

  if (!keepsExistingPassword) {
    if (!password) {
      return { ok: false, errors: { password: (await getT())("invite.choosePassword") } };
    }
    const problems = passwordProblems(password, [name, invite.email ?? "", school.name]);
    if (problems.length > 0) return { ok: false, errors: { password: (await getT())(problems[0]!) } };
  }

  /**
   * The birthday, validated here rather than trusted or silently dropped.
   *
   * A date the person typed that we cannot read is refused — quietly storing
   * null would put them on no calendar and give a guardian nothing to claim
   * against, and they would never find out why.
   */
  let birthDate: Date | null = null;
  if (birthdate && birthdate.trim().length > 0) {
    birthDate = parseDateOnly(birthdate);
    if (!birthDate) return { ok: false, errors: { birthdate: (await getT())("invite.useRealDate") } };
    if (birthDate.getTime() > Date.now()) {
      return { ok: false, errors: { birthdate: (await getT())("invite.dateInFuture") } };
    }
  }

  const role = invite.role as Role;
  const passwordHash = password ? await hashPassword(password) : null;

  let userId: string;

  // A PARENT invitation links a family to a child: a guardianship, never a
  // membership. Accepting IS the consent — the office vouched, the parent
  // agreed — so the consents are stamped here the way a claim stamps them.
  if (role === "PARENT") {
    if (!invite.studentMembershipId) return { ok: false, errors: { _form: t("invite.invalidBody") } };
    try {
      userId = await forSchool(invite.schoolId, () =>
        db.$tenantTransaction(async (rawTx) => {
          const tx = rawTx as typeof db;
          const fresh = await tx.invite.findUnique({ where: { id: invite.id }, select: { status: true } });
          if (fresh?.status !== "PENDING") throw new Error("ALREADY_USED");

          const existing = await tx.user.findUnique({ where: { email }, select: { id: true, passwordHash: true } });
          let user = existing;
          if (!user) {
            if (!passwordHash) throw new Error("NEEDS_PASSWORD");
            user = await tx.user.create({
              data: { email, name, passwordHash, emailVerifiedAt: new Date(), prefs: writeJson({ theme: "system", locale }) },
              select: { id: true, passwordHash: true },
            });
          } else if (!user.passwordHash && passwordHash) {
            await tx.user.update({ where: { id: user.id }, data: { passwordHash, emailVerifiedAt: new Date() } });
          }

          const pupil = await tx.membership.findFirst({
            where: { id: invite.studentMembershipId!, schoolId: invite.schoolId, role: "STUDENT" },
            select: { id: true, schoolId: true },
          });
          if (!pupil) throw new Error("ALREADY_USED");

          await tx.guardianship.upsert({
            where: { parentUserId_studentMembershipId: { parentUserId: user.id, studentMembershipId: pupil.id } },
            create: {
              parentUserId: user.id,
              studentMembershipId: pupil.id,
              studentSchoolId: pupil.schoolId,
              relation: invite.relation ?? "PARENT",
              status: "ACTIVE",
              consentSharingAt: new Date(),
              consentNotificationsAt: new Date(),
            },
            update: { status: "ACTIVE", relation: invite.relation ?? "PARENT", consentSharingAt: new Date() },
          });

          await tx.invite.update({
            where: { id: invite.id },
            data: { status: "ACCEPTED", acceptedAt: new Date(), acceptedByUserId: user.id },
          });
          return user.id;
        }),
      );
    } catch (error) {
      if (error instanceof Error && error.message === "ALREADY_USED") {
        return { ok: false, errors: { _form: t("invite.alreadyUsed") } };
      }
      if (error instanceof Error && error.message === "NEEDS_PASSWORD") {
        return { ok: false, errors: { password: t("invite.choosePassword") } };
      }
      console.error("[acceptInvite parent]", error);
      return { ok: false, errors: { _form: t("invite.couldNotComplete") } };
    }

    await audit({
      schoolId: invite.schoolId,
      actorUserId: userId,
      action: "parent.link.accept",
      targetType: "Membership",
      targetId: invite.studentMembershipId,
      meta: { inviteId: invite.id },
    });
    // A real guardian now exists; the school's stand-in steps aside.
    await syncStandinGuardian({
      schoolId: invite.schoolId,
      studentMembershipId: invite.studentMembershipId,
      actorUserId: userId,
    }).catch((error) => console.error("[acceptInvite parent] standin sync failed", error));

    await createSession(userId, { schoolId: null, role: "PARENT" });
    return { ok: true, errors: {}, redirectTo: ROLE_HOME.PARENT };
  }

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
        // Re-checked inside the transaction, so a decision made a moment ago
        // outside it cannot leave us creating an account with a null hash.
        if (!passwordHash) throw new Error("NEEDS_PASSWORD");
        user = await tx.user.create({
          data: {
            email,
            name,
            passwordHash,
            // Clicking a link we emailed proves control of the address.
            emailVerifiedAt: new Date(),
            bio: bio || null,
            birthdate: birthDate,
            prefs: writeJson({ theme: "system", locale }),
          },
          select: { id: true, passwordHash: true },
        });
      } else {
        // An existing account. The page still ASKED for a date of birth and a
        // bio, and used to validate both and then write neither — every
        // transferring pupil's birthday was lost on the way in, and a parent
        // needs exactly that date to claim them. Fill what is empty; never
        // overwrite what the person already set elsewhere.
        const profile = await tx.user.findUniqueOrThrow({
          where: { id: user.id },
          select: { birthdate: true, bio: true },
        });
        const data: { passwordHash?: string; emailVerifiedAt?: Date; birthdate?: Date; bio?: string } = {};
        if (!user.passwordHash && passwordHash) {
          // Account existed without a password (e.g. created by a parent
          // link). Setting one here is legitimate; overwriting an existing one
          // is not — and is refused above rather than skipped, so nobody
          // types one into a field that does nothing.
          data.passwordHash = passwordHash;
          data.emailVerifiedAt = new Date();
        }
        if (birthDate && !profile.birthdate) data.birthdate = birthDate;
        if (bio && !profile.bio) data.bio = bio;
        if (Object.keys(data).length > 0) {
          await tx.user.update({ where: { id: user.id }, data });
        }
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
          await syncGradeLevel(tx, [membership.id]);
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
      return { ok: false, errors: { _form: t("invite.alreadyUsed") } };
    }
    if (error instanceof Error && error.message === "NEEDS_PASSWORD") {
      return { ok: false, errors: { password: t("invite.choosePassword") } };
    }
    console.error("[acceptInvite]", error);
    return { ok: false, errors: { _form: t("invite.couldNotComplete") } };
  }

  await audit({
    schoolId: invite.schoolId,
    actorUserId: userId,
    action: "invite.accept",
    targetType: "Invite",
    targetId: invite.id,
    meta: { role: invite.role },
  });

  // An invited pupil arrives with no parent on the app, exactly like one who
  // joined by code — so the class teacher (or an admin) stands in as guardian
  // until a parent claims them. See standin-guardian.ts.
  if (invite.role === "STUDENT") {
    const minted = await forSchool(invite.schoolId, () =>
      db.membership.findFirst({
        where: { userId, schoolId: invite.schoolId, role: "STUDENT" },
        select: { id: true },
      }),
    );
    if (minted) {
      await syncStandinGuardian({
        schoolId: invite.schoolId,
        studentMembershipId: minted.id,
        actorUserId: userId,
      }).catch((error) => console.error("[acceptInvite] standin sync failed", error));
    }
  }

  await createSession(userId, { schoolId: invite.schoolId, role });

  return { ok: true, errors: {}, redirectTo: ROLE_HOME[role] };
}
