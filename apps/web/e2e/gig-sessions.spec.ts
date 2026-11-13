import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";
import { en } from "@edulink/i18n/en";
import { contextFor, sessions, VIEWPORTS } from "./actors";
import { overflow, seriousViolations, smallTargets } from "./checks";

/**
 * Sessions, in a browser and so under the row policies the library tests do
 * not exercise: an expert, who has no school, offers a time and reads the
 * pupil who takes a seat in it; a pupil asks and a guardian agrees; the
 * meeting link is shown to the family only once the seat is confirmed and to
 * the office never; the expert cancels a seat, marks another held, and reads
 * the rating. What the test makes is named "ZZ e2e" and is removed at the end.
 */
config({ path: ".env" });
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_ADMIN_URL ?? process.env.DATABASE_URL });
const all = sessions();
const DESK = { width: 1280, height: 900 };
const STAMP = Date.now();
const TITLE = `ZZ e2e ${STAMP} how rockets stay up`;
// A room on one of the four services a slot may name (lib/meeting-links.ts, 17 October 2026): Jitsi's own host.
const LINK = `https://meet.jit.si/zz-e2e-${STAMP}`;
const open = async (browser: import("@playwright/test").Browser, actor: keyof typeof all, baseURL: string, viewport = DESK, theme: "light" | "dark" = "light") => (await contextFor(browser, all[actor]!.cookie, { viewport, theme, locale: "en" }, baseURL)).newPage();

test.afterAll(async () => {
  const slots = await db.gigSlot.findMany({ where: { title: { startsWith: "ZZ e2e " } }, select: { id: true } });
  await db.notification.deleteMany({ where: { OR: [{ title: { contains: "ZZ e2e " } }, { body: { contains: "ZZ e2e " } }] } });
  await db.gigSlot.deleteMany({ where: { id: { in: slots.map((s) => s.id) } } });
  await db.$disconnect();
});

