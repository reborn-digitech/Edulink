import "server-only";
import { db } from "./db";
import { normalizeCode, studentCode } from "./codes";
import { ageInYears } from "./dates";
import { audit } from "./audit";
import { forJoinCode, forSchool } from "./tenant-context";
import { syncStandinGuardian } from "./standin-guardian";
import { consume, consumeByCaller, retryHintKey, CODE_LOOKUPS, SCHOOL_CODE_JOINS } from "./rate-limit";
import type { FieldErrors } from "./validation";
import type { ActiveContext } from "./session";
import type { Translate } from "./i18n/dictionary";
import { syncGradeLevel } from "./grade-level";

/**
 * Joining with a school or class code, as rules rather than as a page.
 *
 * Moved out of app/join/actions.ts so two doors share one set of rules: the
 * web's /join (whose server actions keep the cookie session they have always
 * set) and the phone's POST /api/v1/join, which switches its own bearer
 * session instead. Neither function here touches a session or a cookie —
 * that is the one thing the doors do differently, so it stays with them.
 */

/** "in about 5 minutes", in the reader's language. See `retryHintKey`. */
function hint(t: Translate, seconds: number): string {
  const h = retryHintKey(seconds);
  return t(h.key, h.vars);
}

/* -------------------------------------------------------------------------- */
/* Code lookup                                                                 */
/* -------------------------------------------------------------------------- */

export type CodeLookup =
  | { ok: true; kind: "school"; schoolId: string; schoolName: string; logoPath: string | null; brandPrimary: string | null }
  | { ok: true; kind: "class"; schoolId: string; schoolName: string; classId: string; className: string; logoPath: string | null; brandPrimary: string | null }
  | { ok: false; error: string };

/**
 * A lookup's refusal, with how long to wait when the refusal is the limit —
 * which the web ignores (the sentence says it) and the API turns into a 429.
 */
export type JoinCodeLookup = Exclude<CodeLookup, { ok: false }> | { ok: false; error: string; retryAfterSeconds?: number };

/**
 * Resolves a school code OR a class code from the same box.
 *
 * One input rather than two: a child holding a code off the whiteboard does not
 * know, and should not have to know, which kind it is. (§7 no dead ends)
 */
