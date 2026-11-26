/**
 * The subscription console's server actions (decision 0010; the brief's §2.1 to §2.4 and rule 12; phase 5). Each re-asserts
 * the operator, parses the door's own contract, calls the door's library, and words the answer: a preview writes nothing and
 * answers the sentence the toast or the sheet shows; a save writes against the terms as read and answers what was done.
 *
 * As the database's owner (tests/setup.ts), on ZZ schools, a ZZ partner and ZZ people of this suite's own, removed after. Our
 * offer, the platform's one row, is only ever previewed here (a preview writes nothing; tests/suite-offer.ts guards the suites
 * that save it). The plans asked for are named per case (setActivePlansForTests); none is asked for otherwise.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { paysPaise } from "@edulink/contracts";
import { formatPaise } from "@edulink/i18n";
import { createSession, getSession } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { setActivePlansForTests } from "@/lib/person-plans";
import { groupsOf, lastTermsChange, listSubscriptions, readOffer, readSchoolTerms, schoolDay, totalsOf, updateOffer } from "@/lib/school-terms";
import { formatDateKey, todayKey } from "@/lib/dates";
import { translator } from "@/lib/i18n/dictionary";
import { bulkAction, offerAction, paymentAction, premiumSwitchAction, termsAction } from "@/app/root/subscriptions/actions";

// A suite has no request for Next to revalidate in; the house stub (as tests/api-v1-office.test.ts).
vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));
// The library as it is, but for the school's day, which is the real one unless a case makes it fail once.
vi.mock("@/lib/school-terms", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/school-terms")>();
  return { ...real, schoolDay: vi.fn(real.schoolDay) };
});

const db = new PrismaClient();
const STAMP = Date.now();
const DAY = 86_400_000;
const MONTH = new Date().toISOString().slice(0, 7);
const email = (who: string) => `zz-sub-actions-${who}-${STAMP}@test.invalid`;
const school: Record<string, string> = {};
const people: string[] = [];
let operator = "";
let stranger = "";
let partner = "";
const day = (key: string) => formatDateKey(key, { day: "numeric", month: "short", year: "numeric" }, "en");
const money = (paise: number) => formatPaise(paise, "en");
const dayOf = (date: Date) => date.toISOString().slice(0, 10);
const RENEWAL = new Date(`${dayOf(new Date(Date.now() + 180 * DAY))}T00:00:00.000Z`);

async function makeSchool(key: string, data: Record<string, unknown>, pupils: number | null) {
  const n = Object.keys(school).length;
  school[key] = (await db.school.create({
    data: {
      name: `ZZ Sub Actions ${key} ${STAMP}`,
      slug: `zz-sub-actions-${key.toLowerCase()}-${STAMP}`,
      code: `ZSA${n}${String(STAMP).slice(-5)}`,
      contactEmail: email(key.toLowerCase()),
      timezone: "Asia/Kolkata",
      isTestFixture: true,
      subscriptionStatus: "TRIAL",
      subscriptionStartsAt: new Date(Date.now() - 10 * DAY),
      subscriptionDueAt: RENEWAL,
      ...data,
    },
    select: { id: true },
  })).id;
  if (pupils !== null) await db.usageSample.create({ data: { schoolId: school[key]!, month: MONTH, pupils, messages: 0, storageMb: 0, activeUsers: 0 } });
}

async function as(userId: string) {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, {});
  return getSession();
}

/** The terms as read, as the sheet sends them back (`expect`). */
async function expectOf(key: string) {
  const ctx = await getSession();
  const terms = await readSchoolTerms(ctx as never, school[key]!);
  if ("ok" in terms) throw new Error("no terms");
  return { termsSetAt: terms.termsSetAt, premiumStudents: terms.premiumStudents, premiumTeachers: terms.premiumTeachers, subscription: terms.subscription, premium: terms.premium, note: terms.note };
}

