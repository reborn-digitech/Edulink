"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowCounterClockwiseIcon, SignOutIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { recordLeaving, undoLeaving } from "./actions";
import { DateField } from "@/components/ui/field";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n/dictionary";

const REASONS = [
  { value: "TRANSFERRED", labelKey: "people.transferred" },
  { value: "GRADUATED", labelKey: "people.graduated" },
  { value: "LEFT", labelKey: "people.leftOther" },
] as const satisfies readonly { value: string; labelKey: TranslationKey }[];

/**
 * Recording that a pupil has left, from the directory.
 *
 * A SEPARATE BUTTON FROM PAUSE, AND A DIFFERENT COLOUR, because they are
 * different facts and the recovery from confusing them is different. Pausing is
 * "not for now" and is undone in one click by anybody. Leaving issues a document
 * with the school's name on it, and while it is also undoable, a certificate
 * that briefly existed is a thing that may already have been shown to somebody.
 *
 * THE FORM SAYS WHAT THE FAMILY WILL GET, in the box, before the button is
 * pressed. Everything typed here ends up on a document a family hands to their
 * child's next school — and an admin who does not know that writes an internal
 * note in the note field.
 */
export function LeavingActions({
  membershipId,
  name,
  hasLeft,
}: {
  membershipId: string;
  name: string;
  hasLeft: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<string>("TRANSFERRED");
  const [destination, setDestination] = useState("");
  const [note, setNote] = useState("");
  const [leftOn, setLeftOn] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (hasLeft) {
    return (
      <Button
        size="sm"
        variant="secondary"
        loading={pending}
        icon={<ArrowCounterClockwiseIcon weight="bold" />}
        onClick={() =>
          startTransition(async () => {
            const result = await undoLeaving(membershipId);
            if (!result.ok) {
              toast({ tone: "danger", title: t("people.notUndone"), description: actionError(t, result) });
              return;
            }
            toast({
              tone: "ok",
              title: t("people.backOnRoll", { name }),
              description: t("people.backOnRollBody"),
            });
            router.refresh();
          })
        }
      >
        {t("people.undoLeaving")}
      </Button>
    );
  }

  if (!open) {
    return (
      <Button
        size="sm"
        variant="ghost"
        icon={<SignOutIcon weight="bold" />}
        onClick={() => setOpen(true)}
      >
        <span className="sr-only">{t("people.recordLeftFor", { name })}</span>
        <span aria-hidden="true">{t("people.left")}</span>
      </Button>
    );
  }

  return (
    <div className="w-full rounded-[--radius-md] border border-border bg-surface-muted p-3">
      <p className="text-sm font-semibold text-fg">{t("people.leavingTitle", { name })}</p>
      <p className="mt-1 text-xs leading-relaxed text-fg-muted">{t("people.leavingBody")}</p>

      <label className="mt-3 block">
        <span className="block text-xs font-medium text-fg">{t("people.leavingWhy")}</span>
        <select
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="mt-1 min-h-11 w-full rounded-[--radius-sm] border border-border bg-surface px-3 text-sm text-fg outline-none focus:border-accent"
        >
          {REASONS.map((option) => (
            <option key={option.value} value={option.value}>
              {t(option.labelKey)}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-2 flex flex-wrap gap-2">
        <label className="min-w-[10rem] flex-1">
          <span className="block text-xs font-medium text-fg">
            {t("people.whereTheyWent")}{" "}
            <span className="font-normal text-fg-muted">{t("people.optional")}</span>
          </span>
          <input
            type="text"
            value={destination}
            maxLength={200}
            placeholder={t("people.destinationPlaceholder")}
            onChange={(event) => setDestination(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-[--radius-sm] border border-border bg-surface px-3 text-sm text-fg outline-none focus:border-accent"
          />
        </label>
        <div className="min-w-[11rem]">
          <DateField
label={t("people.lastDay")}
            value={leftOn}
            onChange={(event) => setLeftOn(event.target.value)}
          />
        </div>
      </div>

      <label className="mt-2 block">
        <span className="block text-xs font-medium text-fg">
          {t("people.lineForNextSchool")}{" "}
          <span className="font-normal text-fg-muted">{t("people.optionalFamilyReads")}</span>
        </span>
        <textarea
          value={note}
          rows={2}
          maxLength={1000}
          onChange={(event) => setNote(event.target.value)}
          className="mt-1 w-full rounded-[--radius-sm] border border-border bg-surface px-3 py-2 text-sm text-fg outline-none focus:border-accent"
        />
      </label>

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-danger">
          {error}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          loading={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await recordLeaving(membershipId, {
                reason,
                destination,
                note,
                leftOn,
              });
              if (!result.ok) {
                setError(actionError(t, result, "people.didNotWork"));
                return;
              }
              setOpen(false);
              toast({
                tone: "ok",
                title: t("people.recordedAsLeft", { name }),
                description: t("people.recordedAsLeftBody"),
              });
              router.refresh();
            });
          }}
        >
          {t("people.recordIt")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
        >
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
}
