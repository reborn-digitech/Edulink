import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { tidyNotificationsFor, tidyAllNotifications, setNotifThresholds, effectiveThresholds, AUTO_READ_AFTER_DAYS, EXPIRE_READ_AFTER_DAYS } from "@/lib/notification-housekeeping";
import { AccessError } from "@/lib/tenancy";
import type { ActiveContext } from "@/lib/session";

/**
 * Notifications do not live forever: unread ones are read at ninety days,
 * read ones go at a year, and an unread one is NEVER deleted by the tidy —
 * the same line `clearRead` holds.
 */

const db = new PrismaClient();
const EMAIL = "zz.notif.tidy@riverside.test";
const DAY = 86_400_000;
let userId: string;

function at(daysAgo: number, now: Date) {
  return new Date(now.getTime() - daysAgo * DAY);
}

beforeAll(async () => {
  const user =
    (await db.user.findUnique({ where: { email: EMAIL } })) ??
    (await db.user.create({ data: { email: EMAIL, name: "ZZ Notif Tidy", prefs: "{}" } }));
  userId = user.id;
  await db.notification.deleteMany({ where: { userId } });
});

afterAll(async () => {
  await db.notification.deleteMany({ where: { userId } });
  await db.user.deleteMany({ where: { email: EMAIL } });
  await db.$disconnect();
});

describe("tidying one person's notifications", () => {
  it("⚠ reads the stale, removes the old-and-read, and never deletes an unread one", async () => {
    const now = new Date("2026-08-22T10:00:00Z");
    const mk = (title: string, daysAgo: number, read: boolean) =>
      db.notification.create({
        data: { userId, kind: "SYSTEM", title, createdAt: at(daysAgo, now), readAt: read ? at(daysAgo, now) : null },
      });
    await mk("fresh unread", 3, false);
    await mk("fresh read", 3, true);
    await mk("stale unread", AUTO_READ_AFTER_DAYS + 1, false);
    await mk("just inside", AUTO_READ_AFTER_DAYS - 1, false);
    await mk("old read", EXPIRE_READ_AFTER_DAYS + 1, true);
    await mk("ancient unread", EXPIRE_READ_AFTER_DAYS * 3, false);

    const result = await tidyNotificationsFor(userId, now);
    expect(result).toEqual({ autoRead: 2, expired: 1 }); // stale + ancient read; old read gone; ancient NOT gone

    const rows = await db.notification.findMany({ where: { userId }, orderBy: { title: "asc" } });
    const byTitle = Object.fromEntries(rows.map((r) => [r.title, r.readAt]));
    expect(Object.keys(byTitle).sort()).toEqual(["ancient unread", "fresh read", "fresh unread", "just inside", "stale unread"]);
    expect(byTitle["fresh unread"]).toBeNull();
    expect(byTitle["just inside"]).toBeNull();
    expect(byTitle["stale unread"]?.toISOString()).toBe(now.toISOString()); // read NOW, not back-dated
    // The ancient unread one was read, not deleted — and goes only on the NEXT tidy.
    expect(byTitle["ancient unread"]).not.toBeNull();
    // The next visit removes it — it is read now, and older than a year.
    expect(await tidyNotificationsFor(userId, new Date(now.getTime() + DAY))).toEqual({ autoRead: 0, expired: 1 });
    expect(await tidyNotificationsFor(userId, new Date(now.getTime() + EXPIRE_READ_AFTER_DAYS * DAY))).toEqual({ autoRead: 2, expired: 2 });
  });

  it("writes nothing when there is nothing to do", async () => {
    await db.notification.deleteMany({ where: { userId } });
    await db.notification.create({ data: { userId, kind: "SYSTEM", title: "today", readAt: null } });
    expect(await tidyNotificationsFor(userId)).toEqual({ autoRead: 0, expired: 0 });
  });
});