beforeAll(async () => {
  // What a run of this suite killed before its clean-up left, of its own naming, is removed first: only rows old enough to
  // be leftovers (an hour), never another run's in flight (the review of phase 5, D7).
  const stale = new Date(Date.now() - 60 * 60_000);
  const leftSchools = (await db.school.findMany({ where: { slug: { startsWith: "zz-sub-actions-" }, createdAt: { lt: stale } }, select: { id: true } })).map((s) => s.id);
  const leftPeople = (await db.user.findMany({ where: { email: { startsWith: "zz-sub-actions-", endsWith: "@test.invalid" }, createdAt: { lt: stale } }, select: { id: true } })).map((u) => u.id);
  if (leftSchools.length || leftPeople.length) {
    await db.notification.deleteMany({ where: { userId: { in: leftPeople } } });
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: leftSchools } }, { actorUserId: { in: leftPeople } }] } });
    await db.session.deleteMany({ where: { userId: { in: leftPeople } } });
    await db.membership.deleteMany({ where: { OR: [{ schoolId: { in: leftSchools } }, { userId: { in: leftPeople } }] } });
    await db.usageSample.deleteMany({ where: { schoolId: { in: leftSchools } } });
    await db.school.deleteMany({ where: { id: { in: leftSchools } } });
    await db.user.deleteMany({ where: { id: { in: leftPeople } } });
  }
  await db.commissionPartner.deleteMany({ where: { name: { startsWith: "ZZ Sub Actions Partner " }, createdAt: { lt: stale }, schools: { none: {} } } });
  operator = (await db.user.create({ data: { name: "ZZ Sub Actions Operator", email: email("operator"), isSuperuser: true, isTestFixture: true }, select: { id: true } })).id;
  stranger = (await db.user.create({ data: { name: "ZZ Sub Actions Office", email: email("office"), isTestFixture: true }, select: { id: true } })).id;
  people.push(operator, stranger);
  partner = (await db.commissionPartner.create({ data: { name: `ZZ Sub Actions Partner ${STAMP}`, percentTenths: 100 }, select: { id: true } })).id;
  // Own 20 % off ours, premium off, terms set, free until its renewal, 412 pupils: the brief's ZZ Banyan.
  await makeSchool("Banyan", { termsSetAt: new Date(Date.now() - 5 * DAY), subscriptionDiscountBps: 2_000 }, 412);
  // Terms not set, a partner, paid up (Active): the terms sheet's partner line (C2b).
  await makeSchool("NotSet", { subscriptionStatus: "ACTIVE", commissionPartnerId: partner }, 120);
  // Terms set on ours, Active: record payment.
  await makeSchool("Pay", { termsSetAt: new Date(Date.now() - 5 * DAY), subscriptionStatus: "ACTIVE" }, 100);
  await db.membership.create({ data: { userId: stranger, schoolId: school.Banyan!, role: "ADMIN", status: "ACTIVE" } });
});

afterEach(() => setActivePlansForTests([]));

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  const schools = Object.values(school);
  await db.notification.deleteMany({ where: { userId: { in: people } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { actorUserId: { in: people } }] } });
  await db.session.deleteMany({ where: { userId: { in: people } } });
  await db.membership.deleteMany({ where: { schoolId: { in: schools } } });
  await db.usageSample.deleteMany({ where: { schoolId: { in: schools } } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.commissionPartner.deleteMany({ where: { id: partner } });
  await db.user.deleteMany({ where: { id: { in: people } } });
  await db.$disconnect();
});

describe("only the operator", () => {
  it("anybody else is refused by every action with the access sentence itself, on bodies the operator's would pass, and nothing is written (the review, D1, D2)", async () => {
    // The bodies as the operator would send them: the terms as read, the bill as the amount, the offer as read.
    await as(operator);
    const asRead = await expectOf("Banyan");
    const payTerms = await readSchoolTerms((await getSession()) as never, school.Pay!);
    const billPaise = "ok" in payTerms ? 1 : (payTerms.bill?.totalPaise ?? 1);
    const offer = await readOffer();
    await as(stranger);
    const refused = { ok: false, error: translator("en")("access.thisAreaBelongsToWhoeverRunsThe") };
    const { note: _note, ...seen } = asRead;
    void _note;
    expect(await termsAction(school.Banyan!, { premium: { students: true }, expect: asRead, preview: true })).toEqual(refused);
    expect(await premiumSwitchAction(school.Banyan!, { role: "students", on: true, seen, preview: true })).toEqual(refused);
    expect(await paymentAction(school.Pay!, { fromStatus: "ACTIVE", fromDueAt: dayOf(RENEWAL), paidOn: dayOf(new Date()), amountPaise: billPaise, preview: true })).toEqual(refused);
    expect(
      await offerAction({ subscription: { pricePaise: offer.subscriptionPricePaise, discountBps: offer.subscriptionDiscountBps }, premium: { pricePaise: offer.premiumPricePaise, discountBps: offer.premiumDiscountBps }, freeMonths: offer.freeMonths, studentsByDefault: offer.studentsByDefault, teachersByDefault: offer.teachersByDefault, reason: "x", expect: { updatedAt: offer.updatedAt?.toISOString() ?? null }, preview: true }),
    ).toEqual(refused);
    expect(await bulkAction({ schoolIds: [school.Pay!], action: "STUDENTS_ON" })).toEqual(refused);
    expect(await db.school.findUniqueOrThrow({ where: { id: school.Pay! }, select: { premiumStudents: true, subscriptionDueAt: true } })).toEqual({ premiumStudents: false, subscriptionDueAt: RENEWAL });
  });
});

