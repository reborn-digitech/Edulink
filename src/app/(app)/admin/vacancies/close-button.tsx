"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { close } from "./actions";
import { useT } from "@/lib/i18n";
import { actionError } from "@/lib/action-error";
import { useToast } from "@/components/ui/toast";

/** Closing asks once, inline — the same Remove/Keep shape the calendar uses,
 *  because window.confirm is unstylable and untranslatable. */
export function CloseButton({ postingId }: { postingId: string }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setConfirming(true)}>
        {t("vacancies.closeCta")}
      </Button>
    );
  }

  return (
    <span className="flex items-center gap-1">
      <Button
        size="sm"
        variant="danger"
        loading={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await close(postingId);
            if (!result.ok) {
              toast({ tone: "danger", title: actionError(t, result, "common.somethingWrong") });
              return;
            }
            toast({ tone: "ok", title: t("vacancies.closed") });
            router.refresh();
          })
        }
      >
        {t("vacancies.closeCta")}
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setConfirming(false)}>
        {t("common.cancel")}
      </Button>
    </span>
  );
}
