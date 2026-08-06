"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TrophyIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { CheckboxField, DateField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { createCompetitionAction } from "../actions";
import { useT } from "@/lib/i18n";

/**
 * Posting a competition.
 *
 * Saved as a DRAFT, and nothing on this form publishes. That is a separate press
 * on the competition's own page, because publishing puts it in front of every
 * child at every school on this installation and a half-typed title should not
 * get there by a stray Enter.
 */
export function NewCompetitionForm({ schoolName }: { schoolName: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * `onSubmit` with `preventDefault`, NOT `<form action={fn}>`.
   *
   * React resets an uncontrolled form once its action resolves. On the happy
   * path that is invisible, because we navigate away. On a REJECTED submission
   * it wipes everything the person typed and hands them back an empty form with
   * two red messages on it — which was the actual behaviour here until somebody
   * filled this in properly and got one date wrong.
   */
  function submit(formData: FormData) {
    setErrors({});
    startTransition(async () => {
      const result = await createCompetitionAction(Object.fromEntries(formData));
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast({
          tone: "danger",
          title: t("competitions.notSaved"),
          description: result.error ?? t("competitions.lookAtHighlighted"),
        });
        return;
      }
      toast({
        tone: "ok",
        title: t("competitions.savedDraft"),
        description: t("competitions.nobodySeesUntilPublish"),
      });
      router.push(`/competitions/${result.competitionId}`);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit(new FormData(event.currentTarget));
      }}
      className="space-y-4"
    >
      <TextField
        label={t("competitions.formTitle")}
        name="title"
        required
        maxLength={140}
        error={errors.title}
        placeholder={t("competitions.formTitlePlaceholder")}
      />

      <TextField
        label={t("competitions.oneLine")}
        name="summary"
        required
        maxLength={200}
        error={errors.summary}
        hint={t("competitions.oneLineHint")}
        placeholder={t("competitions.oneLinePlaceholder")}
      />

      <TextAreaField
        label={t("competitions.details")}
        name="body"
        rows={5}
        maxLength={5000}
        error={errors.body}
        hint={t("competitions.detailsHint")}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label={t("competitions.subject")} name="subject" maxLength={40} error={errors.subject} placeholder={t("competitions.subjectPlaceholder")} />
        <TextField
          label={t("competitions.lowestYear")}
          name="gradeLow"
          maxLength={10}
          error={errors.gradeLow}
          placeholder="4"
      />
        <TextField
          label={t("competitions.highestYear")}
          name="gradeHigh"
          maxLength={10}
          error={errors.gradeHigh}
          placeholder="6"
      />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <DateField
          label={t("competitions.entriesClose")}
          name="registrationClosesAt"
          error={errors.registrationClosesAt}
        />
        <DateField label={t("competitions.starts")} name="startsAt" error={errors.startsAt} />
        <DateField label={t("competitions.ends")} name="endsAt" error={errors.endsAt} />
      </div>

      <TextAreaField
        label={t("competitions.whoCanEnter")}
        name="eligibility"
        rows={2}
        maxLength={1000}
        error={errors.eligibility}
        placeholder={t("competitions.eligibilityPlaceholder")}
      />
      <TextAreaField label={t("competitions.rules")} name="rules" rows={2} maxLength={2000} error={errors.rules} />
      <TextAreaField label={t("competitions.prizes")} name="prizes" rows={2} maxLength={1000} error={errors.prizes} />

      <TextField
        label={t("competitions.organiserPage")}
        name="externalUrl"
        type="url"
        maxLength={500}
        error={errors.externalUrl}
        hint={t("competitions.externalUrlHint")}
        placeholder={t("competitions.exampleUrlPlaceholder")}
        />

      <CheckboxField
        name="requiresParentConsent"
        defaultChecked
        label={t("competitions.askParentFirst")}
        description={t("competitions.askParentHint")}
        error={errors.requiresParentConsent}
        />

      {/* Says exactly what crosses, because "leaderboard" on its own sounds
          like a list of names and an admin should not have to guess. */}
      <CheckboxField
        name="leaderboardEnabled"
        label={t("competitions.showBoard")}
        description={t("competitions.showBoardHint")}
        error={errors.leaderboardEnabled}
        />

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button type="submit" icon={<TrophyIcon weight="bold" />} disabled={pending}>
          {pending ? t("common.saving") : t("competitions.saveDraft")}
        </Button>
        <p className="text-sm text-fg-muted">
          {t("competitions.postedAs", { school: schoolName })}
        </p>
      </div>
    </form>
  );
}
