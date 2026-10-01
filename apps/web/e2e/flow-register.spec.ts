import { test, expect, type Page } from "@playwright/test";
import { todayKey } from "../src/lib/dates";
import { all, classForTeacher, db, northgate, openAs, removeClass, sound, STAMP } from "./flow-helpers";

/**
 * The teacher's register, written through the page. A ZZ class of the e2e
 * teacher's grade is made with three of the fixture's pupils in it; two are
 * marked absent and one late, the debounced save is awaited, and the marks
 * are read back after a reload and from the database. Then one is marked
 * present again: the same three rows, one of them changed — the register
 * is idempotent per pupil per day.
 */
const teacher = all.TEACHER!;
let schoolId: string;
let classId: string;
let today: string;
let pupils: { membershipId: string; name: string }[];

test.beforeAll(async () => {
  const school = await northgate();
  schoolId = school.id;
  today = todayKey(school.timezone);
  const klass = await classForTeacher(schoolId, teacher, `ZZ e2e register ${STAMP}`);
  classId = klass.id;
  pupils = klass.pupils;
});

test.afterAll(async () => {
  if (classId) await removeClass(schoolId, classId);
  await db.$disconnect();
});

const row = (page: Page, membershipId: string) => page.locator(`[data-testid="register-row"][data-membership-id="${membershipId}"]`);

/** The register posts once, 700 ms after the last tap; the tap and the answer are awaited together. */
async function mark(page: Page, membershipId: string, status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED") {
  const posted = page.waitForResponse((r) => r.url().endsWith("/api/attendance") && r.request().method() === "POST");
  await row(page, membershipId).getByTestId(`register-mark-${status}`).click();
  return posted;
}

test("the teacher marks two absent and one late, the marks are kept, and one marked present again is one row changed", async ({ browser, baseURL }) => {
  const page = await openAs(browser, teacher, baseURL!);
  expect((await page.goto(`/teacher/attendance?classId=${classId}`, { waitUntil: "networkidle" }))?.status()).toBe(200);
  await expect(page.getByTestId("register-row")).toHaveCount(3);
  for (const p of pupils) await expect(row(page, p.membershipId)).toHaveAttribute("data-status", "");

  // Two absent, one late: three taps, one request.
  const posted = page.waitForResponse((r) => r.url().endsWith("/api/attendance") && r.request().method() === "POST");
  await row(page, pupils[0]!.membershipId).getByTestId("register-mark-ABSENT").click();
  await row(page, pupils[1]!.membershipId).getByTestId("register-mark-ABSENT").click();
  await row(page, pupils[2]!.membershipId).getByTestId("register-mark-LATE").click();
  const response = await posted;
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ applied: 3, rejected: [] });
  await expect(page.getByTestId("register-sync")).toHaveAttribute("data-state", "saved");
  await expect(page.getByTestId("register-sync")).toContainText("Attendance complete");
  await sound(page, "TEACHER the register after the marks");

  // Kept across a reload, and in the rows themselves.
  await page.reload({ waitUntil: "networkidle" });
  await expect(row(page, pupils[0]!.membershipId)).toHaveAttribute("data-status", "ABSENT");
  await expect(row(page, pupils[1]!.membershipId)).toHaveAttribute("data-status", "ABSENT");
  await expect(row(page, pupils[2]!.membershipId)).toHaveAttribute("data-status", "LATE");
  const session = await db.attendanceSession.findUniqueOrThrow({ where: { classId_dateKey: { classId, dateKey: today } }, select: { id: true, schoolId: true, records: { select: { studentMembershipId: true, status: true } } } });
  expect(session.schoolId).toBe(schoolId);
  expect(session.records.map((r) => [r.studentMembershipId, r.status]).sort()).toEqual(
    [
      [pupils[0]!.membershipId, "ABSENT"],
      [pupils[1]!.membershipId, "ABSENT"],
      [pupils[2]!.membershipId, "LATE"],
    ].sort(),
  );

  // One marked present after all: the same session, the same three rows, one of them changed.
  const again = await mark(page, pupils[0]!.membershipId, "PRESENT");
  expect(again.status()).toBe(200);
  expect(await again.json()).toMatchObject({ applied: 1, rejected: [] });
  await page.reload({ waitUntil: "networkidle" });
  await expect(row(page, pupils[0]!.membershipId)).toHaveAttribute("data-status", "PRESENT");
  await expect(row(page, pupils[1]!.membershipId)).toHaveAttribute("data-status", "ABSENT");
  const after = await db.attendanceRecord.findMany({ where: { sessionId: session.id }, select: { studentMembershipId: true, status: true } });
  expect(after).toHaveLength(3);
  expect(after.find((r) => r.studentMembershipId === pupils[0]!.membershipId)?.status).toBe("PRESENT");
  expect(await db.attendanceSession.count({ where: { classId, dateKey: today } })).toBe(1);
  await page.context().close();
});
