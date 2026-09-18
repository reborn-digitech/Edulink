"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { TrophyIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { CheckboxField, DateField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { createPlatformCompetitionAction } from "../actions";
import { useT } from "@/lib/i18n";

/**
 * Posting a competition for every school on the installation.
 *
 * Saved as a DRAFT, exactly as the school form is — publishing is a separate
 * press on the dashboard, because a half-typed title should not reach every
 * child on the server by a stray Enter.
 */
export function PlatformCompetitionForm() {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  function submit(formData: FormData) {
    startTransition(async () => {
      const result = await createPlatformCompetitionAction(Object.fromEntries(formData));
      if (!result.ok) {
        toast({ tone: "danger", title: result.error ?? t("root.didNotWork") });
        return;
      }
      toast({
        tone: "ok",
        title: t("competitions.savedDraft"),
        description: t("competitions.nobodySeesUntilPublish"),
      });
      router.push("/appadmin");
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
      <TextField label={t("competitions.formTitle")} name="title" required maxLength={140} />
      <TextField
        label={t("competitions.oneLine")}
        name="summary"
        required
        maxLength={200}
        hint={t("competitions.oneLineHint")}
      />
      <TextAreaField label={t("competitions.details")} name="body" rows={5} maxLength={5000} />

      <TextField
        label={t("appadmin.organiserName")}
        name="organizerName"
        maxLength={120}
        hint={t("appadmin.organiserHint")}
        placeholder="Relay"
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label={t("competitions.subject")} name="subject" maxLength={40} />
        <TextField label={t("competitions.lowestYear")} name="gradeLow" maxLength={10} placeholder="4" />
        <TextField label={t("competitions.highestYear")} name="gradeHigh" maxLength={10} placeholder="6" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <DateField label={t("competitions.entriesClose")} name="registrationClosesAt" />
        <DateField label={t("competitions.starts")} name="startsAt" />
        <DateField label={t("competitions.ends")} name="endsAt" />
      </div>

      <TextAreaField label={t("competitions.whoCanEnter")} name="eligibility" rows={2} maxLength={1000} />
      <TextAreaField label={t("competitions.rules")} name="rules" rows={2} maxLength={2000} />
      <TextAreaField label={t("competitions.prizes")} name="prizes" rows={2} maxLength={1000} />

      <TextField
        label={t("competitions.organiserPage")}
        name="externalUrl"
        type="url"
        maxLength={500}
        hint={t("competitions.externalUrlHint")}
      />

      <CheckboxField
        name="requiresParentConsent"
        defaultChecked
        label={t("competitions.askParentFirst")}
        description={t("competitions.askParentHint")}
      />
      <CheckboxField
        name="leaderboardEnabled"
        label={t("competitions.showBoard")}
        description={t("competitions.showBoardHint")}
      />

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button type="submit" icon={<TrophyIcon weight="bold" />} disabled={pending}>
          {pending ? t("common.saving") : t("competitions.saveDraft")}
        </Button>
        <p className="text-sm text-fg-muted">{t("appadmin.everySchoolSees")}</p>
      </div>
    </form>
  );
}