test("an expert offers a time, a pupil asks, a guardian agrees, the office reads it without the link, and the expert cancels the seat", async ({ browser, baseURL }) => {
  // The expert, who belongs to no school, offers a one-to-one three days from now.
  const expert = await open(browser, "EXPERT", baseURL!);
  expect((await expert.goto("/expert/sessions", { waitUntil: "networkidle" }))?.status()).toBe(200);
  await expect(expert.getByTestId("provider-duty")).toContainText("Given so far");
  const at = new Date(Date.now() + 3 * 86_400_000);
  const local = `${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, "0")}-${String(at.getDate()).padStart(2, "0")}T03:15`;
  await expert.getByTestId("slot-title").fill(TITLE);
  await expert.getByTestId("slot-starts").fill(local);
  // A link off the four services is refused, with the sentence the slot door gives; the Jitsi room is taken.
  await expert.getByTestId("slot-link").fill("http://meet.zz.test/plain");
  await expert.getByTestId("slot-offer").click();
  await expect(expert.getByTestId("slot-error")).toHaveText(en.seats.refuseMeetingLink);
  await expert.getByTestId("slot-link").fill(LINK);
  await expert.getByTestId("slot-offer").click();
  const mine = expert.getByTestId("provider-slot").filter({ hasText: TITLE });
  // The offer is a server action and a route refresh. Until 13 November 2026 the redraw after the refresh was held
  // for five seconds, React's deadline for a starved lane, unless some other state update landed first — on the
  // runner this line failed at five seconds on both attempts (41454850718, 43282364871, 43330969839's booking and
  // rating below) and passed when it was given twenty; against a production build here five of six offers drew at
  // 5.1 s and a keystroke a second after the click drew every one at once. src/lib/navigation.ts now nudges the
  // router after every refresh, so the twenty seconds are kept only as a margin for the runner.
  await expect(mine).toContainText("0 of 1 seats taken", { timeout: 20_000 });

  // The pupil sees it among what is open, with no link, and asks.
  const pupil = await open(browser, "STUDENT", baseURL!);
  expect((await pupil.goto("/sessions", { waitUntil: "networkidle" }))?.status()).toBe(200);
  await expect(pupil.getByTestId("session-allowance")).toContainText("one-to-ones");
  const offered = pupil.getByTestId("session-open").locator("li", { hasText: TITLE });
  await expect(offered).toBeVisible();
  expect(await pupil.content()).not.toContain(LINK);
  await offered.getByTestId("session-book-open").click();
  await offered.getByTestId("session-purpose").fill("ZZ e2e I want to know how rockets stay up");
  await offered.getByTestId("session-book").click();
  const seat = pupil.getByTestId("session-seats").locator("li", { hasText: TITLE });
  await expect(seat).toContainText("Waiting for a guardian");
  await expect(seat.getByTestId("session-link")).toHaveCount(0);
  expect(await pupil.content()).not.toContain(LINK);

  // The expert reads who asked and from which school, through a booking that is a school's row.
  await expert.reload({ waitUntil: "networkidle" });
  await expect(mine).toContainText("1 of 1 seats taken");
  await expect(mine.getByTestId("provider-seat")).toContainText("Waiting for a guardian");
  await expect(mine.getByTestId("provider-seat")).toContainText("ZZ Northgate School");

  // The guardian agrees; now, and only now, the family is shown the link.
  const guardian = await open(browser, "PARENT", baseURL!);
  await guardian.goto("/sessions", { waitUntil: "networkidle" });
  const asked = guardian.getByTestId("session-seats").locator("li", { hasText: TITLE });
  await asked.getByTestId("session-consent-yes").click();
  await expect(asked).toContainText("Confirmed");
  await expect(asked.getByTestId("session-link")).toHaveAttribute("href", LINK);
  await pupil.reload({ waitUntil: "networkidle" });
  await expect(seat.getByTestId("session-link")).toHaveAttribute("href", LINK);

  // The office reads the booking and is never shown the link.
  const office = await open(browser, "ADMIN", baseURL!);
  expect((await office.goto("/admin/sessions", { waitUntil: "networkidle" }))?.status()).toBe(200);
  await expect(office.getByTestId("office-sessions").locator("li", { hasText: TITLE })).toContainText("Confirmed");
  expect(await office.content()).not.toContain(LINK);
  await expect(office.getByTestId("guidance-switch")).toBeChecked();

  // The expert cancels the seat with a reason; the family sees it cancelled, the link gone, and the seat is free again.
  await expert.reload({ waitUntil: "networkidle" });
  await mine.getByTestId("seat-cancel-open").click();
  await mine.getByTestId("seat-cancel-reason").fill("ZZ e2e the launch is that morning");
  await mine.getByTestId("seat-cancel").click();
  await expect(mine).toContainText("0 of 1 seats taken");
  await pupil.reload({ waitUntil: "networkidle" });
  await expect(seat).toContainText("Cancelled");
  await expect(seat.getByTestId("session-link")).toHaveCount(0);
  const row = await db.gigBooking.findFirstOrThrow({ where: { slot: { title: TITLE } }, select: { status: true, lateCancel: true, cancelReason: true, slot: { select: { seatsTaken: true } } } });
  expect(row).toMatchObject({ status: "CANCELLED", lateCancel: false, cancelReason: "ZZ e2e the launch is that morning", slot: { seatsTaken: 0 } });
  for (const page of [expert, pupil, guardian, office]) await page.context().close();
});

