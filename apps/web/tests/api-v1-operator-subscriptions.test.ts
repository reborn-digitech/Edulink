/**
 * The school's Shalaghar subscription and the premium add-on, phase 2 (decision 0010 parts 1 to 3; the brief of 21
 * November 2026, version 3): our offer, each school's terms and premium switches, the bulk change, a payment recorded,
 * and the office's read-only card, through their doors and their library (src/lib/school-terms.ts, recordPayment in
 * src/lib/subscriptions.ts). Nothing opens or closes here: premium's cover comes with the gate (phase 4).
 *
 * This suite's own ZZ schools (named with its stamp), each with an office and a head and a newest count of pupils, and
 * a college; an operator and a teacher of its own. Our offer is one platform row: it is read before the suite and put
 * back after it (deleted if there was none), so an interrupted run is the only way to leave it changed. Every clean-up
 * is scoped to this suite's schools and people.
 *
 * Premium is billed only while its plan is asked for (the owner's "Not billed until then", C3 and C3a). No plan is asked
 * for in the suites unless a case names one (setActivePlansForTests), and each case's are dropped after it.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { OFFER_START, PRICE_MAX_PAISE, bulkBodySchema, paysPaise, renewalFrom, type FreeMonths } from "@edulink/contracts";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies } from "../tests/stubs/next-headers";
import { listSubscriptions, readOffer, readSchoolTerms, setSchoolTerms, bulkTerms, updateOffer } from "@/lib/school-terms";
import { addDaysToKey, todayKey } from "@/lib/dates";
import { recordPayment, setSubscription } from "@/lib/subscriptions";
import { setActivePlansForTests } from "@/lib/person-plans";
import { GET as offerGet, PUT as offerPut } from "@/app/api/v1/operator/offer/route";
import { GET as listGet } from "@/app/api/v1/operator/subscriptions/route";
import { POST as bulkPost } from "@/app/api/v1/operator/subscriptions/bulk/route";
import { GET as termsGet, PUT as termsPut } from "@/app/api/v1/operator/schools/[schoolId]/terms/route";
import { POST as paymentPost } from "@/app/api/v1/operator/schools/[schoolId]/payment/route";
import { GET as officeGet } from "@/app/api/v1/office/subscription/route";

const db = new PrismaClient();
const STAMP = Date.now();
const PREFIX = `ZZ Premium ${STAMP}`;
const MONTH = new Date().toISOString().slice(0, 7);
// Days are the schools' own (C1b): every school here keeps Asia/Kolkata's day, so the suite reckons in it too.
const TODAY = todayKey("Asia/Kolkata", new Date());
const day = (offset: number) => addDaysToKey(TODAY, offset);
const at = (key: string) => new Date(`${key}T00:00:00.000Z`);
/**
 * Our offer is the platform's one row. The offer section works from the owner's starting values and writes that row, so
 * it runs only where there is none, removing what it wrote; where the platform has prices of its own it is skipped, and
 * says so. Every other case reckons its figures from the offer as it stands, so it runs either way. A row an interrupted
 * run of this suite left behind (saved by one of its own ZZ operators) is the suite's, and is removed first.
 */
