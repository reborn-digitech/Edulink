import "server-only";
import { closeAlumnus } from "./alumni-membership";
import { db } from "./db";
import { studentCode } from "./codes";
import { ageInYears } from "./dates";
import { audit } from "./audit";
import { notify } from "./notify";
import { AccessError } from "./tenancy";
import { forSchool, forUser } from "./tenant-context";
import { syncStandinGuardian } from "./standin-guardian";
import { syncGradeLevel } from "./grade-level";
import { closeLeavingRecord } from "./school-record";
import type { ActiveContext } from "./session";
import { COOL_OFF_DAYS, coolOffCutoff, statusNow, stillWaiting, waitingCutoff } from "./request-expiry";

/**
 * Asking to join, and being let in.
 *
 * A SCHOOL'S CODE AND A CLASS'S CODE ARE ON POSTERS. Typing one used to put
 * the typist on the roll at once, as an active pupil: on the register, in the
 * class's feed, a name among the children. The security assessment of
 * 2026-09-24 made the codes longer and the joins fewer per account (finding
 * 9) and left the flow itself for a decision, which was taken on 2026-09-29:
 * a join waits.
 *
 *   A join by the SCHOOL'S code waits for the office.
 *   A join by a CLASS'S code waits for a teacher of that class, or the office.
 *
 * WHAT A REQUEST IS: one row in JoinRequest, and nothing else. No
 * membership, no enrolment, no stand-in guardian, no tenant — so the person
 * who asked sees nothing of the school, and nothing in the school counts
 * them, until somebody who knows the class has said yes. Approval then does
 * exactly what the join used to do at once (`admit`, below).
 *
 * THE ASKER IS NOT TOLD WHO ELSE IS THERE. They read their own request, by
 * their own user id, and the names of the school and the class they already
 * saw when they typed the code.
 */

export type JoinTarget =
  | { kind: "school"; schoolId: string }
  | { kind: "class"; schoolId: string; classId: string };

export type JoinRequestResult = { requestId: string; schoolId: string; alreadyWaiting: boolean };

/**
 * Records the request and tells the people who may decide it. Runs under the
 * school's binding: the asker belongs to nothing yet, and the school the code
 * named is the tenant the row is filed in.
 *
 * ASKING TWICE IS ASKING ONCE. A second request for the same school and
 * class while the first waits returns the first, and tells nobody again —
 * a child pressing the button five times is one line in a teacher's queue.
 */
export async function requestToJoin(userId: string, target: JoinTarget): Promise<JoinRequestResult> {
  const classId = target.kind === "class" ? target.classId : null;
  return forSchool(target.schoolId, async () => {
    const waiting = await db.joinRequest.findFirst({
      where: { userId, schoolId: target.schoolId, classId, ...stillWaiting() },
      select: { id: true },
    });
    if (waiting) return { requestId: waiting.id, schoolId: target.schoolId, alreadyWaiting: true };

    // SEVEN DAYS AFTER A NO — see lib/request-expiry.ts. The same school and
    // class: a pupil declined by one class's teacher may still ask another's.
    const declined = await db.joinRequest.findFirst({
      where: { userId, schoolId: target.schoolId, classId, status: "DECLINED", decidedAt: { gte: coolOffCutoff() } },
      select: { id: true },
    });
    if (declined) throw new AccessError("join.declinedRecently", "FORBIDDEN", { days: COOL_OFF_DAYS });

    // One left PENDING past its thirty days, which the nightly job has not
    // reached: it stops waiting here, so that asking again is a new request.
    await db.joinRequest.updateMany({
      where: { userId, schoolId: target.schoolId, classId, status: "PENDING", createdAt: { lt: waitingCutoff() } },
      data: { status: "EXPIRED", decidedAt: new Date() },
    });

    const made = await db.joinRequest.create({
      data: { userId, schoolId: target.schoolId, classId, via: target.kind === "class" ? "CLASS" : "SCHOOL" },
      select: { id: true },
    });

    await audit({
      schoolId: target.schoolId,
      actorUserId: userId,
      action: "student.join.request",
      targetType: "JoinRequest",
      targetId: made.id,
      meta: { via: target.kind },
    });

    const [asker, klass] = await Promise.all([
      db.user.findUnique({ where: { id: userId }, select: { name: true, preferredName: true } }),
      classId ? db.class.findUnique({ where: { id: classId }, select: { name: true } }) : Promise.resolve(null),
    ]);
    const deciders = await decidersOf(target.schoolId, classId);
    await Promise.all(
      deciders.map((to) =>
        notify({
          userId: to,
          schoolId: target.schoolId,
          kind: "SYSTEM",
          titleKey: klass ? "joinRequests.notifAskedClass" : "joinRequests.notifAskedSchool",
          titleVars: { name: asker?.preferredName ?? asker?.name ?? "", className: klass?.name ?? "" },
          bodyKey: "joinRequests.notifAskedBody",
          url: "/joins",
        }).catch((error) => console.error("[requestToJoin] notice failed", error)),
      ),
    );

    return { requestId: made.id, schoolId: target.schoolId, alreadyWaiting: false };
  });
}

