"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowCounterClockwiseIcon, ArrowsClockwiseIcon, ArchiveIcon, CopyIcon, DotsThreeIcon } from "@phosphor-icons/react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { archiveClass, regenerateJoinCode, restoreClass } from "./actions";
import { cn } from "@/lib/cn";

/**
 * Row-level class actions.
 *
 * Archiving is destructive-ish, so it gets an explicit confirmation naming what
 * happens to the data — not a generic "Are you sure?" (§9)
 */
export function ClassRowActions({
  classId,
  className,
  joinCode,
  archived,
  enrollmentCount,
}: {
  classId: string;
  className: string;
  joinCode: string;
  archived: boolean;
  enrollmentCount: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [code, setCode] = useState(joinCode);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        toast({ tone: "danger", title: "That did not work", description: result.error });
        return;
      }
      toast({ tone: "ok", title: success });
      setOpen(false);
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <>
      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={`Actions for ${className}`}
          aria-expanded={open}
          className="tap grid place-items-center rounded-full text-fg-muted hover:bg-surface-muted hover:text-fg"
        >
          <DotsThreeIcon weight="bold" className="size-5" />
        </button>

        {open && (
          <>
            {/* Click-away layer, so the menu cannot get stranded open. */}
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-30 cursor-default"
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-0 top-full z-40 mt-1 w-56 overflow-hidden rounded-[--radius-md] border border-border bg-surface py-1 shadow-lg animate-in-up">
              {!archived && (
                <>
                  <MenuItem
                    icon={<CopyIcon className="size-4" />}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(code);
                        toast({ tone: "ok", title: "Class code copied", description: code });
                      } catch {
                        toast({ tone: "warn", title: "Could not copy", description: code });
                      }
                      setOpen(false);
                    }}
                  >
                    Copy join code
                  </MenuItem>

                  <MenuItem
                    icon={<ArrowsClockwiseIcon className="size-4" />}
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await regenerateJoinCode(classId);
                        if (!result.ok) {
                          toast({ tone: "danger", title: "Could not rotate the code", description: result.error });
                          return;
                        }
                        setCode(result.joinCode!);
                        toast({
                          tone: "ok",
                          title: "New class code",
                          description: `${result.joinCode} — the old one no longer works.`,
                        });
                        setOpen(false);
                        router.refresh();
                      })
                    }
                  >
                    New join code
                  </MenuItem>

                  <MenuItem
                    icon={<ArchiveIcon className="size-4" />}
                    tone="danger"
                    onClick={() => {
                      setOpen(false);
                      setConfirming(true);
                    }}
                  >
                    Archive class
                  </MenuItem>
                </>
              )}

              {archived && (
                <MenuItem
                  icon={<ArrowCounterClockwiseIcon className="size-4" />}
                  disabled={pending}
                  onClick={() => run(() => restoreClass(classId), `${className} restored`)}
                >
                  Restore class
                </MenuItem>
              )}
            </div>
          </>
        )}
      </div>

      {confirming && (
        <div
          className="fixed inset-0 z-[75] grid place-items-center bg-black/45 p-4"
          onClick={() => setConfirming(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="archive-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-[--radius-lg] border border-border bg-surface p-5 shadow-lg animate-pop"
          >
            <h2 id="archive-title" className="text-lg font-bold text-fg">
              Archive {className}?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              {enrollmentCount > 0 ? (
                <>
                  <strong className="text-fg">{enrollmentCount} student
                  {enrollmentCount === 1 ? "" : "s"}</strong> will no longer see this class, and no
                  more registers can be taken for it.
                </>
              ) : (
                <>No more registers can be taken for this class.</>
              )}{" "}
              All attendance and grade history is <strong className="text-fg">kept</strong>, and you
              can restore it at any time.
            </p>
            <div className="mt-5 flex gap-2">
              <Button variant="ghost" block onClick={() => setConfirming(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                block
                loading={pending}
                onClick={() => run(() => archiveClass(classId), `${className} archived`)}
              >
                Archive
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MenuItem({
  children,
  icon,
  onClick,
  disabled,
  tone,
}: {
  children: React.ReactNode;
  icon: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tone?: "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium transition-colors disabled:opacity-50",
        tone === "danger" ? "text-danger hover:bg-danger-soft" : "text-fg hover:bg-surface-muted",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
