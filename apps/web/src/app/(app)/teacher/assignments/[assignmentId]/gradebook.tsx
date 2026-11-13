"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import {
  CheckCircleIcon,
  FloppyDiskIcon,
  ImagesIcon,
  MagnifyingGlassIcon,
  NoteIcon,
} from "@phosphor-icons/react";
import { AttachmentList } from "@/components/attachment-list";
import type { Attachment } from "@/lib/json";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatTile } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/states";
import { fromMilli } from "@/lib/validation";
import { cn } from "@/lib/cn";
import { submitGrades, type GradeSaveState } from "../actions";
import { useT } from "@/lib/i18n";
import { fieldClass } from "@/components/ui/field-class";

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
  /** The hand-in itself — words and photographs — once it has been handed in. */
  work: { submissionId: string; body: string; attachments: Attachment[] } | null;
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
  saveAction = submitGrades,
}: {
  assignmentId: string;
  maxMilli: number | null;
  rows: GradeRow[];
  stats: { total: number; submitted: number; graded: number; averagePercent: number | null };
  /** The server action that saves the batch: the school's, or a college offering's (R-48, /faculty/work). */
  saveAction?: (input: unknown) => Promise<GradeSaveState>;
}) {
  const t = useT();
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
  const [openWork, setOpenWork] = useState<string | null>(null);

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
        title: t("teacher.checkMarks"),
        description:
          invalid.length === 1
            ? t("teacher.invalidMarkOne")
            : t("teacher.invalidMarkMany", { count: invalid.length }),
      });
      return;
    }

    startTransition(async () => {
      const result = await saveAction({
        assignmentId,
        grades: dirtyIds.map((id) => ({
          studentMembershipId: id,
          score: drafts[id]!.score.trim() === "" ? null : Number(drafts[id]!.score),
          comment: drafts[id]!.comment.trim() || undefined,
        })),
      });

      if (!result.ok) {
        toast({ tone: "danger", title: t("teacher.notSaved"), description: result.error });
        return;
      }

      toast({
        tone: "ok",
        title: t("teacher.marksSaved", { count: result.saved ?? 0 }),
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
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={t("teacher.students")} value={stats.total} />
        <StatTile
          label={t("teacher.handedIn")}
          value={stats.submitted}
          tone={stats.submitted === stats.total ? "ok" : "neutral"}
          hint={t("teacher.outstanding", { count: stats.total - stats.submitted })}
        />
        <StatTile
          label={t("teacher.marked")}
          value={stats.graded}
          tone={stats.graded === stats.total ? "ok" : "warn"}
          hint={t("teacher.toGoCount", { count: stats.total - stats.graded })}
        />
        <StatTile
          label={t("teacher.classAverage")}
          value={stats.averagePercent === null ? "—" : `${stats.averagePercent}%`}
          hint={stats.graded === 0 ? t("teacher.nothingMarkedYet") : t("teacher.acrossMarked", { count: stats.graded })}
        />
      </div>

      <label className="relative block">
        <span className="sr-only">{t("teacher.searchClass")}</span>
        <MagnifyingGlassIcon
          className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-fg-subtle"
          aria-hidden="true"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("teacher.findStudent")}
          className={fieldClass("pl-11")}
        />
      </label>

      {filtered.length === 0 ? (
        <EmptyState
          title={query ? t("teacher.nobodyMatches", { query }) : t("teacher.nobodyInClass")}
          description={query ? t("teacher.clearSearchSeeEveryone") : t("teacher.addStudentsToClass")}
          action={
            query ? (
              <Button variant="secondary" onClick={() => setQuery("")}>
                {t("teacher.clearSearch")}
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
                    "rounded-[var(--radius-lg)] border bg-surface p-2.5 pl-3 transition-colors",
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
                            <span className="text-warn">{t("teacher.handedInLate")}</span>
                          ) : (
                            t("teacher.handedIn")
                          )
                        ) : (
                          <span className="text-fg-subtle">{t("teacher.notHandedIn")}</span>
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

                    {row.work && (
                      <button
                        type="button"
                        onClick={() => setOpenWork((w) => (w === row.membershipId ? null : row.membershipId))}
                        aria-label={openWork === row.membershipId ? t("teacher.hideWork", { name: row.name }) : t("teacher.seeWork", { name: row.name })}
                        aria-expanded={openWork === row.membershipId}
                        className={cn(
                          "tap grid shrink-0 place-items-center rounded-[var(--radius-sm)]",
                          row.work.attachments.length > 0 ? "text-accent-strong" : "text-fg-subtle hover:text-fg",
                        )}
                      >
                        <ImagesIcon weight={row.work.attachments.length > 0 ? "fill" : "regular"} className="size-5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        setOpenComment((c) => (c === row.membershipId ? null : row.membershipId))
                      }
                      aria-label={
                        draft.comment
                          ? t("teacher.editCommentFor", { name: row.name })
                          : t("teacher.addCommentFor", { name: row.name })
                      }
                      aria-expanded={openComment === row.membershipId}
                      className={cn(
                        "tap grid shrink-0 place-items-center rounded-[var(--radius-sm)]",
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
                        aria-label={t("teacher.markFor", { name: row.name })}
                        aria-invalid={isInvalid || undefined}
                        placeholder="—"
                        className={fieldClass(
                          cn("w-16 px-1 text-center text-base font-bold tabular-nums", isInvalid && "text-danger"),
                          isInvalid,
                        )}
                      />
                      {maxPoints !== null && (
                        <span className="text-sm text-fg-muted">/{maxPoints}</span>
                      )}
                    </div>
                  </div>

                  {openWork === row.membershipId && row.work && (
                    <div className="mt-2.5 border-t border-border pt-2.5">
                      {row.work.body ? (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-fg">{row.work.body}</p>
                      ) : (
                        <p className="text-xs text-fg-muted">{t("teacher.noWords")}</p>
                      )}
                      {row.work.attachments.length > 0 && (
                        <AttachmentList
                          className="mt-2"
                          target="submission"
                          assignmentId={assignmentId}
                          recordId={row.work.submissionId}
                          attachments={row.work.attachments}
                          canEdit={false}
                        />
                      )}
                    </div>
                  )}

                  {openComment === row.membershipId && (
                    <div className="mt-2.5 border-t border-border pt-2.5">
                      <label htmlFor={`comment-${row.membershipId}`} className="sr-only">
                        {t("teacher.commentForName", { name: row.name })}
                      </label>
                      <textarea
                        id={`comment-${row.membershipId}`}
                        value={draft.comment}
                        onChange={(e) =>
                          setDraft(row.membershipId, { comment: e.target.value.slice(0, 4000) })
                        }
                        rows={2}
                        autoFocus
                        placeholder={t("teacher.commentPlaceholder")}
                        className={fieldClass("resize-y")}
                      />
                      <p className="mt-1 text-xs text-fg-muted">
                        {t("teacher.familySeesThis")}
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
        <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] z-30 flex items-center gap-3 rounded-[var(--radius-lg)] border border-accent bg-surface p-3 shadow-lg lg:bottom-4">
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
            {t("teacher.saveMarks")}
          </Button>
        </div>
      )}
    </div>
  );
}