const leftover = await db.schoolOffer.findUnique({ where: { id: "offer" }, select: { updatedByUserId: true } });
const leftBy = leftover?.updatedByUserId ? await db.user.findUnique({ where: { id: leftover.updatedByUserId }, select: { email: true } }) : null;
if (leftBy?.email && /^zz-premium-operator-\d+@test\.invalid$/.test(leftBy.email)) await db.schoolOffer.delete({ where: { id: "offer" } });
const platformOffer = await db.schoolOffer.findUnique({ where: { id: "offer" }, select: { updatedAt: true } });
if (platformOffer) console.warn("[api-v1-operator-subscriptions] the platform's offer is saved on this database: the offer section, which writes that row and assumes the starting values, is skipped");
const offerSection = platformOffer ? describe.skip : describe;
/** What a part pays at our price as it stands: the figures the cases below expect for a school that follows it. */
async function ours() {
  const offer = await readOffer();
  return { offer, subscription: paysPaise(offer.subscriptionPricePaise, offer.subscriptionDiscountBps), premium: paysPaise(offer.premiumPricePaise, offer.premiumDiscountBps) };
}
/** Resolves once a statement on this database that names `table` waits on a lock: the call under test is at its write, behind the held transaction. */
async function blockedOn(table: string): Promise<void> {
  const pattern = `%"${table}"%`;
  for (let i = 0; i < 200; i += 1) {
    const [row] = await db.$queryRaw<{ n: bigint }[]>`SELECT count(*)::bigint AS n FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock' AND query LIKE ${pattern}`;
    if (Number(row?.n ?? 0) > 0) return;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  throw new Error(`nothing waited on "${table}" within five seconds`);
}

const ids = { operator: "", teacher: "", follow: "", discount: "", ownPrice: "", notSet: "", college: "", paused: "", trial: "", due: "", receipted: "", again: "", clock: "", gone: "", zone: "", window: "", pStudents: "", pTeachers: "", pBoth: "", pNotSet: "", pCollege: "", race: "" };
const office: Record<string, string[]> = {};
/** The suite's own schools: our offer's moves and notices are kept to them (updateOffer's scope), never the database's. */
const scope = () => ({ schoolIds: Object.values(ids).filter((id, i) => i >= 2 && id) });

const P = "http://localhost/api/v1";
const get = (path: string) => new Request(`${P}${path}`);
const send = (method: "POST" | "PUT", path: string, body: unknown) => new Request(`${P}${path}`, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const params = (schoolId: string) => ({ params: Promise.resolve({ schoolId }) });

async function as(who: "OPERATOR" | "TEACHER" | "OFFICE", schoolId?: string): Promise<ActiveContext> {
  __resetCookies();
  if (who === "OPERATOR") await createSession(ids.operator);
  else if (who === "TEACHER") await createSession(ids.teacher, { schoolId: ids.follow, role: "TEACHER" });
  else await createSession(office[schoolId!]![0]!, { schoolId: schoolId!, role: "ADMIN" });
  return (await getSession())!;
}

async function school(tag: string, data: Record<string, unknown> = {}, pupils = 412) {
  const suffix = `${STAMP}`.slice(-6) + tag.slice(0, 2).toUpperCase();
  const row = await db.school.create({
    data: { name: `${PREFIX} ${tag}`, slug: `zz-premium-${tag.toLowerCase()}-${STAMP}`, code: `ZP${suffix}`, contactEmail: `zz-premium-${tag.toLowerCase()}-${STAMP}@test.invalid`, timezone: "Asia/Kolkata", ...data },
    select: { id: true },
  });
  await db.usageSample.create({ data: { schoolId: row.id, month: MONTH, pupils, messages: 0, storageMb: 0, activeUsers: 0 } });
  const people: string[] = [];
  for (const role of ["ADMIN", "PRINCIPAL"] as const) {
    const user = await db.user.create({ data: { name: `${PREFIX} ${tag} ${role}`, email: `zz-premium-${tag.toLowerCase()}-${role.toLowerCase()}-${STAMP}@test.invalid` }, select: { id: true } });
    await db.membership.create({ data: { userId: user.id, schoolId: row.id, role, status: "ACTIVE" } });
    people.push(user.id);
  }
  office[row.id] = people;
  return row.id;
}

beforeAll(async () => {
  ids.operator = (await db.user.create({ data: { name: `${PREFIX} Operator`, email: `zz-premium-operator-${STAMP}@test.invalid`, isSuperuser: true }, select: { id: true } })).id;
  const set = { termsSetAt: new Date(), subscriptionStatus: "TRIAL", subscriptionStartsAt: at(day(-10)), subscriptionDueAt: at(day(170)) };
  ids.follow = await school("Follow", { ...set, premiumStudents: true });
  ids.discount = await school("Discount", { ...set, subscriptionDiscountBps: 2_000 });
  ids.ownPrice = await school("OwnPrice", { ...set, subscriptionPricePaise: 12_000 });
  ids.notSet = await school("NotSet", { subscriptionStatus: "ACTIVE", subscriptionStartsAt: at(day(-300)), subscriptionDueAt: at(day(65)) });
  ids.college = await school("College", { ...set, kind: "COLLEGE" }, 900);
  ids.paused = await school("Paused", { ...set, subscriptionStatus: "SUSPENDED" });
  // The correction of a mistaken onboarding (C1): two schools with nothing recorded as paid, as tests/subscriptions.test.ts
  // :187 has one (a trial renewing twenty days on), and two that have paid before.
  ids.trial = await school("Trial", { subscriptionStatus: "TRIAL", subscriptionStartsAt: at(day(-10)), subscriptionDueAt: at(day(20)) });
  ids.due = await school("Due", { subscriptionStatus: "DUE", subscriptionStartsAt: at(day(-40)), subscriptionDueAt: at(day(-3)) });
  ids.receipted = await school("Receipted", { subscriptionStatus: "DUE", subscriptionStartsAt: at(day(-400)), subscriptionDueAt: at(day(-5)), subscriptionPaidAt: at(day(-370)) });
  ids.again = await school("Again", { subscriptionStatus: "TRIAL", subscriptionStartsAt: at(day(-400)), subscriptionDueAt: at(day(30)), subscriptionPaidAt: at(day(-370)) });
  ids.clock = await school("Clock", { subscriptionStatus: "TRIAL", subscriptionStartsAt: at(day(-10)), subscriptionDueAt: at(day(20)) });
  // A school that left, its terms set and following our price: its figure moves, but it is neither told nor counted.
  ids.gone = await school("Gone", { ...set, subscriptionStatus: "ENDED" });
  // C1b's school, on fixed days either side of midnight in Kolkata.
  ids.zone = await school("Zone", { subscriptionStatus: "TRIAL", subscriptionStartsAt: at("2026-11-01"), subscriptionDueAt: at("2027-05-01") });
  // C1c's renewal filters: thirty days from 22 November in Kolkata reach 22 December.
  ids.window = await school("Window", { subscriptionStatus: "TRIAL", subscriptionStartsAt: at("2026-11-01"), subscriptionDueAt: at("2026-12-22") });
  // C3's schools, premium on and billed only while its plan is asked for; their own ₹120, so our subscription's moves pass them by.
  ids.pStudents = await school("PStudents", { ...set, subscriptionPricePaise: 12_000, premiumStudents: true });
  ids.pTeachers = await school("PTeachers", { ...set, subscriptionPricePaise: 12_000, premiumTeachers: true });
  ids.pBoth = await school("PBoth", { ...set, subscriptionPricePaise: 12_000, premiumStudents: true, premiumTeachers: true });
  // Premium on and terms not set: no bill at all, and that reason first (C3a).
  ids.pNotSet = await school("PNotSet", { subscriptionStatus: "ACTIVE", subscriptionStartsAt: at(day(-300)), subscriptionDueAt: at(day(65)), premiumStudents: true });
  // A college with Students premium on and no tier chosen: no subscription figure, so no bill, and not in the totals.
  ids.pCollege = await school("PCollege", { ...set, kind: "COLLEGE", premiumStudents: true }, 900);
  // B-1 of the review of 21 November 2026: an unpaid trial whose renewal has passed, corrected while a payment is recorded.
  ids.race = await school("Race", { subscriptionStatus: "TRIAL", subscriptionStartsAt: at(day(-10)), subscriptionDueAt: at(day(-1)) });
  ids.teacher = (await db.user.create({ data: { name: `${PREFIX} Teacher`, email: `zz-premium-teacher-${STAMP}@test.invalid` }, select: { id: true } })).id;
  await db.membership.create({ data: { userId: ids.teacher, schoolId: ids.follow, role: "TEACHER", status: "ACTIVE" } });
});

// No plan asked for unless a case names one, as in every suite (person-plans.ts setActivePlansForTests).
afterEach(() => setActivePlansForTests([]));

afterAll(async () => {
  __resetCookies();
  const schools = Object.values(ids).filter((id, i) => i >= 2 && id);
  const users = [ids.operator, ids.teacher, ...Object.values(office).flat()].filter(Boolean);
  await db.session.deleteMany({ where: { userId: { in: users } } });
  await db.notification.deleteMany({ where: { userId: { in: users } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { targetId: { in: schools } }, { actorUserId: { in: users } }] } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  // The row this suite wrote, and only that: a row another hand saved meanwhile is the platform's.
  await db.schoolOffer.deleteMany({ where: { id: "offer", updatedByUserId: ids.operator } });
  await db.$disconnect();
});

const expectFrom = (t: { termsSetAt: string | null; premiumStudents: boolean; premiumTeachers: boolean; subscription: unknown; premium: unknown }) =>
  ({ termsSetAt: t.termsSetAt, premiumStudents: t.premiumStudents, premiumTeachers: t.premiumTeachers, subscription: t.subscription, premium: t.premium }) as never;

describe("the doors are the operator's, and the office's card its own", () => {
  it("a teacher meets no door of the operator's; signed out, none", async () => {
    await as("TEACHER");
    for (const res of [await offerGet(), await listGet(get("/operator/subscriptions")), await termsGet(get(`/operator/schools/${ids.follow}/terms`), params(ids.follow))]) expect(res.status, "a teacher").toBeGreaterThanOrEqual(400);
    __resetCookies();
    expect((await offerGet()).status).toBe(401);
  });
  it("the office reads its own card: both parts, free until, renews on, recording open", async () => {
    setActivePlansForTests(["STUDENT"]);
    await as("OFFICE", ids.follow);
    const res = await officeGet();
    expect(res.status).toBe(200);
    const card = await res.json();
    const now = await ours();
    expect(card).toMatchObject({ termsSet: true, subscriptionFigure: { paysPaise: now.subscription, source: "OURS" }, premium: { students: true, teachers: false, figure: { paysPaise: now.premium }, billed: true, notBilled: null }, freeUntil: day(170), renewsOn: day(170), state: "FREE", recording: { paused: false, since: null } });
  });
});

offerSection("our offer: the owner's starting values until the first save", () => {
  it("GET answers the starting values, ₹100 and ₹50, six months free", async () => {
    await as("OPERATOR");
    const res = await offerGet();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.offer).toMatchObject({ subscription: { pricePaise: OFFER_START.subscriptionPricePaise, discountBps: 0 }, premium: { pricePaise: OFFER_START.premiumPricePaise, discountBps: 0 }, freeMonths: 6, starting: true, updatedAt: null });
  });
  it("a preview of ₹120 moves the school that follows and the one on its own discount, not the one on its own price or with terms not set, and writes nothing", async () => {
    const ctx = await as("OPERATOR");
    const body = { subscription: { pricePaise: 12_000, discountBps: 0 }, premium: { pricePaise: 5_000, discountBps: 0 }, freeMonths: 6, studentsByDefault: true, teachersByDefault: false, reason: "ZZ preview", expect: { updatedAt: null }, preview: true };
    const result = await updateOffer(ctx, body, new Date(), scope());
    if ("ok" in result) throw new Error(result.errorKey);
    const mine = result.moves.map((m) => [m.schoolId, m.part, m.beforePaise, m.afterPaise]);
    expect(mine).toEqual(expect.arrayContaining([[ids.follow, "SUBSCRIPTION", 10_000, 12_000], [ids.discount, "SUBSCRIPTION", 8_000, 9_600]]));
    for (const id of [ids.ownPrice, ids.notSet, ids.college]) expect(mine.map((m) => m[0])).not.toContain(id);
    // The scope holds: no school but the suite's is in the answer.
    expect(result.moves.every((m) => scope().schoolIds.includes(m.schoolId))).toBe(true);
    // The paused school's and the ended one's figures move too, but the year's difference counts what the totals count
    // (rule 8: live, terms set, Trial, Active or Due), and an ended school is not told: the office and head of three.
    expect(mine.map((m) => m[0])).toEqual(expect.arrayContaining([ids.paused, ids.gone]));
    expect(result.yearDeltaPaise).toBe(412 * 2_000 + 412 * 1_600);
    expect(result.told).toBe(6);
    expect(await db.schoolOffer.findUnique({ where: { id: "offer" } })).toBeNull();
    expect(await db.auditLog.count({ where: { action: "operator.offer.update", actorUserId: ids.operator } })).toBe(0);
  });
  it("the door's preview answers 200 and writes nothing", async () => {
    await as("OPERATOR");
    const body = { subscription: { pricePaise: 12_000, discountBps: 0 }, premium: { pricePaise: 5_000, discountBps: 0 }, freeMonths: 6, studentsByDefault: true, teachersByDefault: false, reason: "ZZ preview", expect: { updatedAt: null }, preview: true };
    const res = await offerPut(send("PUT", "/operator/offer", body));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ preview: true, offer: { subscription: { pricePaise: 12_000 } } });
    expect(await db.schoolOffer.findUnique({ where: { id: "offer" } })).toBeNull();
  });
  it("two first saves at once: one is saved, the other refused by name, never overwritten", async () => {
    const ctx = await as("OPERATOR");
    const body = { subscription: { pricePaise: 12_000, discountBps: 0 }, premium: { pricePaise: 5_000, discountBps: 0 }, freeMonths: 6, studentsByDefault: true, teachersByDefault: false, reason: "ZZ second hand", expect: { updatedAt: null } };
    // The other hand's save, held open: the row exists, uncommitted, while this save reaches its write.
    let release!: () => void;
    let taken!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    const lockTaken = new Promise<void>((resolve) => (taken = resolve));
    const other = db.$transaction(async (tx) => {
      await tx.schoolOffer.create({ data: { id: "offer", subscriptionPricePaise: 11_000, premiumPricePaise: 5_000, updatedByUserId: ids.operator } });
      taken();
      await held;
    }, { timeout: 20_000 });
    await Promise.race([lockTaken, other]);
    const saving = updateOffer(ctx, body, new Date(), scope());
    // Released only once the save is waiting at its write, so the case tests the write's own comparison.
    await blockedOn("SchoolOffer");
    release();
    await other;
    expect(await saving).toEqual({ ok: false, errorKey: "root.offerChangedMeanwhile" });
    expect((await db.schoolOffer.findUniqueOrThrow({ where: { id: "offer" } })).subscriptionPricePaise).toBe(11_000);
    await db.schoolOffer.delete({ where: { id: "offer" } });
  });
  it("a stale offer is refused by name; the save writes the row, one audit row, and tells the moved schools' office and head, not an ended school's", async () => {
    const ctx = await as("OPERATOR");
    const body = { subscription: { pricePaise: 12_000, discountBps: 0 }, premium: { pricePaise: 5_000, discountBps: 0 }, freeMonths: 6, studentsByDefault: true, teachersByDefault: false, reason: "ZZ new prices" };
    expect(await updateOffer(ctx, { ...body, expect: { updatedAt: "2026-01-01T00:00:00.000Z" } }, new Date(), scope())).toEqual({ ok: false, errorKey: "root.offerChangedMeanwhile" });
    const saved = await updateOffer(ctx, { ...body, expect: { updatedAt: null } }, new Date(), scope());
    expect(saved).toMatchObject({ preview: false, told: 6 });
    expect((await readOffer()).subscriptionPricePaise).toBe(12_000);
    expect(await db.auditLog.count({ where: { action: "operator.offer.update", actorUserId: ids.operator, schoolId: null } })).toBe(1);
    const told = async (id: string) => db.notification.count({ where: { userId: { in: office[id] }, titleKey: "notifTitle.schoolTermsChanged" } });
    expect([await told(ids.follow), await told(ids.discount), await told(ids.paused)]).toEqual([2, 2, 2]);
    expect([await told(ids.ownPrice), await told(ids.notSet), await told(ids.gone)]).toEqual([0, 0, 0]);
  });
  it("GET answers the last changes, newest first, with the reason and what the prices became", async () => {
    await as("OPERATOR");
    const res = await offerGet();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.offer).toMatchObject({ subscription: { pricePaise: 12_000 }, starting: false });
    expect(body.recent).toHaveLength(1);
    expect(body.recent[0]).toMatchObject({ reason: "ZZ new prices", before: { subscription: { pricePaise: 10_000 } }, after: { subscription: { pricePaise: 12_000 } } });
  });
  it("a save made against the offer another hand is saving is refused when that one commits, never written over it", async () => {
    const ctx = await as("OPERATOR");
    const read = await readOffer();
    const body = { subscription: { pricePaise: 10_000, discountBps: 0 }, premium: { pricePaise: 5_000, discountBps: 0 }, freeMonths: 6, studentsByDefault: true, teachersByDefault: false, reason: "ZZ back", expect: { updatedAt: read.updatedAt!.toISOString() } };
    let release!: () => void;
    let taken!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    const lockTaken = new Promise<void>((resolve) => (taken = resolve));
    const other = db.$transaction(async (tx) => {
      await tx.schoolOffer.update({ where: { id: "offer" }, data: { freeMonths: 3, updatedByUserId: ids.operator } });
      taken();
      await held;
    }, { timeout: 20_000 });
    await Promise.race([lockTaken, other]);
    const saving = updateOffer(ctx, body, new Date(), scope());
    await blockedOn("SchoolOffer");
    release();
    await other;
    expect(await saving).toEqual({ ok: false, errorKey: "root.offerChangedMeanwhile" });
    expect(await db.schoolOffer.findUniqueOrThrow({ where: { id: "offer" }, select: { subscriptionPricePaise: true, freeMonths: true } })).toEqual({ subscriptionPricePaise: 12_000, freeMonths: 3 });
    // Back to the starting values for the rest of the suite, against the row as it now stands.
    const now = await readOffer();
    expect(await updateOffer(ctx, { ...body, expect: { updatedAt: now.updatedAt!.toISOString() } }, new Date(), scope())).toMatchObject({ preview: false });
    expect(await readOffer()).toMatchObject({ subscriptionPricePaise: 10_000, freeMonths: 6 });
  });
});

