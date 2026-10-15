import type { Metadata } from "next";
import { PuzzlePieceIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { schoolModules, isAlwaysOn } from "@/lib/modules";
import { MODULE_META } from "@/lib/module-meta";
import { ROLE_META } from "@/lib/constants";
import { getT, getLocale } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { isCollegeKind } from "@/lib/institution";
import { formatInZone } from "@/lib/dates";
import { mayUse } from "@/lib/platform-features";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModuleSwitch } from "./module-switch";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("modules.title") };
}

/**
 * The optional parts of the school version, one switch each (3 Oct 2026):
 * transport, library, hostel, inventory, payroll, alumni — and at a college
 * (4 Oct 2026) academics, exams, IQAC, placement, admissions and
 * scholarships too (modulesForKind). The admin
 * switches; the head reads. What each does and which role it brings is said
 * on its card. The assistant is not among them (16 Oct 2026): the platform's
 * operator switches it, and one line says so while the ASSISTANT feature is on.
 */
export default async function ModulesPage() {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const locale = await getLocale();
  const [modules, school, assistantFeature] = await Promise.all([
    schoolModules(ctx),
    db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true, kind: true } }),
    mayUse("ASSISTANT", ctx),
  ]);
  // A college is offered the college's six too, and the page says "college" (4 Oct 2026).
  const college = isCollegeKind(school.kind);
  const date = (at: Date) => formatInZone(at, school.timezone, { day: "numeric", month: "long", year: "numeric" }, locale);
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title={t("modules.title")} description={t(college ? "modules.introCollege" : "modules.intro")} />
      <ul className="space-y-3">
        {modules.map(({ module, on, enabledAt, byPlatform }) => {
          const meta = MODULE_META[module];
          return (
            <li key={module}>
              <Card>
                <CardHeader
                  icon={<PuzzlePieceIcon weight="duotone" className="size-5" />}
                  title={t(meta.nameKey)}
                  description={
                    <>
                      {t(meta.whatKey)}
                      {meta.role && <> {t("modules.addsRole", { role: t(ROLE_META[meta.role].labelKey) })}</>}
                    </>
                  }
                />
                <CardBody className="flex flex-wrap items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm text-fg-muted">
                    <Badge tone={on ? "ok" : "neutral"}>{on ? t("modules.on") : t("modules.off")}</Badge>
                    {on && enabledAt && <span>{t("modules.onSince", { date: date(enabledAt) })}</span>}
                    {/* Switched on by the operator on the institution's behalf (4 Oct 2026), said where the office reads it. */}
                    {on && byPlatform && <Badge tone="info">{t("operatorCollege.byPlatform")}</Badge>}
                  </span>
                  {/* ACADEMICS is a college's always (academics builder, 4 Oct 2026): said, and no switch. */}
                  {isAlwaysOn(module, school.kind) ? <span className="text-sm text-fg-muted">{t("academics.alwaysOn")}</span> : ctx.role === "ADMIN" && <ModuleSwitch module={module} on={on} />}
                </CardBody>
              </Card>
            </li>
          );
        })}
      </ul>
      {/* The assistant is the operator's to switch (16 Oct 2026), not a card here: one line, while the platform offers it. */}
      {assistantFeature ? (
        <p className="text-sm text-fg-muted" data-testid="modules-assistant-by-operator">
          {t("modules.assistantByOperator")}
        </p>
      ) : null}
    </div>
  );
}
