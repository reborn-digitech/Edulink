import { COLLEGE_TIERS, collegeTierOf, isCollegeKind, paysPaise, type BulkAction, type BulkAnswer, type OfferChange, type PartFigure, type PaymentAnswer, type SchoolTerms } from "@edulink/contracts";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";

/**
 * THE OPERATOR'S SENTENCES FOR THE SUBSCRIPTION CONSOLE (decision 0010; the brief's §2.1 to §2.4 and rule 12, "every
 * sentence is the server's"; the coordinating session's C2, C2a, C2b, C3 and C3a of 21 November 2026). Each is worded from
 * a door's answer, a preview's (`preview: true`, which writes nothing) or the terms as read, by the server actions of
 * /root/subscriptions and the school's page, and shown where the act is made: a toast with Undo, a sheet's preview, the card.
 * Pure: the words, the money, the day and the percent come in, so a suite reads every branch in three languages.
 *
 * The two parts are always named "Shalaghar subscription" and "Premium add-on" (§2.0); a figure is a student a year and
 * before GST; a bill or an estimate is "at today's prices, last count" (rule 8). A premium PRICE is shown where premium is
 * on and billed, or prospectively where it is off; where it is on and not billed, the reason stands in its place (C2b, C3);
 * the AMOUNT only from the bill's own line (C2b). A counted sentence has a form for one (TA-332).
 */
export type Fmt = { t: Translate; money: (paise: number) => string; day: (key: string) => string; percent: (bps: number) => string };

/** The tier's name, for a college. */
function tierName(f: Fmt, code: string | null): string {
  const tier = COLLEGE_TIERS.find((t) => t.code === code);
  if (!tier) return "";
  return f.t(tier.code === "college-affiliated" ? "operatorCollege.tierAffiliated" : "operatorCollege.tierAutonomous");
}

/** Our base price for a part, as the figure read it: the tier at a college, ours elsewhere. */
function isTier(figure: PartFigure): boolean {
  return figure.tierCode !== null;
}

/** How a part is priced, short, for a cell (§2.1): "ours", "own 20 % off ₹100", "own price", "tier (Affiliated college)". */
export function partShort(f: Fmt, figure: PartFigure): string {
  if (figure.paysPaise === 0) return f.t("root.freeByAgreement");
  if (isTier(figure)) {
    const tier = tierName(f, figure.tierCode);
    return figure.source === "OWN_DISCOUNT" ? f.t("subs.shortTierOwnDiscount", { tier, percent: f.percent(figure.discountBps) }) : f.t("subs.shortTier", { tier });
  }
  if (figure.source === "OWN_PRICE") return f.t("subs.shortOwnPrice");
  if (figure.source === "OWN_DISCOUNT") return f.t("subs.shortOwnDiscount", { percent: f.percent(figure.discountBps), base: f.money(figure.basePaise) });
  return f.t("subs.shortOurs");
}

/** A part's cell: its price and how (§2.1), "₹80 · own 20 % off ₹100"; free by agreement alone. */
export function partCell(f: Fmt, figure: PartFigure): string {
  if (figure.paysPaise === 0) return f.t("root.freeByAgreement");
  return f.t("subs.cell", { price: f.money(figure.paysPaise), how: partShort(f, figure) });
}

/** How a part is priced, in a sentence's brackets (§2.3, §2.4): "ours; it moves with ours", "its own price, fixed". */
export function partHow(f: Fmt, figure: PartFigure): string {
  if (isTier(figure)) {
    const tier = tierName(f, figure.tierCode);
    return figure.source === "OWN_DISCOUNT" ? f.t("subs.howTierOwnDiscount", { tier, percent: f.percent(figure.discountBps) }) : f.t("subs.howTier", { tier });
  }
  if (figure.source === "OWN_PRICE") return f.t("subs.howOwnPrice");
  if (figure.source === "OWN_DISCOUNT") return f.t("subs.howOwnDiscount", { percent: f.percent(figure.discountBps), base: f.money(figure.basePaise) });
  return f.t("subs.howOurs");
}

/** Who a school's premium is for, as switched on. */
function whoOf(f: Fmt, students: boolean, teachers: boolean): string {
  return f.t(students && teachers ? "subs.whoBoth" : students ? "subs.whoStudents" : "subs.whoTeachers");
}

/** Why premium is on and not billed (C3a's order: the terms first, then the plans not asked for). */
function notBilledWhy(f: Fmt, view: Pick<SchoolTerms, "premiumNotBilled" | "premiumWaitsFor">): string {
  if (view.premiumNotBilled === "TERMS_NOT_SET") return f.t("subs.notBilledTerms");
  const student = view.premiumWaitsFor.includes("STUDENT");
  const teacher = view.premiumWaitsFor.includes("TEACHER");
  return f.t(student && teacher ? "subs.notBilledBothPlans" : student ? "subs.notBilledStudentPlan" : "subs.notBilledTeacherPlan");
}

type PremiumView = Pick<SchoolTerms, "premiumStudents" | "premiumTeachers" | "premiumBilled" | "premiumNotBilled" | "premiumWaitsFor" | "premiumFigure" | "subscriptionFigure">;

