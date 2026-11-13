"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { LockSimpleIcon, PlusIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { TextAreaField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";
import { addIncidentNoteAction, closeIncidentAction } from "../actions";

/**
 * The two things that can still happen to an open incident: a follow-up
 * note from any staff member who may see it, and closing it by the office
 * or the head. `canNote` and `canClose` only say what the server decided;
 * the server decides again on submit.
 */
export function FollowUp({ incidentId, canNote, canClose }: { incidentId: string; canNote: boolean; canClose: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmClose, setConfirmClose] = useState(false);

  function addNote(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!body.trim()) return setError(t("common.checkTheForm"));
    startTransition(async () => {
      const result = await addIncidentNoteAction(incidentId, { body: body.trim() });
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("incidents.noteSaved") });
      setBody("");
      router.refresh();
    });
  }

  function close() {
    setError(null);
    startTransition(async () => {
      const result = await closeIncidentAction(incidentId);
      if (!result.ok) {
        setError(actionError(t, result, "common.tryAgain"));
        return;
      }
      toast({ tone: "ok", title: t("incidents.closed") });
      setConfirmClose(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 border-t border-border pt-4">
      {error && (
        <p role="alert" className="rounded-[var(--radius-md)] border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {canNote && (
        <form onSubmit={addNote} noValidate className="space-y-3" data-testid="incident-note-form">
          <TextAreaField label={t("incidents.addNote")} placeholder={t("incidents.notePlaceholder")} rows={3} maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} />
          <Button type="submit" variant="secondary" size="sm" loading={pending} icon={<PlusIcon weight="bold" />}>
            {t("incidents.addNote")}
          </Button>
        </form>
      )}

      {canClose && (
        <div className="space-y-2">
          <p className="text-xs text-fg-muted">{t("incidents.closeHint")}</p>
          {confirmClose ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="danger" size="sm" loading={pending} icon={<LockSimpleIcon weight="bold" />} onClick={close}>
                {t("common.confirm")}
              </Button>
              <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={() => setConfirmClose(false)}>
                {t("common.cancel")}
              </Button>
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" disabled={pending} icon={<LockSimpleIcon weight="bold" />} onClick={() => setConfirmClose(true)}>
              {t("incidents.close")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
