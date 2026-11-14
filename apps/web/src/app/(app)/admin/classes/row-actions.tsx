"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { ArrowCounterClockwiseIcon, ArrowsClockwiseIcon, ArchiveIcon, CopyIcon, DotsThreeIcon } from "@phosphor-icons/react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { archiveClass, regenerateJoinCode, restoreClass } from "./actions";
import { cn } from "@/lib/cn";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { useModalFocus } from "@/components/ui/use-modal-focus";

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
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [code, setCode] = useState(joinCode);
  // The confirm opens as its menu item unmounts: focus goes into it, and back to the row's menu button (TA-232).
  const trigger = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);
  useModalFocus(confirming, confirmRef, () => setConfirming(false), trigger);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        toast({ tone: "danger", title: t("classes.didNotWork"), description: actionError(t, result) });
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
          ref={trigger}
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={t("classes.actionsFor", { name: className })}
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
              aria-label={t("classes.closeMenu")}
              className="fixed inset-0 z-30 cursor-default"
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-0 top-full z-40 mt-1 w-56 overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface py-1 shadow-lg animate-in-up">
              {!archived && (
                <>
                  <MenuItem
                    icon={<CopyIcon className="size-4" />}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(code);
                        toast({ tone: "ok", title: t("classes.classCodeCopied"), description: code });
                      } catch {
                        toast({ tone: "warn", title: t("classes.couldNotCopy"), description: code });
                      }
                      setOpen(false);
                    }}
                  >
                    {t("classes.copyJoinCode")}
                  </MenuItem>

                  <MenuItem
                    icon={<ArrowsClockwiseIcon className="size-4" />}
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        const result = await regenerateJoinCode(classId);
                        if (!result.ok) {
                          toast({
                            tone: "danger",
                            title: t("classes.couldNotRotate"),
                            description: actionError(t, result),
                          });
                          return;
                        }
                        setCode(result.joinCode!);
                        toast({
                          tone: "ok",
                          title: t("classes.newClassCode"),
                          description: t("classes.oldCodeDead", { code: result.joinCode! }),
                        });
                        setOpen(false);
                        router.refresh();
                      })
                    }
                  >
                    {t("classes.newJoinCode")}
                  </MenuItem>

                  <MenuItem
                    icon={<ArchiveIcon className="size-4" />}
                    tone="danger"
                    onClick={() => {
                      setOpen(false);
                      setConfirming(true);
                    }}
                  >
                    {t("classes.archiveClass")}
                  </MenuItem>
                </>
              )}

              {archived && (
                <MenuItem
                  icon={<ArrowCounterClockwiseIcon className="size-4" />}
                  disabled={pending}
                  onClick={() =>
                    run(() => restoreClass(classId), t("classes.restored", { name: className }))
                  }
                >
                  {t("classes.restoreClass")}
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
            ref={confirmRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="archive-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-[var(--radius-lg)] border border-border bg-surface p-5 shadow-lg animate-pop"
          >
            <h2 id="archive-title" className="text-lg font-bold text-fg">
              {t("classes.archiveTitle", { name: className })}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              {enrollmentCount > 0 ? (
                <>
                  <strong className="text-fg">
                    {enrollmentCount === 1
                      ? t("classes.archiveWarnOne")
                      : t("classes.archiveWarnMany", { count: enrollmentCount })}
                  </strong>{" "}
                  {t("classes.archiveWarnRest")}
                </>
              ) : (
                <>{t("classes.archiveWarnEmpty")}</>
              )}{" "}
              {t("classes.archiveKept")}{" "}
              <strong className="text-fg">{t("classes.archiveKeptWord")}</strong>
              {t("classes.archiveKeptRest")}
            </p>
            <div className="mt-5 flex gap-2">
              <Button variant="ghost" block onClick={() => setConfirming(false)}>
                {t("common.cancel")}
              </Button>
              <Button
                variant="danger"
                block
                loading={pending}
                onClick={() =>
                  run(() => archiveClass(classId), t("classes.archivedToast", { name: className }))
                }
              >
                {t("classes.archiveConfirm")}
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
        "flex min-h-11 w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm font-medium transition-colors disabled:opacity-50",
        tone === "danger" ? "text-danger hover:bg-danger-soft" : "text-fg hover:bg-surface-muted",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
