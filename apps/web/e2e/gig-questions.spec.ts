import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { contextFor, sessions, VIEWPORTS } from "./actors";
import { overflow, seriousViolations, smallTargets } from "./checks";
import { QUESTION_GIG_FOR_TEACHERS } from "@edulink/contracts";

/**
 * Gigs: a teacher writes a question for the bank in three languages, the
 * content team reads it and adds it, and the teacher sees it in the bank with
 * what it earned; the operator's page holds the dials. The question the test
 * writes is its own and is taken out of the bank, with everything that hung
 * from it, when the test ends.
 */
config({ path: ".env" });
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });
const all = sessions();
// review-queue (10 Oct 2026): the teachers' question gig is switched off (packages/contracts QUESTION_GIG_FOR_TEACHERS);
// its pages answer 404 while it is, so the walk below waits for it to be switched back on.
test.skip(!QUESTION_GIG_FOR_TEACHERS, "the teachers' question gig is switched off");
const teacher = all.TEACHER!;
const appAdmin = all.APPADMIN!;
const operator = all.OPERATOR!;
const DESK = { width: 1280, height: 900 };
const STEM = `ZZ e2e ${Date.now()}: how many sides has a triangle?`;
const STEM_HI = "ZZ e2e: त्रिभुज की कितनी भुजाएँ होती हैं?";

test.afterAll(async () => {
  const rows = await db.questionContribution.findMany({ where: { stem: { startsWith: "ZZ e2e " } }, select: { id: true, questionId: true } });
  await db.quizQuestion.deleteMany({ where: { id: { in: rows.map((r) => r.questionId).filter((id): id is string => Boolean(id)) } } });
  await db.notification.deleteMany({ where: { url: { in: rows.map((r) => `/teacher/contributions/${r.id}`) } } });
  await db.questionContribution.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });
  await db.$disconnect();
});

test("a teacher writes a question in three languages, the content team adds it to the bank, and the teacher sees what it earned", async ({ browser, baseURL }) => {
  const settings = await db.gigSettings.findUniqueOrThrow({ where: { id: "gigs" } });
  const asTeacher = await contextFor(browser, teacher.cookie, { viewport: DESK, theme: "light", locale: "en" }, baseURL!);
  const page = await asTeacher.newPage();
  expect((await page.goto("/teacher/contributions", { waitUntil: "networkidle" }))?.status()).toBe(200);
  // The rule is said before a word is written: the unpaid first ones, the rate and the month's limit.
  await expect(page.getByTestId("gig-rule")).toContainText(`first ${settings.questionFreeCount} questions`);
  await expect(page.getByTestId("gig-rule")).toContainText(`${settings.questionRatePaise / 100}`);
  await expect(page.getByTestId("gig-rule")).toContainText(`up to ${settings.questionMonthlyCap} a month`);
  await page.getByTestId("gig-new").click();
  await expect(page.getByTestId("gig-form")).toBeVisible();

  await page.getByTestId("gig-en-stem").fill(STEM);
  for (const [i, c] of ["Two", "Three", "Four"].entries()) await page.getByTestId(`gig-en-choice-${i}`).fill(c);
  await page.getByTestId("gig-answer-1").check();
  await page.getByTestId("gig-en-solution").fill("A triangle has three sides and three corners.");
  await page.getByTestId("gig-hi-stem").fill(STEM_HI);
  for (const [i, c] of ["दो", "तीन", "चार"].entries()) await page.getByTestId(`gig-hi-choice-${i}`).fill(c);
  await page.getByTestId("gig-hi-solution").fill("त्रिभुज की तीन भुजाएँ और तीन कोने होते हैं।");
  // The Marathi box is typed in Devanagari whatever the header's switch says: English letters become Devanagari as a word ends.
  await expect(page.getByTestId("typing-switch").first()).toHaveAttribute("data-language", "en");
  await page.getByTestId("gig-mr-stem").click();
  await page.keyboard.type("ZZ e2e: trikoNaalaa kitii baajuu asataata? ");
  await expect(page.getByTestId("gig-mr-stem")).toHaveValue(/त्रिकोणाला किती बाजू असतात/);
  for (const [i, c] of ["दोन", "तीन", "चार"].entries()) await page.getByTestId(`gig-mr-choice-${i}`).fill(c);
  // Sent with the Marathi solution missing: refused, and the sentence says which language.
  await page.getByTestId("gig-terms").check();
  await page.getByTestId("gig-send").click();
  await expect(page.getByTestId("gig-error")).toHaveText("The Marathi is incomplete: the question, every option and the worked solution are needed.");
  await page.getByTestId("gig-mr-solution").fill("त्रिकोणाला तीन बाजू आणि तीन कोन असतात.");
  // Without the author's word that it is their own, refused.
  await page.getByTestId("gig-terms").uncheck();
  await page.getByTestId("gig-send").click();
  await expect(page.getByTestId("gig-error")).toHaveText("Confirm that the question is your own work.");
  await page.getByTestId("gig-terms").check();
  await page.getByTestId("gig-send").click();
  await page.waitForURL("**/teacher/contributions");
  const mine = page.getByTestId("gig-list").locator("li", { hasText: STEM });
  await expect(mine).toContainText("Waiting to be read");
  const row = await db.questionContribution.findFirstOrThrow({ where: { stem: STEM }, select: { id: true, status: true, stemHi: true, stemMr: true, answerIndex: true, choices: true } });
  expect(row).toMatchObject({ status: "SUBMITTED", stemHi: STEM_HI, answerIndex: 1, choices: JSON.stringify(["Two", "Three", "Four"]) });
  expect(row.stemMr).toContain("त्रिकोणाला किती बाजू असतात");

  // The content team finds it in the queue, reads the three languages, is told what adding it earns, and adds it.
  const asTeam = await contextFor(browser, appAdmin.cookie, { viewport: DESK, theme: "light", locale: "en" }, baseURL!);
  const desk = await asTeam.newPage();
  expect((await desk.goto("/appadmin/contributions", { waitUntil: "networkidle" }))?.status()).toBe(200);
  await desk.getByTestId("gig-queue").getByRole("link", { name: STEM }).click();
  await expect(desk.getByTestId("gig-read-hi")).toContainText("त्रिभुज की कितनी भुजाएँ");
  await expect(desk.getByTestId("gig-read-mr")).toContainText("Correct answer");
  await expect(desk.getByTestId("gig-outcome")).toContainText(/Adding it earns the author/);
  // Returning with no note is refused where it is asked.
  await desk.getByTestId("gig-return").click();
  await expect(desk.getByTestId("gig-decide-error")).toHaveText("Write a note for the teacher, of at least five letters.");
  await desk.getByTestId("gig-add").click();
  await desk.waitForURL("**/appadmin/contributions");
  const bank = await db.quizQuestion.findFirstOrThrow({ where: { stem: STEM }, select: { source: true, answerIndex: true, translations: { select: { language: true } } } });
  expect(bank).toMatchObject({ source: "teacher contribution", answerIndex: 1 });
  expect(bank.translations.map((t) => t.language).sort()).toEqual(["hi", "mr"]);
  const earning = await db.gigEarning.findUniqueOrThrow({ where: { contributionId: row.id }, select: { amountPaise: true, basis: true } });

  // The teacher sees it in the bank, with what it earned, and can no longer change it.
  await page.reload({ waitUntil: "networkidle" });
  await expect(mine).toContainText("In the bank");
  await expect(mine).toContainText(earning.basis === "FREE_BLOCK" ? "Unpaid: one of your first" : "to be paid");
  await mine.getByRole("link").click();
  await expect(page.getByText("This question is settled and can no longer be changed.")).toBeVisible();
  await expect(page.getByTestId("gig-form")).toHaveCount(0);
  await asTeacher.close();
  await asTeam.close();
});

