/**
 * The /api/v1/operator and /api/v1/appadmin handlers, invoked directly with a
 * primed session the way api-v1-admin.test.ts does: 401 signed out, 403 for a
 * teacher (a school role opens none of these) and for the content team on the
 * operator's three, 200 for a ZZ operator with a body the contract parses,
 * 422 for a query that does not. The operator and the content-team member are
 * ZZ users created here and deleted afterwards; nothing else is touched.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { appAdminCompetitionsSchema, operatorAuditSchema, operatorExpertsSchema, operatorOverviewSchema } from "@edulink/contracts";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as overviewGet } from "@/app/api/v1/operator/overview/route";
import { GET as auditGet } from "@/app/api/v1/operator/audit/route";
import { GET as expertsGet } from "@/app/api/v1/operator/experts/route";
import { GET as competitionsGet } from "@/app/api/v1/appadmin/competitions/route";

const db = new PrismaClient();
const STAMP = Date.now();
const SCHOOL_NAME = `ZZ V1O School ${STAMP}`;

let schoolId = "";
let removedSchoolId = "";
let teacherUserId = "";
let operatorUserId = "";
let curatorUserId = "";
let listedExpertUserId = "";
let waitingExpertUserId = "";
let competitionId = "";

const get = (path: string) => new Request(`http://localhost${path}`);
const P = "/api/v1";

async function signInAs(who: "TEACHER" | "OPERATOR" | "CURATOR") {
  __resetCookies();
  if (who === "TEACHER") await createSession(teacherUserId, { schoolId, role: "TEACHER" });
  else await createSession(who === "OPERATOR" ? operatorUserId : curatorUserId);
}

/** Every handler, so the gates are proved on all of them at once. */
function everyHandler() {
  return [
    { name: "operator/overview", operatorOnly: true, call: () => overviewGet(get(`${P}/operator/overview`)) },
    { name: "operator/audit", operatorOnly: true, call: () => auditGet(get(`${P}/operator/audit`)) },
    { name: "operator/experts", operatorOnly: true, call: () => expertsGet() },
    { name: "appadmin/competitions", operatorOnly: false, call: () => competitionsGet() },
  ];
}

