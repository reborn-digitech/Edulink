/**
 * The owner's decision on TA-108 of the testing analysis of 13 November 2026 (option 1, 14 November 2026): a
 * safeguarding concern is read only by the office, the head and the person who recorded it. It is left out of the
 * family's list, notices, texts and export and of the pupil's own page; other teachers of the class do not see it;
 * there is no "Tell the guardians" for this kind (a request that asks for it tells nobody); and safeguarding
 * records made before the decision leave the families' pages too.
 *
 * At a ZZ school of this suite's own, and for the hostel's path a ZZ college of its own (tests/ta-consent-fixture.ts),
 * both removed afterwards.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import type { ActiveContext } from "@/lib/session";
import { addIncidentNote, closeIncident, familyIncidents, incidentFor, listIncidents, openIncidentCounts, recordIncident } from "@/lib/incidents";
import { personExport } from "@/lib/person-export";
import { allotBed, hostelIncidents, recordHostelIncident } from "@/lib/hostel";
import { todayKey } from "@/lib/dates";
import { makeCollege, type College } from "./ta-consent-fixture";

const db = new PrismaClient();
const STAMP = Date.now();
const SUFFIX = String(STAMP).slice(-6);
const mail = (who: string) => `zz-tad108-${who}-${STAMP}@test.invalid`;
const ids: Record<string, string> = {};

function ctx(userId: string, role: ActiveContext["role"], membershipId: string | null, schoolId: string | null = ids.school!): ActiveContext {
  return { sessionId: "t", membershipId, schoolId, role, user: { id: userId, name: "ZZ", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: {} as never } } as ActiveContext;
}
const admin = () => ctx(ids.admin!, "ADMIN", ids.adminM!);
const head = () => ctx(ids.head!, "PRINCIPAL", ids.headM!);
const recorder = () => ctx(ids.recorder!, "TEACHER", ids.recorderM!);
const otherTeacher = () => ctx(ids.other!, "TEACHER", ids.otherM!);
const guardian = () => ctx(ids.parent!, "PARENT", null, null) as ActiveContext & { role: "PARENT" };
const pupil = () => ctx(ids.pupil!, "STUDENT", ids.pupilM!) as ActiveContext & { role: "STUDENT" };

const concern = (title: string) => ({ studentMembershipId: ids.pupilM!, kind: "SAFEGUARDING" as const, severity: "SERIOUS" as const, place: "Classroom", title, body: "ZZ what the pupil said, in the teacher's words.", actionTaken: "ZZ the head was told.", notifyGuardians: true });

beforeAll(async () => {
  ids.school = (await db.school.create({ data: { name: `ZZ TA-108 School ${STAMP}`, slug: `zz-tad108-${STAMP}`, code: `ZSG${SUFFIX}`, contactEmail: mail("school"), timezone: "Asia/Kolkata", isTestFixture: true, selfReadAge: 12 }, select: { id: true } })).id;
  for (const who of ["admin", "head", "recorder", "other", "pupil", "parent"]) {
    ids[who] = (await db.user.create({ data: { name: `ZZ TA-108 ${who}`, email: mail(who), isTestFixture: true, ...(who === "pupil" ? { birthdate: new Date("2010-04-01T00:00:00.000Z"), isMinor: true } : {}) }, select: { id: true } })).id;
  }
  const member = async (who: string, role: string) => (await db.membership.create({ data: { userId: ids[who]!, schoolId: ids.school!, role, status: "ACTIVE" }, select: { id: true } })).id;
  ids.adminM = await member("admin", "ADMIN");
  ids.headM = await member("head", "PRINCIPAL");
  ids.recorderM = await member("recorder", "TEACHER");
  ids.otherM = await member("other", "TEACHER");
  ids.pupilM = await member("pupil", "STUDENT");
  ids.class = (await db.class.create({ data: { schoolId: ids.school, name: "ZZ 9A", gradeLevel: "9", section: "A", joinCode: `ZSG${SUFFIX}A` }, select: { id: true } })).id;
  await db.enrollment.create({ data: { schoolId: ids.school, classId: ids.class, studentMembershipId: ids.pupilM, status: "ACTIVE" } });
  // The recorder is the class teacher; the other teacher teaches the class a lesson on the timetable.
  await db.classTeacher.create({ data: { schoolId: ids.school, classId: ids.class, teacherMembershipId: ids.recorderM, role: "LEAD" } });
  const period = await db.timetablePeriod.create({ data: { schoolId: ids.school, name: "P1", position: 1, startMinute: 540, endMinute: 585 }, select: { id: true } });
  await db.timetableSlot.create({ data: { schoolId: ids.school, classId: ids.class, periodId: period.id, weekday: 1, subject: "Mathematics", teacherMembershipId: ids.otherM } });
  await db.guardianship.create({ data: { parentUserId: ids.parent!, studentMembershipId: ids.pupilM, studentSchoolId: ids.school, relation: "PARENT", status: "ACTIVE" } });
});

afterAll(async () => {
  const people = await db.user.findMany({ where: { email: { contains: `-${STAMP}@test.invalid`, startsWith: "zz-tad108-" } }, select: { id: true } });
  await db.notification.deleteMany({ where: { userId: { in: people.map((p) => p.id) } } });
  await db.auditLog.deleteMany({ where: { schoolId: ids.school } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { id: { in: people.map((p) => p.id) } } });
  await db.$disconnect();
});

const guardianNotices = () => db.notification.count({ where: { userId: ids.parent!, kind: "INCIDENT" } });

describe("TA-108: a safeguarding concern is not told to the family", () => {
  it("TA-108: recorded with the form's defaults (tell the family on), nobody is told and the record says so", async () => {
    const before = await guardianNotices();
    const view = await recordIncident(recorder(), concern("ZZ TA-108 a disclosure"));
    expect(view.kind).toBe("SAFEGUARDING");
    expect(view.guardiansNotifiedAt).toBeNull();
    expect(await guardianNotices()).toBe(before);
    const row = await db.auditLog.findFirst({ where: { schoolId: ids.school, action: "incident.record", targetId: view.id }, select: { meta: true } });
    expect((JSON.parse(row?.meta ?? "{}") as { notified?: boolean }).notified).toBe(false);
    // The control: an injury with the same defaults is told, as before.
    const injury = await recordIncident(recorder(), { ...concern("ZZ TA-108 a grazed knee"), kind: "INJURY", severity: "MINOR" });
    expect(injury.guardiansNotifiedAt).not.toBeNull();
    expect(await guardianNotices()).toBe(before + 1);
  });
});

describe("TA-108: the family's pages and export leave it out", () => {
  it("TA-108: the guardian's list leaves out a new concern and one recorded before the decision; the injury stays", async () => {
    const fresh = await recordIncident(recorder(), concern("ZZ TA-108 a second disclosure"));
    // A record made before the decision, told to the family at the time.
    const old = await db.incident.create({ data: { schoolId: ids.school!, studentMembershipId: ids.pupilM!, reportedByMembershipId: ids.recorderM!, kind: "SAFEGUARDING", severity: "SERIOUS", occurredAt: new Date(Date.now() - 86_400_000), title: "ZZ TA-108 an older concern", body: "ZZ older words.", guardiansNotifiedAt: new Date(Date.now() - 86_400_000) }, select: { id: true } });
    await db.incidentNote.create({ data: { schoolId: ids.school!, incidentId: old.id, authorUserId: ids.admin!, body: "ZZ the office's follow-up." } });
    const read = await familyIncidents(guardian(), ids.pupilM!);
    const seen = read.incidents.map((i) => i.id);
    expect(seen).not.toContain(fresh.id);
    expect(seen).not.toContain(old.id);
    expect(read.incidents.every((i) => i.kind !== "SAFEGUARDING")).toBe(true);
    expect(read.incidents.some((i) => i.kind === "INJURY")).toBe(true);
  });

  it("TA-108: the pupil's own page, from the school's self-read age, leaves it out", async () => {
    const read = await familyIncidents(pupil(), ids.pupilM!);
    expect(read.incidents.length).toBeGreaterThan(0);
    expect(read.incidents.every((i) => i.kind !== "SAFEGUARDING")).toBe(true);
  });

  it("TA-108: the guardian's export and the pupil's own export leave it out", async () => {
    for (const reader of [guardian(), pupil()]) {
      const file = await personExport(reader, ids.pupilM!);
      const incidents = file.document.incidents as { kind: string }[];
      expect(Array.isArray(incidents)).toBe(true);
      expect(incidents.length).toBeGreaterThan(0);
      expect(incidents.every((i) => i.kind !== "SAFEGUARDING")).toBe(true);
    }
  });
});

describe("TA-108: among staff, the office, the head and the recorder alone", () => {
  it("TA-108: another teacher of the class does not see it in the list, by its id, in a note or in the roster's count", async () => {
    const view = await recordIncident(recorder(), concern("ZZ TA-108 a third disclosure"));
    const theirs = await listIncidents(otherTeacher(), { status: "ALL", page: 1 });
    expect(theirs.rows.map((r) => r.id)).not.toContain(view.id);
    expect(theirs.rows.some((r) => r.kind === "SAFEGUARDING")).toBe(false);
    expect(theirs.rows.some((r) => r.kind === "INJURY")).toBe(true);
    await expect(incidentFor(otherTeacher(), view.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(addIncidentNote(otherTeacher(), view.id, "ZZ a note")).rejects.toMatchObject({ code: "NOT_FOUND" });
    const injuriesOpen = await db.incident.count({ where: { studentMembershipId: ids.pupilM!, status: "OPEN", kind: { not: "SAFEGUARDING" } } });
    const allOpen = await db.incident.count({ where: { studentMembershipId: ids.pupilM!, status: "OPEN" } });
    expect((await openIncidentCounts(ids.school!, [ids.pupilM!], { membershipId: ids.otherM!, role: "TEACHER" })).get(ids.pupilM!)).toBe(injuriesOpen);
    // The recorder counts their own concerns (the one made directly above was theirs too); the office counts all.
    expect((await openIncidentCounts(ids.school!, [ids.pupilM!], { membershipId: ids.recorderM!, role: "TEACHER" })).get(ids.pupilM!)).toBe(allOpen);
    expect((await openIncidentCounts(ids.school!, [ids.pupilM!], { membershipId: ids.adminM!, role: "ADMIN" })).get(ids.pupilM!)).toBe(allOpen);
  });

  it("TA-108: the recorder, the office and the head read it; the recorder adds a note; the office closes it", async () => {
    const view = await recordIncident(recorder(), concern("ZZ TA-108 a fourth disclosure"));
    for (const who of [recorder(), admin(), head()]) {
      expect((await listIncidents(who, { status: "ALL", page: 1 })).rows.map((r) => r.id)).toContain(view.id);
      expect((await incidentFor(who, view.id)).body).toContain("ZZ what the pupil said");
    }
    expect((await addIncidentNote(recorder(), view.id, "ZZ the recorder's follow-up")).notes).toHaveLength(1);
    expect((await closeIncident(admin(), view.id)).status).toBe("CLOSED");
  });

  it("TA-108: a concern the office records is not shown to the class teacher", async () => {
    const view = await recordIncident(admin(), concern("ZZ TA-108 the office's concern"));
    expect(view.guardiansNotifiedAt).toBeNull();
    expect((await listIncidents(recorder(), { status: "ALL", page: 1 })).rows.map((r) => r.id)).not.toContain(view.id);
    await expect(incidentFor(recorder(), view.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await incidentFor(head(), view.id)).id).toBe(view.id);
  });
});

describe("TA-108: the hostel's path", () => {
  let c: College;
  const warden = { userId: "", membershipId: "" };
  const otherWarden = { userId: "", membershipId: "" };
  const principal = { userId: "", membershipId: "" };
  let hostelId = "";
  let roomId = "";

  async function staff(who: string, role: string) {
    const u = await c.db.user.create({ data: { name: `ZZ TA-108 ${who}`, email: `zz-tacons-d108h-${who}-${c.stamp}@test.invalid`, prefs: "{}" }, select: { id: true } });
    const m = await c.db.membership.create({ data: { userId: u.id, schoolId: c.schoolId, role, status: "ACTIVE" }, select: { id: true } });
    return { userId: u.id, membershipId: m.id };
  }

  beforeAll(async () => {
    c = await makeCollege("d108h");
    await c.db.schoolModule.create({ data: { schoolId: c.schoolId, module: "HOSTEL" } });
    Object.assign(warden, await staff("warden", "WARDEN"));
    Object.assign(otherWarden, await staff("warden2", "WARDEN"));
    Object.assign(principal, await staff("principal", "PRINCIPAL"));
    hostelId = (await c.db.hostel.create({ data: { schoolId: c.schoolId, name: `ZZ TA-108 Hall ${c.stamp}`, kind: "MIXED", capacity: 10 }, select: { id: true } })).id;
    roomId = (await c.db.hostelRoom.create({ data: { schoolId: c.schoolId, hostelId, number: "101", beds: 10 }, select: { id: true } })).id;
  }, 60_000);

  afterAll(async () => {
    await c.cleanup();
  });

  it("TA-108: a warden's safeguarding concern about a minor boarder tells no guardian, and another warden does not see it", async () => {
    const W = c.ctx(warden, "WARDEN");
    const bed = await allotBed(W, { membershipId: c.minor.membershipId, roomId, bed: 1, fromDate: todayKey("Asia/Kolkata"), feeDemandId: null });
    await recordHostelIncident(W, { allotmentId: bed.allotmentId, kind: "SAFEGUARDING", severity: "SERIOUS", title: "ZZ TA-108 a boarder's disclosure", body: "ZZ the boarder's words.", actionTaken: "", notifyGuardians: true });
    const mine = (await hostelIncidents(W)).items.find((i) => i.title === "ZZ TA-108 a boarder's disclosure");
    expect(mine).toBeDefined();
    expect(mine!.guardiansNotifiedAt).toBeNull();
    expect(await c.db.notification.count({ where: { userId: c.guardian.userId, kind: "INCIDENT" } })).toBe(0);
    expect((await hostelIncidents(c.ctx(otherWarden, "WARDEN"))).items.some((i) => i.id === mine!.id)).toBe(false);
    expect((await hostelIncidents(c.ctx(principal, "PRINCIPAL"))).items.some((i) => i.id === mine!.id)).toBe(true);
    expect((await hostelIncidents(c.ctx(c.admin, "ADMIN"))).items.some((i) => i.id === mine!.id)).toBe(true);
    // The control: an injury with the box ticked tells the minor's guardian, as before.
    await recordHostelIncident(W, { allotmentId: bed.allotmentId, kind: "INJURY", severity: "MINOR", title: "ZZ TA-108 a boarder's sprain", body: "ZZ a sprain.", actionTaken: "", notifyGuardians: true });
    expect(await c.db.notification.count({ where: { userId: c.guardian.userId, kind: "INCIDENT" } })).toBe(1);
    expect((await familyIncidents(c.ctx(c.guardian, "PARENT", null), c.minor.membershipId)).incidents.map((i) => i.kind)).toEqual(["INJURY"]);
  });
});
