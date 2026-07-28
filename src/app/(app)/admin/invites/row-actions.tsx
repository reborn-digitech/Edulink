"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowsClockwiseIcon, ProhibitIcon } from "@phosphor-icons/react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { resendInvite, revokeInvite } from "./actions";

export function InviteRowActions({
  inviteId,
  label,
  canResend,
}: {
  inviteId: string;
  label: string;
  canResend: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex shrink-0 gap-1">
      {canResend && (
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={`Resend invitation to ${label}`}
          title="Resend"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await resendInvite(inviteId);
              toast(
                result.ok
                  ? {
                      tone: "ok",
                      title: "Invitation resent",
                      description: "The previous link no longer works.",
                    }
                  : { tone: "danger", title: "Could not resend", description: result.error },
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
        aria-label={`Withdraw invitation for ${label}`}
        title="Withdraw"
        disabled={pending}
        className="text-danger hover:bg-danger-soft"
        onClick={() =>
          startTransition(async () => {
            const result = await revokeInvite(inviteId);
            toast(
              result.ok
                ? {
                    tone: "neutral",
                    title: "Invitation withdrawn",
                    description: `${label} can no longer use their link.`,
                  }
                : { tone: "danger", title: "Could not withdraw", description: result.error },
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
