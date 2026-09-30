"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PaperPlaneTiltIcon, TranslateIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { CheckboxField, SelectField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { QuestionFields, compactDraft, emptyDraft, type QuestionDraft } from "@/components/gigs/question-fields";
import { useT } from "@/lib/i18n";
import { draftTranslationsAction, saveContributionAction, withdrawContributionAction } from "./actions";

/**
 * A teacher writes a question for the bank: the chapter, the level, and the
 * question in English, Hindi and Marathi. The Hindi and the Marathi can be
 * drafted from the English by the translator and are then the teacher's to
 * read and correct: what is sent is what the teacher leaves in the boxes.
 */
export function ContributionForm({ topics, draftOn, contributionId, initial }: { topics: { id: string; label: string; group: string }[]; draftOn: boolean; contributionId?: string; initial?: { topicId: string } & Partial<QuestionDraft> }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [drafting, startDraft] = useTransition();
  const [topicId, setTopicId] = useState(initial?.topicId ?? topics[0]?.id ?? "");
  const [draft, setDraft] = useState<QuestionDraft>(() => emptyDraft(initial));
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const groups = [...new Set(topics.map((topic) => topic.group))];

  const send = () => {
    setError(null);
    const compact = compactDraft(draft);
    if (!compact) return setError(t("appadmin.pickTheAnswer"));
    startTransition(async () => {
      const result = await saveContributionAction(contributionId ?? null, { topicId, ...compact, terms });
      if (!result.ok) return setError(result.error);
      toast({ tone: "ok", title: t("gigs.sent") });
      router.push("/teacher/contributions");
      router.refresh();
    });
  };
  const makeDraft = () => {
    setError(null);
    const compact = compactDraft(draft);
    if (!compact) return setError(t("appadmin.pickTheAnswer"));
    startDraft(async () => {
      const result = await draftTranslationsAction(compact.en);
      if (!result.ok) return setError(result.error);
      // Put into the rows the English occupies, so option for option they still line up.
      const rows = draft.en.choices.map((c, i) => (c.trim() ? i : -1)).filter((i) => i >= 0);
      const spread = (choices: string[]) => draft.en.choices.map((_, i) => (rows.includes(i) ? (choices[rows.indexOf(i)] ?? "") : ""));
      setDraft((d) => ({ ...d, hi: { stem: result.hi.stem, solution: result.hi.solution, choices: spread(result.hi.choices) }, mr: { stem: result.mr.stem, solution: result.mr.solution, choices: spread(result.mr.choices) } }));
      toast({ tone: "ok", title: t("gigs.draftDone") });
    });
  };
  const withdraw = () => {
    if (!contributionId) return;
    startTransition(async () => {
      const result = await withdrawContributionAction(contributionId);
      if (!result.ok) return setError(result.error);
      toast({ tone: "ok", title: t("gigs.withdrawn") });
      router.push("/teacher/contributions");
      router.refresh();
    });
  };

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
      className="space-y-5"
      data-testid="gig-form"
    >
      {error && (
        <p role="alert" className="rounded-[--radius-md] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger" data-testid="gig-error">
          {error}
        </p>
      )}
      <SelectField label={t("gigs.topic")} value={topicId} onChange={(e) => setTopicId(e.target.value)} className="max-w-xl" data-testid="gig-topic">
        {groups.map((group) => (
          <optgroup key={group} label={group}>
            {topics
              .filter((topic) => topic.group === group)
              .map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.label}
                </option>
              ))}
          </optgroup>
        ))}
      </SelectField>
      <QuestionFields value={draft} onChange={setDraft} />
      {draftOn && (
        <Button type="button" variant="secondary" onClick={makeDraft} disabled={drafting || pending} data-testid="gig-draft">
          <TranslateIcon weight="bold" className="size-4" aria-hidden="true" />
          {drafting ? t("gigs.drafting") : t("gigs.draftButton")}
        </Button>
      )}
      <CheckboxField label={t("gigs.terms")} checked={terms} onChange={(e) => setTerms(e.target.checked)} data-testid="gig-terms" />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending || drafting} data-testid="gig-send">
          <PaperPlaneTiltIcon weight="bold" className="size-4" aria-hidden="true" />
          {pending ? t("common.saving") : contributionId ? t("gigs.sendAgain") : t("gigs.send")}
        </Button>
        {contributionId && (
          <Button type="button" variant="ghost" onClick={withdraw} disabled={pending || drafting} data-testid="gig-withdraw">
            {t("gigs.withdraw")}
          </Button>
        )}
      </div>
    </form>
  );
}