describe("the Schools tab's switch (premiumSwitchAction; the review, D2)", () => {
  it("compares and sets on the terms the row showed: a row gone stale is refused by name and marked stale, so the list draws itself again", async () => {
    await as(operator);
    const { note: _note, ...seen } = await expectOf("Pay");
    void _note;
    const fresh = await premiumSwitchAction(school.Pay!, { role: "students", on: true, seen, preview: true });
    expect(fresh).toMatchObject({ ok: true, changed: true });
    // The row showed premium for students on; it is off.
    expect(await premiumSwitchAction(school.Pay!, { role: "students", on: false, seen: { ...seen, premiumStudents: true }, preview: true })).toEqual({
      ok: false,
      error: "This school's terms were changed while this was open. Look at them again, then save.",
      stale: true,
    });
    expect((await db.school.findUniqueOrThrow({ where: { id: school.Pay! }, select: { premiumStudents: true } })).premiumStudents).toBe(false);
  });

  it("a preview answers the terms it was reckoned against, the operator's note included, which a row does not show: a switch the page sends early to the terms door goes with them (C5 point 1; the walk of 22 November 2026)", async () => {
    await as(operator);
    const was = (await db.school.findUniqueOrThrow({ where: { id: school.Pay! }, select: { termsNote: true } })).termsNote;
    await db.school.update({ where: { id: school.Pay! }, data: { termsNote: `ZZ note as read ${STAMP}` } });
    try {
      const asRead = await expectOf("Pay");
      const { note: _note, ...seen } = asRead;
      void _note;
      const preview = await premiumSwitchAction(school.Pay!, { role: "students", on: true, seen, preview: true });
      expect(preview).toMatchObject({ ok: true, changed: true, expect: { ...asRead, note: `ZZ note as read ${STAMP}` } });
      expect((await db.school.findUniqueOrThrow({ where: { id: school.Pay! }, select: { premiumStudents: true } })).premiumStudents).toBe(false);
    } finally {
      await db.school.update({ where: { id: school.Pay! }, data: { termsNote: was } });
    }
  });
});

