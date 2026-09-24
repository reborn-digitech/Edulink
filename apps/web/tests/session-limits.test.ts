import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import {
  createSession,
  createApiSession,
  getSession,
  revokeOtherSessions,
  setActiveContext,
  SESSION_ABSOLUTE_MAX_DAYS,
  SUPERUSER_SESSION_TTL_DAYS,
} from "@/lib/session";
import { SESSION_COOKIE, SESSION_TTL_DAYS } from "@/lib/constants";
import { __resetCookies, __setCookie, __setHeaders } from "../tests/stubs/next-headers";

/**
 * How long a session lives, and what a parent's session may name.
 *
 *   * an operator's session is a week, everybody else's a month;
 *   * however far a bearer session slides, it ends six months after it began;
 *   * a parent's context stores no school, whatever the body said, and a
 *     school id written against a parent session is not read back;
 *   * "sign out other devices" takes the push registrations with it.
 *
 * ZZ rows made here, deleted afterwards.
 */

const db = new PrismaClient();
const STAMP = Date.now();
const DAY = 86_400_000;

let schoolId = "";
let operatorId = "";
let parentId = "";
let pupilId = "";

beforeAll(async () => {
  schoolId = (
    await db.school.create({
      data: { name: `ZZ Session School ${STAMP}`, slug: `zz-session-${STAMP}`, code: `ZSS${String(STAMP).slice(-6)}`, contactEmail: `zz-session-${STAMP}@test.invalid`, timezone: "Asia/Kolkata" },
      select: { id: true },
    })
  ).id;
  const mk = (who: string, extra: object = {}) =>
    db.user.create({ data: { name: `ZZ Session ${who}`, email: `zz-session-${who.toLowerCase()}-${STAMP}@test.invalid`, ...extra }, select: { id: true } });
  const [operator, parent, pupil] = await Promise.all([mk("Operator", { isSuperuser: true }), mk("Parent"), mk("Pupil")]);
  operatorId = operator.id;
  parentId = parent.id;
  pupilId = pupil.id;
  const membership = await db.membership.create({ data: { userId: pupilId, schoolId, role: "STUDENT", status: "ACTIVE" }, select: { id: true } });
  await db.guardianship.create({ data: { parentUserId: parentId, studentMembershipId: membership.id, studentSchoolId: schoolId, status: "ACTIVE" } });
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const ids = [operatorId, parentId, pupilId];
  await db.session.deleteMany({ where: { userId: { in: ids } } });
  await db.deviceToken.deleteMany({ where: { userId: { in: ids } } });
  await db.pushSubscription.deleteMany({ where: { userId: { in: ids } } });
  await db.guardianship.deleteMany({ where: { studentSchoolId: schoolId } });
  await db.membership.deleteMany({ where: { schoolId } });
  await db.school.deleteMany({ where: { id: schoolId } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  expect(await db.user.count({ where: { id: { in: ids } } })).toBe(0);
  await db.$disconnect();
});

const days = (from: Date, to: Date) => Math.round((to.getTime() - from.getTime()) / DAY);

describe("how long a session lives", () => {
  it("an operator's session is a week; anybody else's is the ordinary month — cookie and bearer alike", async () => {
    __resetCookies();
    const operatorSession = await createSession(operatorId);
    const row = await db.session.findUniqueOrThrow({ where: { id: operatorSession } });
    expect(days(row.createdAt, row.expiresAt)).toBe(SUPERUSER_SESSION_TTL_DAYS);

    const api = await createApiSession(operatorId);
    expect(days(new Date(), api.expiresAt)).toBe(SUPERUSER_SESSION_TTL_DAYS);

    __resetCookies();
    const parentSession = await createSession(parentId, { role: "PARENT" });
    const parentRow = await db.session.findUniqueOrThrow({ where: { id: parentSession } });
    expect(days(parentRow.createdAt, parentRow.expiresAt)).toBe(SESSION_TTL_DAYS);
  });

  it("⚠ a session that began 181 days ago is refused however recently it slid", async () => {
    __resetCookies();
    const id = await createSession(pupilId, { schoolId, role: "STUDENT" });
    expect(await getSession()).not.toBeNull();

    await db.session.update({
      where: { id },
      data: { createdAt: new Date(Date.now() - (SESSION_ABSOLUTE_MAX_DAYS + 1) * DAY), expiresAt: new Date(Date.now() + 20 * DAY) },
    });
    expect(await getSession()).toBeNull();

    // A day short of the line is still in.
    await db.session.update({ where: { id }, data: { createdAt: new Date(Date.now() - (SESSION_ABSOLUTE_MAX_DAYS - 1) * DAY) } });
    expect(await getSession()).not.toBeNull();
  });

  it("a bearer slide never reaches past the absolute end", async () => {
    __resetCookies();
    const api = await createApiSession(pupilId, { schoolId, role: "STUDENT" });
    // Created 175 days ago, last seen long ago, about to expire: the slide
    // that follows may reach five days out, not thirty.
    await db.session.update({
      where: { id: api.sessionId },
      data: { createdAt: new Date(Date.now() - 175 * DAY), lastSeenAt: new Date(Date.now() - 2 * DAY), expiresAt: new Date(Date.now() + DAY) },
    });
    __setHeaders({ authorization: `Bearer ${api.token}` });
    try {
      expect(await getSession()).not.toBeNull();
    } finally {
      __setHeaders({});
    }
    const row = await db.session.findUniqueOrThrow({ where: { id: api.sessionId } });
    expect(days(new Date(), row.expiresAt)).toBe(5);
  });
});

describe("a parent's context names no school", () => {
  it("⚠ a foreign school id on a PARENT switch is stored as null, and one written against the row is not read back", async () => {
    __resetCookies();
    const id = await createSession(parentId, { role: "PARENT" });

    const switched = await setActiveContext(id, parentId, { schoolId, role: "PARENT" });
    expect(switched).toBe(true);
    expect((await db.session.findUniqueOrThrow({ where: { id } })).activeSchoolId).toBeNull();
    expect((await db.user.findUniqueOrThrow({ where: { id: parentId } })).lastSchoolId).toBeNull();

    // Even a school id planted on the row is ignored for a parent.
    await db.session.update({ where: { id }, data: { activeSchoolId: schoolId } });
    const ctx = await getSession();
    expect(ctx?.role).toBe("PARENT");
    expect(ctx?.schoolId).toBeNull();
  });
});

describe("signing out other devices", () => {
  it("revokes every other session and deletes the phone's and the browser's push registrations", async () => {
    __resetCookies();
    const keep = await createSession(pupilId, { schoolId, role: "STUDENT" });
    const keepToken = (await db.session.findUniqueOrThrow({ where: { id: keep } })).tokenHash;
    __resetCookies();
    const other = await createSession(pupilId, { schoolId, role: "STUDENT" });
    await db.deviceToken.create({ data: { userId: pupilId, expoPushToken: `ExponentPushToken[zz-session-${STAMP}]`, platform: "android" } });
    await db.pushSubscription.create({ data: { userId: pupilId, endpoint: `https://push.invalid/zz-session-${STAMP}`, p256dh: "k", auth: "a" } });

    const count = await revokeOtherSessions(pupilId, keep);
    expect(count).toBeGreaterThanOrEqual(1);
    expect((await db.session.findUniqueOrThrow({ where: { id: other } })).revokedAt).not.toBeNull();
    expect((await db.session.findUniqueOrThrow({ where: { id: keep } })).revokedAt).toBeNull();
    expect((await db.session.findUniqueOrThrow({ where: { id: keep } })).tokenHash).toBe(keepToken);
    expect(await db.deviceToken.count({ where: { userId: pupilId } })).toBe(0);
    expect(await db.pushSubscription.count({ where: { userId: pupilId } })).toBe(0);
    __setCookie(SESSION_COOKIE, null);
  });
});
