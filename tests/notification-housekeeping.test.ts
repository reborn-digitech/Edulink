import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { tidyNotificationsFor, AUTO_READ_AFTER_DAYS, EXPIRE_READ_AFTER_DAYS } from "@/lib/notification-housekeeping";

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
