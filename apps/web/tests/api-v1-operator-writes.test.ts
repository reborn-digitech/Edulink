/**
 * The operator's writes over /api/v1, invoked directly with a primed session
 * the way api-v1-operator.test.ts does: 401 signed out, 403 for a teacher on
 * every handler, then the ZZ operator's 2xx with a body the contract parses,
 * and one refusal per write — each the lib's own sentence, the removal's
 * typed name held on the server. Every row touched is a ZZ row made here:
 * two schools, the users, one expert profile, and the school the create
 * endpoint makes; all are deleted afterwards. No school this file did not
 * create is edited, removed or restored.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { okSchema, operatorAuditSchema, operatorContentTeamSchema, operatorSchoolCreatedSchema, operatorSchoolDetailSchema } from "@edulink/contracts";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { POST as schoolsPost } from "@/app/api/v1/operator/schools/route";
import { GET as schoolGet, PATCH as schoolPatch } from "@/app/api/v1/operator/schools/[schoolId]/route";
import { POST as removePost } from "@/app/api/v1/operator/schools/[schoolId]/remove/route";
import { POST as restorePost } from "@/app/api/v1/operator/schools/[schoolId]/restore/route";
import { POST as verificationPost } from "@/app/api/v1/operator/schools/[schoolId]/verification/route";
import { mayBringOver } from "@/lib/pen";
import { POST as invitesPost } from "@/app/api/v1/operator/schools/[schoolId]/invites/route";
import { POST as revokePost } from "@/app/api/v1/operator/invites/[inviteId]/revoke/route";
import { POST as standingPost } from "@/app/api/v1/operator/experts/[profileId]/standing/route";
import { GET as teamGet, POST as teamPost } from "@/app/api/v1/operator/content-team/route";
import { DELETE as teamDelete } from "@/app/api/v1/operator/content-team/[userId]/route";
import { GET as auditGet } from "@/app/api/v1/operator/audit/route";

const db = new PrismaClient();
const STAMP = Date.now();
const HOME_NAME = `ZZ V1OW Home ${STAMP}`;
const TARGET_NAME = `ZZ V1OW Target ${STAMP}`;
const CREATED_NAME = `ZZ V1OW Created ${STAMP}`;
const CANDIDATE_EMAIL = `zz-v1ow-candidate-${STAMP}@test.invalid`;

let homeSchoolId = "";
let targetSchoolId = "";
let createdSchoolId = "";
let teacherUserId = "";
let operatorUserId = "";
let candidateUserId = "";
let expertUserId = "";
let blankExpertUserId = "";
let profileId = "";
let blankProfileId = "";

const P = "http://localhost/api/v1/operator";
const get = (path: string) => new Request(`${P}${path}`);
const send = (method: "POST" | "PATCH" | "DELETE", path: string, body?: unknown) =>
  new Request(`${P}${path}`, { method, headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
const params = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) });
const today = () => new Date().toISOString().slice(0, 10);

async function signInAs(who: "TEACHER" | "OPERATOR") {
  __resetCookies();
  if (who === "TEACHER") await createSession(teacherUserId, { schoolId: homeSchoolId, role: "TEACHER" });
  else await createSession(operatorUserId);
}

/** Every new handler, each aimed at a ZZ row of this file, so the gates are proved on all of them at once. */
function everyHandler() {
  const school = params({ schoolId: targetSchoolId });
  return [
    { name: "POST schools", call: () => schoolsPost(send("POST", "/schools", { name: CREATED_NAME, contactEmail: "x@test.invalid", timezone: "Asia/Kolkata" })) },
    { name: "GET school", call: () => schoolGet(get(`/schools/${targetSchoolId}`), school) },
    { name: "PATCH school", call: () => schoolPatch(send("PATCH", `/schools/${targetSchoolId}`, { city: "Nowhere" }), school) },
    { name: "POST remove", call: () => removePost(send("POST", `/schools/${targetSchoolId}/remove`, { confirmName: TARGET_NAME }), school) },
    { name: "POST restore", call: () => restorePost(send("POST", `/schools/${targetSchoolId}/restore`), school) },
    { name: "POST verification", call: () => verificationPost(send("POST", `/schools/${targetSchoolId}/verification`, { verified: true }), school) },
    { name: "POST invites", call: () => invitesPost(send("POST", `/schools/${targetSchoolId}/invites`, { email: `zz-v1ow-gate-${STAMP}@test.invalid` }), school) },
    { name: "POST revoke", call: () => revokePost(send("POST", "/invites/nope/revoke"), params({ inviteId: "nope" })) },
    { name: "POST standing", call: () => standingPost(send("POST", `/experts/${profileId}/standing`, { published: true, verified: true }), params({ profileId })) },
    { name: "GET content-team", call: () => teamGet() },
    { name: "POST content-team", call: () => teamPost(send("POST", "/content-team", { email: CANDIDATE_EMAIL })) },
    { name: "DELETE content-team", call: () => teamDelete(send("DELETE", `/content-team/${candidateUserId}`), params({ userId: candidateUserId })) },
    { name: "GET audit filtered", call: () => auditGet(get(`/audit?action=superuser.&q=ZZ&from=${today()}`)) },
  ];
}

