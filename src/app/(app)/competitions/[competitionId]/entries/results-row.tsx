"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowSquareOutIcon, HourglassMediumIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { fromMilli } from "@/lib/validation";
import { recordResultAction } from "../../actions";

/**
 * One child's entry, and what it scored.
 *
 * A row rather than a table cell so the whole thing stays usable on a phone —
 * a member of staff recording results is as likely to be doing it in a hall as
 * at a desk.
 *
 * EMPTY IS NOT ZERO. Clearing both boxes removes the result; typing 0 records a
 * nought. A competition where zero is a real score would otherwise have no way
 * to undo a typo, so the two are kept distinct all the way down to the database.
 */
export function ResultsRow({
  entryId,
  studentName,
  status,
  submissionUrl,
  scoreMilli,
  rank,
  awaitingConsent,
}: {
  entryId: string;
  studentName: string;
  status: string;
  submissionUrl: string | null;
  scoreMilli: number | null;
  rank: number | null;
  awaitingConsent: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [score, setScore] = useState(scoreMilli === null ? "" : String(fromMilli(scoreMilli)));
  const [place, setPlace] = useState(rank === null ? "" : String(rank));
  const [error, setError] = useState<string | null>(null);

  const dirty =
    score !== (scoreMilli === null ? "" : String(fromMilli(scoreMilli))) ||
    place !== (rank === null ? "" : String(rank));

  return (
    <li className="rounded-[--radius-md] border border-border bg-surface p-3.5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium">{studentName}</p>
        {awaitingConsent ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-warn">
            <HourglassMediumIcon weight="fill" className="size-4" />
            Waiting on a guardian
          </span>
        ) : (
          <span className="text-xs text-fg-muted">
            {status === "RESULTS" ? "Result recorded" : status === "SUBMITTED" ? "Handed in" : "Entered"}
          </span>
        )}
      </div>

      {submissionUrl ? (
        <a
          href={submissionUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="mt-1 inline-flex items-center gap-1.5 text-sm text-accent-strong underline underline-offset-4"
        >
          Open their entry
          <ArrowSquareOutIcon weight="bold" className="size-3.5" />
        </a>
      ) : (
        <p className="mt-1 text-sm text-fg-muted">Nothing handed in yet.</p>
      )}

      <form
        className="mt-2.5 flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          startTransition(async () => {
            const result = await recordResultAction({ entryId, score, rank: place });
            if (!result.ok) {
              setError(result.error ?? "That did not save.");
              return;
            }
            toast({ tone: "ok", title: result.message ?? "Saved", description: studentName });
            router.refresh();
          });
        }}
      >
        <div>
          <label htmlFor={`score-${entryId}`} className="block text-xs font-medium text-fg-muted">
            Score
          </label>
          <input
            id={`score-${entryId}`}
            inputMode="decimal"
            value={score}
            onChange={(event) => setScore(event.target.value)}
            className="w-24 rounded-[--radius-md] border border-border bg-surface px-2.5 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor={`rank-${entryId}`} className="block text-xs font-medium text-fg-muted">
            Place
          </label>
          <input
            id={`rank-${entryId}`}
            inputMode="numeric"
            value={place}
            onChange={(event) => setPlace(event.target.value)}
            className="w-20 rounded-[--radius-md] border border-border bg-surface px-2.5 py-2 text-sm"
          />
        </div>
        <Button type="submit" size="sm" variant="secondary" disabled={pending || !dirty}>
          {pending ? "Saving…" : "Save"}
        </Button>
        <p className="basis-full text-xs text-fg-muted">
          Leave both empty to clear the result. A score of 0 is a real score.
        </p>
      </form>

      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </li>
  );
}
