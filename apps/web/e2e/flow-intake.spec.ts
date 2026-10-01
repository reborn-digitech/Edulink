import { test, expect } from "@playwright/test";
import { overflow, seriousViolations, smallTargets } from "./checks";
import { all, db, northgate, openAs, sound, STAMP } from "./flow-helpers";

/**
 * The admission list, pasted. Three ZZ rows with a date of birth, the e2e
 * teacher's own class and an @zz.test address each; the preview counts
 * three before anything is written, the admit writes them, the result
 * table names the three, and the people list finds them by the stamp in
 * their names. The three users go in the afterAll, and their memberships,
 * enrolments and stand-in guardianships go with them.
 */
const admin = all.ADMIN!;
const TAG = `ZZ e2e intake ${STAMP}`;
const emails = [1, 2, 3].map((n) => `zz.e2e.intake.${STAMP}.${n}@zz.test`);
let schoolId: string;
let className: string;

test.beforeAll(async () => {
  const school = await northgate();
  schoolId = school.id;
  className = (await db.class.findUniqueOrThrow({ where: { id: all.TEACHER!.classId! }, select: { name: true } })).name;
});

test.afterAll(async () => {
  const users = await db.user.findMany({ where: { email: { in: emails } }, select: { id: true } });
  await db.membership.deleteMany({ where: { schoolId, userId: { in: users.map((u) => u.id) } } });
  await db.user.deleteMany({ where: { id: { in: users.map((u) => u.id) }, email: { endsWith: "@zz.test" } } });
  await db.$disconnect();
});

test("the office pastes three rows, previews three, admits them, and the people list shows the three", async ({ browser, baseURL }) => {
  const page = await openAs(browser, admin, baseURL!);
  expect((await page.goto("/admin/intake", { waitUntil: "networkidle" }))?.status()).toBe(200);
  await expect(page.getByTestId("intake-admit")).toBeDisabled();

  const sheet = [
    "name,date of birth,class,pupil email",
    `${TAG} Asha,14/06/2011,${className},${emails[0]}`,
    `${TAG} Bhavin,02/11/2011,${className},${emails[1]}`,
    `${TAG} Chitra,23/01/2012,${className},${emails[2]}`,
  ].join("\n");
  await page.getByTestId("intake-list").fill(sheet);
  await expect(page.getByTestId("intake-preview")).toContainText("3 ready to admit");
  await expect(page.getByTestId("intake-admit")).toBeEnabled();
  await expect(page.getByTestId("intake-admit")).toHaveText("Admit 3 pupils");
  expect(await db.user.count({ where: { email: { in: emails } } })).toBe(0);

  await page.getByTestId("intake-admit").click();
  const admitted = page.getByTestId("intake-admitted");
  await expect(admitted).toBeVisible();
  await expect(admitted.locator("tbody tr")).toHaveCount(3);
  for (const who of ["Asha", "Bhavin", "Chitra"]) await expect(admitted).toContainText(`${TAG} ${who}`);
  await expect(page.getByRole("heading", { name: "3 pupils admitted" })).toBeVisible();
  await sound(page, "ADMIN the intake after the admit");

  const members = await db.membership.findMany({ where: { schoolId, role: "STUDENT", status: "ACTIVE", user: { email: { in: emails } } }, select: { studentCode: true, user: { select: { name: true, birthdate: true, isMinor: true } }, enrollments: { where: { status: "ACTIVE" }, select: { class: { select: { name: true } } } } } });
  expect(members).toHaveLength(3);
  for (const m of members) {
    expect(m.studentCode).toMatch(/^STU-/);
    expect(m.user.name.startsWith(TAG)).toBe(true);
    expect(m.user.isMinor).toBe(true);
    expect(m.enrollments.map((e) => e.class.name)).toEqual([className]);
  }
  expect(members.find((m) => m.user.name.endsWith("Asha"))?.user.birthdate?.toISOString().slice(0, 10)).toBe("2011-06-14");

  // The people list, searched by the stamp: the three and nobody else.
  expect((await page.goto(`/admin/people?role=STUDENT&q=${encodeURIComponent(TAG)}`, { waitUntil: "networkidle" }))?.status()).toBe(200);
  for (const who of ["Asha", "Bhavin", "Chitra"]) await expect(page.getByText(`${TAG} ${who}`).first()).toBeVisible();
  expect((await page.locator("main").innerText()).split(TAG).length - 1).toBeGreaterThanOrEqual(3);
  // A read page, not the one written: measured as the written one is, the toolbar's clear button included (44 px since 2026-10-01).
  expect(await overflow(page), "the people list scrolls sideways").toBeLessThanOrEqual(0);
  expect(await smallTargets(page), "interactive elements under 44px").toEqual([]);
  expect(await seriousViolations(page, "ADMIN the people list with the three")).toEqual([]);
  await page.context().close();
});
