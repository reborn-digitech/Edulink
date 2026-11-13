"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useLocale, useT } from "@/lib/i18n";
import { formatPaise } from "@edulink/i18n";
import type { GigMeetingAccount } from "@edulink/contracts";
import { meetingCapFor, MEETING_SERVICE_NAMES } from "@/lib/meeting-links";
/** What the price box needs of a provider's paid gate: an expert's (PaidGate) or a teacher's (TeacherPaidGate). */
type PriceGate = { canCharge: boolean; seatPriceMinPaise: number; seatPriceMaxPaise: number; commissionPercent: number };
import type { GigSeriesRule } from "@edulink/contracts";
import { cancelSeatAction, cancelSeriesAction, cancelSlotAction, closeSeatAction, offerSeriesAction, offerSlotAction, premiumMeetingAction } from "@/app/(app)/sessions/actions";

/**
 * The free-account cap sentence beside the time (decision 0008, 7 Nov 2026): once the link names a service with a
 * cap and the provider has not said their account is premium, the session is held to that many minutes. Pure over
 * meetingCapFor, so the sentence and the server's refusal cannot disagree about which link is capped.
 */
export function capSentence(t: (key: "seats.freeLimitHint", vars: Record<string, string | number>) => string, meetingUrl: string, meeting: GigMeetingAccount | null | undefined): string | null {
  if (!meeting) return null;
  const cap = meetingCapFor(meetingUrl, meeting.caps, meeting.premium);
  return cap ? t("seats.freeLimitHint", { service: MEETING_SERVICE_NAMES[cap.service], minutes: cap.minutes }) : null;
}

/**
 * A provider offers a time: a one-to-one of thirty minutes, or (an expert) a workshop with its length and seats; and —
 * past the paid gate — a seat's price on either kind (seats, 17 Oct 2026: a one-to-one and a teacher's guidance may be
 * priced). The room is a Meet, Zoom, Teams or Jitsi link, checked again on the server.
 */
export function OfferForm({ workshops, maxSeats, gate = null, meeting = null }: { workshops: boolean; maxSeats: number; gate?: PriceGate | null; meeting?: GigMeetingAccount | null }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [kind, setKind] = useState<"ONE_TO_ONE" | "WORKSHOP">("ONE_TO_ONE");
  const [title, setTitle] = useState("");
  const [starts, setStarts] = useState("");
  const [minutes, setMinutes] = useState("60");
  const [seats, setSeats] = useState("20");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const rupeesTyped = price.trim() === "" ? 0 : Math.round(Number(price) * 100);
  const cap = capSentence(t, meetingUrl, meeting);

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        // The box holds the wall-clock time of the person typing; the browser knows which clock that is.
        const at = new Date(starts);
        if (!starts || Number.isNaN(at.getTime())) return setError(t("gigs.refuseSlotTime"));
        startTransition(async () => {
          const result = await offerSlotAction({ kind, title, startsAt: at.toISOString(), meetingUrl, ...(kind === "WORKSHOP" ? { minutes: Number(minutes), seats: Number(seats) } : {}), ...(gate && rupeesTyped > 0 ? { pricePaise: rupeesTyped } : {}) });
          if (!result.ok) return setError(result.error);
          toast({ tone: "ok", title: t("gigs.offered") });
          setTitle("");
          setStarts("");
          setPrice("");
          router.refresh();
        });
      }}
      className="space-y-3"
      data-testid="slot-form"
    >
      {error && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger" data-testid="slot-error">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {workshops && (
          <SelectField label={t("gigs.slotKind")} value={kind} onChange={(e) => setKind(e.target.value as "ONE_TO_ONE" | "WORKSHOP")} data-testid="slot-kind">
            <option value="ONE_TO_ONE">{t("gigs.kindONE_TO_ONE")}</option>
            <option value="WORKSHOP">{t("gigs.kindWORKSHOP")}</option>
          </SelectField>
        )}
        <TextField label={t("gigs.slotTitle")} hint={t("gigs.slotTitleHint")} value={title} maxLength={120} autoComplete="off" onChange={(e) => setTitle(e.target.value)} data-testid="slot-title" />
        <div data-typing="en">
          <TextField label={t("gigs.slotStarts")} type="datetime-local" value={starts} onChange={(e) => setStarts(e.target.value)} data-testid="slot-starts" />
        </div>
        {kind === "WORKSHOP" && (
          <div className="grid grid-cols-2 gap-3" data-typing="en">
            <TextField label={t("gigs.slotMinutes")} hint={cap ?? undefined} inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} data-testid="slot-minutes" />
            <TextField label={t("gigs.slotSeats")} hint={["2", String(maxSeats)].join("–")} inputMode="numeric" value={seats} onChange={(e) => setSeats(e.target.value)} data-testid="slot-seats" />
          </div>
        )}
        {gate && (
          <div className="sm:col-span-2" data-typing="en">
            <TextField label={t("gigs.priceLabel")} hint={t("gigs.priceHint", { min: formatPaise(gate.seatPriceMinPaise, locale), max: formatPaise(gate.seatPriceMaxPaise, locale), percent: gate.commissionPercent })} inputMode="decimal" value={price} disabled={!gate.canCharge} onChange={(e) => setPrice(e.target.value)} data-testid="slot-price" />
          </div>
        )}
        <div className="sm:col-span-2" data-typing="en">
          <TextField label={t("gigs.slotLink")} hint={t("seats.linkHint")} type="url" inputMode="url" value={meetingUrl} maxLength={500} autoComplete="off" onChange={(e) => setMeetingUrl(e.target.value)} data-testid="slot-link" />
          {/* The cap is said where the time is set (decision 0008): under the minutes of a workshop, and here for a one-to-one, which is thirty minutes and so inside every cap. */}
          {cap && kind === "ONE_TO_ONE" && (
            <p className="mt-1 text-xs text-fg-muted" data-testid="slot-cap">
              {cap}
            </p>
          )}
        </div>
      </div>
      <Button type="submit" disabled={pending} data-testid="slot-offer">
        {pending ? t("common.saving") : t("gigs.offer")}
      </Button>
    </form>
  );
}

