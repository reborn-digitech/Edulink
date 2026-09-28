"use client";

import { useState } from "react";
import { CopyIcon, SparkleIcon, XIcon } from "@phosphor-icons/react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";
import { dismissWelcome } from "./actions";

/**
 * First-run welcome for a brand-new student: shown until they put it away,
 * for the first fortnight after they were let in (lib/student-welcome.ts).
 *
 * Its real job is the login handle. A child who joined with a code has no email
 * address, so this generated handle IS how they get back in — showing it once
 * and hoping is not good enough, so it is copyable and the copy explicitly says
 * to save it with a grown-up.
 */
export function StudentWelcome({ name, handle }: { name: string; handle: string | null }) {
  const t = useT();
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="relative overflow-hidden rounded-[--radius-lg] border border-accent/30 bg-accent-soft p-5 animate-pop">
      <button
        type="button"
        onClick={() => {
          setDismissed(true);
          // Remembered on the account, so it stays away on the phone too.
          void dismissWelcome();
        }}
        aria-label={t("student.hideMessage")}
        className="absolute right-2 top-2 grid size-9 place-items-center rounded-full text-fg-muted hover:bg-surface/60 hover:text-fg"
      >
        <XIcon weight="bold" className="size-4" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-fg animate-confetti">
          <SparkleIcon weight="fill" className="size-6" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-fg">{t("student.youreInName", { name })}</h2>
          <p className="mt-1 text-sm leading-relaxed text-fg-muted">
            {t("student.welcomeBody")}
          </p>

          {handle && (
            <div className="mt-3 rounded-[--radius-md] border border-border bg-surface p-3.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                {t("student.saveLogin")}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <code className="flex-1 truncate font-mono text-sm font-bold text-fg">
                  {handle}
                </code>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<CopyIcon weight="bold" />}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(handle);
                      toast({ tone: "ok", title: t("student.copied") });
                    } catch {
                      toast({
                        tone: "warn",
                        title: t("student.couldNotCopy"),
                        description: t("student.writeItDown"),
                      });
                    }
                  }}
                >
                  {t("student.copy")}
                </Button>
              </div>
              <p className="mt-1.5 text-xs text-fg-muted">
                {t("student.useThis")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
