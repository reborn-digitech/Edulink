/**
 * Asking for a premium plan, or ceasing to (decision 0010 decisions 10 and 11; the coordinating session's C2, C3's fourth
 * point, C3a, C4 points 3 and 4, C4a points 2 to 5, C4b point 1 and C4c point 1 of 21 November 2026; the brief's rule 12,
 * phase 4).
 *
 * The operator's switch on /root/features answers, before anything is written (`preview: true`), what its confirmation says
 * in the server's words: the live schools with that role's premium and the others whose people lose the plan's features
 * (fixtures counted: the lock, the cover and the notice reach them alike; for the Teacher plan never a college), the schools
 * whose premium starts or stops being billed with a premium price above ₹0 (the status not read), how many of those have no
 * bill yet, the offices and heads told (those less an ended school's), how many hold the plan and whether it can be bought.
 * Saved, the offices and heads of those schools are told, after the write; a school with no bill yet is told all the same.
 * An operator who is a test fixture (the features sweep acts as one) tells nobody, and its preview counts none told; the
 * case that proves the telling uses an operator who is not one.
 *
 * No case here moves the Student or Teacher plan's switch on the database (C4c point 1): the plans asked for are named
 * (setActivePlansForTests), previews write nothing, and the saved path runs with the plan row's writer stubbed. The row's
 * own write, its compare-and-set and its audit row are proven on the Expert plan in tests/person-plans.test.ts. ZZ schools
 * and people of this suite's own, removed after.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { operatorPersonPlanAnswerSchema } from "@edulink/contracts";
import { createSession, getSession, type ActiveContext } from "@/lib/session";
import { __resetCookies, __setHeaders } from "../tests/stubs/next-headers";
import { setActivePlansForTests, setPersonPlan } from "@/lib/person-plans";
import { setPassSaleForTests } from "@/lib/pass-orders";
import { premiumAskEffect } from "@/lib/school-terms";
import { askConfirmation, changePersonPlan } from "@/lib/plan-ask";
import { previewPlanAction, setPlanAction } from "@/app/root/features/actions";
import { PUT as personPlansPut } from "@/app/api/v1/operator/person-plans/route";
import { translator } from "@/lib/i18n/dictionary";

// The next stubbed save's answer, set by a case that stands for a save another operator raced (the review's C2).
const raced = vi.hoisted(() => ({ next: null as null | { changed: boolean; activeMoved: boolean } }));

// The plan row's writer, stubbed for a save: no case may move the Student or Teacher switch on the developer's database.
vi.mock("@/lib/person-plans", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/person-plans")>();
  return {
    ...actual,
    // A preview writes nothing, so it is the real one; only a save is stubbed.
    setPersonPlan: vi.fn(async (ctx: ActiveContext, change: Parameters<typeof actual.setPersonPlan>[1], opts: { preview?: boolean } = {}) => {
      if (opts.preview) return actual.setPersonPlan(ctx, change, opts);
      const plan = (await actual.listPersonPlans(ctx)).find((p) => p.code === change.code)!;
      if (raced.next) {
        const answer = { plan, ...raced.next };
        raced.next = null;
        return answer;
      }
      const moved = change.active !== undefined && change.active !== plan.active;
      return { plan: { ...plan, active: change.active ?? plan.active }, changed: moved, activeMoved: moved };
    }),
  };
});

vi.mock("next/cache", () => ({ revalidatePath: () => undefined, revalidateTag: () => undefined }));

const db = new PrismaClient();
const STAMP = Date.now();
const DAY = 86_400_000;
const MONTH = new Date().toISOString().slice(0, 7);
const t = translator("en");
const email = (who: string) => `zz-ask-${who}-${STAMP}@test.invalid`;
const school: Record<string, string> = {};
const people: string[] = [];
let fixtureOperator = "";
let realOperator = "";
/** The Student plan's row as the suite found it: the cases move it the other way (in a preview, or through the stubbed save) and it must never change. */
let student: { active: boolean; updatedAt: Date } = { active: false, updatedAt: new Date(0) };
/** The plans asked for as the row stands, so the effect reckons the same move the switch would make. */
const askedAsItStands = () => setActivePlansForTests(student.active ? ["STUDENT"] : []);

