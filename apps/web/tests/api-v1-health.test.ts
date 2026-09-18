/**
 * The health card's five endpoints, invoked directly with a primed session:
 * who may read, who may write, who may record a check-up, and the shape of
 * the card as each of them sees it. A second school's pupil is 404 to
 * everyone here, and a teacher who does not teach the child gets the same.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as familyGet, POST as familyPost } from "@/app/api/v1/family/health/route";
import { GET as staffGet, POST as staffPost } from "@/app/api/v1/staff/pupils/[membershipId]/health/route";
import { POST as checksPost } from "@/app/api/v1/staff/pupils/[membershipId]/health/checks/route";
import { healthFlagsFor } from "@/lib/health";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let adminUserId = "";
let principalUserId = "";
let teacherUserId = "";
let otherTeacherUserId = "";
let parentUserId = "";
let strangerParentUserId = "";
let pupilMembershipId = "";
let otherPupilMembershipId = "";

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: typeof body === "string" ? body : JSON.stringify(body) });
const params = (membershipId: string) => ({ params: Promise.resolve({ membershipId }) });
async function as(who: "ADMIN" | "PRINCIPAL" | "TEACHER" | "OTHER_TEACHER" | "PARENT" | "STRANGER" | null) {
  __resetCookies();
  if (who === "ADMIN") await createSession(adminUserId, { schoolId, role: "ADMIN" });
  if (who === "PRINCIPAL") await createSession(principalUserId, { schoolId, role: "PRINCIPAL" });
  if (who === "TEACHER") await createSession(teacherUserId, { schoolId, role: "TEACHER" });
  if (who === "OTHER_TEACHER") await createSession(otherTeacherUserId, { schoolId, role: "TEACHER" });
  if (who === "PARENT") await createSession(parentUserId, { schoolId: null, role: "PARENT" });
  if (who === "STRANGER") await createSession(strangerParentUserId, { schoolId: null, role: "PARENT" });
}

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  schoolId = (await db.school.create({ data: { name: `ZZ Health School ${STAMP}`, slug: `zz-health-${STAMP}`, code: `ZH${suffix}`, contactEmail: `zz-health-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  const otherSchoolId = (await db.school.create({ data: { name: `ZZ Health Other ${STAMP}`, slug: `zz-health-o-${STAMP}`, code: `ZI${suffix}`, contactEmail: `zz-health-o-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  const mk = (who: string) => db.user.create({ data: { name: `ZZ Health ${who}`, email: `zz-health-${who.toLowerCase().replace(/ /g, "-")}-${STAMP}@test.invalid` }, select: { id: true } });
  const [admin, principal, teacher, otherTeacher, parent, stranger, pupil, otherPupil] = await Promise.all([mk("Admin"), mk("Principal"), mk("Teacher"), mk("Other Teacher"), mk("Parent"), mk("Stranger"), mk("Pupil"), mk("Other Pupil")]);
  adminUserId = admin.id;
  principalUserId = principal.id;
  teacherUserId = teacher.id;
  otherTeacherUserId = otherTeacher.id;
  parentUserId = parent.id;
  strangerParentUserId = stranger.id;
  await db.membership.createMany({ data: [{ userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" }, { userId: principalUserId, schoolId, role: "PRINCIPAL", status: "ACTIVE" }] });
  const tm = await db.membership.create({ data: { userId: teacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  await db.membership.create({ data: { userId: otherTeacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  const pm = await db.membership.create({ data: { userId: pupil.id, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZHP${STAMP}`, gradeLevel: "4" }, select: { id: true } });
  pupilMembershipId = pm.id;
  const klass = await db.class.create({ data: { schoolId, name: "ZZ Health Class 4", gradeLevel: "4", joinCode: `ZH${suffix}` }, select: { id: true } });
  await db.classTeacher.create({ data: { schoolId, classId: klass.id, teacherMembershipId: tm.id, role: "LEAD" } });
  await db.enrollment.create({ data: { schoolId, classId: klass.id, studentMembershipId: pm.id, status: "ACTIVE" } });
  await db.guardianship.create({ data: { parentUserId, studentMembershipId: pm.id, studentSchoolId: schoolId, status: "ACTIVE" } });
  const opm = await db.membership.create({ data: { userId: otherPupil.id, schoolId: otherSchoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZHO${STAMP}` }, select: { id: true } });
  otherPupilMembershipId = opm.id;
  await db.guardianship.create({ data: { parentUserId: strangerParentUserId, studentMembershipId: opm.id, studentSchoolId: otherSchoolId, status: "ACTIVE" } });
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [adminUserId, principalUserId, teacherUserId, otherTeacherUserId, parentUserId, strangerParentUserId] } } });
  await db.school.deleteMany({ where: { slug: { in: [`zz-health-${STAMP}`, `zz-health-o-${STAMP}`] } } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("doors", () => {
  it("401 signed out; a stranger's guardian sees nothing; a teacher of another class is 404; a pupil of another school is 404 to the office", async () => {
    await as(null);
    expect((await familyGet(get("/api/v1/family/health"))).status).toBe(401);
    expect((await staffGet(get("/x"), params(pupilMembershipId))).status).toBe(401);
    await as("STRANGER");
    // The stranger's first child is their own; asking for our pupil by id is not theirs.
    expect((await familyGet(get(`/api/v1/family/health?childId=${pupilMembershipId}`))).status).toBe(404);
    await as("OTHER_TEACHER");
    expect((await staffGet(get("/x"), params(pupilMembershipId))).status).toBe(404);
    await as("ADMIN");
    expect((await staffGet(get("/x"), params(otherPupilMembershipId))).status).toBe(404);
    await as("PARENT");
    expect((await staffGet(get("/x"), params(pupilMembershipId))).status).toBe(403);
  });

  it("a teacher of the class reads but may not write or record; the head writes; only the office and the head record a check-up", async () => {
    await as("TEACHER");
    const read = await staffGet(get("/x"), params(pupilMembershipId));
    expect(read.status).toBe(200);
    expect(await read.json()).toMatchObject({ studentMembershipId: pupilMembershipId, className: "ZZ Health Class 4", card: null, checks: [], canEdit: false, canRecordCheck: false });
    expect((await staffPost(json("/x", { allergies: "Nuts" }), params(pupilMembershipId))).status).toBe(403);
    expect((await checksPost(json("/x", { dateKey: "2026-09-01", heightCm: 130 }), params(pupilMembershipId))).status).toBe(403);
    await as("PRINCIPAL");
    const wrote = await staffPost(json("/x", { bloodGroup: "O-", notes: "No sport this term." }), params(pupilMembershipId));
    expect(wrote.status).toBe(200);
    expect((await wrote.json()).card).toMatchObject({ bloodGroup: "O-", notes: "No sport this term.", allergies: "", contacts: [], updatedByName: "ZZ Health Principal" });
  });
});

describe("the card", () => {
  it("a guardian writes the whole card and reads it back; the office sees the same; a cleared field stays cleared", async () => {
    await as("PARENT");
    const body = { allergies: "Peanuts", conditions: "Asthma", medications: "Inhaler in the bag", dietary: "No eggs", notes: "Sits at the front", doctorName: "Dr ZZ", doctorPhone: "+912012345678", contacts: [{ name: "ZZ Aunt", relation: "aunt", phone: "+919876400999" }, { name: "ZZ Uncle", phone: "+919876400998" }] };
    const saved = await familyPost(json("/api/v1/family/health", body));
    expect(saved.status).toBe(200);
    const view = await saved.json();
    expect(view.canEdit).toBe(true);
    expect(view.canRecordCheck).toBe(false);
    expect(view.card).toMatchObject({ allergies: "Peanuts", conditions: "Asthma", dietary: "No eggs", doctorName: "Dr ZZ", bloodGroup: null, updatedByName: "ZZ Health Parent" });
    expect(view.card.contacts).toEqual([{ name: "ZZ Aunt", relation: "aunt", phone: "+919876400999" }, { name: "ZZ Uncle", relation: "", phone: "+919876400998" }]);

    await as("ADMIN");
    const office = await (await staffGet(get("/x"), params(pupilMembershipId))).json();
    expect(office.card.allergies).toBe("Peanuts");
    expect(office.canEdit).toBe(true);
    expect(office.canRecordCheck).toBe(true);
    const flags = await healthFlagsFor(schoolId, [pupilMembershipId, "nobody"]);
    expect(flags.get(pupilMembershipId)).toEqual({ allergies: true, conditions: true, medications: true });
    expect(flags.has("nobody")).toBe(false);

    // The family clears the allergy: the office sees it gone, not kept "just in case".
    await as("PARENT");
    const cleared = await (await familyPost(json("/api/v1/family/health", { ...body, allergies: "" }))).json();
    expect(cleared.card.allergies).toBe("");
    expect((await healthFlagsFor(schoolId, [pupilMembershipId])).get(pupilMembershipId)?.allergies).toBe(false);
  });

  it("refuses four contacts, an unknown blood group and a check-up with nothing in it; records a check-up and lists it newest first", async () => {
    await as("ADMIN");
    expect((await staffPost(json("/x", { contacts: [1, 2, 3, 4].map((n) => ({ name: `ZZ ${n}`, phone: "+91987640099" + n })) }), params(pupilMembershipId))).status).toBe(422);
    expect((await staffPost(json("/x", { bloodGroup: "X+" }), params(pupilMembershipId))).status).toBe(422);
    expect((await checksPost(json("/x", { dateKey: "2026-09-01" }), params(pupilMembershipId))).status).toBe(422);
    expect((await checksPost(json("/x", { dateKey: "2026-09-01", weightGrams: 500 }), params(pupilMembershipId))).status).toBe(422);
    const first = await checksPost(json("/x", { dateKey: "2026-07-15", heightCm: 128, weightGrams: 27_400, visionLeft: "6/6", visionRight: "6/9" }), params(pupilMembershipId));
    expect(first.status).toBe(200);
    const second = await checksPost(json("/x", { dateKey: "2026-09-01", notes: "Nurse's visit." }), params(pupilMembershipId));
    expect((await second.json()).checks.map((c: { dateKey: string; heightCm: number | null; visionRight: string | null }) => [c.dateKey, c.heightCm, c.visionRight])).toEqual([["2026-09-01", null, null], ["2026-07-15", 128, "6/9"]]);
    const audits = await db.auditLog.findMany({ where: { schoolId, action: { in: ["health.update", "health.check"] } }, select: { action: true, meta: true } });
    expect(audits.filter((a) => a.action === "health.check")).toHaveLength(2);
    // The audit row says what kind of thing changed, never the text.
    expect(JSON.stringify(audits.map((a) => a.meta))).not.toContain("Peanuts");
  });

  it("a guardian reads the check-ups the school recorded but cannot add one; an empty POST is a blank card, not a refusal", async () => {
    await as("PARENT");
    const view = await (await familyGet(get("/api/v1/family/health"))).json();
    expect(view.checks).toHaveLength(2);
    expect(view.canRecordCheck).toBe(false);
    const blank = await familyPost(json("/api/v1/family/health", {}));
    expect(blank.status).toBe(200);
    expect((await blank.json()).card).toMatchObject({ allergies: "", contacts: [], bloodGroup: null });
  });
});
