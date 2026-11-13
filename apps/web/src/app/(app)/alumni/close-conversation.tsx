"use client";

import { useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { closeConversationAction } from "./actions";

/** Staff close a room a former pupil writes in, or open it again (the alumni module). */
export function CloseConversationButton({ conversationId, closed }: { conversationId: string; closed: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      size="sm"
      variant="secondary"
      loading={pending}
      data-testid="alumni-close-conversation"
      onClick={() =>
        startTransition(async () => {
          const result = await closeConversationAction(conversationId, !closed);
          if (!result.ok) return void toast({ tone: "danger", title: result.error ?? t("common.tryAgain") });
          router.refresh();
        })
      }
    >
      {closed ? t("alumni.reopen") : t("alumni.close")}
    </Button>
  );
}