async function makeSchool(key: string, data: Record<string, unknown>, opts: { pupils?: number; office?: boolean } = {}) {
  const n = Object.keys(school).length;
  school[key] = (await db.school.create({
    data: {
      name: `ZZ Ask ${key} ${STAMP}`,
      slug: `zz-ask-${key.toLowerCase()}-${STAMP}`,
      code: `ZAK${n}${String(STAMP).slice(-5)}`,
      contactEmail: email(key.toLowerCase()),
      timezone: "Asia/Kolkata",
      // Fixtures, counted and told alike (C4a point 3), so a killed run leaves nothing in the money totals (the review's D2).
      isTestFixture: true,
      subscriptionStatus: "ACTIVE",
      subscriptionStartsAt: new Date(Date.now() - 30 * DAY),
      subscriptionDueAt: new Date(Date.now() + 100 * DAY),
      ...data,
    },
    select: { id: true },
  })).id;
  if (opts.pupils !== undefined) await db.usageSample.create({ data: { schoolId: school[key]!, month: MONTH, pupils: opts.pupils, messages: 0, storageMb: 0, activeUsers: 0 } });
  if (opts.office) {
    const admin = (await db.user.create({ data: { name: `ZZ Ask Office ${key}`, email: email(`office-${key.toLowerCase()}`), isTestFixture: true }, select: { id: true } })).id;
    people.push(admin);
    await db.membership.create({ data: { userId: admin, schoolId: school[key]!, role: "ADMIN", status: "ACTIVE" } });
  }
}

const SET = { termsSetAt: new Date(Date.now() - 10 * DAY), subscriptionPricePaise: 10_000 };

beforeAll(async () => {
  // What a run of this suite killed before its clean-up left, of its own naming, is removed first: only rows old enough to
  // be leftovers (an hour), never those of another run in flight (the review's D2).
  const stale = new Date(Date.now() - 60 * 60_000);
  const leftSchools = (await db.school.findMany({ where: { slug: { startsWith: "zz-ask-" }, name: { startsWith: "ZZ Ask " }, createdAt: { lt: stale } }, select: { id: true } })).map((s) => s.id);
  const leftPeople = (await db.user.findMany({ where: { email: { startsWith: "zz-ask-", endsWith: "@test.invalid" }, createdAt: { lt: stale } }, select: { id: true } })).map((u) => u.id);
  if (leftSchools.length || leftPeople.length) {
    await db.notification.deleteMany({ where: { userId: { in: leftPeople } } });
    await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: leftSchools } }, { actorUserId: { in: leftPeople } }] } });
    await db.session.deleteMany({ where: { userId: { in: leftPeople } } });
    await db.membership.deleteMany({ where: { OR: [{ schoolId: { in: leftSchools } }, { userId: { in: leftPeople } }] } });
    await db.usageSample.deleteMany({ where: { schoolId: { in: leftSchools } } });
    await db.school.deleteMany({ where: { id: { in: leftSchools } } });
    await db.user.deleteMany({ where: { id: { in: leftPeople } } });
  }
  // The sale closed by the suite, whatever the machine's gateway and invoice details: "Nobody can buy this plan yet".
  setPassSaleForTests({
    company: { legalName: null, gstin: null, address: null, stateCode: null, sacCode: "998431", invoicePrefix: "ZZ", gstPercent: 18, missing: ["legalName", "gstin", "stateCode"] },
    prices: { STUDENT: { monthly: 9_900, yearly: 99_900 }, TEACHER: { monthly: 19_900, yearly: 199_900 }, EXPERT: { monthly: 49_900, yearly: 499_000 } },
  });
  student = await db.personPlan.findUniqueOrThrow({ where: { code: "STUDENT" }, select: { active: true, updatedAt: true } });
  // The features sweep acts as a test-fixture operator, so one; and one that is not, ZZ-named, to prove the telling.
  fixtureOperator = (await db.user.create({ data: { name: "ZZ Ask Fixture Operator", email: email("fixture-operator"), isSuperuser: true, isTestFixture: true }, select: { id: true } })).id;
  realOperator = (await db.user.create({ data: { name: "ZZ Ask Operator", email: email("operator"), isSuperuser: true, isTestFixture: false }, select: { id: true } })).id;
  people.push(fixtureOperator, realOperator);
  // Students premium, terms set, a count and a renewal: its premium starts being billed when the Student plan is asked for.
  // Premium at a price of their own wherever a case expects it billed, so no case rests on our offer's saved premium (D7).
  await makeSchool("Billed", { ...SET, premiumStudents: true, premiumPricePaise: 5_000 }, { pupils: 40, office: true });
  await makeSchool("Off", { ...SET }, { pupils: 40 });
  // Covered, and not billed either way: terms not set; premium free by agreement (its price nought).
  await makeSchool("NotSet", { premiumStudents: true }, { pupils: 40 });
  await makeSchool("Free", { ...SET, premiumStudents: true, premiumDiscountBps: 10_000 }, { pupils: 40 });
  // A college with no tier: covered for its students, billed from now (its premium price above nought) though it has no bill yet.
  await makeSchool("NoTier", { ...SET, subscriptionPricePaise: null, kind: "COLLEGE", premiumStudents: true, premiumPricePaise: 5_000 }, { pupils: 40 });
  // Ended with Students premium on: no cover (among the others), billed all the same (the status not read), and not told.
  await makeSchool("Ended", { ...SET, premiumStudents: true, subscriptionStatus: "ENDED", premiumPricePaise: 5_000 }, { pupils: 40, office: true });
  // Teachers premium only.
  await makeSchool("Teachers", { ...SET, premiumTeachers: true, premiumPricePaise: 5_000 }, { pupils: 40 });
  // A test fixture: counted and told as any school is.
  await makeSchool("Fixture", { ...SET, premiumStudents: true, isTestFixture: true, premiumPricePaise: 5_000 }, { pupils: 40, office: true });
});

