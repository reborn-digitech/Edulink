"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DUTIES, type DutyCode } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { setDutiesAction } from "./actions";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";

/**
 * The registrar's editor for a college teacher's duties (5 Oct 2026), opened
 * from the row's kebab on a FACULTY or HOD: the duties this college's streams
 * offer, a checkbox each with the sentence of what it opens. Saving sends the
 * whole list; the library refuses one the streams do not offer.
 */
export function DutiesPanel({ membershipId, name, initial, offered, onClose }: { membershipId: string; name: string; initial: DutyCode[]; offered: DutyCode[]; onClose: () => void }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [duties, setLocal] = useState<DutyCode[]>(initial);
  const [error, setError] = useState<string | null>(null);

  function toggle(duty: DutyCode, on: boolean) {
    const set = new Set(duties);
    if (on) set.add(duty);
    else set.delete(duty);
    setLocal(DUTIES.filter((d) => set.has(d)));
  }

  function save() {
    setError(null);
    startTransition(async () => {
      const result = await setDutiesAction(membershipId, duties);
      if (!result.ok) {
        setError(actionError(t, result, "people.didNotWork"));
        return;
      }
      toast({ tone: "ok", title: t("duties.saved") });
      onClose();
      router.refresh();
    });
  }

  return (
    <div className="w-full rounded-[var(--radius-md)] border border-border bg-surface-muted p-3">
      <p className="text-sm font-semibold text-fg">{t("duties.panelTitle", { name })}</p>
      <p className="mt-1 text-xs leading-relaxed text-fg-muted">{t("duties.panelHint")}</p>
      {offered.length === 0 ? (
        <p className="mt-2 text-xs text-fg-muted">{t("duties.noneOffered")}</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {offered.map((duty) => (
            <li key={duty}>
              <label className="flex cursor-pointer items-start gap-2.5 rounded-[var(--radius-sm)] bg-surface px-2.5 py-2">
                <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]" checked={duties.includes(duty)} onChange={(e) => toggle(duty, e.target.checked)} data-duty={duty} />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-fg">{t(`duties.${duty}.name`)}</span>
                  <span className="block text-xs leading-relaxed text-fg-muted">{t(`duties.${duty}.what`)}</span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs font-medium text-danger">
          {error}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <Button size="sm" loading={pending} onClick={save} disabled={offered.length === 0}>
          {t("common.save")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose}>
          {t("common.cancel")}
        </Button>
      </div>
    </div>
  );
}