/**
 * The premium column (§2.1; C2, C2b, C3): off, its price prospectively ("₹50 if on"); on and billed, its price and how; on and
 * not billed, why ("Premium on, not billed: terms not set"); free by agreement.
 */
export function premiumCell(f: Fmt, view: PremiumView): string {
  const on = view.premiumStudents || view.premiumTeachers;
  if (!on) return view.premiumFigure.paysPaise === 0 ? f.t("root.freeByAgreement") : f.t("subs.premiumIfOn", { price: f.money(view.premiumFigure.paysPaise) });
  // In C7a's order (point 2b): the terms not set first; then a college with no tier, which has no bill whatever its plan (the
  // review of bace327b, T1: premiumBilled reads the terms and the plans, never the tier); then the plan.
  if (view.premiumNotBilled !== "TERMS_NOT_SET" && view.subscriptionFigure === null) return f.t("subs.premiumOnNotBilled", { why: f.t("subs.notBilledTier") });
  if (!view.premiumBilled) return f.t("subs.premiumOnNotBilled", { why: notBilledWhy(f, view) });
  return partCell(f, view.premiumFigure);
}

/** A premium sentence's view: the cell's, with what tells a college on no tier. */
type PremiumSentenceView = PremiumView & Pick<SchoolTerms, "kind" | "planCode" | "noTierChosen">;
type PremiumNeed = "TERMS" | "TIER" | "STUDENT" | "TEACHER" | "EITHER";
const WAITS_ONE: Record<PremiumNeed, TranslationKey> = { TERMS: "subs.sPremiumWaitsTerms", TIER: "subs.sPremiumWaitsTier", STUDENT: "subs.sPremiumWaitsStudent", TEACHER: "subs.sPremiumWaitsTeacher", EITHER: "subs.sPremiumWaitsBoth" };
const NEED: Record<PremiumNeed, TranslationKey> = { TERMS: "subs.needTerms", TIER: "subs.needTier", STUDENT: "subs.needStudentPlan", TEACHER: "subs.needTeacherPlan", EITHER: "subs.needEitherPlan" };

/**
 * What still stands between premium switched on and a bill, in C7a's order (point 2b): its terms not set; at a college, no
 * tier chosen (whether its terms are set or not); the plan, or either plan, not asked for (`premiumWaitsFor`).
 */
function premiumNeeds(view: PremiumSentenceView): PremiumNeed[] {
  const needs: PremiumNeed[] = [];
  if (view.premiumNotBilled === "TERMS_NOT_SET") needs.push("TERMS");
  if (view.noTierChosen || (isCollegeKind(view.kind) && collegeTierOf(view.planCode) === null)) needs.push("TIER");
  const student = view.premiumWaitsFor.includes("STUDENT");
  const teacher = view.premiumWaitsFor.includes("TEACHER");
  if (student && teacher) needs.push("EITHER");
  else if (student) needs.push("STUDENT");
  else if (teacher) needs.push("TEACHER");
  return needs;
}

/**
 * The premium sentence of a school's terms, for a sheet's preview and its toast (§2.4; C3; C4a point 9 (i)): the price being
 * set always shows, as it will stand after the save, with when it will be billed where it will not be billed yet, and off,
 * what it would be if switched on. Never one condition named as if it were enough (C7a point 2b): where one thing stands
 * ("billed once the Student plan is asked for", "once terms are set", "once the college's tier is chosen") it is said so;
 * where more than one stands, every one, in order, after "Not billed yet; still needed:". Free by agreement is said so,
 * whatever else is missing. Rows, cards and bills keep the reason alone in the price's place (C2b's "not at all").
 */
function premiumSentence(f: Fmt, view: PremiumSentenceView): string {
  const on = view.premiumStudents || view.premiumTeachers;
  const figure = view.premiumFigure;
  if (!on) return figure.paysPaise === 0 ? f.t("subs.sPremiumOffFree") : f.t("subs.sPremiumOffPrice", { price: f.money(figure.paysPaise), how: partHow(f, figure) });
  const who = whoOf(f, view.premiumStudents, view.premiumTeachers);
  if (figure.paysPaise === 0) return f.t("subs.sPremiumFree", { who });
  const vars = { who, price: f.money(figure.paysPaise), how: partHow(f, figure) };
  const needs = premiumNeeds(view);
  if (needs.length === 0) return f.t("subs.sPremium", vars);
  if (needs.length === 1) return f.t(WAITS_ONE[needs[0]!], vars);
  return f.t("subs.sPremiumWaitsMany", { ...vars, needs: needs.map((need) => f.t(NEED[need])).join("; ") });
}

