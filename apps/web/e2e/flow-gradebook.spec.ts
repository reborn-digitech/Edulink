import { test, expect, type Page } from "@playwright/test";
import { todayKey } from "../src/lib/dates";
import { all, classForTeacher, db, northgate, openAs, removeClass, sound, STAMP } from "./flow-helpers";

/**
 * The marks sheet, written through the page. A ZZ class of the e2e
 * teacher's grade and a ZZ unit test of that grade with one paper out of
 * 50 are made; the teacher types two pupils' marks, saves, reloads and
 * finds them kept (and the Grade rows under the paper's sitting). A mark
 * over the maximum never leaves the page: the box's own `max` refuses the
 * submit, and the sitting still holds the first marks.
 */
const teacher = all.TEACHER!;
let schoolId: string;
let classId: string;
let slotId: string;
let seriesId: string;
let pupils: { membershipId: string; name: string }[];

test.beforeAll(async () => {
  const school = await northgate();
  schoolId = school.id;
  const klass = await classForTeacher(schoolId, teacher, `ZZ e2e gradebook ${STAMP}`);
  classId = klass.id;
  pupils = klass.pupils;
  const series = await db.examSeries.create({
    data: { schoolId, name: `ZZ e2e unit test ${STAMP}`, gradeLevel: klass.gradeLevel, kind: "UNIT_TEST", slots: { create: { schoolId, subject: "Mathematics", dateKey: todayKey(school.timezone), pointsMilli: 50_000 } } },
    select: { id: true, slots: { select: { id: true } } },
  });
  seriesId = series.id;
  slotId = series.slots[0]!.id;
});

test.afterAll(async () => {
  if (classId) await removeClass(schoolId, classId);
  if (seriesId) await db.examSeries.deleteMany({ where: { schoolId, id: seriesId } });
  await db.$disconnect();
});

const box = (page: Page, membershipId: string) => page.locator(`#marks-${membershipId}`);
const sheet = () => `/teacher/exams?slotId=${slotId}&classId=${classId}`;

test("the teacher enters two pupils' marks, they are kept, and a mark over the maximum is refused in the page", async ({ browser, baseURL }) => {
  const page = await openAs(browser, teacher, baseURL!);
  expect((await page.goto(sheet(), { waitUntil: "networkidle" }))?.status()).toBe(200);
  await expect(page.getByTestId("marks-save")).toBeVisible();
  for (const p of pupils) await expect(box(page, p.membershipId)).toHaveValue("");

  await box(page, pupils[0]!.membershipId).fill("42");
  await box(page, pupils[1]!.membershipId).fill("37.5");
  await page.getByTestId("marks-save").click();
  await page.waitForURL((url) => url.searchParams.get("saved") === "1", { waitUntil: "networkidle" });
  // The sheet is rendered again on the server after the save and streams in behind the section's skeleton. On the
  // shared runner the skeleton stayed for the whole twenty seconds on both attempts of runs 41415675038 and
  // 41454850718 (2 November 2026), with the action's 303 and the route's 200 both answered within a second and
  // nothing in the server's log, while the same flow passes on this machine against a production build; the
  // failure message therefore carries what a fresh document of the same address holds, so the next such run says
  // whether the server or the soft navigation is at fault.
  const banner = page.getByTestId("marks-saved");
  if (!(await banner.isVisible({ timeout: 20_000 }).catch(() => false))) {
    const fresh = await page.request.get(page.url());
    const html = await fresh.text();
    const words = (await page.evaluate(() => document.body.innerText.replace(/\s+/g, " ").slice(0, 300))) || "(no words)";
    throw new Error(`the saved banner did not appear in 20 s on ${page.url()}; a fresh document answers ${fresh.status()} and ${html.includes("marks-saved") ? "holds" : "lacks"} the banner (${html.length} bytes); the page shows: ${words}`);
  }
  await expect(page.getByTestId("marks-error")).toHaveCount(0);
  await sound(page, "TEACHER the marks sheet after the save");

  await page.reload({ waitUntil: "networkidle" });
  await expect(box(page, pupils[0]!.membershipId)).toHaveValue("42");
  await expect(box(page, pupils[1]!.membershipId)).toHaveValue("37.5");
  await expect(box(page, pupils[2]!.membershipId)).toHaveValue("");
  const sitting = await db.assignment.findUniqueOrThrow({ where: { examSlotId_classId: { examSlotId: slotId, classId } }, select: { schoolId: true, category: true, pointsMilli: true, grades: { select: { studentMembershipId: true, scoreMilli: true } } } });
  expect(sitting).toMatchObject({ schoolId, category: "Exam", pointsMilli: 50_000 });
  expect(sitting.grades.map((g) => [g.studentMembershipId, g.scoreMilli]).sort()).toEqual(
    [
      [pupils[0]!.membershipId, 42_000],
      [pupils[1]!.membershipId, 37_500],
    ].sort(),
  );

  // 60 out of 50: the box is out of range, the form does not submit, and nothing changes.
  await page.goto(sheet(), { waitUntil: "networkidle" });
  const first = box(page, pupils[0]!.membershipId);
  await expect(first).toHaveAttribute("max", "50");
  await first.fill("60");
  expect(await first.evaluate((el: HTMLInputElement) => el.validity.rangeOverflow)).toBe(true);
  await page.getByTestId("marks-save").click();
  await page.waitForTimeout(1_000);
  expect(new URL(page.url()).searchParams.get("saved")).toBeNull();
  await expect(page.getByTestId("marks-saved")).toHaveCount(0);
  expect(await first.evaluate((el: HTMLInputElement) => el.form!.checkValidity())).toBe(false);
  const kept = await db.grade.findFirstOrThrow({ where: { schoolId, studentMembershipId: pupils[0]!.membershipId, assignment: { examSlotId: slotId, classId } }, select: { scoreMilli: true } });
  expect(kept.scoreMilli).toBe(42_000);
  await page.context().close();
});
