"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { bookSeatAction, cancelSeatAction, consentAction, rateAction, unheldAction } from "./actions";

/** A seat in an open time: what the pupil wants from it, then the ask (a pupil) or the booking (a guardian). */
export function BookSeat({ slotId, childId, byGuardian, title }: { slotId: string; childId: string; byGuardian: boolean; title: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [purpose, setPurpose] = useState("");
  const [error, setError] = useState<string | null>(null);
  const verb = byGuardian ? t("gigs.bookSeat") : t("gigs.askSeat");

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
export function SeatActions({ bookingId, title, canConsent, canCancel, canRate, canReportUnheld, confirmed, lateHours }: { bookingId: string; title: string; canConsent: boolean; canCancel: boolean; canRate: boolean; canReportUnheld: boolean; confirmed: boolean; lateHours: number }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState("5");
  const [feedback, setFeedback] = useState("");
  const act = (work: () => Promise<{ ok: true } | { ok: false; error: string }>, done: string | ((r: unknown) => string)) => {
    setError(null);
    startTransition(async () => {
      const result = await work();
      if (!result.ok) return setError(result.error);
      toast({ tone: "ok", title: typeof done === "string" ? done : done(result) });
      router.refresh();
    });
  };
  if (!canConsent && !canCancel && !canRate && !canReportUnheld) return null;

  return (
    <div className="w-full space-y-2" data-testid="session-actions">
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        {canConsent && (
          <>
            <Button type="button" size="sm" disabled={pending} onClick={() => act(() => consentAction(bookingId, true), t("gigs.consented"))} aria-label={[t("gigs.consentYes"), title].join(": ")} data-testid="session-consent-yes">
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
