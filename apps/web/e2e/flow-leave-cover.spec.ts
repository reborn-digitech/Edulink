import { createHash, randomBytes } from "node:crypto";
import { test, expect } from "@playwright/test";
import { addDaysToKey, isTeachingDay, parseTeachingDays, todayKey, weekdayOfKey } from "../src/lib/dates";
import type { Actor } from "./global-setup";
import { all, db, membershipOf, northgate, openAs, sound, STAMP } from "./flow-helpers";

/**
 * Leave and cover, end to end. The e2e teacher applies for the next open
 * school day on which they have lessons, naming the second ZZ teacher; the
 * head approves it with that cover, which writes the register covers
 * (AttendanceCover rows under the leave's id); the head then works the
 * substitution board for that day, where the applicant's lessons stand as
 * "on leave", and names the same teacher for one lesson — the Substitution
 * row. The covering teacher, signed in with a session minted here, finds
 * the cover on the register for that day and in the covers feed the
 * phone's Today reads. The leave, its covers, the substitution and the
 * minted session go in the afterAll.
 */
const teacher = all.TEACHER!;
const principal = all.PRINCIPAL!;
const REASON = `ZZ e2e leave ${STAMP}: a family wedding`;
let schoolId: string;
let day: string;
let applicant: { id: string; name: string };
let cover: { id: string; userId: string; name: string; cookie: string };

/** The hashes of the sessions this file minted: its afterAll deletes exactly these (TA-465). */
const minted: string[] = [];

async function mint(userId: string, role: string, activeSchoolId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  minted.push(tokenHash);
  await db.session.create({ data: { userId, tokenHash, activeSchoolId, activeRole: role, userAgent: "e2e", expiresAt: new Date(Date.now() + 3_600_000) } });
  return `edulink_session=${token}`;
}

test.beforeAll(async () => {
  const school = await northgate();
  schoolId = school.id;
  const me = await membershipOf(teacher, schoolId, "TEACHER");
  applicant = { id: me.id, name: me.user.preferredName ?? me.user.name };
  // The next open school day on which the applicant teaches and is not already away.
  const days = parseTeachingDays(school.teachingDays);
  const today = todayKey(school.timezone);
  const taught = await db.timetableSlot.findMany({ where: { schoolId, teacherMembershipId: me.id, class: { archivedAt: null } }, select: { weekday: true, periodId: true } });
  for (let n = 1; n <= 21 && !day; n++) {
    const key = addDaysToKey(today, n);
    if (!isTeachingDay(key, days) || !taught.some((s) => s.weekday === weekdayOfKey(key))) continue;
    const closed = await db.holiday.count({ where: { schoolId, kind: "HOLIDAY", startDateKey: { lte: key }, endDateKey: { gte: key } } });
    const away = await db.leaveRequest.count({ where: { schoolId, teacherMembershipId: me.id, status: { in: ["PENDING", "APPROVED"] }, fromDateKey: { lte: key }, toDateKey: { gte: key } } });
    const covered = await db.substitution.count({ where: { schoolId, dateKey: key, absentMembershipId: me.id } });
    if (closed === 0 && away === 0 && covered === 0) day = key;
  }
  if (!day) throw new Error("no open school day with the e2e teacher's lessons in the next three weeks");

  // The second ZZ teacher: the first of the fixture's other class teachers (then its subject and spare
  // teachers) who is free for at least one of the applicant's periods that day — the board refuses a
  // clash, and the fixture's four class teachers teach every period of each other's days.
  const weekday = weekdayOfKey(day);
  const periods = new Set(taught.filter((s) => s.weekday === weekday).map((s) => s.periodId));
  const others = await db.membership.findMany({
    where: { schoolId, role: "TEACHER", status: "ACTIVE", leftAt: null, id: { not: me.id }, user: { email: { endsWith: "@zz.test" } }, substitutionsCovering: { none: { dateKey: day } } },
    orderBy: { user: { email: "asc" } },
    select: { id: true, userId: true, user: { select: { email: true, name: true, preferredName: true } }, timetableSlots: { where: { weekday, class: { archivedAt: null } }, select: { periodId: true } } },
  });
  const rank = (email: string) => (/^zz\.teacher\d/.test(email) ? 0 : /^zz\.subject/.test(email) ? 1 : 2);
  const other = others.sort((a, b) => rank(a.user.email ?? "") - rank(b.user.email ?? "") || (a.user.email ?? "").localeCompare(b.user.email ?? "")).find((c) => [...periods].some((p) => !c.timetableSlots.some((s) => s.periodId === p)));
  if (!other) throw new Error(`no ZZ teacher is free for any of the applicant's periods on ${day}`);
  cover = { id: other.id, userId: other.userId, name: other.user.preferredName ?? other.user.name, cookie: await mint(other.userId, "TEACHER", schoolId) };
});