describe("a school's terms", () => {
  it("GET works the figures out on read: our ₹100, an own 20 % off is ₹80, an own price ₹120; the bill at the newest count", async () => {
    setActivePlansForTests(["STUDENT"]);
    await as("OPERATOR");
    const follow = await (await termsGet(get(`/operator/schools/${ids.follow}/terms`), params(ids.follow))).json();
    const now = await ours();
    const ownTwenty = paysPaise(now.offer.subscriptionPricePaise, 2_000);
    expect(follow).toMatchObject({ termsSet: true, subscription: { mode: "OURS" }, subscriptionFigure: { paysPaise: now.subscription }, premiumStudents: true, premiumFigure: { paysPaise: now.premium }, premiumBilled: true, premiumNotBilled: null, premiumWaitsFor: [], pupils: 412, bill: { totalPaise: 412 * (now.subscription + now.premium) }, state: "FREE" });
    const discount = await (await termsGet(get(`/operator/schools/${ids.discount}/terms`), params(ids.discount))).json();
    expect(discount).toMatchObject({ subscription: { mode: "OWN_DISCOUNT", discountBps: 2_000 }, subscriptionFigure: { paysPaise: ownTwenty }, bill: { totalPaise: 412 * ownTwenty } });
    const notSet = await (await termsGet(get(`/operator/schools/${ids.notSet}/terms`), params(ids.notSet))).json();
    expect(notSet).toMatchObject({ termsSet: false, bill: null, state: "PAID" });
    const college = await (await termsGet(get(`/operator/schools/${ids.college}/terms`), params(ids.college))).json();
    expect(college).toMatchObject({ subscriptionFigure: null, noTierChosen: true, bill: null });
  });
  it("a preview writes nothing; a save sets the terms, writes an audit row in each log and tells the office and the head", async () => {
    const ctx = await as("OPERATOR");
    const before = await readSchoolTerms(ctx, ids.discount);
    if ("ok" in before) throw new Error(before.errorKey);
    const body = { subscription: { mode: "OWN_DISCOUNT" as const, discountBps: 2_500 }, reason: "ZZ agreed 25 %", expect: expectFrom(before) };
    const toldBefore = await db.notification.count({ where: { userId: { in: office[ids.discount] }, titleKey: "notifTitle.schoolTermsChanged" } });
    const preview = await (await termsPut(send("PUT", `/operator/schools/${ids.discount}/terms`, { ...body, preview: true }), params(ids.discount))).json();
    expect(preview).toMatchObject({ preview: true, changed: true, terms: { subscriptionFigure: { paysPaise: paysPaise((await readOffer()).subscriptionPricePaise, 2_500) } }, told: 2 });
    expect((await db.school.findUniqueOrThrow({ where: { id: ids.discount }, select: { subscriptionDiscountBps: true } })).subscriptionDiscountBps).toBe(2_000);
    const res = await termsPut(send("PUT", `/operator/schools/${ids.discount}/terms`, body), params(ids.discount));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ preview: false, changed: true, terms: { subscription: { mode: "OWN_DISCOUNT", discountBps: 2_500 } }, told: 2 });
    expect(await db.auditLog.count({ where: { action: "superuser.school.terms", targetId: ids.discount, schoolId: null } })).toBe(1);
    expect(await db.auditLog.count({ where: { action: "superuser.school.terms", schoolId: ids.discount } })).toBe(1);
    expect(await db.notification.count({ where: { userId: { in: office[ids.discount] }, titleKey: "notifTitle.schoolTermsChanged" } })).toBe(toldBefore + 2);
    // The same body again: what it read is gone.
    expect(await setSchoolTerms(ctx, ids.discount, body)).toEqual({ ok: false, errorKey: "root.termsChangedMeanwhile" });
  });
  it("the school's own log reads the parts that moved and the reason, never the note; a save that keeps what was there writes nothing and tells nobody", async () => {
    const ctx = await as("OPERATOR");
    const read = async () => {
      const terms = await readSchoolTerms(ctx, ids.discount);
      if ("ok" in terms) throw new Error(terms.errorKey);
      return terms;
    };
    const schoolRows = () => db.auditLog.findMany({ where: { action: "superuser.school.terms", schoolId: ids.discount }, select: { meta: true }, orderBy: { createdAt: "asc" } });
    const told = () => db.notification.count({ where: { userId: { in: office[ids.discount] }, titleKey: "notifTitle.schoolTermsChanged" } });
    const [rowsBefore, toldBefore] = [(await schoolRows()).length, await told()];
    const saved = await setSchoolTerms(ctx, ids.discount, { subscription: { mode: "OWN_DISCOUNT", discountBps: 3_000 }, note: "ZZ private note Q7", reason: "ZZ agreed 30 %", expect: expectFrom(await read()) });
    expect(saved).toMatchObject({ changed: true });
    const rows = await schoolRows();
    expect(rows).toHaveLength(rowsBefore + 1);
    expect(rows.at(-1)!.meta).toContain("ZZ agreed 30 %");
    expect(rows.at(-1)!.meta).not.toContain("ZZ private note Q7");
    // The same part saved again as it stands: nothing changes, so no row in the school's log and nobody told.
    const again = await setSchoolTerms(ctx, ids.discount, { subscription: { mode: "OWN_DISCOUNT", discountBps: 3_000 }, reason: "ZZ the same", expect: expectFrom(await read()) });
    expect(again).toMatchObject({ changed: false, told: 0 });
    expect(await schoolRows()).toHaveLength(rowsBefore + 1);
    expect(await told()).toBe(toldBefore + 2);
  });
  it("premium switched on at a school whose terms are not set leaves them not set, and is audited as premium", async () => {
    const ctx = await as("OPERATOR");
    const before = await readSchoolTerms(ctx, ids.notSet);
    if ("ok" in before) throw new Error(before.errorKey);
    const result = await setSchoolTerms(ctx, ids.notSet, { premium: { students: true }, expect: expectFrom(before) });
    expect(result).toMatchObject({ changed: true, terms: { premiumStudents: true, termsSet: false } });
    expect(await db.auditLog.count({ where: { action: "superuser.school.premium", schoolId: ids.notSet } })).toBe(1);
  });
  it("the office of a school whose terms are not set reads no figure for either part (§2.6: not recorded yet)", async () => {
    await as("OFFICE", ids.notSet);
    const card = await (await officeGet()).json();
    expect(card).toMatchObject({ termsSet: false, subscriptionFigure: null, premium: { students: true, figure: null } });
  });
  it("a college has no own price and no teachers' premium", async () => {
    const ctx = await as("OPERATOR");
    const before = await readSchoolTerms(ctx, ids.college);
    if ("ok" in before) throw new Error(before.errorKey);
    expect(await setSchoolTerms(ctx, ids.college, { subscription: { mode: "OWN_PRICE", pricePaise: 15_000 }, expect: expectFrom(before) })).toEqual({ ok: false, errorKey: "root.termsOwnPriceAtCollege" });
    expect(await setSchoolTerms(ctx, ids.college, { premium: { teachers: true }, expect: expectFrom(before) })).toEqual({ ok: false, errorKey: "root.termsTeachersAtCollege" });
  });
});

