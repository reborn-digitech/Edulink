/**
 * The staff record and a pupil's leaving, as the phone reaches them: the
 * handlers invoked directly with a primed session. Each is the web's own
 * rule through another door, so what is proved here is the door — who is
 * let through, what a body that does not parse gets, another school's id —
 * and that the act is the library's: a record written whole, a leaving
 * recorded today or kept for its day, undone, given up. Every row is a ZZ
 * row made here and deleted afterwards.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { leavingResultSchema, staffRecordViewSchema } from "@edulink/contracts";
import { createSession } from "@/lib/session";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as recordGet, POST as recordPost } from "@/app/api/v1/admin/people/[membershipId]/staff-record/route";
import { POST as leavingPost } from "@/app/api/v1/admin/people/[membershipId]/leaving/route";
import { POST as undoPost } from "@/app/api/v1/admin/people/[membershipId]/leaving/undo/route";
import { POST as cancelPost } from "@/app/api/v1/admin/people/[membershipId]/leaving/cancel/route";

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));

const db = new PrismaClient();
const STAMP = Date.now();
const TZ = "Asia/Kolkata";
let schoolId = "";
let otherSchoolId = "";
const who: Record<string, { userId: string; membershipId: string }> = {};

const get = () => new Request("http://localhost/api/v1/admin/people/x");
const json = (body: unknown) => new Request("http://localhost/api/v1/admin/people/x", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const bare = () => new Request("http://localhost/api/v1/admin/people/x", { method: "POST" });
const p = (membershipId: string) => ({ params: Promise.resolve({ membershipId }) });

async function as(name: "admin" | "head" | "teacher" | "pupil" | "elsewhere" | null) {
  __resetCookies();
  if (!name) return;
  const role = { admin: "ADMIN", head: "PRINCIPAL", teacher: "TEACHER", pupil: "STUDENT", elsewhere: "ADMIN" }[name] as "ADMIN" | "PRINCIPAL" | "TEACHER" | "STUDENT";
  await createSession(who[name]!.userId, { schoolId: name === "elsewhere" ? otherSchoolId : schoolId, role });
}

const WHOLE = {
  staffNumber: "ZZ-T-014", designation: "Senior teacher", qualification: "M.Sc, B.Ed", joinedOnKey: "2019-06-10", birthdateKey: "1985-03-09", serviceJoinedOnKey: "2008-06-15",
  leaveDaysPerYear: 12, gender: "F", socialCategory: "OBC", academicQualification: "5", professionalQualification: "3", appointmentType: "REGULAR", appointedSubject: "MATHEMATICS",
};

beforeAll(async () => {
  const make = (n: string) => db.school.create({ data: { name: `ZZ Records ${n} ${STAMP}`, slug: `zz-records-${n}-${STAMP}`, code: `ZR${n}${String(STAMP).slice(-6)}`, contactEmail: `zz-records-${n}-${STAMP}@test.invalid`, timezone: TZ }, select: { id: true } });
  schoolId = (await make("a")).id;
  otherSchoolId = (await make("b")).id;
  for (const [name, role, school] of [["admin", "ADMIN", schoolId], ["head", "PRINCIPAL", schoolId], ["teacher", "TEACHER", schoolId], ["pupil", "STUDENT", schoolId], ["leaver", "STUDENT", schoolId], ["elsewhere", "ADMIN", otherSchoolId]] as const) {
    const user = await db.user.create({ data: { name: `ZZ Records ${name}`, email: `zz-records-${name}-${STAMP}@test.invalid`, prefs: "{}", ...(role === "STUDENT" ? { birthdate: new Date("2015-02-02T00:00:00Z"), isMinor: true } : {}) }, select: { id: true } });
    const membership = await db.membership.create({ data: { userId: user.id, schoolId: school, role, status: "ACTIVE", ...(role === "STUDENT" ? { studentCode: `STU-ZZR${name[0]!.toUpperCase()}-${String(STAMP).slice(-4)}` } : {}) }, select: { id: true } });
    who[name] = { userId: user.id, membershipId: membership.id };
  }
  const klass = await db.class.create({ data: { schoolId, name: `ZZ Records 4A ${STAMP}`, gradeLevel: "4", joinCode: `ZRC-${String(STAMP).slice(-4)}` }, select: { id: true } });
  for (const name of ["pupil", "leaver"]) await db.enrollment.create({ data: { classId: klass.id, schoolId, studentMembershipId: who[name]!.membershipId, status: "ACTIVE" } });
});

afterAll(async () => {
  __resetCookies();
  const userIds = Object.values(who).map((row) => row.userId);
  const schools = [schoolId, otherSchoolId].filter(Boolean);
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.notification.deleteMany({ where: { schoolId: { in: schools } } });
  await db.auditLog.deleteMany({ where: { schoolId: { in: schools } } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.$disconnect();
});

describe("the gates", () => {
  it("signed out is a 401 on all five", async () => {
    await as(null);
    const id = who.teacher!.membershipId;
    for (const res of [await recordGet(get(), p(id)), await recordPost(json(WHOLE), p(id)), await leavingPost(json({ reason: "LEFT" }), p(id)), await undoPost(bare(), p(id)), await cancelPost(bare(), p(id))]) {
      expect(res.status).toBe(401);
    }
  });

  it("⚠ the head reads a staff record and writes none; a teacher and a pupil reach nothing; only the office records a leaving", async () => {
    const teacher = who.teacher!.membershipId;
    const pupil = who.pupil!.membershipId;
    await as("head");
    expect((await recordGet(get(), p(teacher))).status).toBe(200);
    for (const res of [await recordPost(json(WHOLE), p(teacher)), await leavingPost(json({ reason: "LEFT" }), p(pupil)), await undoPost(bare(), p(pupil)), await cancelPost(bare(), p(pupil))]) expect(res.status).toBe(403);
    for (const name of ["teacher", "pupil"] as const) {
      await as(name);
      for (const res of [await recordGet(get(), p(teacher)), await recordPost(json(WHOLE), p(teacher)), await leavingPost(json({ reason: "LEFT" }), p(pupil))]) expect(res.status, name).toBe(403);
    }
    expect(await db.staffRecord.count({ where: { schoolId } })).toBe(0);
    expect((await db.membership.findUniqueOrThrow({ where: { id: pupil } })).leftAt).toBeNull();
  });
});

describe("a member of staff's record", () => {
  it("reads as blank before the office has written one, and says who may edit", async () => {
    await as("admin");
    const res = await recordGet(get(), p(who.teacher!.membershipId));
    expect(res.status).toBe(200);
    const view = staffRecordViewSchema.parse(await res.json());
    expect(view).toMatchObject({ name: "ZZ Records teacher", role: "TEACHER", canEdit: true });
    expect(Object.values(view.record).every((value) => value === null)).toBe(true);
    await as("head");
    expect(staffRecordViewSchema.parse(await (await recordGet(get(), p(who.teacher!.membershipId))).json()).canEdit).toBe(false);
  });

  it("⚠ is written whole: a body that leaves a key out is a 422 and clears nothing; a code off its list and a day in the future are 422s with the sentence", async () => {
    await as("admin");
    const id = who.teacher!.membershipId;
    expect((await recordPost(json(WHOLE), p(id))).status).toBe(200);
    expect(staffRecordViewSchema.parse(await (await recordGet(get(), p(id))).json()).record).toEqual(WHOLE);

    for (const body of [{}, { designation: "Head of science" }, { ...WHOLE, leaveDaysPerYear: 400 }, { ...WHOLE, joinedOnKey: "10/06/2019" }]) {
      expect((await recordPost(json(body), p(id))).status, JSON.stringify(body).slice(0, 40)).toBe(422);
    }
    const offList = await recordPost(json({ ...WHOLE, appointedSubject: "Maths" }), p(id));
    expect(offList.status).toBe(422);
    expect((await offList.json()).error).toBe("That answer is not on the list.");
    expect((await recordPost(json({ ...WHOLE, joinedOnKey: addDaysToKey(todayKey(TZ), 3) }), p(id))).status).toBe(422);
    expect(staffRecordViewSchema.parse(await (await recordGet(get(), p(id))).json()).record).toEqual(WHOLE);

    // A null clears a field on purpose.
    expect((await recordPost(json({ ...WHOLE, qualification: null, appointedSubject: null }), p(id))).status).toBe(200);
    expect(staffRecordViewSchema.parse(await (await recordGet(get(), p(id))).json()).record).toMatchObject({ qualification: null, appointedSubject: null, designation: "Senior teacher" });
  });

  it("⚠ a pupil has no staff record, and another school's office finds nobody", async () => {
    await as("admin");
    expect((await recordGet(get(), p(who.pupil!.membershipId))).status).toBe(404);
    expect((await recordPost(json(WHOLE), p(who.pupil!.membershipId))).status).toBe(422);
    await as("elsewhere");
    expect((await recordGet(get(), p(who.teacher!.membershipId))).status).toBe(404);
    expect((await recordPost(json(WHOLE), p(who.teacher!.membershipId))).status).toBe(422);
    expect((await db.staffRecord.findUniqueOrThrow({ where: { membershipId: who.teacher!.membershipId } })).designation).toBe("Senior teacher");
  });
});

describe("a pupil's leaving", () => {
  const leaver = () => who.leaver!.membershipId;

  it("a body that names no reason, or one off the list, is a 422; another school's office records nothing", async () => {
    await as("admin");
    for (const body of [{}, { reason: "EXPELLED" }, { reason: "LEFT", conduct: "POOR" }, { reason: "LEFT", leftOn: "yesterday" }]) {
      expect((await leavingPost(json(body), p(leaver()))).status, JSON.stringify(body)).toBe(422);
    }
    await as("elsewhere");
    expect((await leavingPost(json({ reason: "LEFT" }), p(leaver()))).status).toBe(422);
    expect((await db.membership.findUniqueOrThrow({ where: { id: leaver() } })).leftAt).toBeNull();
    expect(await db.schoolRecord.count({ where: { studentMembershipId: leaver() } })).toBe(0);
  });

  it("⚠ a last day after today is kept and not recorded: still on the roll, no certificate; given up once, and then there is nothing to give up", async () => {
    await as("admin");
    const day = addDaysToKey(todayKey(TZ), 10);
    const res = await leavingPost(json({ reason: "TRANSFERRED", conduct: "GOOD", destination: "ZZ Elsewhere School", leftOn: day }), p(leaver()));
    expect(res.status).toBe(200);
    expect(leavingResultSchema.parse(await res.json())).toEqual({ recordId: null, scheduledFor: day });
    expect((await db.membership.findUniqueOrThrow({ where: { id: leaver() } })).leftAt).toBeNull();
    expect(await db.schoolRecord.count({ where: { studentMembershipId: leaver() } })).toBe(0);
    expect((await db.scheduledDeparture.findFirstOrThrow({ where: { membershipId: leaver() } })).leaveOnKey).toBe(day);

    expect((await cancelPost(bare(), p(leaver()))).status).toBe(200);
    expect(await db.scheduledDeparture.count({ where: { membershipId: leaver() } })).toBe(0);
    const again = await cancelPost(bare(), p(leaver()));
    expect(again.status).toBe(422);
  });

  it("⚠ recorded today it takes the pupil off the roll and issues the certificate; undone, both are put back; a second undo is refused", async () => {
    await as("admin");
    const res = await leavingPost(json({ reason: "TRANSFERRED", conduct: "EXCELLENT", destination: "ZZ Elsewhere School", note: "Family moved." }), p(leaver()));
    expect(res.status).toBe(200);
    const { recordId, scheduledFor } = leavingResultSchema.parse(await res.json());
    expect(scheduledFor).toBeNull();
    expect(recordId).toBeTruthy();
    expect((await db.membership.findUniqueOrThrow({ where: { id: leaver() } })).leftAt).not.toBeNull();
    expect(await db.schoolRecord.findUniqueOrThrow({ where: { id: recordId! }, select: { studentName: true, destination: true, reason: true } })).toEqual({ studentName: "ZZ Records leaver", destination: "ZZ Elsewhere School", reason: "TRANSFERRED" });
    // Recorded once: a second press is refused, and there is still one certificate.
    expect((await leavingPost(json({ reason: "LEFT" }), p(leaver()))).status).toBe(422);
    expect(await db.schoolRecord.count({ where: { studentMembershipId: leaver() } })).toBe(1);

    expect((await undoPost(bare(), p(leaver()))).status).toBe(200);
    expect((await db.membership.findUniqueOrThrow({ where: { id: leaver() } })).leftAt).toBeNull();
    expect(await db.schoolRecord.count({ where: { studentMembershipId: leaver() } })).toBe(0);
    expect((await undoPost(bare(), p(leaver()))).status).toBe(422);
  });
});
