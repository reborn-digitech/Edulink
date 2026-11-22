"use client";

import { useEffect, useState } from "react";
import {
  COLLEGE_TIERS,
  freeMonthsImplied,
  isCollegeKind,
  onboardingTicks,
  OWN_DISCOUNT_CHIPS_BPS,
  paysPaise,
  planSuitsKind,
  PREMIUM_PRICE_CHIPS_PAISE,
  premiumTerms,
  renewalFrom,
  SUBSCRIPTION_PRICE_CHIPS_PAISE,
  subscriptionTerms,
  type CollegeTierCode,
  type OperatorOnboardBody,
  type PartTerms,
  type PartTermsBody,
} from "@edulink/contracts";
import { formatPaise, parsePercentBps, parseRupees } from "@edulink/i18n";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { CheckboxField, DateField, SelectField, TextField } from "@/components/ui/field";
import { formatDateKey, safeTimeZone, todayKey } from "@/lib/dates";
import { useLocale, useT } from "@/lib/i18n";
import { onboardPreviewAction } from "../actions";

type PlanOption = { id: string; code: string; name: string };
/** Our offer as the onboarding form reads it: the chips' figures, the free months that start chosen, and the ticks' defaults. */
export type OnboardOffer = { subscriptionPricePaise: number; subscriptionDiscountBps: number; premiumPricePaise: number; premiumDiscountBps: number; freeMonths: number; studentsByDefault: boolean; teachersByDefault: boolean };
/** The terms' share of the onboard body (§2.5). */
export type OnboardTermsBody = Pick<OperatorOnboardBody, "planId" | "tier" | "startsAt" | "dueAt" | "freeMonths" | "subscription" | "premium" | "acceptOverAYear" | "acceptDueNow">;
/** The fields a refusal of the terms is shown under (the summary's, or the save's: the second review's C5). */
export type OnboardField = "startsAt" | "dueAt" | "subscription" | "premium" | "tier" | "timezone";
type Field = OnboardField;
type Said = Awaited<ReturnType<typeof onboardPreviewAction>>;
/** A part as the form holds it: the mode, the own price or discount as typed, and whether the price is the typed "Other". */
type Part = { mode: PartTermsBody["mode"]; price: string; discount: string; other: boolean };

const FREE_MONTH_CHIPS = [0, 1, 3, 6, 12];
const OURS: Part = { mode: "OURS", price: "", discount: "", other: false };
const rupees = (paise: number) => String(Math.round(paise / 100));
const percentOf = (bps: number) => (bps % 100 === 0 ? String(bps / 100) : (bps / 100).toFixed(2));

/** A part back to the body; null while a typed figure is not one. */
function chipOf(part: Part): PartTermsBody | null {
  if (part.mode === "OURS") return { mode: "OURS" };
  if (part.mode === "OWN_DISCOUNT") {
    const bps = parsePercentBps(part.discount);
    return bps === null ? null : { mode: "OWN_DISCOUNT", discountBps: bps };
  }
  const paise = parseRupees(part.price);
  return paise === null ? null : { mode: "OWN_PRICE", pricePaise: paise };
}
/** A chip as a part's figure columns, for the line above the chips (the summary under them is the server's). */
function ownOf(chip: PartTermsBody | null): { pricePaise: number | null; discountBps: number | null } {
  if (chip?.mode === "OWN_PRICE") return { pricePaise: chip.pricePaise, discountBps: null };
  if (chip?.mode === "OWN_DISCOUNT") return { pricePaise: null, discountBps: chip.discountBps };
  return { pricePaise: null, discountBps: null };
}

/**
 * THE TERMS AT ONBOARDING, HELD BY THE FORM (§2.5; phase 6). One hook so the form's submit and the fieldset read the same state:
 * the Shalaghar subscription (ours, fixed at a price, or an own discount; a college on its tier, with no own price), the free
 * months and the dates (chips set the renewal; a typed renewal stops the working-out until "Work it out again"), the premium
 * ticks (they start as our offer's defaults where that role's plan is asked for, C3) and premium's own terms, the optional plan
 * (a school's), and the two ticks a renewal may need, shown when the preview asks for them and cleared whenever the dates move.
 * What changes with the kind is worked out as it renders, never set from an effect: a college has no teachers' premium, no own
 * price and no plan, and takes the first tier that suits it. The summary is the server's (onboardPreviewAction), asked 300 ms
 * after the last change once a name is typed (the sentence is worded with it), and asked again on `refresh()`, which the form
 * calls when a submit is refused (the school's day may have turned since, asking a tick); the form is ready only once the
 * summary answers for the terms as they stand and every tick it asks for is ticked.
 */
