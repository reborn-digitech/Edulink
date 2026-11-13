"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { PencilSimpleIcon, TrashIcon } from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { deleteQuestionAction } from "../../actions";
import type { BankQuestion } from "@/lib/app-admin";
import { useT } from "@/lib/i18n";

/**
 * One question in the bank list: stem, level, which languages it exists in,
 * and the edit/delete controls. Deleting asks first — it also removes any
 * child's recorded answers to this question, and the confirm says so.
 */
export function QuestionRow({
  topicId,
  question,
}: {
  topicId: string;
  question: BankQuestion;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!window.confirm(t("appadmin.deleteConfirm"))) return;
    startTransition(async () => {
      const result = await deleteQuestionAction(topicId, question.id);
      if (!result.ok) {
        toast({ tone: "danger", title: result.error ?? t("root.didNotWork") });
        return;
      }
      toast({ tone: "ok", title: t("appadmin.questionDeleted") });
      router.refresh();
    });
  }

  return (
    <li>
      <Card className="p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-relaxed text-fg">{question.stem}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge tone="accent" size="sm">
                {t("appadmin.levelN", { n: question.difficulty })}
              </Badge>
              {/* Language codes, not names: "EN · HI · MR" reads the same in
                  every dictionary and says exactly which rows exist. */}
              <span className="text-xs uppercase tracking-wide text-fg-muted">
                {["en", ...question.languages].join(" · ")}
              </span>
              {/* A native speaker has read the Hindi, the Marathi: translation-review.ts. */}
              {question.reviewed.hi && <Badge tone="ok" size="sm">{t("translationReview.reviewedHi")}</Badge>}
              {question.reviewed.mr && <Badge tone="ok" size="sm">{t("translationReview.reviewedMr")}</Badge>}
              {/* How it is doing, from the nightly bank:stats job; nothing until a child has answered it. */}
              {question.stats && question.stats.asked > 0 && (
                <span className="text-xs tabular-nums text-fg-muted" title={t("bankStats.columnTitle")}>
                  {t("bankStats.column", { asked: question.stats.asked, rate: question.stats.correctRate ?? 0, seconds: question.stats.avgSeconds ?? 0 })}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild size="sm" variant="secondary" icon={<PencilSimpleIcon weight="bold" />}>
              <Link href={`/appadmin/bank/${topicId}/${question.id}`}>{t("appadmin.edit")}</Link>
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon={<TrashIcon weight="bold" />}
              loading={pending}
              onClick={remove}
            >
              {t("practice.remove")}
            </Button>
          </div>
        </div>
      </Card>
    </li>
  );
}
