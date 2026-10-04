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
