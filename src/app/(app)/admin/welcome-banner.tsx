"use client";

import { useState } from "react";
import { CheckCircleIcon, CopyIcon, XIcon } from "@phosphor-icons/react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

/**
 * One-time welcome shown straight after registration.
 *
 * Dismissible and never shown again for the session — a celebration that will
 * not go away stops being a celebration by the third visit. (§7 dismissible
 * first-time tours)
 */
export function WelcomeBanner({ schoolName, schoolCode }: { schoolName: string; schoolCode: string }) {
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="relative overflow-hidden rounded-[--radius-lg] border border-accent/30 bg-accent-soft p-5 animate-pop">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss welcome message"
        className="absolute right-2 top-2 grid size-9 place-items-center rounded-full text-fg-muted hover:bg-surface/60 hover:text-fg"
      >
        <XIcon weight="bold" className="size-4" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ok text-white animate-confetti">
          <CheckCircleIcon weight="fill" className="size-7" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-fg">Welcome to EduLink, {schoolName}</h2>
          <p className="mt-1 text-sm leading-relaxed text-fg-muted">
            Your school is live. Share this code with teachers and students so they can join — and
            work through the checklist below whenever you have a moment.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="rounded-[--radius-sm] border-2 border-dashed border-accent bg-surface px-3 py-2 text-base font-bold tracking-[0.12em] text-accent-strong">
              {schoolCode}
            </code>
            <Button
              variant="secondary"
              size="sm"
              icon={<CopyIcon weight="bold" />}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(schoolCode);
                  toast({ tone: "ok", title: "School code copied" });
                } catch {
                  toast({
                    tone: "warn",
                    title: "Could not copy automatically",
                    description: "Select the code above to copy it.",
                  });
                }
              }}
            >
              Copy code
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
