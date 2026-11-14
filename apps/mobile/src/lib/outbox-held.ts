import { useCallback, useEffect, useState } from "react";
import type { RoleCode } from "@edulink/contracts";
import { useToast } from "@/components/chrome";
import { heldElsewhere, onQueueEvent } from "./outbox";
import { useT } from "./i18n";
import { useSession } from "./session";

/**
 * What the outbox holds for the signed-in person at a school other than the
 * one they are at (PH-6, campaign 2026-10-04): a register queued at school A
 * is not replayed under school B, where it would be refused and lost; it
 * waits, and the person is told.
 */
export function useHeldBySchool(): Map<string | null, number> {
  const [held, setHeld] = useState<Map<string | null, number>>(new Map());
  const session = useSession();
  const at = session.status === "signed-in" ? `${session.me.user.id}:${session.me.active.schoolId}` : null;
  useEffect(() => {
    let alive = true;
    const refresh = () => {
      void heldElsewhere()
        .then((next) => {
          if (alive) setHeld(next);
        })
        .catch(() => undefined);
    };
    refresh();
    const stop = onQueueEvent(refresh);
    return () => {
      alive = false;
      stop();
    };
  }, [at]);
  return held;
}

/**
 * A write saved without signal that the server refused when the outbox sent it (TA-146, 13 Nov 2026) left the outbox
 * and its badge exactly as a delivered one does, and only the register said so, while it was on screen. Mounted once
 * at the shell: whatever screen is up, the person is told it was not saved, with the server's own sentence. The
 * register, a lecture and the logbook also say it in place.
 */
export function useReplayRefusalNotice(): void {
  const toast = useToast();
  const t = useT();
  useEffect(
    () =>
      onQueueEvent((event) => {
        if (event.type !== "rejected") return;
        const said = event.status === 0 ? t("mobile.replayExpired") : t("mobile.replayRefused");
        const why = event.error?.trim();
        toast.show(why ? `${said} ${why}` : said, "danger");
      }),
    [toast, t],
  );
}

/** Switch the session's school and role, then say what stays unsent from the place just left. */
export function useSwitchContext(): (next: { schoolId: string | null; role: RoleCode }) => Promise<void> {
  const session = useSession();
  const toast = useToast();
  const t = useT();
  return useCallback(
    async (next) => {
      await session.switchContext(next);
      let count = 0;
      for (const n of (await heldElsewhere()).values()) count += n;
      if (count > 0) toast.show(t("mobile.outboxHeldElsewhere", { count }), "info");
    },
    [session, toast, t],
  );
}