/** The user ids of whoever may decide: the class's teachers where it has any, otherwise the office. */
async function decidersOf(schoolId: string, classId: string | null): Promise<string[]> {
  if (classId) {
    const teachers = await db.classTeacher.findMany({
      where: { classId, schoolId, teacher: { status: "ACTIVE", leftAt: null } },
      select: { teacher: { select: { userId: true } } },
    });
    if (teachers.length > 0) return [...new Set(teachers.map((row) => row.teacher.userId))];
  }
  const office = await db.membership.findMany({
    where: { schoolId, role: "ADMIN", status: "ACTIVE", leftAt: null },
    select: { userId: true },
  });
  return [...new Set(office.map((row) => row.userId))];
}

/* -------------------------------------------------------------------------- */
/* The asker's own view                                                        */
/* -------------------------------------------------------------------------- */

export type MyJoinRequest = {
  id: string;
  status: "PENDING" | "DECLINED" | "EXPIRED";
  schoolName: string;
  className: string | null;
  /** What the decider chose to say with a decline; null when they said nothing. */
  declineReason: string | null;
  createdAt: Date;
};

/**
 * What the asker is waiting on. Their own rows, by their own id; the names
 * are read under each school's binding, which the request itself earns —
 * they were shown both names when they typed the code.
 */