describe("one change over many schools", () => {
  it("at most a hundred schools; a school missing refuses the whole change", async () => {
    expect(bulkBodySchema.safeParse({ schoolIds: Array.from({ length: 101 }, (_, i) => `s${i}`), action: "STUDENTS_ON" }).success).toBe(false);
    await as("OPERATOR");
    expect((await bulkPost(send("POST", "/operator/subscriptions/bulk", { schoolIds: Array.from({ length: 101 }, (_, i) => `s${i}`), action: "STUDENTS_ON" }))).status).toBe(422);
    const ctx = await as("OPERATOR");
    expect(await bulkTerms(ctx, { schoolIds: [ids.follow, "zz-no-such-school"], action: "STUDENTS_ON" })).toEqual({ ok: false, errorKey: "root.bulkSchoolMissing" });
  });
  it("students on over a school that has it and one that does not changes only the second; our prices sets each school's terms", async () => {
    const ctx = await as("OPERATOR");
    const preview = await bulkTerms(ctx, { schoolIds: [ids.follow, ids.ownPrice], action: "STUDENTS_ON", preview: true });
    expect(preview).toMatchObject({ preview: true, changed: [{ schoolId: ids.ownPrice }], unchanged: 1 });
    const ours = await bulkTerms(ctx, { schoolIds: [ids.ownPrice, ids.discount], action: "OUR_PRICES", reason: "ZZ back on ours" });
    expect(ours).toMatchObject({ preview: false, unchanged: 0 });
    const rows = await db.school.findMany({ where: { id: { in: [ids.ownPrice, ids.discount] } }, select: { subscriptionPricePaise: true, subscriptionDiscountBps: true, termsSetAt: true } });
    for (const row of rows) expect(row).toMatchObject({ subscriptionPricePaise: null, subscriptionDiscountBps: null, termsSetAt: expect.any(Date) });
  });
});

