import type { Metadata } from "next";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { grievanceDesk } from "@/lib/iqac";
import { getLocale, getT } from "@/lib/i18n/server";
import { formatMonthKey } from "@/lib/dates";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TextAreaField, TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { DeskNav, IqacFlash, day, keyed } from "@/components/iqac/parts";
import { actGrievanceAction } from "../actions";
import { ActionForm } from "@/components/ui/action-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("iqac.grievancesTitle"), robots: { index: false, follow: false } };
}

/**
 * The grievance line (module IQAC, 4 Oct 2026): every student grievance with
 * its UGC 2023 time limit, the month's summary for the committee, and — for
 * the office and the principal — acknowledge, resolve or send to the
 * Ombudsperson. Ragging and harassment are the office's and the head's alone
 * to read; the IQAC sees that they exist and counts them.
 */
export default async function GrievancesPage({ searchParams }: { searchParams: Promise<{ month?: string; ok?: string; error?: string }> }) {
  const ctx = await requireRole("IQAC", "ADMIN", "PRINCIPAL");
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const tt = keyed(t);
  const { month, ok, error } = await searchParams;
  const kind = await institutionKindOf(ctx.schoolId);
  if (!(await isModuleOn(ctx.schoolId, "IQAC"))) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("iqac.grievancesTitle")} />
        <ModuleOff module="IQAC" t={t} college={isCollegeKind(kind)} />
      </div>
    );
  }
  const g = await grievanceDesk(ctx, month);
  const back = `/iqac/grievances${month ? `?month=${month}` : ""}`;
  const s = g.summary;
  return (
    <div className="space-y-5">
      <PageHeader title={t("iqac.grievancesTitle")} description={t("iqac.grievancesIntro")} />
      <DeskNav t={t} here="/iqac/grievances" />
      <IqacFlash ok={ok} error={error} />
      <Card>
        <CardHeader
          title={t("iqac.summaryTitle", { month: formatMonthKey(s.month, locale) })}
          action={
            <form method="get" className="flex items-end gap-2">
              <TextField name="month" type="month" label={t("iqac.monthField")} defaultValue={s.month} />
              <Button type="submit" size="sm" variant="secondary">
                {t("iqac.showMonth")}
              </Button>
            </form>
          }
        />
        <CardBody className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(["filed", "resolved", "withinLimit", "overdue", "escalated", "open"] as const).map((k) => (
            <StatTile key={k} label={tt("iqac.summary." + k)} value={s[k]} tone={k === "overdue" && s[k] ? "danger" : "neutral"} />
          ))}
        </CardBody>
      </Card>
      {g.items.length === 0 ? (
        <EmptyState title={t("iqac.noGrievancesDesk")} />
      ) : (
        <div className="space-y-3">
          {g.items.map((x) => (
            <Card key={x.id} data-testid={`grievance-${x.id}`}>
              <CardHeader
                title={[tt("iqac.grievanceKind." + x.kind), " · ", x.by].join("")}
                description={[tt("iqac.committeeKind." + x.committee), " · ", day(x.filedAt.slice(0, 10), locale), " · ", t("iqac.dueLine", { date: day(x.dueOn, locale) })].join("")}
                action={
                  <span className="flex flex-wrap gap-2">
                    {x.overdue ? <Badge tone="danger">{t("iqac.overdueBadge")}</Badge> : null}
                    <Badge tone={x.status === "RESOLVED" ? "ok" : x.status === "ESCALATED" ? "warn" : "neutral"}>{tt("iqac.grievanceStatus." + x.status)}</Badge>
                  </span>
                }
              />
              <CardBody className="space-y-3 text-sm">
                <p className="whitespace-pre-line">{x.text}</p>
                {x.fileId ? (
                  <a className="text-accent-strong underline" href={`/api/files/${x.fileId}`} target="_blank" rel="noreferrer">
                    {t("iqac.view")}
                  </a>
                ) : null}
                {x.response ? <p>{t("iqac.responseLine", { text: x.response })}</p> : null}
                {x.ombudspersonNote ? <p className="text-fg-muted">{x.ombudspersonNote}</p> : null}
                {g.canAct && x.status !== "ESCALATED" ? (
                  <ActionForm action={actGrievanceAction} className="space-y-2">
                    <input type="hidden" name="back" value={back} />
                    <input type="hidden" name="grievanceId" value={x.id} />
                    <TextAreaField name="note" required minLength={2} label={t("iqac.actNoteField")} />
                    <div className="flex flex-wrap gap-2">
                      {x.status === "OPEN" ? (
                        <Button type="submit" name="action" value="ACKNOWLEDGE" size="sm" variant="secondary">
                          {t("iqac.acknowledgeButton")}
                        </Button>
                      ) : null}
                      {x.status !== "RESOLVED" ? (
                        <Button type="submit" name="action" value="RESOLVE" size="sm">
                          {t("iqac.resolveButton")}
                        </Button>
                      ) : null}
                      <Button type="submit" name="action" value="ESCALATE" size="sm" variant="ghost">
                        {t("iqac.escalateDeskButton")}
                      </Button>
                    </div>
                  </ActionForm>
                ) : null}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
