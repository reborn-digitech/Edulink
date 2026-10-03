import "server-only";
import { db } from "./db";
import { normalizeCode } from "./codes";
import { forJoinCode, forSchool } from "./tenant-context";
import { requestToJoin } from "./join-requests";
import { AccessError } from "./tenancy";
import { consume, consumeByCaller, retryHintKey, CODE_LOOKUPS, SCHOOL_CODE_JOINS } from "./rate-limit";
import type { FieldErrors } from "./validation";
import type { ActiveContext } from "./session";
import type { Translate } from "./i18n/dictionary";

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
   * that a code grants a REQUEST to join and sight of nothing. The phone's
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
  | { ok: true; schoolId: string; schoolName: string; className: string | null; requestId: string; alreadyWaiting: boolean }
  | { ok: false; errors: FieldErrors; retryAfterSeconds?: number };

/**
 * A signed-in person ASKS to join a school or a class as a pupil with their
 * own account — no new user, no password, no second identity.
 *
 * THE WIZARD MINTS AN ACCOUNT. That is right for a child with nothing, and
 * wrong for everyone who already has something: a pupil changing school, or
 * one a parent set up, who was told "join with the class code" and got a
 * second login with an empty record. The leaving certificate, the report
 * cards and the badges are on THIS user id, so this is where the membership
 * will go.
 *
 * ⚠ IT WAITS. This used to put the account on the roll at once; it now files
 * a request, and the office (a school's code) or the class's teacher (a
 * class's code) lets them in — see lib/join-requests.ts, whose `admit` is
 * what this function used to do. A pupil already on the roll who types
 * another class's code asks that class's teacher the same way.
 *
 * Refused, with a sentence, when the account is plainly not a pupil's: it
 * guards a child, or it already holds a staff post at this school.
 *
 * Sets no session and switches none: there is nothing to switch to until
 * somebody has said yes.
 */
export async function joinWithAccount(session: ActiveContext, rawCode: string, t: Translate): Promise<JoinWithAccountResult> {
  const lookup = await lookupJoinCode(rawCode, t);
  if (!lookup.ok) {
    return { ok: false, errors: { code: lookup.error }, ...(lookup.retryAfterSeconds !== undefined ? { retryAfterSeconds: lookup.retryAfterSeconds } : {}) };
  }

  /**
   * The lookup's limit is per address; this one is per account, so a login
   * that keeps asking schools is stopped by its own name rather than by
   * whichever address it borrowed. Counted before the request is filed, and
   * refused with the lookup's own sentence.
   */
  if (lookup.kind === "school") {
    const gate = await consume(`join-school:${session.user.id}`, SCHOOL_CODE_JOINS.limit, SCHOOL_CODE_JOINS.windowMs);
    if (!gate.allowed) {
      return { ok: false, errors: { code: t("join.tooManyTries", { when: hint(t, gate.retryAfterSeconds) }) }, retryAfterSeconds: gate.retryAfterSeconds };
    }
  }

  const [guards, postHere] = await Promise.all([
    db.guardianship.count({ where: { parentUserId: session.user.id, status: "ACTIVE" } }),
    forSchool(lookup.schoolId, () =>
      db.membership.findFirst({
        // A post here, not a former pupil's alumni row: an alumnus comes back to the roll by the same code (alumni-membership.ts).
        where: { userId: session.user.id, schoolId: lookup.schoolId, role: { notIn: ["STUDENT", "ALUMNUS"] }, status: { not: "REMOVED" } },
        select: { id: true },
      }),
    ),
  ]);
  if (guards > 0) return { ok: false, errors: { _form: t("join.thisIsAParentsAccount") } };
  if (postHere) return { ok: false, errors: { _form: t("join.youWorkHere") } };

  // On the roll already and asking for no class: there is nothing to ask for.
  if (lookup.kind === "school") {
    const onRoll = await forSchool(lookup.schoolId, () =>
      db.membership.findFirst({ where: { userId: session.user.id, schoolId: lookup.schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null }, select: { id: true } }),
    );
    if (onRoll) return { ok: false, errors: { _form: t("join.alreadyOnTheRoll") } };
  }

  try {
    const filed = await requestToJoin(
      session.user.id,
      lookup.kind === "class" ? { kind: "class", schoolId: lookup.schoolId, classId: lookup.classId } : { kind: "school", schoolId: lookup.schoolId },
    );
    return {
      ok: true,
      schoolId: lookup.schoolId,
      schoolName: lookup.schoolName,
      className: lookup.kind === "class" ? lookup.className : null,
      requestId: filed.requestId,
      alreadyWaiting: filed.alreadyWaiting,
    };
  } catch (error) {
    if (error instanceof AccessError) return { ok: false, errors: { _form: t(error.key, error.vars) } };
    console.error("[joinWithMyAccount]", error);
    return { ok: false, errors: { _form: t("join.couldNotSetUp") } };
  }
}