describe("premium billed only while its plan is asked for (the owner's \"Not billed until then\", C3 and C3a)", () => {
  const terms = async (ctx: ActiveContext, id: string) => {
    const read = await readSchoolTerms(ctx, id);
    if ("ok" in read) throw new Error(read.errorKey);
    return read;
  };
  it("Students premium on and the Student plan not asked for: no premium line, and why; asked for: the line", async () => {
    const ctx = await as("OPERATOR");
    const now = await ours();
    const off = await terms(ctx, ids.pStudents);
    expect(off).toMatchObject({ premiumStudents: true, premiumBilled: false, premiumNotBilled: "PLAN_NOT_ASKED", premiumWaitsFor: ["STUDENT"], bill: { totalPaise: 412 * 12_000 } });
    expect(off.bill!.lines.map((l) => l.part)).toEqual(["SUBSCRIPTION"]);
    setActivePlansForTests(["STUDENT"]);
    const on = await terms(ctx, ids.pStudents);
    expect(on).toMatchObject({ premiumBilled: true, premiumNotBilled: null, premiumWaitsFor: [], bill: { totalPaise: 412 * (12_000 + now.premium) } });
  });
  it("Teachers premium alone, with only the Student plan asked for: no line, the Teacher plan named; both switches with one plan: the line, once", async () => {
    const ctx = await as("OPERATOR");
    const now = await ours();
    setActivePlansForTests(["STUDENT"]);
    expect(await terms(ctx, ids.pTeachers)).toMatchObject({ premiumTeachers: true, premiumBilled: false, premiumNotBilled: "PLAN_NOT_ASKED", premiumWaitsFor: ["TEACHER"], bill: { totalPaise: 412 * 12_000 } });
    setActivePlansForTests(["TEACHER"]);
    const both = await terms(ctx, ids.pBoth);
    expect(both.bill!.lines.filter((l) => l.part === "PREMIUM")).toHaveLength(1);
    expect(both).toMatchObject({ premiumBilled: true, bill: { totalPaise: 412 * (12_000 + now.premium) } });
    setActivePlansForTests([]);
    expect(await terms(ctx, ids.pBoth)).toMatchObject({ premiumBilled: false, premiumNotBilled: "PLAN_NOT_ASKED", premiumWaitsFor: ["STUDENT", "TEACHER"] });
  });
  it("premium on with its terms not set: no bill, and \"terms not set\" is the reason first, to the operator and on the office's card, whatever is asked for (C3a)", async () => {
    const ctx = await as("OPERATOR");
    setActivePlansForTests(["STUDENT"]);
    expect(await terms(ctx, ids.pNotSet)).toMatchObject({ termsSet: false, premiumStudents: true, premiumBilled: false, premiumNotBilled: "TERMS_NOT_SET", premiumWaitsFor: [], bill: null });
    await as("OFFICE", ids.pNotSet);
    expect(await (await officeGet()).json()).toMatchObject({ termsSet: false, premium: { students: true, figure: null, billed: false, notBilled: "TERMS_NOT_SET" } });
  });
  it("the Schools tab's rows and the office's card read it the same way", async () => {
    const ctx = await as("OPERATOR");
    const now = await ours();
    const rows = async () => new Map((await listSubscriptions(ctx, {})).rows.map((r) => [r.schoolId, r]));
    const before = await rows();
    expect([before.get(ids.pStudents), before.get(ids.pTeachers)].map((r) => [r?.premiumBilled, r?.billedYearPaise])).toEqual([[false, 412 * 12_000], [false, 412 * 12_000]]);
    await as("OFFICE", ids.pStudents);
    expect(await (await officeGet()).json()).toMatchObject({ termsSet: true, premium: { students: true, figure: null, billed: false, notBilled: "PLAN_NOT_ASKED" } });
    setActivePlansForTests(["STUDENT"]);
    await as("OPERATOR");
    const after = await rows();
    expect([after.get(ids.pStudents), after.get(ids.pTeachers)].map((r) => [r?.premiumBilled, r?.billedYearPaise])).toEqual([[true, 412 * (12_000 + now.premium)], [false, 412 * 12_000]]);
    await as("OFFICE", ids.pStudents);
    expect(await (await officeGet()).json()).toMatchObject({ premium: { students: true, figure: { paysPaise: now.premium }, billed: true, notBilled: null } });
  });
  it("a change of our premium price moves, counts and tells only where premium is billed, and the year's difference counts what the totals count (C3a; rule 8)", async () => {
    const ctx = await as("OPERATOR");
    // A preview from our offer as it stands, which writes nothing, so the case runs where the platform's offer is saved
    // too: the subscription as it is, premium ₹10 more a student (₹10 less at the top of the range).
    const offer = await readOffer();
    const premiumPrice = offer.premiumPricePaise + (offer.premiumPricePaise + 1_000 <= PRICE_MAX_PAISE ? 1_000 : -1_000);
    const step = paysPaise(premiumPrice, offer.premiumDiscountBps) - paysPaise(offer.premiumPricePaise, offer.premiumDiscountBps);
    const body = {
      subscription: { pricePaise: offer.subscriptionPricePaise, discountBps: offer.subscriptionDiscountBps },
      premium: { pricePaise: premiumPrice, discountBps: offer.premiumDiscountBps },
      freeMonths: offer.freeMonths as FreeMonths,
      studentsByDefault: offer.studentsByDefault,
      teachersByDefault: offer.teachersByDefault,
      reason: "ZZ premium preview",
      expect: { updatedAt: offer.updatedAt?.toISOString() ?? null },
      preview: true,
    };
    const premiumMoves = (result: Awaited<ReturnType<typeof updateOffer>>) => {
      if ("ok" in result) throw new Error(result.errorKey);
      return result.moves.filter((m) => m.part === "PREMIUM").map((m) => m.schoolId).sort();
    };
    // No plan asked for: premium is on no bill, so its price moves nobody's bill, counts nothing and tells nobody.
    const none = await updateOffer(ctx, body, new Date(), scope());
    expect(premiumMoves(none)).toEqual([]);
    expect(none).toMatchObject({ yearDeltaPaise: 0, told: 0 });
    // The Student plan asked for: the schools with Students on move and are told (two each), Teachers alone does not. The
    // college with no tier moves too (its premium is billed, and the figure its office reads moves), but it has no bill,
    // so the year's difference leaves it out, as the totals do: three schools of 412.
    setActivePlansForTests(["STUDENT"]);
    const students = await updateOffer(ctx, body, new Date(), scope());
    expect(premiumMoves(students)).toEqual([ids.follow, ids.pStudents, ids.pBoth, ids.pCollege].sort());
    expect(students).toMatchObject({ yearDeltaPaise: 3 * 412 * step, told: 8 });
    expect(step).not.toBe(0);
  });
  it("a payment's bill follows the same reading: the amount that matched without premium is unlike the bill once it is billed", async () => {
    const ctx = await as("OPERATOR");
    const now = await ours();
    const from = { fromStatus: "TRIAL" as const, fromDueAt: day(170), paidOn: day(0), preview: true };
    const preview = async (amountPaise: number) => (await paymentPost(send("POST", `/operator/schools/${ids.pStudents}/payment`, { ...from, amountPaise }), params(ids.pStudents))).json();
    expect(await preview(412 * 12_000)).toMatchObject({ preview: true, billPaise: 412 * 12_000, differencePaise: 0 });
    setActivePlansForTests(["STUDENT"]);
    expect(await recordPayment(ctx, ids.pStudents, { ...from, amountPaise: 412 * 12_000 })).toEqual({ ok: false, errorKey: "root.paymentDiffers" });
    expect(await preview(412 * (12_000 + now.premium))).toMatchObject({ billPaise: 412 * (12_000 + now.premium), differencePaise: 0 });
  });
});

