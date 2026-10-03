/**
 * The alumni module (the owner's decision of 3 October 2026), on a ZZ school
 * of this suite's own. A departure opens the ALUMNUS row with the leaving
 * date (the batch); the migration's backfill does the same for pupils who
 * left before; the alumnus's former teachers are the teachers of their old
 * classes; they write to staff and only to staff; staff close a room and a
 * staff message opens it again; the office mutes (the alumnus is told) and
 * lifts it; the feed tags an alumnus's words with the year and a pupil's as
 * a pupil's, within the admin's setting; the directory is consent and never
 * a minor's; a note reaches its batch; rejoining closes the row; and the
 * module switched off hides everything without deleting any of it.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { alumniHomeSchema } from "@edulink/contracts";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { AccessError } from "@/lib/tenancy";
import { ModuleOffError } from "@/lib/access-error";
import { gateRequest } from "@/lib/role-gate";
import { setModule } from "@/lib/modules";
import { recordDeparture } from "@/lib/school-record";
import { decideJoin } from "@/lib/join-requests";
import { addComment, createPost, getPost, listFeed } from "@/lib/bulletin";
import { getConversation, listConversations, openConversation, peopleToMessage, sendConversationMessage } from "@/lib/conversations";
import {
  alumniDirectory,
  alumniForOffice,
  alumniHome,
  alumniStaff,
  joinAlumniDirectory,
  leaveAlumniDirectory,
  sendAlumniNote,
  setAlumniFeedMode,
  setAlumnusMentor,
  setAlumnusMuted,
  setConversationClosed,
} from "@/lib/alumni";
import { actionKey } from "@/lib/safety-labels";
import { GET as homeGet } from "@/app/api/v1/alumni/home/route";
import { PUT as directoryPut } from "@/app/api/v1/alumni/directory/route";
import { GET as meGet } from "@/app/api/v1/me/route";

const db = new PrismaClient();
const STAMP = Date.now();
const ids = {
  school: "",
  klass: "",
  admin: "",
  teacher: "",
  teacherMembership: "",
  otherTeacher: "",
  principal: "",
  driver: "",
  pupil: "",
  pupilMembership: "",
  minor: "",
  minorMembership: "",
  current: "",
  alumnus: "",
  minorAlumnus: "",
  post: "",
};

/** Signed in as `userId` in `role` at the suite's school; `route` is what the middleware would name. */
async function as(userId: string, role: string, route: string | null = null): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders(route ? { "x-edulink-route": route } : {});
  await createSession(userId, { schoolId: ids.school, role: role as never });
  return (await getSession())!;
}

const json = (path: string, body: unknown, method = "POST") => new Request(`http://localhost${path}`, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

async function refusedWith(promise: Promise<unknown>, key: string) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(AccessError);
  expect((error as AccessError).key).toBe(key);
}