/** Where the school's year stands, in a sentence (§2.3, §2.4). */
export function datesSentence(f: Fmt, view: Pick<SchoolTerms, "state" | "stateDay" | "renewsOn">): string {
  const date = view.stateDay ? f.day(view.stateDay) : "";
  // A running status with no renewal on record has no date to name: said so, never a hole (the review of phase 5, A4).
  if (!view.stateDay && view.state === "FREE") return f.t("subs.sFreeNoDate");
  if (!view.stateDay && view.state === "PAID") return f.t("subs.sPaidNoDate");
  if (!view.stateDay && view.state === "INVOICED_UNPAID") return f.t("subs.sOwedNoDate");
  switch (view.state) {
    case "FREE":
      return f.t("subs.sFreeUntil", { date });
    case "PAID":
      return f.t("subs.sPaidTo", { date });
    case "FREE_ENDED":
    case "RENEWAL_PASSED":
    case "DUE_SINCE":
      return f.t("subs.sRenewalPassed", { date });
    case "INVOICED_UNPAID":
      // Due with its day still ahead: "Owed from {date}", true of an early invoice and of a start still ahead (C1c).
      return f.t("subs.sOwedFrom", { date });
    case "NO_RECORD":
      return f.t("subs.sNoRecord");
    case "SUSPENDED_OPEN":
      return f.t("subs.sSuspended");
    case "RECORDING_PAUSED":
      return f.t("subs.sPaused", { date });
    case "ENDED":
      return f.t("subs.sEnded");
  }
}

/**
 * The whole school's terms as one passage (§2.4), from a terms view: the sheet's preview of a save and the school's card.
 * Terms not set: what it pays from before, with no figure of ours (rule 19). Each piece is a whole sentence, so the three
 * languages keep their own order.
 */
export function schoolTermsSentence(f: Fmt, view: SchoolTerms, oldMonthPaise?: number | null): string {
  const lines: string[] = [];
  if (!view.termsSet) {
    lines.push(oldMonthPaise ? f.t("subs.sNotSetOld", { school: view.name, amount: f.money(oldMonthPaise) }) : f.t("subs.sNotSet", { school: view.name }));
    if (view.premiumStudents || view.premiumTeachers) lines.push(premiumSentence(f, view));
    lines.push(datesSentence(f, view));
    return lines.join(" ");
  }
  const sub = view.subscriptionFigure;
  if (!sub) lines.push(f.t("subs.sNoTier", { school: view.name }));
  else if (sub.paysPaise === 0) lines.push(f.t("subs.sSubscriptionFree", { school: view.name }));
  else lines.push(f.t("subs.sSubscription", { school: view.name, price: f.money(sub.paysPaise), how: partHow(f, sub) }));
  lines.push(premiumSentence(f, view));
  lines.push(datesSentence(f, view));
  lines.push(f.t("subs.sBeforeGst"));
  return lines.join(" ");
}

/** How a part will move, in the onboarding summary's words (C2): "our price: it moves when you change your price", "held at ₹120 whatever your price does". */
function onboardHow(f: Fmt, figure: PartFigure): string {
  if (isTier(figure)) {
    const tier = tierName(f, figure.tierCode);
    if (figure.source === "OWN_DISCOUNT") return f.t("subs.obHowTierOwnDiscount", { tier, percent: f.percent(figure.discountBps) });
    // Our discount at nothing: the tier's full price, with no word of a discount (the second review's W-4).
    return figure.discountBps === 0 ? f.t("subs.obHowTierFull", { tier }) : f.t("subs.obHowTier", { tier });
  }
  if (figure.source === "OWN_PRICE") return f.t("subs.obHowOwnPrice", { price: f.money(figure.paysPaise) });
  if (figure.source === "OWN_DISCOUNT") return f.t("subs.obHowOwnDiscount", { percent: f.percent(figure.discountBps) });
  return f.t("subs.obHowOurs");
}

/** What onboarding will set, as its preview reckoned it (src/lib/subscriptions.ts, previewOnboarding): the summary's input. */
export type OnboardSummary = {
  school: string;
  subscription: PartFigure | null;
  premium: { students: boolean; teachers: boolean; figure: PartFigure; billed: boolean; waitsFor: readonly string[] };
  startsOn: string;
  renewsOn: string;
  status: "TRIAL" | "DUE";
  /** The whole free months a typed renewal gives, said back (§2.5); null where the free months set the renewal. */
  impliedMonths: number | null;
};

/**
 * Onboarding's summary sentence (§2.5; phase 6), under the form's "Subscription and premium": what the school will pay for
 * its subscription and how it moves (C2: "it moves when you change your price", "held at ₹… whatever your price does"), a
 * ticked premium in the sheet's own sentence, the price chosen and, while its plan is not asked for, "billed once the Student
 * plan is asked for" (C6), and when billing starts:
 * free until the renewal (TRIAL), owed from its first day (no free months) or owed now (a renewal on or before today, which
 * the tick confirms). Nothing billed at all (no tier, or free by agreement), the renewal alone. Each piece a whole sentence.
 */