describe("a payment recorded", () => {
  it("refused while suspended; an amount unlike the bill needs the tick; the renewal moves twelve months once; the same payment twice is refused by name", async () => {
    setActivePlansForTests(["STUDENT"]);
    const ctx = await as("OPERATOR");
    expect(await recordPayment(ctx, ids.paused, { fromStatus: "SUSPENDED", fromDueAt: day(170), paidOn: day(0), amountPaise: 1 })).toEqual({ ok: false, errorKey: "root.paymentStatusFirst" });
    const terms = await readSchoolTerms(ctx, ids.follow);
    if ("ok" in terms) throw new Error(terms.errorKey);
    const bill = terms.bill!.totalPaise;
    // The bill carries premium, the Student plan being asked for (C3a: this case names it).
    expect(terms.bill!.lines.map((l) => l.part)).toEqual(["SUBSCRIPTION", "PREMIUM"]);
    const from = { fromStatus: "TRIAL" as const, fromDueAt: day(170), paidOn: day(0) };
    expect(await recordPayment(ctx, ids.follow, { ...from, amountPaise: bill - 100_000 })).toEqual({ ok: false, errorKey: "root.paymentDiffers" });
    const preview = await (await paymentPost(send("POST", `/operator/schools/${ids.follow}/payment`, { ...from, amountPaise: bill, preview: true }), params(ids.follow))).json();
    expect(preview).toMatchObject({ preview: true, renewalBefore: day(170), renewalAfter: renewalFrom(day(170), 12), statusAfter: "ACTIVE", billPaise: bill, differencePaise: 0 });
    const res = await paymentPost(send("POST", `/operator/schools/${ids.follow}/payment`, { ...from, amountPaise: bill - 100_000, acceptDifference: true, ref: "ZZ NEFT 1" }), params(ids.follow));
    expect(res.status).toBe(200);
    const row = await db.school.findUniqueOrThrow({ where: { id: ids.follow }, select: { subscriptionStatus: true, subscriptionDueAt: true, subscriptionPaidAt: true, subscriptionPaidRef: true } });
    expect({ status: row.subscriptionStatus, due: row.subscriptionDueAt?.toISOString().slice(0, 10), paid: row.subscriptionPaidAt?.toISOString().slice(0, 10), ref: row.subscriptionPaidRef }).toEqual({ status: "ACTIVE", due: renewalFrom(day(170), 12), paid: day(0), ref: "ZZ NEFT 1" });
    expect(await recordPayment(ctx, ids.follow, { ...from, amountPaise: bill })).toEqual({ ok: false, errorKey: "root.paymentAlreadyRecorded" });
    expect(await db.auditLog.count({ where: { action: "superuser.school.subscription", schoolId: ids.follow } })).toBe(1);
  });
});

