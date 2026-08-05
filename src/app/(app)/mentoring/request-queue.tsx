"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { SealCheckIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { relativeTime } from "@/lib/dates";
import { decideRequest } from "./actions";
import type { PendingRequest } from "@/lib/mentoring";
import { useLocale } from "@/lib/i18n";

/**
 * The school answering.
 *
 * BOTH ANSWERS ARE REAL ANSWERS. Declining asks for a reason and sends it to the
 * pupil, because a child's request that simply never becomes anything is the
 * worst version of this feature — worse than a no, which at least tells them
 * where they stand.
 */
export function RequestQueue({ requests }: { requests: PendingRequest[] }) {
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (requests.length === 0) return null;

  function decide(threadId: string, approve: boolean, reason?: string) {
    setError(null);
    startTransition(async () => {
      const result = await decideRequest(threadId, { approve, reason });
      if (!result.ok) {
        setError(result.error ?? "That did not work.");
        return;
      }
      toast({ tone: "ok", title: approve ? "Sent to the family" : "The pupil has been told" });
      router.refresh();
    });
  }

  return (
    <Card className="border-warn/40">
      <CardHeader
        title={`${requests.length} pupil${requests.length === 1 ? "" : "s"} asking for a mentor`}
        description="Your decision comes first. A guardian is asked only if you agree."
      />
      <CardBody className="space-y-3">
        {error && (
          <p role="alert" className="text-sm font-medium text-danger">
            {error}
          </p>
        )}
        {requests.map((request) => (
          <div
            key={request.threadId}
            className="rounded-[--radius-md] border border-border bg-surface p-4"
          >
            <p className="text-sm font-semibold text-fg">
              {request.studentName} → {request.expertName}
              {request.expertVerified && (
                <Badge tone="ok" size="sm" className="ml-2">
                  <SealCheckIcon weight="fill" className="mr-1 inline size-3" />
                  Checked
                </Badge>
              )}
            </p>
            <p className="mt-0.5 text-xs text-fg-muted">
              {request.expertHeadline} · asked {relativeTime(request.askedAt, undefined, locale)}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-fg">“{request.purpose}”</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" loading={pending} onClick={() => decide(request.threadId, true)}>
                Agree, and ask the family
              </Button>
              <Button
                size="sm"
                variant="secondary"
                loading={pending}
                onClick={() => {
                  const reason = window.prompt(
                    `Why not? ${request.studentName} will read this.`,
                  );
                  if (reason === null) return;
                  decide(request.threadId, false, reason);
                }}
              >
                No, and tell them why
              </Button>
            </div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