export function onboardSentence(f: Fmt, input: OnboardSummary): string {
  const lines: string[] = [];
  const sub = input.subscription;
  if (!sub) lines.push(f.t("subs.sNoTier", { school: input.school }));
  else if (sub.paysPaise === 0) lines.push(f.t("subs.sSubscriptionFree", { school: input.school }));
  else lines.push(f.t("subs.obSubscription", { school: input.school, price: f.money(sub.paysPaise), how: onboardHow(f, sub) }));
  const premium = input.premium;
  const on = premium.students || premium.teachers;
  const premiumCharged = on && premium.billed && premium.figure.paysPaise > 0;
  // No subscription figure (a college with no tier), no bill at all, premium or not (billFor; C2a).
  const charged = sub !== null && (sub.paysPaise > 0 || premiumCharged);
  // When billing starts, next to the subscription it concerns, so it never stands beside premium's own "billed once …".
  const date = f.day(input.renewsOn);
  if (!charged) lines.push(f.t("subs.obRenewsOn", { date }));
  else if (input.status === "TRIAL") lines.push(f.t("subs.obFreeUntil", { date }));
  else if (input.renewsOn === input.startsOn) lines.push(f.t("subs.obOwedFirstDay", { date }));
  else lines.push(f.t("subs.obOwedNow", { date }));
  if (input.impliedMonths !== null) lines.push(f.t("subs.obTypedMonths", { count: input.impliedMonths }));
  // A ticked premium is named as the sheet names it, the price chosen and how it moves, with "billed once the Student plan is
  // asked for" while its plan is not (C6, replacing C3 point 3: the operator sets that price in this very step); none
  // ticked, no premium price, unless premium's own price or discount was chosen in this step, which the save writes: then the
  // sheet's off sentence names it (C7.4). The terms are set by this onboarding, so the plan is the only reason premium waits.
  const ownPremium = premium.figure.source !== "OURS";
  if (!on && !ownPremium) lines.push(f.t("subs.obPremiumOff"));
  else
    lines.push(
      premiumSentence(f, {
        premiumStudents: premium.students,
        premiumTeachers: premium.teachers,
        premiumBilled: premium.billed,
        premiumNotBilled: !on || premium.billed ? null : "PLAN_NOT_ASKED",
        premiumWaitsFor: premium.waitsFor.filter((plan): plan is "STUDENT" | "TEACHER" => plan === "STUDENT" || plan === "TEACHER"),
        premiumFigure: premium.figure,
        // A college onboarded with no tier has no subscription figure, and no bill until one is chosen.
        kind: null,
        planCode: null,
        noTierChosen: sub === null,
        subscriptionFigure: sub,
      }),
    );
  // Whenever a figure in rupees is named (C7.6).
  const namesRupees = (sub !== null && sub.paysPaise > 0) || ((on || ownPremium) && premium.figure.paysPaise > 0);
  if (namesRupees) lines.push(f.t("subs.sBeforeGst"));
  return lines.join(" ");
}

/** The premium line's amount on a bill, when the bill has one (C2b: the amount only from the bill's own line). */
function premiumAmount(view: SchoolTerms): number | null {
  return view.bill?.lines.find((l) => l.part === "PREMIUM")?.totalPaise ?? null;
}

/** "1 person at the school is told." / "{count} people …", or, in a preview, "will be told" (A10); nobody, nothing said. */
function toldSentence(f: Fmt, told: number, many: "school" | "schools", preview = false): string | null {
  if (told === 0) return null;
  if (many === "school") return told === 1 ? f.t(preview ? "subs.toldWillOne" : "subs.toldOne") : f.t(preview ? "subs.toldWillMany" : "subs.toldMany", { count: told });
  return told === 1 ? f.t(preview ? "subs.toldSchoolsWillOne" : "subs.toldSchoolsOne") : f.t(preview ? "subs.toldSchoolsWillMany" : "subs.toldSchoolsMany", { count: told });
}

/**
 * The switch's toast (§2.1): premium for students or teachers on or off at one school, worded from the preview of the
 * save (`after`) and the terms as read (`before`): when and what it is billed, or why not (C3), and who is told.
 *
 * `ask`: worded for the question asked before the act, as the terms door answers it under the phone's question (C7 point 7c,
 * as C7a point 2 settles it), a flag the door sets. A switch ON opens in the future and says who will be told; where premium
 * will not be billed after it, the price being set is named as the premium sheet names it, with every thing that still
 * stands between it and a bill, in place of "It is not billed: …", then "Figures are before GST." where that names a figure
 * (it says no "+ GST" itself); at a college whose plan is asked for and whose tier alone is missing, the sentence that
 * exists. A switch OFF is the console's sheet's own sentence before the act, with nothing added. The console's toast,
 * written when the toast goes, is unchanged.
 */