describe("a payment sent twice at once", () => {
  it("the second, meeting the first's write, is refused as already recorded, not as a change to look at again", async () => {
    const ctx = await as("OPERATOR");
    expect(await db.school.findUniqueOrThrow({ where: { id: ids.discount }, select: { subscriptionStatus: true } })).toEqual({ subscriptionStatus: "TRIAL" });
    const payment = { fromStatus: "TRIAL" as const, fromDueAt: day(170), paidOn: day(0), amountPaise: 1, acceptDifference: true };
    // The first request's write, held open: its payment is in the row, uncommitted, while the second reaches its own write.
    let release!: () => void;
    let taken!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    const lockTaken = new Promise<void>((resolve) => (taken = resolve));
    const first = db.$transaction(async (tx) => {
      await tx.school.update({ where: { id: ids.discount }, data: { subscriptionStatus: "ACTIVE", subscriptionDueAt: at(renewalFrom(day(170), 12)), subscriptionPaidAt: at(day(0)) } });
      taken();
      await held;
    }, { timeout: 20_000 });
    await Promise.race([lockTaken, first]);
    const second = recordPayment(ctx, ids.discount, payment);
    await blockedOn("School");
    release();
    await first;
    expect(await second).toEqual({ ok: false, errorKey: "root.paymentAlreadyRecorded" });
  });
});

describe("a correction sent while a payment is recorded (the review's B-1)", () => {
  it("is refused by name when the payment commits first, never written over it: the school stays paid", async () => {
    const ctx = await as("OPERATOR");
    const noon = new Date(`${TODAY}T06:30:00.000Z`);
    // The payment's write, held open: ACTIVE, the renewal a year on, paid today, uncommitted while the correction (judged on
    // the unpaid trial it read, so allowed by C1) reaches its own write.
    let release!: () => void;
    let taken!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    const lockTaken = new Promise<void>((resolve) => (taken = resolve));
    const paid = { subscriptionStatus: "ACTIVE", subscriptionDueAt: at(renewalFrom(day(-1), 12)), subscriptionPaidAt: at(day(0)) };
    const payment = db.$transaction(async (tx) => {
      await tx.school.update({ where: { id: ids.race }, data: paid });
      taken();
      await held;
    }, { timeout: 20_000 });
    await Promise.race([lockTaken, payment]);
    const correcting = setSubscription(ctx, ids.race, { status: "DUE", reason: "ZZ correction meeting a payment" }, noon);
    await blockedOn("School");
    release();
    await payment;
    expect(await correcting).toEqual({ ok: false, errorKey: "root.subscriptionChangedMeanwhile" });
    expect(await db.school.findUniqueOrThrow({ where: { id: ids.race }, select: { subscriptionStatus: true, subscriptionDueAt: true, subscriptionPaidAt: true } })).toEqual(paid);
    // Nothing of the refused correction is in either log.
    expect(await db.auditLog.count({ where: { action: "superuser.school.subscription", targetId: ids.race } })).toBe(0);
  });
});

