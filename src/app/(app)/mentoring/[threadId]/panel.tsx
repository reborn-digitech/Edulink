"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, XIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { ExpertThread, type ThreadMessage } from "@/components/expert-thread";
import { consent, close, say } from "../actions";
import { useT } from "@/lib/i18n";

/**
 * The mentoring thread and its controls.
 *
 * WHO SEES WHICH CONTROL is decided on the server and arrives as flags. The
 * guardian gets the consent button and the composer is simply absent for them —
 * they read and may end the mentorship, but a mentorship is a conversation
 * between two people that others can see, not a group chat.
 */
export function MentorPanel({
  threadId,
  messages,
  canPost,
  awaitingConsent,
  isGuardian,
  canClose,
}: {
  threadId: string;
  messages: ThreadMessage[];
  canPost: boolean;
  awaitingConsent: boolean;
  isGuardian: boolean;
  canClose: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function act(work: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await work();
      if (!result.ok) {
        setError(result.error ?? t("mentoring.couldNotDo"));
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {isGuardian && awaitingConsent && (
        <div className="space-y-2 rounded-[--radius-md] border border-warn/40 bg-warn-soft/30 p-3.5">
          <p className="text-sm font-medium text-fg">{t("mentoring.doYouAgree")}</p>
          <p className="text-xs text-fg-muted">{t("mentoring.canReadAndEnd")}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              loading={pending}
              icon={<CheckIcon weight="bold" className="size-4" />}
              onClick={() => act(() => consent(threadId))}
            >
              {t("mentoring.yesGoAhead")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              loading={pending}
              icon={<XIcon weight="bold" className="size-4" />}
              onClick={() => act(() => close(threadId))}
            >
              {t("mentoring.noEndIt")}
            </Button>
          </div>
        </div>
      )}

      <ExpertThread
        messages={messages}
        disabled={!canPost}
        onSend={(body) => say(threadId, body)}
      />

      {error && <p className="text-sm font-medium text-danger">{error}</p>}

      {canClose && !awaitingConsent && (
        <Button
          size="sm"
          variant="ghost"
          loading={pending}
          onClick={() => act(() => close(threadId))}
        >
          {t("mentoring.endThis")}
        </Button>
      )}
    </div>
  );
}
