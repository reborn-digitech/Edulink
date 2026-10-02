import { createHash, randomBytes } from "node:crypto";
import { test, expect, type Page } from "@playwright/test";
import { todayKey } from "../src/lib/dates";
import { contextFor } from "./actors";
import { all, classForTeacher, db, northgate, PHONE, removeClass, STAMP } from "./flow-helpers";

/**
 * One live update, through the browser. A ZZ class of the e2e teacher's
 * grade is made with three of the fixture's pupils in it and a second ZZ
 * teacher added as a co-teacher who may take its register; the two of them
 * open the same register in two contexts whose event stream is ALLOWED
 * (every other spec's context refuses GET /api/v1/events — see actors.ts).
 * The first marks a pupil present; the second's page hears
 * `attendance.updated` on the class channel, re-reads the roster, shows
 * "Updated by a colleague." and the mark, all within ten seconds and with
 * no reload. The first's own page hears the same event with its own
 * clientId on it and leaves its roster alone.
 *
 * A live page is never awaited with "networkidle": the stream is traffic
 * that does not end. `waitUntil: "load"` throughout.
 *
 * What this cannot prove: the hidden-tab rule (a hidden tab closes its
 * stream and a shown one reopens it and re-reads). Playwright's page has no
 * way to be hidden — document.visibilityState is "visible" for every page
 * in every context, headless or not, and emulating it would test the
 * emulation. That rule is covered by the hook's unit test on a fake
 * EventSource (src/lib/use-events.test.ts) and was checked by hand in two
 * tabs.
 */
const teacher = all.TEACHER!;
let schoolId: string;
let classId: string;
let today: string;
let pupils: { membershipId: string; name: string }[];
let colleague: { membershipId: string; userId: string; cookie: string };

async function mint(userId: string, role: string, activeSchoolId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db.session.create({ data: { userId, tokenHash: createHash("sha256").update(token).digest("hex"), activeSchoolId, activeRole: role, userAgent: "e2e", expiresAt: new Date(Date.now() + 3_600_000) } });
  return `edulink_session=${token}`;
}

test.beforeAll(async () => {
  const school = await northgate();
  schoolId = school.id;
  today = todayKey(school.timezone);
  const klass = await classForTeacher(schoolId, teacher, `ZZ e2e live register ${STAMP}`);
  classId = klass.id;
  pupils = klass.pupils;
  // The second ZZ teacher, as a co-teacher of the class with the right to take its register — the
  // server subscribes a teacher's stream to the classes they teach, so the row must exist before the page opens.
  const other = await db.membership.findFirstOrThrow({
    where: { schoolId, role: "TEACHER", status: "ACTIVE", leftAt: null, id: { not: klass.teacherMembershipId }, user: { email: { startsWith: "zz.teacher" } } },
    orderBy: { user: { email: "asc" } },
    select: { id: true, userId: true },
  });
  await db.classTeacher.create({ data: { schoolId, classId, teacherMembershipId: other.id, role: "CO", canTakeAttendance: true } });
  colleague = { membershipId: other.id, userId: other.userId, cookie: await mint(other.userId, "TEACHER", schoolId) };
});

test.afterAll(async () => {
  if (classId) await removeClass(schoolId, classId);
  // Only the colleague's own minted session: a delete by user agent alone would sign out every other spec's actor.
  if (colleague?.userId) await db.session.deleteMany({ where: { userAgent: "e2e", userId: colleague.userId } });
  await db.$disconnect();
});

const row = (page: Page, membershipId: string) => page.locator(`[data-testid="register-row"][data-membership-id="${membershipId}"]`);

test("a teacher marks a pupil present and a colleague's open register shows the mark and says so, with no reload", async ({ browser, baseURL }) => {
  const first = await (await contextFor(browser, teacher.cookie, { viewport: PHONE, theme: "light", locale: "en", live: true }, baseURL!)).newPage();
  const second = await (await contextFor(browser, colleague.cookie, { viewport: PHONE, theme: "light", locale: "en", live: true }, baseURL!)).newPage();
  const url = `/teacher/attendance?classId=${classId}`;
  // Both streams open before anything is marked: the ready frame is the first thing the server writes.
  const streams = [first, second].map((page) => page.waitForResponse((r) => r.url().endsWith("/api/v1/events") && r.status() === 200));
  expect((await first.goto(url, { waitUntil: "load" }))?.status()).toBe(200);
  expect((await second.goto(url, { waitUntil: "load" }))?.status()).toBe(200);
  await expect(first.getByTestId("register-row")).toHaveCount(3);
  await expect(second.getByTestId("register-row")).toHaveCount(3);
  await Promise.all(streams);
  const pupil = pupils[0]!.membershipId;
  await expect(row(second, pupil)).toHaveAttribute("data-status", "");
  expect(await second.getByTestId("live-notice").count()).toBe(0);
  // A flag on the document: still there afterwards means the page was never reloaded.
  await second.evaluate(() => {
    (window as unknown as { __zzLive?: boolean }).__zzLive = true;
  });

  // The first marks; the second hears.
  const posted = first.waitForResponse((r) => r.url().endsWith("/api/attendance") && r.request().method() === "POST");
  await row(first, pupil).getByTestId("register-mark-PRESENT").click();
  expect((await posted).status()).toBe(200);
  await expect(second.getByTestId("live-notice")).toHaveText("Updated by a colleague.", { timeout: 10_000 });
  await expect(row(second, pupil)).toHaveAttribute("data-status", "PRESENT", { timeout: 10_000 });
  // No reload happened: the same document is still up.
  expect(await second.evaluate(() => (window as unknown as { __zzLive?: boolean }).__zzLive)).toBe(true);

  // The first's own page heard its own event (its clientId) and said nothing.
  await expect(row(first, pupil)).toHaveAttribute("data-status", "PRESENT");
  expect(await first.getByTestId("live-notice").count()).toBe(0);

  // And it is in the database, under this school.
  const session = await db.attendanceSession.findUniqueOrThrow({ where: { classId_dateKey: { classId, dateKey: today } }, select: { schoolId: true, records: { select: { studentMembershipId: true, status: true } } } });
  expect(session.schoolId).toBe(schoolId);
  expect(session.records).toEqual([{ studentMembershipId: pupil, status: "PRESENT" }]);

  // The other way round, too: the colleague marks, the first hears.
  const back = second.waitForResponse((r) => r.url().endsWith("/api/attendance") && r.request().method() === "POST");
  await row(second, pupils[1]!.membershipId).getByTestId("register-mark-ABSENT").click();
  expect((await back).status()).toBe(200);
  await expect(first.getByTestId("live-notice")).toHaveText("Updated by a colleague.", { timeout: 10_000 });
  await expect(row(first, pupils[1]!.membershipId)).toHaveAttribute("data-status", "ABSENT", { timeout: 10_000 });

  for (const page of [first, second]) await page.context().close();
});
