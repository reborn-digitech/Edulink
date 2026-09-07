"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { reviewAllFrom } from "./actions";
import { useT } from "@/lib/i18n";

/**
 * The flood control. Rendered on the review tab, admin only, and only for an
 * author with several posts waiting — the shape spam has. One decision covers
 * everything they have queued; rejection asks for the one reason that will be
 * written on every post.
 */
export function BulkReview({
  authors,
}: {
  authors: { authorUserId: string; name: string; count: number }[];
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const heavy = authors.filter((a) => a.count >= 3);
  if (heavy.length === 0) return null;

  const run = (authorUserId: string, decision: "APPROVE" | "REJECT") =>
    startTransition(async () => {
      const result = await reviewAllFrom(authorUserId, decision, decision === "REJECT" ? reason : undefined);
      if (!result.ok) {
        toast({ tone: "danger", title: result.error ?? t("common.somethingWrong") });
        return;
      }
      toast({
        tone: "ok",
        title:
          decision === "APPROVE"
            ? t("bulletin.bulkApproved", { count: result.decided ?? 0 })
            : t("bulletin.bulkRejected", { count: result.decided ?? 0 }),
      });
      setRejecting(null);
      setReason("");
      router.refresh();
    });

  return (
    <Card>
      <CardBody className="space-y-2 py-3">
        <p className="text-sm font-semibold text-fg">{t("bulletin.bulkTitle")}</p>
        <ul className="space-y-2">
          {heavy.map((author) => (
            <li key={author.authorUserId} className="space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-medium text-fg">{author.name}</span>
                <span className="text-fg-muted">
                  {t("bulletin.bulkWaiting", { count: author.count })}
                </span>
                <span className="ml-auto flex gap-1.5">
                  <Button size="sm" variant="secondary" loading={pending} onClick={() => run(author.authorUserId, "APPROVE")}>
                    {t("bulletin.bulkApproveCta", { count: author.count })}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setRejecting(rejecting === author.authorUserId ? null : author.authorUserId)}>
                    {t("bulletin.bulkRejectCta", { count: author.count })}
                  </Button>
                </span>
              </div>
              {rejecting === author.authorUserId && (
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder={t("bulletin.bulkReasonPlaceholder")}
                    className="min-w-64 flex-1 rounded-[--radius-md] border border-border bg-surface px-3 py-1.5 text-sm text-fg"
                  />
                  <Button size="sm" variant="danger" loading={pending} disabled={reason.trim().length < 3} onClick={() => run(author.authorUserId, "REJECT")}>
                    {t("bulletin.bulkRejectCta", { count: author.count })}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}
