import "server-only";
import { academicYearWindow, NSS_HOURS_PER_YEAR, type CorpsCode, type CorpsDesk, type DutyCode } from "@edulink/contracts";
import { db } from "./db";
import { RuleRefusal } from "./rule-refusal";
import { audit } from "./audit";
import { todayKey } from "./dates";
import { readJsonArray } from "./json";
import { deskCaller } from "./duty-desks";
import { currentRecordsYear } from "./stream-records";
import { corpsSummary } from "./stream-summaries";
import type { ActiveContext } from "./session";

/**
 * NSS AND NCC (the NSS programme officer's and the NCC officer's desks,
 * 5 October 2026). A unit's enrolled students (CorpsEnrolment: when they
 * joined and, once they leave, when) and its activities — IQAC Activity rows
 * of kind NSS or NCC, so the IQAC's register and criterion 3.6's count keep
 * reading them, with the hours each participant earned and whether it was a
 * camp. The hours per student are worked out on read (stream-summaries.ts
 * `corpsSummary`); nothing derived is stored.
 *
 * The officer (a FACULTY or HOD holding NSS_OFFICER or NCC_OFFICER) and the
 * office write; the head reads. Under module IQAC, the activity register's.
 * Only enrolled students may be named on an activity.
 */

const DUTY: Record<CorpsCode, DutyCode> = { NSS: "NSS_OFFICER", NCC: "NCC_OFFICER" };
const nameOf = (u: { name: string; preferredName: string | null }) => u.preferredName ?? u.name;

export async function corpsDesk(ctx: ActiveContext, corps: CorpsCode): Promise<CorpsDesk> {
  const c = await deskCaller(ctx, DUTY[corps], "IQAC");
  const school = await db.school.findUniqueOrThrow({ where: { id: c.schoolId }, select: { timezone: true } });
  const year = currentRecordsYear(school.timezone);
  const w = academicYearWindow(year);
  const [enrolled, students, activities, summary] = await Promise.all([
    db.corpsEnrolment.findMany({ where: { schoolId: c.schoolId, corps, leftOn: null }, orderBy: { enrolledOn: "asc" }, select: { studentMembershipId: true, unit: true, enrolledOn: true, student: { select: { user: { select: { name: true, preferredName: true } } } } } }),
    db.membership.findMany({ where: { schoolId: c.schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null }, take: 2000, select: { id: true, user: { select: { name: true, preferredName: true } } } }),
    db.activity.findMany({ where: { schoolId: c.schoolId, kind: corps, at: { gte: w.from, lte: w.to } }, orderBy: { at: "desc" }, select: { id: true, title: true, at: true, hours: true, camp: true, participantIdsJson: true } }),
    corpsSummary(c.schoolId, corps, year),
  ]);
  const hoursBy = new Map(summary.perStudent.map((s) => [s.studentMembershipId, s.hours]));
  return {
    corps,
    year,
    canEdit: c.role === "ADMIN" || c.holder,
    enrolled: enrolled.map((e) => ({ studentMembershipId: e.studentMembershipId, name: nameOf(e.student.user), unit: e.unit, enrolledOn: e.enrolledOn, hours: hoursBy.get(e.studentMembershipId) ?? 0 })).sort((a, b) => a.name.localeCompare(b.name)),
    students: students.map((s) => ({ membershipId: s.id, name: nameOf(s.user) })).sort((a, b) => a.name.localeCompare(b.name)),
    activities: activities.map((a) => ({ id: a.id, title: a.title, at: a.at, hours: a.hours ?? 0, camp: a.camp, participants: readJsonArray<string>(a.participantIdsJson).length })),
    summary,
    hoursPerYear: NSS_HOURS_PER_YEAR,
  };
}

async function writer(ctx: ActiveContext, corps: CorpsCode) {
  const c = await deskCaller(ctx, DUTY[corps], "IQAC", ["ADMIN"]);
  const school = await db.school.findUniqueOrThrow({ where: { id: c.schoolId }, select: { timezone: true } });
  return { ...c, today: todayKey(school.timezone) };
}