describe("a school's terms (the switch and the sheets)", () => {
  it("the switch's preview words the brief's toast and writes nothing; its save writes, against the terms as read", async () => {
    await as(operator);
    setActivePlansForTests(["STUDENT"]);
    const offer = await readOffer();
    const premium = paysPaise(offer.premiumPricePaise, offer.premiumDiscountBps);
    const sub = paysPaise(offer.subscriptionPricePaise, 2_000);
    const body = { premium: { students: true }, expect: await expectOf("Banyan") };
    const preview = await termsAction(school.Banyan!, { ...body, preview: true });
    expect(preview).toEqual({
      ok: true,
      changed: true,
      sentence: `ZZ Sub Actions Banyan ${STAMP} gets premium for students now. It is billed from its renewal on ${day(dayOf(RENEWAL))}: ${money(premium)} more a student a year + GST (about ${money(premium * 412)} at last count), on top of its ${money(sub)} subscription. 1 person at the school is told.`,
    });
    expect((await db.school.findUniqueOrThrow({ where: { id: school.Banyan! }, select: { premiumStudents: true } })).premiumStudents).toBe(false);
    const saved = await termsAction(school.Banyan!, body);
    expect(saved).toMatchObject({ ok: true, changed: true });
    expect((await db.school.findUniqueOrThrow({ where: { id: school.Banyan! }, select: { premiumStudents: true } })).premiumStudents).toBe(true);
    // The same save again, its expect now stale: refused by name.
    expect(await termsAction(school.Banyan!, body)).toEqual({ ok: false, error: "This school's terms were changed while this was open. Look at them again, then save.", stale: true });
    // The card's last change, from the operator's own log, on the school's own day (the review, D6 and A5).
    const ctx = (await getSession()) as never;
    expect(await lastTermsChange(ctx, school.Banyan!)).toMatchObject({ what: "PREMIUM_STUDENTS_ON", byUserId: operator, day: todayKey("Asia/Kolkata") });
    expect(await schoolDay(ctx, school.Banyan!)).toBe(todayKey("Asia/Kolkata"));
  });

  it("the terms sheet, first setting the terms at a school with a partner, says what happens to the partner's month (C2b); a note alone is the operator's", async () => {
    await as(operator);
    const preview = await termsAction(school.NotSet!, { subscription: { mode: "OURS" }, expect: await expectOf("NotSet"), preview: true });
    expect(preview.ok).toBe(true);
    if (!preview.ok) return;
    expect(preview.sentence).toContain(`ZZ Sub Actions NotSet ${STAMP} pays`);
    expect(preview.sentence).toContain(`ZZ Sub Actions Partner ${STAMP}'s share is reckoned today on nothing from this school.`);
    expect(preview.sentence).toMatch(/Once these terms are set: on ₹[\d,.]+ a month\./);
    expect((await db.school.findUniqueOrThrow({ where: { id: school.NotSet! }, select: { termsSetAt: true } })).termsSetAt).toBeNull();
    expect(await termsAction(school.NotSet!, { note: "ZZ why", expect: await expectOf("NotSet") })).toEqual({ ok: true, changed: true, sentence: "Your note is saved. Only you see it." });
    expect(await lastTermsChange((await getSession()) as never, school.NotSet!)).toMatchObject({ what: "NOTE", byUserId: operator });
    expect(await termsAction(school.NotSet!, { subscription: { mode: "OWN_PRICE", pricePaise: 12_345 }, expect: await expectOf("NotSet"), preview: true })).toEqual({
      ok: false,
      error: "A price is whole rupees, from ₹1 to ₹10,000 a student a year.",
    });
  });
});

describe("record payment", () => {
  it("the preview says where the renewal moves and from where, names a different amount, and writes nothing; the save needs the tick for a different amount", async () => {
    await as(operator);
    const view = await readSchoolTerms((await getSession()) as never, school.Pay!);
    if ("ok" in view) throw new Error("no terms");
    const bill = view.bill!.totalPaise;
    const body = { fromStatus: "ACTIVE", fromDueAt: dayOf(RENEWAL), paidOn: dayOf(new Date()), amountPaise: bill };
    const next = new Date(RENEWAL);
    next.setUTCFullYear(next.getUTCFullYear() + 1);
    const preview = await paymentAction(school.Pay!, { ...body, preview: true });
    expect(preview).toEqual({ ok: true, changed: false, bill, sentence: `Renewal moves from ${day(dayOf(RENEWAL))} to ${day(dayOf(next))}: the twelve months run from the renewal on record. Status becomes Paid.` });
    const short = await paymentAction(school.Pay!, { ...body, amountPaise: bill - 100_000, preview: true });
    expect(short.ok && short.sentence).toContain(`The amount is ${money(100_000)} less than the bill before GST.`);
    expect((await db.school.findUniqueOrThrow({ where: { id: school.Pay! }, select: { subscriptionDueAt: true } })).subscriptionDueAt).toEqual(RENEWAL);
    expect(await paymentAction(school.Pay!, { ...body, amountPaise: bill - 100_000 })).toEqual({ ok: false, error: "The amount is not the bill. Tick “Record the year as paid in full” to record it anyway." });
    expect(short.ok && short.sentence).toContain("before GST");
    expect(await paymentAction(school.Pay!, { ...body, amountPaise: bill - 100_000, acceptDifference: true })).toMatchObject({ ok: true, changed: true });
    expect(await lastTermsChange((await getSession()) as never, school.Pay!)).toMatchObject({ what: "PAYMENT", byUserId: operator });
    expect(dayOf((await db.school.findUniqueOrThrow({ where: { id: school.Pay! }, select: { subscriptionDueAt: true } })).subscriptionDueAt!)).toBe(dayOf(next));
  });

  it("a save whose read of the school's day fails is answered as not done and writes nothing: the day is read before the payment is written", async () => {
    await as(operator);
    await makeSchool("PayDay", { termsSetAt: new Date(Date.now() - 5 * DAY), subscriptionStatus: "ACTIVE" }, 100);
    const id = school.PayDay!;
    const view = await readSchoolTerms((await getSession()) as never, id);
    if ("ok" in view) throw new Error("no terms");
    const columns = { subscriptionStatus: true, subscriptionDueAt: true, subscriptionPaidAt: true, subscriptionPaidRef: true } as const;
    const before = await db.school.findUniqueOrThrow({ where: { id }, select: columns });
    const since = new Date();
    const calls = vi.mocked(schoolDay).mock.calls.length;
    vi.mocked(schoolDay).mockRejectedValueOnce(new Error("ZZ the school's day could not be read"));
    try {
      const answer = await paymentAction(id, { fromStatus: "ACTIVE", fromDueAt: dayOf(RENEWAL), paidOn: dayOf(new Date()), amountPaise: view.bill!.totalPaise });
      // The failure queued above was met by the action's own read of the day, not left for a later caller.
      expect(vi.mocked(schoolDay).mock.calls.length).toBe(calls + 1);
      expect(answer).toEqual({ ok: false, error: translator("en")("common.tryAgainMoment") });
      expect(await db.school.findUniqueOrThrow({ where: { id }, select: columns })).toEqual(before);
      expect(await db.auditLog.count({ where: { action: "superuser.school.subscription", targetId: id, createdAt: { gte: since } } })).toBe(0);
    } finally {
      // The real reading again, and nothing left queued whatever happened above (vitest 3: vi.fn's own implementation).
      vi.mocked(schoolDay).mockReset();
    }
  });
});

