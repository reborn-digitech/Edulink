import type { Metadata } from "next";
import Link from "next/link";
import { SURVEY_SCALE } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { surveyResults } from "@/lib/iqac";
import { getLocale, getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckboxField, TextAreaField, TextField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { IqacFlash, day, keyed } from "@/components/iqac/parts";
import { atrAction, surveyLinkAction, transcribeAction } from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("iqac.resultsTitle"), robots: { index: false, follow: false } };
}

/**
 * One survey's aggregates (module IQAC, 4 Oct 2026): per question the mean on
 * 0–4 and the count of each answer — never a respondent, and nothing at all
 * below five answers. The desk writes the action-taken report here and types
 * in an employer's or a parent's paper form. A teacher reads their own
 * offering's course feedback, an HOD the department's.
 */
export default async function SurveyResultsPage({ params, searchParams }: { params: Promise<{ surveyId: string }>; searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("IQAC", "ADMIN", "PRINCIPAL", "FACULTY", "HOD");
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const tt = keyed(t);
  const { surveyId } = await params;
  const { ok, error } = await searchParams;
  if (!(await isModuleOn(ctx.schoolId, "IQAC"))) return <ModuleOff module="IQAC" t={t} college />;
  const r = await surveyResults(ctx, surveyId);
  const desk = ctx.role === "IQAC" || ctx.role === "ADMIN";
  const back = `/iqac/surveys/${surveyId}`;
  return (
    <div className="space-y-5">
      <PageHeader
        title={r.survey.title}
        description={[tt("iqac.surveyKind." + r.survey.kind), " · ", t("iqac.responsesLine", { n: r.survey.responses })].join("")}
        actions={
          desk || ctx.role === "PRINCIPAL" ? (
            <Button asChild variant="secondary">
              <Link href="/iqac/surveys">{t("iqac.surveysTitle")}</Link>
            </Button>
          ) : undefined
        }
      />
      <IqacFlash ok={ok} error={error} />
      <Card>
        <CardHeader title={t("iqac.resultsTitle")} description={r.overall !== null ? t("iqac.overallLine", { mean: r.overall.toFixed(2) }) : undefined} />
        <CardBody>
          {r.suppressed ? (
            <p className="text-sm text-fg-muted">{t("iqac.suppressed")}</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-fg-muted">
                <tr>
                  <th className="py-2 pr-2 font-medium">{t("iqac.titleField")}</th>
                  <th className="py-2 pr-2 font-medium">{t("iqac.meanLabel")}</th>
                  {SURVEY_SCALE.map((v) => (
                    <th key={v} className="py-2 pr-2 font-medium">
                      {tt("iqac.scale.s" + v)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {r.questions.map((q) => (
                  <tr key={q.code} className="border-t border-border">
                    <td className="py-2 pr-2">{q.label}</td>
                    <td className="py-2 pr-2 font-semibold">{q.mean?.toFixed(2) ?? "—"}</td>
                    {q.counts.map((n, i) => (
                      <td key={i} className="py-2 pr-2">
                        {n}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title={t("iqac.atrTitle")} description={r.atr?.publishedAt ? t("iqac.atrPublishedOn", { date: day(r.atr.publishedAt.slice(0, 10), locale) }) : undefined} />
        <CardBody>
          {desk ? (
            <form action={atrAction} className="space-y-3">
              <input type="hidden" name="back" value={back} />
              <input type="hidden" name="surveyId" value={surveyId} />
              <TextAreaField name="text" required minLength={10} label={t("iqac.atrField")} defaultValue={r.atr?.text ?? ""} />
              <TextField name="file" type="file" label={t("iqac.fileField")} accept="application/pdf,image/*" />
              <CheckboxField name="publish" label={t("iqac.atrPublish")} defaultChecked={!!r.atr?.publishedAt} />
              <Button type="submit">{t("iqac.atrSave")}</Button>
            </form>
          ) : (
            <p className="text-sm">{r.atr ? r.atr.text : t("iqac.noneYet")}</p>
          )}
        </CardBody>
      </Card>
      {desk && (r.survey.kind === "EMPLOYER" || r.survey.kind === "PARENT") && r.survey.status === "OPEN" ? (
        <Card>
          <CardBody className="pt-5">
            <form action={surveyLinkAction}>
              <input type="hidden" name="back" value={back} />
              <input type="hidden" name="surveyId" value={surveyId} />
              <Button type="submit" variant="secondary">{t("iqac.linkMake")}</Button>
            </form>
          </CardBody>
        </Card>
      ) : null}
      {desk && (r.survey.kind === "EMPLOYER" || r.survey.kind === "PARENT") ? (
        <Card>
          <CardHeader title={t("iqac.transcribeTitle")} />
          <CardBody>
            <form action={transcribeAction} className="space-y-3">
              <input type="hidden" name="back" value={back} />
              <input type="hidden" name="surveyId" value={surveyId} />
              <TextField name="source" required minLength={2} label={t("iqac.transcribeSource")} />
              {r.questions.map((q) => (
                <fieldset key={q.code} className="space-y-2">
                  <legend className="text-sm font-medium">{q.label}</legend>
                  <div className="flex flex-wrap gap-2">
                    {SURVEY_SCALE.map((v) => (
                      <label key={v} className="flex min-h-11 items-center gap-2 rounded-[--radius-md] border border-border px-3 text-sm">
                        <input type="radio" name={`q_${q.code}`} value={v} required />
                        {tt("iqac.scale.s" + v)}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
              <Button type="submit">{t("iqac.transcribeButton")}</Button>
            </form>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
