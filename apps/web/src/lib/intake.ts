import "server-only";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { forSchool, forJoinCode } from "./tenant-context";
import { studentCode } from "./codes";
import { HANDLE_DOMAIN } from "./login-name";
import { writeJson } from "./json";
import { ageInYears, parseDateOnly } from "./dates";
import { syncStandinGuardian } from "./standin-guardian";
import { inviteParent } from "./parent-link";
import { issueFirstSignIn } from "./first-signin";
import { CONSENT_AGE } from "./constants";
import { assignPen, matchPen } from "./pen";
import type { IntakeRow } from "./csv";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "./i18n/dictionary";

/**
 * Admissions intake: a school's list of new pupils becomes pupils.
 *
 * THE DOOR THAT DID NOT EXIST. A pupil could arrive two ways — by typing a
 * class code themselves, or by accepting an emailed invitation — and both
 * put the child in charge of the record: the date of birth was whatever
 * they typed, the guardian was whoever later claimed them, and a school
 * admitting twenty-five six-year-olds did it twenty-five times. An
 * admission list is the office's document: name, date of birth, class,
 * parent. This reads that document and does, per row, what the office
 * would have done by hand — and nothing it could not.
 *
 * WHAT A ROW BECOMES. A pupil account on a login handle (or on the pupil's
 * own address when the list has one), a STUDENT membership with a student
 * code, the date of birth on record, an enrolment in the named class, and
 * — when there is a guardian address — the SAME consent-based invitation
 * the directory's "Link a parent" sends, because the office typing the
 * address is not the parent agreeing to see the record. The guardianship
 * exists only when that person accepts.
 *
 * WHAT A ROW NEVER DOES. Overwrite. A child already on the roll with this
 * name and birthday is reported as already here, not admitted twice; an
 * address already holding an account is reported, not claimed; a class the
 * school does not have is reported, not invented. Every row gets a line in
 * the result, including the ones that went nowhere — a silent skip is how
 * a school finds out in September that a child was never on the roll.
 *
 * A PUPIL WITHOUT AN ADDRESS GETS A FIRST SIGN-IN CODE, not a password: the
 * office does not carry children's passwords around on a list, but it can
 * carry a one-time code that lets the child choose one (first-signin.ts).
 * The result page shows each child's handle, student code and sign-in code
 * once; the code goes home on a slip, the handle is what the child types.
 */

export type IntakeOutcome = {
  line: number;
  name: string;
  status: "admitted" | "skipped" | "failed";
  reasonKey?: TranslationKey;
  /** For an admitted pupil. */
  studentCode?: string;
  handle?: string;
  /** Issued with the handle, for the slip that goes home. Shown once — here. */
  firstSignInCode?: string;
  className?: string | null;
  guardian?: "invited" | "none" | "notSent";
  guardianReasonKey?: TranslationKey;
  /** The row carried a transfer code and attached to the existing account. */
  linked?: boolean;
  /**
   * Admitted, but into a class whose cohort a promotion has already moved
   * on — last year's room still standing. The admission is NOT refused
   * (repeaters legitimately live there); the office is told so a transfer
   * landing mid-year-turn is a decision, not an accident.
   */
  warnKey?: TranslationKey;
};

export type IntakeResult = {
  outcomes: IntakeOutcome[];
  admitted: number;
  guardiansInvited: number;
};

export const INTAKE_MAX_ROWS = 500;

function requireAdmin(ctx: ActiveContext): string {
  if (ctx.role !== "ADMIN" || !ctx.schoolId || !ctx.membershipId) {
    throw new AccessError("access.onlyASchoolAdminCanAdmit");
  }
  return ctx.schoolId;
}

/** The login handle `joinAsStudent` mints, so an admitted pupil's looks like any other's. */
function handleFor(name: string, code: string): string {
  const base = name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) || "student";
  return `${base}.${code.slice(-4).toLowerCase()}`;
}

