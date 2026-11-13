"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import type { FeatureCode } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { FEATURE_META } from "@/lib/feature-meta";
import { setFeatureAction } from "./actions";

/** One feature's On/Off button: the opposite of what stands, after a confirm that names the feature (15 Oct 2026). */
export function FeatureSwitch({ code, on }: { code: FeatureCode; on: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const name = t(FEATURE_META[code].nameKey);

  function press() {
    if (!window.confirm(on ? t("platformFeatures.confirmOff", { name }) : t("platformFeatures.confirmOn", { name }))) return;
    setError(null);
    startTransition(async () => {
      const result = await setFeatureAction(code, !on);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast({ tone: "ok", title: result.message });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" size="sm" variant={on ? "secondary" : "primary"} loading={pending} onClick={press} data-testid={`feature-toggle-${code}`}>
        {on ? t("platformFeatures.turnOff") : t("platformFeatures.turnOn")}
      </Button>
      {error && (
        <span role="alert" className="text-sm font-medium text-danger">
          {error}
        </span>
      )}
    </div>
  );
}