export async function lookupJoinCode(raw: string, t: Translate): Promise<JoinCodeLookup> {
  const code = normalizeCode(raw ?? "");
  if (code.length < 4) return { ok: false, error: t("join.codeTooShort") };
  if (code.length > 32) return { ok: false, error: t("join.codeTooLong") };

  /**
   * ⚠ NOT A SECRET, BUT NOT ENUMERABLE EITHER.
   *
   * A class code is printed on a poster and photographed off a whiteboard, and
   * this function is deliberately readable with no session because working out
   * which school a code belongs to IS the question. What it must not be is a
   * loop: grind the space, find a real class, and `joinAsStudent` turns that
   * into a pupil account inside somebody's school.
   *
   * Keyed on the client address, with the caveat spelled out on CODE_LOOKUPS —
   * behind a proxy that sets `x-forwarded-for` this is the caller; in front of
   * one it is forgeable. It raises the cost of enumeration from nothing to
   * something rather than being a wall, and the reason that is tolerable is
   * that a code grants a PENDING membership and sight of nothing. The phone's
   * POST /api/v1/join/lookup comes through here too, so it counts against the
   * same allowance.
   */
  const gate = await consumeByCaller("code-lookup", CODE_LOOKUPS);
  if (!gate.allowed) {
    return {
      ok: false,
      error: t("join.tooManyTries", { when: hint(t, gate.retryAfterSeconds) }),
      retryAfterSeconds: gate.retryAfterSeconds,
    };
  }

  // BOTH lookups run under the code itself. There is no school to scope them to
  // — working out which school this code belongs to is the entire question — so
  // the policies let exactly the row whose code matches come back, and nothing
  // else. Without this every join code on the installation reads as "we could
  // not find that code", which is what it did.
  //
  // TWO PASSES for the class, and NOT one query with `include: { school }`. The
  // code opens exactly the row it names: a CLASS join code does not match the
  // school's own code, so the joined school came back null and Prisma refused
  // the required relation — a 500 in place of a welcome screen. The class names
  // its school, and having been shown the class is what earns the right to read
  // it, so the second pass is scoped to that school by id.
  const klass = await forJoinCode(code, () =>
    db.class.findUnique({ where: { joinCode: code } }),
  );

  if (klass && !klass.archivedAt) {
    const school = await forSchool(klass.schoolId, () =>
      db.school.findUniqueOrThrow({
        where: { id: klass.schoolId },
        select: { id: true, name: true, logoPath: true, brandPrimary: true, removedAt: true },
      }),
    );

    // A removed school's codes keep circulating on paper; they must stop
    // working here. "Not found" rather than an explanation — the code is dead.
    if (school.removedAt) return { ok: false, error: t("join.codeNotFound") };

    return {
      ok: true,
      kind: "class",
      schoolId: klass.schoolId,
      schoolName: school.name,
      classId: klass.id,
      className: klass.name,
      logoPath: school.logoPath,
      brandPrimary: school.brandPrimary,
    };
  }

  const school = await forJoinCode(code, () =>
    db.school.findUnique({
      where: { code },
      select: { id: true, name: true, logoPath: true, brandPrimary: true, removedAt: true },
    }),
  );

  if (school && school.removedAt) return { ok: false, error: t("join.codeNotFound") };

  if (school) {
    return {
      ok: true,
      kind: "school",
      schoolId: school.id,
      schoolName: school.name,
      logoPath: school.logoPath,
      brandPrimary: school.brandPrimary,
    };
  }

  return {
    ok: false,
    error: t("join.codeNotFound"),
  };
}

/* -------------------------------------------------------------------------- */
/* Join with a code ON THE ACCOUNT YOU ALREADY HAVE                            */
/* -------------------------------------------------------------------------- */

export type JoinWithAccountResult =
  | { ok: true; schoolId: string; membershipId: string; alreadyHere: boolean }
  | { ok: false; errors: FieldErrors; retryAfterSeconds?: number };

/**
 * A signed-in person joins a school or a class as a pupil with their own
 * account — no new user, no password, no second identity.
 *
 * THE WIZARD MINTS AN ACCOUNT. That is right for a child with nothing, and
 * wrong for everyone who already has something: a pupil changing school, or
 * one a parent set up, who was told "join with the class code" and got a
 * second login with an empty record. The leaving certificate, the report
 * cards and the badges are on THIS user id, so this is where the membership
 * goes.
 *
 * Refused, with a sentence, when the account is plainly not a pupil's: it
 * guards a child, or it already holds a staff post at this school. A pupil
 * already on the roll here is simply enrolled in the class the code names.
 *
 * Sets no session: the caller switches its own (a cookie on the web, the
 * bearer session's active context on the phone) once this says yes.
 */
