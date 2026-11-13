"use client";

import { useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { BellRingingIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { remind } from "../actions";

type Blocked = "none" | "nothing-outstanding" | "too-soon" | "not-office" | "not-delivered";

/**
 * "Chase the rest": the office tells every family still waiting again, a
 * push and, where texts are on, a text. Once a day — when the lib says no,
 * the button is disabled and the reason sits beside it, so nobody wonders
 * whether it worked.
 */
export function RemindButton({ postId, canRemind, blocked }: { postId: string; canRemind: boolean; blocked: Blocked }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  const reason =
    blocked === "too-soon" ? t("circulars.tooSoon") : blocked === "nothing-outstanding" ? t("circulars.everyoneReached") : blocked === "not-delivered" ? t("circulars.notDelivered") : null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        size="sm"
        loading={pending}
        disabled={!canRemind}
        icon={<BellRingingIcon weight="bold" />}
        aria-describedby={reason ? `remind-reason-${postId}` : undefined}
        onClick={() =>
          startTransition(async () => {
            const result = await remind(postId);
            if (result.ok) {
              toast({ tone: "ok", title: t("circulars.remindDone", { reminded: result.reminded ?? 0, texted: result.texted ?? 0 }) });
            } else {
              toast({ tone: "danger", title: t("bulletin.couldNotDo"), description: result.error });
            }
            router.refresh();
          })
        }
      >
        {t("circulars.remind")}
      </Button>
      {reason && (
        <span id={`remind-reason-${postId}`} className="text-xs text-fg-muted">
          {reason}
        </span>
      )}
    </div>
  );
}
