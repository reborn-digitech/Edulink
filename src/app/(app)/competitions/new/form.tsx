"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TrophyIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { CheckboxField, TextAreaField, TextField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { createCompetitionAction } from "../actions";

/**
 * Posting a competition.
 *
 * Saved as a DRAFT, and nothing on this form publishes. That is a separate press
 * on the competition's own page, because publishing puts it in front of every
 * child at every school on this installation and a half-typed title should not
 * get there by a stray Enter.
 */
export function NewCompetitionForm({ schoolName }: { schoolName: string }) {
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
          title: "Not saved",
          description: result.error ?? "Have a look at the highlighted fields.",
        });
        return;
      }
      toast({
        tone: "ok",
        title: "Saved as a draft",
        description: "Nobody else can see it until you publish it.",
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
        label="Title"
        name="title"
        required
        maxLength={140}
        error={errors.title}
        placeholder="Riverside Spelling Bee"
      />

      <TextField
        label="One line about it"
        name="summary"
        required
        maxLength={200}
        error={errors.summary}
        hint="This is what people read in the list."
        placeholder="Our own spelling bee, in the hall, on a Friday afternoon."
      />

      <TextAreaField
        label="The details"
        name="body"
        rows={5}
        maxLength={5000}
        error={errors.body}
        hint="Optional. Shown on the competition's own page."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField label="Subject" name="subject" maxLength={40} error={errors.subject} placeholder="English" />
        <TextField
          label="Lowest year group"
          name="gradeLow"
          maxLength={10}
          error={errors.gradeLow}
          placeholder="4"
        />
        <TextField
          label="Highest year group"
          name="gradeHigh"
          maxLength={10}
          error={errors.gradeHigh}
          placeholder="6"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <TextField
          label="Entries close"
          name="registrationClosesAt"
          type="date"
          error={errors.registrationClosesAt}
        />
        <TextField label="Starts" name="startsAt" type="date" error={errors.startsAt} />
        <TextField label="Ends" name="endsAt" type="date" error={errors.endsAt} />
      </div>

      <TextAreaField
        label="Who can enter"
        name="eligibility"
        rows={2}
        maxLength={1000}
        error={errors.eligibility}
        placeholder="Any pupil in Years 4 to 6."
      />
      <TextAreaField label="Rules" name="rules" rows={2} maxLength={2000} error={errors.rules} />
      <TextAreaField label="Prizes" name="prizes" rows={2} maxLength={1000} error={errors.prizes} />

      <TextField
        label="Organiser's own page"
        name="externalUrl"
        type="url"
        maxLength={500}
        error={errors.externalUrl}
        hint="Optional, and must start with https://"
        placeholder="https://example.org/…"
      />

      <CheckboxField
        name="requiresParentConsent"
        defaultChecked
        label="Ask a parent before a child takes part"
        description="Leave this on unless the whole thing happens inside school and no child's details leave the building."
        error={errors.requiresParentConsent}
      />

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button type="submit" icon={<TrophyIcon weight="bold" />} disabled={pending}>
          {pending ? "Saving…" : "Save as a draft"}
        </Button>
        <p className="text-sm text-fg-muted">
          Posted as {schoolName}. You publish it on the next screen.
        </p>
      </div>
    </form>
  );
}
