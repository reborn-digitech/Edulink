/**
 * Onboarding with the school's terms (decision 0010, the brief of 21 November 2026, version 3, rule 5): any of the new
 * fields (subscription, premium, freeMonths) takes the new path, where the renewal is the start plus the free months
 * (calendar months, the day held to the month's end) or a typed day, the school is DUE when that is the start day or on
 * or before today and TRIAL otherwise, and its terms are set; a renewal more than a year on needs one tick and one before
 * today another. With none of them, today's rule exactly: a year, or a thirty-day trial, terms not set, premium off.
 *
 * This suite's own operator; every school it onboards is named with its stamp and removed afterwards with its rows.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { freeMonthsImplied, renewalFrom, type OperatorOnboardBody } from "@edulink/contracts";
import { ONBOARD_FORMS, onboardFormBody } from "../e2e/onboard-forms";
import { onboardSentence } from "@/lib/terms-sentences";
import { consoleFmt } from "@/app/root/subscriptions/fmt";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { onboardSchool, previewOnboarding } from "@/lib/subscriptions";
import { readOffer, readSchoolTerms } from "@/lib/school-terms";
import { setActivePlansForTests } from "@/lib/person-plans";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { onboardLookAction, onboardPreviewAction, onboardSchoolAction } from "@/app/root/actions";
import { lookForOnboarded } from "@/lib/subscriptions";
import { translator } from "@/lib/i18n/dictionary";

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));
/** D2: the first administrator's invitation refused once on demand, so a refusal can be made to come after the tier's plan. */
const invite = vi.hoisted(() => ({ refuse: false, throws: false }));
vi.mock("@/lib/superuser", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/superuser")>();
  return {
    ...real,
    inviteAdmin: (...args: Parameters<typeof real.inviteAdmin>) =>
      invite.throws ? Promise.reject(new Error("ZZ the database's acknowledgement was lost")) : invite.refuse ? Promise.resolve({ ok: false, errorKey: "root.didNotWork" as const }) : real.inviteAdmin(...args),
  };
});

const db = new PrismaClient();
const STAMP = Date.now();
const PREFIX = `ZZ Premium Onboard ${STAMP}`;
const NOW = new Date();
// The new path reckons the school's own day (C1b), and these schools keep Asia/Kolkata's; the old path keeps the UTC day.
const today = todayKey("Asia/Kolkata", NOW);
const day = (offset: number) => addDaysToKey(today, offset);
const utcToday = NOW.toISOString().slice(0, 10);
let operatorUserId = "";
let n = 0;
/** The tier plans this run made, removed after only if no school is on them (the house pattern). */
const tiersMade: string[] = [];
/** D1: a tier's plan is this run's to remove only when this run's own operator wrote its creation (createPlan audits it). */
async function claimTierIfMade(code: string) {
  const plan = await db.plan.findUnique({ where: { code }, select: { id: true } });
  if (!plan) return;
  const ours = await db.auditLog.count({ where: { action: "superuser.plan.create", targetId: plan.id, actorUserId: operatorUserId } });
  if (ours > 0 && !tiersMade.includes(plan.id)) tiersMade.push(plan.id);
}

