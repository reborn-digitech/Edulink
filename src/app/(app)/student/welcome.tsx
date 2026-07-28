"use client";

import { useState } from "react";
import { CopyIcon, SparkleIcon, XIcon } from "@phosphor-icons/react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

/**
 * First-run welcome for a brand-new student.
 *
 * Its real job is the login handle. A child who joined with a code has no email
 * address, so this generated handle IS how they get back in — showing it once
 * and hoping is not good enough, so it is copyable and the copy explicitly says
 * to save it with a grown-up.
 */
export function StudentWelcome({ name, handle }: { name: string; handle: string | null }) {
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="relative overflow-hidden rounded-[--radius-lg] border border-accent/30 bg-accent-soft p-5 animate-pop">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Hide this message"
        className="absolute right-2 top-2 grid size-9 place-items-center rounded-full text-fg-muted hover:bg-surface/60 hover:text-fg"
      >
        <XIcon weight="bold" className="size-4" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-accent-fg animate-confetti">
          <SparkleIcon weight="fill" className="size-6" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-fg">You&rsquo;re in, {name}!</h2>
          <p className="mt-1 text-sm leading-relaxed text-fg-muted">
            This is your dashboard. Your work, your marks and your attendance all live here.
          </p>

          {handle && (
            <div className="mt-3 rounded-[--radius-md] border border-border bg-surface p-3.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
                Your login name — save this with a grown-up
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
                      toast({ tone: "ok", title: "Login name copied" });
                    } catch {
                      toast({
                        tone: "warn",
                        title: "Could not copy",
                        description: "Write it down instead.",
                      });
                    }
                  }}
                >
                  Copy
                </Button>
              </div>
              <p className="mt-1.5 text-xs text-fg-muted">
                Use this and your password to log back in.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
