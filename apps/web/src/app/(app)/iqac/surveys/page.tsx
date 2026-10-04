import type { Metadata } from "next";
import Link from "next/link";
import { SURVEY_KINDS } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { listSurveys } from "@/lib/iqac";
import { getLocale, getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { todayKey } from "@/lib/dates";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DateField, SelectField, TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { DeskNav, IqacFlash, day, keyed } from "@/components/iqac/parts";
import { closeSurveyAction, createSurveyAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("iqac.surveysTitle"), robots: { index: false, follow: false } };
}

/**
 * The surveys (module IQAC, 4 Oct 2026): open one of NAAC's kinds, see its
 * responses count, close it, read its aggregates. Course feedback is on one
 * offering of the academics module and goes to the students registered on it.
 */
export default async function SurveysPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("IQAC", "ADMIN", "PRINCIPAL");
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const tt = keyed(t);
  const { ok, error } = await searchParams;
  const kind = await institutionKindOf(ctx.schoolId);
  if (!(await isModuleOn(ctx.schoolId, "IQAC"))) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("iqac.surveysTitle")} />
        <ModuleOff module="IQAC" t={t} college={isCollegeKind(kind)} />
      </div>
    );
  }
  const s = await listSurveys(ctx);
  const offerings = s.canEdit ? await db.courseOffering.findMany({ where: { schoolId: ctx.schoolId }, orderBy: { courseId: "asc" }, take: 200, select: { id: true, course: { select: { code: true, name: true } } } }) : [];
  const today = todayKey("Asia/Kolkata");
  const back = "/iqac/surveys";
  return (
    <div className="space-y-5">
      <PageHeader title={t("iqac.surveysTitle")} description={t("iqac.surveysIntro")} />
      <DeskNav t={t} here={back} />
      <IqacFlash ok={ok} error={error} />
      {s.canEdit ? (
        <Card>
          <CardHeader title={t("iqac.newSurveyTitle")} />
          <CardBody>
            <form action={createSurveyAction} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="back" value={back} />
              <SelectField name="kind" label={t("iqac.kindField")} defaultValue="SSS">
                {SURVEY_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {tt("iqac.surveyKind." + k)}
                  </option>
                ))}
              </SelectField>
              <TextField name="title" required minLength={3} maxLength={200} label={t("iqac.titleField")} />
              <DateField name="opensOn" required label={t("iqac.opensField")} defaultValue={today} />
              <DateField name="closesOn" required label={t("iqac.closesField")} />
              <SelectField name="offeringId" label={t("iqac.offeringField")} defaultValue="" className="sm:col-span-2">
                <option value="">{t("iqac.offeringNone")}</option>
                {offerings.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.course.code} {o.course.name}
                  </option>
                ))}
              </SelectField>
              <div className="sm:col-span-2">
                <Button type="submit">{t("iqac.createButton")}</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}
      {s.items.length === 0 ? (
        <EmptyState title={t("iqac.noSurveys")} />
      ) : (
        <div className="space-y-3">
          {s.items.map((x) => (
            <Card key={x.id}>
              <CardHeader
                title={x.title}
                description={[tt("iqac.surveyKind." + x.kind), " · ", day(x.opensOn, locale), " – ", day(x.closesOn, locale), " · ", t("iqac.responsesLine", { n: x.responses }), " · ", (x.anonymous ? t("iqac.anonymous") : t("iqac.named"))].join("")}
                action={<Badge tone={x.status === "OPEN" ? "ok" : "neutral"}>{tt("iqac.surveyStatus." + x.status)}</Badge>}
              />
              <CardBody className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/iqac/surveys/${x.id}`}>{t("iqac.resultsButton")}</Link>
                </Button>
                {s.canEdit && x.status !== "CLOSED" ? (
                  <form action={closeSurveyAction}>
                    <input type="hidden" name="back" value={back} />
                    <input type="hidden" name="surveyId" value={x.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      {t("iqac.closeButton")}
                    </Button>
                  </form>
                ) : null}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
