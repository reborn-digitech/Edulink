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
import { issueFirstSignIn } from "./first-signin";
import { CONSENT_AGE } from "./constants";
import { assignPen, matchPen, mayBringOver, normalisePen } from "./pen";
import { consume, INTAKE_RUNS, INTAKE_MAX_LINKS } from "./rate-limit";
import type { IntakeRow } from "./csv";
import type { ActiveContext } from "./session";
import type { TranslationKey } from "./i18n/dictionary";
import { syncGradeLevel } from "./grade-level";

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

/**
 * Thrown when the school has sent more linking lists this hour than
 * `INTAKE_RUNS` allows. Carries the wait so the action can say it and the
 * API can answer 429 with Retry-After rather than a 422 that invites another
 * go. An AccessError, so every caller that already catches one still does.
 */
export class IntakeLimited extends AccessError {
  constructor(readonly retryAfterSeconds: number) {
    super("intake.tooManyRuns", "FORBIDDEN");
    this.name = "IntakeLimited";
  }
}

/** A row that would LINK an existing account rather than mint one. */
export function isLinkingRow(row: Pick<IntakeRow, "studentCode" | "pen">): boolean {
  // `pen` is false for a malformed number: still a linking row, refused later by name.
  return Boolean(row.studentCode) || Boolean(row.pen) || row.pen === false;
}

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

  /**
   * ⚠ LINKING ROWS ARE COUNTED BEFORE ANY ROW IS READ. A row carrying a
   * student code or a PEN is a guess at an existing child's birthday until
   * proved otherwise, and a list is a batch of them: fifty at most, and ten
   * such lists an hour for the school, refused as a whole rather than
   * trimmed — a trimmed list would be a rate limit with a loophole the size
   * of the trim. Both refusals name the rule; neither names a pupil. See
   * INTAKE_RUNS in rate-limit.ts.
   */
  const linking = rows.filter(isLinkingRow).length;
  if (linking > INTAKE_MAX_LINKS) throw new AccessError("intake.tooManyLinks", "FORBIDDEN", { max: INTAKE_MAX_LINKS });
  if (linking > 0) {
    const gate = await consume(`intake:links:${schoolId}`, INTAKE_RUNS.limit, INTAKE_RUNS.windowMs);
    if (!gate.allowed) throw new IntakeLimited(gate.retryAfterSeconds);
  }

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
     * ⚠ A TRANSFER LINKS; IT NEVER MINTS. A row carrying the pupil's PEN and
     * date of birth attaches the new membership to the child's EXISTING
     * account, so the leaving certificate — which follows the person — is
     * readable to this school the moment the child is on its roll, and the
     * child keeps the login they already know.
     *
     * THE STUDENT CODE NO LONGER DOES THIS. It did: the code was printed on
     * the leaving certificate beside the date of birth, and a row carrying
     * the pair linked the account. A certificate is a paper that changes
     * hands, the pair on it never expired and could be used again and again,
     * and the same pair is what a guardian's claim asks for. The certificate
     * now prints the school's own register number, and a row that carries
     * another school's student code is refused with a sentence that says
     * what to send instead. A child with no PEN arriving from elsewhere is
     * admitted as a new pupil; the PEN is how an account follows a child
     * between schools. A code THIS school gave still names its own former
     * pupil, from its own books, and brings them back.
     *
     * ⚠ AND THE PEN WITH THE DATE IS NOT ENOUGH EITHER. Anybody could register
     * a school and be its admin within the minute. A link also needs the
     * handshake in `mayBringOver`: the child is on no other school's roll
     * (the holding school records the departure first) and this school is
     * verified by the operator. Every way the match can fail — wrong date,
     * child still elsewhere, school not verified — reads the ONE key
     * `intake.identityRefused`, so a wrong guess learns nothing about which
     * half was wrong.
     */
    if (row.pen === false) {
      outcomes.push({ line: row.line, name: row.name, status: "skipped", reasonKey: "intake.penFormat" });
      continue;
    }
    // A PEN with the date of birth names an account the same way a transfer
    // code does; a PEN nobody on Shalaghar holds goes on the new account below.
    let previous: { userId: string } | null = null;
    if (row.studentCode) {
      // ONLY A CODE THIS SCHOOL GAVE. Read with this school bound, so the
      // lookup cannot see another school's membership at all: a code from
      // anywhere else, real or invented, finds nothing and is told the same
      // sentence. What is left is a pupil coming back to a school that
      // already knew them, named by a number from that school's own books.
      const ownCode = row.studentCode.trim().toUpperCase();
      const own = await forSchool(schoolId, () =>
        db.membership.findFirst({
          where: { studentCode: ownCode, schoolId, role: "STUDENT" },
          select: { userId: true, user: { select: { birthdate: true } } },
        }),
      );
      if (!own) {
        outcomes.push({ line: row.line, name: row.name, status: "skipped", reasonKey: "intake.codeNoLongerLinks" });
        continue;
      }
      if (!birthdate) {
        outcomes.push({ line: row.line, name: row.name, status: "skipped", reasonKey: "intake.codeNeedsBirthdate" });
        continue;
      }
      const known = own.user.birthdate;
      if (!known || known.toISOString().slice(0, 10) !== birthdate.toISOString().slice(0, 10)) {
        outcomes.push({ line: row.line, name: row.name, status: "skipped", reasonKey: "intake.identityRefused" });
        continue;
      }
      previous = { userId: own.userId };
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
      if (!(await mayBringOver(schoolId, previous.userId))) {
        outcomes.push({ line: row.line, name: row.name, status: "skipped", reasonKey: "intake.identityRefused" });
        continue;
      }

      const newCode = studentCode();
      // A transfer row that carries the PEN puts it on the account it links —
      // only onto an account that has none: a different number on file is a
      // correction, which needs the head and the family; a number already on
      // another pupil's account is refused. Either way the row SAYS SO: this
      // used to swallow both, and the office read "admitted" over a PEN the
      // sheet had quietly dropped.
      let penWarn: TranslationKey | undefined;
      if (row.pen) {
        const onFile = (await db.user.findUnique({ where: { id: previous.userId }, select: { penNumber: true } }))?.penNumber ?? null;
        if (onFile && onFile !== normalisePen(row.pen)) penWarn = "intake.penDiffers";
        else if (!onFile) {
          try {
            await assignPen(previous.userId, row.pen);
          } catch {
            penWarn = "intake.penTaken";
          }
        }
      }
      let linkedMembershipId: string;
      try {
        const created = await forSchool(schoolId, () =>
          db.$tenantTransaction(async (rawTx) => {
            const tx = rawTx as typeof db;
            // A pupil who once left this school takes their old membership up again: one row per person and school.
            const prior = await tx.membership.findUnique({ where: { userId_schoolId_role: { userId: previous.userId, schoolId, role: "STUDENT" } }, select: { id: true } });
            // Back on the roll: the departure record and its scheduled leaving go, so no certificate prints the old leaving date.
            if (prior) {
              await tx.schoolRecord.deleteMany({ where: { studentMembershipId: prior.id, schoolId } });
              await tx.scheduledDeparture.deleteMany({ where: { membershipId: prior.id, schoolId } });
            }
            const membership = prior
              ? await tx.membership.update({ where: { id: prior.id }, data: { status: "ACTIVE", leftAt: null, suspendedAt: null, suspendedReason: null, studentCode: newCode, joinedAt: new Date() }, select: { id: true } })
              : await tx.membership.create({
                  data: { userId: previous.userId, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: newCode },
                  select: { id: true },
                });
            if (klass) {
              // Upsert, not create: a pupil back on the roll may have sat in this class before, and the unique index is on (classId, studentMembershipId).
              await tx.enrollment.upsert({
                where: { classId_studentMembershipId: { classId: klass.id, studentMembershipId: membership.id } },
                create: { classId: klass.id, schoolId, studentMembershipId: membership.id, status: "ACTIVE" },
                update: { status: "ACTIVE", removedAt: null, enrolledAt: new Date() },
              });
              await syncGradeLevel(tx, [membership.id]);
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
        warnKey: promotedWarn ?? penWarn,
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
            await syncGradeLevel(tx, [membership.id]);
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
