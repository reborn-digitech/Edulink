/**
 * TA-576 (testing analysis of 13 November 2026): a subject teacher, one the timetable sends to a class with no
 * ClassTeacher row there, may record and open an incident for a pupil they teach (recordIncident and incidentFor go
 * through assertStudentAccess, which admits a lesson on the timetable), but the incident list filtered a teacher to
 * ClassTeacher rows alone, so the incident they had just recorded was missing from their list and their open count.
 *
 * At a ZZ school of this suite's own, removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { incidentFor, listIncidents, recordIncident } from "@/lib/incidents";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const mail = (who: string) => `zz-tacp-inc-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};

function ctx(userId: string, role: ActiveContext["role"], membershipId: string): ActiveContext {
  return { sessionId: "t", membershipId, schoolId: ids.school!, role, user: { id: userId, name: "ZZ", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: {} as never } } as ActiveContext;
}

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TA Incidents ${STAMP}`, slug: `zz-tacp-inc-${STAMP}`, code: `ZCI${SUFFIX}`, contactEmail: mail("school"), timezone: "Asia/Kolkata", isTestFixture: true }, select: { id: true } })).id;
  for (const who of ["subject", "other", "pupil", "stranger"]) ids[who] = (await db.user.create({ data: { name: `ZZ TACP Inc ${who}`, email: mail(who), isTestFixture: true }, select: { id: true } })).id;
  ids.subjectM = (await db.membership.create({ data: { userId: ids.subject!, schoolId: ids.school, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  ids.otherM = (await db.membership.create({ data: { userId: ids.other!, schoolId: ids.school, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  ids.pupilM = (await db.membership.create({ data: { userId: ids.pupil!, schoolId: ids.school, role: "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
  ids.strangerM = (await db.membership.create({ data: { userId: ids.stranger!, schoolId: ids.school, role: "STUDENT", status: "ACTIVE" }, select: { id: true } })).id;
  ids.class = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ 3A", gradeLevel: "3", section: "A", joinCode: `ZCI${SUFFIX}A` }, select: { id: true } })).id;
  ids.otherClass = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ 4A", gradeLevel: "4", section: "A", joinCode: `ZCI${SUFFIX}B` }, select: { id: true } })).id;
  await db.enrollment.createMany({ data: [{ schoolId: ids.school, classId: ids.class, studentMembershipId: ids.pupilM, status: "ACTIVE" }, { schoolId: ids.school, classId: ids.otherClass, studentMembershipId: ids.strangerM, status: "ACTIVE" }] });
  // The subject teacher has a PE lesson in 3A and no ClassTeacher row anywhere; the other teacher holds 4A.
  const period = await db.timetablePeriod.create({ data: { schoolId: ids.school, name: "P1", position: 1, startMinute: 540, endMinute: 585 }, select: { id: true } });
  await db.timetableSlot.create({ data: { schoolId: ids.school, classId: ids.class, periodId: period.id, weekday: 1, subject: "Physical Education", teacherMembershipId: ids.subjectM } });
  await db.classTeacher.create({ data: { schoolId: ids.school, classId: ids.otherClass, teacherMembershipId: ids.otherM, role: "LEAD" } });
});

afterAll(async () => {
  const people = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid` } }, select: { id: true } });
  await db.notification.deleteMany({ where: { userId: { in: people.map((p) => p.id) } } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { id: { in: people.map((p) => p.id) } } });
  await db.$disconnect();
});

describe("a subject teacher's incident list", () => {
  it("TA-576: the incident a timetable-only teacher records for a pupil they teach is in their own list and open count", async () => {
    const subject = ctx(ids.subject!, "TEACHER", ids.subjectM!);
    const recorded = await recordIncident(subject, { studentMembershipId: ids.pupilM!, kind: "INJURY", severity: "MINOR", place: "Ground", title: "ZZ grazed knee in PE", body: "Fell on the track.", actionTaken: "Cleaned and dressed.", notifyGuardians: false });
    expect((await incidentFor(subject, recorded.id)).id).toBe(recorded.id);
    const list = await listIncidents(subject, { status: "OPEN", page: 1 });
    expect(list.rows.map((r) => r.id)).toContain(recorded.id);
    expect(list.openCount).toBe(1);
  });

  it("TA-576: the list still keeps to the classes a teacher teaches: another class's incident is not in the subject teacher's list", async () => {
    const other = ctx(ids.other!, "TEACHER", ids.otherM!);
    const theirs = await recordIncident(other, { studentMembershipId: ids.strangerM!, kind: "ILLNESS", severity: "MINOR", place: "", title: "ZZ headache", body: "Rested.", actionTaken: "", notifyGuardians: false });
    const list = await listIncidents(ctx(ids.subject!, "TEACHER", ids.subjectM!), { status: "ALL", page: 1 });
    expect(list.rows.map((r) => r.id)).not.toContain(theirs.id);
    expect((await listIncidents(other, { status: "ALL", page: 1 })).rows.map((r) => r.id)).toEqual([theirs.id]);
  });
});
