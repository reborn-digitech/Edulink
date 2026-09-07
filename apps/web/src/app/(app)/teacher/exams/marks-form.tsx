"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { countQueued, enqueue } from "@/lib/offline-queue";
import { useT } from "@/lib/i18n";

/**
 * The marks sheet's form, with one job beyond a plain <form>: when the device
 * is offline, the sheet goes into the outbox instead of failing.
 *
 * Online, this is the server action exactly as before — the form submits,
 * the page redirects with ?saved=1. Offline, the same fields are read off the
 * form, shaped as /api/v1/marks expects, and queued under a tag per class so
 * the shell can count them; the service worker or the next reconnection
 * replays the POST. A sheet is replay-safe by nature (it is stored as the
 * current state), so no client id is needed.
 */
export function MarksForm({
  slotId,
  classId,
  action,
  children,
}: {
  slotId: string;
  classId: string;
  action: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
}) {
  const t = useT();
  const { toast } = useToast();
  const [queued, setQueued] = useState(0);

  useEffect(() => {
    void countQueued(`marks:${classId}`).then(setQueued);
  }, [classId]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (navigator.onLine) return; // the server action takes it from here
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const entries: { membershipId: string; marks: number | null }[] = [];
    for (const [key, value] of data.entries()) {
      if (!key.startsWith("marks-")) continue;
      const raw = String(value).trim();
      entries.push({ membershipId: key.slice("marks-".length), marks: raw === "" ? null : Number(raw) });
    }
    await enqueue({
      url: "/api/v1/marks",
      method: "POST",
      body: JSON.stringify({ slotId, classId, entries }),
      tag: `marks:${classId}`,
    });
    setQueued(await countQueued(`marks:${classId}`));
    toast({ tone: "accent", title: t("common.queuedOffline") });
  }

  return (
    <form key={`${classId}:${slotId}`} action={action} onSubmit={onSubmit} className="space-y-4">
      {children}
      {queued > 0 && (
        <p className="text-xs font-medium text-fg-muted" role="status">
          {queued === 1 ? t("shell.outboxOne") : t("shell.outboxCount", { count: queued })} · {t("shell.outboxHint")}
        </p>
      )}
    </form>
  );
}
