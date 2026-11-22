/**
 * The office's card: the school's own read-only "Your Shalaghar subscription" (decision 0010 parts 1 to 3; the brief's §2.6
 * and phase 7; the coordinating session's C2b, C3, C3a, C4a points 1 and 9 and C4b point 2 of 21 November 2026).
 *
 * The office's door, GET /api/v1/office/subscription, answers a premium price only while premium is on and billed (C2b; the
 * review's C-1: it answered our price to a school with both switches off). The card reads that answer in the office's own
 * words: "not recorded yet" while the school's terms are not set; the subscription a student a year, or free by agreement,
 * or no tier chosen yet; premium not on, on and billed at its price, or "on. No charge for it yet."; free until or renews
 * on; and that Shalaghar sends an invoice and nothing is paid in the app. It stands in the school's settings for the office
 * and in its safety centre for the head (who cannot open settings), and a notice that the terms moved links each person to
 * the card where they can read it, its sentence naming no page.
 *
 * As the database's owner (tests/setup.ts), on ZZ schools and people of this suite's own, removed after. The plans asked for
 * are named per case (setActivePlansForTests).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { officeSubscriptionSchema, paysPaise, type OfficeSubscription } from "@edulink/contracts";
import { en } from "@edulink/i18n/en";
import { hi } from "@edulink/i18n/hi";
import { mr } from "@edulink/i18n/mr";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { readOffer, readSchoolTerms, setSchoolTerms } from "@/lib/school-terms";
import { setActivePlansForTests } from "@/lib/person-plans";
import { translator } from "@/lib/i18n/dictionary";
import { subscriptionCardLines } from "@/app/(app)/admin/subscription-card";
import { GET as officeGet } from "@/app/api/v1/office/subscription/route";

const db = new PrismaClient();
const STAMP = Date.now();
const DAY = 86_400_000;
const MONTH = new Date().toISOString().slice(0, 7);
const t = translator("en");
const money = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;
const day = (key: string) => key;
const school: Record<string, string> = {};
const office: Record<string, { admin: string; head: string }> = {};
let operatorUserId = "";

async function makeSchool(key: string, data: Record<string, unknown>) {
  const n = Object.keys(school).length;
  school[key] = (await db.school.create({
    data: {
      name: `ZZ Office Card ${key} ${STAMP}`,
      slug: `zz-office-card-${key.toLowerCase()}-${STAMP}`,
      code: `ZOC${n}${String(STAMP).slice(-5)}`,
      contactEmail: `zz-office-card-${key.toLowerCase()}-${STAMP}@test.invalid`,
      timezone: "Asia/Kolkata",
      isTestFixture: true,
      subscriptionStatus: "ACTIVE",
      subscriptionStartsAt: new Date(Date.now() - 30 * DAY),
      subscriptionDueAt: new Date(`${new Date(Date.now() + 200 * DAY).toISOString().slice(0, 10)}T00:00:00.000Z`),
      ...data,
    },
    select: { id: true },
  })).id;
  await db.usageSample.create({ data: { schoolId: school[key]!, month: MONTH, pupils: 100, messages: 0, storageMb: 0, activeUsers: 0 } });
  const person = async (role: "ADMIN" | "PRINCIPAL") => {
    const id = (await db.user.create({ data: { name: `ZZ Office Card ${key} ${role}`, email: `zz-office-card-${key.toLowerCase()}-${role.toLowerCase()}-${STAMP}@test.invalid`, isTestFixture: true }, select: { id: true } })).id;
    await db.membership.create({ data: { userId: id, schoolId: school[key]!, role, status: "ACTIVE" } });
    return id;
  };
  office[key] = { admin: await person("ADMIN"), head: await person("PRINCIPAL") };
}

const SET = { termsSetAt: new Date(Date.now() - 10 * DAY) };

beforeAll(async () => {
  operatorUserId = (await db.user.create({ data: { name: "ZZ Office Card Operator", email: `zz-office-card-op-${STAMP}@test.invalid`, isSuperuser: true, isTestFixture: true }, select: { id: true } })).id;
  await makeSchool("Off", SET);
  // Its own premium price, so the case holds whatever our offer is saved at (the review's D7).
  await makeSchool("Billed", { ...SET, premiumStudents: true, premiumPricePaise: 5_000 });
  await makeSchool("Waiting", { ...SET, premiumStudents: true });
  await makeSchool("NotSet", { premiumStudents: true });
  await makeSchool("Trial", { ...SET, subscriptionStatus: "TRIAL" });
  await makeSchool("Free", { ...SET, subscriptionDiscountBps: 10_000 });
});

afterEach(() => setActivePlansForTests([]));

afterAll(async () => {
  __resetCookies();
  const schools = Object.values(school);
  const users = [operatorUserId, ...Object.values(office).flatMap((o) => [o.admin, o.head])];
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { actorUserId: { in: users } }, { targetId: { in: schools } }] } });
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.membership.deleteMany({ where: { schoolId: { in: schools } } });
  await db.usageSample.deleteMany({ where: { schoolId: { in: schools } } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.$disconnect();
});

async function card(key: string) {
  __resetCookies();
  await createSession(office[key]!.admin, { schoolId: school[key]!, role: "ADMIN" });
  const res = await officeGet();
  expect(res.status).toBe(200);
  return officeSubscriptionSchema.parse(await res.json());
}

describe("the office's door answers a premium price only while premium is on and billed (C2b; the review's C-1)", () => {
  it("off: no price; on and billed: its price; on and its plan not asked for: none, and why; terms not set: none, and why", async () => {
    setActivePlansForTests(["STUDENT"]);
    expect((await card("Off")).premium).toMatchObject({ students: false, teachers: false, figure: null, billed: false, notBilled: null });
    expect((await card("Billed")).premium).toMatchObject({ students: true, figure: { paysPaise: 5_000, source: "OWN_PRICE" }, billed: true, notBilled: null });
    expect((await card("NotSet")).premium).toMatchObject({ students: true, figure: null, billed: false, notBilled: "TERMS_NOT_SET" });
    setActivePlansForTests([]);
    expect((await card("Waiting")).premium).toMatchObject({ students: true, figure: null, billed: false, notBilled: "PLAN_NOT_ASKED" });
  });
});

describe("the card's sentences (§2.6, C3, C3a, C4a point 9)", () => {
  it("reads each standing in the office's words", async () => {
    setActivePlansForTests(["STUDENT"]);
    const offer = await readOffer();
    const sub = money(paysPaise(offer.subscriptionPricePaise, offer.subscriptionDiscountBps));
    const prem = money(5_000);
    const lines = async (key: string) => subscriptionCardLines(await card(key), t, money, day);
    const off = await lines("Off");
    expect(off).toEqual([t("settings.subscriptionPrice", { amount: sub }), t("settings.premiumOff"), expect.stringMatching(/^Renews on /), t("settings.subscriptionInvoiceNote")]);
    expect((await lines("Billed"))[1]).toBe(t("settings.premiumBilledStudents", { amount: prem }));
    // Terms not set: "not recorded yet" comes first, and no price at all.
    const notSet = await lines("NotSet");
    expect(notSet[0]).toBe(t("settings.subscriptionNotRecorded"));
    expect(notSet[1]).toBe(t("settings.premiumOnNotRecorded"));
    expect(notSet.join(" ")).not.toMatch(/₹/);
    expect((await lines("Trial")).some((l) => l.startsWith("Free until "))).toBe(true);
    expect((await lines("Free"))[0]).toBe(t("settings.subscriptionFree"));
    setActivePlansForTests([]);
    expect((await lines("Waiting"))[1]).toBe(t("settings.premiumOnNoCharge"));
  });
});

describe("where the card stands, and the notice that leads to it (C4a point 1, C4b point 2)", () => {
  it("in the school's settings for the office and in its safety centre for the head", () => {
    const page = (path: string) => readFileSync(resolve(__dirname, "../src/app/(app)/admin", path), "utf8");
    expect(page("settings/page.tsx")).toMatch(/<SubscriptionCard\b/);
    expect(page("safety/page.tsx")).toMatch(/<SubscriptionCard\b/);
  });

  it("a notice that the terms moved links the office to settings and the head to the safety centre, at the card; its sentence names no page", async () => {
    __resetCookies();
    await createSession(operatorUserId);
    const ctx = (await getSession()) as ActiveContext;
    const before = await readSchoolTerms(ctx, school.Off!);
    if ("ok" in before) throw new Error(before.errorKey);
    const saved = await setSchoolTerms(ctx, school.Off!, { premium: { students: true }, expect: { termsSetAt: before.termsSetAt, premiumStudents: before.premiumStudents, premiumTeachers: before.premiumTeachers, subscription: before.subscription, premium: before.premium, note: before.note } });
    expect(saved).toMatchObject({ changed: true, told: 2 });
    const url = async (userId: string) => (await db.notification.findFirstOrThrow({ where: { userId, titleKey: "notifTitle.schoolTermsChanged" }, select: { url: true } })).url;
    expect(await url(office.Off!.admin)).toBe("/admin/settings#subscription");
    expect(await url(office.Off!.head)).toBe("/admin/safety#subscription");
    for (const [dict, word] of [[en, /settings/i], [hi, /सेटिंग/], [mr, /सेटिंग/]] as const) {
      expect(dict.notifBody.schoolTermsChanged).not.toMatch(word);
    }
  });
});

describe("the card's date line by the school's standing (the coordinating session's review, C1)", () => {
  // A card as the door sends it: the state judged on the school's own day; only the state and the dates matter here.
  const at = (state: OfficeSubscription["state"], status: "TRIAL" | "ACTIVE" | "DUE" | "SUSPENDED" | "ENDED" | null): OfficeSubscription => ({
    termsSet: true,
    subscriptionFigure: { basePaise: 10_000, discountBps: 0, paysPaise: 10_000, source: "OURS", tierCode: null },
    premium: { students: false, teachers: false, figure: null, billed: false, notBilled: null },
    freeUntil: status === "TRIAL" ? "2026-11-10" : null,
    renewsOn: status === null ? null : "2026-11-10",
    state,
    recording: { paused: false, since: null },
  });
  const dateLine = (card: OfficeSubscription) => subscriptionCardLines(card, t, money, day).find((l) => /2026-11-10/.test(l)) ?? null;

  it("free until a day not come; the free period ended on a day come; renews on a day not come; the renewal date was a day come", () => {
    expect(dateLine(at("FREE", "TRIAL"))).toBe(t("settings.subscriptionFreeUntil", { date: "2026-11-10" }));
    expect(dateLine(at("FREE_ENDED", "TRIAL"))).toBe("Your free period ended on 2026-11-10.");
    expect(dateLine(at("PAID", "ACTIVE"))).toBe(t("settings.subscriptionRenewsOn", { date: "2026-11-10" }));
    expect(dateLine(at("INVOICED_UNPAID", "DUE"))).toBe(t("settings.subscriptionRenewsOn", { date: "2026-11-10" }));
    expect(dateLine(at("RENEWAL_PASSED", "ACTIVE"))).toBe("Your renewal date was 2026-11-10.");
    expect(dateLine(at("DUE_SINCE", "DUE"))).toBe("Your renewal date was 2026-11-10.");
  });

  it("a suspended or ended school is told no date (what it is told of those standings is part 4's to decide); no renewal, none", () => {
    expect(dateLine(at("SUSPENDED_OPEN", "SUSPENDED"))).toBeNull();
    expect(dateLine(at("ENDED", "ENDED"))).toBeNull();
    expect(dateLine(at("NO_RECORD", null))).toBeNull();
  });

  it("the door's state is judged on the school's own day: a renewal passed reads that it was", async () => {
    setActivePlansForTests([]);
    const passed = await db.school.update({ where: { id: school.Off! }, data: { subscriptionDueAt: new Date(`${new Date(Date.now() - 5 * DAY).toISOString().slice(0, 10)}T00:00:00.000Z`) }, select: { subscriptionDueAt: true } });
    const read = await card("Off");
    expect(read.state).toBe("RENEWAL_PASSED");
    expect(subscriptionCardLines(read, t, money, day)).toContain(`Your renewal date was ${passed.subscriptionDueAt!.toISOString().slice(0, 10)}.`);
  });
});
