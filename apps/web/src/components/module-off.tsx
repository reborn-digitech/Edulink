import { PuzzlePieceIcon, HourglassMediumIcon } from "@phosphor-icons/react/ssr";
import type { SchoolModuleCode } from "@edulink/contracts";
import { EmptyState } from "@/components/ui/states";
import { MODULE_META } from "@/lib/module-meta";
import type { Translate } from "@/lib/i18n/dictionary";

/**
 * What a module's page says when the school has not switched the module on
 * (3 Oct 2026). A module builder's page draws this instead of its content:
 *
 *   if (!(await isModuleOn(ctx.schoolId, "LIBRARY"))) return <ModuleOff module="LIBRARY" t={t} />;
 */
export function ModuleOff({ module, t }: { module: SchoolModuleCode; t: Translate }) {
  const name = t(MODULE_META[module].nameKey);
  return (
    <EmptyState
      icon={<PuzzlePieceIcon weight="duotone" className="size-8" />}
      title={t("modules.offTitle", { module: name })}
      description={t("modules.offBody", { module: name })}
    />
  );
}

/** The placeholder a module role's home shows while the module is on and its screens are still being built. */
export function ModuleComing({ module, t }: { module: SchoolModuleCode; t: Translate }) {
  const name = t(MODULE_META[module].nameKey);
  return (
    <EmptyState
      icon={<HourglassMediumIcon weight="duotone" className="size-8" />}
      title={t("modules.comingTitle", { module: name })}
      description={t("modules.comingBody", { module: name })}
    />
  );
}