export async function joinWithAccount(session: ActiveContext, rawCode: string, t: Translate): Promise<JoinWithAccountResult> {
  const lookup = await lookupJoinCode(rawCode, t);
  if (!lookup.ok) {
    return { ok: false, errors: { code: lookup.error }, ...(lookup.retryAfterSeconds !== undefined ? { retryAfterSeconds: lookup.retryAfterSeconds } : {}) };
  }

  /**
   * A SCHOOL code, unlike a class code, puts the account on the roll as an
   * active pupil with nobody's say-so. The lookup's limit is per address; this
   * one is per account, so a login that keeps joining schools is stopped by
   * its own name rather than by whichever address it borrowed. Counted before
   * the joins that follow, and refused with the lookup's own sentence.
   */
  if (lookup.kind === "school") {
    const gate = await consume(`join-school:${session.user.id}`, SCHOOL_CODE_JOINS.limit, SCHOOL_CODE_JOINS.windowMs);
    if (!gate.allowed) {
      return { ok: false, errors: { code: t("join.tooManyTries", { when: hint(t, gate.retryAfterSeconds) }) }, retryAfterSeconds: gate.retryAfterSeconds };
    }
  }

  const [guards, postHere, user] = await Promise.all([
    db.guardianship.count({ where: { parentUserId: session.user.id, status: "ACTIVE" } }),
    forSchool(lookup.schoolId, () =>
      db.membership.findFirst({
        where: { userId: session.user.id, schoolId: lookup.schoolId, role: { not: "STUDENT" }, status: { not: "REMOVED" } },
        select: { id: true },
      }),
    ),
    db.user.findUniqueOrThrow({ where: { id: session.user.id }, select: { birthdate: true } }),
  ]);
  if (guards > 0) return { ok: false, errors: { _form: t("join.thisIsAParentsAccount") } };
  if (postHere) return { ok: false, errors: { _form: t("join.youWorkHere") } };

  const age = user.birthdate ? ageInYears(user.birthdate) : null;
  let membershipId: string;
  let alreadyHere = false;

  try {
    const result = await forSchool(lookup.schoolId, () =>
      db.$tenantTransaction(async (rawTx) => {
        const tx = rawTx as typeof db;
        const existing = await tx.membership.findFirst({
          where: { userId: session.user.id, schoolId: lookup.schoolId, role: "STUDENT" },
          select: { id: true, status: true, leftAt: true },
        });
        let id: string;
        if (existing && existing.status === "ACTIVE" && !existing.leftAt) {
          id = existing.id;
          alreadyHere = true;
        } else if (existing) {
          // Came back after leaving: the same membership returns to the roll,
          // so their history here is theirs again. The leaving certificate
          // goes with the leaving: "left on the 30th" is no longer true of a
          // child on tomorrow's register, and one certificate per membership
          // is the rule — the next departure, if there is one, writes a fresh
          // one over the whole stay. (A battery found the old row blocking
          // every later departure.)
          await tx.schoolRecord.deleteMany({ where: { studentMembershipId: existing.id, schoolId: lookup.schoolId } });
          await tx.membership.update({
            where: { id: existing.id },
            // A suspension is over when the pupil is back on the roll: the
            // stamp and the reason go with the status, as they do on the
            // office's own reinstate and on the admission and intake paths.
            data: { status: "ACTIVE", leftAt: null, suspendedAt: null, suspendedReason: null, studentCode: studentCode() },
          });
          id = existing.id;
        } else {
          const made = await tx.membership.create({
            data: {
              userId: session.user.id,
              schoolId: lookup.schoolId,
              role: "STUDENT",
              status: "ACTIVE",
              studentCode: studentCode(),
            },
            select: { id: true },
          });
          id = made.id;
        }

        if (lookup.kind === "class") {
          await tx.enrollment.upsert({
            where: { classId_studentMembershipId: { classId: lookup.classId, studentMembershipId: id } },
            create: { classId: lookup.classId, schoolId: lookup.schoolId, studentMembershipId: id, status: "ACTIVE" },
            update: { status: "ACTIVE", removedAt: null },
          });
          await syncGradeLevel(tx, [id]);
        }

        if (age !== null) {
          await tx.user.update({ where: { id: session.user.id }, data: { isMinor: age < 18 } });
        }
        return id;
      }),
    );
    membershipId = result;
  } catch (error) {
    console.error("[joinWithMyAccount]", error);
    return { ok: false, errors: { _form: t("join.couldNotSetUp") } };
  }

  await audit({
    schoolId: lookup.schoolId,
    actorUserId: session.user.id,
    action: "student.join",
    meta: { via: lookup.kind, existingAccount: true, alreadyHere },
  });

  await syncStandinGuardian({
    schoolId: lookup.schoolId,
    studentMembershipId: membershipId,
    actorUserId: session.user.id,
  }).catch((error) => console.error("[joinWithMyAccount] standin sync failed", error));

  return { ok: true, schoolId: lookup.schoolId, membershipId, alreadyHere };
}
