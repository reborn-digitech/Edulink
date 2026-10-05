"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlusIcon, XCircleIcon } from "@phosphor-icons/react";
import type { z } from "zod";
import type { entranceSlotSchema } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { formatInZone } from "@/lib/dates";
import { useT } from "@/lib/i18n";
import { cancelSlotAction, publishSlotsAction } from "../actions";
import { fieldClass } from "@/components/ui/field-class";

type Slot = z.infer<typeof entranceSlotSchema>;

/**
 * The sittings of one cycle and the form that publishes more: a first start
 * time in the browser's own clock (the office sits in the school's zone),
 * how long each runs, how many back to back, and how many children each
 * takes. Cancelling releases the families booked on it and tells them, so
 * it asks once.
 */
export function SlotsPanel({
  cycleId,
  slots,
  timezone,
}: {
  cycleId: string;
  slots: Slot[];
  timezone: string;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [startsAt, setStartsAt] = useState("");
  const [duration, setDuration] = useState("30");
  const [count, setCount] = useState("1");
  const [capacity, setCapacity] = useState("10");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  function publish(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const start = new Date(startsAt);
    if (!startsAt || Number.isNaN(start.getTime())) {
      setError(t("common.checkTheForm"));
      return;
    }
    startTransition(async () => {
      const result = await publishSlotsAction(cycleId, {
        startsAt: start.toISOString(),
        durationMinutes: Number(duration),
        count: Number(count),
        capacity: Number(capacity),
        ...(location.trim() ? { location: location.trim().slice(0, 120) } : {}),
        ...(note.trim() ? { note: note.trim().slice(0, 400) } : {}),
      });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({
        tone: "ok",
        title: t("admissions.published", { count: result.count ?? 0 }),
      });
      setStartsAt("");
      router.refresh();
    });
  }

  function cancel(slot: Slot) {
    if (!window.confirm(t("admissions.cancelSlotConfirm"))) return;
    startTransition(async () => {
      const result = await cancelSlotAction(slot.id);
      if (!result.ok) {
        toast({
          tone: "danger",
          title: actionError(t, result, "common.tryAgain"),
        });
        return;
      }
      toast({ tone: "ok", title: t("admissions.cancelled") });
      router.refresh();
    });
  }

  const compact = "[&_input]:min-h-10 [&_input]:py-2";

  return (
    <div className="space-y-5">
      {slots.length === 0 ? (
        <EmptyState
          className="border-0 bg-transparent py-6"
          title={t("admissions.noSlots")}
          description={t("admissions.noSlotsBody")}
        />
      ) : (
        <ul className="divide-y divide-border" data-testid="entrance-slots">
          {slots.map((slot) => (
            <li
              key={slot.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0 flex-1 basis-56">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-fg">
                  <span>
                    {formatInZone(new Date(slot.startsAt), timezone)} –{" "}
                    {formatInZone(new Date(slot.endsAt), timezone, {
                      timeStyle: "short",
                    })}
                  </span>
                  {slot.cancelledAt && (
                    <Badge tone="danger" size="sm">
                      {t("admissions.cancelled")}
                    </Badge>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-fg-muted">
                  {[
                    slot.location,
                    t("admissions.booked", {
                      booked: slot.booked,
                      capacity: slot.capacity,
                    }),
                    slot.note,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              {!slot.cancelledAt && (
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<XCircleIcon weight="bold" />}
                  loading={pending}
                  onClick={() => cancel(slot)}
                  data-testid={`cancel-slot-${slot.id}`}
                >
                  {t("admissions.cancelSlot")}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={publish}
        noValidate
        className="space-y-3 rounded-[var(--radius-md)] border border-border bg-surface-muted p-4"
        data-testid="publish-slots"
      >
        <p className="text-sm font-semibold text-fg">
          {t("admissions.publishSlots")}
        </p>
        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("admissions.startsAt")} required className={compact}>
            {({ id, describedBy }) => (
              <input
                id={id}
                type="datetime-local"
                required
                aria-describedby={describedBy}
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className={fieldClass()}
              />
            )}
          </Field>
          <TextField
            label={t("admissions.duration")}
            type="number"
            inputMode="numeric"
            min={10}
            max={240}
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className={compact}
          />
          <TextField
            label={t("admissions.count")}
            type="number"
            inputMode="numeric"
            min={1}
            max={20}
            value={count}
            onChange={(e) => setCount(e.target.value)}
            className={compact}
          />
          <TextField
            label={t("admissions.capacity")}
            type="number"
            inputMode="numeric"
            min={1}
            max={200}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className={compact}
          />
          <TextField
            label={t("admissions.location")}
            value={location}
            maxLength={120}
            autoComplete="off"
            onChange={(e) => setLocation(e.target.value)}
            className={compact}
          />
          <TextField
            label={t("admissions.slotNote")}
            value={note}
            maxLength={400}
            autoComplete="off"
            onChange={(e) => setNote(e.target.value)}
            className={compact}
          />
        </div>
        <Button
          type="submit"
          size="sm"
          loading={pending}
          icon={<CalendarPlusIcon weight="bold" />}
        >
          {t("admissions.publishSlots")}
        </Button>
      </form>
    </div>
  );
}
