"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { CopyIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { CheckboxField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { duplicateToSections } from "./actions";

export type SisterOption = { id: string; name: string };

/**
 * A week onto the sister sections — 5A's grid onto 5B and 5C. The sisters
 * are the living classes of the same grade; each is a checkbox, and a
 * confirm stands between the choice and the overwrite, because each chosen
 * section's week is replaced whole.
 */
export function CopySections({ classId, className, sisters }: { classId: string; className: string; sisters: SisterOption[] }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [chosen, setChosen] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (sisters.length === 0) return <p className="text-sm text-fg-muted">{t("officeBulk.copyNoSisters")}</p>;

  function toggle(id: string, on: boolean) {
    setConfirming(false);
    setChosen((c) => (on ? [...new Set([...c, id])] : c.filter((x) => x !== id)));
  }

  function copy() {
    setError(null);
    startTransition(async () => {
      const result = await duplicateToSections(classId, chosen);
      if (!result.ok) return setError(actionError(t, result, "timetable.couldNotCopyDay"));
      toast({ tone: "ok", title: t("officeBulk.copyDone", { count: result.copied ?? 0, classes: result.classes?.length ?? chosen.length }) });
      setChosen([]);
      setConfirming(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3" data-testid="copy-sections">
      {error && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium text-fg">{t("officeBulk.copyPick")}</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1.5">
          {sisters.map((s) => (
            <CheckboxField key={s.id} label={s.name} checked={chosen.includes(s.id)} onChange={(e) => toggle(s.id, e.target.checked)} />
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap items-center gap-2">
        {confirming ? (
          <>
            <Button variant="danger" loading={pending} onClick={copy} title={className}>
              {t("common.confirm")}
            </Button>
            <Button variant="ghost" onClick={() => setConfirming(false)} disabled={pending}>
              {t("common.cancel")}
            </Button>
          </>
        ) : (
          <Button variant="secondary" icon={<CopyIcon weight="bold" />} disabled={chosen.length === 0 || pending} onClick={() => setConfirming(true)}>
            {t("officeBulk.copyGo")}
          </Button>
        )}
      </div>
    </div>
  );
}
