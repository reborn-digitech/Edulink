/**
 * The subscription console's pages, rendered (decision 0010; the brief's §2.1 to §2.3, phase 5): the Schools tab, the Prices
 * tab and a school's "Subscription and premium" card, each as the operator reads it, with the words the server gives them
 * (C2's lines, the cells, the reasons premium is not billed, the card's lines, the corrections' read-only payment). The pages
 * run as they do in the app, against ZZ schools of this suite's own, signed in as a ZZ operator; the client parts render as
 * the server first sends them. No plan is asked for (person-plans.ts under VITEST), so C2's line stands.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { prerenderToNodeStream } from "react-dom/static";
import { PrismaClient } from "@prisma/client";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { translator } from "@/lib/i18n/dictionary";

(globalThis as { React?: typeof React }).React = React;
vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ refresh() {}, push() {}, replace() {}, prefetch() {} }),
  usePathname: () => "/root/subscriptions",
  useSearchParams: () => new URLSearchParams(),
}));

import SubscriptionsPage from "@/app/root/subscriptions/page";
import PricesPage from "@/app/root/subscriptions/prices/page";
import SchoolPage from "@/app/root/[schoolId]/page";
import RootPage from "@/app/root/page";
import OnboardPage from "@/app/root/onboard/page";
import { summaryWaitsKey } from "@/app/root/onboard/terms-fieldset";
import { setActivePlansForTests } from "@/lib/person-plans";
import { formatDateKey, todayKey } from "@/lib/dates";
import { paysPaise, renewalFrom } from "@edulink/contracts";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { operatorDashboard } from "@/lib/subscriptions";
import { billedYear, listSubscriptions, readOffer } from "@/lib/school-terms";
import { formatPaise } from "@edulink/i18n";
import { ToastProvider } from "@/components/ui/toast";
import { I18nProvider } from "@/lib/i18n/provider";
import { dictionaryAsset } from "@/lib/i18n/asset";

const db = new PrismaClient();
const t = translator("en");
const STAMP = Date.now();
const DAY = 86_400_000;
const MONTH = new Date().toISOString().slice(0, 7);
const NAME = `ZZ Pages ${STAMP}`;
const email = (who: string) => `zz-sub-pages-${who}-${STAMP}@test.invalid`;
const school: Record<string, string> = {};
let operator = "";

/**
 * The page rendered whole, its async server parts (the header, the card) awaited: React 19's prerender waits for every
 * suspended part, where renderToStaticMarkup cannot.
 */
async function shell(child: React.ReactNode): Promise<string> {
  const { prelude } = await prerenderToNodeStream(React.createElement(I18nProvider, { locale: "en", href: dictionaryAsset("en").href } as Parameters<typeof I18nProvider>[0], React.createElement(ToastProvider, null, child)));
  const chunks: Buffer[] = [];
  for await (const chunk of prelude) chunks.push(Buffer.from(chunk as Uint8Array));
  return Buffer.concat(chunks).toString("utf8");
}
/** The markup's text, entities read back, so a sentence with an apostrophe is matched as written. */
const text = (html: string) => html.replace(/&#x27;|&#39;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"');

async function makeSchool(key: string, data: Record<string, unknown>, pupils: number) {
  const n = Object.keys(school).length;
  school[key] = (await db.school.create({
    data: {
      name: `${NAME} ${key}`,
      slug: `zz-sub-pages-${key.toLowerCase()}-${STAMP}`,
      code: `ZSP${n}${String(STAMP).slice(-5)}`,
      contactEmail: email(key.toLowerCase()),
      timezone: "Asia/Kolkata",
      isTestFixture: true,
      subscriptionStatus: "TRIAL",
      subscriptionStartsAt: new Date(Date.now() - 10 * DAY),
      subscriptionDueAt: new Date(`${new Date(Date.now() + 180 * DAY).toISOString().slice(0, 10)}T00:00:00.000Z`),
      ...data,
    },
    select: { id: true },
  })).id;
  await db.usageSample.create({ data: { schoolId: school[key]!, month: MONTH, pupils, messages: 0, storageMb: 0, activeUsers: 0 } });
}

beforeAll(async () => {
  operator = (await db.user.create({ data: { name: "ZZ Sub Pages Operator", email: email("operator"), isSuperuser: true, isTestFixture: true }, select: { id: true } })).id;
  await makeSchool("Banyan", { termsSetAt: new Date(Date.now() - 5 * DAY), subscriptionDiscountBps: 2_000, premiumStudents: true }, 412);
  await makeSchool("NotSet", { premiumStudents: true }, 120);
  await makeSchool("College", { kind: "COLLEGE", termsSetAt: new Date(Date.now() - 5 * DAY) }, 300);
  __resetCookies();
  __setHeaders({});
  await createSession(operator, {});
});

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const schools = Object.values(school);
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { actorUserId: operator }] } });
  await db.session.deleteMany({ where: { userId: operator } });
  await db.usageSample.deleteMany({ where: { schoolId: { in: schools } } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.user.deleteMany({ where: { id: operator } });
  await db.$disconnect();
});