describe("per-school thresholds", () => {
  let schoolId: string;
  let admin: ActiveContext;
  let teacher: ActiveContext;
  const ctx = (userId: string, membershipId: string, role: "ADMIN" | "TEACHER"): ActiveContext => ({
    sessionId: "test", membershipId, schoolId, role,
    user: { id: userId, name: "T", preferredName: null, email: null, avatarKey: null, isMinor: false, isSuperuser: false, isAppAdmin: false,
      prefs: { theme: "system", contrast: "normal", font: "default", motion: "full", locale: "en", channels: { push: false, email: false }, quietHours: null } },
  });

  beforeAll(async () => {
    const school = await db.school.findFirstOrThrow({ where: { name: "Riverside Primary School" } });
    schoolId = school.id;
    const priya = await db.user.findUniqueOrThrow({ where: { email: "priya@riverside.school" } });
    const tom = await db.user.findUniqueOrThrow({ where: { email: "tom@riverside.school" } });
    admin = ctx(priya.id, (await db.membership.findFirstOrThrow({ where: { userId: priya.id, schoolId, role: "ADMIN" } })).id, "ADMIN");
    teacher = ctx(tom.id, (await db.membership.findFirstOrThrow({ where: { userId: tom.id, schoolId, role: "TEACHER" } })).id, "TEACHER");
  });

  afterAll(async () => {
    await db.school.update({ where: { id: schoolId }, data: { notifAutoReadDays: null, notifExpireDays: null } });
  });

  it("⚠ the setter validates, the teacher is refused, and null clears to defaults", async () => {
    await expect(setNotifThresholds(teacher, { autoReadDays: 30, expireDays: null })).rejects.toBeInstanceOf(AccessError);
    expect(await setNotifThresholds(admin, { autoReadDays: 3, expireDays: null })).toMatchObject({ ok: false, errorKey: "notif.autoReadOutOfRange" });
    expect(await setNotifThresholds(admin, { autoReadDays: 30.5, expireDays: null })).toMatchObject({ ok: false, errorKey: "notif.thresholdNotWhole" });
    expect(await setNotifThresholds(admin, { autoReadDays: 200, expireDays: 90 })).toMatchObject({ ok: false, errorKey: "notif.expireBeforeAutoRead" });
    expect(await setNotifThresholds(admin, { autoReadDays: 30, expireDays: 60 })).toEqual({ ok: true });
    expect(effectiveThresholds(await db.school.findUnique({ where: { id: schoolId }, select: { notifAutoReadDays: true, notifExpireDays: true } }))).toEqual({ autoReadDays: 30, expireDays: 60 });
    expect(await setNotifThresholds(admin, { autoReadDays: null, expireDays: null })).toEqual({ ok: true });
    expect(effectiveThresholds(await db.school.findUnique({ where: { id: schoolId }, select: { notifAutoReadDays: true, notifExpireDays: true } }))).toEqual({ autoReadDays: AUTO_READ_AFTER_DAYS, expireDays: EXPIRE_READ_AFTER_DAYS });
  });

  it("⚠ the tidy applies the school's own numbers to its notices and the defaults to the rest", async () => {
    const now = new Date("2026-08-24T10:00:00Z");
    await db.school.update({ where: { id: schoolId }, data: { notifAutoReadDays: 30, notifExpireDays: 60 } });
    const mk = (title: string, daysAgo: number, school: boolean, read: boolean) =>
      db.notification.create({ data: { userId, schoolId: school ? schoolId : null, kind: "SYSTEM", title, createdAt: at(daysAgo, now), readAt: read ? at(daysAgo, now) : null } });
    await db.notification.deleteMany({ where: { userId } });
    await mk("school stale 40d", 40, true, false);   // 40 > 30 → auto-read under the school's number
    await mk("school fresh 20d", 20, true, false);   // stays unread
    await mk("school old read 70d", 70, true, true); // 70 > 60 → expired
    await mk("platform 40d", 40, false, false);      // default 90 → untouched
    await mk("platform read 100d", 100, false, true); // default 365 → untouched

    const result = await tidyNotificationsFor(userId, now);
    expect(result).toEqual({ autoRead: 1, expired: 1 });
    const rows = await db.notification.findMany({ where: { userId }, orderBy: { title: "asc" } });
    const byTitle = Object.fromEntries(rows.map((r) => [r.title, r.readAt]));
    expect(Object.keys(byTitle).sort()).toEqual(["platform 40d", "platform read 100d", "school fresh 20d", "school stale 40d"]);
    expect(byTitle["school stale 40d"]).not.toBeNull();
    expect(byTitle["school fresh 20d"]).toBeNull();
    expect(byTitle["platform 40d"]).toBeNull();
    await db.school.update({ where: { id: schoolId }, data: { notifAutoReadDays: null, notifExpireDays: null } });
  });

  it("the whole-platform tidy tells its work per school — and platform strays count in the totals only", async () => {
    const now = new Date("2026-08-24T10:00:00Z");
    await db.school.update({ where: { id: schoolId }, data: { notifAutoReadDays: 30, notifExpireDays: 60 } });
    const mk = (title: string, daysAgo: number, school: boolean, read: boolean) =>
      db.notification.create({ data: { userId, schoolId: school ? schoolId : null, kind: "SYSTEM", title, createdAt: at(daysAgo, now), readAt: read ? at(daysAgo, now) : null } });
    await db.notification.deleteMany({ where: { userId } });
    await mk("school stale 40d", 40, true, false);      // the school's 30 → auto-read
    await mk("school old read 70d", 70, true, true);    // the school's 60 → expired
    await mk("platform old read 400d", 400, false, true); // default 365 → expired, but belongs to no school

    // Fenced to this file's fixture user — the digest's onlyParentUserIds precedent.
    const result = await tidyAllNotifications(now, { onlyUserIds: [userId] });
    expect(result.autoRead).toBe(1);
    expect(result.expired).toBe(2);
    expect(result.perSchool).toEqual({ [schoolId]: { autoRead: 1, expired: 1 } });

    await db.school.update({ where: { id: schoolId }, data: { notifAutoReadDays: null, notifExpireDays: null } });
  });
});
