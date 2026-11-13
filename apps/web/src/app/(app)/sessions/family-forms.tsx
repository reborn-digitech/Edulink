"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useLocale, useT } from "@/lib/i18n";
import { formatPaise } from "@edulink/i18n";
import type { GigCheckout } from "@edulink/contracts";
import { SeatCheckout } from "@/components/gigs/seat-checkout";
import { bookSeatAction, bookSeriesAction, cancelSeatAction, consentAction, rateAction, seatCheckoutAction, unheldAction } from "./actions";

/** A checkout the phone started, picked up on the web where the gateway's script runs. */
export function ResumeCheckout({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <SeatCheckout
      paymentId={paymentId}
      onClose={() => {
        setOpen(false);
        router.replace("/sessions");
      }}
    />
  );
}

/**
 * A seat in an open time: what the pupil wants from it, then the ask (a pupil under eighteen) or the booking (a
 * guardian, or a pupil of eighteen or more for themselves) — and, for a paid seat, the payment by whoever pays.
 */
export function BookSeat({ slotId, childId, byGuardian, selfPays = byGuardian, title, priceLabel = null }: { slotId: string; childId: string; byGuardian: boolean; /** The reader pays for a priced seat themselves (seats, 17 Oct 2026). */ selfPays?: boolean; title: string; /** "Pay ₹100" when this pupil's seat would be a paid one, "Ask your parent" for a pupil under eighteen; null for a free seat. */ priceLabel?: string | null }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<GigCheckout | null>(null);
  const verb = priceLabel ?? (selfPays ? t("gigs.bookSeat") : t("gigs.askSeat"));

  if (checkout)
    return (
      <SeatCheckout
        checkout={checkout}
        onClose={() => {
          setCheckout(null);
          setOpen(false);
          router.refresh();
        }}
      />
    );
  if (!open)
    return (
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)} aria-label={[verb, title].join(": ")} data-testid="session-book-open">
        {verb}
      </Button>
    );
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await bookSeatAction({ slotId, studentMembershipId: childId, purpose });
          if (!result.ok) return setError(result.error);
          if (result.checkout) return setCheckout(result.checkout);
          toast({ tone: "ok", title: result.status === "CONFIRMED" ? t("gigs.booked") : t("gigs.asked") });
          setOpen(false);
          router.refresh();
        });
      }}
      className="w-full space-y-2"
      data-testid="session-book-form"
    >
      <TextAreaField label={t("gigs.purposeLabel")} hint={t("gigs.purposeHint")} rows={2} maxLength={500} value={purpose} error={error ?? undefined} onChange={(e) => setPurpose(e.target.value)} data-testid="session-purpose" />
      <Button type="submit" size="sm" disabled={pending} data-testid="session-book">
        {pending ? t("common.saving") : verb}
      </Button>
    </form>
  );
}

/** What a family may still do with a seat: agree or decline, give it up, say it was not held, or rate it. */
export function SeatActions({ bookingId, title, canConsent, canPay = false, payAmount = 0, canCancel, canRate, canReportUnheld, confirmed, lateHours }: { bookingId: string; title: string; canConsent: boolean; canPay?: boolean; payAmount?: number; canCancel: boolean; canRate: boolean; canReportUnheld: boolean; confirmed: boolean; lateHours: number }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState("5");
  const [feedback, setFeedback] = useState("");
  const [checkout, setCheckout] = useState<GigCheckout | null>(null);
  const act = (work: () => Promise<{ ok: true } | { ok: false; error: string }>, done: string | ((r: unknown) => string)) => {
    setError(null);
    startTransition(async () => {
      const result = await work();
      if (!result.ok) return setError(result.error);
      toast({ tone: "ok", title: typeof done === "string" ? done : done(result) });
      router.refresh();
    });
  };
  if (!canConsent && !canPay && !canCancel && !canRate && !canReportUnheld) return null;
  if (checkout)
    return (
      <SeatCheckout
        checkout={checkout}
        onClose={() => {
          setCheckout(null);
          router.refresh();
        }}
      />
    );
  // A paid seat agreed to hands back the order: the panel opens in place of the toast.
  const consentPaid = () =>
    startTransition(async () => {
      setError(null);
      const result = await consentAction(bookingId, true);
      if (!result.ok) return setError(result.error);
      if (result.checkout) return setCheckout(result.checkout);
      toast({ tone: "ok", title: t("gigs.consented") });
      router.refresh();
    });
  const pay = () =>
    startTransition(async () => {
      setError(null);
      const result = await seatCheckoutAction(bookingId);
      if (!result.ok) return setError(result.error);
      setCheckout(result.checkout);
    });

  return (
    <div className="w-full space-y-2" data-testid="session-actions">
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {canPay && (
          <Button type="button" size="sm" disabled={pending} onClick={pay} aria-label={[t("gigs.payNow", { amount: formatPaise(payAmount, locale) }), title].join(": ")} data-testid="session-pay">
            {t("gigs.payNow", { amount: formatPaise(payAmount, locale) })}
          </Button>
        )}
        {canConsent && (
          <>
            <Button type="button" size="sm" disabled={pending} onClick={consentPaid} aria-label={[t("gigs.consentYes"), title].join(": ")} data-testid="session-consent-yes">
              {t("gigs.consentYes")}
            </Button>
            <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => act(() => consentAction(bookingId, false), t("gigs.declined"))} aria-label={[t("gigs.consentNo"), title].join(": ")} data-testid="session-consent-no">
              {t("gigs.consentNo")}
            </Button>
          </>
        )}
        {canCancel && !canConsent && (
          <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => act(() => cancelSeatAction(bookingId, ""), (r) => ((r as { lateCancel?: boolean }).lateCancel ? t("gigs.givenUpLate") : t("gigs.givenUp")))} aria-label={[t("gigs.giveUp"), title].join(": ")} data-testid="session-give-up">
            {t("gigs.giveUp")}
          </Button>
        )}
        {canReportUnheld && (
          <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => act(() => unheldAction(bookingId), t("gigs.reportedUnheld"))} aria-label={[t("gigs.reportUnheld"), title].join(": ")} data-testid="session-unheld">
            {t("gigs.reportUnheld")}
          </Button>
        )}
      </div>
      {canCancel && confirmed && <p className="text-xs text-fg-muted">{t("gigs.lateWarn", { hours: lateHours })}</p>}
      {canRate && (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            act(() => rateAction(bookingId, Number(rating), feedback), t("gigs.rated"));
          }}
          className="grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)_auto] sm:items-end"
          data-testid="session-rate"
        >
          <SelectField label={t("gigs.ratingLabel")} value={rating} onChange={(e) => setRating(e.target.value)}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </SelectField>
          <TextAreaField label={t("gigs.feedbackLabel")} rows={1} maxLength={500} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          <Button type="submit" size="sm" disabled={pending}>
            {t("gigs.sendRating")}
          </Button>
        </form>
      )}
    </div>
  );
}

