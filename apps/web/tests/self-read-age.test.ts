/**
 * The pupil's own eyes (self-read.ts): with no age set a pupil reads
 * nothing of their own; the office sets 16 and a 17-year-old reads their
 * card and incidents (read-only), a 15-year-old is 403, a pupil with no
 * date of birth is 403; the head reads the dial and may not turn it; the
 * range is held; a pupil's own read is not a "who read this" row.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { createSession } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { GET as healthGet } from "@/app/api/v1/family/health/route";
import { GET as incidentsGet } from "@/app/api/v1/family/incidents/route";
import { GET as ageGet, POST as agePost } from "@/app/api/v1/office/self-read-age/route";
import { maySelfRead } from "@/lib/self-read";

const db = new PrismaClient();
const STAMP = Date.now();
let schoolId = "";
let adminUserId = "";
let principalUserId = "";
let teacherMembershipId = "";
let seventeenUserId = "";
let seventeenMembershipId = "";
let fifteenUserId = "";
let fifteenMembershipId = "";
let ageless17UserId = "";

const get = (handler: (r: Request) => Promise<Response>, path: string) => handler(new Request(`http://localhost${path}`));
const post = (body: unknown) => agePost(new Request("http://localhost/api/v1/office/self-read-age", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
const yearsAgo = (years: number) => {
  const d = new Date();
  // A month past the birthday, so "at least" is not a same-day question.
  return new Date(Date.UTC(d.getUTCFullYear() - years, d.getUTCMonth(), 1) - 40 * 86_400_000);
};

async function as(userId: string | null, role: "ADMIN" | "PRINCIPAL" | "STUDENT") {
  __resetCookies();
  if (userId) await createSession(userId, { schoolId, role });
}

beforeAll(async () => {
  const suffix = String(STAMP).slice(-6);
  schoolId = (await db.school.create({ data: { name: `ZZ SelfRead School ${STAMP}`, slug: `zz-selfread-${STAMP}`, code: `ZS${suffix}`, contactEmail: `zz-selfread-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" }, select: { id: true } })).id;
  const mk = (who: string, birthdate: Date | null) => db.user.create({ data: { name: `ZZ SelfRead ${who}`, email: `zz-selfread-${who.toLowerCase().replace(/ /g, "-")}-${STAMP}@test.invalid`, birthdate }, select: { id: true } });
  const [admin, principal, teacher, seventeen, fifteen, ageless] = await Promise.all([mk("Admin", null), mk("Principal", null), mk("Teacher", null), mk("Seventeen", yearsAgo(17)), mk("Fifteen", yearsAgo(15)), mk("Ageless", null)]);
  adminUserId = admin.id;
  principalUserId = principal.id;
  seventeenUserId = seventeen.id;
  fifteenUserId = fifteen.id;
  ageless17UserId = ageless.id;
  await db.membership.createMany({ data: [{ userId: adminUserId, schoolId, role: "ADMIN", status: "ACTIVE" }, { userId: principalUserId, schoolId, role: "PRINCIPAL", status: "ACTIVE" }] });
  teacherMembershipId = (await db.membership.create({ data: { userId: teacher.id, schoolId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } })).id;
  const pupil = (userId: string, code: string) => db.membership.create({ data: { userId, schoolId, role: "STUDENT", status: "ACTIVE", studentCode: `${code}${STAMP}`, gradeLevel: "11" }, select: { id: true } });
  seventeenMembershipId = (await pupil(seventeenUserId, "ZS7")).id;
  fifteenMembershipId = (await pupil(fifteenUserId, "ZS5")).id;
  await pupil(ageless17UserId, "ZS0");
  const card = await db.healthCard.create({ data: { schoolId, studentMembershipId: seventeenMembershipId, allergies: "Dust", updatedByUserId: adminUserId }, select: { id: true } });
  expect(card.id).toBeTruthy();
  await db.incident.create({ data: { schoolId, studentMembershipId: seventeenMembershipId, reportedByMembershipId: teacherMembershipId, kind: "INJURY", severity: "MINOR", occurredAt: new Date(), title: "ZZ Twisted an ankle", body: "At games.", actionTaken: "Ice." } });
});

afterAll(async () => {
  __resetCookies();
  await db.session.deleteMany({ where: { userId: { in: [adminUserId, principalUserId, seventeenUserId, fifteenUserId, ageless17UserId] } } });
  await db.school.deleteMany({ where: { slug: `zz-selfread-${STAMP}` } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the dial", () => {
  it("starts at never: a 17-year-old reads neither card nor incidents", async () => {
    await as(seventeenUserId, "STUDENT");
    expect((await get(healthGet, "/api/v1/family/health")).status).toBe(403);
    expect((await get(incidentsGet, "/api/v1/family/incidents")).status).toBe(403);
    const session = await db.session.findFirstOrThrow({ where: { userId: seventeenUserId }, select: { id: true } });
    expect(session.id).toBeTruthy();
  });

  it("the head reads it and may not turn it; the office turns it, within range, and it is audited", async () => {
    await as(principalUserId, "PRINCIPAL");
    expect(await (await ageGet()).json()).toEqual({ selfReadAge: null });
    expect((await post({ selfReadAge: 16 })).status).toBe(403);
    await as(adminUserId, "ADMIN");
    expect((await post({ selfReadAge: 3 })).status).toBe(422);
    expect((await post({ selfReadAge: 16.5 })).status).toBe(422);
    expect((await post({})).status).toBe(422);
    const set = await post({ selfReadAge: 16 });
    expect(set.status).toBe(200);
    expect(await set.json()).toEqual({ selfReadAge: 16 });
    expect(await (await ageGet()).json()).toEqual({ selfReadAge: 16 });
    const audit = await db.auditLog.findFirst({ where: { schoolId, action: "school.selfReadAge" } });
    expect(JSON.parse(audit!.meta)).toEqual({ from: null, to: 16 });
  });
});

describe("with the age at 16", () => {
  it("a 17-year-old reads their own card and incidents, read-only, and leaves no 'who read this' row", async () => {
    await as(seventeenUserId, "STUDENT");
    const card = await get(healthGet, "/api/v1/family/health");
    expect(card.status).toBe(200);
    const view = await card.json();
    expect(view).toMatchObject({ studentMembershipId: seventeenMembershipId, studentName: "ZZ SelfRead Seventeen", canEdit: false, canRecordCheck: false });
    expect(view.card.allergies).toBe("Dust");
    const log = await get(incidentsGet, "/api/v1/family/incidents");
    expect(log.status).toBe(200);
    const incidents = await log.json();
    expect(incidents.childName).toBe("ZZ SelfRead Seventeen");
    expect(incidents.incidents).toHaveLength(1);
    expect(incidents.incidents[0]).toMatchObject({ title: "ZZ Twisted an ankle", canNote: false, canClose: false });
    expect(await db.healthCardRead.count({ where: { schoolId, studentMembershipId: seventeenMembershipId } })).toBe(0);
    // A childId in the query names somebody else's record: the pupil's own is what answers, never another pupil's.
    const other = await get(healthGet, `/api/v1/family/health?childId=${fifteenMembershipId}`);
    expect((await other.json()).studentMembershipId).toBe(seventeenMembershipId);
  });

  it("a 15-year-old is 403, and so is a pupil with no date of birth on the account", async () => {
    await as(fifteenUserId, "STUDENT");
    expect((await get(healthGet, "/api/v1/family/health")).status).toBe(403);
    expect((await get(incidentsGet, "/api/v1/family/incidents")).status).toBe(403);
    await as(ageless17UserId, "STUDENT");
    expect((await get(healthGet, "/api/v1/family/health")).status).toBe(403);
    expect((await get(incidentsGet, "/api/v1/family/incidents")).status).toBe(403);
  });

  it("the page's yes-or-no agrees with the doors, and a clock makes the birthday the boundary", async () => {
    const seventeen = { user: { id: seventeenUserId, name: "x", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false }, schoolId, role: "STUDENT" as const, membershipId: seventeenMembershipId } as unknown as Parameters<typeof maySelfRead>[0];
    expect(await maySelfRead(seventeen, seventeenMembershipId)).toBe(true);
    expect(await maySelfRead(seventeen, fifteenMembershipId)).toBe(false);
    // Two years ago they were fifteen.
    expect(await maySelfRead(seventeen, seventeenMembershipId, new Date(Date.now() - 2 * 366 * 86_400_000))).toBe(false);
    // Switched off again, the 17-year-old is refused once more.
    await as(adminUserId, "ADMIN");
    expect(await (await post({ selfReadAge: null })).json()).toEqual({ selfReadAge: null });
    await as(seventeenUserId, "STUDENT");
    expect((await get(healthGet, "/api/v1/family/health")).status).toBe(403);
  });
});
