"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckIcon } from "@phosphor-icons/react";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import type { ReviewLanguage } from "@/lib/translation-review";
import { reviewTranslationAction } from "../content-actions";

type Item = {
  id: string;
  topic: { id: string; name: string; subject: string; classLevel: number };
  difficulty: number;
  english: { stem: string; choices: string[]; solution: string };
  translation: { stem: string; choices: string[]; solution: string } | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
};

/**
 * One question's English beside its translation, editable, with one press
 * that saves the words and stamps the language read. A missing translation
 * is typed in here from blank; the choices are as many as the English, by
 * the shape rule that keeps the answer index honest.
 */
export function ReviewCard({ item, language }: { item: Item; language: ReviewLanguage }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const start = item.translation ?? { stem: "", choices: item.english.choices.map(() => ""), solution: "" };
  const [stem, setStem] = useState(start.stem);
  const [choices, setChoices] = useState<string[]>(item.english.choices.map((_, i) => start.choices[i] ?? ""));
  const [solution, setSolution] = useState(start.solution);
  const edited = stem !== start.stem || solution !== start.solution || choices.some((c, i) => c !== (start.choices[i] ?? ""));
  const reviewed = item.reviewedAt !== null;
  const typing = language;

  function save(mark: boolean) {
    startTransition(async () => {
      const result = await reviewTranslationAction(item.id, { language, reviewed: mark, ...(edited || !item.translation ? { text: { stem, choices, solution } } : {}) });
      if (!result.ok) {
        toast({ tone: "danger", title: result.error ?? t("root.didNotWork") });
        return;
      }
      toast({ tone: "ok", title: mark ? t("translationReview.marked") : t("translationReview.unmarked") });
      router.refresh();
    });
  }

  return (
    <li>
      <Card>
        <CardBody className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-fg-muted">
            <Link href={`/appadmin/bank/${item.topic.id}/${item.id}`} className="font-medium text-fg hover:underline">
              {item.topic.name}
            </Link>
            <span>{t("appadmin.classN", { n: item.topic.classLevel })}</span>
            <Badge tone="accent" size="sm">{t("appadmin.levelN", { n: item.difficulty })}</Badge>
            {reviewed && (
              <Badge tone="ok" size="sm">
                {item.reviewedBy ? t("translationReview.readBy", { name: item.reviewedBy }) : t("translationReview.statusReviewed")}
              </Badge>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-fg-muted">{t("gigs.english")}</p>
              <p className="font-medium text-fg">{item.english.stem}</p>
              <ol className="list-decimal space-y-0.5 pl-5 text-fg">
                {item.english.choices.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ol>
              <p className="text-fg-muted">{item.english.solution}</p>
            </div>
            <div className="space-y-2">
              <TextAreaField label={t("appadmin.stemLabel")} value={stem} rows={2} onChange={(e) => setStem(e.target.value)} data-typing={typing} />
              {choices.map((c, i) => (
                <TextField key={i} label={t("appadmin.choiceN", { n: i + 1 })} value={c} onChange={(e) => setChoices((list) => list.map((x, j) => (j === i ? e.target.value : x)))} data-typing={typing} />
              ))}
              <TextAreaField label={t("appadmin.solutionLabel")} value={solution} rows={3} onChange={(e) => setSolution(e.target.value)} data-typing={typing} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" icon={<CheckIcon weight="bold" />} loading={pending} onClick={() => save(true)}>
              {edited || !item.translation ? t("translationReview.saveAndMark") : t("translationReview.markRead")}
            </Button>
            {reviewed && (
              <Button size="sm" variant="ghost" loading={pending} onClick={() => save(false)}>
                {t("translationReview.unmark")}
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
    </li>
  );
}