beforeAll(async () => {
  ids.school = (
    await db.school.create({
      data: { name: `ZZ Alumni Elm ${STAMP}`, slug: `zz-alumni-elm-${STAMP}`, code: `ZAE${String(STAMP).slice(-6)}`, contactEmail: `zz-alumni-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", isTestFixture: true },
      select: { id: true },
    })
  ).id;
  await db.schoolModule.create({ data: { schoolId: ids.school, module: "ALUMNI" } });
  const mk = (who: string, extra: { birthdate?: Date; isMinor?: boolean } = {}) =>
    db.user.create({ data: { name: `ZZ Alum ${who}`, email: `zz-alum-${who.toLowerCase()}-${STAMP}@test.invalid`, ...extra }, select: { id: true } });
  const [admin, teacher, other, principal, driver, pupil, minor, current] = await Promise.all([
    mk("Admin"),
    mk("Teacher"),
    mk("Other"),
    mk("Principal"),
    mk("Driver"),
    mk("Pupil", { birthdate: new Date("2006-02-01T00:00:00Z") }),
    mk("Minor", { birthdate: new Date("2012-02-01T00:00:00Z"), isMinor: true }),
    mk("Current", { birthdate: new Date("2012-05-01T00:00:00Z"), isMinor: true }),
  ]);
  Object.assign(ids, { admin: admin.id, teacher: teacher.id, otherTeacher: other.id, principal: principal.id, driver: driver.id, pupil: pupil.id, minor: minor.id, current: current.id });
  const member = (userId: string, role: string, extra: Record<string, unknown> = {}) => db.membership.create({ data: { userId, schoolId: ids.school, role, status: "ACTIVE", ...extra }, select: { id: true } });
  await member(admin.id, "ADMIN");
  ids.teacherMembership = (await member(teacher.id, "TEACHER", { subjects: JSON.stringify(["Maths"]) })).id;
  await member(other.id, "TEACHER");
  await member(principal.id, "PRINCIPAL");
  await member(driver.id, "DRIVER");
  ids.pupilMembership = (await member(pupil.id, "STUDENT", { joinedAt: new Date("2019-06-01T00:00:00Z"), studentCode: `ZAEP${STAMP}` })).id;
  ids.minorMembership = (await member(minor.id, "STUDENT", { joinedAt: new Date("2020-06-01T00:00:00Z"), studentCode: `ZAEM${STAMP}` })).id;
  const currentMembership = (await member(current.id, "STUDENT", { studentCode: `ZAEC${STAMP}` })).id;
  ids.klass = (await db.class.create({ data: { schoolId: ids.school, name: `ZZ Alum 10A ${STAMP}`, subject: "Homeroom", joinCode: `ZAEK${STAMP}`, gradeLevel: "10" }, select: { id: true } })).id;
  await db.classTeacher.create({ data: { classId: ids.klass, schoolId: ids.school, teacherMembershipId: ids.teacherMembership } });
  await db.enrollment.createMany({
    data: [ids.pupilMembership, ids.minorMembership, currentMembership].map((studentMembershipId) => ({ classId: ids.klass, schoolId: ids.school, studentMembershipId })),
  });

  // The two leave the real way: the office records each departure.
  const office = await as(ids.admin, "ADMIN");
  expect(await recordDeparture(office, ids.pupilMembership, { reason: "GRADUATED", leftOn: new Date("2025-04-30T06:30:00Z") })).toMatchObject({ ok: true });
  expect(await recordDeparture(office, ids.minorMembership, { reason: "TRANSFERRED", leftOn: new Date("2024-04-15T06:30:00Z") })).toMatchObject({ ok: true });
  const rows = await db.membership.findMany({ where: { schoolId: ids.school, role: "ALUMNUS" }, select: { id: true, userId: true } });
  ids.alumnus = rows.find((r) => r.userId === ids.pupil)!.id;
  ids.minorAlumnus = rows.find((r) => r.userId === ids.minor)!.id;

  ids.post = (
    await db.post.create({
      data: { schoolId: ids.school, authorUserId: ids.teacher, authorMembershipId: ids.teacherMembership, scope: "SCHOOL", title: "ZZ Sports day", body: "ZZ", tags: "[]", media: "[]", status: "APPROVED", reviewedAt: new Date() },
      select: { id: true },
    })
  ).id;
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.session.deleteMany({ where: { user: { email: { contains: `-${STAMP}@test.invalid` } } } });
  await db.school.deleteMany({ where: { id: ids.school } });
  await db.user.deleteMany({ where: { email: { contains: `-${STAMP}@test.invalid` } } });
  await db.$disconnect();
});

describe("the alumnus row and home", () => {
  it("is opened by the departure from the leaving day: the batch is its year, the class is the record's, the former teachers are the class's", async () => {
    const me = await as(ids.pupil, "ALUMNUS");
    const home = await alumniHome(me);
    expect(home.batchYear).toBe(2025);
    expect(home.lastClass).toBe(`ZZ Alum 10A ${STAMP}`);
    expect(home.feedMode).toBe("COMMENT");
    expect(home.formerTeachers.map((p) => p.userId)).toEqual([ids.teacher]);
    // Everyone on the staff is reachable, former teachers first; the driver and the pupils are not staff.
    const staff = await alumniStaff(me);
    expect(staff.people[0]!.userId).toBe(ids.teacher);
    expect(staff.people.map((p) => p.userId).sort()).toEqual([ids.admin, ids.teacher, ids.otherTeacher, ids.principal].sort());
  });

  it("answers its door, and /me lists the alumni membership among the contexts", async () => {
    await as(ids.pupil, "ALUMNUS", "GET /api/v1/alumni/home");
    const res = await homeGet();
    expect(res.status).toBe(200);
    expect(alumniHomeSchema.parse(await res.json()).batchYear).toBe(2025);
    await as(ids.pupil, "ALUMNUS", "GET /api/v1/me");
    const me = (await (await meGet()).json()) as { contexts: { schoolId: string; role: string }[] };
    expect(me.contexts).toContainEqual(expect.objectContaining({ schoolId: ids.school, role: "ALUMNUS" }));
    // The gate: a module role passes only what names it; the older roles are judged by the handler.
    await expect(gateRequest("GET /api/v1/alumni/home", { role: "DRIVER", schoolId: ids.school })).rejects.toBeInstanceOf(AccessError);
    await as(ids.teacher, "TEACHER", "GET /api/v1/alumni/home");
    expect((await homeGet()).status).toBe(403);
  });

  it("is backfilled by the migration for a pupil who left before the module, once", async () => {
    const earlier = await db.user.create({ data: { name: "ZZ Alum Earlier", email: `zz-alum-earlier-${STAMP}@test.invalid` }, select: { id: true } });
    const leftAt = new Date("2021-03-31T00:00:00Z");
    await db.membership.create({ data: { userId: earlier.id, schoolId: ids.school, role: "STUDENT", status: "ACTIVE", leftAt, studentCode: `ZAEE${STAMP}` } });
    const sql = readFileSync(join(process.cwd(), "prisma/migrations/20261003194912_alumni_module/migration.sql"), "utf8");
    const insert = sql.slice(sql.indexOf('INSERT INTO "Membership"'));
    // Scoped to this suite's school: the statement as shipped walks every school.
    const scoped = insert.replace("ON CONFLICT", `AND m."schoolId" = '${ids.school}'\nON CONFLICT`);
    await db.$executeRawUnsafe(scoped);
    await db.$executeRawUnsafe(scoped);
    const rows = await db.membership.findMany({ where: { userId: earlier.id, schoolId: ids.school, role: "ALUMNUS" }, select: { status: true, leftAt: true, joinedAt: true } });
    expect(rows).toEqual([{ status: "ACTIVE", leftAt: null, joinedAt: leftAt }]);
    // The two who left through the office already had theirs: not a second.
    expect(await db.membership.count({ where: { schoolId: ids.school, role: "ALUMNUS", userId: { in: [ids.pupil, ids.minor] } } })).toBe(2);
    await db.user.delete({ where: { id: earlier.id } });
  });
});

describe("writing to the school", () => {
  it("opens a room with staff and refuses a pupil or a driver", async () => {
    const me = await as(ids.pupil, "ALUMNUS");
    const { conversationId } = await openConversation(me, ids.school, ids.teacher);
    await sendConversationMessage(me, conversationId, "ZZ Hello, I left last year.");
    await refusedWith(openConversation(me, ids.school, ids.current), "access.cannotMessageThisPerson");
    await refusedWith(openConversation(me, ids.school, ids.driver), "access.cannotMessageThisPerson");
    // The teacher sees who is writing: the room's other person is an ALUMNUS.
    const teacher = await as(ids.teacher, "TEACHER");
    const rooms = await listConversations(teacher);
    expect(rooms.find((r) => r.id === conversationId)?.others[0]?.role).toBe("ALUMNUS");
    // Staff answer in the room; the picker of whom to write to does not list the school's leavers.
    expect((await peopleToMessage(teacher, ids.school)).map((p) => p.userId)).not.toContain(ids.pupil);
  });

  it("lets staff close the room, refuses the alumnus while closed, and opens again when staff write", async () => {
    const me = await as(ids.pupil, "ALUMNUS");
    const { conversationId } = await openConversation(me, ids.school, ids.teacher);
    const teacher = await as(ids.teacher, "TEACHER");
    expect((await getConversation(teacher, conversationId)).canClose).toBe(true);
    expect((await setConversationClosed(teacher, conversationId, true)).changed).toBe(true);
    expect((await setConversationClosed(teacher, conversationId, true)).changed).toBe(false);
    const alumnus = await as(ids.pupil, "ALUMNUS");
    expect((await getConversation(alumnus, conversationId)).closedAt).not.toBeNull();
    expect((await getConversation(alumnus, conversationId)).canClose).toBe(false);
    await refusedWith(sendConversationMessage(alumnus, conversationId, "ZZ Again"), "alumni.refuseClosed");
    await refusedWith(setConversationClosed(alumnus, conversationId, false), "access.wrongRoleForThisAction");
    const teacherAgain = await as(ids.teacher, "TEACHER");
    await sendConversationMessage(teacherAgain, conversationId, "ZZ Write any time.");
    expect((await getConversation(teacherAgain, conversationId)).closedAt).toBeNull();
    const back = await as(ids.pupil, "ALUMNUS");
    await sendConversationMessage(back, conversationId, "ZZ Thank you.");
    const actions = await db.auditLog.findMany({ where: { schoolId: ids.school, targetId: conversationId, action: { in: ["conversation.close", "conversation.reopen"] } }, select: { action: true } });
    expect(actions.map((a) => a.action).sort()).toEqual(["conversation.close", "conversation.reopen"]);
    expect(actionKey("conversation.close")).toBe("audit.conversationClose");
  });

  it("refuses to close a room with no alumnus in it", async () => {
    const teacher = await as(ids.teacher, "TEACHER");
    const { conversationId } = await openConversation(teacher, ids.school, ids.principal);
    await refusedWith(setConversationClosed(teacher, conversationId, true), "alumni.refuseNotAlumniRoom");
  });

  it("is paused by the office's mute, which the alumnus is told and which only the office may set", async () => {
    const teacher = await as(ids.teacher, "TEACHER");
    await refusedWith(setAlumnusMuted(teacher, ids.alumnus, true), "access.wrongRoleForThisAction");
    const office = await as(ids.admin, "ADMIN");
    expect((await setAlumnusMuted(office, ids.alumnus, true, "ZZ Please write to the office")).changed).toBe(true);
    expect((await setAlumnusMuted(office, ids.alumnus, true)).changed).toBe(false);
    const told = await db.notification.findFirst({ where: { userId: ids.pupil, titleKey: "alumni.notifMuted" }, select: { body: true } });
    expect(told?.body).toBe("ZZ Please write to the office");
    const me = await as(ids.pupil, "ALUMNUS");
    await refusedWith(openConversation(me, ids.school, ids.otherTeacher), "alumni.refuseMuted");
    await refusedWith(addComment(me, ids.post, "ZZ muted comment"), "alumni.refuseMuted");
    expect((await alumniHome(me)).muted).toBe(true);
    const officeAgain = await as(ids.admin, "ADMIN");
    expect((await setAlumnusMuted(officeAgain, ids.alumnus, false)).changed).toBe(true);
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: { in: ["alumni.mute", "alumni.unmute"] } } })).toBe(2);
    expect(actionKey("alumni.mute")).toBe("audit.alumniMute");
  });
});

describe("the feed", () => {
  it("tags an alumnus's comment with the year, a pupil's as a pupil's, and holds a minor alumnus's", async () => {
    const me = await as(ids.pupil, "ALUMNUS");
    expect(await addComment(me, ids.post, "ZZ Proud of you all")).toEqual({ status: "APPROVED" });
    const minor = await as(ids.minor, "ALUMNUS");
    expect(await addComment(minor, ids.post, "ZZ Miss this place")).toEqual({ status: "PENDING" });
    const pupil = await as(ids.current, "STUDENT");
    expect(await addComment(pupil, ids.post, "ZZ Can't wait")).toEqual({ status: "PENDING" });
    const teacher = await as(ids.teacher, "TEACHER");
    const post = await getPost(teacher, ids.post);
    expect(post.tagByUser.get(ids.pupil)).toEqual({ role: "ALUMNUS", batch: 2025 });
    expect(post.tagByUser.get(ids.minor)).toEqual({ role: "ALUMNUS", batch: 2024 });
    expect(post.tagByUser.get(ids.current)).toEqual({ role: "STUDENT", batch: null });
    expect(post.tagByUser.get(ids.teacher)).toEqual({ role: "TEACHER", batch: null });
  });

  it("keeps to the admin's setting: read only refuses a comment, posting needs POST and waits for the office with the tag", async () => {
    const office = await as(ids.admin, "ADMIN");
    const me = await as(ids.pupil, "ALUMNUS");
    await refusedWith(createPost(me, { scope: "SCHOOL", title: "ZZ Hello", body: "ZZ", tags: [], media: [] }), "alumni.refuseFeedPost");
    expect(await setAlumniFeedMode(office, "READ")).toEqual({ feedMode: "READ", changed: true });
    await refusedWith(addComment(await as(ids.pupil, "ALUMNUS"), ids.post, "ZZ read only"), "alumni.refuseFeedRead");
    expect(await setAlumniFeedMode(await as(ids.admin, "ADMIN"), "POST")).toEqual({ feedMode: "POST", changed: true });
    const poster = await as(ids.pupil, "ALUMNUS");
    await refusedWith(createPost(poster, { scope: "CLASS", classId: ids.klass, title: "ZZ Class", body: "ZZ", tags: [], media: [] }), "access.wrongRoleForThisAction");
    const made = await createPost(poster, { scope: "SCHOOL", title: "ZZ Ten years on", body: "ZZ", tags: [], media: [] });
    expect(made.status).toBe("PENDING");
    const mine = await listFeed(poster, { mineOnly: true });
    expect(mine.find((p) => p.id === made.postId)).toMatchObject({ authorRole: "ALUMNUS", authorBatch: 2025, status: "PENDING" });
    expect(await setAlumniFeedMode(await as(ids.admin, "ADMIN"), "COMMENT")).toMatchObject({ changed: true });
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: "alumni.settings" } })).toBe(3);
  });
});

describe("the directory", () => {
  it("shows nobody until they join, never a minor, an email only when chosen, and nothing once they leave", async () => {
    const teacher = await as(ids.teacher, "TEACHER");
    expect((await alumniDirectory(teacher)).entries).toEqual([]);
    const minor = await as(ids.minor, "ALUMNUS");
    expect((await alumniDirectory(minor)).canJoin).toBe(false);
    await refusedWith(joinAlumniDirectory(minor, { city: "ZZ", occupation: "ZZ", contactPref: "OFFICE" }), "alumni.refuseMinor");
    await as(ids.pupil, "ALUMNUS", "PUT /api/v1/alumni/directory");
    expect((await directoryPut(json("/api/v1/alumni/directory", {}, "PUT"))).status).toBe(422);
    // Anyone else is refused before the body is read: a 403, not a 422.
    await as(ids.teacher, "TEACHER", "PUT /api/v1/alumni/directory");
    expect((await directoryPut(json("/api/v1/alumni/directory", {}, "PUT"))).status).toBe(403);
    const me = await as(ids.pupil, "ALUMNUS");
    expect(await joinAlumniDirectory(me, { city: "Pune", occupation: "ZZ Engineer", contactPref: "EMAIL" })).toMatchObject({ listed: true, city: "Pune" });
    const listed = await alumniDirectory(await as(ids.teacher, "TEACHER"));
    expect(listed.entries).toEqual([expect.objectContaining({ userId: ids.pupil, batchYear: 2025, city: "Pune", email: `zz-alum-pupil-${STAMP}@test.invalid`, mentor: false })]);

    const office = await as(ids.admin, "ADMIN");
    await refusedWith(setAlumnusMentor(office, ids.minorAlumnus, true), "alumni.refuseMentorMinor");
    expect((await setAlumnusMentor(office, ids.alumnus, true)).changed).toBe(true);
    expect((await alumniDirectory(await as(ids.minor, "ALUMNUS"))).entries[0]?.mentor).toBe(true);

    expect((await leaveAlumniDirectory(await as(ids.pupil, "ALUMNUS"))).listed).toBe(false);
    expect((await alumniDirectory(await as(ids.teacher, "TEACHER"))).entries).toEqual([]);
    expect(await db.alumniProfile.findUnique({ where: { membershipId: ids.alumnus }, select: { city: true, occupation: true, mentor: true } })).toEqual({ city: null, occupation: null, mentor: true });
    expect(await db.auditLog.count({ where: { schoolId: ids.school, action: { in: ["alumni.directory.join", "alumni.directory.leave", "alumni.mentor.on"] } } })).toBe(3);
  });
});

describe("the office", () => {
  it("sees its alumni by batch and writes to one batch or to all", async () => {
    const office = await as(ids.admin, "ADMIN");
    const view = await alumniForOffice(office);
    expect(view.batches).toEqual([
      { year: 2025, count: 1, listed: 0 },
      { year: 2024, count: 1, listed: 0 },
    ]);
    expect(view.alumni.find((a) => a.userId === ids.minor)).toMatchObject({ isMinor: true, lastClass: `ZZ Alum 10A ${STAMP}` });
    expect(await sendAlumniNote(office, { batchYear: 2025, title: "ZZ Reunion", body: "ZZ In December." })).toMatchObject({ recipientCount: 1 });
    expect(await sendAlumniNote(office, { batchYear: null, title: "ZZ Founders' day", body: "ZZ All welcome." })).toMatchObject({ recipientCount: 2 });
    expect((await alumniHome(await as(ids.pupil, "ALUMNUS"))).notes.map((n) => n.title)).toEqual(["ZZ Founders' day", "ZZ Reunion"]);
    expect((await alumniHome(await as(ids.minor, "ALUMNUS"))).notes.map((n) => n.title)).toEqual(["ZZ Founders' day"]);
    expect(await db.notification.count({ where: { userId: ids.pupil, titleKey: "alumni.notifNote" } })).toBe(2);
    await refusedWith(sendAlumniNote(await as(ids.principal, "PRINCIPAL"), { batchYear: null, title: "ZZ", body: "ZZ" }), "access.wrongRoleForThisAction");
  });
});

describe("rejoining and switching off", () => {
  it("hides everything while the school has alumni off, deletes nothing, and finds it again when switched on", async () => {
    const office = await as(ids.admin, "ADMIN");
    const before = await db.membership.count({ where: { schoolId: ids.school, role: "ALUMNUS" } });
    await setModule(office, "ALUMNI", false);
    try {
      const me = await as(ids.pupil, "ALUMNUS");
      await expect(alumniHome(me)).rejects.toBeInstanceOf(ModuleOffError);
      expect(await listConversations(me)).toEqual([]);
      await expect(alumniDirectory(await as(ids.teacher, "TEACHER"))).rejects.toBeInstanceOf(ModuleOffError);
      await expect(gateRequest("GET /api/v1/admin/alumni", { role: "ADMIN", schoolId: ids.school })).rejects.toBeInstanceOf(ModuleOffError);
      // A teacher may not open a new room with an alumnus while the module is off.
      await expect(openConversation(await as(ids.otherTeacher, "TEACHER"), ids.school, ids.minor)).rejects.toBeInstanceOf(ModuleOffError);
      expect(await db.membership.count({ where: { schoolId: ids.school, role: "ALUMNUS" } })).toBe(before);
      expect(await db.alumniProfile.count({ where: { schoolId: ids.school } })).toBeGreaterThan(0);
    } finally {
      await setModule(await as(ids.admin, "ADMIN"), "ALUMNI", true);
    }
    expect((await listConversations(await as(ids.pupil, "ALUMNUS"))).length).toBeGreaterThan(0);
  });

  it("closes the alumnus row when the pupil is taken back on the roll", async () => {
    const request = await db.joinRequest.create({ data: { schoolId: ids.school, userId: ids.minor, via: "SCHOOL" }, select: { id: true } });
    await decideJoin(await as(ids.admin, "ADMIN"), request.id, "APPROVE");
    const row = await db.membership.findUnique({ where: { id: ids.minorAlumnus }, select: { leftAt: true } });
    expect(row?.leftAt).not.toBeNull();
    const pupil = await db.membership.findUnique({ where: { id: ids.minorMembership }, select: { leftAt: true, status: true } });
    expect(pupil).toEqual({ leftAt: null, status: "ACTIVE" });
  });

  it("goes with the account: deleting the person removes the alumnus row and its directory entry", async () => {
    const leaver = await db.user.create({ data: { name: "ZZ Alum Gone", email: `zz-alum-gone-${STAMP}@test.invalid` }, select: { id: true } });
    const row = await db.membership.create({ data: { userId: leaver.id, schoolId: ids.school, role: "ALUMNUS", status: "ACTIVE" }, select: { id: true } });
    await db.alumniProfile.create({ data: { schoolId: ids.school, membershipId: row.id, userId: leaver.id, listed: true } });
    await db.user.delete({ where: { id: leaver.id } });
    expect(await db.membership.count({ where: { id: row.id } })).toBe(0);
    expect(await db.alumniProfile.count({ where: { membershipId: row.id } })).toBe(0);
  });
});
