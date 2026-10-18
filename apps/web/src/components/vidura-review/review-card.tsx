"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon, PencilSimpleIcon, XCircleIcon } from "@phosphor-icons/react";
import type { ViduraRendering } from "@edulink/contracts";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { reviewRenderingAction } from "./actions";

/**
 * One rendering of the guide beside its English (Vidura pass 2). The operator approves it, corrects it and saves (the
 * correction is approved with it) or rejects it; the content team reads the card and has no buttons.
 */
export function RenderingCard({ item, mayReview }: { item: ViduraRendering; mayReview: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState(item.text);
  const edited = text.trim() !== item.text;

  function act(action: "APPROVE" | "EDIT" | "REJECT") {
    startTransition(async () => {
      const result = await reviewRenderingAction(item.id, action, action === "EDIT" ? text : undefined);
      if (!result.ok) {
        toast({ tone: "danger", title: result.error ?? t("root.didNotWork") });
        return;
      }
      toast({ tone: "ok", title: t(action === "APPROVE" ? "viduraReview.approved" : action === "EDIT" ? "viduraReview.edited" : "viduraReview.rejected") });
      router.refresh();
    });
  }

  return (
    <li>
      <Card>
        <CardBody className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
            <Badge tone="outline" size="sm">{t(item.kind === "HEADING" ? "viduraReview.kindHeading" : "viduraReview.kindParagraph")}</Badge>
            <span className="break-all">{t("viduraReview.source", { file: item.sourceFile })}</span>
            {item.edited ? <Badge tone="accent" size="sm">{t("viduraReview.editedBadge")}</Badge> : null}
            {item.reviewedBy && item.status !== "UNREVIEWED" ? <Badge tone={item.status === "APPROVED" ? "ok" : "danger"} size="sm">{t("viduraReview.readBy", { name: item.reviewedBy })}</Badge> : null}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("viduraReview.english")}</p>
              <p className="whitespace-pre-wrap break-words text-fg" lang="en">{item.sourceText}</p>
            </div>
            <div className="space-y-2">
              {mayReview ? (
                <TextAreaField label={t("viduraReview.rendering")} value={text} rows={item.kind === "HEADING" ? 2 : 6} onChange={(e) => setText(e.target.value)} data-typing={item.language} lang={item.language} />
              ) : (
                <div className="space-y-1 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("viduraReview.rendering")}</p>
                  <p className="whitespace-pre-wrap break-words text-fg" lang={item.language}>{item.text}</p>
                </div>
              )}
              {item.edited ? (
                <details className="text-xs text-fg-muted">
                  <summary className="min-h-11 cursor-pointer py-2">{t("viduraReview.modelWords")}</summary>
                  <p className="whitespace-pre-wrap break-words" lang={item.language}>{item.modelText}</p>
                </details>
              ) : null}
            </div>
          </div>
          {mayReview ? (
            <div className="flex flex-wrap gap-2">
              {edited ? (
                <Button size="sm" icon={<PencilSimpleIcon weight="bold" />} loading={pending} onClick={() => act("EDIT")}>
                  {t("viduraReview.saveEdit")}
                </Button>
              ) : item.status !== "APPROVED" ? (
                <Button size="sm" icon={<CheckIcon weight="bold" />} loading={pending} onClick={() => act("APPROVE")}>
                  {t("viduraReview.approve")}
                </Button>
              ) : null}
              {item.status !== "REJECTED" ? (
                <Button size="sm" variant="ghost" icon={<XCircleIcon weight="bold" />} loading={pending} onClick={() => act("REJECT")}>
                  {t("viduraReview.reject")}
                </Button>
              ) : null}
            </div>
          ) : null}
        </CardBody>
      </Card>
    </li>
  );
}