describe("an unpaid school's status corrected with its renewal (rule 5, the coordinator's C1 of 21 November 2026)", () => {
  const reason = "ZZ correction of a mistaken onboarding";
  const refused = { ok: false, errorKey: "root.subscriptionMoveRefused" };
  const standing = async (id: string) => {
    const row = await db.school.findUniqueOrThrow({ where: { id }, select: { subscriptionStatus: true, subscriptionDueAt: true } });
    return { status: row.subscriptionStatus, due: row.subscriptionDueAt?.toISOString().slice(0, 10) ?? null };
  };
  it("TRIAL to DUE only when the renewal as it will stand is today or before, the date and the status in one audited write", async () => {
    const ctx = await as("OPERATOR");
    // The renewal twenty days on: DUE alone is refused, as tests/subscriptions.test.ts:187 holds; so is a renewal tomorrow.
    expect(await setSubscription(ctx, ids.trial, { status: "DUE", reason })).toEqual(refused);
    expect(await setSubscription(ctx, ids.trial, { status: "DUE", dueAt: day(1), reason })).toEqual(refused);
    expect(await standing(ids.trial)).toEqual({ status: "TRIAL", due: day(20) });
    expect(await setSubscription(ctx, ids.trial, { status: "DUE", dueAt: day(0), reason })).toEqual({ ok: true });
    expect(await standing(ids.trial)).toEqual({ status: "DUE", due: day(0) });
    const rows = await db.auditLog.findMany({ where: { action: "superuser.school.subscription", targetId: ids.trial }, select: { schoolId: true, meta: true } });
    expect(rows.map((r) => r.schoolId).sort()).toEqual([ids.trial, null].sort());
    for (const r of rows) expect(JSON.parse(String(r.meta))).toMatchObject({ status: "DUE", dueAt: day(0), reason });
  });
  it("DUE to TRIAL only when the renewal as it will stand is after today", async () => {
    const ctx = await as("OPERATOR");
    expect(await setSubscription(ctx, ids.due, { status: "TRIAL", reason })).toEqual(refused);
    expect(await setSubscription(ctx, ids.due, { status: "TRIAL", dueAt: day(0), reason })).toEqual(refused);
    expect(await setSubscription(ctx, ids.due, { status: "TRIAL", dueAt: day(90), reason })).toEqual({ ok: true });
    expect(await standing(ids.due)).toEqual({ status: "TRIAL", due: day(90) });
  });
  it("once a payment is recorded the list alone rules: neither move, nor one in the write that records a payment", async () => {
    const ctx = await as("OPERATOR");
    expect(await setSubscription(ctx, ids.receipted, { status: "TRIAL", dueAt: day(90), reason })).toEqual(refused);
    expect(await setSubscription(ctx, ids.again, { status: "DUE", dueAt: day(0), reason })).toEqual(refused);
    expect(await setSubscription(ctx, ids.due, { status: "DUE", dueAt: day(0), paidAt: day(0), reason })).toEqual(refused);
    // C1a: nor one in the write that clears a payment; taking a payment back is its own act.
    expect(await setSubscription(ctx, ids.receipted, { status: "TRIAL", dueAt: day(90), paidAt: null, reason })).toEqual(refused);
    expect([await standing(ids.receipted), await standing(ids.again), await standing(ids.due)]).toEqual([
      { status: "DUE", due: day(-5) },
      { status: "TRIAL", due: day(30) },
      { status: "TRIAL", due: day(90) },
    ]);
  });
  it("today is the day the function is given, and a renewal on the start day is owed from the first day (C1a)", async () => {
    const ctx = await as("OPERATOR");
    expect(await setSubscription(ctx, ids.clock, { status: "DUE", reason }, at(day(19)))).toEqual(refused);
    expect(await setSubscription(ctx, ids.clock, { status: "DUE", reason }, at(day(20)))).toEqual({ ok: true });
    expect(await standing(ids.clock)).toEqual({ status: "DUE", due: day(20) });
    // A start and a renewal on the same day ahead: owed from that first day, so it stays DUE.
    expect(await setSubscription(ctx, ids.clock, { status: "TRIAL", startsAt: day(30), dueAt: day(30), reason })).toEqual(refused);
  });
  it("a date changed with no status moves no status", async () => {
    const ctx = await as("OPERATOR");
    expect(await setSubscription(ctx, ids.due, { dueAt: day(-1), reason })).toEqual({ ok: true });
    expect(await standing(ids.due)).toEqual({ status: "TRIAL", due: day(-1) });
  });
  it("the day is the school's own (C1b): at 02:00 on 22 November in Kolkata, still the 21st in UTC, a renewal of the 22nd is reached", async () => {
    const ctx = await as("OPERATOR");
    const lateOn21st = new Date("2026-11-21T18:00:00.000Z"); // 23:30 on the 21st in Kolkata
    const earlyOn22nd = new Date("2026-11-21T20:30:00.000Z"); // 02:00 on the 22nd in Kolkata, the 21st in UTC
    expect(await setSubscription(ctx, ids.zone, { dueAt: "2026-11-22", reason }, lateOn21st)).toEqual({ ok: true });
    const badge = async (now: Date) => {
      const terms = await readSchoolTerms(ctx, ids.zone, now);
      if ("ok" in terms) throw new Error(terms.errorKey);
      return terms.state;
    };
    expect([await badge(lateOn21st), await badge(earlyOn22nd)]).toEqual(["FREE", "FREE_ENDED"]);
    expect(await setSubscription(ctx, ids.zone, { status: "DUE", reason }, lateOn21st)).toEqual(refused);
    expect(await setSubscription(ctx, ids.zone, { status: "DUE", reason }, earlyOn22nd)).toEqual({ ok: true });
    expect(await standing(ids.zone)).toEqual({ status: "DUE", due: "2026-11-22" });
    expect(await badge(earlyOn22nd)).toBe("DUE_SINCE");
  });
});

describe("the Schools tab's renewal filters, on the school's own day at both ends (C1c)", () => {
  it("at 02:00 on 22 November in Kolkata, a renewal of the 22nd has passed and one of 22 December is within thirty days", async () => {
    const ctx = await as("OPERATOR");
    const earlyOn22nd = new Date("2026-11-21T20:30:00.000Z");
    const listed = async (renewal: "passed" | "30") => (await listSubscriptions(ctx, { renewal }, earlyOn22nd)).rows.map((r) => r.schoolId);
    // The zone school is Due with its renewal on the 22nd (the case before); the window school renews on 22 December.
    const [passed, within] = [await listed("passed"), await listed("30")];
    expect(passed).toContain(ids.zone);
    expect(within).not.toContain(ids.zone);
    expect(within).toContain(ids.window);
    expect(passed).not.toContain(ids.window);
  });
});

describe("the database holds the shape the owner approved (the migration's CHECKs)", () => {
  it("our offer: one row, prices in whole rupees from ₹1 to ₹10,000, discounts to 100 %, the free months from the list", async () => {
    const good = { subscriptionPricePaise: 10_000, premiumPricePaise: 5_000 };
    await expect(db.schoolOffer.create({ data: { id: "zz-second", ...good } })).rejects.toThrow(/SchoolOffer_one_row_check/);
    const bad = [
      [{ subscriptionPricePaise: 10_050 }, /SchoolOffer_prices_check/],
      [{ premiumPricePaise: 1_000_100 }, /SchoolOffer_prices_check/],
      [{ subscriptionDiscountBps: 10_001 }, /SchoolOffer_discounts_check/],
      [{ freeMonths: 2 }, /SchoolOffer_free_months_check/],
    ] as const;
    for (const [data, check] of bad) await expect(db.schoolOffer.upsert({ where: { id: "offer" }, create: { ...good, ...data }, update: data })).rejects.toThrow(check);
  });
  it("a school's own terms: a price or a discount for each part, never both, within the same bounds", async () => {
    const bad = [
      [{ subscriptionPricePaise: 12_000, subscriptionDiscountBps: 1_000 }, /School_subscription_terms_check/],
      [{ subscriptionPricePaise: 12_050 }, /School_subscription_terms_check/],
      [{ premiumPricePaise: 6_000, premiumDiscountBps: 500 }, /School_premium_terms_check/],
      [{ premiumDiscountBps: -1 }, /School_premium_terms_check/],
    ] as const;
    for (const [data, check] of bad) await expect(db.school.update({ where: { id: ids.notSet }, data })).rejects.toThrow(check);
  });
  it("recording is closed only while SUSPENDED or ENDED: not with another status, and not with none", async () => {
    await expect(db.school.update({ where: { id: ids.notSet }, data: { recordingClosedAt: new Date() } })).rejects.toThrow(/School_recording_closed_check/);
    await expect(db.school.update({ where: { id: ids.notSet }, data: { subscriptionStatus: null, recordingClosedAt: new Date() } })).rejects.toThrow(/School_recording_closed_check/);
    expect(await db.school.findUniqueOrThrow({ where: { id: ids.notSet }, select: { subscriptionStatus: true, recordingClosedAt: true } })).toEqual({ subscriptionStatus: "ACTIVE", recordingClosedAt: null });
    await db.school.update({ where: { id: ids.paused }, data: { recordingClosedAt: new Date() } });
    await db.school.update({ where: { id: ids.paused }, data: { recordingClosedAt: null } });
  });
});
