"use client";

import { useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import type { SchoolModuleCode } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { MODULE_META } from "@/lib/module-meta";
import { switchModule } from "./actions";

/** The one button per module: switch on, or switch off. The head sees the state and no button. */
export function ModuleSwitch({ module, on }: { module: SchoolModuleCode; on: boolean }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [pending, startTransition] = useTransition();
  const name = t(MODULE_META[module].nameKey);

  function press() {
    startTransition(async () => {
      const result = await switchModule({ module, on: !on });
      if (!result.ok) {
        toast({ tone: "danger", title: result.error ?? t("common.tryAgain") });
        return;
      }
      toast({ tone: "ok", title: on ? t("modules.switchedOff", { module: name }) : t("modules.switchedOn", { module: name }) });
      router.refresh();
    });
  }

  return (
    <Button type="button" size="sm" variant={on ? "secondary" : "primary"} loading={pending} onClick={press} data-testid={`module-switch-${module}`}>
      {on ? t("modules.switchOffNamed", { module: name }) : t("modules.switchOnNamed", { module: name })}
    </Button>
  );
}