export async function myJoinRequests(userId: string): Promise<MyJoinRequest[]> {
  const rows = await forUser(userId, () =>
    db.joinRequest.findMany({
      where: { userId, status: { in: ["PENDING", "DECLINED", "EXPIRED"] } },
      select: { id: true, status: true, schoolId: true, classId: true, createdAt: true, declineReason: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  );
  return Promise.all(
    rows.map(async (row) => {
      const names = await forSchool(row.schoolId, async () => ({
        school: await db.school.findUnique({ where: { id: row.schoolId }, select: { name: true } }),
        klass: row.classId ? await db.class.findUnique({ where: { id: row.classId }, select: { name: true } }) : null,
      }));
      return {
        id: row.id,
        status: statusNow(row) as MyJoinRequest["status"],
        schoolName: names.school?.name ?? "",
        className: names.klass?.name ?? null,
        declineReason: row.status === "DECLINED" ? row.declineReason : null,
        createdAt: row.createdAt,
      };
    }),
  );
}

/* -------------------------------------------------------------------------- */
/* The queue                                                                   */
/* -------------------------------------------------------------------------- */

export type WaitingJoin = {
  id: string;
  name: string;
  /** Their age in whole years, when they gave a date of birth: what a teacher checks against the class. */
  age: number | null;
  via: "SCHOOL" | "CLASS";
  classId: string | null;
  className: string | null;
  /** On this school's roll already, asking only for the class. */
  onRoll: boolean;
  createdAt: Date;
};

/** The classes a teacher may decide for; an admin decides for the school. */
async function decidable(session: ActiveContext): Promise<{ schoolId: string; classIds: string[] | "all" } | null> {
  const { schoolId, membershipId, role } = session;
  if (!schoolId || !membershipId) return null;
  if (role === "ADMIN") return { schoolId, classIds: "all" };
  if (role !== "TEACHER") return null;
  const mine = await db.classTeacher.findMany({ where: { teacherMembershipId: membershipId, schoolId }, select: { classId: true } });
  return { schoolId, classIds: mine.map((row) => row.classId) };
}

/** The requests waiting on this person, oldest first. Empty for anybody who decides none. */
export async function waitingJoins(session: ActiveContext): Promise<WaitingJoin[]> {
  const scope = await decidable(session);
  if (!scope) return [];
  if (scope.classIds !== "all" && scope.classIds.length === 0) return [];
  const rows = await db.joinRequest.findMany({
    where: { schoolId: scope.schoolId, ...stillWaiting(), ...(scope.classIds === "all" ? {} : { classId: { in: scope.classIds } }) },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: {
      id: true,
      via: true,
      classId: true,
      createdAt: true,
      userId: true,
      class: { select: { name: true } },
      user: { select: { name: true, preferredName: true, birthdate: true } },
    },
  });
  const here = await db.membership.findMany({
    where: { schoolId: scope.schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null, userId: { in: rows.map((row) => row.userId) } },
    select: { userId: true },
  });
  const onRoll = new Set(here.map((row) => row.userId));
  return rows.map((row) => ({
    id: row.id,
    // The name they gave, in full: the person deciding is matching it against a class list.
    name: row.user.name,
    age: row.user.birthdate ? ageInYears(row.user.birthdate) : null,
    via: row.via === "CLASS" ? "CLASS" : "SCHOOL",
    classId: row.classId,
    className: row.class?.name ?? null,
    onRoll: onRoll.has(row.userId),
    createdAt: row.createdAt,
  }));
}

export async function waitingJoinCount(session: ActiveContext): Promise<number> {
  const scope = await decidable(session);
  if (!scope) return 0;
  if (scope.classIds !== "all" && scope.classIds.length === 0) return 0;
  return db.joinRequest.count({
    where: { schoolId: scope.schoolId, ...stillWaiting(), ...(scope.classIds === "all" ? {} : { classId: { in: scope.classIds } }) },
  });
}

/* -------------------------------------------------------------------------- */
/* The decision                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Lets somebody in, or does not.
 *
 * WHO MAY: an admin of the school; a teacher of the class the code named. A
 * teacher cannot decide a join by the school's code, which names no class,
 * and another school's staff find nothing — the same NOT_FOUND an id that
 * never existed gets.
 *
 * DECIDED ONCE. The status write is conditional on PENDING and comes FIRST,
 * so two people pressing together admit one pupil, not two memberships.
 *
 * A PARENT'S ACCOUNT AND A MEMBER OF STAFF ARE STILL REFUSED, here as well
 * as when they asked: an account can change between the asking and the yes.
 */
export async function decideJoin(session: ActiveContext, requestId: string, decision: "APPROVE" | "DECLINE", reason?: string): Promise<void> {
  const scope = await decidable(session);
  if (!scope) throw new AccessError("access.youCannotDecideJoins");

  const request = await db.joinRequest.findFirst({
    where: { id: requestId, schoolId: scope.schoolId },
    select: { id: true, userId: true, classId: true, via: true, status: true, createdAt: true, class: { select: { name: true, archivedAt: true } }, school: { select: { name: true } } },
  });
  if (!request) throw new AccessError("access.joinRequestNotFound", "NOT_FOUND");
  if (scope.classIds !== "all") {
    if (!request.classId) throw new AccessError("access.onlyTheOfficeDecidesASchoolJoin");
    if (!scope.classIds.includes(request.classId)) throw new AccessError("access.joinRequestNotFound", "NOT_FOUND");
  }
  if (request.status !== "PENDING") throw new AccessError("access.thatJoinHasAlreadyBeenDecided");
  // Past its thirty days it waits on nobody, whether or not the job has said so.
  if (request.createdAt < waitingCutoff()) throw new AccessError("access.thatRequestHasExpired");
  // Said to the asker, and kept out of the log: a sentence, not a record.
  const said = decision === "DECLINE" ? reason?.trim().slice(0, 300) || null : null;

  if (decision === "APPROVE") {
    const [guards, post] = await Promise.all([
      db.guardianship.count({ where: { parentUserId: request.userId, status: "ACTIVE" } }),
      // A post here, not a former pupil's alumni row (alumni-membership.ts).
      db.membership.findFirst({ where: { userId: request.userId, schoolId: scope.schoolId, role: { notIn: ["STUDENT", "ALUMNUS"] }, status: { not: "REMOVED" } }, select: { id: true } }),
    ]);
    if (guards > 0) throw new AccessError("join.thisIsAParentsAccount");
    if (post) throw new AccessError("join.youWorkHere");
    // The class the code named was archived while they waited: the school's roll, and no class.
    if (request.classId && request.class?.archivedAt) throw new AccessError("access.thatClassHasBeenArchived");
  }

  const claimed = await db.joinRequest.updateMany({
    where: { id: request.id, schoolId: scope.schoolId, status: "PENDING" },
    data: { status: decision === "APPROVE" ? "APPROVED" : "DECLINED", decidedAt: new Date(), decidedByMembershipId: session.membershipId, declineReason: said },
  });
  if (claimed.count === 0) throw new AccessError("access.thatJoinHasAlreadyBeenDecided");

  if (decision === "DECLINE") {
    await audit({ schoolId: scope.schoolId, actorUserId: session.user.id, action: "student.join.decline", targetType: "JoinRequest", targetId: request.id, meta: { via: request.via, reasonGiven: said !== null } });
    await notify({
      userId: request.userId,
      schoolId: scope.schoolId,
      kind: "SYSTEM",
      titleKey: "joinRequests.notifDeclined",
      titleVars: { school: request.school.name },
      ...(said ? { bodyKey: "joinRequests.reasonGiven" as const, bodyVars: { reason: said } } : { bodyKey: "joinRequests.notifDeclinedBody" as const }),
      url: "/join/waiting",
    }).catch((error) => console.error("[decideJoin] notice failed", error));
    return;
  }

  let membershipId: string;
  try {
    membershipId = await admit(scope.schoolId, request.userId, request.classId);
  } catch (error) {
    // Nobody was admitted, so the request goes back to waiting rather than reading "approved" over an empty roll.
    await db.joinRequest.updateMany({ where: { id: request.id, schoolId: scope.schoolId }, data: { status: "PENDING", decidedAt: null, decidedByMembershipId: null, declineReason: null } });
    throw error;
  }

  await audit({
    schoolId: scope.schoolId,
    actorUserId: request.userId,
    action: "student.join",
    targetType: "Membership",
    targetId: membershipId,
    meta: { via: request.via === "CLASS" ? "class" : "school", approvedBy: session.user.id },
  });
  await syncStandinGuardian({ schoolId: scope.schoolId, studentMembershipId: membershipId, actorUserId: session.user.id }).catch((error) =>
    console.error("[decideJoin] standin sync failed", error),
  );
  await notify({
    userId: request.userId,
    schoolId: scope.schoolId,
    kind: "SYSTEM",
    titleKey: request.class ? "joinRequests.notifApprovedClass" : "joinRequests.notifApprovedSchool",
    titleVars: { school: request.school.name, className: request.class?.name ?? "" },
    url: "/student",
  }).catch((error) => console.error("[decideJoin] notice failed", error));
}

/**
 * Puts a person on the roll, and in the class if one was named: what a join
 * by code did at once before joins waited, moved here unchanged. A pupil
 * already on the roll is only enrolled; one who left comes back on the
 * membership they had, with a fresh code, and the certificate of their
 * leaving goes with the leaving.
 */
async function admit(schoolId: string, userId: string, classId: string | null): Promise<string> {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { birthdate: true } });
  const age = user.birthdate ? ageInYears(user.birthdate) : null;
  return forSchool(schoolId, () =>
    db.$tenantTransaction(async (rawTx) => {
      const tx = rawTx as typeof db;
      const existing = await tx.membership.findFirst({
        where: { userId, schoolId, role: "STUDENT" },
        select: { id: true, status: true, leftAt: true },
      });
      let id: string;
      if (existing && existing.status === "ACTIVE" && !existing.leftAt) {
        id = existing.id;
      } else if (existing) {
        // Closed, not deleted: the old departure's serial stays on the TC register (LIFECYCLE-7).
        await closeLeavingRecord(tx, schoolId, existing.id, "READMITTED");
        await tx.scheduledDeparture.deleteMany({ where: { membershipId: existing.id, schoolId } });
        await tx.membership.update({
          where: { id: existing.id },
          data: { status: "ACTIVE", leftAt: null, suspendedAt: null, suspendedReason: null, studentCode: studentCode() },
        });
        // A pupil back on the roll is no longer an alumnus here (alumni-membership.ts).
        await closeAlumnus(tx as unknown as Parameters<typeof closeAlumnus>[0], userId, schoolId);
        id = existing.id;
      } else {
        const made = await tx.membership.create({
          data: { userId, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: studentCode() },
          select: { id: true },
        });
        id = made.id;
      }
      if (classId) {
        await tx.enrollment.upsert({
          where: { classId_studentMembershipId: { classId, studentMembershipId: id } },
          create: { classId, schoolId, studentMembershipId: id, status: "ACTIVE" },
          update: { status: "ACTIVE", removedAt: null, enrolledAt: new Date() },
        });
        await syncGradeLevel(tx, [id]);
      }
      if (age !== null) await tx.user.update({ where: { id: userId }, data: { isMinor: age < 18 } });
      return id;
    }),
  );
}
