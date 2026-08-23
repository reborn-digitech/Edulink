import "server-only";
import { db } from "./db";
import { AccessError } from "./tenancy";
import { audit } from "./audit";
import { forSchool } from "./tenant-context";
import { studentCode } from "./codes";
import { HANDLE_DOMAIN } from "./login-name";
import { writeJson } from "./json";
import { ageInYears, parseDateOnly } from "./dates";
import { syncStandinGuardian } from "./standin-guardian";
import { inviteParent } from "./parent-link";
import { CONSENT_AGE } from "./constants";
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
 * A PUPIL WITHOUT AN ADDRESS HAS NO PASSWORD YET. That is the same state a
 * parent-managed account is in, and the honest one: the office does not
 * carry children's passwords around on a list. The result page shows each
 * child's handle and student code, which is what a parent claims with and
 * what the child signs in with once a password is set.
 */

export type IntakeOutcome = {
  line: number;
  name: string;
  status: "admitted" | "skipped" | "failed";
  reasonKey?: TranslationKey;
  /** For an admitted pupil. */
  studentCode?: string;
  handle?: string;
  className?: string | null;
  guardian?: "invited" | "none" | "notSent";
  guardianReasonKey?: TranslationKey;
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
  opts: { locale: string },
): Promise<IntakeResult> {
  const schoolId = requireAdmin(ctx);
  if (rows.length > INTAKE_MAX_ROWS) throw new AccessError("access.tooManyPupilsAtOnce", "FORBIDDEN", { max: INTAKE_MAX_ROWS });

  // Classes by name, case-blind, live ones only — a list that names an
  // archived class is naming a class the school no longer runs.
  const classes = await db.class.findMany({
    where: { schoolId, archivedAt: null },
    select: { id: true, name: true },
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
              prefs: writeJson({ theme: "system", locale: opts.locale }),
            },
            select: { id: true },
          });
          const membership = await tx.membership.create({
            data: { userId: user.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: code },
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
      line: row.line,
      name: row.name,
      status: "admitted",
      studentCode: code,
      handle: row.pupilEmail ? undefined : handle,
      className: klass?.name ?? null,
      guardian: "none",
    };

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
