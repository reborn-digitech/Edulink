"use client";

import { useEffect, useState, type FormEvent } from "react";
import { CheckCircleIcon } from "@phosphor-icons/react";
import { ActionForm, useFormAnswer } from "@/components/ui/action-form";
import { Card, CardBody } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { countQueued, enqueue } from "@/lib/offline-queue";
import type { FormState } from "@/lib/form-state";
import { useT } from "@/lib/i18n";

/**
 * The marks sheet's form: an <ActionForm> (the answer comes back in place; a
 * refusal keeps every mark typed and sits by the button) with one job beyond
 * it — when the device is offline, the sheet goes into the outbox instead of
 * failing.
 *
 * Online, the server action takes the submit: the sheet is drawn again with
 * what was kept and the saved note shows under it. Offline, the same fields
 * are read off the form, shaped as /api/v1/marks expects, and queued under a
 * tag per class so the shell can count them; the service worker or the next
 * reconnection replays the POST. A sheet is replay-safe by nature (it is
 * stored as the current state), so no client id is needed.
 */
export function MarksForm({
  slotId,
  classId,
  action,
  children,
}: {
  slotId: string;
  classId: string;
  action: (previous: FormState, form: FormData) => Promise<FormState>;
  children: React.ReactNode;
}) {
  const t = useT();
  const { toast } = useToast();
  const [queued, setQueued] = useState(0);

  useEffect(() => {
    void countQueued(`marks:${classId}`).then(setQueued);
  }, [classId]);

  function queueOffline(event: FormEvent<HTMLFormElement>): boolean {
    if (navigator.onLine) return false; // the server action takes it from here
    const data = new FormData(event.currentTarget);
    const entries: { membershipId: string; marks: number | null }[] = [];
    for (const [key, value] of data.entries()) {
      if (!key.startsWith("marks-")) continue;
      const raw = String(value).trim();
      entries.push({ membershipId: key.slice("marks-".length), marks: raw === "" ? null : Number(raw) });
    }
    void enqueue({
      url: "/api/v1/marks",
      method: "POST",
      body: JSON.stringify({ slotId, classId, entries }),
      tag: `marks:${classId}`,
    })
      .then(() => countQueued(`marks:${classId}`))
      .then((count) => {
        setQueued(count);
        toast({ tone: "accent", title: t("common.queuedOffline") });
      });
    return true;
  }

  return (
    <ActionForm key={`${classId}:${slotId}`} action={action} intercept={queueOffline} className="space-y-4">
      {children}
      <SavedNote />
      {queued > 0 && (
        <p className="text-xs font-medium text-fg-muted" role="status">
          {queued === 1 ? t("shell.outboxOne") : t("shell.outboxCount", { count: queued })} · {t("shell.outboxHint")}
        </p>
      )}
    </ActionForm>
  );
}

/** The saved note, drawn once the form's last answer was a save. */
function SavedNote() {
  const t = useT();
  const answer = useFormAnswer();
  if (!answer || answer.idle || !answer.ok) return null;
  return (
    <Card data-testid="marks-saved">
      <CardBody className="flex items-center gap-2 text-sm text-ok">
        <CheckCircleIcon weight="fill" className="size-4 shrink-0" />
        {t("exams.savedNote")}
      </CardBody>
    </Card>
  );
}
