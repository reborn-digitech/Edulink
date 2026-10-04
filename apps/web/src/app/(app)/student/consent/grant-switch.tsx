"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import type { StudentConsentGrant } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { saveConsent } from "./actions";

/** One grant's button: let my guardians see it, or stop. */
export function GrantSwitch({ grant, on }: { grant: StudentConsentGrant; on: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  function press() {
    startTransition(async () => {
      const result = await saveConsent({ grant, on: !on });
      if (!result.ok) {
        toast({ tone: "danger", title: result.error ?? t("common.tryAgain") });
        return;
      }
      toast({ tone: "ok", title: on ? t("consent.revoked") : t("consent.granted") });
      router.refresh();
    });
  }
  return (
    <Button type="button" size="sm" variant={on ? "secondary" : "primary"} loading={pending} onClick={press} data-testid={`consent-${grant}`}>
      {on ? t("consent.revokeButton") : t("consent.grantButton")}
    </Button>
  );
}
