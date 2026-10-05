/**
 * Campaign B-15's leftover (5 Oct 2026): the dates inside the leave, cover and absence notices were formatted in
 * English before the sentence was translated, so a Marathi guardian read "Wednesday, 9 September" inside a Marathi
 * sentence, and kept reading it after switching language. A date variable is now kept as a date (`noticeDate`) and
 * said in the reader's language by `notify` and again by the notifications list.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { localiseVars, noticeDate } from "@/lib/notice-dates";
import { notify } from "@/lib/notify";
import { formatDateKey } from "@/lib/dates";

const db = new PrismaClient();
const STAMP = Date.now();
let marathiUser = "";

beforeAll(async () => {
  marathiUser = (await db.user.create({ data: { name: "ZZ Notice Dates", email: `zz-noticedates-${STAMP}@test.invalid`, prefs: JSON.stringify({ locale: "mr" }) }, select: { id: true } })).id;
});

afterAll(async () => {
  await db.notification.deleteMany({ where: { userId: marathiUser } });
  await db.user.deleteMany({ where: { id: marathiUser } });
  await db.$disconnect();
});

describe("a date kept as a date", () => {
  it("is marked, and said in each language", () => {
    expect(noticeDate("2026-09-09", "long")).toBe("@date:long:2026-09-09");
    expect(noticeDate("not a date")).toBe("not a date");
    const vars = { date: noticeDate("2026-09-09", "long"), name: "Asha", n: 3 };
    expect(localiseVars(vars, "en").date).toBe(formatDateKey("2026-09-09", { weekday: "long", day: "numeric", month: "long" }, "en"));
    expect(localiseVars(vars, "mr").date).toContain("बुधवार");
    expect(localiseVars(vars, "hi").date).toContain("बुधवार");
    // Everything else untouched, and the input not changed.
    expect(localiseVars(vars, "mr").name).toBe("Asha");
    expect(vars.date).toBe("@date:long:2026-09-09");
    // An older row's already-formatted date is left as it is.
    expect(localiseVars({ date: "Wednesday, 9 September" }, "mr").date).toBe("Wednesday, 9 September");
  });

  it("notify says it in the recipient's language and keeps the date on the row", async () => {
    await notify({ userId: marathiUser, kind: "ATTENDANCE", titleKey: "notifTitle.markedAbsent", titleVars: { name: "Asha" }, bodyKey: "notifBody.attendanceTap", bodyVars: { date: noticeDate("2026-09-09", "long") } });
    const row = await db.notification.findFirstOrThrow({ where: { userId: marathiUser }, select: { body: true, bodyVars: true } });
    expect(row.body).toContain("बुधवार");
    expect(row.body).not.toContain("Wednesday");
    expect(JSON.parse(row.bodyVars)).toEqual({ date: "@date:long:2026-09-09" });
  });
});