afterEach(() => setActivePlansForTests([]));

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  setPassSaleForTests(null);
  const schools = Object.values(school);
  await db.notification.deleteMany({ where: { userId: { in: people } } });
  await db.auditLog.deleteMany({ where: { OR: [{ schoolId: { in: schools } }, { actorUserId: { in: people } }] } });
  await db.session.deleteMany({ where: { userId: { in: people } } });
  await db.membership.deleteMany({ where: { schoolId: { in: schools } } });
  await db.usageSample.deleteMany({ where: { schoolId: { in: schools } } });
  await db.school.deleteMany({ where: { id: { in: schools } } });
  await db.user.deleteMany({ where: { id: { in: people } } });
  await db.$disconnect();
});

async function as(userId: string): Promise<ActiveContext> {
  __resetCookies();
  __setHeaders({});
  await createSession(userId, {});
  return (await getSession()) as ActiveContext;
}
const scope = () => ({ schoolIds: Object.values(school) });
const ids = (rows: { id: string }[]) => rows.map((r) => r.id).sort();

describe("what asking for a premium plan does (C4a point 3)", () => {
  it("the Student plan: covered and the others, fixtures counted; billed where premiumBilled changes at a price above nought, the status not read", async () => {
    const effect = await premiumAskEffect("STUDENT", true, scope());
    expect({ covered: effect.covered, others: effect.others }).toEqual({ covered: 5, others: 3 });
    expect(ids(effect.billed)).toEqual([school.Billed, school.NoTier, school.Ended, school.Fixture].sort());
    expect(effect.billed.find((s) => s.id === school.NoTier)).toMatchObject({ noBill: true, ended: false });
    expect(effect.billed.find((s) => s.id === school.Ended)).toMatchObject({ ended: true });
  });

  it("the Teacher plan counts no college among the others; ceasing to ask moves the same schools back; asking again moves none", async () => {
    const teacher = await premiumAskEffect("TEACHER", true, scope());
    expect({ covered: teacher.covered, others: teacher.others }).toEqual({ covered: 1, others: 6 });
    expect(ids(teacher.billed)).toEqual([school.Teachers]);
    setActivePlansForTests(["STUDENT"]);
    expect(ids((await premiumAskEffect("STUDENT", false, scope())).billed)).toEqual([school.Billed, school.NoTier, school.Ended, school.Fixture].sort());
    expect((await premiumAskEffect("STUDENT", true, scope())).billed).toEqual([]);
  });
});

