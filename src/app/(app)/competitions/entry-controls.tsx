"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircleIcon, HourglassMediumIcon, TrophyIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatMilli } from "@/lib/validation";
import {
  consentAction,
  enterAction,
  setStatusAction,
  submitAction,
  withdrawAction,
} from "./actions";

/**
 * The one control a child sees, and the one a guardian sees.
 *
 * Deliberately in the same file, because they are two halves of one decision and
 * splitting them is how the two ends drift into telling different stories about
 * the same entry.
 */

export function EnterButton({
  competitionId,
  title,
  open,
  requiresParentConsent,
}: {
  competitionId: string;
  title: string;
  open: boolean;
  requiresParentConsent: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <p className="text-sm text-muted">Entries for this one have closed.</p>
    );
  }

  return (
    <Button
      icon={<TrophyIcon weight="bold" />}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await enterAction({ id: competitionId });
          if (!result.ok) {
            toast({ tone: "danger", title: "That did not go through", description: result.error });
            return;
          }
          toast({
            tone: "ok",
            title: requiresParentConsent ? "Asked to enter 🎉" : "You are entered 🎉",
            description: requiresParentConsent
              ? `A grown-up needs to say yes before you take part in ${title}.`
              : `You are taking part in ${title}.`,
          });
          router.refresh();
        })
      }
    >
      {pending ? "Just a moment…" : "Enter this"}
    </Button>
  );
}

/** What the child sees once they have asked. */
export function EntryStatus({
  entryId,
  awaitingConsent,
  canWithdraw,
}: {
  entryId: string;
  awaitingConsent: boolean;
  canWithdraw: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span
        className={`inline-flex items-center gap-1.5 rounded-[--radius-md] px-2.5 py-1.5 text-sm font-medium ${
          awaitingConsent ? "bg-warn-soft text-warn" : "bg-ok-soft text-ok"
        }`}
      >
        {awaitingConsent ? (
          <>
            <HourglassMediumIcon weight="fill" className="size-4" />
            Waiting for a grown-up to say yes
          </>
        ) : (
          <>
            <CheckCircleIcon weight="fill" className="size-4" />
            You are entered
          </>
        )}
      </span>

      {canWithdraw && (
        <Button
          size="sm"
          variant="ghost"
          icon={<XIcon weight="bold" />}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await withdrawAction({ id: entryId });
              if (!result.ok) {
                toast({ tone: "danger", title: "That did not go through", description: result.error });
                return;
              }
              toast({ tone: "ok", title: "Withdrawn", description: "You can always ask again." });
              router.refresh();
            })
          }
        >
          Withdraw
        </Button>
      )}
    </div>
  );
}

/**
 * The guardian's decision.
 *
 * Two buttons, both plain words. "Allow" and "Not this time" rather than a
 * checkbox, because the parent is being asked a question about their child
 * taking part in something outside the school, and that deserves a sentence and
 * a decision rather than a toggle they might flip by accident.
 */
export function ConsentControls({
  entryId,
  childName,
  title,
}: {
  entryId: string;
  childName: string;
  title: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        icon={<CheckCircleIcon weight="bold" />}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await consentAction({ id: entryId });
            if (!result.ok) {
              toast({ tone: "danger", title: "That did not go through", description: result.error });
              return;
            }
            toast({
              tone: "ok",
              title: "Consent given",
              description: `${childName} can take part in ${title}.`,
            });
            router.refresh();
          })
        }
      >
        {pending ? "Just a moment…" : "Allow"}
      </Button>

      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await withdrawAction({ id: entryId });
            if (!result.ok) {
              toast({ tone: "danger", title: "That did not go through", description: result.error });
              return;
            }
            toast({
              tone: "ok",
              title: "Not this time",
              description: `${childName} has been taken out of ${title}.`,
            });
            router.refresh();
          })
        }
      >
        Not this time
      </Button>
    </div>
  );
}

/**
 * The organising school's own controls.
 *
 * Publishing is its own press, separate from saving, because it puts this in
 * front of every child at every school on the installation. Withdrawing sets
 * ARCHIVED rather than deleting — children may have entered and guardians may
 * have consented, and taking that away silently would be worse than a stale row.
 */