/**
 * THE PROVIDER'S WORD THAT THEIR MEETING ACCOUNT IS PREMIUM (decision 0008): one switch, said once, lifting the
 * service's free-account length cap on what they offer. Nothing verifies it, and the note says so.
 */
export function PremiumMeetingSwitch({ meeting }: { meeting: GigMeetingAccount }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const caps = (Object.keys(meeting.caps) as (keyof typeof meeting.caps)[]).filter((k) => meeting.caps[k] > 0).map((k) => `${MEETING_SERVICE_NAMES[k]} ${meeting.caps[k]}`).join(", ");
  return (
    <div className="space-y-2 rounded-[var(--radius-md)] border border-border bg-surface-muted px-4 py-3" data-testid="premium-meeting">
      <p className="text-sm font-medium text-fg">{t("seats.premiumTitle")}</p>
      <p className="text-xs text-fg-muted">{t("seats.premiumNote", { caps })}</p>
      <label className="flex min-h-11 items-center gap-2 text-sm text-fg">
        <input
          type="checkbox"
          className="size-4"
          checked={meeting.premium}
          disabled={pending}
          onChange={(e) =>
            startTransition(async () => {
              setError(null);
              const result = await premiumMeetingAction(e.target.checked);
              if (!result.ok) return setError(result.error);
              toast({ tone: "ok", title: t("seats.premiumSaved") });
              router.refresh();
            })
          }
          data-testid="premium-meeting-switch"
        />
        {t("seats.premiumLabel")}
      </label>
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** A reason, then the act: cancelling a whole time, or one seat in it. */
export function CancelWithReason({ id, what, title }: { id: string; what: "slot" | "seat"; title: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const label = what === "slot" ? t("gigs.cancelSlot") : t("gigs.cancelSeat");
  if (!open)
    return (
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)} aria-label={[label, title].join(": ")} data-testid={`${what}-cancel-open`}>
        {label}
      </Button>
    );
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = what === "slot" ? await cancelSlotAction(id, reason) : await cancelSeatAction(id, reason);
          if (!result.ok) return setError(result.error);
          toast({ tone: "ok", title: t("gigs.slotCancelled") });
          setOpen(false);
          router.refresh();
        });
      }}
      className="flex w-full flex-wrap items-end gap-2"
    >
      <TextField label={t("gigs.reasonLabel")} className="min-w-0 flex-1" value={reason} maxLength={300} error={error ?? undefined} onChange={(e) => setReason(e.target.value)} data-testid={`${what}-cancel-reason`} />
      <Button type="submit" size="sm" variant="secondary" disabled={pending} data-testid={`${what}-cancel`}>
        {label}
      </Button>
    </form>
  );
}

