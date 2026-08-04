"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowSquareOutIcon, SparkleIcon, WarningIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { generate, publish, saveRemark, withdraw } from "./actions";

type Assessment = {
  assignmentId: string;
  title: string;
  category: string | null;
  gradedCount: number;
  classSize: number;
};

type CardRow = {
  id: string;
  title: string;
  status: string;
  remark: string | null;
  overallPercentMilli: number | null;
  attendancePresent: number;
  attendanceTotal: number;
  studentName: string;
};

/**
 * Building a term's report cards.
 *
 * PICK THE ASSESSMENTS, THEN GENERATE, THEN PUBLISH — three steps, in that
 * order, because that is the order a teacher actually does it and because each
 * one is reversible until the last. The drafts exist so somebody can read thirty
 * cards before thirty families do.
 *
 * The picker says how many of the class have a mark for each assessment. Putting
 * an unmarked test onto thirty report cards produces thirty blanks, and finding
 * that out after publishing is the failure this one line prevents.
 */
export function Builder({
  classId,
  assessments,
  existingTitles,
  cards,
  selectedTitle,
}: {
  classId: string;
  assessments: Assessment[];
  existingTitles: string[];
  cards: CardRow[];
  selectedTitle: string | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(selectedTitle ?? "Term 1");
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [remarks, setRemarks] = useState<Record<string, string>>({});

  const published = cards.filter((c) => c.status === "PUBLISHED").length;
  const drafts = cards.filter((c) => c.status === "DRAFT").length;

  function toggle(id: string) {
    setPicked((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }

  function build() {
    setError(null);
    startTransition(async () => {
      const result = await generate(classId, { title, assignmentIds: picked });
      if (!result.ok) {
        setError(result.error ?? "That did not work.");
        return;
      }
      toast({
        tone: "ok",
        title: `${(result.created ?? 0) + (result.updated ?? 0)} drafts ready`,
        description: result.skippedPublished
          ? `${result.skippedPublished} already published and left alone.`
          : undefined,
      });
      router.push(`/teacher/classes/${classId}/report-cards?title=${encodeURIComponent(title)}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* ---------------- 1. what counts ---------------- */}
      <section>
        <h2 className="text-sm font-semibold text-fg">1. What goes on the card</h2>
        <p className="mt-0.5 text-xs leading-relaxed text-fg-muted">
          Choose the tests and assignments this report covers. They appear in the order you pick
          them.
        </p>

        {error && (
          <p
            role="alert"
            className="mt-3 rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger"
          >
            {error}
          </p>
        )}

        {assessments.length === 0 ? (
          <p className="mt-3 rounded-[--radius-md] border border-dashed border-border p-4 text-sm text-fg-muted">
            This class has no published assignments yet. Set some work and mark it first.
          </p>
        ) : (
          <ul className="mt-3 space-y-1">
            {assessments.map((assessment) => {
              const on = picked.includes(assessment.assignmentId);
              const unmarked = assessment.gradedCount === 0;
              return (
                <li key={assessment.assignmentId}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(assessment.assignmentId)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[--radius-sm] p-2.5 text-left transition-colors",
                      on ? "bg-accent-soft text-accent-strong" : "hover:bg-surface-muted",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded border text-xs font-bold",
                        on ? "border-accent bg-accent text-accent-fg" : "border-border",
                      )}
                    >
                      {on ? picked.indexOf(assessment.assignmentId) + 1 : ""}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{assessment.title}</span>
                      <span className="block truncate text-xs text-fg-muted">
                        {assessment.category ? `${assessment.category} · ` : ""}
                        {assessment.gradedCount} of {assessment.classSize} marked
                      </span>
                    </span>
                    {unmarked && (
                      <span
                        className="flex shrink-0 items-center gap-1 text-xs font-medium text-warn"
                        title="Nobody has a mark for this yet — it will be blank on every card"
                      >
                        <WarningIcon weight="bold" className="size-4" />
                        unmarked
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ---------------- 2. generate ---------------- */}
      <section className="border-t border-border pt-5">
        <h2 className="text-sm font-semibold text-fg">2. Generate the drafts</h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="min-w-[12rem] flex-1">
            <span className="block text-xs font-medium text-fg">What this report is called</span>
            <input
              type="text"
              value={title}
              maxLength={120}
              list="report-titles"
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-[--radius-md] border border-border bg-surface px-3 text-sm text-fg outline-none focus:border-accent"
            />
            <datalist id="report-titles">
              {existingTitles.map((existing) => (
                <option key={existing} value={existing} />
              ))}
            </datalist>
          </label>
          <Button
            loading={pending}
            disabled={picked.length === 0 || title.trim().length < 2}
            icon={<SparkleIcon weight="bold" />}
            onClick={build}
          >
            Generate for the class
          </Button>
        </div>
      </section>

      {/* ---------------- 3. review and publish ---------------- */}
      {cards.length > 0 && (
        <section className="border-t border-border pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-fg">
                3. Review and publish — {selectedTitle}
              </h2>
              <p className="mt-0.5 text-xs text-fg-muted">
                {drafts} draft{drafts === 1 ? "" : "s"}
                {published > 0 ? `, ${published} published` : ""}. Families see nothing until you
                publish.
              </p>
            </div>
            {drafts > 0 ? (
              <Button
                size="sm"
                loading={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await publish(classId, selectedTitle!);
                    if (!result.ok) {
                      toast({ tone: "danger", title: "Not published", description: result.error });
                      return;
                    }
                    toast({ tone: "ok", title: `${result.published} report cards sent out` });
                    router.refresh();
                  })
                }
              >
                Publish all {drafts}
              </Button>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                loading={pending}
                onClick={() =>
                  startTransition(async () => {
                    const result = await withdraw(classId, selectedTitle!);
                    if (!result.ok) {
                      toast({ tone: "danger", title: "Not withdrawn", description: result.error });
                      return;
                    }
                    toast({ tone: "warn", title: `${result.withdrawn ?? 0} withdrawn` });
                    router.refresh();
                  })
                }
              >
                Withdraw all
              </Button>
            )}
          </div>

          <ul className="mt-3 space-y-2">
            {cards.map((card) => (
              <li key={card.id} className="rounded-[--radius-md] border border-border p-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-fg">
                      {card.studentName}
                    </span>
                    <span className="block text-xs text-fg-muted">
                      {card.overallPercentMilli === null
                        ? "No marks yet"
                        : `${(card.overallPercentMilli / 1000).toFixed(1)}%`}
                      {card.attendanceTotal > 0
                        ? ` · ${card.attendancePresent}/${card.attendanceTotal} days`
                        : ""}
                    </span>
                  </span>
                  <Badge tone={card.status === "PUBLISHED" ? "ok" : "warn"} size="sm">
                    {card.status.toLowerCase()}
                  </Badge>
                  <Link
                    href={`/report-cards/${card.id}`}
                    className="flex items-center gap-1 text-xs font-semibold text-accent-strong hover:underline"
                  >
                    Preview <ArrowSquareOutIcon className="size-3.5" />
                  </Link>
                </div>

                {card.status === "DRAFT" && (
                  <label className="mt-2 block">
                    <span className="sr-only">Remark for {card.studentName}</span>
                    <textarea
                      rows={2}
                      maxLength={2000}
                      placeholder="A sentence for the family…"
                      defaultValue={card.remark ?? ""}
                      onChange={(e) =>
                        setRemarks((r) => ({ ...r, [card.id]: e.target.value }))
                      }
                      onBlur={() => {
                        const next = remarks[card.id];
                        if (next === undefined || next === (card.remark ?? "")) return;
                        startTransition(async () => {
                          const result = await saveRemark(classId, card.id, next);
                          if (!result.ok) {
                            toast({ tone: "danger", title: "Remark not saved", description: result.error });
                          }
                        });
                      }}
                      className="w-full rounded-[--radius-sm] border border-border bg-surface px-2.5 py-2 text-sm text-fg outline-none focus:border-accent"
                    />
                  </label>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
