"use client";

import { useState, useTransition } from "react";
import { BuildingsIcon, StarIcon } from "@phosphor-icons/react";
import { FREE_MONTHS, PREMIUM_PRICE_CHIPS_PAISE, SUBSCRIPTION_PRICE_CHIPS_PAISE } from "@edulink/contracts";
import { formatPaise, parsePercentBps, parseRupees } from "@edulink/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "@/lib/navigation";
import { useLocale, useT } from "@/lib/i18n";
import { offerAction } from "../actions";
import { Said } from "../sheet";

/** Our offer as the form holds it: both parts, the free months and the onboarding ticks. */
type OfferValues = { subscription: { pricePaise: number; discountBps: number }; premium: { pricePaise: number; discountBps: number }; freeMonths: number; studentsByDefault: boolean; teachersByDefault: boolean };

const rupees = (paise: number) => String(Math.round(paise / 100));
const percent = (bps: number) => (bps % 100 === 0 ? String(bps / 100) : (bps / 100).toFixed(2));

/**
 * THE PRICES TAB'S FORM (§2.2): our price and our discount for each part (whole rupees, ₹1 to ₹10,000; 0 to 100 %), the free
 * months for a new school, and the onboarding ticks. Review change asks the server what the change does (rule 9: who moves
 * and to what, who does not, the year at last count, who is told, that nothing is charged) and shows its sentence; the save
 * carries a reason and our offer as read, so a change made meanwhile is refused by name. Put back fills the form with the
 * prices from before a recent change, to be reviewed and saved like any change.
 */