test.afterAll(async () => {
  const leave = await db.leaveRequest.findMany({ where: { schoolId, teacherMembershipId: applicant?.id, reason: REASON }, select: { id: true } });
  await db.attendanceCover.deleteMany({ where: { schoolId, leaveRequestId: { in: leave.map((l) => l.id) } } });
  await db.leaveRequest.deleteMany({ where: { schoolId, id: { in: leave.map((l) => l.id) } } });
  if (day && applicant) await db.substitution.deleteMany({ where: { schoolId, dateKey: day, absentMembershipId: applicant.id } });
  await db.notification.deleteMany({ where: { schoolId, OR: [{ body: { contains: REASON } }, { meta: { contains: day ?? "never" }, kind: "SYSTEM", title: { contains: "cover" } }] } }).catch(() => undefined);
  // Only the session minted here, by its token hash (TA-465): a delete by user agent or by the cover's user would
  // sign out every other spec's actor, and another run's, who is the same person.
  if (minted.length) await db.session.deleteMany({ where: { tokenHash: { in: minted } } });
  await db.$disconnect();
});

const display = (key: string) => key.split("-").reverse().join("/");

test("a teacher applies for a day, the head approves it naming a cover, the board names the same teacher for a lesson, and the cover sees it", async ({ browser, baseURL }) => {
  // The applicant.
  const mine = await openAs(browser, teacher, baseURL!);
  expect((await mine.goto("/teacher/leave", { waitUntil: "networkidle" }))?.status()).toBe(200);
  if (await mine.getByTestId("leave-open").isVisible()) await mine.getByTestId("leave-open").click();
  await expect(mine.getByTestId("leave-form")).toBeVisible();
  await mine.getByTestId("leave-from").fill(display(day));
  await mine.getByTestId("leave-to").fill(display(day));
  await mine.getByRole("radio", { name: "Casual" }).click();
  await mine.getByTestId("leave-reason").fill(REASON);
  await mine.getByTestId("leave-nominee").selectOption({ label: cover.name });
  await mine.getByTestId("leave-send").click();
  const filed = mine.getByTestId("leave-request").filter({ hasText: REASON });
  await expect(filed).toHaveAttribute("data-status", "PENDING");
  await sound(mine, "TEACHER the leave page after applying");
  const leaveId = (await filed.getAttribute("data-leave-id"))!;
  expect(await db.leaveRequest.findUniqueOrThrow({ where: { id: leaveId }, select: { schoolId: true, status: true, fromDateKey: true, toDateKey: true, kind: true, nominatedCoverMembershipId: true } })).toEqual({ schoolId, status: "PENDING", fromDateKey: day, toDateKey: day, kind: "CASUAL", nominatedCoverMembershipId: cover.id });

  // The head: the suggestion is already in the picker; approve with it.
  const head = await openAs(browser, principal, baseURL!);
  expect((await head.goto("/principal/leave", { waitUntil: "networkidle" }))?.status()).toBe(200);
  const card = head.locator(`[data-testid="leave-decide"][data-leave-id="${leaveId}"]`);
  await expect(card).toContainText(REASON);
  await expect(card.getByTestId("leave-cover")).toHaveValue(cover.id);
  await card.getByTestId("leave-approve").click();
  await expect(head.getByRole("status").filter({ hasText: "Leave approved" })).toBeVisible();
  await expect(card).toHaveCount(0);
  await sound(head, "PRINCIPAL the leave queue after the approval");
  expect((await db.leaveRequest.findUniqueOrThrow({ where: { id: leaveId }, select: { status: true } })).status).toBe("APPROVED");
  const covers = await db.attendanceCover.findMany({ where: { schoolId, leaveRequestId: leaveId }, select: { classId: true, coveringMembershipId: true, fromDateKey: true, toDateKey: true } });
  expect(covers.length).toBeGreaterThan(0);
  for (const c of covers) expect(c).toMatchObject({ coveringMembershipId: cover.id, fromDateKey: day, toDateKey: day });
  await expect(mine.reload({ waitUntil: "networkidle" }).then(() => filed)).resolves.toBeTruthy();
  await expect(filed).toHaveAttribute("data-status", "APPROVED");

  // The board for that day: the applicant's lessons, and the same teacher named for the first one they are free for.
  expect((await head.goto(`/admin/substitutions?date=${day}`, { waitUntil: "networkidle" }))?.status()).toBe(200);
  const rows = head.getByTestId("substitution-row").filter({ hasText: applicant.name });
  expect(await rows.count()).toBeGreaterThan(0);
  let slotId: string | null = null;
  for (let i = 0; i < (await rows.count()) && !slotId; i++) {
    const row = rows.nth(i);
    const free = row.getByTestId("substitution-choose").locator(`option[value="${cover.id}"][data-free="1"]`);
    if ((await free.count()) === 0) continue;
    await row.getByTestId("substitution-choose").selectOption(cover.id);
    await row.getByTestId("substitution-assign").click();
    await expect(row).toContainText(cover.name);
    await expect(row).toContainText("Not answered yet");
    slotId = await row.getAttribute("data-slot-id");
  }
  expect(slotId, `${cover.name} is free for none of ${applicant.name}'s lessons on ${day}`).toBeTruthy();
  await sound(head, "PRINCIPAL the board after the assignment");
  const substitution = await db.substitution.findUniqueOrThrow({ where: { slotId_dateKey: { slotId: slotId!, dateKey: day } }, select: { schoolId: true, absentMembershipId: true, substituteMembershipId: true, acknowledgedAt: true, declinedAt: true } });
  expect(substitution).toEqual({ schoolId, absentMembershipId: applicant.id, substituteMembershipId: cover.id, acknowledgedAt: null, declinedAt: null });

  // The covering teacher: the register they may now take on that day says so, and the covers feed names the lesson.
  const theirs = await openAs(browser, { role: "TEACHER", cookie: cover.cookie } as Actor, baseURL!);
  const classId = covers[0]!.classId;
  expect((await theirs.goto(`/teacher/attendance?classId=${classId}&date=${day}`, { waitUntil: "networkidle" }))?.status()).toBe(200);
  await expect(theirs.getByText("You are covering this attendance until")).toBeVisible();
  await sound(theirs, "TEACHER (cover) the register on the leave day");
  const feed = await theirs.request.get(`/api/v1/staff/substitutions/me?date=${day}`);
  expect(feed.status()).toBe(200);
  const body = (await feed.json()) as { dateKey: string; items: { slotId: string; absentName: string; acknowledgedAt: string | null }[] };
  expect(body.dateKey).toBe(day);
  expect(body.items.find((i) => i.slotId === slotId)).toMatchObject({ absentName: applicant.name, acknowledgedAt: null });
  for (const page of [mine, head, theirs]) await page.context().close();
});
