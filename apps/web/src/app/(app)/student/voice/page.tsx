import type { Metadata } from "next";
import { GRIEVANCE_KINDS } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { myVoice } from "@/lib/iqac";
import { db } from "@/lib/db";
import { getLocale, getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { IqacFlash, SurveyForms, day, keyed } from "@/components/iqac/parts";
import { escalateGrievanceAction, fileGrievanceAction } from "../../iqac/actions";
import { ActionForm } from "@/components/ui/action-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("iqac.voiceTitle"), robots: { index: false, follow: false } };
}

/**
 * A student's voice (module IQAC, 4 Oct 2026): the course feedback, NAAC's
 * satisfaction survey and the exit survey open to them; a grievance to the
 * committee with the UGC's fifteen-working-day limit and the way to the
 * Ombudsperson; a ragging report, with the sentence that the UGC portal is
 * the legal route; what the college did about the surveys it ran.
 */
export default async function StudentVoicePage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("STUDENT");
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const tt = keyed(t);
  const { ok, error } = await searchParams;
  if (!(await isModuleOn(ctx.schoolId, "IQAC"))) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("iqac.voiceTitle")} />
        <ModuleOff module="IQAC" t={t} college />
      </div>
    );
  }
  const v = await myVoice(ctx);
  const atrs = await db.actionTakenReport.findMany({ where: { schoolId: ctx.schoolId, publishedAt: { not: null }, survey: { kind: { in: ["SSS", "EXIT", "COURSE_FEEDBACK"] } } }, orderBy: { publishedAt: "desc" }, take: 5, select: { id: true, text: true, survey: { select: { title: true } } } });
  const back = "/student/voice";
  return (
    <div className="space-y-5">
      <PageHeader title={t("iqac.voiceTitle")} description={t("iqac.voiceIntro")} />
      <IqacFlash ok={ok} error={error} />
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("iqac.surveysForYou")}</h2>
        <SurveyForms t={t} surveys={v.surveys} back={back} locale={locale} />
      </section>
      {atrs.map((a) => (
        <Card key={a.id}>
          <CardHeader title={a.survey.title} />
          <CardBody className="text-sm">{t("iqac.atrRead", { text: a.text })}</CardBody>
        </Card>
      ))}
      <Card>
        <CardHeader title={t("iqac.grievanceTitle")} description={t("iqac.grievanceIntro")} />
        <CardBody className="space-y-3">
          <p className="text-sm text-fg-muted">{t("iqac.raggingNote")}</p>
          <p className="text-sm text-fg-muted">{t("iqac.harassmentNote")}</p>
          <ActionForm action={fileGrievanceAction} className="space-y-3">
            <input type="hidden" name="back" value={back} />
            <SelectField name="kind" label={t("iqac.grievanceKindField")} defaultValue="ACADEMIC">
              {GRIEVANCE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {tt("iqac.grievanceKind." + k)}
                </option>
              ))}
            </SelectField>
            <TextAreaField name="text" required minLength={10} maxLength={4000} label={t("iqac.grievanceTextField")} />
            <TextField name="file" type="file" label={t("iqac.fileField")} accept="application/pdf,image/*" />
            <CheckboxField name="anonymousToStaff" label={t("iqac.anonymousToStaff")} />
            <Button type="submit">{t("iqac.fileButton")}</Button>
          </ActionForm>
        </CardBody>
      </Card>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t("iqac.myGrievances")}</h2>
        {v.grievances.length === 0 ? (
          <EmptyState title={t("iqac.noGrievances")} />
        ) : (
          v.grievances.map((g) => (
            <Card key={g.id} data-testid={`my-grievance-${g.id}`}>
              <CardHeader
                title={tt("iqac.grievanceKind." + g.kind)}
                description={[day(g.filedAt.slice(0, 10), locale), " · ", t("iqac.dueLine", { date: day(g.dueOn, locale) })].join("")}
                action={
                  <span className="flex flex-wrap gap-2">
                    {g.overdue ? <Badge tone="danger">{t("iqac.overdueBadge")}</Badge> : null}
                    <Badge tone={g.status === "RESOLVED" ? "ok" : "neutral"}>{tt("iqac.grievanceStatus." + g.status)}</Badge>
                  </span>
                }
              />
              <CardBody className="space-y-3 text-sm">
                <p className="whitespace-pre-line">{g.text}</p>
                {g.response ? <p>{t("iqac.responseLine", { text: g.response })}</p> : null}
                {g.status !== "ESCALATED" && (g.overdue || g.status === "RESOLVED") ? (
                  <ActionForm action={escalateGrievanceAction} className="space-y-2">
                    <input type="hidden" name="back" value={back} />
                    <input type="hidden" name="grievanceId" value={g.id} />
                    <TextAreaField name="note" required minLength={2} label={t("iqac.escalateNoteField")} />
                    <Button type="submit" size="sm" variant="secondary">
                      {t("iqac.escalateButton")}
                    </Button>
                  </ActionForm>
                ) : null}
              </CardBody>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