export function switchSentence(f: Fmt, input: { role: "students" | "teachers"; on: boolean; before: SchoolTerms; after: SchoolTerms; told: number; preview?: boolean; ask?: boolean }): string {
  const { role, on, before, after } = input;
  const ask = input.ask === true;
  const school = after.name;
  const lines: string[] = [];
  if (on) {
    lines.push(f.t(role === "students" ? (ask ? "subs.switchOnStudentsWill" : "subs.switchOnStudents") : ask ? "subs.switchOnTeachersWill" : "subs.switchOnTeachers", { school }));
    const needs = premiumNeeds(after);
    if (ask && needs.length > 0 && !(needs.length === 1 && needs[0] === "TIER")) {
      lines.push(premiumSentence(f, after));
      if (after.premiumFigure.paysPaise > 0) lines.push(f.t("subs.sBeforeGst"));
    } else if (!after.premiumBilled) lines.push(f.t("subs.switchNotBilled", { why: notBilledWhy(f, after) }));
    else if (after.premiumFigure.paysPaise === 0) lines.push(f.t("subs.switchFree"));
    // Billed already through the other role: one premium figure whichever switches are on (C3), so the bill does not move.
    else if (before.premiumBilled) lines.push(f.t("subs.switchAlreadyBilled"));
    else if (!after.subscriptionFigure) lines.push(f.t("subs.switchNoTier", { price: f.money(after.premiumFigure.paysPaise) }));
    else if (!after.renewsOn) lines.push(f.t("subs.switchNoRenewal", { price: f.money(after.premiumFigure.paysPaise) }));
    else {
      const amount = premiumAmount(after);
      const vars = { date: f.day(after.renewsOn), price: f.money(after.premiumFigure.paysPaise), sub: f.money(after.subscriptionFigure.paysPaise) };
      // A subscription free by agreement is said so, never "on top of its ₹0 subscription" (the review of phase 5, A8, B10).
      const free = after.subscriptionFigure.paysPaise === 0;
      if (amount !== null) lines.push(f.t(free ? "subs.switchBilledFreeSub" : "subs.switchBilled", { ...vars, amount: f.money(amount) }));
      else lines.push(f.t(free ? "subs.switchBilledFreeSubNoCount" : "subs.switchBilledNoCount", vars));
    }
  } else {
    // Off is confirmed in a sheet first, so its sentence there is the future (the review of phase 5, A10); the phone's
    // question is that sheet's sentence, with nothing added (C7a point 2a).
    const will = input.preview === true || ask;
    lines.push(f.t(role === "students" ? (will ? "subs.switchOffStudentsWill" : "subs.switchOffStudents") : will ? "subs.switchOffTeachersWill" : "subs.switchOffTeachers", { school }));
    const stillOn = after.premiumStudents || after.premiumTeachers;
    // A college with no tier chosen has no bill, so neither bill line is said, in either tense (C7b point 2; premiumBilled reads
    // the terms and the plans, never the tier, and is left so in phase 8).
    const noBill = before.subscriptionFigure === null || after.subscriptionFigure === null;
    if (!noBill && before.premiumBilled && !after.premiumBilled && before.premiumFigure.paysPaise > 0) lines.push(f.t(will ? "subs.switchOffBillWill" : "subs.switchOffBill", { price: f.money(before.premiumFigure.paysPaise) }));
    else if (!noBill && stillOn && after.premiumBilled)
      lines.push(f.t(after.premiumTeachers ? (will ? "subs.switchOffStillBilledTeachersWill" : "subs.switchOffStillBilledTeachers") : will ? "subs.switchOffStillBilledStudentsWill" : "subs.switchOffStillBilledStudents"));
  }
  // A switch on is the toast's own act, written when the toast goes; told is said as done there, as it will be in the sheet,
  // and in the future under the phone's question. Nobody told, nothing said.
  const told = toldSentence(f, input.told, "school", (!on && input.preview === true) || ask);
  if (told) lines.push(told);
  return lines.join(" ");
}

/**
 * A terms save at one school, worded for the sheet's preview and its toast: the whole school's terms as they would stand,
 * then, where its terms are first set at a school with a partner, the partner's month (C2b), then who is told. A save that
 * changes nothing says so; one that moves only the operator's note says that only the operator sees it.
 */
export function termsChangeSentence(f: Fmt, input: { after: SchoolTerms; changed: boolean; noteOnly: boolean; told: number; preview: boolean; partner?: { partner: string; today: PartnerReading; once: PartnerReading } | null }): string {
  if (!input.changed) return f.t("subs.nothingChanges");
  if (input.noteOnly) return f.t(input.preview ? "subs.noteWillSave" : "subs.noteSaved");
  const lines = [schoolTermsSentence(f, input.after)];
  if (input.partner) lines.push(partnerSentence(f, input.partner));
  const told = toldSentence(f, input.told, "school", input.preview);
  if (told) lines.push(told);
  return lines.join(" ");
}

/** Which part a key names. */
const PART_NAME: Record<"SUBSCRIPTION" | "PREMIUM", TranslationKey> = { SUBSCRIPTION: "subs.partSubscription", PREMIUM: "subs.partPremium" };

/**
 * Our offer's change (rule 9; §2.2): per part, the schools that follow it and what they will pay, those with their own
 * discount that move too, by name; those that do not move; the year's difference at last count; how many people are told;
 * and that nothing is charged. The free months and the onboarding ticks, when they move, last.
 */
