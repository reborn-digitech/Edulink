"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { ArrowsClockwiseIcon, ProhibitIcon } from "@phosphor-icons/react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { resendInvite, revokeInvite } from "./actions";
import { actionError } from "@/lib/action-error";
import { useT } from "@/lib/i18n";

export function InviteRowActions({
  inviteId,
  label,
  canResend,
}: {
  inviteId: string;
  label: string;
  canResend: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  // Withdrawing kills a link somebody may be about to press. One extra
  // press, in place, rather than an OS dialog: the button turns into its
  // own confirmation and turns back if left alone.
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 4000);
    return () => clearTimeout(timer);
  }, [confirming]);

  return (
    <div className="flex shrink-0 gap-1">
      {canResend && (
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={t("invites.resendTo", { name: label })}
          title={t("invites.resend")}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await resendInvite(inviteId);
              toast(
                result.ok
                  ? {
                      tone: "ok",
                      title: t("invites.resent"),
                      description: t("invites.previousLinkDead"),
                    }
                  : {
                      tone: "danger",
                      title: t("invites.couldNotResend"),
                      description: actionError(t, result),
                    },
              );
              router.refresh();
            })
          }
        >
          <ArrowsClockwiseIcon className="size-4" />
        </Button>
      )}

      <Button
        size={confirming ? "sm" : "icon-sm"}
        variant={confirming ? "danger" : "ghost"}
        aria-label={confirming ? t("invites.withdrawConfirm") : t("invites.withdrawFor", { name: label })}
        title={t("invites.withdraw")}
        disabled={pending}
        className={confirming ? undefined : "text-danger hover:bg-danger-soft"}
        onClick={() => {
          if (!confirming) {
            setConfirming(true);
            return;
          }
          setConfirming(false);
          startTransition(async () => {
            const result = await revokeInvite(inviteId);
            toast(
              result.ok
                ? {
                    tone: "neutral",
                    title: t("invites.withdrawnToast"),
                    description: t("invites.linkNoLongerWorks", { name: label }),
                  }
                : {
                    tone: "danger",
                    title: t("invites.couldNotWithdraw"),
                    description: actionError(t, result),
                  },
            );
            router.refresh();
          });
        }}
      >
        {confirming ? t("invites.withdrawConfirm") : <ProhibitIcon className="size-4" />}
      </Button>
    </div>
  );
}