test("the content team's pages are the content team's: a teacher is sent away, and the operator reads the dials", async ({ browser, baseURL }) => {
  const asTeacher = await contextFor(browser, teacher.cookie, { viewport: DESK, theme: "light", locale: "en" }, baseURL!);
  const page = await asTeacher.newPage();
  await page.goto("/appadmin/contributions", { waitUntil: "networkidle" });
  expect(new URL(page.url()).pathname).not.toBe("/appadmin/contributions");
  await page.goto("/root/gigs", { waitUntil: "networkidle" });
  expect(new URL(page.url()).pathname).not.toBe("/root/gigs");
  await asTeacher.close();

  const asOperator = await contextFor(browser, operator.cookie, { viewport: DESK, theme: "light", locale: "en" }, baseURL!);
  const desk = await asOperator.newPage();
  expect((await desk.goto("/root/gigs", { waitUntil: "networkidle" }))?.status()).toBe(200);
  const settings = await db.gigSettings.findUniqueOrThrow({ where: { id: "gigs" } });
  await expect(desk.getByTestId("gig-set-questionRatePaise")).toHaveValue(String(settings.questionRatePaise / 100));
  await expect(desk.getByTestId("gig-set-questionMonthlyCap")).toHaveValue(String(settings.questionMonthlyCap));
  await expect(desk.getByTestId("gig-month")).toContainText("waiting to be read");
  // The sessions' dials are a group of their own, saved by themselves.
  await expect(desk.getByTestId("gig-session-settings").getByTestId("gig-set-pupilFreeOneToOnes")).toHaveValue(String(settings.pupilFreeOneToOnes));
  expect(await seriousViolations(desk, "root gigs")).toEqual([]);
  await asOperator.close();
});

for (const theme of ["light", "dark"] as const) {
  for (const [name, viewport] of [["desk", DESK], ["iphone", VIEWPORTS.iphone]] as const) {
    test(`the teacher's pages and the content team's queue · ${name} · ${theme}`, async ({ browser, baseURL }) => {
      const asTeacher = await contextFor(browser, teacher.cookie, { viewport, theme, locale: "en" }, baseURL!);
      const page = await asTeacher.newPage();
      for (const path of ["/teacher/contributions", "/teacher/contributions/new"]) {
        expect((await page.goto(path, { waitUntil: "networkidle" }))?.status()).toBe(200);
        expect(await overflow(page), `${path} scrolls sideways`).toBeLessThanOrEqual(0);
        expect(await smallTargets(page), `${path}: interactive elements under 44px`).toEqual([]);
        expect(await seriousViolations(page, `${path} ${name} ${theme}`)).toEqual([]);
      }
      await asTeacher.close();
      const asTeam = await contextFor(browser, appAdmin.cookie, { viewport, theme, locale: "en" }, baseURL!);
      const desk = await asTeam.newPage();
      expect((await desk.goto("/appadmin/contributions", { waitUntil: "networkidle" }))?.status()).toBe(200);
      expect(await overflow(desk), "the queue scrolls sideways").toBeLessThanOrEqual(0);
      expect(await seriousViolations(desk, `queue ${name} ${theme}`)).toEqual([]);
      await asTeam.close();
    });
  }
}
