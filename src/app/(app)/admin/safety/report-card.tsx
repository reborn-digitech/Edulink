"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowSquareOutIcon, CheckIcon, TrashIcon, WarningIcon } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/cn";
import { relativeTime } from "@/lib/dates";
import { reasonLabel, type ReportGroup } from "@/lib/safety-labels";
import { dismiss, takeDown } from "./actions";
import { useLocale } from "@/lib/i18n";

const URGENT = new Set(["UNSAFE", "BULLYING"]);

export function ReportCard({ group, readOnly }: { group: ReportGroup; readOnly?: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [mode, setMode] = useState<null | "remove" | "dismiss">(null);
  const [note, setNote] = useState("");

  const urgent = group.reasons.some((r) => URGENT.has(r.reason));
  const removable = group.targetType !== "USER" && group.target.available;

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        toast({ tone: "danger", title: "Could not do that", description: result.error });
        return;
      }
      toast({ tone: "ok", title: success });
      setMode(null);
      setNote("");
      router.refresh();
    });
  }

  return (
    <article
      className={cn(
        "overflow-hidden rounded-[--radius-lg] border bg-surface shadow-sm",
        urgent && !readOnly ? "border-danger/50" : "border-border",
      )}
    >
      {/* ---- why it is here ---- */}
      <header
        className={cn(
          "flex flex-wrap items-center gap-2 px-4 py-2.5 text-xs font-semibold",
          urgent && !readOnly ? "bg-danger-soft text-danger" : "bg-surface-muted text-fg-muted",
        )}
      >
        {urgent && !readOnly && <WarningIcon weight="fill" className="size-4" />}
        <span>
          {group.count} report{group.count === 1 ? "" : "s"} ·{" "}
          {group.targetType === "POST" ? "a post" : group.targetType === "COMMENT" ? "a comment" : "a person"}
        </span>
        <span className="ml-auto font-normal">{relativeTime(group.latestAt, undefined, locale)}</span>
        {readOnly && (
          <Badge tone={group.status === "ACTIONED" ? "danger" : "neutral"} size="sm">
            {group.status === "ACTIONED" ? "Removed" : "Dismissed"}
          </Badge>
        )}
      </header>

      <div className="space-y-3 p-4">
        <ul className="flex flex-wrap gap-1.5">
          {group.reasons.map((reason) => (
            <li key={reason.reason}>
              <Badge tone={URGENT.has(reason.reason) ? "danger" : "neutral"} size="sm">
                {reasonLabel(reason.reason)}
                {reason.count > 1 ? ` ×${reason.count}` : ""}
              </Badge>
            </li>
          ))}
        </ul>

        {/* ---- the reported content itself ---- */}
        {group.target.available ? (
          <div className="rounded-[--radius-md] border border-border bg-surface-muted p-3.5">
            {group.target.kind === "POST" && (
              <>
                <p className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                  <span className="font-semibold text-fg">{group.target.authorName}</span>
                  {group.target.authorRole && (
                    <Badge tone="neutral" size="sm">
                      {group.target.authorRole.toLowerCase()}
                    </Badge>
                  )}
                  <span>· {relativeTime(group.target.createdAt, undefined, locale)}</span>
                  {group.target.status !== "APPROVED" && (
                    <Badge tone="warn" size="sm">
                      {group.target.status.toLowerCase()}
                    </Badge>
                  )}
                </p>
                <p className="mt-1.5 font-semibold text-fg">{group.target.title}</p>
                {group.target.body && (
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-fg-muted">
                    {group.target.body}
                  </p>
                )}
                <Link
                  href={group.target.href}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-strong hover:underline"
                >
                  Open it <ArrowSquareOutIcon className="size-3.5" />
                </Link>
              </>
            )}

            {group.target.kind === "COMMENT" && (
              <>
                <p className="text-xs text-fg-muted">
                  <span className="font-semibold text-fg">{group.target.authorName}</span> commented
                  on <span className="italic">{group.target.postTitle}</span> ·{" "}
                  {relativeTime(group.target.createdAt, undefined, locale)}
                  {group.target.status !== "APPROVED" && ` · ${group.target.status.toLowerCase()}`}
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-fg">
                  {group.target.body}
                </p>
                <Link
                  href={group.target.href}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-strong hover:underline"
                >
                  Open the post <ArrowSquareOutIcon className="size-3.5" />
                </Link>
              </>
            )}

            {group.target.kind === "USER" && (
              <>
                <p className="font-semibold text-fg">{group.target.name}</p>
                <p className="text-xs text-fg-muted">
                  {group.target.roles.map((r) => r.toLowerCase()).join(", ")}
                </p>
                {group.target.suspended ? (
                  <p className="mt-2 text-xs font-medium leading-relaxed text-warn">
                    Their access to this school is already paused.
                  </p>
                ) : (
                  <p className="mt-2 text-xs leading-relaxed text-fg-muted">
                    You can pause their access from the directory. It stops them opening this
                    school, deletes nothing, and is reversible in one click.
                  </p>
                )}
                {group.target.href && (
                  <Link
                    href={group.target.href}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-accent-strong hover:underline"
                  >
                    {group.target.suspended ? "Open in the directory" : "Pause their access"}{" "}
                    <ArrowSquareOutIcon className="size-3.5" />
                  </Link>
                )}
              </>
            )}
          </div>
        ) : (
          /* A dangling report must still be clearable. (§5) */
          <div className="rounded-[--radius-md] border border-dashed border-border p-3.5">
            <p className="text-sm font-medium text-fg-muted">This content is no longer available</p>
            <p className="mt-1 text-xs leading-relaxed text-fg-subtle">
              It may have been deleted since it was reported. You can still read the reports below
              and close this off.
            </p>
          </div>
        )}

        {/* ---- what the reporters said ---- */}
        <details className="rounded-[--radius-md] border border-border">
          <summary className="cursor-pointer px-3.5 py-2.5 text-sm font-medium text-fg">
            What {group.count === 1 ? "the reporter" : "reporters"} said
          </summary>
          <ul className="divide-y divide-border border-t border-border">
            {group.details.map((detail, index) => (
              <li key={index} className="px-3.5 py-2.5">
                <p className="text-xs text-fg-muted">
                  <span className="font-semibold text-fg">{detail.reporterName}</span> ·{" "}
                  {reasonLabel(detail.reason)} · {relativeTime(detail.at, undefined, locale)}
                </p>
                {detail.detail && (
                  <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-fg">
                    {detail.detail}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </details>

        {readOnly && group.resolutionNote && (
          <div className="rounded-[--radius-md] bg-surface-muted p-3.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
              What you decided
            </p>
            <p className="mt-1 text-sm text-fg">{group.resolutionNote}</p>
          </div>
        )}
      </div>

      {/* ---- actions ---- */}
      {!readOnly && (
        <footer className="border-t border-border p-3.5">
          {mode ? (
            <div className="space-y-2">
              <label htmlFor={`note-${group.targetId}`} className="block text-sm font-medium text-fg">
                {mode === "remove"
                  ? "Why is it coming down? The author sees this."
                  : "Why is this alright? Only staff see this."}
              </label>
              <textarea
                id={`note-${group.targetId}`}
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 500))}
                rows={2}
                autoFocus
                placeholder={
                  mode === "remove"
                    ? "This named another pupil. Please repost without their name."
                    : "Checked with the class teacher — this is a misunderstanding, no action needed."
                }
                className="w-full resize-y rounded-[--radius-md] border border-border bg-surface p-3 text-sm outline-none focus:border-accent"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  block
                  onClick={() => {
                    setMode(null);
                    setNote("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  block
                  variant={mode === "remove" ? "danger" : "primary"}
                  loading={pending}
                  disabled={note.trim().length === 0}
                  onClick={() =>
                    mode === "remove"
                      ? run(
                          () =>
                            takeDown({
                              targetType: group.targetType as "POST" | "COMMENT",
                              targetId: group.targetId,
                              note,
                            }),
                          "Taken down and the author told",
                        )
                      : run(
                          () =>
                            dismiss({
                              targetType: group.targetType,
                              targetId: group.targetId,
                              note,
                            }),
                          `${group.count} report${group.count === 1 ? "" : "s"} closed`,
                        )
                  }
                >
                  {mode === "remove" ? "Take it down" : "Close the reports"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="ghost"
                block
                disabled={pending}
                icon={<CheckIcon weight="bold" />}
                onClick={() => setMode("dismiss")}
              >
                Nothing wrong — close it
              </Button>
              {removable && (
                <Button
                  size="sm"
                  variant="danger"
                  block
                  disabled={pending}
                  icon={<TrashIcon weight="bold" />}
                  onClick={() => setMode("remove")}
                >
                  Take it down
                </Button>
              )}
            </div>
          )}
        </footer>
      )}
    </article>
  );
}