/**
 * "BOOK THE REST" (decision 0008): the sessions of a series, each ticked or all the remaining ones, booked in one
 * order of individual seats — a guardian's confirmed (or waiting for its own payment), a pupil's ask waiting for a
 * guardian; a session that cannot be booked is said with its reason and the rest stand. A paid seat's order opens for
 * the first one here; the others are paid from the seats list, one by one.
 */
export function BookSeries({ seriesId, childId, selfPays, remaining, sessions }: { seriesId: string; childId: string; selfPays: boolean; remaining: number; sessions: { slotId: string; label: string; booked: boolean; full: boolean }[] }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [ticked, setTicked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [checkout, setCheckout] = useState<GigCheckout | null>(null);
  const verb = selfPays ? t("gigs.seriesBookRest", { count: remaining }) : t("gigs.seriesAskRest", { count: remaining });
  if (checkout)
    return (
      <SeatCheckout
        checkout={checkout}
        onClose={() => {
          setCheckout(null);
          setOpen(false);
          router.refresh();
        }}
      />
    );
  return (
    <div className="space-y-2">
      <ul className="flex flex-wrap gap-2 text-xs" data-testid="session-series-sessions">
        {sessions.map((x) => (
          <li key={x.slotId}>
            {x.booked || x.full || !open ? (
              <span className={`inline-flex min-h-8 items-center rounded-full px-3 ${x.booked ? "bg-ok-soft text-fg" : "bg-surface-muted text-fg-muted"}`} data-booked={x.booked ? "yes" : "no"}>
                {x.label}
                {x.booked ? ` · ${t("gigs.seriesBooked")}` : x.full ? ` · ${t("gigs.seriesFull")}` : ""}
              </span>
            ) : (
              <label className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-surface-muted px-3 text-fg">
                <input type="checkbox" className="size-4" checked={ticked.includes(x.slotId)} onChange={(e) => setTicked((list) => (e.target.checked ? [...list, x.slotId] : list.filter((id) => id !== x.slotId)))} />
                {x.label}
              </label>
            )}
          </li>
        ))}
      </ul>
      {remaining === 0 ? null : !open ? (
        <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)} data-testid="session-series-open">
          {verb}
        </Button>
      ) : (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            startTransition(async () => {
              const result = await bookSeriesAction({ seriesId, studentMembershipId: childId, purpose, ...(ticked.length > 0 ? { slotIds: ticked } : {}) });
              if (!result.ok) return setError(result.error);
              const first = result.bookings.find((b) => b.checkout)?.checkout ?? null;
              toast({ tone: result.refused.length > 0 ? "warn" : "ok", title: result.refused.length > 0 ? t("gigs.seriesBookedPartly", { booked: result.bookings.length, refused: result.refused.length, reasons: result.refused.map((r) => r.reason).join(" ") }) : t("gigs.seriesBookedResult", { booked: result.bookings.length }) });
              if (first) return setCheckout(first);
              setOpen(false);
              router.refresh();
            });
          }}
          className="w-full space-y-2"
          data-testid="session-series-form"
        >
          <p className="text-xs text-fg-muted">{t("gigs.seriesPickHint")}</p>
          <TextAreaField label={t("gigs.purposeLabel")} hint={t("gigs.purposeHint")} rows={2} maxLength={500} value={purpose} error={error ?? undefined} onChange={(e) => setPurpose(e.target.value)} data-testid="session-series-purpose" />
          <Button type="submit" size="sm" disabled={pending} data-testid="session-series-book">
            {pending ? t("common.saving") : ticked.length > 0 ? t("gigs.seriesBookChosen") : verb}
          </Button>
        </form>
      )}
    </div>
  );
}