describe("the switch through the door's library (C4 point 4; C4b point 1; C4c point 1)", () => {
  it("a preview counts and writes nothing; an operator who is not a fixture tells the offices of the billed less the ended, a school with no bill yet among them", async () => {
    const ctx = await as(realOperator);
    // The move the switch would make from where the row stands: asking where it is not asked for, ceasing where it is. The
    // schools whose premium starts or stops being billed are the same either way.
    askedAsItStands();
    const move = { code: "STUDENT" as const, active: !student.active, expect: { active: student.active } };
    const preview = operatorPersonPlanAnswerSchema.parse(await changePersonPlan(ctx, { ...move, preview: true }, scope()));
    expect(preview).toMatchObject({ preview: true, changed: true, plan: { code: "STUDENT", active: student.active }, move: { onSale: false, price: null }, premium: { covered: 5, others: 3, billed: 4, noBillYet: 1, toldSchools: 3, told: 2 } });
    expect(await db.personPlan.findUniqueOrThrow({ where: { code: "STUDENT" }, select: { active: true, updatedAt: true } })).toEqual(student);
    expect(await db.notification.count({ where: { userId: { in: people } } })).toBe(0);

    const saved = operatorPersonPlanAnswerSchema.parse(await changePersonPlan(ctx, move, scope()));
    expect(saved).toMatchObject({ preview: false, changed: true, premium: { billed: 4, toldSchools: 3, told: 2 } });
    // The save is stubbed: the Student row is as it was found (C4c point 1).
    expect(await db.personPlan.findUniqueOrThrow({ where: { code: "STUDENT" }, select: { active: true, updatedAt: true } })).toEqual(student);
    expect(await db.notification.count({ where: { userId: { in: people }, titleKey: "notifTitle.schoolTermsChanged" } })).toBe(2);
    await db.notification.deleteMany({ where: { userId: { in: people } } });
  });

  it("an operator who is a test fixture tells nobody, and its preview counts none told: the rule the features sweep rests on", async () => {
    const ctx = await as(fixtureOperator);
    askedAsItStands();
    // As the sweep sends it: no `expect`.
    const preview = await changePersonPlan(ctx, { code: "STUDENT", active: !student.active, preview: true }, scope());
    expect(preview).toMatchObject({ preview: true, premium: { billed: 4, toldSchools: 0, told: 0 } });
    expect(await changePersonPlan(ctx, { code: "STUDENT", active: !student.active }, scope())).toMatchObject({ preview: false, premium: { told: 0 } });
    expect(await db.notification.count({ where: { userId: { in: people } } })).toBe(0);
    expect(await db.personPlan.findUniqueOrThrow({ where: { code: "STUDENT" }, select: { active: true, updatedAt: true } })).toEqual(student);
  });

  it("a switch no longer as `expect` read it is refused by name; the Expert plan has no premium, a price alone no move", async () => {
    const ctx = await as(realOperator);
    // A form that read the switch the other way from how it stands.
    expect(await changePersonPlan(ctx, { code: "STUDENT", active: student.active, expect: { active: !student.active }, preview: true }, scope())).toEqual({ ok: false, errorKey: "plans.changedMeanwhile" });
    expect(await changePersonPlan(ctx, { code: "STUDENT", active: !student.active, expect: { active: !student.active } }, scope())).toEqual({ ok: false, errorKey: "plans.changedMeanwhile" });
    // The Expert row as it stands, moved the other way, as the Student cases follow theirs (the review's D3), with the row as
    // read sent as `expect` and one retry should it flip between the read and the preview (the check, point 5).
    const previewExpert = async () => {
      const expertRow = await db.personPlan.findUniqueOrThrow({ where: { code: "EXPERT" }, select: { active: true } });
      return changePersonPlan(ctx, { code: "EXPERT", active: !expertRow.active, expect: { active: expertRow.active }, preview: true }, scope());
    };
    let expert = await previewExpert();
    if ("ok" in expert) expert = await previewExpert();
    expect(expert).toMatchObject({ preview: true, premium: null, move: { onSale: false } });
    expect(await changePersonPlan(ctx, { code: "STUDENT", pricePaise: 9_900, preview: true }, scope())).toMatchObject({ move: null, premium: null });
  });

  it("a save whose own write did not move the switch tells nobody, though it changed a price: another operator moved it between the reads (the review's C2)", async () => {
    const ctx = await as(realOperator);
    askedAsItStands();
    // The preview reads the switch to move; the save's compare-and-set meets it already moved, and writes the price alone.
    raced.next = { changed: true, activeMoved: false };
    const answer = await changePersonPlan(ctx, { code: "STUDENT", active: !student.active, pricePaise: 12_300 }, scope());
    expect(answer).toMatchObject({ preview: false, changed: true, premium: { told: 0 } });
    expect(await db.notification.count({ where: { userId: { in: people } } })).toBe(0);
  });

  it("the save carries the switch as the preview read it, so a row moved between the two is refused, never written untold; a body with no switch sends none (the check, point 3)", async () => {
    const ctx = await as(fixtureOperator);
    askedAsItStands();
    const writer = vi.mocked(setPersonPlan);
    const saveOf = () => writer.mock.calls.find(([, , opts]) => !opts?.preview)?.[1];
    writer.mockClear();
    await changePersonPlan(ctx, { code: "STUDENT", active: !student.active }, scope());
    expect(saveOf()).toMatchObject({ code: "STUDENT", active: !student.active, expect: { active: student.active } });
    writer.mockClear();
    await changePersonPlan(ctx, { code: "STUDENT", pricePaise: 12_300 }, scope());
    expect(saveOf()).not.toHaveProperty("expect");
  });

  it("the console's action refuses a switch sent without the switch as read, and the door answers a stale one by name (the review's D5; C4a point 5)", async () => {
    // As the fixture operator, who tells nobody: these three calls take no scope, so were a guard they prove ever lost, the
    // effect would be reckoned over every school on the database (the coordinating session's check, point 1).
    await as(fixtureOperator);
    const refused = { ok: false, error: t("plans.changedMeanwhile") };
    // The page's action requires `expect` for a move of the switch; the door and the library do not (C4a point 5).
    expect(await setPlanAction({ code: "STUDENT", active: !student.active })).toEqual(refused);
    expect(await previewPlanAction({ code: "STUDENT", active: !student.active } as Parameters<typeof previewPlanAction>[0])).toEqual(refused);
    const stale = await personPlansPut(new Request("http://localhost/api/v1/operator/person-plans", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: "STUDENT", active: !student.active, expect: { active: !student.active } }) }));
    expect(stale.status).toBe(422);
    expect(await stale.json()).toMatchObject({ error: t("plans.changedMeanwhile") });
    expect(await db.personPlan.findUniqueOrThrow({ where: { code: "STUDENT" }, select: { active: true, updatedAt: true } })).toEqual(student);
    expect(await db.notification.count({ where: { userId: { in: people } } })).toBe(0);
  });
});

