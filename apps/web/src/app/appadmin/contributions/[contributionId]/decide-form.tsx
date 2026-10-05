"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowUUpLeftIcon, CheckCircleIcon, XCircleIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { CheckboxField, TextAreaField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { QuestionFields, compactDraft, emptyDraft, type QuestionDraft } from "@/components/gigs/question-fields";
import { useT } from "@/lib/i18n";
import { decideContributionAction } from "../actions";

/**
 * What the content team does with a teacher's question: add it to the bank,
 * as written or with small corrections of its own, return it with a note, or
 * reject it with a reason. Adding is refused by the server when the teacher's
 * month or the month's budget is used up, and says so here.
 */
export function DecideForm({ contributionId, topicId, initial, canAdd }: { contributionId: string; topicId: string; initial: QuestionDraft; canAdd: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState("");
  const [correcting, setCorrecting] = useState(false);
  const [draft, setDraft] = useState<QuestionDraft>(() => emptyDraft(initial));
  const [error, setError] = useState<string | null>(null);

  const decide = (decision: "ACCEPT" | "RETURN" | "REJECT") => {
    setError(null);
    const compact = decision === "ACCEPT" && correcting ? compactDraft(draft) : undefined;
    if (compact === null) return setError(t("appadmin.pickTheAnswer"));
    startTransition(async () => {
      const result = await decideContributionAction(contributionId, { decision, note, edit: compact ? { topicId, ...compact } : undefined });
      if (!result.ok) return setError(result.error);
      toast({ tone: "ok", title: t("gigs.decided") });
      router.push("/appadmin/contributions");
      router.refresh();
    });
  };

  return (
    <div className="space-y-4" data-testid="gig-decide">
      {error && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-medium text-danger" data-testid="gig-decide-error">
          {error}
        </p>
      )}
      <CheckboxField label={t("gigs.correct")} checked={correcting} onChange={(e) => setCorrecting(e.target.checked)} data-testid="gig-correct" />
      {correcting && <QuestionFields value={draft} onChange={setDraft} disabled={pending} />}
      <TextAreaField label={t("gigs.noteLabel")} hint={t("gigs.noteHint")} rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} data-testid="gig-note-input" />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => decide("ACCEPT")} disabled={pending || !canAdd} data-testid="gig-add">
          <CheckCircleIcon weight="bold" className="size-4" aria-hidden="true" />
          {correcting ? t("gigs.addCorrected") : t("gigs.addToBank")}
        </Button>
        <Button type="button" variant="secondary" onClick={() => decide("RETURN")} disabled={pending} data-testid="gig-return">
          <ArrowUUpLeftIcon weight="bold" className="size-4" aria-hidden="true" />
          {t("gigs.returnIt")}
        </Button>
        <Button type="button" variant="ghost" onClick={() => decide("REJECT")} disabled={pending} data-testid="gig-reject">
          <XCircleIcon weight="bold" className="size-4" aria-hidden="true" />
          {t("gigs.rejectIt")}
        </Button>
      </div>
    </div>
  );
}