test("the expert marks a seat held once its time has begun, the guardian rates it, and the expert reads the rating", async ({ browser, baseURL }) => {
  // A time that began ten minutes ago with the sweep's pupil confirmed in it, made as the fixtures make theirs.
  const expertUser = await db.session.findFirstOrThrow({ where: { userAgent: "e2e", activeRole: "EXPERT" }, orderBy: { createdAt: "desc" }, select: { userId: true } });
  const pupil = await db.membership.findFirstOrThrow({ where: { id: all.STUDENT!.pupilId }, select: { id: true, schoolId: true, guardianships: { where: { status: "ACTIVE" }, take: 1, select: { parentUserId: true } } } });
  const title = `ZZ e2e ${STAMP} a session already begun`;
  const startsAt = new Date(Date.now() - 10 * 60_000);
  const slot = await db.gigSlot.create({ data: { providerUserId: expertUser.userId, providerKind: "EXPERT", kind: "WORKSHOP", title, startsAt, endsAt: new Date(startsAt.getTime() + 60 * 60_000), meetingUrl: `${LINK}-begun`, seats: 5, seatsTaken: 1 }, select: { id: true } });
  await db.gigBooking.create({ data: { schoolId: pupil.schoolId, slotId: slot.id, studentMembershipId: pupil.id, providerUserId: expertUser.userId, kind: "WORKSHOP", status: "CONFIRMED", bookedByUserId: pupil.guardianships[0]!.parentUserId, purpose: "ZZ e2e to see it marked", consentAt: new Date() } });

  const expert = await open(browser, "EXPERT", baseURL!);
  await expert.goto("/expert/sessions", { waitUntil: "networkidle" });
  const mine = expert.getByTestId("provider-slot").filter({ hasText: title });
  await mine.getByTestId("seat-delivered").click();
  await expect(mine.getByTestId("provider-seat")).toContainText("Held");
  const guardian = await open(browser, "PARENT", baseURL!);
  await guardian.goto("/sessions", { waitUntil: "networkidle" });
  const seat = guardian.getByTestId("session-seats").locator("li", { hasText: title });
  await expect(seat).toContainText("Held");
  await seat.getByTestId("session-rate").getByRole("combobox").selectOption("4");
  await seat.getByTestId("session-rate").getByRole("textbox").fill("ZZ e2e clear and kind");
  await seat.getByTestId("session-rate").getByRole("button").click();
  await expect(seat.getByTestId("session-rate")).toHaveCount(0);
  await expert.reload({ waitUntil: "networkidle" });
  await expect(mine.getByTestId("provider-seat")).toContainText("Rated 4 of 5");
  await expect(mine.getByTestId("provider-seat")).toContainText("ZZ e2e clear and kind");
  for (const page of [expert, guardian]) await page.context().close();
});

test("a teacher is offered one-to-ones only, and the pages are nobody else's", async ({ browser, baseURL }) => {
  const teacher = await open(browser, "TEACHER", baseURL!);
  expect((await teacher.goto("/teacher/guidance", { waitUntil: "networkidle" }))?.status()).toBe(200);
  await expect(teacher.getByTestId("slot-form")).toBeVisible();
  await expect(teacher.getByTestId("slot-kind")).toHaveCount(0);
  // Neither page is a teacher's: each sends them on. The redirect is thrown once the shell has begun streaming,
  // so the document answers 200 and the browser is moved by the page a moment later; the address is read until
  // it has moved, not once.
  await teacher.goto("/admin/sessions", { waitUntil: "networkidle" });
  await expect(teacher).not.toHaveURL(/\/admin\/sessions$/);
  await teacher.goto("/sessions", { waitUntil: "networkidle" });
  await expect(teacher).not.toHaveURL(/\/sessions$/);
  await teacher.context().close();
});

for (const theme of ["light", "dark"] as const) {
  for (const [name, viewport] of [["desk", DESK], ["iphone", VIEWPORTS.iphone]] as const) {
    test(`the session pages · ${name} · ${theme}`, async ({ browser, baseURL }) => {
      for (const [actor, path] of [["STUDENT", "/sessions"], ["PARENT", "/sessions"], ["EXPERT", "/expert/sessions"], ["TEACHER", "/teacher/guidance"], ["ADMIN", "/admin/sessions"]] as const) {
        const page = await open(browser, actor, baseURL!, viewport, theme);
        expect((await page.goto(path, { waitUntil: "networkidle" }))?.status(), `${actor} ${path}`).toBe(200);
        expect(await overflow(page), `${actor} ${path} scrolls sideways`).toBeLessThanOrEqual(0);
        expect(await smallTargets(page), `${actor} ${path}: interactive elements under 44px`).toEqual([]);
        expect(await seriousViolations(page, `${actor} ${path} ${name} ${theme}`)).toEqual([]);
        await page.context().close();
      }
    });
  }
}
