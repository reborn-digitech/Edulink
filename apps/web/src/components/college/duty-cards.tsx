import Link from "next/link";
import { ShieldStarIcon } from "@phosphor-icons/react/ssr";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { myDuties } from "@/lib/duties";
import { enabledModules } from "@/lib/modules";
import { DUTY_PAGES } from "@/lib/duty-pages";
import type { Translate } from "@/lib/i18n/dictionary";
import type { ActiveContext } from "@/lib/session";

/**
 * A COLLEGE TEACHER'S DUTIES ON THEIR HOME (5 Oct 2026): one card per duty
 * the registrar gave them — its name, what it asks, and its page (or "its
 * page is coming" while the duties builder has not built it, or the
 * module's name while the college has it off). Nothing when they hold none.
 */
export async function DutyCards({ ctx, t }: { ctx: Pick<ActiveContext, "role" | "membershipId" | "schoolId">; t: Translate }) {
  const [duties, modulesOn] = await Promise.all([myDuties(ctx), enabledModules(ctx.schoolId)]);
  if (duties.length === 0) return null;
  return (
    <Card data-testid="duty-cards">
      <CardHeader icon={<ShieldStarIcon weight="duotone" className="size-5" />} title={t("duties.homeTitle")} description={t("duties.homeBody")} />
      <CardBody>
        <ul className="grid gap-2 sm:grid-cols-2">
          {duties.map((duty) => {
            const page = DUTY_PAGES[duty];
            const open = page && modulesOn.includes(page.module);
            return (
              <li key={duty} data-duty={duty} className="rounded-[var(--radius-md)] border border-border px-3 py-2.5">
                <p className="text-sm font-semibold text-fg">{t(`duties.${duty}.name`)}</p>
                <p className="text-xs leading-relaxed text-fg-muted">{t(`duties.${duty}.what`)}</p>
                {open ? (
                  <Link href={page.href} className="mt-1 inline-block text-xs font-semibold text-accent-strong hover:underline">
                    {/* The link names its desk (QA-62): seven "Open" links read alike in a screen reader's list. */}
                    {t("qaInterface.openDuty", { name: t(`duties.${duty}.name`) })}
                  </Link>
                ) : (
                  <p className="mt-1 text-xs text-fg-subtle">{t(page ? "duties.moduleOff" : "duties.pageComing")}</p>
                )}
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
}