describe("the Schools tab (§2.1)", () => {
  it("C2's line, our offer's card, each school's cells as the server words them, and the switches as switches", async () => {
    const html = text(await shell(await SubscriptionsPage({ searchParams: Promise.resolve({ q: NAME }) })));
    // C5 point 6: two lines at most above the list, the plans' line true while features are switched off.
    expect(html).toContain(t("subs.plansNotAskedBoth"));
    const lines = html.slice(html.indexOf('data-testid="premium-lines"'));
    expect((lines.slice(0, lines.indexOf("</div>")).match(/<p /g) ?? []).length).toBeLessThanOrEqual(2);
    // C5 point 7: the columns under the two parts' names, and the filters named where they can be seen.
    expect(html).toContain(t("subs.colGroupSubscription"));
    expect(html).toContain(t("subs.colGroupPremium"));
    expect(html).toContain(`>${t("subs.filterTerms")}<`);
    expect(html).toContain(t("subs.forAllSchools"));
    // Banyan: its own 20 % off ours; premium on and not billed while the Student plan is not asked for (C3).
    expect(html).toMatch(/₹\d+ · own 20 % off ₹\d+/);
    expect(html).toContain("Premium on, not billed: the Student plan is not asked for");
    // Terms not set: the badge and Set terms, which opens the school's subscription sheet; the reason is the terms first (C3a).
    expect(html).toContain(`href="/root/${school.NotSet}?sheet=subscription#subscription"`);
    expect(html).toContain("Premium on, not billed: terms not set");
    // A college with no tier: no price; its teachers hold no plan, so no switch.
    expect(html).toContain(t("operatorCollege.noTierChosen"));
    expect(html).toContain(`data-testid="premium-students-${school.College}"`);
    expect(html).not.toContain(`data-testid="premium-teachers-${school.College}"`);
    expect(html).toContain('role="switch"');
    expect(html).toContain(`aria-label="Premium for students at ${NAME} Banyan"`);
  });

  it("a filter narrows the rows: terms not set alone", async () => {
    const html = text(await shell(await SubscriptionsPage({ searchParams: Promise.resolve({ q: NAME, terms: "notset" }) })));
    expect(html).toContain(`${NAME} NotSet`);
    expect(html).not.toContain(`${NAME} Banyan`);
  });
});

describe("the Prices tab (§2.2)", () => {
  it("both parts, Review change, who is asked, the schools on their own terms (ours among them) and the recent changes", async () => {
    const html = text(await shell(await PricesPage()));
    expect(html).toContain('data-testid="prices-form"');
    expect(html).toContain(t("subs.reviewChange"));
    expect(html).toContain(t("subs.planNotAsked", { plan: t("plans.nameStudent") }));
    expect(html).toContain(t("subs.ownTermsTitle"));
    expect(html).toContain(`${NAME} Banyan`);
    expect(html).toContain(t("subs.recentTitle"));
  });
});

describe("a school's card (§2.3)", () => {
  it("both parts and how each is priced, the year, the corrections with the payment read-only, Plan and limits; a sheet opened from the list", async () => {
    const html = text(await shell(await SchoolPage({ params: Promise.resolve({ schoolId: school.Banyan! }), searchParams: Promise.resolve({ sheet: "payment" }) })));
    expect(html).toContain(t("subs.cardTitle"));
    expect(html).toMatch(/₹\d+ a student a year \+ GST \(its own 20 % off our ₹\d+\)/);
    expect(html).toContain("Premium on, not billed: the Student plan is not asked for");
    expect(html).toContain(t("subs.correctionsTitle"));
    expect(html).toContain(t("subs.notPaidYet"));
    expect(html).toContain(t("root.planTitle"));
    expect(html).toContain('data-testid="payment-sheet"');
    expect(html).toMatch(/About ₹[\d,]+ a year for 412 students/);
  });

  it("terms not set: what it pays from before, Set terms, no estimate; one badge for one standing (C5 point 8)", async () => {
    const html = text(await shell(await SchoolPage({ params: Promise.resolve({ schoolId: school.NotSet! }), searchParams: Promise.resolve({}) })));
    expect(html).toContain(`${NAME} NotSet's terms are not set: it pays what was agreed before`);
    expect(html).not.toMatch(/About ₹[\d,]+ a year for/);
    // The card offers Set terms where the terms are not set (§2.3; the review, D4).
    expect(html).toContain(`>${t("subs.setTermsCard")}<`);
    // The corrections' old status badge and its UTC "Overdue by" line are gone, and its explainer no longer says a payment's dates are recorded there.
    expect(html).not.toMatch(/days overdue|Overdue by/);
    expect(html).toContain(t("subs.correctionsExplainer"));
    expect(html).not.toContain(t("root.subscriptionExplainer"));
    expect(html).toContain(t("subs.reasonSchoolReads"));
  });
});

