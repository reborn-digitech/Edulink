"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUUpLeftIcon,
  CalendarCheckIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { bookSlotAction, respondAction, withdrawAction } from "../actions";

/**
 * The family's steps: a sitting booked or moved, an offer accepted or
 * declined, the application taken back. Each calls its action and refreshes
 * so the server's `can.*` flags redraw the page. Withdrawing asks once,
 * because the school is told and the form is closed for good.
 */
const errorBox =
  "rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger";

type SlotOption = {
  id: string;
  label: string;
  note: string | null;
  booked: number;
  capacity: number;
};

export function SlotChooser({
  applicationId,
  slots,
  bookedId,
}: {
  applicationId: string;
  slots: SlotOption[];
  bookedId: string | null;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function book(slotId: string) {
    setError(null);
    startTransition(async () => {
      const result = await bookSlotAction(applicationId, slotId);
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("admissions.bookedDone") });
      router.refresh();
    });
  }

  if (slots.length === 0)
    return (
      <p className="py-4 text-center text-sm text-fg-muted">{t("admissions.noSlotsOpen")}</p>
    );

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className={errorBox}>
          {error}
        </p>
      )}
      <ul className="divide-y divide-border" data-testid="open-slots">
        {slots.map((slot) => {
          const mine = slot.id === bookedId;
          return (
            <li
              key={slot.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div className="min-w-0 flex-1 basis-56">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-fg">
                  <span>{slot.label}</span>
                  {mine && (
                    <Badge tone="ok" size="sm">
                      {t("admissions.testBookedYes")}
                    </Badge>
                  )}
                </p>
                <p className="mt-0.5 text-xs text-fg-muted">
                  {[
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
              {!mine && (
                <Button
                  size="sm"
                  variant={bookedId ? "secondary" : "primary"}
                  loading={pending}
                  icon={<CalendarCheckIcon weight="bold" />}
                  onClick={() => book(slot.id)}
                  data-testid={`book-${slot.id}`}
                >
                  {bookedId
                    ? t("admissions.changeSlot")
                    : t("admissions.bookSlot")}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function RespondButtons({ applicationId }: { applicationId: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function answer(kind: "ACCEPT" | "DECLINE") {
    setError(null);
    startTransition(async () => {
      const result = await respondAction(applicationId, { answer: kind });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("admissions.responded") });
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className={errorBox}>
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          loading={pending}
          icon={<ThumbsUpIcon weight="bold" />}
          onClick={() => answer("ACCEPT")}
          data-testid="respond-accept"
        >
          {t("admissions.accept")}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          loading={pending}
          icon={<ThumbsDownIcon weight="bold" />}
          onClick={() => answer("DECLINE")}
          data-testid="respond-decline"
        >
          {t("admissions.decline")}
        </Button>
      </div>
    </div>
  );
}

export function WithdrawButton({
  applicationId,
  childName,
}: {
  applicationId: string;
  childName: string;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function withdraw() {
    if (!window.confirm(t("admissions.withdrawConfirm", { name: childName })))
      return;
    startTransition(async () => {
      const result = await withdrawAction(applicationId);
      if (!result.ok) {
        toast({
          tone: "danger",
          title: actionError(t, result, "common.tryAgain"),
        });
        return;
      }
      toast({ tone: "ok", title: t("admissions.withdrawn") });
      router.refresh();
    });
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      loading={pending}
      icon={<ArrowUUpLeftIcon weight="bold" />}
      onClick={withdraw}
      data-testid="withdraw"
    >
      {t("admissions.withdraw")}
    </Button>
  );
}
