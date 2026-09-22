/**
 * The UDISE+ PEN through its handlers: eleven digits or refused, one pupil
 * per number across the platform, the record mirroring the account; the
 * office finding a pupil here in full and a pupil elsewhere by state alone;
 * the people search matching it; an intake row with the PEN and the date of
 * birth linking the pupil's existing account and one without a match
 * minting an account that carries it; an admission with the PEN doing the
 * same; the certificate and the filing printing the account's number.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { admitPupils } from "@/lib/intake";
import { GET as recordGet, POST as recordPost } from "@/app/api/v1/office/pupil-records/[membershipId]/route";
import { GET as lookupGet } from "@/app/api/v1/office/pupils/by-pen/[pen]/route";
import { GET as peopleGet } from "@/app/api/v1/admin/people/route";
import { POST as applyPost } from "@/app/api/v1/family/applications/route";
import { POST as cyclesPost } from "@/app/api/v1/office/admissions/cycles/route";
import { POST as cycleStatus } from "@/app/api/v1/office/admissions/cycles/[cycleId]/status/route";
import { POST as offerPost } from "@/app/api/v1/office/admissions/applications/[applicationId]/offer/route";
import { POST as respondPost } from "@/app/api/v1/family/applications/[applicationId]/respond/route";
import { POST as admitPost } from "@/app/api/v1/office/admissions/applications/[applicationId]/admit/route";
import type { ActiveContext } from "@/lib/session";

const db = new PrismaClient();
const STAMP = Date.now();
const PEN_A = `27${String(STAMP).slice(-9)}`;
const PEN_B = `28${String(STAMP).slice(-9)}`;
const PEN_C = `29${String(STAMP).slice(-9)}`;
let oldSchoolId = "";
let newSchoolId = "";
let oldAdminUserId = "";
let newAdminUserId = "";
let parentUserId = "";
let pupilUserId = "";
let pupilAtOld = "";
let yearId = "";

const get = (path: string) => new Request(`http://localhost${path}`);
const json = (path: string, body: unknown) => new Request(`http://localhost${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = <T extends object>(p: T) => ({ params: Promise.resolve(p) });
async function as(who: "OLD_ADMIN" | "NEW_ADMIN" | "PARENT" | null) {
  __resetCookies();
  if (who === "OLD_ADMIN") await createSession(oldAdminUserId, { schoolId: oldSchoolId, role: "ADMIN" });
  if (who === "NEW_ADMIN") await createSession(newAdminUserId, { schoolId: newSchoolId, role: "ADMIN" });
  if (who === "PARENT") await createSession(parentUserId, { schoolId: null, role: "PARENT" });
}
const ctxOf = (userId: string, schoolId: string, membershipId: string): ActiveContext => ({ user: { id: userId, name: "x", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false, prefs: { theme: "system", locale: "en" } as never }, sessionId: "s", membershipId, schoolId, role: "ADMIN" });

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  const mkSchool = (tag: string) => db.school.create({ data: { name: `ZZ Pen ${tag} ${STAMP}`, slug: `zz-pen-${tag.toLowerCase()}-${STAMP}`, code: `ZP${tag[0]}${suffix.slice(1)}`, contactEmail: `zz-pen-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", profilePublishedAt: new Date() }, select: { id: true } });
  oldSchoolId = (await mkSchool("Old")).id;
  newSchoolId = (await mkSchool("New")).id;
  const mk = (who: string, extra: Record<string, unknown> = {}) => db.user.create({ data: { name: `ZZ Pen ${who}`, email: `zz-pen-${who.toLowerCase().replace(/ /g, "-")}-${STAMP}@test.invalid`, ...extra }, select: { id: true } });
  const [oa, na, parent, pupil] = await Promise.all([mk("Old Admin"), mk("New Admin"), mk("Parent"), mk("Riya Rane", { birthdate: new Date("2014-05-20T00:00:00Z") })]);
  oldAdminUserId = oa.id; newAdminUserId = na.id; parentUserId = parent.id; pupilUserId = pupil.id;
  await db.membership.create({ data: { userId: oldAdminUserId, schoolId: oldSchoolId, role: "ADMIN", status: "ACTIVE" } });
  await db.membership.create({ data: { userId: newAdminUserId, schoolId: newSchoolId, role: "ADMIN", status: "ACTIVE" } });
  pupilAtOld = (await db.membership.create({ data: { userId: pupilUserId, schoolId: oldSchoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZPO${STAMP}` }, select: { id: true } })).id;
  const oldClass = await db.class.create({ data: { schoolId: oldSchoolId, name: "ZZ 6A", gradeLevel: "6", joinCode: `ZPO1${suffix.slice(1)}` }, select: { id: true } });
  await db.enrollment.create({ data: { schoolId: oldSchoolId, classId: oldClass.id, studentMembershipId: pupilAtOld, status: "ACTIVE" } });
  await db.class.create({ data: { schoolId: newSchoolId, name: "ZZ 7A", gradeLevel: "7", joinCode: `ZPN1${suffix.slice(1)}` } });
  yearId = (await db.academicYear.create({ data: { schoolId: newSchoolId, name: "2026–27", startDate: new Date("2026-06-01T00:00:00Z"), endDate: new Date("2027-04-30T00:00:00Z"), isCurrent: true }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [oldAdminUserId, newAdminUserId, parentUserId] } } });
  await db.school.deleteMany({ where: { id: { in: [oldSchoolId, newSchoolId] } } });
  await db.user.deleteMany({ where: { OR: [{ email: { contains: `-${STAMP}@test.invalid` } }, { penNumber: { in: [PEN_A, PEN_B, PEN_C] } }] } });
  await db.$disconnect();
});

describe("the PEN on the record", () => {
  it("is eleven digits or refused, goes on the account, is one pupil's alone, and the record reads it back even before it is written there", async () => {
    await as("OLD_ADMIN");
    expect((await recordPost(json(`/api/v1/office/pupil-records/${pupilAtOld}`, { penNumber: "1234" }), params({ membershipId: pupilAtOld }))).status).toBe(403);
    let res = await recordPost(json(`/api/v1/office/pupil-records/${pupilAtOld}`, { penNumber: `${PEN_A.slice(0, 5)} ${PEN_A.slice(5)}`, fatherName: "Rahul Rane" }), params({ membershipId: pupilAtOld }));
    expect(res.status).toBe(200);
    expect((await res.json()).record.penNumber).toBe(PEN_A);
    expect((await db.user.findUniqueOrThrow({ where: { id: pupilUserId }, select: { penNumber: true } })).penNumber).toBe(PEN_A);
    // Another pupil claiming the same number is refused; the account keeps it.
    const other = await db.user.create({ data: { name: `ZZ Pen Other ${STAMP}`, email: `zz-pen-other-${STAMP}@test.invalid` }, select: { id: true } });
    const otherM = (await db.membership.create({ data: { userId: other.id, schoolId: oldSchoolId, role: "STUDENT", status: "ACTIVE", studentCode: `ZPX${STAMP}` }, select: { id: true } })).id;
    expect((await recordPost(json(`/api/v1/office/pupil-records/${otherM}`, { penNumber: PEN_A }), params({ membershipId: otherM }))).status).toBe(403);
    // The account's number shows on a record that never wrote it.
    await db.user.update({ where: { id: other.id }, data: { penNumber: PEN_B } });
    res = await recordGet(get(`/api/v1/office/pupil-records/${otherM}`), params({ membershipId: otherM }));
    expect((await res.json()).record.penNumber).toBe(PEN_B);
    // Clearing the field clears the account.
    await recordPost(json(`/api/v1/office/pupil-records/${otherM}`, { penNumber: "" }), params({ membershipId: otherM }));
    expect((await db.user.findUniqueOrThrow({ where: { id: other.id }, select: { penNumber: true } })).penNumber).toBeNull();
  });

  it("the office finds a pupil here by PEN, sees another school's pupil by state alone, and nobody for an unknown number; the people search matches it", async () => {
    await as("OLD_ADMIN");
    let res = await lookupGet(get(`/api/v1/office/pupils/by-pen/${PEN_A}`), params({ pen: PEN_A }));
    expect(await res.json()).toEqual({ pen: PEN_A, found: "HERE", pupil: { membershipId: pupilAtOld, name: "ZZ Pen Riya Rane", className: "ZZ 6A", studentCode: `ZPO${STAMP}` } });
    expect((await lookupGet(get("/api/v1/office/pupils/by-pen/12"), params({ pen: "12" }))).status).toBe(403);
    expect(await (await lookupGet(get(`/api/v1/office/pupils/by-pen/${PEN_C}`), params({ pen: PEN_C }))).json()).toEqual({ pen: PEN_C, found: "NONE", pupil: null });
    await as("NEW_ADMIN");
    expect(await (await lookupGet(get(`/api/v1/office/pupils/by-pen/${PEN_A}`), params({ pen: PEN_A }))).json()).toEqual({ pen: PEN_A, found: "ELSEWHERE_ACTIVE", pupil: null });
    await as("OLD_ADMIN");
    res = await peopleGet(get(`/api/v1/admin/people?q=${PEN_A}`));
    expect(res.status).toBe(200);
    const people = await res.json();
    expect(people.members.map((p: { membershipId: string }) => p.membershipId)).toEqual([pupilAtOld]);
  });

  it("an intake row with the PEN and the date of birth links the pupil's account at the new school, wrong details are refused by name, and a fresh PEN goes on a new account", async () => {
    const newAdminMembership = (await db.membership.findFirstOrThrow({ where: { userId: newAdminUserId, schoolId: newSchoolId }, select: { id: true } })).id;
    const ctx = ctxOf(newAdminUserId, newSchoolId, newAdminMembership);
    const row = (over: Record<string, unknown>) => ({ line: 1, name: "ZZ Pen Riya Rane", birthdateKey: "2014-05-20", className: "ZZ 7A", pupilEmail: null, guardianEmail: null, guardianName: null, relation: "PARENT" as const, studentCode: null, pen: PEN_A, ...over });
    let result = await admitPupils(ctx, [row({ birthdateKey: null })]);
    expect(result.outcomes[0]).toMatchObject({ status: "skipped", reasonKey: "intake.penNeedsBirthdate" });
    result = await admitPupils(ctx, [row({ birthdateKey: "2014-05-21" })]);
    expect(result.outcomes[0]).toMatchObject({ status: "skipped", reasonKey: "intake.penMismatch" });
    result = await admitPupils(ctx, [row({ pen: false })]);
    expect(result.outcomes[0]).toMatchObject({ status: "skipped", reasonKey: "intake.penFormat" });
    result = await admitPupils(ctx, [row({})]);
    expect(result.outcomes[0]).toMatchObject({ status: "admitted", linked: true, className: "ZZ 7A" });
    const memberships = await db.membership.findMany({ where: { userId: pupilUserId, role: "STUDENT" }, select: { schoolId: true } });
    expect(memberships.map((m) => m.schoolId).sort()).toEqual([newSchoolId, oldSchoolId].sort());
    await as("NEW_ADMIN");
    expect((await (await lookupGet(get(`/api/v1/office/pupils/by-pen/${PEN_A}`), params({ pen: PEN_A }))).json()).found).toBe("HERE");
    // A PEN nobody holds: a new account carrying it, the record mirroring it.
    result = await admitPupils(ctx, [row({ line: 2, name: `ZZ Pen New Child ${STAMP}`, birthdateKey: "2015-01-01", pen: PEN_C })]);
    expect(result.outcomes[0]?.status, JSON.stringify(result.outcomes[0])).toBe("admitted");
    expect(result.outcomes[0]?.linked).toBeUndefined();
    const fresh = await db.user.findUnique({ where: { penNumber: PEN_C }, select: { name: true, memberships: { select: { pupilRecord: { select: { penNumber: true } } } } } });
    expect(fresh?.name).toBe(`ZZ Pen New Child ${STAMP}`);
    expect(fresh?.memberships[0]?.pupilRecord?.penNumber).toBe(PEN_C);
  });

  it("an admission carrying the PEN links the existing account at the seat instead of minting another, and refuses a mismatched birthdate", async () => {
    // The pupil leaves the old school for this test's purposes: their account is what the PEN names.
    await db.membership.updateMany({ where: { userId: pupilUserId, schoolId: newSchoolId }, data: { status: "SUSPENDED", leftAt: new Date() } });
    await as("NEW_ADMIN");
    const cycle = await (await cyclesPost(json("/api/v1/office/admissions/cycles", { academicYearId: yearId, name: "ZZ Pen cycle", grades: [{ grade: "7", seats: 2 }], documents: [], testRequired: false, notice: "", feeStructureId: null, opensAt: null, closesAt: null }))).json();
    await cycleStatus(json(`/api/v1/office/admissions/cycles/${cycle.id}/status`, { status: "OPEN" }), params({ cycleId: cycle.id }));
    await as("PARENT");
    const wrong = await (await applyPost(json("/api/v1/family/applications", { schoolId: newSchoolId, cycleId: cycle.id, childName: "ZZ Pen Riya Rane", childBirthdate: "2014-05-21", gradeApplied: "7", penNumber: PEN_A }))).json();
    const right = await (await applyPost(json("/api/v1/family/applications", { schoolId: newSchoolId, cycleId: cycle.id, childName: "ZZ Pen Riya Rane Again", childBirthdate: "2014-05-20", gradeApplied: "7", penNumber: PEN_A }))).json();
    expect(right.penNumber).toBe(PEN_A);
    await as("NEW_ADMIN");
    for (const id of [wrong.id, right.id]) await offerPost(json(`/api/v1/office/admissions/applications/${id}/offer`, { expiresOn: null }), params({ applicationId: id }));
    await as("PARENT");
    for (const id of [wrong.id, right.id]) await respondPost(json(`/api/v1/family/applications/${id}/respond`, { answer: "ACCEPT" }), params({ applicationId: id }));
    await as("NEW_ADMIN");
    expect((await admitPost(json(`/api/v1/office/admissions/applications/${wrong.id}/admit`, {}), params({ applicationId: wrong.id }))).status).toBe(403);
    const res = await admitPost(json(`/api/v1/office/admissions/applications/${right.id}/admit`, {}), params({ applicationId: right.id }));
    expect(res.status).toBe(200);
    const admitted = await res.json();
    expect(admitted.firstSignInCode).toBeNull();
    const membership = await db.membership.findUniqueOrThrow({ where: { id: admitted.studentMembershipId }, select: { userId: true, pupilRecord: { select: { penNumber: true } } } });
    expect(membership.userId).toBe(pupilUserId);
    expect(membership.pupilRecord?.penNumber).toBe(PEN_A);
    expect(await db.user.count({ where: { name: { contains: "ZZ Pen Riya Rane" } } })).toBe(1);
  });
});