export async function admitPupils(
  ctx: ActiveContext,
  rows: IntakeRow[],
  // Defaulted, so a programmatic caller who forgets it gets English pupils
  // rather than a TypeError dressed as "could not admit".
  opts: { locale: string } = { locale: "en" },
): Promise<IntakeResult> {
  const schoolId = requireAdmin(ctx);
  if (rows.length > INTAKE_MAX_ROWS) throw new AccessError("access.tooManyPupilsAtOnce", "FORBIDDEN", { max: INTAKE_MAX_ROWS });

  // Classes by name, case-blind, live ones only — a list that names an
  // archived class is naming a class the school no longer runs.
  const classes = await db.class.findMany({
    where: { schoolId, archivedAt: null },
    select: { id: true, name: true, promotedAt: true },
  });
  const classByName = new Map(classes.map((c) => [c.name.trim().toLowerCase(), c]));

  const outcomes: IntakeOutcome[] = [];
  let admitted = 0;
  let guardiansInvited = 0;

  for (const row of rows) {
    const klass = row.className ? classByName.get(row.className.toLowerCase()) : null;
    if (row.className && !klass) {
      outcomes.push({ line: row.line, name: row.name, status: "skipped", reasonKey: "intake.unknownClass" });
      continue;
    }

    const birthdate = row.birthdateKey ? parseDateOnly(row.birthdateKey) : null;
    // A birthdate that is PRESENT but unreadable is named as such — the CSV
    // parser normalises real uploads, but a programmatic caller handing this
    // function raw rows used to get "code needs a birthdate" for a format
    // problem, which sent the fix hunting in the wrong place.
    if (row.birthdateKey && !birthdate) {
      outcomes.push({ line: row.line, name: row.name, status: "skipped", reasonKey: "intake.badBirthdate" });
      continue;
    }

    // Already on the roll: same name and birthday, here, active. Without a
    // birthday a name alone is not enough to refuse — two children called
    // Aarav Patel is a Tuesday — so a dateless row is admitted and the
    // office is left to notice a double in the directory, where it can.
    if (birthdate) {
      const twin = await db.membership.findFirst({
        where: {
          schoolId,
          role: "STUDENT",
          status: { in: ["ACTIVE", "PENDING"] },
          leftAt: null,
          user: { birthdate, name: { equals: row.name, mode: "insensitive" } },
        },
        select: { id: true },
      });
      if (twin) {
        outcomes.push({ line: row.line, name: row.name, status: "skipped", reasonKey: "intake.alreadyOnRoll" });
        continue;
      }
    }

    if (row.pupilEmail) {
      const holder = await db.user.findUnique({ where: { email: row.pupilEmail }, select: { id: true } });
      if (holder) {
        const here = await db.membership.findFirst({
          where: { userId: holder.id, schoolId, role: "STUDENT", status: { in: ["ACTIVE", "PENDING"] } },
          select: { id: true },
        });
        outcomes.push({
          line: row.line,
          name: row.name,
          status: "skipped",
          reasonKey: here ? "intake.alreadyOnRoll" : "intake.emailHasAccount",
        });
        continue;
      }
    }

    /**
     * ⚠ A TRANSFER LINKS; IT NEVER MINTS. A row carrying the pupil's code
     * from their previous school attaches the new membership to the child's
     * EXISTING account, so the leaving certificate — which follows the
     * person — is readable to this school the moment the child is on its
     * roll, and the child keeps the login they already know.
     *
     * This closed the fork a functional audit walked into: a real transfer
     * typed into intake minted a second account, and the receiving school
     * read zero records for a child who arrived holding a certificate. The
     * invitation path cannot cover it, because a handle-only child has no
     * email to invite — but every such child HAS a code, printed on the
     * certificate itself.
     *
     * THE FENCE IS NOT WIDENED. `Membership.studentCode` is globally unique,
     * high-entropy, and already CODE_READABLE under the join-code binding —
     * the same mechanism a child typing a class code uses. Possession of the
     * code alone is deliberately not enough: the row must also carry the
     * birthdate the old school has on file, because a code is written on a
     * paper document that changes hands.
     */
    if (row.pen === false) {
      outcomes.push({ line: row.line, name: row.name, status: "skipped", reasonKey: "intake.penFormat" });
      continue;
    }
    // A PEN with the date of birth names an account the same way a transfer
    // code does; a PEN nobody on Relay holds goes on the new account below.
    let previous: { userId: string } | null = null;
    if (row.studentCode) {
      const transferCode = row.studentCode.trim().toUpperCase();
      const byCode = await forJoinCode(transferCode, () =>
        db.membership.findFirst({
          where: { studentCode: transferCode, role: "STUDENT" },
          select: { userId: true, user: { select: { id: true, birthdate: true } } },
        }),
      );
      if (!byCode) {
        outcomes.push({ line: row.line, name: row.name, status: "skipped", reasonKey: "intake.codeNotFound" });
        continue;
      }
      if (!birthdate) {
        outcomes.push({ line: row.line, name: row.name, status: "skipped", reasonKey: "intake.codeNeedsBirthdate" });
        continue;
      }
      const known = byCode.user.birthdate;
      if (!known || known.toISOString().slice(0, 10) !== birthdate.toISOString().slice(0, 10)) {
        outcomes.push({ line: row.line, name: row.name, status: "skipped", reasonKey: "intake.codeMismatch" });
        continue;
      }
      previous = { userId: byCode.userId };
    } else if (row.pen) {
      const byPen = await matchPen(row.pen, birthdate);
      if (byPen && "reasonKey" in byPen) {
        outcomes.push({ line: row.line, name: row.name, status: "skipped", reasonKey: byPen.reasonKey });
        continue;
      }
      if (byPen) previous = { userId: byPen.userId };
    }
    if (previous) {
      const here = await db.membership.findFirst({
        where: { userId: previous.userId, schoolId, role: "STUDENT", status: { in: ["ACTIVE", "PENDING"] }, leftAt: null },
        select: { id: true },
      });
      if (here) {
        outcomes.push({ line: row.line, name: row.name, status: "skipped", reasonKey: "intake.alreadyOnRoll" });
        continue;
      }

      const newCode = studentCode();
      // A transfer row that carries the PEN puts it on the account it links.
      if (row.pen) await assignPen(previous.userId, row.pen).catch(() => {});
      let linkedMembershipId: string;
      try {
        const created = await forSchool(schoolId, () =>
          db.$tenantTransaction(async (rawTx) => {
            const tx = rawTx as typeof db;
            // A pupil who once left this school takes their old membership up again: one row per person and school.
            const prior = await tx.membership.findUnique({ where: { userId_schoolId_role: { userId: previous.userId, schoolId, role: "STUDENT" } }, select: { id: true } });
            const membership = prior
              ? await tx.membership.update({ where: { id: prior.id }, data: { status: "ACTIVE", leftAt: null, suspendedAt: null, suspendedReason: null, studentCode: newCode, joinedAt: new Date() }, select: { id: true } })
              : await tx.membership.create({
                  data: { userId: previous.userId, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: newCode },
                  select: { id: true },
                });
            if (klass) {
              await tx.enrollment.create({
                data: { classId: klass.id, schoolId, studentMembershipId: membership.id, status: "ACTIVE" },
              });
            }
            return { membershipId: membership.id };
          }),
        );
        linkedMembershipId = created.membershipId;
      } catch (error) {
        console.error("[admitPupils] transfer link failed for line", row.line, error);
        outcomes.push({ line: row.line, name: row.name, status: "failed", reasonKey: "intake.couldNotAdmit" });
        continue;
      }

      admitted++;
      await audit({
        schoolId,
        actorUserId: ctx.user.id,
        action: "student.admit",
        targetType: "Membership",
        targetId: linkedMembershipId,
        meta: { line: row.line, classId: klass?.id ?? null, hasBirthdate: true, ownAddress: false, linkedByCode: true },
      });
      await syncStandinGuardian({ schoolId, studentMembershipId: linkedMembershipId, actorUserId: ctx.user.id }).catch(
        (error) => console.error("[admitPupils] standin sync failed", error),
      );

      const promotedWarn = klass?.promotedAt ? ("intake.classWasPromoted" as const) : undefined;
      const linkedOutcome: IntakeOutcome = {
        warnKey: promotedWarn,
        line: row.line,
        name: row.name,
        status: "admitted",
        studentCode: newCode,
        // NO new first sign-in and no handle on the slip: the child keeps the
        // login they already use, which is the point of linking.
        className: klass?.name ?? null,
        guardian: "none",
        linked: true,
      };
      if (row.guardianEmail) {
        try {
          const link = await inviteParent(ctx, linkedMembershipId, {
            email: row.guardianEmail,
            name: row.guardianName ?? undefined,
            relation: row.relation,
          });
          if (link.ok) { linkedOutcome.guardian = "invited"; guardiansInvited++; }
          else { linkedOutcome.guardian = "notSent"; linkedOutcome.guardianReasonKey = link.errorKey; }
        } catch (error) {
          console.error("[admitPupils] guardian invite failed for line", row.line, error);
          linkedOutcome.guardian = "notSent";
          linkedOutcome.guardianReasonKey = "invites.couldNotSendRow";
        }
      }
      outcomes.push(linkedOutcome);
      continue;
    }

    const age = birthdate ? ageInYears(birthdate) : null;
    const isMinor = age === null ? true : age < 18;
    const code = studentCode();
    const handle = handleFor(row.name, code);

    let membershipId: string;
    try {
      const created = await forSchool(schoolId, () =>
        db.$tenantTransaction(async (rawTx) => {
          const tx = rawTx as typeof db;
          const user = await tx.user.create({
            data: {
              name: row.name,
              // A preferred name is the child's to choose, not the office's to
              // guess from a list; until they do, the directory shows the full name.
              preferredName: null,
              email: row.pupilEmail ?? `${handle}@${HANDLE_DOMAIN}`,
              // No password yet, deliberately — see the note above. With a real
              // address the pupil sets one through "Forgot password".
              passwordHash: null,
              birthdate,
              isMinor,
              penNumber: row.pen || null,
              prefs: writeJson({ theme: "system", locale: opts.locale }),
            },
            select: { id: true },
          });
          const membership = await tx.membership.create({
            data: { userId: user.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: code },
            select: { id: true },
          });
          // The record mirrors the PEN the account now carries.
          if (row.pen) await tx.pupilRecord.create({ data: { schoolId, studentMembershipId: membership.id, penNumber: row.pen, updatedByUserId: ctx.user.id } });
          if (klass) {
            await tx.enrollment.create({
              data: { classId: klass.id, schoolId, studentMembershipId: membership.id, status: "ACTIVE" },
            });
          }
          return { membershipId: membership.id };
        }),
      );
      membershipId = created.membershipId;
    } catch (error) {
      console.error("[admitPupils] failed for line", row.line, error);
      outcomes.push({ line: row.line, name: row.name, status: "failed", reasonKey: "intake.couldNotAdmit" });
      continue;
    }

    admitted++;
    await audit({
      schoolId,
      actorUserId: ctx.user.id,
      action: "student.admit",
      targetType: "Membership",
      targetId: membershipId,
      meta: {
        line: row.line,
        classId: klass?.id ?? null,
        hasBirthdate: birthdate !== null,
        ownAddress: row.pupilEmail !== null,
        needsConsent: age !== null && age < CONSENT_AGE,
      },
    });

    // The class teacher stands in as guardian until a parent accepts — the
    // same as for a child who joined with a code.
    await syncStandinGuardian({ schoolId, studentMembershipId: membershipId, actorUserId: ctx.user.id }).catch(
      (error) => console.error("[admitPupils] standin sync failed", error),
    );

    const outcome: IntakeOutcome = {
      warnKey: klass?.promotedAt ? "intake.classWasPromoted" : undefined,
      line: row.line,
      name: row.name,
      status: "admitted",
      studentCode: code,
      handle: row.pupilEmail ? undefined : handle,
      className: klass?.name ?? null,
      guardian: "none",
    };

    if (!row.pupilEmail) {
      // One code per handle pupil, minted with the account so the list the
      // office prints is the whole of what the child needs.
      const issued = await issueFirstSignIn(ctx, membershipId).catch((error) => {
        console.error("[admitPupils] first sign-in not issued for line", row.line, error);
        return null;
      });
      if (issued?.ok) outcome.firstSignInCode = issued.issued.code;
    }

    if (row.guardianEmail) {
      try {
        const link = await inviteParent(ctx, membershipId, {
          email: row.guardianEmail,
          name: row.guardianName ?? undefined,
          relation: row.relation,
        });
        if (link.ok) {
          outcome.guardian = "invited";
          guardiansInvited++;
        } else {
          outcome.guardian = "notSent";
          outcome.guardianReasonKey = link.errorKey;
        }
      } catch (error) {
        console.error("[admitPupils] guardian invite failed for line", row.line, error);
        outcome.guardian = "notSent";
        outcome.guardianReasonKey = "invites.couldNotSendRow";
      }
    }
    outcomes.push(outcome);
  }

  await audit({
    schoolId,
    actorUserId: ctx.user.id,
    action: "intake.run",
    meta: { rows: rows.length, admitted, guardiansInvited, skipped: outcomes.length - admitted },
  });

  return { outcomes, admitted, guardiansInvited };
}