describe("the confirmation, in the operator's words (C4 point 4; C3a)", () => {
  it("asking: who keeps and who loses the features, who holds it, the bills and who is told, and that nobody can buy it yet", async () => {
    // Worded from the effect of asking, whatever the row stands at (the sentence is the asking one).
    const effect = await premiumAskEffect("STUDENT", true, scope());
    const premium = { covered: effect.covered, others: effect.others, billed: effect.billed.length, noBillYet: effect.billed.filter((s) => s.noBill).length, toldSchools: 3, told: 2 };
    const sentence = await askConfirmation(t, "STUDENT", true, { move: { holders: 0, onSale: false, price: null }, premium }, "en");
    expect(sentence).toContain("Schools with Students premium: 5. Their students keep these features.");
    expect(sentence).toContain("At every other school (3), terms set or not, each student loses");
    expect(sentence).toContain("Schools billed premium from now: 4.");
    expect(sentence).toContain("Of these, without a bill yet: 1.");
    expect(sentence).toContain("The offices and heads of 3 of them are told, not an ended school's; people told: 2.");
    expect(sentence).toContain("Nobody can buy this plan yet: payment is not set up.");
  });

  it("ceasing: the features open to every student, off sale with a plan held running on, the bills that lose premium; the Expert plan: the lock and the sale alone", async () => {
    setActivePlansForTests(["STUDENT"]);
    const cease = await askConfirmation(t, "STUDENT", false, { move: { holders: 0, onSale: false, price: null }, premium: { covered: 5, others: 3, billed: 4, noBillYet: 1, toldSchools: 3, told: 2 } }, "en");
    expect(cease).toContain("Its features open to every student wherever they are switched on:");
    expect(cease).toContain("The plan comes off sale; a plan already held runs to its end.");
    expect(cease).toContain("Schools no longer billed premium: 4.");
    const expert = await askConfirmation(t, "EXPERT", true, { move: { holders: 2, onSale: true, price: { monthlyPaise: 49_900, yearlyPaise: 499_000 } }, premium: null }, "en");
    expect(expert).toContain("Every expert loses");
    expect(expert).toContain("People holding this plan now: 2.");
    expect(expert).toContain("A person can buy it here for ₹499 a month or ₹4,990 a year.");
    expect(expert).not.toMatch(/premium/);
  });
});
