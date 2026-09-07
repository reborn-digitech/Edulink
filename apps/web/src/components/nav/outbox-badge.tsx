"use client";

import { useEffect, useState } from "react";
import { TrayIcon } from "@phosphor-icons/react";
import { countQueued, onQueueEvent } from "@/lib/offline-queue";
import { useT } from "@/lib/i18n";

/**
 * "N waiting to send", in the shell, whenever the outbox holds anything.
 *
 * The outbox already existed for attendance and practice answers and was
 * visible only inside the page that filled it; a teacher who marked a
 * register offline and moved on had no way to know it was still on the
 * device. This reads the total across every tag and listens for the queue's
 * own events, so it appears when something is queued and goes when the
 * reconnection drains it. Nothing to press: it is a fact, not a control.
 */
export function OutboxBadge({ className }: { className?: string }) {
  const t = useT();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alive = true;
    const refresh = () => {
      void countQueued().then((n) => {
        if (alive) setCount(n);
      });
    };
    refresh();
    const stop = onQueueEvent(refresh);
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    return () => {
      alive = false;
      stop();
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
    };
  }, []);

  if (count === 0) return null;
  const label = count === 1 ? t("shell.outboxOne") : t("shell.outboxCount", { count });
  return (
    <span
      role="status"
      title={t("shell.outboxHint")}
      className={
        "inline-flex min-h-8 items-center gap-1.5 rounded-full bg-warn-soft px-2.5 text-xs font-semibold text-warn " +
        (className ?? "")
      }
    >
      <TrayIcon weight="bold" className="size-4" aria-hidden />
      <span>{label}</span>
    </span>
  );
}