describe("our offer, previewed only", () => {
  it("Review change words rule 9's sentence and writes nothing; a missing reason is named", async () => {
    await as(operator);
    const offer = await readOffer();
    const row = await db.schoolOffer.findUnique({ where: { id: "offer" }, select: { updatedAt: true } });
    const body = {
      subscription: { pricePaise: offer.subscriptionPricePaise, discountBps: offer.subscriptionDiscountBps },
      premium: { pricePaise: offer.premiumPricePaise, discountBps: offer.premiumDiscountBps },
      freeMonths: offer.freeMonths === 3 ? 6 : 3,
      studentsByDefault: offer.studentsByDefault,
      teachersByDefault: offer.teachersByDefault,
      reason: "ZZ sub actions preview",
      expect: { updatedAt: offer.updatedAt?.toISOString() ?? null },
      preview: true,
    };
    const preview = await offerAction(body);
    expect(preview.ok).toBe(true);
    if (preview.ok) {
      expect(preview.sentence).toContain(`Free months for a new school: ${body.freeMonths} (was ${offer.freeMonths}).`);
      expect(preview.sentence.endsWith("Nothing is charged.")).toBe(true);
    }
    expect(await db.schoolOffer.findUnique({ where: { id: "offer" }, select: { updatedAt: true } })).toEqual(row);
    expect(await offerAction({ ...body, reason: " " })).toEqual({ ok: false, error: "Give a reason for the change." });
  });
});

describe("a bulk change", () => {
  it("Put on our prices names each school's terms before and writes nothing on a preview; a switch over the chosen schools is saved", async () => {
    await as(operator);
    const preview = await bulkAction({ schoolIds: [school.Banyan!, school.NotSet!], action: "OUR_PRICES", preview: true });
    expect(preview.ok).toBe(true);
    if (preview.ok) {
      expect(preview.sentence).toContain("schools will follow our prices for both parts, their terms set:");
      expect(preview.sentence).toContain(`ZZ Sub Actions Banyan ${STAMP}, from `);
      expect(preview.sentence).toContain("own 20 % off");
    }
    // The partner's month of the school whose terms this first sets (C4a point 9 (iii)).
    expect(preview.ok && preview.sentence).toContain(`At ZZ Sub Actions NotSet ${STAMP}: ZZ Sub Actions Partner ${STAMP}'s share is reckoned today on nothing from this school.`);
    expect((await db.school.findUniqueOrThrow({ where: { id: school.Banyan! }, select: { subscriptionDiscountBps: true } })).subscriptionDiscountBps).toBe(2_000);
    expect(await bulkAction({ schoolIds: [school.Pay!], action: "TEACHERS_ON" })).toEqual({ ok: true, changed: true, sentence: `1 school has premium for teachers now: ZZ Sub Actions Pay ${STAMP}.` });
    expect((await db.school.findUniqueOrThrow({ where: { id: school.Pay! }, select: { premiumTeachers: true } })).premiumTeachers).toBe(true);
  });
});

