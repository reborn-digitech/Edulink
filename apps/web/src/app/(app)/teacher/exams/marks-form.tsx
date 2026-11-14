"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
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
 *
 * Both ways the sheet names the version it was drawn on (the page's hidden
 * `basedOn`, TA-248 / TA-515): a sheet sent late from the outbox leaves alone
 * every mark written since the page was opened, its blanks included, rather
 * than putting the older sheet over them.
 *
 * And when the browser SAYS it is online but the save fails on the way (a
 * dropped connection on 2G, a captive portal answering for the server), the
 * same sheet goes into the outbox rather than the page failing with every
 * typed mark (TA-252): the form is not drawn again, so the marks stay in it.
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

  const queueSheet = useCallback(
    (data: FormData) => {
      const entries: { membershipId: string; marks: number | null }[] = [];
      for (const [key, value] of data.entries()) {
        if (!key.startsWith("marks-")) continue;
        const raw = String(value).trim();
        entries.push({ membershipId: key.slice("marks-".length), marks: raw === "" ? null : Number(raw) });
      }
      const basedOn = String(data.get("basedOn") ?? "");
      return enqueue({
        url: "/api/v1/marks",
        method: "POST",
        body: JSON.stringify({ slotId, classId, entries, ...(basedOn ? { basedOn } : {}) }),
        tag: `marks:${classId}`,
      })
        .then(() => countQueued(`marks:${classId}`))
        .then((count) => {
          setQueued(count);
          toast({ tone: "accent", title: t("common.queuedOffline") });
        });
    },
    [slotId, classId, toast, t],
  );

  function queueOffline(event: FormEvent<HTMLFormElement>): boolean {
    if (navigator.onLine) return false; // the server action takes it from here
    void queueSheet(new FormData(event.currentTarget));
    return true;
  }

  /** The server action, with a save that fails on the way queued instead of thrown at the page (TA-252). */
  const saveOrQueue = useCallback(
    async (previous: FormState, form: FormData): Promise<FormState> => {
      try {
        return await action(previous, form);
      } catch {
        await queueSheet(form);
        // Idle, on the same key: no refusal is drawn, and the form is not drawn afresh, so every typed mark stays.
        return { idle: true, ok: false, n: previous.n };
      }
    },
    [action, queueSheet],
  );

  return (
    <ActionForm key={`${classId}:${slotId}`} action={saveOrQueue} intercept={queueOffline} className="space-y-4">
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
