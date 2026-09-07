"use client";

import { useState } from "react";
import { CheckCircleIcon, CopyIcon, XIcon } from "@phosphor-icons/react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n";

/**
 * One-time welcome shown straight after registration.
 *
 * Dismissible and never shown again for the session — a celebration that will
 * not go away stops being a celebration by the third visit. (§7 dismissible
 * first-time tours)
 */
export function WelcomeBanner({ schoolName, schoolCode }: { schoolName: string; schoolCode: string }) {
  const t = useT();
  const { toast } = useToast();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="relative overflow-hidden rounded-[--radius-lg] border border-accent/30 bg-accent-soft p-5 animate-pop">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label={t("admin.dismissWelcome")}
        className="absolute right-2 top-2 grid size-9 place-items-center rounded-full text-fg-muted hover:bg-surface/60 hover:text-fg"
      >
        <XIcon weight="bold" className="size-4" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ok text-white animate-confetti">
          <CheckCircleIcon weight="fill" className="size-7" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-fg">
            {t("admin.welcomeTitle", { name: schoolName })}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-fg-muted">{t("admin.welcomeBody")}</p>

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
                  toast({ tone: "ok", title: t("admin.codeCopied") });
                } catch {
                  toast({
                    tone: "warn",
                    title: t("admin.couldNotCopy"),
                    description: t("admin.selectToCopy"),
                  });
                }
              }}
            >
              {t("admin.copyCode")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
