import "server-only";
import { PLAN_FEATURES, PREMIUM_PLANS, type OperatorPersonPlanAnswer, type OperatorPersonPlanBody, type PlanAskEffect, type PlanCode, type PlanMove, type PremiumPlan } from "@edulink/contracts";
import { formatPaise, type Locale } from "@edulink/i18n";
import type { Translate } from "@/lib/i18n/dictionary";
import { db } from "./db";
import { FEATURE_META } from "./feature-meta";
import { PlanChangedMeanwhile, setPersonPlan, type PlanChange } from "./person-plans";
import { featuresOn } from "./platform-features";
import { officeCount, premiumAskEffect, tellOffices } from "./school-terms";
import { planSale } from "./pass-orders";
import type { ActiveContext } from "./session";

/**
 * ASKING FOR A PLAN, THROUGH PREMIUM (decision 0010 decisions 10 and 11; the coordinating session's C2, C3's fourth point,
 * C3a, C4 point 4, C4a points 2 to 5, C4b point 1 and C4c point 1 of 21 November 2026).
 *
 * A plan's "Asked for" switch is the lever premium waits on: from the moment the Student or Teacher plan is asked for, its
 * features are shut for everyone in that role at a school without premium who holds no plan of their own (answer A, "Yes,
 * lock the rest"), and the bills of the schools with that role's premium on gain their premium line (answer D, "Not billed
 * until then"); ceasing to ask opens the features to everyone again and takes the lines away. So the switch answers, before
 * it moves (`preview`), what its confirmation must say, which the console words in the operator's language
 * (askConfirmation), and, saved, tells the offices and heads of the schools whose premium starts or stops being billed, as
 * when our prices move their figure (decision 17; the coordinating session's reading), after the write. The plan's row is
 * still written by person-plans.ts alone, compared and set in one transaction with its audit row, and the bills are worked
 * out on read by school-terms.ts; this file joins the two.
 *
 * A switch made by an operator account that is a test fixture (User.isTestFixture, read from the operator's own row,
 * nothing a client sends) tells no office, and its preview counts none told: the features sweep switches plans as such an
 * operator (zz.operator@zz.test) and must tell nobody (C4a point 2, C4b point 1). The Expert plan is no part of premium, and a
 * price change moves no bill. `scope` is for the suites, which never move the Student or Teacher switch (C4c point 1).
 */
const isPremiumPlan = (code: string): code is PremiumPlan => (PREMIUM_PLANS as readonly string[]).includes(code);

export type PlanAskRefusal = { ok: false; errorKey: "plans.changedMeanwhile" };

async function isFixtureOperator(ctx: ActiveContext): Promise<boolean> {
  const row = await db.user.findUnique({ where: { id: ctx.user.id }, select: { isTestFixture: true } });
  return row?.isTestFixture === true;
}

export async function changePersonPlan(ctx: ActiveContext, body: OperatorPersonPlanBody, scope?: { schoolIds: string[] }): Promise<OperatorPersonPlanAnswer | PlanAskRefusal> {
  const { preview = false, ...change } = body;
  try {
    const before = await setPersonPlan(ctx, change as PlanChange, { preview: true });
    const moves = change.active !== undefined && change.active !== before.plan.active;
    const move: PlanMove | null = moves ? { holders: before.plan.entitledNow, ...(await planSale(change.code)) } : null;
    const effect = moves && isPremiumPlan(change.code) ? await premiumAskEffect(change.code, change.active!, scope) : null;
    const quiet = effect ? await isFixtureOperator(ctx) : true;
    const toTell = effect && !quiet ? effect.billed.filter((s) => !s.ended) : [];
    const premium = (told: number): PlanAskEffect | null =>
      effect ? { covered: effect.covered, others: effect.others, billed: effect.billed.length, noBillYet: effect.billed.filter((s) => s.noBill).length, toldSchools: toTell.length, told } : null;
    if (preview) return { preview: true, plan: before.plan, changed: before.changed, move, premium: premium(await officeCount(ctx, toTell.map((s) => s.id))) };
    // The save carries the switch as the preview read it (the body's own `expect` where it sent one), so a row another operator
    // moved between the two reads is refused by name and never written untold, in either direction (the check, point 3). A
    // body with no switch sends none.
    const save = (change.active !== undefined ? { ...change, expect: change.expect ?? { active: before.plan.active } } : change) as PlanChange;
    const set = await setPersonPlan(ctx, save);
    // Told only when this write moved the switch (the review's C2): a save that met it already moved by another operator,
    // between the preview's read and its own, writes a price alone and tells nobody. The other premium plan moving in the
    // same instant is not guarded: the schools billed are reckoned on the plans asked for as read.
    const told = set.activeMoved && toTell.length > 0 ? await tellOffices(ctx, toTell) : 0;
    return { preview: false, plan: set.plan, changed: set.changed, move, premium: premium(told) };
  } catch (error) {
    if (error instanceof PlanChangedMeanwhile) return { ok: false, errorKey: "plans.changedMeanwhile" };
    throw error;
  }
}

