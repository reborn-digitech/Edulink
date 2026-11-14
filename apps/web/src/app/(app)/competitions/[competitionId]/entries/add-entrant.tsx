"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { UserPlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { addEntrantAction } from "../../actions";
import { fieldClass } from "@/components/ui/field-class";

/**
 * TA-104 (decision 0007 as amended 14 November 2026): the office or a teacher adds a pupil of the school as an
 * entrant, enrolment on or off — how "enrolment off means the office picks the entrants" is done. The list is the
 * roll inside the competition's classes, less whoever is already entered (entrantCandidates); the rules, the
 * consent and the audit row are addEntrant's.
 */
export function AddEntrant({ competitionId, candidates }: { competitionId: string; candidates: { studentMembershipId: string; name: string; className: string | null }[] }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [chosen, setChosen] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="space-y-2.5 rounded-[var(--radius-md)] border border-border bg-surface p-3.5"
      data-testid="add-entrant"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        const pupil = candidates.find((c) => c.studentMembershipId === chosen);
        if (!pupil) {
          setError(t("competitions.choosePupilToAdd"));
          return;
        }
        startTransition(async () => {
          const result = await addEntrantAction({ id: competitionId, studentMembershipId: pupil.studentMembershipId, name: pupil.name });
          if (!result.ok) {
            setError(result.error ?? t("competitions.didNotSave"));
            return;
          }
          toast({ tone: "ok", title: t("competitions.addEntrantTitle"), description: result.message });
          setChosen("");
          router.refresh();
        });
      }}
    >
      <p className="font-medium">{t("competitions.addEntrantTitle")}</p>
      <p className="text-sm text-fg-muted">{t("competitions.addEntrantHint")}</p>
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor={`add-entrant-${competitionId}`} className="block text-xs font-medium text-fg-muted">
            {t("competitions.addEntrantPupil")}
          </label>
          <select id={`add-entrant-${competitionId}`} value={chosen} onChange={(event) => setChosen(event.target.value)} className={fieldClass("mt-1")}>
            <option value="">{t("competitions.addEntrantChoose")}</option>
            {candidates.map((c) => (
              <option key={c.studentMembershipId} value={c.studentMembershipId}>
                {c.className ? `${c.name} · ${c.className}` : c.name}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" size="sm" variant="secondary" icon={<UserPlusIcon weight="bold" className="size-4" />} disabled={pending || !chosen}>
          {pending ? t("common.saving") : t("competitions.addEntrantButton")}
        </Button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