beforeAll(async () => {
  const [home, target] = await Promise.all([
    db.school.create({ data: { name: HOME_NAME, slug: `zz-v1ow-h-${STAMP}`, code: `ZH${String(STAMP).slice(-6)}`, contactEmail: `zz-v1ow-h-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } }),
    db.school.create({ data: { name: TARGET_NAME, slug: `zz-v1ow-t-${STAMP}`, code: `ZT${String(STAMP).slice(-6)}`, contactEmail: `zz-v1ow-t-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", city: "ZZ Town" }, select: { id: true } }),
  ]);
  homeSchoolId = home.id;
  targetSchoolId = target.id;

  const [teacher, operator, candidate, expert, blank] = await Promise.all([
    db.user.create({ data: { name: "ZZ V1OW Teacher", email: `zz-v1ow-teacher-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ V1OW Operator", email: `zz-v1ow-operator-${STAMP}@test.invalid`, isSuperuser: true }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ V1OW Candidate", email: CANDIDATE_EMAIL }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ V1OW Expert", email: `zz-v1ow-expert-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ V1OW Blank Expert", email: `zz-v1ow-blank-${STAMP}@test.invalid` }, select: { id: true } }),
  ]);
  teacherUserId = teacher.id;
  operatorUserId = operator.id;
  candidateUserId = candidate.id;
  expertUserId = expert.id;
  blankExpertUserId = blank.id;
  await db.membership.create({ data: { userId: teacherUserId, schoolId: homeSchoolId, role: "TEACHER", status: "ACTIVE" } });
  profileId = (await db.expertProfile.create({ data: { userId: expertUserId, headline: "ZZ V1OW robotics coach", publishedAt: null }, select: { id: true } })).id;
  blankProfileId = (await db.expertProfile.create({ data: { userId: blankExpertUserId, headline: "", publishedAt: null }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  const users = [teacherUserId, operatorUserId, candidateUserId, expertUserId, blankExpertUserId].filter(Boolean);
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.expertProfile.deleteMany({ where: { userId: { in: users } } });
  await db.membership.deleteMany({ where: { userId: { in: users } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  // Invitations and the operator's visits cascade with their school.
  await db.school.deleteMany({ where: { OR: [{ id: { in: [homeSchoolId, targetSchoolId, createdSchoolId].filter(Boolean) } }, { name: CREATED_NAME }] } });
  await db.$disconnect();
});

describe("the gates", () => {
  it("every write and read answers 401 signed out, in the contract's envelope", async () => {
    __resetCookies();
    for (const h of everyHandler()) {
      const res = await h.call();
      expect(res.status, h.name).toBe(401);
      expect(await res.json()).toMatchObject({ code: "UNAUTHORIZED" });
    }
  });

  it("a teacher is refused everywhere with a 403, and nothing moved", async () => {
    await signInAs("TEACHER");
    for (const h of everyHandler()) {
      const res = await h.call();
      expect(res.status, `teacher ${h.name}`).toBe(403);
      expect(await res.json()).toMatchObject({ code: "FORBIDDEN" });
    }
    const target = await db.school.findUniqueOrThrow({ where: { id: targetSchoolId } });
    expect(target).toMatchObject({ city: "ZZ Town", removedAt: null, verifiedAt: null });
    expect(await db.school.count({ where: { name: CREATED_NAME } })).toBe(0);
    expect(await db.expertProfile.findUniqueOrThrow({ where: { id: profileId } })).toMatchObject({ publishedAt: null });
    expect(await db.user.findUniqueOrThrow({ where: { id: candidateUserId } })).toMatchObject({ isAppAdmin: false });
  });
});

describe("as the operator", () => {
  beforeAll(() => signInAs("OPERATOR"));

  it("creates a school (201, its id and join code); a one-letter name and a missing timezone are 422", async () => {
    const res = await schoolsPost(send("POST", "/schools", { name: CREATED_NAME, contactEmail: `zz-v1ow-c-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", gradeLow: "1", gradeHigh: "8", country: "India", city: "ZZ Pune" }));
    expect(res.status).toBe(201);
    const body = operatorSchoolCreatedSchema.parse(await res.json());
    createdSchoolId = body.schoolId;
    expect(await db.school.findUniqueOrThrow({ where: { id: body.schoolId } })).toMatchObject({ name: CREATED_NAME, code: body.code, gradeLow: "1", gradeHigh: "8", city: "ZZ Pune" });
    // A school the operator adds by hand is checked by the act of adding it.
    expect((await db.school.findUniqueOrThrow({ where: { id: body.schoolId } })).verifiedAt).not.toBeNull();

    const short = await schoolsPost(send("POST", "/schools", { name: "Z", contactEmail: "z@test.invalid", timezone: "Asia/Kolkata" }));
    expect(short.status).toBe(422);
    expect(await short.json()).toMatchObject({ code: "BAD_REQUEST", error: "Give the school a name." });
    expect((await schoolsPost(send("POST", "/schools", { name: `${CREATED_NAME} again`, contactEmail: "z@test.invalid" }))).status).toBe(422);
  });

  it("reads one school: its details, no invitations yet; an unknown id is a 404", async () => {
    const res = await schoolGet(get(`/schools/${targetSchoolId}`), params({ schoolId: targetSchoolId }));
    expect(res.status).toBe(200);
    const body = operatorSchoolDetailSchema.parse(await res.json());
    expect(body.school).toMatchObject({ id: targetSchoolId, name: TARGET_NAME, city: "ZZ Town", timezone: "Asia/Kolkata", removedAt: null });
    expect(body.invites).toEqual([]);
    expect(Array.isArray(body.access)).toBe(true);
    expect((await schoolGet(get("/schools/nope"), params({ schoolId: "nope" }))).status).toBe(404);
  });

  it("corrects the details; a grade range upside down is a 422 with the lib's sentence", async () => {
    const res = await schoolPatch(send("PATCH", `/schools/${targetSchoolId}`, { city: "ZZ Nashik", gradeLow: "3", gradeHigh: "10" }), params({ schoolId: targetSchoolId }));
    expect(res.status).toBe(200);
    okSchema.parse(await res.json());
    expect(await db.school.findUniqueOrThrow({ where: { id: targetSchoolId } })).toMatchObject({ city: "ZZ Nashik", gradeLow: "3", gradeHigh: "10", name: TARGET_NAME });

    const upside = await schoolPatch(send("PATCH", `/schools/${targetSchoolId}`, { gradeLow: "10", gradeHigh: "3" }), params({ schoolId: targetSchoolId }));
    expect(upside.status).toBe(422);
    expect(await upside.json()).toMatchObject({ error: "The lowest grade cannot be above the highest." });
    expect((await schoolPatch(send("PATCH", "/schools/nope", { city: "x" }), params({ schoolId: "nope" }))).status).toBe(404);
  });

  it("invites a principal, refuses the same email twice and a malformed one, and revokes it once", async () => {
    const email = `zz-v1ow-head-${STAMP}@test.invalid`;
    const school = params({ schoolId: targetSchoolId });
    const res = await invitesPost(send("POST", `/schools/${targetSchoolId}/invites`, { email, name: "ZZ Head", role: "PRINCIPAL" }), school);
    expect(res.status).toBe(201);
    okSchema.parse(await res.json());
    const detail = operatorSchoolDetailSchema.parse(await (await schoolGet(get(`/schools/${targetSchoolId}`), school)).json());
    expect(detail.invites).toHaveLength(1);
    expect(detail.invites[0]).toMatchObject({ email, name: "ZZ Head", role: "PRINCIPAL", status: "PENDING" });

    const twice = await invitesPost(send("POST", `/schools/${targetSchoolId}/invites`, { email }), school);
    expect(twice.status).toBe(422);
    expect(await twice.json()).toMatchObject({ error: "An invitation is already waiting for them." });
    expect((await invitesPost(send("POST", `/schools/${targetSchoolId}/invites`, { email: "not-an-email" }), school)).status).toBe(422);
    expect((await invitesPost(send("POST", `/schools/${targetSchoolId}/invites`, { email, role: "TEACHER" }), school)).status).toBe(422);

    const inviteId = detail.invites[0]!.id;
    const revoked = await revokePost(send("POST", `/invites/${inviteId}/revoke`), params({ inviteId }));
    expect(revoked.status).toBe(200);
    expect(await db.invite.findUniqueOrThrow({ where: { id: inviteId } })).toMatchObject({ status: "REVOKED" });
    const again = await revokePost(send("POST", `/invites/${inviteId}/revoke`), params({ inviteId }));
    expect(again.status).toBe(422);
    expect(await again.json()).toMatchObject({ error: "That invitation is no longer pending." });
  });

  it("marks a school checked and withdraws the mark: the door for bringing a pupil over opens and shuts with it, a repeat moves nothing, and each change is in the server log once", async () => {
    const school = params({ schoolId: targetSchoolId });
    const verify = (verified: unknown) => verificationPost(send("POST", `/schools/${targetSchoolId}/verification`, verified === undefined ? {} : { verified }), school);
    const logged = (action: string) => db.auditLog.count({ where: { action, targetId: targetSchoolId } });

    // A school made without the operator's hand waits, and may bring nobody over.
    expect((await db.school.findUniqueOrThrow({ where: { id: targetSchoolId } })).verifiedAt).toBeNull();
    expect(await mayBringOver(targetSchoolId, candidateUserId)).toBe(false);

    // Nothing to say, or not a yes or no: 422, and nothing moved.
    expect((await verify(undefined)).status).toBe(422);
    expect((await verify("yes")).status).toBe(422);
    expect((await db.school.findUniqueOrThrow({ where: { id: targetSchoolId } })).verifiedAt).toBeNull();

    const given = await verify(true);
    expect(given.status).toBe(200);
    expect(okSchema.parse(await given.json())).toEqual({ ok: true });
    const stamp = (await db.school.findUniqueOrThrow({ where: { id: targetSchoolId } })).verifiedAt;
    expect(stamp).not.toBeNull();
    expect(await mayBringOver(targetSchoolId, candidateUserId)).toBe(true);
    const detail = operatorSchoolDetailSchema.parse(await (await schoolGet(get(`/schools/${targetSchoolId}`), school)).json());
    expect(detail.school.verifiedAt).toBe(stamp!.toISOString());

    // Pressed again: 200, the first stamp stands, and the log has one row.
    expect((await verify(true)).status).toBe(200);
    expect((await db.school.findUniqueOrThrow({ where: { id: targetSchoolId } })).verifiedAt).toEqual(stamp);
    expect(await logged("superuser.school.verify")).toBe(1);

    const withdrawn = await verify(false);
    expect(withdrawn.status).toBe(200);
    expect((await db.school.findUniqueOrThrow({ where: { id: targetSchoolId } })).verifiedAt).toBeNull();
    expect(await mayBringOver(targetSchoolId, candidateUserId)).toBe(false);
    expect((await verify(false)).status).toBe(200);
    expect(await logged("superuser.school.unverify")).toBe(1);

    const row = await db.auditLog.findFirstOrThrow({ where: { action: "superuser.school.verify", targetId: targetSchoolId } });
    expect(row).toMatchObject({ schoolId: null, actorUserId: operatorUserId, targetType: "School" });

    expect((await verificationPost(send("POST", "/schools/nope/verification", { verified: true }), params({ schoolId: "nope" }))).status).toBe(404);
  });

  it("removes only behind the school's exact name, typed; then restores it, once", async () => {
    const school = params({ schoolId: targetSchoolId });
    // No name at all, then the wrong one: both 422, and the school still stands.
    expect((await removePost(send("POST", `/schools/${targetSchoolId}/remove`, {}), school)).status).toBe(422);
    const wrong = await removePost(send("POST", `/schools/${targetSchoolId}/remove`, { confirmName: "ZZ Somewhere Else" }), school);
    expect(wrong.status).toBe(422);
    expect(await wrong.json()).toMatchObject({ error: "That did not match the school's name, so nothing was removed." });
    expect((await db.school.findUniqueOrThrow({ where: { id: targetSchoolId } })).removedAt).toBeNull();

    const removed = await removePost(send("POST", `/schools/${targetSchoolId}/remove`, { confirmName: ` ${TARGET_NAME} ` }), school);
    expect(removed.status).toBe(200);
    const after = operatorSchoolDetailSchema.parse(await (await schoolGet(get(`/schools/${targetSchoolId}`), school)).json());
    expect(after.school.removedAt).not.toBeNull();
    // A removed school must not quietly grow a new administrator.
    const invite = await invitesPost(send("POST", `/schools/${targetSchoolId}/invites`, { email: `zz-v1ow-late-${STAMP}@test.invalid` }), school);
    expect(invite.status).toBe(422);
    expect(await invite.json()).toMatchObject({ error: "That school has been removed from this server." });
    // Nor be marked checked while it is off the server.
    const marked = await verificationPost(send("POST", `/schools/${targetSchoolId}/verification`, { verified: true }), school);
    expect(marked.status).toBe(422);
    expect(await marked.json()).toMatchObject({ error: "That school has been removed from this server." });
    expect((await db.school.findUniqueOrThrow({ where: { id: targetSchoolId } })).verifiedAt).toBeNull();

    const restored = await restorePost(send("POST", `/schools/${targetSchoolId}/restore`), school);
    expect(restored.status).toBe(200);
    expect((await db.school.findUniqueOrThrow({ where: { id: targetSchoolId } })).removedAt).toBeNull();
    const twice = await restorePost(send("POST", `/schools/${targetSchoolId}/restore`), school);
    expect(twice.status).toBe(422);
    expect(await twice.json()).toMatchObject({ error: "That school is not removed, so there is nothing to restore." });
    expect((await removePost(send("POST", "/schools/nope/remove", { confirmName: "x" }), params({ schoolId: "nope" }))).status).toBe(404);
  });

  it("sets an expert's standing; an empty profile cannot be listed; an unknown one is a 404", async () => {
    const listed = await standingPost(send("POST", `/experts/${profileId}/standing`, { published: true, verified: true }), params({ profileId }));
    expect(listed.status).toBe(200);
    okSchema.parse(await listed.json());
    const row = await db.expertProfile.findUniqueOrThrow({ where: { id: profileId } });
    expect(row.publishedAt).not.toBeNull();
    expect(row.verifiedBy).toBe(operatorUserId);

    const off = await standingPost(send("POST", `/experts/${profileId}/standing`, { published: false, verified: false }), params({ profileId }));
    expect(off.status).toBe(200);
    expect(await db.expertProfile.findUniqueOrThrow({ where: { id: profileId } })).toMatchObject({ publishedAt: null, verifiedAt: null });

    const blank = await standingPost(send("POST", `/experts/${blankProfileId}/standing`, { published: true, verified: false }), params({ profileId: blankProfileId }));
    expect(blank.status).toBe(422);
    expect(await blank.json()).toMatchObject({ error: "That profile has no headline yet. Ask them to fill it in before you list them." });
    expect((await standingPost(send("POST", `/experts/${profileId}/standing`, { published: "yes" }), params({ profileId }))).status).toBe(422);
    expect((await standingPost(send("POST", "/experts/nope/standing", { published: true, verified: false }), params({ profileId: "nope" }))).status).toBe(404);
  });

  it("appoints to the content team by email and dismisses; each refusal says why", async () => {
    const appointed = await teamPost(send("POST", "/content-team", { email: ` ${CANDIDATE_EMAIL.toUpperCase()} ` }));
    expect(appointed.status).toBe(200);
    const team = operatorContentTeamSchema.parse(await (await teamGet()).json());
    expect(team.items.find((m) => m.id === candidateUserId)).toMatchObject({ name: "ZZ V1OW Candidate", email: CANDIDATE_EMAIL, you: false, isOperator: false, disabled: false });

    const again = await teamPost(send("POST", "/content-team", { email: CANDIDATE_EMAIL }));
    expect(again.status).toBe(422);
    expect(await again.json()).toMatchObject({ error: "That person is already on the content team." });
    const nobody = await teamPost(send("POST", "/content-team", { email: `zz-v1ow-nobody-${STAMP}@test.invalid` }));
    expect(nobody.status).toBe(422);
    expect(await nobody.json()).toMatchObject({ error: "No account with that email. Ask them to register first, then appoint them here." });

    const dismissed = await teamDelete(send("DELETE", `/content-team/${candidateUserId}`), params({ userId: candidateUserId }));
    expect(dismissed.status).toBe(200);
    expect(await db.user.findUniqueOrThrow({ where: { id: candidateUserId } })).toMatchObject({ isAppAdmin: false });
    const twice = await teamDelete(send("DELETE", `/content-team/${candidateUserId}`), params({ userId: candidateUserId }));
    expect(twice.status).toBe(422);
    expect(await twice.json()).toMatchObject({ error: "That person is not on the content team." });
  });

  it("the server log filters by family, search, date and live accounts, a page at a time, with a label key per row", async () => {
    const res = await auditGet(get(`/audit?q=${targetSchoolId}&action=superuser.school.&from=${today()}&to=${today()}&live=1`));
    expect(res.status).toBe(200);
    const body = operatorAuditSchema.parse(await res.json());
    const actions = new Set(body.items.map((r) => r.action));
    expect(actions).toEqual(new Set(["superuser.school.update", "superuser.school.verify", "superuser.school.unverify", "superuser.school.remove", "superuser.school.restore"]));
    expect(body.items.find((r) => r.action === "superuser.school.verify")).toMatchObject({ actionKey: "audit.superuserSchoolVerify", schoolName: TARGET_NAME });
    expect(body.total).toBe(body.items.length);
    expect(body.items.every((r) => r.actorName === "ZZ V1OW Operator")).toBe(true);
    expect(body.items.find((r) => r.action === "superuser.school.remove")).toMatchObject({ actionKey: "audit.superuserSchoolRemove", schoolName: TARGET_NAME });
    expect(body.actions).toContain("superuser.invite.admin");

    // The whole family for this school, one row a page: the invite shows up too.
    const paged = operatorAuditSchema.parse(await (await auditGet(get(`/audit?q=${targetSchoolId}&action=superuser.&limit=1&page=2`))).json());
    expect(paged.items).toHaveLength(1);
    expect(paged.total).toBeGreaterThanOrEqual(4);

    // Nothing before the epoch of this test; malformed dates and page 0 are 422.
    const none = operatorAuditSchema.parse(await (await auditGet(get(`/audit?q=${targetSchoolId}&to=2000-01-01`))).json());
    expect(none).toMatchObject({ items: [], total: 0 });
    expect((await auditGet(get("/audit?from=yesterday"))).status).toBe(422);
    expect((await auditGet(get("/audit?page=0"))).status).toBe(422);
    expect((await auditGet(get("/audit?live=yes"))).status).toBe(422);
  });
});