/** After a time has begun, how one seat in it went. */
export function CloseSeat({ bookingId, pupilName }: { bookingId: string; pupilName: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const mark = (outcome: "DELIVERED" | "MISSED") =>
    startTransition(async () => {
      setError(null);
      const result = await closeSeatAction(bookingId, outcome);
      if (!result.ok) return setError(result.error);
      toast({ tone: "ok", title: t("gigs.marked") });
      router.refresh();
    });
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Button type="button" size="sm" disabled={pending} onClick={() => mark("DELIVERED")} aria-label={[t("gigs.markDelivered"), pupilName].join(": ")} data-testid="seat-delivered">
        {t("gigs.markDelivered")}
      </Button>
      <Button type="button" size="sm" variant="secondary" disabled={pending} onClick={() => mark("MISSED")} aria-label={[t("gigs.markMissed"), pupilName].join(": ")} data-testid="seat-missed">
        {t("gigs.markMissed")}
      </Button>
      {error && (
        <span role="alert" className="text-sm font-medium text-danger">
          {error}
        </span>
      )}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Sessions in series (decision 0008, 7 Nov 2026)                              */
/* -------------------------------------------------------------------------- */

const WEEKDAY_KEYS = ["gigs.weekday0", "gigs.weekday1", "gigs.weekday2", "gigs.weekday3", "gigs.weekday4", "gigs.weekday5", "gigs.weekday6"] as const;

/**
 * A series offered in one go: the shape of every session (as the single form takes it) and the rule — a list of
 * dates typed one by one, or every week on the ticked days at a time, from a day until a day. The server expands the
 * rule in the provider's own zone and checks each session as a single time is.
 */
export function SeriesForm({ workshops, maxSeats, gate = null, meeting = null }: { workshops: boolean; maxSeats: number; gate?: PriceGate | null; meeting?: GigMeetingAccount | null }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [kind, setKind] = useState<"ONE_TO_ONE" | "WORKSHOP">("ONE_TO_ONE");
  const [title, setTitle] = useState("");
  const [mode, setMode] = useState<"DATES" | "WEEKLY">("WEEKLY");
  const [dates, setDates] = useState<string[]>(["", ""]);
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [time, setTime] = useState("17:00");
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [minutes, setMinutes] = useState("60");
  const [seats, setSeats] = useState("20");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const rupeesTyped = price.trim() === "" ? 0 : Math.round(Number(price) * 100);
  const cap = capSentence(t, meetingUrl, meeting);

  const rule = (): GigSeriesRule | null => {
    if (mode === "DATES") {
      const starts = dates.map((d) => d.trim()).filter(Boolean).map((d) => new Date(d));
      if (starts.length === 0 || starts.some((d) => Number.isNaN(d.getTime()))) return null;
      return { mode: "DATES", startsAt: starts.map((d) => d.toISOString()) };
    }
    if (weekdays.length === 0 || !from || !until || !/^\d{2}:\d{2}$/.test(time)) return null;
    return { mode: "WEEKLY", weekdays: [...weekdays].sort(), time, from, until };
  };

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        const r = rule();
        if (!r) return setError(t("gigs.refuseSlotTime"));
        startTransition(async () => {
          const result = await offerSeriesAction({ kind, title, meetingUrl, rule: r, ...(kind === "WORKSHOP" ? { minutes: Number(minutes), seats: Number(seats) } : {}), ...(gate && rupeesTyped > 0 ? { pricePaise: rupeesTyped } : {}) });
          if (!result.ok) return setError(result.error);
          toast({ tone: "ok", title: t("gigs.seriesOffered", { count: result.slotIds.length }) });
          setTitle("");
          setDates(["", ""]);
          setPrice("");
          router.refresh();
        });
      }}
      className="space-y-3"
      data-testid="series-form"
    >
      <p className="text-xs text-fg-muted">{t("gigs.seriesIntro")}</p>
      {error && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger" data-testid="series-error">
          {error}
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        {workshops && (
          <SelectField label={t("gigs.slotKind")} value={kind} onChange={(e) => setKind(e.target.value as "ONE_TO_ONE" | "WORKSHOP")} data-testid="series-kind">
            <option value="ONE_TO_ONE">{t("gigs.kindONE_TO_ONE")}</option>
            <option value="WORKSHOP">{t("gigs.kindWORKSHOP")}</option>
          </SelectField>
        )}
        <TextField label={t("gigs.slotTitle")} hint={t("gigs.slotTitleHint")} value={title} maxLength={120} autoComplete="off" onChange={(e) => setTitle(e.target.value)} data-testid="series-title" />
        <SelectField label={t("gigs.seriesModeLabel")} value={mode} onChange={(e) => setMode(e.target.value as "DATES" | "WEEKLY")} data-testid="series-mode">
          <option value="WEEKLY">{t("gigs.seriesModeWEEKLY")}</option>
          <option value="DATES">{t("gigs.seriesModeDATES")}</option>
        </SelectField>
        {mode === "DATES" ? (
          <div className="space-y-2 sm:col-span-2" data-typing="en" data-testid="series-dates">
            {dates.map((d, i) => (
              <div key={i} className="flex items-end gap-2">
                <TextField label={t("gigs.seriesDateN", { n: i + 1 })} type="datetime-local" value={d} onChange={(e) => setDates((list) => list.map((x, j) => (j === i ? e.target.value : x)))} className="min-w-0 flex-1" />
                {dates.length > 2 && (
                  <Button type="button" size="sm" variant="ghost" onClick={() => setDates((list) => list.filter((_, j) => j !== i))}>
                    {t("gigs.seriesRemoveDate")}
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" size="sm" variant="secondary" onClick={() => setDates((list) => [...list, ""])} data-testid="series-add-date">
              {t("gigs.seriesAddDate")}
            </Button>
          </div>
        ) : (
          <>
            <fieldset className="sm:col-span-2">
              <legend className="text-sm font-medium text-fg">{t("gigs.seriesWeekdays")}</legend>
              <div className="mt-1 flex flex-wrap gap-2" data-testid="series-weekdays">
                {WEEKDAY_KEYS.map((key, day) => (
                  <label key={key} className="flex min-h-11 items-center gap-1.5 text-sm text-fg">
                    <input type="checkbox" className="size-4" checked={weekdays.includes(day)} onChange={(e) => setWeekdays((list) => (e.target.checked ? [...list, day] : list.filter((d) => d !== day)))} />
                    {t(key)}
                  </label>
                ))}
              </div>
            </fieldset>
            <div data-typing="en">
              <TextField label={t("gigs.seriesTime")} type="time" value={time} onChange={(e) => setTime(e.target.value)} data-testid="series-time" />
            </div>
            <div className="grid grid-cols-2 gap-3" data-typing="en">
              <TextField label={t("gigs.seriesFrom")} type="date" value={from} onChange={(e) => setFrom(e.target.value)} data-testid="series-from" />
              <TextField label={t("gigs.seriesUntil")} type="date" value={until} onChange={(e) => setUntil(e.target.value)} data-testid="series-until" />
            </div>
          </>
        )}
        {kind === "WORKSHOP" && (
          <div className="grid grid-cols-2 gap-3" data-typing="en">
            <TextField label={t("gigs.slotMinutes")} hint={cap ?? undefined} inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} />
            <TextField label={t("gigs.slotSeats")} hint={["2", String(maxSeats)].join("–")} inputMode="numeric" value={seats} onChange={(e) => setSeats(e.target.value)} />
          </div>
        )}
        {gate && (
          <div className="sm:col-span-2" data-typing="en">
            <TextField label={t("gigs.priceLabel")} hint={t("gigs.priceHint", { min: formatPaise(gate.seatPriceMinPaise, locale), max: formatPaise(gate.seatPriceMaxPaise, locale), percent: gate.commissionPercent })} inputMode="decimal" value={price} disabled={!gate.canCharge} onChange={(e) => setPrice(e.target.value)} />
          </div>
        )}
        <div className="sm:col-span-2" data-typing="en">
          <TextField label={t("gigs.slotLink")} hint={t("seats.linkHint")} type="url" inputMode="url" value={meetingUrl} maxLength={500} autoComplete="off" onChange={(e) => setMeetingUrl(e.target.value)} data-testid="series-link" />
          {cap && kind === "ONE_TO_ONE" && <p className="mt-1 text-xs text-fg-muted">{cap}</p>}
        </div>
      </div>
      <Button type="submit" disabled={pending} data-testid="series-offer">
        {pending ? t("common.saving") : t("gigs.seriesOffer")}
      </Button>
    </form>
  );
}

/** The whole series taken back with a reason: every session not yet begun is cancelled, each family told. */
export function CancelSeries({ seriesId, title }: { seriesId: string; title: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  if (!open)
    return (
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)} aria-label={[t("gigs.seriesCancel"), title].join(": ")} data-testid="series-cancel-open">
        {t("gigs.seriesCancel")}
      </Button>
    );
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await cancelSeriesAction(seriesId, reason);
          if (!result.ok) return setError(result.error);
          toast({ tone: "ok", title: t("gigs.seriesCancelled", { count: result.cancelled }) });
          setOpen(false);
          router.refresh();
        });
      }}
      className="flex w-full flex-wrap items-end gap-2"
    >
      <TextField label={t("gigs.reasonLabel")} className="min-w-0 flex-1" value={reason} maxLength={300} error={error ?? undefined} onChange={(e) => setReason(e.target.value)} data-testid="series-cancel-reason" />
      <Button type="submit" size="sm" variant="secondary" disabled={pending} data-testid="series-cancel">
        {t("gigs.seriesCancel")}
      </Button>
    </form>
  );
}