async function assertStudents(schoolId: string, ids: readonly string[], field: string) {
  const n = await db.membership.count({ where: { id: { in: [...ids] }, schoolId, role: "STUDENT", status: "ACTIVE", leftAt: null } });
  if (n !== ids.length) throw new RuleRefusal("duties.corps.refuseStudent", 422, undefined, field);
}

/** Students enrolled in the unit today (one who had left is enrolled again); idempotent for one already in. */
export async function enrolInCorps(ctx: ActiveContext, corps: CorpsCode, input: { studentMembershipIds: string[]; unit: string }): Promise<{ count: number }> {
  const c = await writer(ctx, corps);
  const ids = [...new Set(input.studentMembershipIds)];
  await assertStudents(c.schoolId, ids, "studentMembershipIds");
  let count = 0;
  await db.$tenantTransaction(async (raw) => {
    const tx = raw as typeof db;
    for (const id of ids) {
      const had = await tx.corpsEnrolment.findUnique({ where: { corps_studentMembershipId: { corps, studentMembershipId: id } }, select: { leftOn: true } });
      if (had && had.leftOn === null) continue;
      await tx.corpsEnrolment.upsert({ where: { corps_studentMembershipId: { corps, studentMembershipId: id } }, create: { schoolId: c.schoolId, corps, studentMembershipId: id, unit: input.unit.trim(), enrolledOn: c.today, createdByUserId: c.userId }, update: { unit: input.unit.trim(), enrolledOn: c.today, leftOn: null } });
      count += 1;
    }
  });
  if (count) await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "duties.corps.enrol", targetType: "School", targetId: c.schoolId, meta: { corps, count } });
  return { count };
}

/** Students leaving the unit on a day (not before they joined). */
export async function leaveCorps(ctx: ActiveContext, corps: CorpsCode, input: { studentMembershipIds: string[]; on: string }): Promise<{ count: number }> {
  const c = await writer(ctx, corps);
  const ids = [...new Set(input.studentMembershipIds)];
  const rows = await db.corpsEnrolment.findMany({ where: { schoolId: c.schoolId, corps, leftOn: null, studentMembershipId: { in: ids } }, select: { id: true, enrolledOn: true } });
  if (rows.length !== ids.length) throw new RuleRefusal("duties.corps.refuseNotEnrolled", 422, undefined, "studentMembershipIds");
  if (rows.some((r) => input.on < r.enrolledOn)) throw new RuleRefusal("duties.corps.refuseLeaveDay", 422, undefined, "on");
  const done = await db.corpsEnrolment.updateMany({ where: { id: { in: rows.map((r) => r.id) } }, data: { leftOn: input.on } });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "duties.corps.leave", targetType: "School", targetId: c.schoolId, meta: { corps, count: done.count } });
  return { count: done.count };
}

/** An activity of the unit — on a day not in the future, every participant enrolled — written as the IQAC register's Activity row of that kind. */
export async function addCorpsActivity(ctx: ActiveContext, corps: CorpsCode, input: { title: string; at: string; hours: number; camp: boolean; participantMembershipIds: string[] }): Promise<{ id: string }> {
  const c = await writer(ctx, corps);
  if (input.at > c.today) throw new RuleRefusal("duties.corps.refuseFutureDay", 422, undefined, "at");
  const ids = [...new Set(input.participantMembershipIds)];
  if (ids.length) {
    const enrolled = await db.corpsEnrolment.count({ where: { schoolId: c.schoolId, corps, leftOn: null, studentMembershipId: { in: ids } } });
    if (enrolled !== ids.length) throw new RuleRefusal("duties.corps.refuseNotEnrolled", 422, undefined, "participantMembershipIds");
  }
  const row = await db.activity.create({ data: { schoolId: c.schoolId, kind: corps, title: input.title.trim(), at: input.at, participants: ids.length, participantIdsJson: JSON.stringify(ids), hours: input.hours, camp: input.camp, createdByUserId: c.userId }, select: { id: true } });
  await audit({ schoolId: c.schoolId, actorUserId: c.userId, action: "duties.corps.activity", targetType: "Activity", targetId: row.id, meta: { corps, at: input.at, participants: ids.length, hours: input.hours, camp: input.camp } });
  return row;
}
