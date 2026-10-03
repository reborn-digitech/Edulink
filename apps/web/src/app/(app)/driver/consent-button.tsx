"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { consentAction } from "./actions";

/** "I agree" under the location sentence; the page reads again once it is recorded. */
export function ConsentButton() {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      loading={pending}
      data-testid="transport-consent"
      onClick={() =>
        start(async () => {
          const result = await consentAction();
          if (!result.ok) {
            toast({ tone: "danger", title: result.error ?? t("common.tryAgain") });
            return;
          }
          toast({ tone: "ok", title: t("transport.consentDone") });
          router.refresh();
        })
      }
    >
      {t("transport.consentAgree")}
    </Button>
  );
}