export function offerChangeSentence(
  f: Fmt,
  change: OfferChange,
  before: { subscriptionPricePaise: number; subscriptionDiscountBps: number; premiumPricePaise: number; premiumDiscountBps: number; freeMonths: number; studentsByDefault: boolean; teachersByDefault: boolean },
  asked: ReadonlySet<string> = new Set(),
): string {
  const lines: string[] = [];
  for (const part of ["SUBSCRIPTION", "PREMIUM"] as const) {
    const name = f.t(PART_NAME[part]);
    // Our own price and discount for the part, before and after, first.
    const was = part === "SUBSCRIPTION" ? { price: before.subscriptionPricePaise, discount: before.subscriptionDiscountBps } : { price: before.premiumPricePaise, discount: before.premiumDiscountBps };
    const now = part === "SUBSCRIPTION" ? change.offer.subscription : change.offer.premium;
    // Premium is "more a student a year", never a price on its own (§2.0; the review of phase 5, B12).
    if (now.pricePaise !== was.price)
      lines.push(part === "PREMIUM" ? f.t("subs.offerPriceMovesPremium", { before: f.money(was.price), after: f.money(now.pricePaise) }) : f.t("subs.offerPriceMoves", { part: name, before: f.money(was.price), after: f.money(now.pricePaise) }));
    if (now.discountBps !== was.discount) lines.push(f.t("subs.offerDiscountMoves", { part: name, before: f.percent(was.discount), after: f.percent(now.discountBps) }));
    const moves = change.moves.filter((m) => m.part === part);
    const follow = new Map<string, { before: number; after: number; count: number }>();
    for (const m of moves.filter((m) => m.source === "OURS")) {
      const key = `${m.beforePaise}:${m.afterPaise}`;
      const group = follow.get(key) ?? { before: m.beforePaise, after: m.afterPaise, count: 0 };
      group.count += 1;
      follow.set(key, group);
    }
    for (const g of follow.values()) {
      const vars = { part: name, after: f.money(g.after), before: f.money(g.before) };
      if (part === "PREMIUM") lines.push(g.count === 1 ? f.t("subs.offerFollowPremiumOne", vars) : f.t("subs.offerFollowPremiumMany", { ...vars, count: g.count }));
      else lines.push(g.count === 1 ? f.t("subs.offerFollowOne", vars) : f.t("subs.offerFollowMany", { ...vars, count: g.count }));
    }
    const own = moves.filter((m) => m.source === "OWN_DISCOUNT");
    if (own.length > 0) {
      const item = part === "PREMIUM" ? "subs.offerMoveItemPremium" : "subs.offerMoveItem";
      const list = own.map((m) => f.t(item, { school: m.name, after: f.money(m.afterPaise), before: f.money(m.beforePaise) })).join(", ");
      lines.push(own.length === 1 ? f.t("subs.offerOwnDiscountOne", { part: name, list }) : f.t("subs.offerOwnDiscountMany", { part: name, list, count: own.length }));
    }
  }
  // Where premium is billed nowhere, its price still moves for the schools that follow it (the review of phase 5, A1).
  const notBilled = change.premiumNotBilled ?? 0;
  if (notBilled > 0) lines.push(notBilled === 1 ? f.t("subs.offerPremiumNotBilledOne") : f.t("subs.offerPremiumNotBilledMany", { count: notBilled }));
  if (change.moves.length === 0 && notBilled === 0) lines.push(f.t("subs.offerNothingMoves"));
  if (change.unchanged.ownPrice > 0 || change.unchanged.notSet > 0) lines.push(f.t("subs.offerUnchanged", { ownPrice: change.unchanged.ownPrice, notSet: change.unchanged.notSet }));
  if (change.yearDeltaPaise > 0) lines.push(f.t("subs.offerYearMore", { amount: f.money(change.yearDeltaPaise) }));
  else if (change.yearDeltaPaise < 0) lines.push(f.t("subs.offerYearLess", { amount: f.money(-change.yearDeltaPaise) }));
  if (change.offer.freeMonths !== before.freeMonths) lines.push(f.t("subs.offerFreeMonths", { after: change.offer.freeMonths, before: before.freeMonths }));
  // A box starts ticked only while its plan is asked for (C3 point 3; C5 point 9): said so where it is not.
  if (change.offer.studentsByDefault !== before.studentsByDefault || change.offer.teachersByDefault !== before.teachersByDefault) {
    const s = change.offer.studentsByDefault;
    const t = change.offer.teachersByDefault;
    if (!s && !t) lines.push(f.t("subs.offerTicksNone"));
    if (s) lines.push(f.t(asked.has("STUDENT") ? "subs.offerTickStudentsOn" : "subs.offerTickStudentsWaits"));
    if (t) lines.push(f.t(asked.has("TEACHER") ? "subs.offerTickTeachersOn" : "subs.offerTickTeachersWaits"));
  }
  const told = toldSentence(f, change.told, "schools", change.preview);
  if (told) lines.push(told);
  lines.push(f.t("subs.nothingCharged"));
  return lines.join(" ");
}

/**
 * Record payment's preview (§2.3; C2): where the renewal moves and where the twelve months run from, that the school
 * becomes Paid, and, against the bill at today's prices, last count, a different amount named by line.
 */