async function operator(): Promise<ActiveContext> {
  __resetCookies();
  await createSession(operatorUserId);
  return (await getSession())!;
}
function body(extra: Partial<OperatorOnboardBody> = {}): OperatorOnboardBody {
  n += 1;
  return { name: `${PREFIX} ${n}`, contactEmail: `zz-premium-onb-${n}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", trial: false, adminEmail: `zz-premium-onb-admin-${n}-${STAMP}@test.invalid`, ...extra } as OperatorOnboardBody;
}
async function made(result: Awaited<ReturnType<typeof onboardSchool>>) {
  if (!("schoolId" in result)) throw new Error(`refused: ${JSON.stringify(result)}`);
  return db.school.findUniqueOrThrow({
    where: { id: result.schoolId },
    select: { subscriptionStatus: true, subscriptionStartsAt: true, subscriptionDueAt: true, termsSetAt: true, premiumStudents: true, premiumTeachers: true, subscriptionPricePaise: true, subscriptionDiscountBps: true, premiumPricePaise: true, premiumDiscountBps: true },
  });
}
const keyOf = (d: Date | null) => d?.toISOString().slice(0, 10) ?? null;

beforeAll(async () => {
  operatorUserId = (await db.user.create({ data: { name: `${PREFIX} Operator`, email: `zz-premium-onb-operator-${STAMP}@test.invalid`, isSuperuser: true }, select: { id: true } })).id;
});

afterAll(async () => {
  __resetCookies();
  const schools = (await db.school.findMany({ where: { name: { startsWith: PREFIX } }, select: { id: true } })).map((s) => s.id);
  await db.session.deleteMany({ where: { userId: operatorUserId } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { targetId: { in: schools } }, { actorUserId: operatorUserId }] } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  if (tiersMade.length) await db.plan.deleteMany({ where: { id: { in: tiersMade }, schools: { none: {} } } });
  await db.outboundEmail.deleteMany({ where: { to: { contains: `-${STAMP}@test.invalid` } } });
  await db.user.deleteMany({ where: { OR: [{ id: operatorUserId }, { email: { contains: `-${STAMP}@test.invalid` } }] } });
  await db.$disconnect();
});

// First, before any case below makes a tier's plan on a fresh database.
describe("D2 (the second review of phase 6)", () => {
  it("D2: the tier's plan is made in the onboarding's own transaction, so a refusal after it leaves no plan and no school (run where the plan is missing)", async () => {
    const code = "college-autonomous";
    const there = await db.plan.findUnique({ where: { code }, select: { id: true } });
    if (there) return void console.warn(`[premium-onboard] D2 not run: the ${code} plan is already on this database`);
    const ctx = await operator();
    const input = body({ kind: "AUTONOMOUS_COLLEGE", streams: ["ARTS"], tier: code, freeMonths: 6 });
    invite.refuse = true;
    try {
      expect(await onboardSchool(ctx, input, NOW)).toEqual({ ok: false, errorKey: "root.didNotWork" });
    } finally {
      invite.refuse = false;
    }
    expect(await db.plan.count({ where: { code } })).toBe(0);
    expect(await db.school.count({ where: { name: input.name } })).toBe(0);
  });
});

describe("onboarding with the school's terms", () => {
  it("six free months: Trial, renewing six calendar months on, terms set, premium for students as ticked", async () => {
    const row = await made(await onboardSchool(await operator(), body({ freeMonths: 6, premium: { students: true, teachers: false } }), NOW));
    expect({ status: row.subscriptionStatus, starts: keyOf(row.subscriptionStartsAt), due: keyOf(row.subscriptionDueAt), set: row.termsSetAt !== null, students: row.premiumStudents, teachers: row.premiumTeachers }).toEqual({
      status: "TRIAL",
      starts: today,
      due: renewalFrom(today, 6),
      set: true,
      students: true,
      teachers: false,
    });
    expect([row.subscriptionPricePaise, row.subscriptionDiscountBps, row.premiumPricePaise, row.premiumDiscountBps]).toEqual([null, null, null, null]);
  });
  it("no free months: Due, renewing on its first day", async () => {
    const row = await made(await onboardSchool(await operator(), body({ freeMonths: 0 }), NOW));
    expect({ status: row.subscriptionStatus, due: keyOf(row.subscriptionDueAt) }).toEqual({ status: "DUE", due: today });
  });
  it("a typed renewal more than a year on needs its tick; one before today needs its own, and starts Due", async () => {
    const ctx = await operator();
    expect(await onboardSchool(ctx, body({ freeMonths: 6, dueAt: day(400) }), NOW)).toEqual({ ok: false, errorKey: "root.renewalOverAYear" });
    const long = await made(await onboardSchool(ctx, body({ freeMonths: 6, dueAt: day(400), acceptOverAYear: true }), NOW));
    expect({ status: long.subscriptionStatus, due: keyOf(long.subscriptionDueAt) }).toEqual({ status: "TRIAL", due: day(400) });
    expect(await onboardSchool(ctx, body({ freeMonths: 0, startsAt: day(-30), dueAt: day(-5) }), NOW)).toEqual({ ok: false, errorKey: "root.renewalBeforeToday" });
    const late = await made(await onboardSchool(ctx, body({ freeMonths: 0, startsAt: day(-30), dueAt: day(-5), acceptDueNow: true }), NOW));
    expect({ status: late.subscriptionStatus, due: keyOf(late.subscriptionDueAt) }).toEqual({ status: "DUE", due: day(-5) });
    // The new path allows the renewal on the start day, so its refusal says "before the start" (the review of phase 6, 6).
    expect(await onboardSchool(ctx, body({ freeMonths: 6, startsAt: day(10), dueAt: day(5) }), NOW)).toEqual({ ok: false, errorKey: "root.renewalBeforeStart" });
  });
  it("an own discount at onboarding is kept as the school's own; a college has no own price and no teachers' premium", async () => {
    const ctx = await operator();
    const row = await made(await onboardSchool(ctx, body({ subscription: { mode: "OWN_DISCOUNT", discountBps: 2_000 } }), NOW));
    // No free months sent: our offer's, as the platform has saved it or as it starts (the review's D-5: not six assumed).
    const months = (await readOffer()).freeMonths;
    expect({ discount: row.subscriptionDiscountBps, price: row.subscriptionPricePaise, set: row.termsSetAt !== null, due: keyOf(row.subscriptionDueAt) }).toEqual({ discount: 2_000, price: null, set: true, due: renewalFrom(today, months) });
    expect(await onboardSchool(ctx, body({ kind: "COLLEGE", subscription: { mode: "OWN_PRICE", pricePaise: 15_000 } }), NOW)).toEqual({ ok: false, errorKey: "root.termsOwnPriceAtCollege" });
    expect(await onboardSchool(ctx, body({ kind: "COLLEGE", premium: { students: true, teachers: true } }), NOW)).toEqual({ ok: false, errorKey: "root.termsTeachersAtCollege" });
  });
  it("without the new fields, today's rule exactly: a thirty-day trial, terms not set, premium off", async () => {
    const row = await made(await onboardSchool(await operator(), body({ trial: true }), NOW));
    expect({ status: row.subscriptionStatus, due: keyOf(row.subscriptionDueAt), set: row.termsSetAt, students: row.premiumStudents }).toEqual({ status: "TRIAL", due: addDaysToKey(utcToday, 30), set: null, students: false });
  });
  it("a renewal typed as today, with the start before it, needs the Due now tick too (§2.5: on or before today)", async () => {
    const ctx = await operator();
    expect(await onboardSchool(ctx, body({ freeMonths: 0, startsAt: day(-30), dueAt: today }), NOW)).toEqual({ ok: false, errorKey: "root.renewalBeforeToday" });
    const row = await made(await onboardSchool(ctx, body({ freeMonths: 0, startsAt: day(-30), dueAt: today, acceptDueNow: true }), NOW));
    expect({ status: row.subscriptionStatus, due: keyOf(row.subscriptionDueAt) }).toEqual({ status: "DUE", due: today });
    // Starting today with no free months: owed from the first day, and no tick is asked.
    expect((await made(await onboardSchool(ctx, body({ freeMonths: 0 }), NOW))).subscriptionStatus).toBe("DUE");
  });
  it("the new path reckons the school's own day (C1b): at 02:00 on 22 November in Kolkata, 20:30 UTC on the 21st, no free months start and fall due on the 22nd; the old path keeps the UTC day", async () => {
    const ctx = await operator();
    const pinned = new Date("2026-11-21T20:30:00.000Z");
    const row = await made(await onboardSchool(ctx, body({ freeMonths: 0 }), pinned));
    expect({ status: row.subscriptionStatus, starts: keyOf(row.subscriptionStartsAt), due: keyOf(row.subscriptionDueAt) }).toEqual({ status: "DUE", starts: "2026-11-22", due: "2026-11-22" });
    const old = await made(await onboardSchool(ctx, body({ trial: true }), pinned));
    expect({ starts: keyOf(old.subscriptionStartsAt), due: keyOf(old.subscriptionDueAt) }).toEqual({ starts: "2026-11-21", due: "2026-12-21" });
  });
});

describe("phase 6: a college's tier at onboarding, and the action's own parse", () => {
  it("a college goes on its tier: the tier's plan is found, or made in the onboarding's own transaction when there is none; refused at a school, where the tier does not suit the kind, or beside a plan", async () => {
    const ctx = await operator();
    const before = await db.plan.findUnique({ where: { code: "college-autonomous" }, select: { id: true } });
    const result = await onboardSchool(ctx, body({ kind: "AUTONOMOUS_COLLEGE", streams: ["ARTS"], tier: "college-autonomous", freeMonths: 6 }), NOW);
    if (!("schoolId" in result)) throw new Error(`refused: ${JSON.stringify(result)}`);
    const school = await db.school.findUniqueOrThrow({ where: { id: result.schoolId }, select: { plan: { select: { id: true, code: true } } } });
    expect(school.plan?.code).toBe("college-autonomous");
    await claimTierIfMade("college-autonomous");
    if (before) expect(school.plan!.id).toBe(before.id);
    expect(await onboardSchool(ctx, body({ kind: "SCHOOL", tier: "college-affiliated", freeMonths: 6 }), NOW)).toEqual({ ok: false, errorKey: "operatorCollege.refuseTierNotCollege" });
    expect(await onboardSchool(ctx, body({ kind: "AUTONOMOUS_COLLEGE", streams: ["ARTS"], tier: "college-affiliated", freeMonths: 6 }), NOW)).toEqual({ ok: false, errorKey: "operatorCollege.refuseTierKind" });
    expect(await onboardSchool(ctx, body({ kind: "COLLEGE", streams: ["ARTS"], tier: "college-affiliated", planId: school.plan!.id, freeMonths: 6 }), NOW)).toEqual({ ok: false, errorKey: "root.tierOrPlan" });
  });

  it("the action parses the body with the door's contract: a malformed body is refused with the form's sentence, never thrown", async () => {
    await operator();
    const t = translator("en");
    expect(await onboardSchoolAction({ name: 5 } as never)).toEqual({ ok: false, error: t("root.onboardInvalid") });
  });

  it("the parse keeps onboarding's own refusals (the review of phase 6, 1): a field the contract refuses is told in the sentence onboarding gives for it, not the form's catch-all", async () => {
    await operator();
    const t = translator("en");
    const newPartner = (percentTenths: number) => ({ newPartner: { name: "ZZ Partner", percentTenths, phone: null, email: null, notes: "" } });
    expect(await onboardSchoolAction(body({ commission: newPartner(1500) } as Partial<OperatorOnboardBody>))).toEqual({ ok: false, error: t("root.partnerPercentInvalid") });
    expect(await onboardSchoolAction(body({ kind: "COLLEGE", streams: ["ARTS"], aisheCode: "C-12" } as Partial<OperatorOnboardBody>))).toEqual({ ok: false, error: t("college.profileCheck") });
    expect(await onboardSchoolAction(body({ slug: "Not A Slug!" } as Partial<OperatorOnboardBody>))).toEqual({ ok: false, error: t("root.slugHint") });
    expect(await onboardSchoolAction(body({ startsAt: "21/11/2026" } as Partial<OperatorOnboardBody>))).toEqual({ ok: false, error: t("root.subscriptionDayNotReal") });
    expect(await onboardSchoolAction(body({ subscription: { mode: "OWN_PRICE", pricePaise: 2_000_000 } }))).toEqual({ ok: false, error: t("subs.invalid") });
  });
});

describe("phase 6: the onboarding preview (§2.5's summary) writes nothing and reckons as onboarding does", () => {
  afterEach(() => setActivePlansForTests([]));

  it("its dates, status and figures are what onboarding then writes and the terms then read; the preview itself writes nothing", async () => {
    const ctx = await operator();
    setActivePlansForTests(["STUDENT"]);
    const cases: Partial<OperatorOnboardBody>[] = [
      { freeMonths: 6, premium: { students: true, teachers: false } },
      { freeMonths: 0, subscription: { mode: "OWN_PRICE", pricePaise: 12_000 } },
      { freeMonths: 0, startsAt: day(-30), dueAt: day(-5), acceptDueNow: true },
      { dueAt: day(240), subscription: { mode: "OWN_DISCOUNT", discountBps: 2_000 }, premium: { students: true, teachers: true, terms: { mode: "OWN_PRICE", pricePaise: 6_000 } } },
      { kind: "COLLEGE", streams: ["ARTS"], tier: "college-affiliated", freeMonths: 3, subscription: { mode: "OWN_DISCOUNT", discountBps: 1_000 } },
    ];
    for (const extra of cases) {
      const input = body(extra);
      const audits = await db.auditLog.count({ where: { actorUserId: operatorUserId } });
      const said = await previewOnboarding(ctx, input, NOW);
      if (!said.ok) throw new Error(`refused: ${JSON.stringify(said)}`);
      expect(await db.school.count({ where: { name: input.name } })).toBe(0);
      expect(await db.auditLog.count({ where: { actorUserId: operatorUserId } })).toBe(audits);
      const result = await onboardSchool(ctx, input, NOW);
      const row = await made(result);
      if (!("schoolId" in result)) throw new Error("refused");
      if (extra.tier) await claimTierIfMade(extra.tier);
      const terms = await readSchoolTerms(ctx, result.schoolId, NOW);
      if (!("schoolId" in terms)) throw new Error("no terms");
      const p = said.preview;
      expect({ status: p.status, starts: p.startsOn, due: p.renewsOn, subscription: p.subscription, premium: p.premium, billed: p.premiumBilled, waits: p.premiumWaitsFor }).toEqual({
        status: row.subscriptionStatus,
        starts: keyOf(row.subscriptionStartsAt),
        due: keyOf(row.subscriptionDueAt),
        subscription: terms.subscriptionFigure,
        premium: terms.premiumFigure,
        billed: terms.premiumBilled,
        waits: terms.premiumWaitsFor,
      });
    }
  });

  it("the ticks a renewal needs, the free months a typed renewal gives, and each refusal under its field", async () => {
    const ctx = await operator();
    const over = await previewOnboarding(ctx, body({ dueAt: day(400) }), NOW);
    expect(over.ok && over.preview.asks).toEqual({ overAYear: true, dueNow: false });
    const late = await previewOnboarding(ctx, body({ startsAt: day(-30), dueAt: day(-5) }), NOW);
    expect(late.ok && { asks: late.preview.asks, status: late.preview.status }).toEqual({ asks: { overAYear: false, dueNow: true }, status: "DUE" });
    const typed = await previewOnboarding(ctx, body({ startsAt: "2026-11-21", dueAt: "2027-07-21" }), new Date("2026-11-21T06:00:00.000Z"));
    expect(typed.ok && typed.preview.impliedMonths).toBe(8);
    const chips = await previewOnboarding(ctx, body({ freeMonths: 6 }), NOW);
    expect(chips.ok && { months: chips.preview.impliedMonths, due: chips.preview.renewsOn }).toEqual({ months: null, due: renewalFrom(today, 6) });
    expect(await previewOnboarding(ctx, body({ startsAt: day(10), dueAt: day(5) }), NOW)).toEqual({ ok: false, errorKey: "root.renewalBeforeStart", field: "dueAt" });
    expect(await previewOnboarding(ctx, body({ startsAt: "2026-02-30" }), NOW)).toEqual({ ok: false, errorKey: "root.subscriptionDayNotReal", field: "startsAt" });
    expect(await previewOnboarding(ctx, body({ kind: "COLLEGE", subscription: { mode: "OWN_PRICE", pricePaise: 15_000 } }), NOW)).toEqual({ ok: false, errorKey: "root.termsOwnPriceAtCollege", field: "subscription" });
    expect(await previewOnboarding(ctx, body({ kind: "COLLEGE", premium: { students: true, teachers: true } }), NOW)).toEqual({ ok: false, errorKey: "root.termsTeachersAtCollege", field: "premium" });
    expect(await previewOnboarding(ctx, body({ kind: "SCHOOL", tier: "college-affiliated" }), NOW)).toEqual({ ok: false, errorKey: "operatorCollege.refuseTierNotCollege", field: "tier" });
    expect(await previewOnboarding(ctx, body({ kind: "AUTONOMOUS_COLLEGE", tier: "college-affiliated" }), NOW)).toEqual({ ok: false, errorKey: "operatorCollege.refuseTierKind", field: "tier" });
  });

  it("premium is billed in the preview only while its plan is asked for (C3)", async () => {
    const ctx = await operator();
    setActivePlansForTests([]);
    const waits = await previewOnboarding(ctx, body({ premium: { students: true, teachers: false } }), NOW);
    expect(waits.ok && { billed: waits.preview.premiumBilled, waits: waits.preview.premiumWaitsFor }).toEqual({ billed: false, waits: ["STUDENT"] });
    setActivePlansForTests(["STUDENT"]);
    const billed = await previewOnboarding(ctx, body({ premium: { students: true, teachers: false } }), NOW);
    expect(billed.ok && { billed: billed.preview.premiumBilled, waits: billed.preview.premiumWaitsFor }).toEqual({ billed: true, waits: [] });
  });

  it("the action words the summary from the preview, with the school's name (asked only once one is typed), and refuses by field", async () => {
    await operator();
    const t = translator("en");
    const said = await onboardPreviewAction({ name: "ZZ Sunrise", kind: "SCHOOL", timezone: "Asia/Kolkata", freeMonths: 6, subscription: { mode: "OWN_PRICE", pricePaise: 12_000 }, premium: { students: false, teachers: false } });
    // Today as the action reckons it, read when the case runs, not when the file loaded (the second review's D4).
    expect(said).toMatchObject({ ok: true, status: "TRIAL", renewsOn: renewalFrom(todayKey("Asia/Kolkata", new Date()), 6), asks: { overAYear: false, dueNow: false } });
    expect(said.ok && said.sentence).toContain("ZZ Sunrise pays ₹120 a student a year for Shalaghar, held at ₹120 whatever your price does.");
    expect(said.ok && said.sentence).toContain("Premium add-on: off.");
    // No name, no summary: a stand-in name would break the Hindi and Marathi sentences it sits in (the review of phase 6, 5).
    expect(await onboardPreviewAction({ kind: "SCHOOL", timezone: "Asia/Kolkata", freeMonths: 6, subscription: { mode: "OWN_PRICE", pricePaise: 12_000 } })).toEqual({ ok: false, error: t("root.onboardInvalid") });
    expect(await onboardPreviewAction({ name: "ZZ Sunrise", kind: "SCHOOL", timezone: "Asia/Kolkata", startsAt: day(10), dueAt: day(5) })).toEqual({ ok: false, error: t("root.renewalBeforeStart"), field: "dueAt" });
    expect(await onboardPreviewAction({ kind: 5 })).toEqual({ ok: false, error: t("root.onboardInvalid") });
    // A figure the contract refuses (over ₹10,000 a student a year) is shown under its part, in the figures' own sentence.
    expect(await onboardPreviewAction({ name: "ZZ Sunrise", kind: "SCHOOL", timezone: "Asia/Kolkata", subscription: { mode: "OWN_PRICE", pricePaise: 2_000_000 } })).toEqual({ ok: false, error: t("subs.invalid"), field: "subscription" });
    expect(await onboardPreviewAction({ name: "ZZ Sunrise", kind: "SCHOOL", timezone: "Asia/Kolkata", premium: { students: true, teachers: false, terms: { mode: "OWN_DISCOUNT", discountBps: 20_000 } } })).toEqual({ ok: false, error: t("subs.invalid"), field: "premium" });
  });
});

describe("C7: the three forms the browser case presses, saved through the action, write what their summary said", () => {
  // The browser case (e2e/onboard-submit-body.spec.ts) reads that the click's body is the summary's; this saves the same
  // bodies (e2e/onboard-forms.ts, the school's today passed in) and reads back that the saved terms word the same summary.
  for (const form of ONBOARD_FORMS) {
    it(form.title, async () => {
      const ctx = await operator();
      const offer = await readOffer();
      const body = onboardFormBody(form.name, {
        day: todayKey("Asia/Kolkata", new Date()),
        freeMonths: offer.freeMonths,
        name: `${PREFIX} c7 ${form.name}`,
        contactEmail: `zz-premium-onb-c7-${form.name}-${STAMP}@test.invalid`,
        adminEmail: `zz-premium-onb-c7-admin-${form.name}-${STAMP}@test.invalid`,
      });
        const said = await onboardPreviewAction({
        name: body.name,
        kind: body.kind,
        timezone: body.timezone,
        startsAt: body.startsAt,
        ...(body.dueAt ? { dueAt: body.dueAt } : { freeMonths: body.freeMonths }),
        subscription: body.subscription,
        premium: body.premium,
        ...(body.tier ? { tier: body.tier } : {}),
      });
      if (!said.ok) throw new Error(`refused: ${said.error}`);
      const saved = await onboardSchoolAction(body);
      if (!saved.ok || !saved.schoolId) throw new Error(`refused: ${saved.error}`);
      if (body.tier) await claimTierIfMade(body.tier);
      const terms = await readSchoolTerms(ctx, saved.schoolId, new Date());
      if (!("schoolId" in terms)) throw new Error("no terms");
      expect({ status: terms.status, renewsOn: terms.renewsOn }).toEqual({ status: said.status, renewsOn: said.renewsOn });
      const worded = onboardSentence(await consoleFmt(), {
        school: body.name,
        subscription: terms.subscriptionFigure,
        premium: { students: terms.premiumStudents, teachers: terms.premiumTeachers, figure: terms.premiumFigure, billed: terms.premiumBilled, waitsFor: terms.premiumWaitsFor },
        startsOn: terms.startsOn!,
        renewsOn: terms.renewsOn!,
        status: terms.status === "DUE" ? "DUE" : "TRIAL",
        // Said back only where whole (C7.3): 400 days on is not.
        impliedMonths: body.dueAt && renewalFrom(body.startsAt!, freeMonthsImplied(body.startsAt!, body.dueAt) ?? -1) === body.dueAt ? freeMonthsImplied(body.startsAt!, body.dueAt) : null,
      });
      expect(worded).toBe(said.sentence);
    });
  }
});

describe("the second review of phase 6 (review-phases-6-8-2026-11-22.md)", () => {
  it("C7.3: a typed renewal's free months are said back only where they are whole; W-2: a timezone that is no zone is refused under its field", async () => {
    const ctx = await operator();
    const pinned = new Date("2026-11-21T06:00:00.000Z");
    const whole = await previewOnboarding(ctx, body({ startsAt: "2026-11-21", dueAt: "2027-07-21" }), pinned);
    expect(whole.ok && whole.preview.impliedMonths).toBe(8);
    const part = await previewOnboarding(ctx, body({ startsAt: "2026-11-21", dueAt: "2027-07-25" }), pinned);
    expect(part.ok && part.preview.impliedMonths).toBe(null);
    const startDay = await previewOnboarding(ctx, body({ startsAt: "2026-11-21", dueAt: "2026-11-21" }), pinned);
    expect(startDay.ok && startDay.preview.impliedMonths).toBe(0);
    expect(await previewOnboarding(ctx, body({ timezone: "Mars/Phobos" }), pinned)).toEqual({ ok: false, errorKey: "refusal.timezoneUnknown", field: "timezone" });
  });

  it("A2: a share that is not a number gets the share's own sentence; C5: a refusal of the terms names its field", async () => {
    await operator();
    const t = translator("en");
    const share = { newPartner: { name: "ZZ Partner", percentTenths: Number.NaN, phone: null, email: null, notes: "" } };
    expect(await onboardSchoolAction(body({ commission: share } as Partial<OperatorOnboardBody>))).toEqual({ ok: false, error: t("root.partnerPercentInvalid") });
    expect(await onboardSchoolAction(body({ freeMonths: 6, dueAt: day(400) }))).toEqual({ ok: false, error: t("root.renewalOverAYear"), field: "dueAt" });
    expect(await onboardSchoolAction(body({ kind: "COLLEGE", streams: ["ARTS"], premium: { students: true, teachers: true } }))).toEqual({ ok: false, error: t("root.termsTeachersAtCollege"), field: "premium" });
  });

});

describe("C7.8 (C7a point 1): the look before a second send finds the school an unanswered request would have made, and nothing else", () => {
  /** A school made here directly, with its first administrator's invitation, at a moment of the case's choosing. */
  async function schoolWithInvite(name: string, email: string, extra: { removedAt?: Date } = {}) {
    n += 1;
    const school = await db.school.create({
      data: { name, slug: `zz-premium-onb-look-${n}-${STAMP}`, code: `ZL${String(STAMP).slice(-5)}${n}`, contactEmail: `zz-premium-onb-look-${n}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", ...extra },
      select: { id: true },
    });
    await db.invite.create({ data: { schoolId: school.id, role: "ADMIN", email, tokenHash: `zz-look-${n}-${STAMP}`, expiresAt: new Date(Date.now() + 86_400_000) } });
    return school.id;
  }

  it("the school that request made, made since the form was opened, is found by its name (trimmed, case aside) and its administrator's invitation (lower-cased), whatever became of the invitation; the question writes nothing", async () => {
    const ctx = await operator();
    const since = new Date(Date.now() - 1_000).toISOString();
    const input = body({ freeMonths: 6 });
    const result = await onboardSchool(ctx, input, NOW);
    if (!("schoolId" in result)) throw new Error(JSON.stringify(result));
    // Counted over this suite's own rows (the review of 07d594f3, L4 and R5): another run's battery moves the rest.
    const mine = () => Promise.all([db.auditLog.count({ where: { OR: [{ actorUserId: operatorUserId }, { targetId: result.schoolId }, { schoolId: result.schoolId }] } }), db.school.count({ where: { name: { startsWith: PREFIX } } }), db.invite.count({ where: { schoolId: result.schoolId } })]);
    const before = await mine();
    const look = await lookForOnboarded(ctx, { since, name: `  ${input.name.toUpperCase()} `, adminEmail: ` ${input.adminEmail.toUpperCase()}` });
    expect(look).toEqual({ ok: true, found: { id: result.schoolId, name: input.name } });
    // Whatever became of the invitation: accepted or revoked, it was made at that address.
    await db.invite.updateMany({ where: { schoolId: result.schoolId }, data: { status: "REVOKED" } });
    expect(await lookForOnboarded(ctx, { since, name: input.name, adminEmail: input.adminEmail })).toEqual({ ok: true, found: { id: result.schoolId, name: input.name } });
    expect(await mine()).toEqual(before);
  });

  it("not found: one of that name made before the form was opened; one made since whose administrator was invited at another address; one made since and then removed", async () => {
    const ctx = await operator();
    const before = `${PREFIX} Look Before`;
    await schoolWithInvite(before, `zz-look-before-${STAMP}@test.invalid`);
    const since = new Date(Date.now() + 1).toISOString();
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(await lookForOnboarded(ctx, { since, name: before, adminEmail: `zz-look-before-${STAMP}@test.invalid` })).toEqual({ ok: true, found: null });
    const other = `${PREFIX} Look Other`;
    await schoolWithInvite(other, `zz-look-someone-else-${STAMP}@test.invalid`);
    expect(await lookForOnboarded(ctx, { since, name: other, adminEmail: `zz-look-other-${STAMP}@test.invalid` })).toEqual({ ok: true, found: null });
    const removed = `${PREFIX} Look Removed`;
    await schoolWithInvite(removed, `zz-look-removed-${STAMP}@test.invalid`, { removedAt: new Date() });
    expect(await lookForOnboarded(ctx, { since, name: removed, adminEmail: `zz-look-removed-${STAMP}@test.invalid` })).toEqual({ ok: true, found: null });
  });

  it("the operator's own action: it answers what the look found; a caller who is not the operator is refused in the server's sentence", async () => {
    await operator();
    const since = new Date(Date.now() - 1_000).toISOString();
    expect(await onboardLookAction({ since, name: `${PREFIX} Nobody`, adminEmail: `zz-look-nobody-${STAMP}@test.invalid` })).toEqual({ ok: true, found: null });
    // A moment that is not one, or no name, is refused with no sentence (the form then says the first sentence and sends
    // nothing), never answered "none", which would let the form send.
    expect(await onboardLookAction({ since: "yesterday", name: `${PREFIX} Nobody`, adminEmail: `zz-look-nobody-${STAMP}@test.invalid` })).toEqual({ ok: false, error: null });
    expect(await onboardLookAction({ since, name: "  ", adminEmail: `zz-look-nobody-${STAMP}@test.invalid` })).toEqual({ ok: false, error: null });
    const teacher = await db.user.create({ data: { name: `${PREFIX} Not operator`, email: `zz-premium-onb-notop-${STAMP}@test.invalid` }, select: { id: true } });
    __resetCookies();
    await createSession(teacher.id);
    const refused = await onboardLookAction({ since, name: `${PREFIX} Nobody`, adminEmail: `zz-look-nobody-${STAMP}@test.invalid` });
    expect(refused.ok).toBe(false);
    expect(!refused.ok && refused.error).toBeTruthy();
  });
});

describe("an error the server only caught (the coordinating session's review of 07d594f3, L3)", () => {
  it("is neither a refusal nor a save: answered as not known, in its own sentence, and marked so the form keeps what it sent and looks first; a refusal is unmarked", async () => {
    await operator();
    const t = translator("en");
    const input = body({ freeMonths: 6 });
    invite.throws = true;
    try {
      expect(await onboardSchoolAction(input)).toEqual({ ok: false, error: t("root.onboardUnknown"), unknown: true });
    } finally {
      invite.throws = false;
    }
    // The throw came inside onboarding's own transaction, so here nothing was made; the form cannot know that, and looks.
    expect(await db.school.count({ where: { name: input.name } })).toBe(0);
    const refused = await onboardSchoolAction(body({ freeMonths: 6, dueAt: day(400) }));
    expect(refused).toEqual({ ok: false, error: t("root.renewalOverAYear"), field: "dueAt" });
    expect("unknown" in refused).toBe(false);
  });
});