beforeAll(async () => {
  const school = await db.school.create({
    data: { name: SCHOOL_NAME, slug: `zz-v1o-${STAMP}`, code: `ZO${String(STAMP).slice(-6)}`, contactEmail: `zz-v1o-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", city: "ZZ Town" },
    select: { id: true },
  });
  schoolId = school.id;
  const removed = await db.school.create({
    data: { name: `ZZ V1O Removed ${STAMP}`, slug: `zz-v1or-${STAMP}`, code: `ZR${String(STAMP).slice(-6)}`, contactEmail: `zz-v1or-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", removedAt: new Date() },
    select: { id: true },
  });
  removedSchoolId = removed.id;

  const [teacher, operator, curator] = await Promise.all([
    db.user.create({ data: { name: "ZZ V1O Teacher", email: `zz-v1o-teacher-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ V1O Operator", email: `zz-v1o-operator-${STAMP}@test.invalid`, isSuperuser: true }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ V1O Curator", email: `zz-v1o-curator-${STAMP}@test.invalid`, isAppAdmin: true }, select: { id: true } }),
  ]);
  teacherUserId = teacher.id;
  operatorUserId = operator.id;
  curatorUserId = curator.id;
  await db.membership.create({ data: { userId: teacherUserId, schoolId, role: "TEACHER", status: "ACTIVE" } });

  // Two experts, so the queue's order is asserted on every run and not only
  // on a database that happens to hold somebody waiting: one listed a year
  // ago, one still waiting — and the waiting one was created later, which is
  // exactly the case a "publishedAt asc" sort gets wrong.
  const [listedUser, waitingUser] = await Promise.all([
    db.user.create({ data: { name: "ZZ V1O Listed Expert", email: `zz-v1o-listed-${STAMP}@test.invalid` }, select: { id: true } }),
    db.user.create({ data: { name: "ZZ V1O Waiting Expert", email: `zz-v1o-waiting-${STAMP}@test.invalid` }, select: { id: true } }),
  ]);
  listedExpertUserId = listedUser.id;
  waitingExpertUserId = waitingUser.id;
  await db.expertProfile.create({ data: { userId: listedUser.id, headline: "ZZ V1O listed", publishedAt: new Date(Date.now() - 365 * 86_400_000), createdAt: new Date(Date.now() - 400 * 86_400_000) } });
  await db.expertProfile.create({ data: { userId: waitingUser.id, headline: "ZZ V1O waiting", publishedAt: null } });

  const competition = await db.competition.create({
    data: { organizerSchoolId: null, organizerName: "ZZ V1O Platform", title: `ZZ V1O Olympiad ${STAMP}`, summary: "For every school.", status: "DRAFT" },
    select: { id: true },
  });
  competitionId = competition.id;
});

afterAll(async () => {
  __resetCookies();
  const ids = [teacherUserId, operatorUserId, curatorUserId, listedExpertUserId, waitingExpertUserId].filter(Boolean);
  await db.session.deleteMany({ where: { userId: { in: ids } } });
  await db.expertProfile.deleteMany({ where: { userId: { in: ids } } });
  await db.membership.deleteMany({ where: { userId: { in: ids } } });
  if (competitionId) await db.competition.deleteMany({ where: { id: competitionId } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  await db.school.deleteMany({ where: { id: { in: [schoolId, removedSchoolId].filter(Boolean) } } });
  await db.$disconnect();
});

describe("the gates", () => {
  it("every handler answers 401 signed out, in the contract's envelope", async () => {
    __resetCookies();
    for (const h of everyHandler()) {
      const res = await h.call();
      expect(res.status, h.name).toBe(401);
      expect(await res.json()).toMatchObject({ code: "UNAUTHORIZED" });
    }
  });

  it("a teacher is refused everywhere with a 403, not a redirect; the content team is refused on the operator's pages", async () => {
    await signInAs("TEACHER");
    for (const h of everyHandler()) {
      const res = await h.call();
      expect(res.status, `teacher ${h.name}`).toBe(403);
      expect(await res.json()).toMatchObject({ code: "FORBIDDEN" });
    }
    await signInAs("CURATOR");
    for (const h of everyHandler().filter((h) => h.operatorOnly)) {
      const res = await h.call();
      expect(res.status, `curator ${h.name}`).toBe(403);
    }
  });
});

describe("as the operator", () => {
  beforeAll(() => signInAs("OPERATOR"));

  it("overview: the counts, the schools narrowed by q and state, the jobs; a bad state is 422", async () => {
    const res = await overviewGet(get(`${P}/operator/overview?q=${encodeURIComponent(SCHOOL_NAME)}`));
    expect(res.status).toBe(200);
    const body = operatorOverviewSchema.parse(await res.json());
    expect(body.schools.map((s) => s.name)).toEqual([SCHOOL_NAME]);
    expect(body.schools[0]).toMatchObject({ id: schoolId, city: "ZZ Town", removedAt: null, pendingAdminInvites: 0 });
    expect(body.counts.live).toBeGreaterThanOrEqual(1);
    expect(body.counts.removed).toBeGreaterThanOrEqual(1);
    expect(body.counts.appAdmins).toBeGreaterThanOrEqual(1);
    expect(body.jobs.length).toBeGreaterThan(0);
    expect(body.jobs.every((j) => j.describeKey.startsWith("root.jobDesc"))).toBe(true);

    const removed = operatorOverviewSchema.parse(await (await overviewGet(get(`${P}/operator/overview?state=removed&q=ZZ%20V1O`))).json());
    expect(removed.schools.map((s) => s.id)).toEqual([removedSchoolId]);
    expect(removed.schools[0]!.removedAt).not.toBeNull();

    const all = operatorOverviewSchema.parse(await (await overviewGet(get(`${P}/operator/overview?state=all&q=ZZ%20V1O`))).json());
    // Live first, then the removed one.
    expect(all.schools.map((s) => s.id)).toEqual([schoolId, removedSchoolId]);

    expect((await overviewGet(get(`${P}/operator/overview?state=BOGUS`))).status).toBe(422);
  });

  it("audit: the server log parses; the limit is capped", async () => {
    const res = await auditGet(get(`${P}/operator/audit?limit=5`));
    expect(res.status).toBe(200);
    const body = operatorAuditSchema.parse(await res.json());
    expect(body.items.length).toBeLessThanOrEqual(5);
    expect((await auditGet(get(`${P}/operator/audit?limit=999`))).status).toBe(422);
  });

  it("experts: the queue parses, and everyone waiting comes before anyone listed", async () => {
    const res = await expertsGet();
    expect(res.status).toBe(200);
    const body = operatorExpertsSchema.parse(await res.json());
    const waiting = body.items.findIndex((e) => e.headline === "ZZ V1O waiting");
    const listed = body.items.findIndex((e) => e.headline === "ZZ V1O listed");
    expect(waiting).toBeGreaterThanOrEqual(0);
    expect(listed).toBeGreaterThanOrEqual(0);
    expect(waiting).toBeLessThan(listed);
    // Not just those two: no listed profile anywhere above a waiting one.
    const firstListed = body.items.findIndex((e) => e.publishedAt !== null);
    const lastWaiting = body.items.map((e) => e.publishedAt === null).lastIndexOf(true);
    expect(lastWaiting).toBeLessThan(firstListed);
  });

  it("competitions: the operator reads the content team's list too", async () => {
    const res = await competitionsGet();
    expect(res.status).toBe(200);
    const body = appAdminCompetitionsSchema.parse(await res.json());
    expect(body.items.find((c) => c.id === competitionId)).toMatchObject({ title: `ZZ V1O Olympiad ${STAMP}`, status: "DRAFT", organizerName: "ZZ V1O Platform" });
  });
});

describe("as the content team", () => {
  it("competitions: 200 and the contract's shape", async () => {
    await signInAs("CURATOR");
    const res = await competitionsGet();
    expect(res.status).toBe(200);
    expect(appAdminCompetitionsSchema.parse(await res.json()).items.some((c) => c.id === competitionId)).toBe(true);
  });
});