export function paymentSentence(f: Fmt, input: { answer: PaymentAnswer; view: SchoolTerms; paidOn: string; today: string; amountPaise: number }): string {
  const { answer, view } = input;
  const lines: string[] = [];
  const to = f.day(answer.renewalAfter);
  // From the renewal on record only where a status is on record too: with none, the year starts on the day paid (rule 5).
  if (answer.renewalBefore && view.status !== null) lines.push(f.t("subs.payFromRenewal", { from: f.day(answer.renewalBefore), to }));
  else if (input.paidOn === input.today) lines.push(f.t("subs.payFromToday", { to }));
  else lines.push(f.t("subs.payFromPaidOn", { date: f.day(input.paidOn), to }));
  // Paid only where the moved renewal is still ahead; one still passed reads Renewal passed (the review of phase 5, A6).
  lines.push(answer.renewalAfter <= input.today ? f.t("subs.payBecomesPassed", { to }) : f.t("subs.payBecomesPaid"));
  if (answer.billPaise === null) lines.push(f.t("subs.payNoBill"));
  else if (answer.differencePaise !== null && answer.differencePaise !== 0) {
    const sub = view.bill?.lines.find((l) => l.part === "SUBSCRIPTION")?.totalPaise ?? 0;
    const prem = view.bill?.lines.find((l) => l.part === "PREMIUM")?.totalPaise ?? null;
    const pupils = view.bill?.pupils ?? 0;
    const billVars = { sub: f.money(sub), total: f.money(answer.billPaise), count: pupils };
    if (prem === null) lines.push(pupils === 1 ? f.t("subs.payBillOne", billVars) : f.t("subs.payBillMany", billVars));
    else lines.push(pupils === 1 ? f.t("subs.payBillPremiumOne", { ...billVars, premium: f.money(prem) }) : f.t("subs.payBillPremiumMany", { ...billVars, premium: f.money(prem) }));
    const diff = f.money(Math.abs(answer.differencePaise));
    lines.push(answer.differencePaise > 0 ? f.t("subs.payMore", { difference: diff }) : f.t("subs.payLess", { difference: diff }));
  }
  return lines.join(" ");
}

/**
 * A bulk change (§2.1): the schools that change (or would), by name; for "Put on our prices", each school's terms before and
 * that it follows ours for both parts; those already so; who is told.
 */
export function bulkSentence(f: Fmt, input: { action: BulkAction; answer: BulkAnswer; before: Map<string, { subscription: PartFigure | null; premium: PartFigure; termsSet: boolean }>; partners?: { school: string; partner: string; today: PartnerReading; once: PartnerReading }[] }): string {
  const { action, answer } = input;
  const lines: string[] = [];
  const n = answer.changed.length;
  // Nothing changes: said once; over colleges' teachers alone the left line says why (the review of phase 5, B7).
  if (n === 0 && !(action === "TEACHERS_ON" && answer.unchanged > 0)) lines.push(f.t("subs.bulkNothing"));
  else if (action === "OUR_PRICES") {
    const items = answer.changed.map((c) => {
      const was = input.before.get(c.schoolId);
      if (!was || !was.termsSet) return f.t("subs.bulkOursFromNotSet", { school: c.name });
      const sub = was.subscription ? partCell(f, was.subscription) : f.t("operatorCollege.noTierChosen");
      return f.t("subs.bulkOursFrom", { school: c.name, sub, premium: partCell(f, was.premium) });
    });
    lines.push(n === 1 ? f.t(answer.preview ? "subs.bulkOursWillOne" : "subs.bulkOursDidOne", { list: items.join("; ") }) : f.t(answer.preview ? "subs.bulkOursWillMany" : "subs.bulkOursDidMany", { list: items.join("; "), count: n }));
  } else {
    const list = answer.changed.map((c) => c.name).join(", ");
    const key = (one: boolean): TranslationKey => {
      const base = { STUDENTS_ON: "StudentsOn", STUDENTS_OFF: "StudentsOff", TEACHERS_ON: "TeachersOn", TEACHERS_OFF: "TeachersOff" }[action];
      return `subs.bulk${base}${answer.preview ? "Will" : "Did"}${one ? "One" : "Many"}` as TranslationKey;
    };
    lines.push(n === 1 ? f.t(key(true), { list }) : f.t(key(false), { list, count: n }));
  }
  // Teachers' premium at a college does not apply and is left: the sentence says so rather than "already so" (the reader).
  if (answer.unchanged > 0 && action === "TEACHERS_ON") lines.push(answer.unchanged === 1 ? f.t("subs.bulkLeftTeachersOnOne") : f.t("subs.bulkLeftTeachersOnMany", { count: answer.unchanged }));
  else if (answer.unchanged > 0) lines.push(answer.unchanged === 1 ? f.t("subs.bulkAlreadyOne") : f.t("subs.bulkAlreadyMany", { count: answer.unchanged }));
  // What a first terms save does to each partner's month it touches (C4a point 9 (iii)), on the operator's screen only.
  for (const p of input.partners ?? []) lines.push(f.t("subs.bulkPartnerAt", { school: p.school, line: partnerSentence(f, p) }));
  const told = toldSentence(f, answer.told, "schools", answer.preview);
  if (told) lines.push(told);
  return lines.join(" ");
}

/** The partner's month as partnerMonth reads it. */
export type PartnerReading = { monthPaise: number | null; earns: boolean; renewalReached: boolean; unpriced: boolean; freeByAgreement: boolean };

