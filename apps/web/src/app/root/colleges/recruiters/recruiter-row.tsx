"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowCounterClockwiseIcon, ProhibitIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useLocale, useT } from "@/lib/i18n";
import { relativeTime } from "@/lib/dates";
import { setRecruiterStandingAction } from "../actions";

export type RecruiterView = { userId: string; name: string; email: string | null; companyName: string; createdAt: string; disabledAt: string | null; liveSessions: number };

/** One recruiter account: who, which company, live sessions, and the one switch — disabled across every college, or enabled again. */
export function RecruiterRow({ recruiter }: { recruiter: RecruiterView }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [busy, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const disabled = recruiter.disabledAt !== null;

  function act() {
    setError(null);
    let reason: string | undefined;
    if (!disabled) {
      if (!window.confirm(t("operatorCollege.disableConfirm", { name: recruiter.name, company: recruiter.companyName }))) return;
      reason = window.prompt(t("operatorCollege.reasonPrompt")) ?? undefined;
    }
    startTransition(async () => {
      const result = await setRecruiterStandingAction(recruiter.userId, { disabled: !disabled, reason });
      if (!result.ok) {
        setError(result.error ?? t("root.didNotWork"));
        return;
      }
      toast({ tone: "ok", title: disabled ? t("operatorCollege.enabledDone") : t("operatorCollege.disabledDone", { count: result.sessionsEnded ?? 0 }) });
      router.refresh();
    });
  }

  return (
    <div className="space-y-2 rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-semibold text-fg">{recruiter.companyName}</span>
        <span className="text-fg-muted">{recruiter.name}</span>
        {recruiter.email && <span className="truncate text-xs text-fg-muted">{recruiter.email}</span>}
        {disabled ? (
          <Badge size="sm" tone="danger">
            {t("operatorCollege.disabledBadge")}
          </Badge>
        ) : (
          <Badge size="sm" tone={recruiter.liveSessions > 0 ? "accent" : "neutral"}>
            {recruiter.liveSessions === 0 ? t("root.supportLiveSessionsNone") : recruiter.liveSessions === 1 ? t("root.supportLiveSessionsOne") : t("root.supportLiveSessionsMany", { count: recruiter.liveSessions })}
          </Badge>
        )}
        <span className="text-xs text-fg-subtle">{t("operatorCollege.registeredAgo", { when: relativeTime(new Date(recruiter.createdAt), new Date(), locale) })}</span>
      </div>
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <Button size="sm" variant={disabled ? "secondary" : "ghost"} icon={disabled ? <ArrowCounterClockwiseIcon weight="bold" /> : <ProhibitIcon weight="bold" />} loading={busy} onClick={act}>
        {disabled ? t("operatorCollege.enable") : t("operatorCollege.disable")}
      </Button>
    </div>
  );
}
