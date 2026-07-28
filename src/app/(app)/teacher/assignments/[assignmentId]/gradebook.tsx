"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircleIcon,
  FloppyDiskIcon,
  MagnifyingGlassIcon,
  NoteIcon,
} from "@phosphor-icons/react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatTile } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/states";
import { formatMilli, fromMilli } from "@/lib/validation";
import { cn } from "@/lib/cn";
import { submitGrades } from "../actions";

export type GradeRow = {
  membershipId: string;
  name: string;
  fullName: string;
  avatarKey: string | null;
  submittedAt: Date | null;
  submissionStatus: string | null;
  scoreMilli: number | null;
  letter: string | null;
  comment: string | null;
  gradedAt: Date | null;
  late: boolean;
};

type Draft = { score: string; comment: string };

/**
 * The marking screen.
 *
 * Marking is done in one pass down a roster, so everything is edited locally
 * and saved as one batch — a per-row save means a dropped connection leaves
 * half a class marked with no sign of which half. Unsaved work is counted and
 * the save button stays visible until it is zero.
 */
export function Gradebook({
  assignmentId,
  maxMilli,
  rows,
  stats,
}: {
  assignmentId: string;
  maxMilli: number | null;
  rows: GradeRow[];
  stats: { total: number; submitted: number; graded: number; averagePercent: number | null };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(
      rows.map((row) => [
        row.membershipId,
        {
          score: row.scoreMilli === null ? "" : String(fromMilli(row.scoreMilli)),
          comment: row.comment ?? "",
        },
      ]),
    ),
  );
  const [query, setQuery] = useState("");
  const [openComment, setOpenComment] = useState<string | null>(null);

  const original = useMemo(
    () =>
      Object.fromEntries(
        rows.map((row) => [
          row.membershipId,
          {
            score: row.scoreMilli === null ? "" : String(fromMilli(row.scoreMilli)),
            comment: row.comment ?? "",
          },
        ]),
      ),
    [rows],
  );

  const dirtyIds = useMemo(
    () =>
      Object.keys(drafts).filter(
        (id) =>
          drafts[id]!.score !== original[id]!.score ||
          drafts[id]!.comment !== original[id]!.comment,
      ),
    [drafts, original],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) => row.name.toLowerCase().includes(q) || row.fullName.toLowerCase().includes(q),
    );
  }, [rows, query]);

  const invalid = useMemo(
    () =>
      dirtyIds.filter((id) => {
        const raw = drafts[id]!.score.trim();
        if (raw === "") return false;
        const value = Number(raw);
        if (!Number.isFinite(value) || value < 0) return true;
        // Over-marking is legitimate; wildly out of range is a typo.
        return maxMilli !== null && value > fromMilli(maxMilli) * 2;
      }),
    [dirtyIds, drafts, maxMilli],
  );

  function save() {
    if (dirtyIds.length === 0) return;
    if (invalid.length > 0) {
      toast({
        tone: "danger",
        title: "Check those marks",
        description: `${invalid.length} ${invalid.length === 1 ? "mark is" : "marks are"} not a usable number.`,
      });
      return;
    }

    startTransition(async () => {
      const result = await submitGrades({
        assignmentId,
        grades: dirtyIds.map((id) => ({
          studentMembershipId: id,
          score: drafts[id]!.score.trim() === "" ? null : Number(drafts[id]!.score),
          comment: drafts[id]!.comment.trim() || undefined,
        })),
      });

      if (!result.ok) {
        toast({ tone: "danger", title: "Not saved", description: result.error });
        return;
      }

      toast({
        tone: "ok",
        title: `${result.saved} mark${result.saved === 1 ? "" : "s"} saved`,
        description:
          (result.cleared ? `${result.cleared} cleared. ` : "") +
          (result.rejected ? `${result.rejected} rejected. ` : "") +
          "Students and guardians told about new marks only.",
      });
      router.refresh();
    });
  }

  function setDraft(id: string, patch: Partial<Draft>) {
    setDrafts((current) => ({ ...current, [id]: { ...current[id]!, ...patch } }));
  }

  const maxPoints = maxMilli === null ? null : fromMilli(maxMilli);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <StatTile label="Students" value={stats.total} />
        <StatTile
          label="Handed in"
          value={stats.submitted}
          tone={stats.submitted === stats.total ? "ok" : "neutral"}
          hint={`${stats.total - stats.submitted} outstanding`}
        />
        <StatTile
          label="Marked"
          value={stats.graded}
          tone={stats.graded === stats.total ? "ok" : "warn"}
          hint={`${stats.total - stats.graded} to go`}
        />
        <StatTile
          label="Class average"
          value={stats.averagePercent === null ? "—" : `${stats.averagePercent}%`}
          hint={stats.graded === 0 ? "Nothing marked yet" : `Across ${stats.graded} marked`}
        />
      </div>

      <label className="relative block">
        <span className="sr-only">Search this class</span>
        <MagnifyingGlassIcon
          className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-fg-subtle"
          aria-hidden="true"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a student…"
          className="min-h-12 w-full rounded-[--radius-md] border border-border bg-surface pl-11 pr-4 text-[0.9375rem] outline-none focus:border-accent focus:ring-2 focus:ring-accent-ring/40"
        />
      </label>

      {filtered.length === 0 ? (
        <EmptyState
          title={query ? `Nobody matches “${query}”` : "Nobody is in this class"}
          description={query ? "Clear the search to see everyone." : "Add students to the class."}
          action={
            query ? (
              <Button variant="secondary" onClick={() => setQuery("")}>
                Clear search
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-1.5">
          {filtered.map((row) => {
            const draft = drafts[row.membershipId]!;
            const isDirty = dirtyIds.includes(row.membershipId);
            const isInvalid = invalid.includes(row.membershipId);
            const value = draft.score.trim() === "" ? null : Number(draft.score);
            const percent =
              value !== null && maxPoints ? Math.round((value * 100) / maxPoints) : null;

            return (
              <li key={row.membershipId}>
                <div
                  className={cn(
                    "rounded-[--radius-lg] border bg-surface p-2.5 pl-3 transition-colors",
                    isInvalid
                      ? "border-danger"
                      : isDirty
                        ? "border-accent"
                        : "border-border",
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Avatar avatarKey={row.avatarKey} name={row.fullName} size="sm" />

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-fg">{row.name}</p>
                      <p className="truncate text-xs text-fg-muted">
                        {row.submittedAt ? (
                          row.late ? (
                            <span className="text-warn">Handed in late</span>
                          ) : (
                            "Handed in"
                          )
                        ) : (
                          <span className="text-fg-subtle">Not handed in</span>
                        )}
                        {row.gradedAt && !isDirty && " · marked"}
                      </p>
                    </div>

                    {percent !== null && !isInvalid && (
                      <Badge
                        tone={percent >= 70 ? "ok" : percent >= 50 ? "warn" : "danger"}
                        size="sm"
                        className="hidden sm:inline-flex"
                      >
                        {percent}%
                      </Badge>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setOpenComment((c) => (c === row.membershipId ? null : row.membershipId))
                      }
                      aria-label={`${draft.comment ? "Edit" : "Add"} a comment for ${row.name}`}
                      aria-expanded={openComment === row.membershipId}
                      className={cn(
                        "tap grid shrink-0 place-items-center rounded-[--radius-sm]",
                        draft.comment ? "text-accent-strong" : "text-fg-subtle hover:text-fg",
                      )}
                    >
                      <NoteIcon weight={draft.comment ? "fill" : "regular"} className="size-5" />
                    </button>

                    <div className="flex shrink-0 items-center gap-1">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={draft.score}
                        onChange={(e) =>
                          setDraft(row.membershipId, {
                            score: e.target.value.replace(/[^0-9.]/g, ""),
                          })
                        }
                        aria-label={`Mark for ${row.name}${maxPoints ? ` out of ${maxPoints}` : ""}`}
                        aria-invalid={isInvalid || undefined}
                        placeholder="—"
                        className={cn(
                          "h-11 w-16 rounded-[--radius-sm] border bg-surface text-center text-base font-bold tabular-nums outline-none",
                          isInvalid
                            ? "border-danger text-danger"
                            : "border-border focus:border-accent focus:ring-2 focus:ring-accent-ring/40",
                        )}
                      />
                      {maxPoints !== null && (
                        <span className="text-sm text-fg-muted">/{maxPoints}</span>
                      )}
                    </div>
                  </div>

                  {openComment === row.membershipId && (
                    <div className="mt-2.5 border-t border-border pt-2.5">
                      <label htmlFor={`comment-${row.membershipId}`} className="sr-only">
                        Comment for {row.name}
                      </label>
                      <textarea
                        id={`comment-${row.membershipId}`}
                        value={draft.comment}
                        onChange={(e) =>
                          setDraft(row.membershipId, { comment: e.target.value.slice(0, 4000) })
                        }
                        rows={2}
                        autoFocus
                        placeholder="Lovely working out — keep showing your steps."
                        className="w-full resize-y rounded-[--radius-sm] border border-border bg-surface p-2.5 text-sm outline-none focus:border-accent"
                      />
                      <p className="mt-1 text-xs text-fg-muted">
                        The student and their guardians see this.
                      </p>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Sticky save bar — stays until there is nothing unsaved. */}
      {dirtyIds.length > 0 && (
        <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] z-30 flex items-center gap-3 rounded-[--radius-lg] border border-accent bg-surface p-3 shadow-lg lg:bottom-4">
          <CheckCircleIcon weight="fill" className="size-5 shrink-0 text-accent" />
          <p className="min-w-0 flex-1 text-sm font-medium text-fg">
            {dirtyIds.length} unsaved change{dirtyIds.length === 1 ? "" : "s"}
            {invalid.length > 0 && (
              <span className="block text-xs font-normal text-danger">
                {invalid.length} not a usable number
              </span>
            )}
          </p>
          <Button
            onClick={save}
            loading={pending}
            disabled={invalid.length > 0}
            icon={<FloppyDiskIcon weight="bold" />}
          >
            Save marks
          </Button>
        </div>
      )}
    </div>
  );
}
