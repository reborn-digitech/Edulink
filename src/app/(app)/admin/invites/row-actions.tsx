"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
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
        size="icon-sm"
        variant="ghost"
        aria-label={t("invites.withdrawFor", { name: label })}
        title={t("invites.withdraw")}
        disabled={pending}
        className="text-danger hover:bg-danger-soft"
        onClick={() =>
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
          })
        }
      >
        <ProhibitIcon className="size-4" />
      </Button>
    </div>
  );
}
