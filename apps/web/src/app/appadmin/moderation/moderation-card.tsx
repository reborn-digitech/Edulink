"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowCounterClockwiseIcon, ProhibitIcon } from "@phosphor-icons/react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useLocale, useT } from "@/lib/i18n";
import { platformRestoreAction, platformTakedownAction } from "../content-actions";

type Item = {
  postId: string;
  title: string;
  excerpt: string;
  category: string;
  schoolName: string;
  authorName: string;
  createdAt: string;
  commentCount: number;
  status: "APPROVED" | "TAKEN_DOWN" | "RESTORED";
  takedown: { reason: string; at: string; by: string; restoredAt: string | null; restoredBy: string | null } | null;
};

/** One global post with the school that published it, and the one act the platform takes on it — asked twice, with a reason the school reads. */
export function ModerationCard({ item }: { item: Item }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const { toast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const when = (iso: string) => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

  function takeDown() {
    startTransition(async () => {
      const result = await platformTakedownAction(item.postId, reason);
      if (!result.ok) {
        toast({ tone: "danger", title: result.error ?? t("root.didNotWork") });
        return;
      }
      toast({ tone: "ok", title: t("moderation.takenDown") });
      setConfirming(false);
      router.refresh();
    });
  }

  function restore() {
    startTransition(async () => {
      const result = await platformRestoreAction(item.postId);
      if (!result.ok) {
        toast({ tone: "danger", title: result.error ?? t("root.didNotWork") });
        return;
      }
      toast({ tone: "ok", title: t("moderation.restored") });
      router.refresh();
    });
  }

  return (
    <li>
      <Card>
        <CardBody className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-fg">{item.title}</p>
              <p className="mt-0.5 text-xs text-fg-muted">
                {[item.schoolName || t("moderation.schoolGone"), item.authorName, when(item.createdAt), item.status === "APPROVED" ? t("moderation.commentCount", { count: item.commentCount }) : null].filter(Boolean).join(" · ")}
              </p>
              {item.excerpt && <p className="mt-2 text-sm text-fg">{item.excerpt}</p>}
            </div>
            <Badge tone={item.status === "APPROVED" ? "ok" : item.status === "TAKEN_DOWN" ? "danger" : "neutral"} size="sm">
              {item.status === "APPROVED" ? t("moderation.statusLive") : item.status === "TAKEN_DOWN" ? t("moderation.statusTakenDown") : t("moderation.statusRestored")}
            </Badge>
          </div>
          {item.takedown && (
            <p className="text-sm text-fg-muted">
              {t("moderation.takedownNote", { by: item.takedown.by, when: when(item.takedown.at), reason: item.takedown.reason })}
              {item.takedown.restoredAt && ` ${t("moderation.restoredNote", { by: item.takedown.restoredBy ?? "", when: when(item.takedown.restoredAt) })}`}
            </p>
          )}
          {item.status === "APPROVED" &&
            (confirming ? (
              <div className="space-y-2">
                <TextAreaField label={t("moderation.reasonLabel")} hint={t("moderation.reasonHint")} value={reason} rows={2} maxLength={500} onChange={(e) => setReason(e.target.value)} />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="danger" icon={<ProhibitIcon weight="bold" />} loading={pending} disabled={reason.trim().length < 3} onClick={takeDown}>
                    {t("moderation.confirmTakeDown")}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="secondary" icon={<ProhibitIcon weight="bold" />} onClick={() => setConfirming(true)}>
                {t("moderation.takeDown")}
              </Button>
            ))}
          {item.status === "TAKEN_DOWN" && (
            <Button size="sm" variant="secondary" icon={<ArrowCounterClockwiseIcon weight="bold" />} loading={pending} onClick={restore}>
              {t("moderation.restore")}
            </Button>
          )}
        </CardBody>
      </Card>
    </li>
  );
}