export function OrganiserControls({
  competitionId,
  status,
  entered,
}: {
  competitionId: string;
  status: string;
  entered: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function change(next: "PUBLISHED" | "ARCHIVED" | "DRAFT") {
    startTransition(async () => {
      const result = await setStatusAction({ id: competitionId, status: next });
      if (!result.ok) {
        toast({ tone: "danger", title: "That did not go through", description: result.error });
        return;
      }
      toast({ tone: "ok", title: "Done", description: result.message });
      router.refresh();
    });
  }

  return (
    <div className="space-y-2.5">
      <p className="text-sm text-fg-muted">
        Your school is organising this one.
        {status === "DRAFT" && " Nobody else can see it yet."}
      </p>
      <div className="flex flex-wrap gap-2">
        {status !== "PUBLISHED" && (
          <Button size="sm" disabled={pending} onClick={() => change("PUBLISHED")}>
            {pending ? "Just a moment…" : "Publish it"}
          </Button>
        )}
        {status === "PUBLISHED" && (
          <Button size="sm" variant="secondary" disabled={pending} onClick={() => change("ARCHIVED")}>
            Withdraw it
          </Button>
        )}
        {status === "ARCHIVED" && (
          <Button size="sm" variant="ghost" disabled={pending} onClick={() => change("DRAFT")}>
            Put it back as a draft
          </Button>
        )}
      </div>
      {status === "PUBLISHED" && entered > 0 && (
        <p className="text-xs text-fg-muted">
          Withdrawing keeps the {entered} {entered === 1 ? "entry" : "entries"} already made — it just
          takes it off the list.
        </p>
      )}
    </div>
  );
}

/**
 * The child's hand-in.
 *
 * A link, not a file: competition work goes to the organiser's own site, and
 * storing a child's work here for somebody who cannot read it would be worse
 * than useless. Deliberately separate from entering — registering says a child
 * would like to take part, this sends their actual work.
 */
export function SubmitPanel({
  competitionId,
  existingUrl,
  canSubmit,
  reason,
}: {
  competitionId: string;
  existingUrl: string | null;
  canSubmit: boolean;
  reason: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [url, setUrl] = useState(existingUrl ?? "");
  const [error, setError] = useState<string | null>(null);

  if (!canSubmit) {
    return reason ? <p className="text-sm text-fg-muted">{reason}</p> : null;
  }

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        startTransition(async () => {
          const result = await submitAction({ id: competitionId, url: url.trim() });
          if (!result.ok) {
            setError(result.error ?? "That did not go through.");
            return;
          }
          toast({
            tone: "ok",
            title: existingUrl ? "Changed 🎉" : "Handed in 🎉",
            description: "Your teacher can see it now.",
          });
          router.refresh();
        });
      }}
    >
      <label htmlFor="entry-url" className="block text-sm font-medium">
        {existingUrl ? "Your entry" : "Hand in your entry"}
      </label>
      <input
        id="entry-url"
        type="url"
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        placeholder="https://…"
        required
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "entry-url-error" : undefined}
        className={`w-full rounded-[--radius-md] border bg-surface px-3 py-2.5 text-[0.9375rem] ${
          error ? "border-danger" : "border-border"
        }`}
      />
      <p className="text-xs text-fg-muted">A link to your work — it must start with https://</p>
      {error && (
        <p id="entry-url-error" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button type="submit" size="sm" disabled={pending || url.trim().length === 0}>
        {pending ? "Just a moment…" : existingUrl ? "Change it" : "Hand it in"}
      </Button>
    </form>
  );
}

/** What a child sees once somebody has recorded what they scored. */
export function ResultBadge({ scoreMilli, rank }: { scoreMilli: number | null; rank: number | null }) {
  if (scoreMilli === null && rank === null) return null;
  return (
    <p className="inline-flex items-center gap-2 rounded-[--radius-md] bg-ok-soft px-2.5 py-1.5 text-sm font-medium text-ok">
      <TrophyIcon weight="fill" className="size-4" />
      {rank !== null && <span>{ordinalLabel(rank)}</span>}
      {scoreMilli !== null && <span>{formatMilli(scoreMilli)} points</span>}
    </p>
  );
}

function ordinalLabel(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th place`;
  const suffix = { 1: "st", 2: "nd", 3: "rd" }[n % 10] ?? "th";
  return `${n}${suffix} place`;
}