describe("our offer's preview and the Schools tab's counts (the review of phase 5, A1, A2, A9, B6; C5 point 5)", () => {
  it("not moving counts a school held by its own price on the part that changes, never one that moves; a premium price moving unbilled is counted", async () => {
    await as(operator);
    setActivePlansForTests(["STUDENT"]);
    await makeSchool("OwnSub", { termsSetAt: new Date(Date.now() - 5 * DAY), subscriptionStatus: "ACTIVE", subscriptionPricePaise: 12_000, premiumStudents: true }, 40);
    await makeSchool("OwnPrem", { termsSetAt: new Date(Date.now() - 5 * DAY), subscriptionStatus: "ACTIVE", premiumPricePaise: 4_000 }, 40);
    await makeSchool("Follows", { termsSetAt: new Date(Date.now() - 5 * DAY), subscriptionStatus: "ACTIVE" }, 40);
    const offer = await readOffer();
    const body = {
      subscription: { pricePaise: offer.subscriptionPricePaise, discountBps: offer.subscriptionDiscountBps },
      premium: { pricePaise: offer.premiumPricePaise + 1_000, discountBps: offer.premiumDiscountBps },
      freeMonths: offer.freeMonths,
      studentsByDefault: offer.studentsByDefault,
      teachersByDefault: offer.teachersByDefault,
      reason: "ZZ sub actions counts",
      expect: { updatedAt: offer.updatedAt?.toISOString() ?? null },
      preview: true,
    };
    const ctx = (await getSession()) as never;
    // OwnSub moves on premium (billed, its premium ours), though its subscription is its own price: it is not "not moving".
    const one = await updateOffer(ctx, body, new Date(), { schoolIds: [school.OwnSub!, school.Follows!] });
    if ("ok" in one) throw new Error("refused");
    expect(one.moves.map((m) => [m.schoolId, m.part])).toEqual([[school.OwnSub, "PREMIUM"]]);
    expect(one.unchanged.ownPrice).toBe(0);
    // Follows has premium off, so not billed, and its premium price is ours: it moves, unbilled.
    expect(one.premiumNotBilled).toBe(1);
    // OwnPrem is held by its own premium price on the part that changes.
    const two = await updateOffer(ctx, body, new Date(), { schoolIds: [school.OwnPrem!] });
    if ("ok" in two) throw new Error("refused");
    expect(two.unchanged.ownPrice).toBe(1);
    // The Terms filter's "Own" reads both parts: OwnPrem, own on premium alone, is listed (B6).
    expect((await listSubscriptions(ctx, { q: `ZZ Sub Actions OwnPrem ${STAMP}`, terms: "own" })).rows.map((r) => r.schoolId)).toEqual([school.OwnPrem]);
  });

  it("every count of schools counts the rows shown, test schools included; money leaves them out and names them, and a count with no renewal is said as that", () => {
    const view = (over: Record<string, unknown>) => ({ premiumStudents: false, premiumTeachers: false, termsSet: true, kind: "SCHOOL", subscription: { mode: "OURS" as const }, ...over });
    expect(groupsOf([view({ termsSet: false }), view({ termsSet: false }), view({})]).notSet).toBe(2);
    const running = { termsSet: true, status: "ACTIVE", subscriptionFigure: { paysPaise: 10_000 }, pupils: 40, renewsOn: "2027-05-21", bill: { totalPaise: 400_000 } };
    const totals = totalsOf([
      { view: running as never, fixture: true, closed: false },
      { view: { ...running, renewsOn: null, bill: null } as never, fixture: false, closed: false },
      { view: running as never, fixture: false, closed: false },
    ]);
    expect(totals).toMatchObject({ billedYearPaise: 400_000, countedSchools: 1, notCounted: { test: 1, noRenewal: 1, noCount: 0 } });
  });
});