/**
 * The partner's month in the terms sheet, where terms are first set at a school that has a partner (C2b): what the partner
 * is reckoned on today and what on once these terms are set ("nothing until the school is paid up to date" where so), in
 * the operator's own screen only, never in the school's log or notice.
 */
export function partnerSentence(f: Fmt, input: { partner: string; today: PartnerReading; once: PartnerReading }): string {
  const { partner, today, once } = input;
  const first = today.earns && today.monthPaise ? f.t("subs.partnerToday", { partner, amount: f.money(today.monthPaise) }) : f.t("subs.partnerTodayNothing", { partner });
  let second: string;
  if (once.earns && once.monthPaise) second = f.t("subs.partnerOnce", { amount: f.money(once.monthPaise) });
  else if (once.freeByAgreement) second = f.t("subs.partnerOnceFree");
  else if (once.unpriced) second = f.t("subs.partnerOnceUnpriced");
  else second = f.t("subs.partnerOncePaidUp");
  return `${first} ${second}`;
}

/**
 * The information lines above the Schools tab's list and on a school's card (C2; C5 point 6): at most two, one for the plans
 * not asked for, worded so that it is true while features are switched off, and one listing the features switched off for
 * everyone. The card gives the second only while that school has premium on.
 */
export function premiumInfoLines(f: Fmt, input: { notAsked: readonly string[]; offForAll: readonly string[]; college?: boolean; premiumOn?: boolean }): string[] {
  const lines: string[] = [];
  const student = input.notAsked.includes("STUDENT");
  const teacher = input.notAsked.includes("TEACHER") && !input.college;
  if (student && teacher) lines.push(f.t("subs.plansNotAskedBoth"));
  else if (student) lines.push(f.t("subs.plansNotAskedStudent"));
  else if (teacher) lines.push(f.t("subs.plansNotAskedTeacher"));
  if (input.offForAll.length > 0 && input.premiumOn !== false) lines.push(f.t("subs.featuresOffForAll", { features: input.offForAll.join(", ") }));
  return lines;
}

/** The state badge's words (§2.1): Free, Paid, Due since {date}, Suspended (from before, recording open)… */
export function stateLabel(f: Fmt, view: Pick<SchoolTerms, "state" | "stateDay">): string {
  if (!view.stateDay && view.state === "INVOICED_UNPAID") return f.t("subs.stateOwedNoDate");
  const date = view.stateDay ? f.day(view.stateDay) : "";
  const key = `subs.state${view.state}` as TranslationKey;
  return f.t(key, { date });
}

/** The state badge's tone: paid is well, free is news, a renewal passed or a year due is a warning, the rest neutral. */
export function stateTone(state: SchoolTerms["state"]): "ok" | "info" | "warn" | "danger" | "neutral" {
  switch (state) {
    case "PAID":
      return "ok";
    case "FREE":
      return "info";
    case "FREE_ENDED":
    case "RENEWAL_PASSED":
    case "INVOICED_UNPAID":
      return "warn";
    case "DUE_SINCE":
    case "RECORDING_PAUSED":
      return "danger";
    default:
      return "neutral";
  }
}

/** Our offer as one card's lines (§2.1): both parts, each a student a year before GST, with our discount where there is one, and the free months. */
export function offerLines(f: Fmt, offer: { subscription: { pricePaise: number; discountBps: number }; premium: { pricePaise: number; discountBps: number }; freeMonths: number }): string[] {
  const part = (p: { pricePaise: number; discountBps: number }, plain: TranslationKey, discounted: TranslationKey) =>
    p.discountBps > 0
      ? f.t(discounted, { price: f.money(paysPaise(p.pricePaise, p.discountBps)), base: f.money(p.pricePaise), percent: f.percent(p.discountBps) })
      : f.t(plain, { price: f.money(p.pricePaise) });
  return [
    part(offer.subscription, "subs.offerSubscription", "subs.offerSubscriptionDiscount"),
    part(offer.premium, "subs.offerPremium", "subs.offerPremiumDiscount"),
    f.t("subs.freeMonthsLine", { count: offer.freeMonths }),
  ];
}

/** Which schools the year billed leaves out and why (rule 8); none left out, nothing said. */
export function notCountedLine(f: Fmt, totals: { notCounted: { notSet: number; noTier: number; noCount: number; notRunning: number; noRenewal?: number; test?: number } }): string | null {
  const n = totals.notCounted;
  const parts = [
    n.notSet > 0 ? f.t("subs.notCountedNotSet", { count: n.notSet }) : null,
    n.noTier > 0 ? f.t("subs.notCountedNoTier", { count: n.noTier }) : null,
    n.noCount > 0 ? f.t("subs.notCountedNoCount", { count: n.noCount }) : null,
    (n.noRenewal ?? 0) > 0 ? f.t("subs.notCountedNoRenewal", { count: n.noRenewal ?? 0 }) : null,
    n.notRunning > 0 ? f.t("subs.notCountedNotRunning", { count: n.notRunning }) : null,
    (n.test ?? 0) > 0 ? f.t("subs.notCountedTest", { count: n.test ?? 0 }) : null,
  ].filter((p): p is string => p !== null);
  return parts.length ? f.t("subs.notCounted", { list: parts.join("; ") }) : null;
}