/**
 * The confirmation the console shows before a plan's switch moves (C4 point 4; rule 12: the server's sentence), in the
 * operator's language. Set to "Asked for": who keeps the features (a school's premium), who loses them (named, those
 * switched on), how many hold the plan, the bills that will now carry premium and who is told, how many of those have no
 * bill yet, and whether the plan can be bought ("Nobody can buy this plan yet: payment is not set up.", C3a, or its price
 * and, for the Student plan, that a pupil under eighteen is told to ask a guardian). Set back: the features open to
 * everyone in that role, the plan off sale with a plan held running to its end, and the bills that no longer carry premium.
 * The Expert plan: the lock and the sale alone.
 */
export async function askConfirmation(t: Translate, plan: PlanCode, active: boolean, answer: { move: PlanMove | null; premium: PlanAskEffect | null }, locale: Locale): Promise<string> {
  const on = await featuresOn();
  const named = PLAN_FEATURES[plan].filter((f) => on.includes(f)).map((f) => t(FEATURE_META[f].nameKey));
  const features = named.join(", ");
  // None of the plan's features switched on yet: said plainly, nobody losing anything today (the coordinating session's walk
  // of 22 November 2026; "each student loses no feature switched on yet" did not parse). Where some are on, they are named.
  const none = named.length === 0;
  const lines: string[] = [];
  const p = answer.premium;
  const billedLines = (key: "plans.askBilled" | "plans.ceaseBilled") => {
    if (!p || p.billed === 0) return;
    lines.push(t(key, { count: p.billed }));
    if (p.noBillYet > 0) lines.push(t("plans.askNoBillYet", { count: p.noBillYet }));
    if (p.toldSchools === 0) lines.push(t("plans.askToldNone"));
    else if (p.toldSchools === p.billed) lines.push(t("plans.askToldAll", { count: p.told }));
    else lines.push(t("plans.askToldSome", { schools: p.toldSchools, count: p.told }));
  };
  if (active) {
    if (plan === "EXPERT") lines.push(none ? t("plans.askOthersExpertNone") : t("plans.askOthersExpert", { features }));
    else if (p) {
      lines.push(t(plan === "STUDENT" ? "plans.askCoveredStudent" : "plans.askCoveredTeacher", { count: p.covered }));
      if (none) lines.push(t(plan === "STUDENT" ? "plans.askOthersStudentNone" : "plans.askOthersTeacherNone", { count: p.others }));
      else lines.push(t(plan === "STUDENT" ? "plans.askOthersStudent" : "plans.askOthersTeacher", { count: p.others, features }));
    }
    if (answer.move) lines.push(t("plans.askHolders", { count: answer.move.holders }));
    billedLines("plans.askBilled");
    const sale = answer.move;
    if (!sale?.onSale || !sale.price) lines.push(t("plans.askNotOnSale"));
    else {
      const prices = { monthly: formatPaise(sale.price.monthlyPaise, locale), yearly: formatPaise(sale.price.yearlyPaise, locale) };
      lines.push(t(plan === "STUDENT" ? "plans.askOnSaleStudent" : "plans.askOnSale", prices));
    }
  } else {
    lines.push(none ? t("plans.ceaseOpenNone") : t(plan === "STUDENT" ? "plans.ceaseOpenStudent" : plan === "TEACHER" ? "plans.ceaseOpenTeacher" : "plans.ceaseOpenExpert", { features }));
    lines.push(t("plans.ceaseOffSale"));
    billedLines("plans.ceaseBilled");
  }
  return lines.join(" ");
}