export function PricesForm({
  offer,
  updatedAt,
  starting,
  recent,
  lines,
  asked,
}: {
  offer: OfferValues;
  updatedAt: string | null;
  starting: boolean;
  recent: { key: string; date: string; reason: string; before: OfferValues }[];
  lines: { students: string; teachers: string; colleges: string };
  asked: { students: boolean; teachers: boolean };
}) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(() => ({
    subPrice: rupees(offer.subscription.pricePaise),
    subDiscount: percent(offer.subscription.discountBps),
    premPrice: rupees(offer.premium.pricePaise),
    premDiscount: percent(offer.premium.discountBps),
    freeMonths: offer.freeMonths,
    studentsByDefault: offer.studentsByDefault,
    teachersByDefault: offer.teachersByDefault,
  }));
  const [reason, setReason] = useState("");
  const [sentence, setSentence] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const edit = (patch: Partial<typeof form>) => {
    setForm((f) => ({ ...f, ...patch }));
    setSentence(null);
  };

  /** The body, or null with the figures' rule when a figure is not one (whole rupees; a percent with at most two decimals). */
  function body(preview: boolean) {
    const subPrice = parseRupees(form.subPrice);
    const premPrice = parseRupees(form.premPrice);
    const subDiscount = parsePercentBps(form.subDiscount || "0");
    const premDiscount = parsePercentBps(form.premDiscount || "0");
    if (subPrice === null || premPrice === null || subDiscount === null || premDiscount === null) return null;
    return {
      subscription: { pricePaise: subPrice, discountBps: subDiscount },
      premium: { pricePaise: premPrice, discountBps: premDiscount },
      freeMonths: form.freeMonths,
      studentsByDefault: form.studentsByDefault,
      teachersByDefault: form.teachersByDefault,
      reason: reason.trim() || "-",
      expect: { updatedAt },
      preview,
    };
  }

  function review() {
    setError(null);
    const b = body(true);
    if (!b) return setError(t("subs.invalid"));
    startTransition(async () => {
      const said = await offerAction(b);
      if (!said.ok) {
        setError(said.error);
        if (said.stale) router.refresh();
        return;
      }
      setSentence(said.sentence);
    });
  }

  function save() {
    setError(null);
    const b = body(false);
    if (!b) return setError(t("subs.invalid"));
    if (!sentence) return setError(t("subs.reviewFirst"));
    if (!reason.trim()) return setError(t("root.subscriptionReasonRequired"));
    startTransition(async () => {
      const said = await offerAction({ ...b, reason: reason.trim() });
      if (!said.ok) {
        setError(said.error);
        if (said.stale) router.refresh();
        return;
      }
      toast({ tone: "ok", title: said.sentence });
      setSentence(null);
      setReason("");
      setNote(null);
      router.refresh();
    });
  }

  function putBack(before: OfferValues) {
    setForm({
      subPrice: rupees(before.subscription.pricePaise),
      subDiscount: percent(before.subscription.discountBps),
      premPrice: rupees(before.premium.pricePaise),
      premDiscount: percent(before.premium.discountBps),
      freeMonths: before.freeMonths,
      studentsByDefault: before.studentsByDefault,
      teachersByDefault: before.teachersByDefault,
    });
    setSentence(null);
    setNote(t("subs.putBackDone"));
  }

  const money = (paise: number) => formatPaise(paise, locale);
  const chipRow = (chips: readonly number[], value: string, set: (v: string) => void) => (
    <div className="flex flex-wrap gap-2">
      {chips.map((paise) => {
        const on = parseRupees(value) === paise;
        return (
          <Chip key={paise} pressed={on} onClick={() => set(rupees(paise))}>
            {money(paise)}
          </Chip>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4" data-testid="prices-form">
      {starting && <p className="text-sm text-fg-muted">{t("subs.startingNote")}</p>}
      <Card>
        <CardHeader icon={<BuildingsIcon weight="duotone" className="size-5" />} title={t("subs.numbered", { n: 1, name: t("subs.partSubscription") })} description={t("subs.part1Sub")} />
        <CardBody className="space-y-3">
          <TextField label={t("subs.aStudentAYear")} inputMode="numeric" value={form.subPrice} onChange={(e) => edit({ subPrice: e.target.value })} data-testid="offer-sub-price" />
          {chipRow(SUBSCRIPTION_PRICE_CHIPS_PAISE, form.subPrice, (v) => edit({ subPrice: v }))}
          <TextField label={t("subs.discountForAll")} inputMode="decimal" value={form.subDiscount} onChange={(e) => edit({ subDiscount: e.target.value })} data-testid="offer-sub-discount" />
          <p className="text-xs text-fg-muted">{t("subs.onePrice")}</p>
          <p className="text-xs text-fg-muted">{lines.colleges}</p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<StarIcon weight="duotone" className="size-5" />} title={t("subs.numbered", { n: 2, name: t("subs.partPremium") })} description={t("subs.part2Sub")} />
        <CardBody className="space-y-3">
          <p className="text-xs text-fg-muted">{lines.students}</p>
          <p className="text-xs text-fg-muted">{lines.teachers}</p>
          <TextField label={t("subs.moreAStudentAYear")} inputMode="numeric" value={form.premPrice} onChange={(e) => edit({ premPrice: e.target.value })} data-testid="offer-premium-price" />
          {chipRow(PREMIUM_PRICE_CHIPS_PAISE, form.premPrice, (v) => edit({ premPrice: v }))}
          <TextField label={t("subs.discount")} inputMode="decimal" value={form.premDiscount} onChange={(e) => edit({ premDiscount: e.target.value })} data-testid="offer-premium-discount" />
          <fieldset className="flex flex-wrap items-center gap-3 text-sm">
            <legend className="mb-1 text-xs font-semibold text-fg-muted">{t("subs.onboardingTicks")}</legend>
            <label className="flex min-h-11 items-center gap-2">
              <input type="checkbox" className="size-5 accent-accent" checked={form.studentsByDefault} onChange={(e) => edit({ studentsByDefault: e.target.checked })} />
              {t("subs.colStudents")}
            </label>
            <label className="flex min-h-11 items-center gap-2">
              <input type="checkbox" className="size-5 accent-accent" checked={form.teachersByDefault} onChange={(e) => edit({ teachersByDefault: e.target.checked })} />
              {t("subs.colTeachers")}
            </label>
          </fieldset>
          {/* A box starts ticked only while its plan is asked for (C3 point 3; C5 point 9). */}
          {!asked.students && <p className="text-xs text-fg-muted">{t("subs.ticksWaitStudents")}</p>}
          {!asked.teachers && <p className="text-xs text-fg-muted">{t("subs.ticksWaitTeachers")}</p>}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("subs.numbered", { n: 3, name: t("subs.part3Title") })} description={t("subs.freeMonthsLabel")} />
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {FREE_MONTHS.map((m) => (
              <Chip key={m} pressed={form.freeMonths === m} onClick={() => edit({ freeMonths: m })}>
                {String(m)}
              </Chip>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          {note && <p className="text-sm text-fg-muted">{note}</p>}
          <Said sentence={sentence} />
          <TextField label={t("subs.reason")} hint={t("subs.reasonYourLog")} value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} data-testid="offer-reason" />
          {error && (
            <p role="alert" className="text-sm font-medium text-danger">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" loading={pending} onClick={review} data-testid="offer-review">
              {t("subs.reviewChange")}
            </Button>
            <Button type="button" loading={pending} disabled={!sentence} onClick={save} data-testid="offer-save">
              {t("common.save")}
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title={t("subs.recentTitle")} />
        <CardBody>
          {recent.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("subs.recentNone")}</p>
          ) : (
            <ul className="space-y-2">
              {recent.map((r) => (
                <li key={r.key} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-fg">{t("subs.recentItem", { date: r.date, reason: r.reason })}</span>
                  <Button type="button" size="sm" variant="ghost" onClick={() => putBack(r.before)}>
                    {t("subs.putBack")}
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
