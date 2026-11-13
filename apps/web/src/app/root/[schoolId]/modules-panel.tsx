"use client";

import { useState, useTransition } from "react";
import { useRouter } from "@/lib/navigation";
import type { OperatorSchoolModules, SchoolModuleCode } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useT } from "@/lib/i18n";
import { MODULE_META } from "@/lib/module-meta";
import { setSchoolModuleAction } from "../colleges/actions";

/**
 * The institution's modules, switched on its behalf (4 Oct 2026): the
 * admin's own path and refusals, audited in the school's log and the
 * operator's, the admins told; its own modules page then says "switched on
 * by the platform".
 */
export function ModulesPanel({ schoolId, modules }: { schoolId: string; modules: OperatorSchoolModules["modules"] }) {
  const t = useT();
  const router = useRouter();
  const { toast } = useToast();
  const [busy, startTransition] = useTransition();
  const [acting, setActing] = useState<SchoolModuleCode | null>(null);
  const [error, setError] = useState<string | null>(null);

  function press(module: SchoolModuleCode, on: boolean) {
    const name = t(MODULE_META[module].nameKey);
    if (!window.confirm(on ? t("operatorCollege.switchOffConfirm", { module: name }) : t("operatorCollege.switchOnConfirm", { module: name }))) return;
    setError(null);
    setActing(module);
    startTransition(async () => {
      const result = await setSchoolModuleAction(schoolId, { module, on: !on });
      setActing(null);
      if (!result.ok) {
        setError(result.error ?? t("root.didNotWork"));
        return;
      }
      toast({ tone: "ok", title: on ? t("modules.switchedOff", { module: name }) : t("modules.switchedOn", { module: name }) });
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <ul className="space-y-2">
        {modules.map(({ module, on, alwaysOn, byPlatform }) => {
          const name = t(MODULE_META[module].nameKey);
          return (
            <li key={module} className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-fg">{name}</span>
                <Badge size="sm" tone={on ? "ok" : "neutral"}>
                  {on ? t("modules.on") : t("modules.off")}
                </Badge>
                {on && byPlatform && (
                  <Badge size="sm" tone="info">
                    {t("operatorCollege.byPlatform")}
                  </Badge>
                )}
              </span>
              {alwaysOn ? (
                <span className="text-xs text-fg-muted">{t("academics.alwaysOn")}</span>
              ) : (
                <Button size="sm" variant={on ? "ghost" : "secondary"} loading={busy && acting === module} onClick={() => press(module, on)}>
                  {on ? t("modules.switchOffNamed", { module: name }) : t("modules.switchOnNamed", { module: name })}
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