export function useOnboardTerms(input: { name: string; kind: string; timezone: string; offer: OnboardOffer; asked: readonly string[]; plans: PlanOption[] }) {
  const { kind, offer, plans } = input;
  const college = isCollegeKind(kind);
  const [open, setOpen] = useState({ subscription: false, premium: false });
  const [sub, setSub] = useState<Part>(OURS);
  const [prem, setPrem] = useState<Part>(OURS);
  const [who, setWho] = useState(() => onboardingTicks(offer, new Set(input.asked), kind));
  const [tierChosen, setTier] = useState<CollegeTierCode | null>(null);
  const [planChosen, setPlanId] = useState("");
  const [months, setMonthsState] = useState(offer.freeMonths);
  const [typed, setTyped] = useState(false);
  const [startTyped, setStartTyped] = useState(false);
  // What the operator typed for the dates; a start not typed is the school's own today, worked out as the form renders.
  const [typedDates, setDates] = useState({ startsAt: "", dueAt: "" });
  // A tick is kept with the dates it was given for (C7.2: a start that moves by itself, by the timezone or a day that turned,
  // clears both ticks, as any change of the dates does).
  const [ticked, setTicked] = useState({ overAYear: false, dueNow: false, start: "", due: "" });
  const [preview, setPreview] = useState<{ key: string; said: Said; announce: string | null } | null>(null);
  const [nonce, setNonce] = useState(0);
  const named = input.name.trim().length >= 2;

  // Worked out as it renders (the kind may change at any time above this fieldset).
  const tiers = COLLEGE_TIERS.filter((t) => planSuitsKind(t.code, kind));
  const tier = college ? (tierChosen && planSuitsKind(tierChosen, kind) ? tierChosen : (tiers[0]?.code ?? null)) : null;
  const planId = !college && planChosen && planSuitsKind(plans.find((p) => p.id === planChosen)?.code, kind) ? planChosen : "";
  const subPart: Part = college && sub.mode === "OWN_PRICE" ? OURS : sub;
  const teachers = college ? false : who.teachers;
  const subChip = chipOf(subPart);
  const premChip = chipOf(prem);
  // C7.2: while no start is typed, the start is the school's own today for the timezone typed (an unknown zone reads as
  // Asia/Kolkata here; the summary refuses it under its field), read again with each change and at the submit.
  const zoneToday = todayKey(safeTimeZone(input.timezone));
  const startsAt = startTyped ? typedDates.startsAt : zoneToday;
  const dueAt = typed ? typedDates.dueAt : startsAt ? renewalFrom(startsAt, months) : "";
  const dates = { startsAt, dueAt };
  // The dates moved since a box was ticked: both ticks are cleared, and stay cleared should the dates move back (set while
  // rendering, as React's pattern for state that follows other state has it, never from an effect).
  if ((ticked.overAYear || ticked.dueNow) && (ticked.start !== startsAt || ticked.due !== dueAt)) setTicked({ overAYear: false, dueNow: false, start: "", due: "" });
  const accept = ticked.start === startsAt && ticked.due === dueAt ? { overAYear: ticked.overAYear, dueNow: ticked.dueNow } : { overAYear: false, dueNow: false };
  const setAccept = (change: (was: { overAYear: boolean; dueNow: boolean }) => { overAYear: boolean; dueNow: boolean }) => setTicked({ ...change(accept), start: startsAt, due: dueAt });

  const movedDates = () => setTicked({ overAYear: false, dueNow: false, start: "", due: "" });
  const setMonths = (m: number) => {
    setMonthsState(m);
    setTyped(false);
    movedDates();
  };
  const setStart = (value: string) => {
    setStartTyped(true);
    setDates((d) => ({ ...d, startsAt: value }));
    movedDates();
  };
  const setRenewal = (value: string) => {
    setTyped(true);
    setDates((d) => ({ ...d, dueAt: value }));
    movedDates();
  };
  const workOutAgain = () => setMonths(months);

  // The terms' share of the body, built once: the summary is asked for it and the submit sends it, so the two cannot drift
  // (C7: the body the click sends carries the terms the operator has just read in the server's sentence).
  const share =
    subChip && premChip && startsAt && dueAt
      ? {
          startsAt,
          ...(typed ? { dueAt } : { freeMonths: months }),
          subscription: subChip,
          premium: { students: who.students, teachers, terms: premChip },
          ...(tier ? { tier } : {}),
        }
      : null;
  const previewBody = named && share ? { name: input.name, kind, timezone: input.timezone, ...share } : null;
  const key = previewBody ? JSON.stringify({ body: previewBody, nonce }) : null;
  useEffect(() => {
    if (!key) return;
    let live = true;
    // What is said aloud changes only when the terms do, not when the name alone does (the second review's C9).
    const termsOf = (k: string) => {
      const { body, nonce: _nonce } = JSON.parse(k) as { body: Record<string, unknown>; nonce: number };
      void _nonce;
      return JSON.stringify({ ...body, name: null });
    };
    const timer = setTimeout(() => {
      onboardPreviewAction((JSON.parse(key) as { body: unknown }).body).then(
        (said) => {
          if (!live) return;
          setPreview((was) => ({ key, said, announce: said.ok && (!was || termsOf(was.key) !== termsOf(key) || was.announce === null) ? said.sentence : (was?.announce ?? null) }));
        },
        // Lost on the way: no sentence, and the form not ready, until "Try again" or the next change asks again.
        () => {
          if (live) setPreview((was) => ({ key, said: { ok: false, error: "" }, announce: was?.announce ?? null }));
        },
      );
    }, 300);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [key]);

  const current = preview && preview.key === key ? preview.said : null;
  const asks = current?.ok ? current.asks : { overAYear: false, dueNow: false };
  const body: OnboardTermsBody | null =
    previewBody && share
      ? {
          ...share,
          // A school's plan, chosen or none; a college goes on its tier and sends no plan (C7 point 2).
          ...(college ? {} : { planId: planId || null }),
          ...(asks.overAYear && accept.overAYear ? { acceptOverAYear: true } : {}),
          ...(asks.dueNow && accept.dueNow ? { acceptDueNow: true } : {}),
        }
      : null;
  const ticksDone = (!asks.overAYear || accept.overAYear) && (!asks.dueNow || accept.dueNow);
  const refusal = current && !current.ok ? current : null;

  return {
    college,
    tiers,
    tier,
    setTier,
    planId,
    setPlanId,
    open,
    setOpen,
    sub: subPart,
    setSub,
    prem,
    setPrem,
    subChip,
    premChip,
    who: { students: who.students, teachers },
    setWho,
    months,
    setMonths,
    typed,
    dates,
    setStart,
    setRenewal,
    workOutAgain,
    accept,
    setAccept,
    asks,
    /** The answer for the terms as they stand, or the last one while a newer is asked (shown dimmed). */
    said: current ?? preview?.said ?? null,
    stale: current === null,
    /** The last summary to be said aloud: it changes when the terms change, not when only the name does. */
    announce: preview?.announce ?? null,
    /** The figures the server's summary was reckoned at (C10), for the terms as they stand. */
    figures: current?.ok ? current.figures : null,
    /** A summary refused for a zone that is no zone, for the form's Timezone field (W-2). */
    timezoneError: refusal?.field === "timezone" ? refusal.error : undefined,
    named,
    /** Whether the terms' figures are all there to be asked about (C3: the summary waits for them, and says so). */
    complete: share !== null,
    ticksDone,
    /** Ask the summary again for the terms as they stand: after a refused submit, or a summary that did not come back. */
    refresh: () => setNonce((n) => n + 1),
    /**
     * Whether the body may go now: a start not typed must still be the school's today (C7.2: a page left open past midnight
     * does not send yesterday); if the day has turned, the summary is asked again and shown instead of the save going out.
     */
    stillToday: () => {
      if (startTyped || todayKey(safeTimeZone(input.timezone)) === startsAt) return true;
      setNonce((n) => n + 1);
      return false;
    },
    body,
    ready: body !== null && current?.ok === true && ticksDone,
  };
}
export type OnboardTermsControl = ReturnType<typeof useOnboardTerms>;

/**
 * Fieldset 2 of /root/onboard, "Subscription and premium" (§2.5), drawn from useOnboardTerms: each part's line with Change,
 * the chips under it, the premium ticks, the server's summary sentence, and the optional plan for a school. A refusal of the
 * preview is shown under the field it names, its section opened; the ticks a renewal needs open the subscription's too.
 */
/**
 * What the summary waits for while the terms are not complete (the walk's small point): the figures, the dates, or both where
 * both are missing (the coordinating session's review of 07d594f3, R3).
 */
export function summaryWaitsKey(missing: { figures: boolean; dates: boolean }): "root.obSummaryWaitsBoth" | "root.obSummaryWaitsFigures" | "root.obSummaryWaitsDates" {
  return missing.figures && missing.dates ? "root.obSummaryWaitsBoth" : missing.figures ? "root.obSummaryWaitsFigures" : "root.obSummaryWaitsDates";
}

export function TermsFieldset({ ctl, offer, plans, kind, refused }: { ctl: OnboardTermsControl; offer: OnboardOffer; plans: PlanOption[]; kind: string; refused?: { field: OnboardField; error: string } | null }) {
  const t = useT();
  const locale = useLocale();
  const money = (paise: number) => formatPaise(paise, locale);
  const day = (key: string) => formatDateKey(key, { day: "numeric", month: "short", year: "numeric" }, locale);
  const tierName = (code: CollegeTierCode) => t(code === "college-affiliated" ? "operatorCollege.tierAffiliated" : "operatorCollege.tierAutonomous");

  // A refusal is shown for the terms as they stand only; a sentence may stay a moment, dimmed, while a newer one is asked.
  const refusal = !ctl.stale && ctl.said && !ctl.said.ok ? ctl.said : null;
  // The summary's refusal, else the save's for the same field (C5: a refusal of the terms goes under the field it names).
  const errorOf = (field: Field) => (refusal && refusal.field === field ? refusal.error : refused && refused.field === field ? refused.error : undefined);
  const askedTick = ctl.asks.overAYear || ctl.asks.dueNow;
  // A section is held open while a tick is asked, a refusal stands in it, or a figure or a date it needs is missing (C3).
  const datesMissing = !ctl.dates.startsAt || !ctl.dates.dueAt;
  const subHeld = askedTick || ctl.subChip === null || datesMissing || Boolean(errorOf("subscription") || errorOf("tier") || errorOf("startsAt") || errorOf("dueAt"));
  const premHeld = ctl.premChip === null || Boolean(errorOf("premium"));
  const subOpen = ctl.open.subscription || subHeld;
  const premOpen = ctl.open.premium || premHeld;

  // Our figure for the subscription's first chip: our price at a school, the tier less our discount at a college.
  const tierBase = COLLEGE_TIERS.find((x) => x.code === ctl.tier)?.perStudentYearPaise ?? null;
  const oursSub = ctl.college && tierBase !== null ? paysPaise(tierBase, offer.subscriptionDiscountBps) : paysPaise(offer.subscriptionPricePaise, offer.subscriptionDiscountBps);
  const oursPremium = paysPaise(offer.premiumPricePaise, offer.premiumDiscountBps);
  const subFigure: PartTerms | null = ctl.subChip
    ? subscriptionTerms({ kind, planCode: ctl.tier, own: ownOf(ctl.subChip) }, { pricePaise: offer.subscriptionPricePaise, discountBps: offer.subscriptionDiscountBps })
    : null;
  const premFigure: PartTerms | null = ctl.premChip ? premiumTerms(ownOf(ctl.premChip), { pricePaise: offer.premiumPricePaise, discountBps: offer.premiumDiscountBps }) : null;

  /** How a part is priced, short, for its line: ours, own price, own 20 % off ₹100, the tier's name. */
  const howOf = (figure: PartTerms) => {
    if (figure.tierCode) return figure.source === "OWN_DISCOUNT" ? t("subs.shortOwnDiscount", { percent: percentOf(figure.discountBps), base: money(figure.basePaise) }) : tierName(figure.tierCode);
    if (figure.source === "OWN_PRICE") return t("subs.shortOwnPrice");
    if (figure.source === "OWN_DISCOUNT") return t("subs.shortOwnDiscount", { percent: percentOf(figure.discountBps), base: money(figure.basePaise) });
    return t("subs.shortOurs");
  };
  // A typed renewal's months are said back only where whole (C7.3); otherwise the date speaks.
  const typedMonths = ctl.typed && ctl.dates.startsAt && ctl.dates.dueAt ? freeMonthsImplied(ctl.dates.startsAt, ctl.dates.dueAt) : null;
  const monthsShown = ctl.typed ? (typedMonths !== null && renewalFrom(ctl.dates.startsAt, typedMonths) === ctl.dates.dueAt ? typedMonths : null) : ctl.months;
  const monthsLine = monthsShown === null ? null : monthsShown === 0 ? t("root.obMonthsFreeNone") : monthsShown === 1 ? t("root.obMonthsFreeOne") : t("root.obMonthsFree", { count: monthsShown });
  const subLine = [
    // The figure the server's summary was reckoned at, once it has answered (C10); our offer as the page read it before.
    subFigure ? ((ctl.figures?.subscriptionPaise ?? subFigure.paysPaise) === 0 ? t("root.freeByAgreement") : t("root.obSubLine", { price: money(ctl.figures?.subscriptionPaise ?? subFigure.paysPaise), how: howOf(subFigure) })) : null,
    monthsLine,
    ctl.dates.dueAt ? t("root.obRenewsShort", { date: day(ctl.dates.dueAt) }) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  // With no box ticked, what premium would be if switched on, never read as a charge (C7.5).
  const premPaise = ctl.figures?.premiumPaise ?? premFigure?.paysPaise ?? null;
  const premTicked = ctl.who.students || ctl.who.teachers;
  const premLine = premFigure && premPaise !== null ? (premPaise === 0 ? t("root.freeByAgreement") : t(premTicked ? "root.obPremiumLine" : "subs.obPremiumIfOnLine", { price: money(premPaise), how: howOf(premFigure) })) : null;

  /** A part's chips (§2.5): our price, fixed at it, a few prices, another typed, or a discount; at a college, its tier and a discount. */
  const priceChips = (part: Part, set: (next: Part) => void, oursPaise: number, presets: readonly number[], tier: boolean, label: string) => {
    const pricePaise = parseRupees(part.price);
    const discountBps = parsePercentBps(part.discount);
    const fixed = (paise: number) => part.mode === "OWN_PRICE" && !part.other && pricePaise === paise;
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
          <Chip pressed={part.mode === "OURS"} onClick={() => set(OURS)}>
            {tier ? t("subs.chipOursTier", { price: money(oursPaise) }) : t("subs.chipOurs", { price: money(oursPaise) })}
          </Chip>
          {!tier && (
            <>
              <Chip pressed={fixed(oursPaise)} onClick={() => set({ mode: "OWN_PRICE", price: rupees(oursPaise), discount: "", other: false })}>
                {t("subs.fixAt", { price: money(oursPaise) })}
              </Chip>
              {presets
                .filter((p) => p !== oursPaise)
                .map((p) => (
                  <Chip key={p} pressed={fixed(p)} onClick={() => set({ mode: "OWN_PRICE", price: rupees(p), discount: "", other: false })}>
                    {money(p)}
                  </Chip>
                ))}
              <Chip pressed={part.mode === "OWN_PRICE" && part.other} onClick={() => set({ mode: "OWN_PRICE", price: part.mode === "OWN_PRICE" ? part.price : "", discount: "", other: true })}>
                {t("root.obChipOther")}
              </Chip>
            </>
          )}
          <Chip pressed={part.mode === "OWN_DISCOUNT"} onClick={() => set({ mode: "OWN_DISCOUNT", price: "", discount: part.discount, other: false })}>
            {t("root.obAddDiscount")}
          </Chip>
        </div>
        {part.mode === "OWN_PRICE" && part.other && (
          <TextField
            label={t("subs.ownPriceLabel")}
            inputMode="numeric"
            value={part.price}
            onChange={(e) => set({ ...part, price: e.target.value })}
            error={!part.price.trim() ? t("root.obFigureMissing") : pricePaise === null ? t("subs.invalid") : undefined}
          />
        )}
        {part.mode === "OWN_PRICE" && pricePaise !== null && pricePaise > oursPaise && <p className="text-xs font-medium text-warn">{t("subs.warnPriceAbove", { ours: money(oursPaise) })}</p>}
        {part.mode === "OWN_DISCOUNT" && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {OWN_DISCOUNT_CHIPS_BPS.map((bps) => (
                <Chip key={bps} pressed={discountBps === bps} onClick={() => set({ ...part, discount: percentOf(bps) })}>
                  {`${percentOf(bps)} %`}
                </Chip>
              ))}
            </div>
            <TextField
              label={t("subs.ownDiscountLabel")}
              inputMode="decimal"
              value={part.discount}
              onChange={(e) => set({ ...part, discount: e.target.value })}
              error={!part.discount.trim() ? t("root.obFigureMissing") : discountBps === null ? t("subs.invalid") : undefined}
            />
          </div>
        )}
        {tier && <p className="text-xs text-fg-muted">{t("subs.collegeTierOnly")}</p>}
      </div>
    );
  };

  const months = FREE_MONTH_CHIPS.includes(offer.freeMonths) ? FREE_MONTH_CHIPS : [...FREE_MONTH_CHIPS, offer.freeMonths].sort((a, b) => a - b);
  const sentence = ctl.said?.ok ? ctl.said.sentence : refusal && !refusal.field ? refusal.error || t("root.didNotWork") : null;

  return (
    <fieldset className="space-y-4" data-testid="onboard-terms">
      <legend className="text-sm font-semibold text-fg">{t("root.obLegend")}</legend>

      <div className="space-y-3 rounded-[var(--radius-md)] border border-border p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-sm leading-relaxed">
            <span className="font-semibold text-fg">{t("subs.partSubscription")}</span> <span className="text-fg-muted" data-testid="onboard-sub-line">{subLine}</span>
          </p>
          {/* Named for its part; not drawn while the section is held open, so no press does nothing (C8). */}
          {!subHeld && (
            <Button type="button" size="sm" variant="ghost" aria-expanded={subOpen} aria-label={t("root.obChangePart", { part: t("subs.partSubscription") })} onClick={() => ctl.setOpen((o) => ({ ...o, subscription: !subOpen }))}>
              {t("subs.change")}
            </Button>
          )}
        </div>
        {subOpen && (
          <div className="space-y-4">
            {ctl.college && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-fg">{t("root.obTierLabel")}</p>
                <div className="flex flex-wrap gap-2" role="group" aria-label={t("root.obTierLabel")} aria-describedby={errorOf("tier") ? "onboard-tier-error" : undefined}>
                  {ctl.tiers.map((tier) => (
                    <Chip key={tier.code} pressed={ctl.tier === tier.code} onClick={() => ctl.setTier(tier.code)}>
                      {t("root.obTierChip", { tier: tierName(tier.code), price: money(tier.perStudentYearPaise) })}
                    </Chip>
                  ))}
                </div>
                {errorOf("tier") && (
                  <p id="onboard-tier-error" className="text-sm font-medium text-danger">
                    {errorOf("tier")}
                  </p>
                )}
              </div>
            )}
            {priceChips(ctl.sub, ctl.setSub, oursSub, SUBSCRIPTION_PRICE_CHIPS_PAISE, ctl.college, t("subs.partSubscription"))}
            {errorOf("subscription") && (
              <p id="onboard-subscription-error" className="text-sm font-medium text-danger">
                {errorOf("subscription")}
              </p>
            )}
            <div className="space-y-2">
              <p className="text-sm font-medium text-fg">{t("root.obFreeMonthsLabel")}</p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t("root.obFreeMonthsLabel")}>
                {months.map((m) => (
                  <Chip key={m} className="min-w-11" pressed={!ctl.typed && ctl.months === m} onClick={() => ctl.setMonths(m)}>
                    {String(m)}
                  </Chip>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {/* An emptied start is a missing date (C7.2); the renewal speaks only where it was typed, being worked out from the
                  start otherwise, and "Work it out again" is named only where that button is drawn (the walk of e3e5744c). */}
              <DateField label={t("root.subscriptionStarts")} required value={ctl.dates.startsAt} onChange={(e) => ctl.setStart(e.target.value)} error={errorOf("startsAt") ?? (!ctl.dates.startsAt ? t("root.obStartMissing") : undefined)} />
              <DateField label={t("root.obRenewsOnLabel")} required value={ctl.dates.dueAt} onChange={(e) => ctl.setRenewal(e.target.value)} error={errorOf("dueAt") ?? (ctl.typed && !ctl.dates.dueAt ? t("root.obDateMissing") : undefined)} />
            </div>
            {ctl.typed && (
              <Button type="button" size="sm" variant="secondary" onClick={ctl.workOutAgain}>
                {t("root.obWorkOutAgain")}
              </Button>
            )}
            {ctl.asks.overAYear && (
              <CheckboxField label={t("root.obTickOverAYear")} description={t("root.renewalOverAYear")} checked={ctl.accept.overAYear} onChange={(e) => ctl.setAccept((a) => ({ ...a, overAYear: e.target.checked }))} />
            )}
            {ctl.asks.dueNow && (
              <CheckboxField label={t("root.obTickDueNow")} description={t("root.renewalBeforeToday")} checked={ctl.accept.dueNow} onChange={(e) => ctl.setAccept((a) => ({ ...a, dueNow: e.target.checked }))} />
            )}
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-[var(--radius-md)] border border-border p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-sm font-semibold text-fg">{t("subs.partPremium")}</p>
          {!premHeld && (
            <Button type="button" size="sm" variant="ghost" aria-expanded={premOpen} aria-label={t("root.obChangePart", { part: t("subs.partPremium") })} onClick={() => ctl.setOpen((o) => ({ ...o, premium: !premOpen }))}>
              {t("subs.change")}
            </Button>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <CheckboxField label={t("root.obPremiumStudents")} checked={ctl.who.students} onChange={(e) => ctl.setWho((w) => ({ ...w, students: e.target.checked }))} />
          {!ctl.college && <CheckboxField label={t("root.obPremiumTeachers")} checked={ctl.who.teachers} onChange={(e) => ctl.setWho((w) => ({ ...w, teachers: e.target.checked }))} />}
        </div>
        {premLine && (
          <p className="text-sm text-fg-muted" data-testid="onboard-premium-line">
            {premLine}
          </p>
        )}
        {premOpen && priceChips(ctl.prem, ctl.setPrem, oursPremium, PREMIUM_PRICE_CHIPS_PAISE, false, t("subs.partPremium"))}
        {errorOf("premium") && (
          <p id="onboard-premium-error" className="text-sm font-medium text-danger">
            {errorOf("premium")}
          </p>
        )}
      </div>

      {/* Said aloud from the start, and only when the terms change, not when the name alone does (C9). */}
      <p aria-live="polite" className="sr-only" data-testid="onboard-summary-said">
        {ctl.named && ctl.complete ? ctl.announce : ""}
      </p>
      {!ctl.named ? (
        <p className="text-sm text-fg-muted" data-testid="onboard-summary-waits">
          {t("root.obSummaryWaitsName")}
        </p>
      ) : !ctl.complete ? (
        // A figure or a date is missing: no sentence of other terms is left to be read as these (C3), and it says which.
        <p className="text-sm text-fg-muted" data-testid="onboard-summary-waits">
          {t(summaryWaitsKey({ figures: ctl.subChip === null || ctl.premChip === null, dates: datesMissing }))}
        </p>
      ) : sentence ? (
        <div className="space-y-2">
          <p
            data-testid="onboard-summary"
            className={`rounded-[var(--radius-md)] bg-surface-muted px-4 py-3 text-sm leading-relaxed ${refusal && !refusal.field ? "font-medium text-danger" : "text-fg"} ${ctl.stale ? "opacity-60" : ""}`}
          >
            {sentence}
            {ctl.stale && <span className="sr-only"> {t("root.obSummaryStale")}</span>}
          </p>
          {/* A summary that failed or did not come back is asked again here, not only by changing a field (C4). */}
          {refusal && !refusal.field && (
            <Button type="button" size="sm" variant="secondary" onClick={ctl.refresh}>
              {t("common.retry")}
            </Button>
          )}
        </div>
      ) : null}

      {!ctl.college && (
        <SelectField label={t("root.obPlanOptional")} value={ctl.planId} onChange={(e) => ctl.setPlanId(e.target.value)}>
          <option value="">{t("root.planNone")}</option>
          {/* TA-488: only the prices that suit the kind chosen, since a refusal at the end undoes the whole set-up. */}
          {plans
            .filter((p) => planSuitsKind(p.code, kind))
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.code})
              </option>
            ))}
        </SelectField>
      )}
    </fieldset>
  );
}
