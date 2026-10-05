import Link from "next/link";
import { PuzzlePieceIcon, HourglassMediumIcon } from "@phosphor-icons/react/ssr";
import type { SchoolModuleCode } from "@edulink/contracts";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { getSession } from "@/lib/session";
import { MODULE_META } from "@/lib/module-meta";
import type { Translate } from "@/lib/i18n/dictionary";

/**
 * What a module's page says when the school has not switched the module on
 * (3 Oct 2026). A module builder's page draws this instead of its content:
 *
 *   if (!(await isModuleOn(ctx.schoolId, "LIBRARY"))) return <ModuleOff page page module="LIBRARY" t={t} />;
 *
 * `page`: the page answers with this alone, so it carries the page's heading
 * (the module's name, an h1). Without it the page had no h1 at all, only the
 * empty state's h2 (A3-states-9, 47 routes on 5 Oct 2026); a page that keeps
 * its own PageHeader above leaves `page` off. tests/ui-states.test.ts holds
 * every `return <ModuleOff` to it.
 *
 * The office (ADMIN, PRINCIPAL) gets the link to Settings, Modules that the
 * sentence names; everyone else is told who can switch it on (A3-states-10).
 */
export async function ModuleOff({ module, t, college = false, page = false }: { module: SchoolModuleCode; t: Translate; college?: boolean; page?: boolean }) {
  const name = t(MODULE_META[module].nameKey);
  const role = (await getSession())?.role;
  const office = role === "ADMIN" || role === "PRINCIPAL";
  const state = (
    <EmptyState
      icon={<PuzzlePieceIcon weight="duotone" className="size-8" />}
      title={t("modules.offTitle", { module: name })}
      // A college's pages say "college" (4 Oct 2026): pass `college` from institutionKindOf.
      description={t(college ? "modules.offBodyCollege" : "modules.offBody", { module: name })}
      action={
        office ? (
          <Button asChild size="sm" variant="secondary">
            <Link href="/admin/settings/modules">{t("modules.open")}</Link>
          </Button>
        ) : undefined
      }
    />
  );
  if (!page) return state;
  return (
    <div className="space-y-5">
      <PageHeader title={name} />
      {state}
    </div>
  );
}

/** The placeholder a module role's home shows while the module is on and its screens are still being built. */
export function ModuleComing({ module, t, college = false }: { module: SchoolModuleCode; t: Translate; college?: boolean }) {
  const name = t(MODULE_META[module].nameKey);
  return (
    <EmptyState
      icon={<HourglassMediumIcon weight="duotone" className="size-8" />}
      title={t("modules.comingTitle", { module: name })}
      description={t(college ? "modules.comingBodyCollege" : "modules.comingBody", { module: name })}
    />
  );
}
