/**
 * Absence notes (absence-notes.ts, through the family's three doors): a
 * guardian files one for today, the register's data carries it beside the
 * pupil, and marking that pupil absent sends the family no notice while a
 * classmate's family still hears; the pupil files one for themselves; the
 * days a note may be for; who may take one back, and until when.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as listNotes, POST as fileNote } from "@/app/api/v1/family/students/[membershipId]/absence-notes/route";
import { DELETE as deleteNote } from "@/app/api/v1/family/students/[membershipId]/absence-notes/[noteId]/route";
import { getRegister, saveAttendanceBatch } from "@/lib/attendance";
import { addDaysToKey, todayKey } from "@/lib/dates";

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
let schoolId = "";
let classId = "";
let teacherMembershipId = "";
let teacherUserId = "";
let parentUserId = "";
let otherParentUserId = "";
let strangerUserId = "";
let pupilUserId = "";
let pupilMembershipId = "";
let classmateMembershipId = "";

const base = (membershipId: string) => `http://localhost/api/v1/family/students/${membershipId}/absence-notes`;
const list = (membershipId: string) => listNotes(new Request(base(membershipId)), { params: Promise.resolve({ membershipId }) });
const file = (membershipId: string, body: unknown) => fileNote(new Request(base(membershipId), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }), { params: Promise.resolve({ membershipId }) });
const remove = (membershipId: string, noteId: string) => deleteNote(new Request(`${base(membershipId)}/${noteId}`, { method: "DELETE" }), { params: Promise.resolve({ membershipId, noteId }) });

async function as(who: "PARENT" | "OTHER_PARENT" | "STRANGER" | "PUPIL" | "TEACHER" | null) {
  __resetCookies();
  if (who === "PARENT") await createSession(parentUserId, { schoolId: null, role: "PARENT" });
  if (who === "OTHER_PARENT") await createSession(otherParentUserId, { schoolId: null, role: "PARENT" });
  if (who === "STRANGER") await createSession(strangerUserId, { schoolId: null, role: "PARENT" });
  if (who === "PUPIL") await createSession(pupilUserId, { schoolId, role: "STUDENT" });
  if (who === "TEACHER") await createSession(teacherUserId, { schoolId, role: "TEACHER" });
}

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  schoolId = (await db.school.create({ data: { name: `ZZ Absence School ${STAMP}`, slug: `zz-absence-${STAMP}`, code: `ZA${suffix}`, contactEmail: `zz-absence-${STAMP}@test.invalid`, timezone: TZ }, select: { id: true } })).id;
  const mk = (who: string) => db.user.create({ data: { name: `ZZ Absence ${who}`, email: `zz-absence-${who.toLowerCase().replace(/ /g, "-")}-${STAMP}@test.invalid` }, select: { id: true } });
  const [teacher, parent, otherParent, stranger, pupil, classmate, strangerChild] = await Promise.all([mk("Teacher"), mk("Parent"), mk("Other Parent"), mk("Stranger"), mk("Pupil"), mk("Classmate"), mk("Stranger Child")]);
  teacherUserId = teacher.id;
  parentUserId = parent.id;
  otherParentUserId = otherParent.id;
  strangerUserId = stranger.id;
  pupilUserId = pupil.id;
  const tm = await db.membership.create({ data: { userId: teacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  teacherMembershipId = tm.id;
  const pm = await db.membership.create({ data: { userId: pupilUserId, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZAP${STAMP}`, gradeLevel: "6" }, select: { id: true } });
  pupilMembershipId = pm.id;
  const cm = await db.membership.create({ data: { userId: classmate.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZAC${STAMP}`, gradeLevel: "6" }, select: { id: true } });
  classmateMembershipId = cm.id;
  const sm = await db.membership.create({ data: { userId: strangerChild.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZAS${STAMP}`, gradeLevel: "6" }, select: { id: true } });
  const klass = await db.class.create({ data: { schoolId, name: "ZZ Absence 6A", gradeLevel: "6", joinCode: `ZA${suffix}` }, select: { id: true } });
  classId = klass.id;
  await db.classTeacher.create({ data: { schoolId, classId, teacherMembershipId: tm.id, role: "LEAD" } });
  await db.enrollment.createMany({ data: [pm.id, cm.id].map((studentMembershipId) => ({ schoolId, classId, studentMembershipId, status: "ACTIVE" })) });
  await db.guardianship.createMany({
    data: [
      { parentUserId, studentMembershipId: pm.id, studentSchoolId: schoolId, status: "ACTIVE", relation: "PARENT" },
      { parentUserId: otherParentUserId, studentMembershipId: pm.id, studentSchoolId: schoolId, status: "ACTIVE", relation: "GUARDIAN" },
      { parentUserId: otherParentUserId, studentMembershipId: cm.id, studentSchoolId: schoolId, status: "ACTIVE", relation: "PARENT" },
      { parentUserId: strangerUserId, studentMembershipId: sm.id, studentSchoolId: schoolId, status: "ACTIVE", relation: "PARENT" },
    ],
  });
});

afterAll(async () => {
  __resetCookies();
  const users = [teacherUserId, parentUserId, otherParentUserId, strangerUserId, pupilUserId];
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await db.school.deleteMany({ where: { slug: `zz-absence-${STAMP}` } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("doors and days", () => {
  it("401 signed out; a teacher and a stranger's guardian are refused; a pupil may only file for themselves", async () => {
    const today = todayKey(TZ);
    await as(null);
    expect((await list(pupilMembershipId)).status).toBe(401);
    await as("TEACHER");
    expect((await list(pupilMembershipId)).status).toBe(403);
    await as("STRANGER");
    expect((await list(pupilMembershipId)).status).toBe(404);
    expect((await file(pupilMembershipId, { dateKey: today, reason: "ILLNESS" })).status).toBe(404);
    await as("PUPIL");
    expect((await file(classmateMembershipId, { dateKey: today, reason: "ILLNESS" })).status).toBe(403);
    expect(await db.absenceNote.count({ where: { schoolId } })).toBe(0);
  });

  it("refuses a past day, a day too far ahead, a reason that is not a code, and an empty body", async () => {
    const today = todayKey(TZ);
    await as("PARENT");
    expect((await file(pupilMembershipId, { dateKey: addDaysToKey(today, -1), reason: "ILLNESS" })).status).toBe(403);
    expect((await file(pupilMembershipId, { dateKey: addDaysToKey(today, 61), reason: "ILLNESS" })).status).toBe(403);
    expect((await file(pupilMembershipId, { dateKey: today, reason: "Dentist" })).status).toBe(422);
    expect((await file(pupilMembershipId, {})).status).toBe(422);
    expect(await db.absenceNote.count({ where: { schoolId } })).toBe(0);
  });
});

describe("the note, the register and the notice", () => {
  it("a guardian's note for today shows beside the pupil in the register's data, and filing again for the day replaces it", async () => {
    const today = todayKey(TZ);
    await as("PARENT");
    const first = await file(pupilMembershipId, { dateKey: today, reason: "ILLNESS", text: "  Fever since last night.  " });
    expect(first.status).toBe(200);
    const body = await first.json();
    expect(body).toMatchObject({ studentMembershipId: pupilMembershipId, childName: "ZZ Absence Pupil", today });
    expect(body.notes).toHaveLength(1);
    expect(body.notes[0]).toMatchObject({ dateKey: today, reason: "ILLNESS", text: "Fever since last night.", authorName: "ZZ Absence Parent", authorRole: "PARENT", canDelete: true });

    const again = await (await file(pupilMembershipId, { dateKey: today, reason: "FAMILY" })).json();
    expect(again.notes).toHaveLength(1);
    expect(again.notes[0]).toMatchObject({ id: body.notes[0].id, reason: "FAMILY", text: "" });

    const register = await getRegister(schoolId, classId, today);
    const row = register!.roster.find((r) => r.membershipId === pupilMembershipId)!;
    expect(row.absenceNote).toEqual({ reason: "FAMILY", text: "", byFamily: true });
    expect(register!.roster.find((r) => r.membershipId === classmateMembershipId)!.absenceNote).toBeNull();

    const audit = await db.auditLog.findMany({ where: { schoolId, action: "absence.note", actorUserId: parentUserId } });
    expect(audit).toHaveLength(2);
    expect(JSON.parse(audit[0]!.meta)).toMatchObject({ dateKey: today, by: "PARENT" });
  });

  it("marking the pupil absent sends the family no notice; the classmate's family still hears", async () => {
    const today = todayKey(TZ);
    const before = await db.notification.count({ where: { userId: { in: [parentUserId, otherParentUserId] }, kind: "ATTENDANCE" } });
    const result = await saveAttendanceBatch({
      schoolId,
      classId,
      dateKey: today,
      takenByMembershipId: teacherMembershipId,
      actorUserId: teacherUserId,
      marks: [
        { studentMembershipId: pupilMembershipId, status: "ABSENT", clientId: `zz-absence-${STAMP}-1` },
        { studentMembershipId: classmateMembershipId, status: "ABSENT", clientId: `zz-absence-${STAMP}-2` },
      ],
    });
    expect(result.applied).toBe(2);
    const after = await db.notification.findMany({ where: { userId: { in: [parentUserId, otherParentUserId] }, kind: "ATTENDANCE" }, select: { userId: true, title: true } });
    // The pupil's two guardians were told nothing; the classmate's one guardian (the other parent) was told once, about the classmate.
    expect(after.length - before).toBe(1);
    expect(after.filter((n) => n.userId === parentUserId)).toHaveLength(0);
    expect(after.filter((n) => n.userId === otherParentUserId).map((n) => n.title)).toEqual([expect.stringContaining("ZZ Absence Classmate")]);
  });

  it("the pupil files one for tomorrow themselves; the register's line says who told it", async () => {
    const tomorrow = addDaysToKey(todayKey(TZ), 1);
    await as("PUPIL");
    const res = await file(pupilMembershipId, { dateKey: tomorrow, reason: "RELIGIOUS" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.notes.map((n: { dateKey: string; authorRole: string }) => [n.dateKey, n.authorRole])).toEqual([[todayKey(TZ), "PARENT"], [tomorrow, "STUDENT"]]);
    const register = await getRegister(schoolId, classId, tomorrow);
    expect(register!.roster.find((r) => r.membershipId === pupilMembershipId)!.absenceNote).toEqual({ reason: "RELIGIOUS", text: "", byFamily: false });
    // The guardian reads the pupil's note too, and may not take it back.
    await as("PARENT");
    const seen = await (await list(pupilMembershipId)).json();
    expect(seen.notes[1]).toMatchObject({ authorRole: "STUDENT", authorName: "ZZ Absence Pupil", canDelete: false });
  });

  it("a note is taken back by its author alone, and not once the day's register has marked the pupil", async () => {
    await as("PARENT");
    const mine = await (await list(pupilMembershipId)).json();
    const [todays, tomorrows] = mine.notes as { id: string; canDelete: boolean }[];
    // Today's register has marked the pupil: the note is part of the record now.
    expect(todays!.canDelete).toBe(false);
    expect((await remove(pupilMembershipId, todays!.id)).status).toBe(403);
    // Tomorrow's is the pupil's own.
    expect((await remove(pupilMembershipId, tomorrows!.id)).status).toBe(403);
    expect((await remove(pupilMembershipId, "cnotarealnoteid000000000")).status).toBe(404);
    await as("PUPIL");
    const gone = await remove(pupilMembershipId, tomorrows!.id);
    expect(gone.status).toBe(200);
    expect((await gone.json()).notes).toHaveLength(1);
    expect(await db.auditLog.count({ where: { schoolId, action: "absence.note.delete", actorUserId: pupilUserId } })).toBe(1);
  });
});
