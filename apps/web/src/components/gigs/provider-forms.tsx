"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SelectField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useLocale, useT } from "@/lib/i18n";
import { formatPaise } from "@edulink/i18n";
import type { PaidGate } from "@/lib/gig-sessions";
import { cancelSeatAction, cancelSlotAction, closeSeatAction, offerSlotAction } from "@/app/(app)/sessions/actions";

/** A provider offers a time: a one-to-one of thirty minutes, or (an expert) a workshop with its length, seats and — past the paid gate — a seat's price. */
export function OfferForm({ workshops, maxSeats, gate = null }: { workshops: boolean; maxSeats: number; gate?: PaidGate | null }) {
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
          const result = await offerSlotAction({ kind, title, startsAt: at.toISOString(), meetingUrl, ...(kind === "WORKSHOP" ? { minutes: Number(minutes), seats: Number(seats), ...(gate && rupeesTyped > 0 ? { pricePaise: rupeesTyped } : {}) } : {}) });
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
        <p role="alert" className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger" data-testid="slot-error">
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
            <TextField label={t("gigs.slotMinutes")} inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} data-testid="slot-minutes" />
            <TextField label={t("gigs.slotSeats")} hint={["2", String(maxSeats)].join("–")} inputMode="numeric" value={seats} onChange={(e) => setSeats(e.target.value)} data-testid="slot-seats" />
          </div>
        )}
        {kind === "WORKSHOP" && gate && (
          <div className="sm:col-span-2" data-typing="en">
            <TextField label={t("gigs.priceLabel")} hint={t("gigs.priceHint", { min: formatPaise(gate.seatPriceMinPaise, locale), max: formatPaise(gate.seatPriceMaxPaise, locale), percent: gate.commissionPercent })} inputMode="decimal" value={price} disabled={!gate.canCharge} onChange={(e) => setPrice(e.target.value)} data-testid="slot-price" />
          </div>
        )}
        <div className="sm:col-span-2" data-typing="en">
          <TextField label={t("gigs.slotLink")} hint={t("gigs.slotLinkHint")} type="url" inputMode="url" value={meetingUrl} maxLength={500} autoComplete="off" onChange={(e) => setMeetingUrl(e.target.value)} data-testid="slot-link" />
        </div>
      </div>
      <Button type="submit" disabled={pending} data-testid="slot-offer">
        {pending ? t("common.saving") : t("gigs.offer")}
      </Button>
    </form>
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
