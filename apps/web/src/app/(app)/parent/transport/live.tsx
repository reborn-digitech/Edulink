"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckboxField } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { nearAlertsAction } from "./actions";

// The page's live refresh is src/components/transport/family-live.tsx since owner-batch-item5, shared with the pupil's own page.

/** "Tell me when the bus is near", for this child and this guardian. */
export function NearAlertsSwitch({ childId, childName, on }: { childId: string; childName: string; on: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [checked, setChecked] = useState(on);
  const [pending, start] = useTransition();
  return (
    <CheckboxField
      label={t("transport.alertsOn")}
      description={t("transport.alertsHint", { name: childName })}
      checked={checked}
      disabled={pending}
      data-testid="transport-near-alerts"
      onChange={(e) => {
        const next = e.target.checked;
        setChecked(next);
        start(async () => {
          const result = await nearAlertsAction({ childId, nearAlerts: next });
          if (!result.ok) {
            setChecked(!next);
            toast({ tone: "danger", title: result.error ?? t("common.tryAgain") });
            return;
          }
          toast({ tone: "ok", title: t("transport.alertsSaved") });
          router.refresh();
        });
      }}
    />
  );
}