describe("the dashboard (§2.6)", () => {
  it("a school's premium badges, and the year billed as the Schools tab totals it", async () => {
    const html = text(await shell(await RootPage({ searchParams: Promise.resolve({ q: NAME, state: "test" }) })));
    expect(html).toContain(t("subs.badgeStudents"));
    expect(html).toContain(t("subs.tileBilled"));
    const ctx = (await getSession()) as ActiveContext;
    const d = await operatorDashboard(ctx, { q: NAME, state: "test" });
    expect(d.rows.find((r) => r.id === school.Banyan)?.premium).toEqual({ students: true, teachers: false });
    expect(d.rows.find((r) => r.id === school.College)?.premium).toEqual({ students: false, teachers: false });
    expect(d.tiles.billedYearPaise).toBe((await billedYear(ctx)).billedYearPaise);
    // The tile's figure is the Schools tab's year billed, drawn as such (the review, D5).
    const { totals } = await listSubscriptions(ctx, {});
    expect(d.tiles.billedYearPaise).toBe(totals.billedYearPaise);
    expect(html).toContain(formatPaise(totals.billedYearPaise, "en"));
  });
});

describe("onboarding's terms (§2.5; phase 6)", () => {
  afterEach(() => setActivePlansForTests([]));
  /** The checked boxes in the page: onboarding's form has no other box than the premium ticks once the trial box is gone. */
  const checked = (html: string) => (html.match(/<input(?=[^>]*type="checkbox")(?=[^>]*\schecked="")[^>]*>/g) ?? []).length;
  /** Whether the box labelled so is ticked: its input stands just before its label's text in the same label element. */
  const ticked = (html: string, label: string) => {
    const at = html.indexOf(`>${label}</span>`);
    if (at < 0) throw new Error(`no box labelled ${label}`);
    const input = html.slice(html.lastIndexOf("<input", at), html.indexOf(">", html.lastIndexOf("<input", at)) + 1);
    return /\schecked=""/.test(input);
  };

  it("fieldset 2 is \"Subscription and premium\": the subscription's line from our offer, the premium ticks as C3 starts them, the optional plan, and no trial box", async () => {
    const offer = await readOffer();
    setActivePlansForTests([]);
    const html = text(await shell(await OnboardPage()));
    expect(html).toContain(t("root.obLegend"));
    const ours = formatPaise(paysPaise(offer.subscriptionPricePaise, offer.subscriptionDiscountBps), "en");
    const months = offer.freeMonths === 0 ? t("root.obMonthsFreeNone") : offer.freeMonths === 1 ? t("root.obMonthsFreeOne") : t("root.obMonthsFree", { count: offer.freeMonths });
    const renews = formatDateKey(renewalFrom(todayKey("Asia/Kolkata"), offer.freeMonths), { day: "numeric", month: "short", year: "numeric" }, "en");
    expect(html).toContain(`${ours} a student a year + GST (ours) · ${months} · renews on ${renews}`);
    expect(html).toContain(t("root.obPremiumStudents"));
    expect(html).toContain(t("root.obPremiumTeachers"));
    expect(html).toContain(t("root.obPlanOptional"));
    expect(html).not.toContain("30-day trial");
    // C7.5: with no box ticked, premium's line reads as what it would be if switched on, not as a charge.
    expect(html).toMatch(/\+ ₹[\d,]+ more a student a year \+ GST if switched on \(ours\)/);
    // The button names what it still waits for (the second review's C3, W-5 and the streams).
    expect(html).toContain("Still needed before onboarding: Name, Contact email, First administrator");
    // C3: no plan asked for, so neither premium box starts ticked whatever our offer's defaults say.
    expect(checked(html)).toBe(0);
    // Both plans asked for: each box starts as our offer's default for it.
    setActivePlansForTests(["STUDENT", "TEACHER"]);
    const asked = text(await shell(await OnboardPage()));
    expect(checked(asked)).toBe(Number(offer.studentsByDefault) + Number(offer.teachersByDefault));
    // Each box as our offer's default for it, read box by box (the review of phase 6, 8), and only the Student plan asked for
    // leaves Teachers unticked whatever its default.
    expect({ students: ticked(asked, t("root.obPremiumStudents")), teachers: ticked(asked, t("root.obPremiumTeachers")) }).toEqual({ students: offer.studentsByDefault, teachers: offer.teachersByDefault });
    setActivePlansForTests(["STUDENT"]);
    const studentOnly = text(await shell(await OnboardPage()));
    expect({ students: ticked(studentOnly, t("root.obPremiumStudents")), teachers: ticked(studentOnly, t("root.obPremiumTeachers")) }).toEqual({ students: offer.studentsByDefault, teachers: false });
    // No name typed yet: the summary says it waits for one, and no stand-in is worded.
    expect(html).toContain(t("root.obSummaryWaitsName"));
  });

  it("what the summary waits for names both the figures and the dates where both are missing (the review of 07d594f3, R3)", () => {
    expect(t(summaryWaitsKey({ figures: true, dates: true }))).toBe("The summary waits for the figures and dates above.");
    expect(t(summaryWaitsKey({ figures: true, dates: false }))).toBe("The summary waits for the figures above.");
    expect(t(summaryWaitsKey({ figures: false, dates: true }))).toBe("The summary waits for the dates above.");
  });
});

