"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { openRound } from "./actions";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { REVIEW_AUDIENCES, type ReviewAudience } from "@/lib/constants";
import type { TranslationKey } from "@/lib/i18n/dictionary";

const AUDIENCE_KEY: Record<ReviewAudience, TranslationKey> = {
  STUDENTS: "reviews.audienceStudents",
  PARENTS: "reviews.audienceParents",
  BOTH: "reviews.audienceBoth",
};

/**
 * The trigger: pick teachers, pick who is asked, pick the closing date. The
 * questionnaire itself is fixed — see REVIEW_QUESTIONS — so there is nothing
 * to compose here, which is what makes the answers comparable.
 */
export function OpenRoundForm({
  teachers,
  defaultCloseKey,
}: {
  teachers: { membershipId: string; name: string }[];
  /** Two weeks out, computed server-side in the school's timezone. */
  defaultCloseKey: string;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [chosen, setChosen] = useState<Set<string>>(new Set(teachers.map((x) => x.membershipId)));
  const [audience, setAudience] = useState<ReviewAudience>("STUDENTS");
  const [closes, setCloses] = useState(defaultCloseKey);
  const [error, setError] = useState<string | null>(null);

  const allChosen = chosen.size === teachers.length;

  function submit() {
    setError(null);
    startTransition(async () => {
      const result = await openRound({
        teacherMembershipIds: [...chosen],
        audience,
        closesDateKey: closes,
      });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgainMoment"));
        return;
      }
      toast({ tone: "ok", title: t("reviews.roundOpened") });
      router.refresh();
    });
  }

  return (
    <div className="rounded-[--radius-md] border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold text-fg">{t("reviews.openRound")}</h2>

      <fieldset className="mt-3">
        <legend className="flex w-full items-baseline justify-between text-xs font-medium text-fg">
          {t("reviews.chooseTeachers")}
          <button
            type="button"
            onClick={() =>
              setChosen(allChosen ? new Set() : new Set(teachers.map((x) => x.membershipId)))
            }
            className="text-xs font-semibold text-accent hover:underline"
          >
            {t("reviews.allTeachers")}
          </button>
        </legend>
        <ul className="mt-1.5 grid max-h-48 grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2">
          {teachers.map((teacher) => (
            <li key={teacher.membershipId}>
              <label className="flex min-h-9 cursor-pointer items-center gap-2 rounded-[--radius-sm] px-2 text-sm text-fg hover:bg-surface-muted">
                <input
                  type="checkbox"
                  checked={chosen.has(teacher.membershipId)}
                  onChange={(event) => {
                    const next = new Set(chosen);
                    if (event.target.checked) next.add(teacher.membershipId);
                    else next.delete(teacher.membershipId);
                    setChosen(next);
                  }}
                  className="size-4 accent-[--color-accent]"
                />
                <span className="truncate">{teacher.name}</span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="block text-xs font-medium text-fg">{t("reviews.audience")}</span>
          <select
            value={audience}
            onChange={(event) => setAudience(event.target.value as ReviewAudience)}
            className="mt-1 min-h-11 w-full rounded-[--radius-md] border border-border bg-surface px-3 text-sm text-fg outline-none focus:border-accent"
          >
            {REVIEW_AUDIENCES.map((option) => (
              <option key={option} value={option}>
                {t(AUDIENCE_KEY[option])}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs font-medium text-fg">{t("reviews.closesOn")}</span>
          <input
            type="date"
            value={closes}
            onChange={(event) => setCloses(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-[--radius-md] border border-border bg-surface px-3 text-sm text-fg outline-none focus:border-accent"
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-danger">
          {error}
        </p>
      )}

      <Button className="mt-3" size="sm" loading={pending} disabled={chosen.size === 0} onClick={submit}>
        {t("reviews.openRound")}
      </Button>
    </div>
  );
}
