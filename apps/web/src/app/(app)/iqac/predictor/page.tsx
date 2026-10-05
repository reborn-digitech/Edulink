import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { listCycles, predictorFor } from "@/lib/iqac";
import { getLocale, getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { DeskNav, IqacFlash, NotAScore, day, keyed } from "@/components/iqac/parts";
import { NaacInsightsSection } from "@/components/iqac/insights";
import { naacInsights } from "@/lib/iqac-insights";
import { closeCycleAction, recomputeAction, saveInputsAction, scoreMetricAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("iqac.predictorTitle"), robots: { index: false, follow: false } };
}

const SCORES = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4];

/**
 * The NAAC predictor (module IQAC, 4 Oct 2026): criteria → key indicators →
 * metrics, each quantitative one with its value, its score, the facts it was
 * counted from and why it reads what it reads; each qualitative one with the
 * coordinator's score, the note and the evidence, and a form to score it.
 * The figures the platform does not hold are entered below with their
 * document. Read by the office and the principal; written by the IQAC.
 */
export default async function PredictorPage({ searchParams }: { searchParams: Promise<{ cycle?: string; ok?: string; error?: string }> }) {
  const ctx = await requireRole("IQAC", "ADMIN", "PRINCIPAL");
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const tt = keyed(t);
  const { cycle: cycleParam, ok, error } = await searchParams;
  const kind = await institutionKindOf(ctx.schoolId);
  if (!(await isModuleOn(ctx.schoolId, "IQAC"))) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("iqac.predictorTitle")} />
        <ModuleOff module="IQAC" t={t} college={isCollegeKind(kind)} />
      </div>
    );
  }
  const cycles = await listCycles(ctx);
  const cycleId = cycleParam && cycles.items.some((c) => c.id === cycleParam) ? cycleParam : cycles.items[0]?.id;
  if (!cycleId) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("iqac.predictorTitle")} description={t("iqac.predictorIntro")} />
        <DeskNav t={t} here="/iqac/predictor" />
        <EmptyState title={t("iqac.noCycleTitle")} description={t("iqac.noCycleBody")} action={<Button asChild><Link href="/iqac">{t("iqac.openDesk")}</Link></Button>} />
      </div>
    );
  }
  const [p, insights] = await Promise.all([predictorFor(ctx, cycleId), naacInsights(ctx, { cycleId })]);
  const back = `/iqac/predictor?cycle=${cycleId}`;
  // Records the coordinator may cite as evidence: the registers' latest rows.
  const [research, activities, meetings] = p.canEdit
    ? await Promise.all([
        db.researchItem.findMany({ where: { schoolId: ctx.schoolId }, orderBy: { createdAt: "desc" }, take: 30, select: { id: true, title: true } }),
        db.activity.findMany({ where: { schoolId: ctx.schoolId }, orderBy: { at: "desc" }, take: 30, select: { id: true, title: true, at: true } }),
        db.committeeMeeting.findMany({ where: { schoolId: ctx.schoolId }, orderBy: { at: "desc" }, take: 30, select: { id: true, at: true, committee: { select: { name: true } } } }),
      ])
    : [[], [], []];
  const rows = [...research.map((r) => ({ v: `ResearchItem:${r.id}`, l: r.title })), ...activities.map((a) => ({ v: `Activity:${a.id}`, l: `${a.title} (${a.at})` })), ...meetings.map((m) => ({ v: `CommitteeMeeting:${m.id}`, l: `${m.committee.name} (${m.at})` }))];
  return (
    <div className="space-y-5">
      <PageHeader title={t("iqac.predictorTitle")} description={t("iqac.predictorIntro")} />
      <DeskNav t={t} here="/iqac/predictor" />
      <IqacFlash ok={ok} error={error} />
      <NotAScore t={t} />
      <Card>
        <CardHeader
          title={tt("iqac.framework." + p.cycle.framework)}
          description={day(p.cycle.windowFrom, locale) + " – " + day(p.cycle.windowTo, locale)}
          action={
            p.canEdit ? (
              <div className="flex flex-wrap gap-2">
                <form action={recomputeAction}>
                  <input type="hidden" name="back" value={back} />
                  <input type="hidden" name="cycleId" value={cycleId} />
                  <Button type="submit" size="sm">
                    {t("iqac.recompute")}
                  </Button>
                </form>
                <form action={closeCycleAction}>
                  <input type="hidden" name="back" value={back} />
                  <input type="hidden" name="cycleId" value={cycleId} />
                  <Button type="submit" size="sm" variant="ghost">
                    {t("iqac.closeCycle")}
                  </Button>
                </form>
              </div>
            ) : undefined
          }
        />
        <CardBody className="grid gap-3 sm:grid-cols-3">
          <StatTile label={t("iqac.cgpaLabel")} value={p.cycle.cgpa?.toFixed(2) ?? "—"} tone="accent" />
          <StatTile label={t("iqac.gradeLabel")} value={p.cycle.grade ?? "—"} hint={p.nextBand ? t("iqac.nextBandLine", { distance: p.nextBand.distance.toFixed(2), grade: p.nextBand.grade, min: p.nextBand.min.toFixed(2) }) : t("iqac.topBand")} />
          <StatTile label={t("iqac.trendTitle")} value={p.trend.length} hint={p.trend.length > 1 ? p.trend.map((x) => `${x.term}: ${x.cgpa.toFixed(2)}`).join(" · ") : t("iqac.trendEmpty")} />
        </CardBody>
      </Card>

      {/* Actionable insights (5 Oct 2026): the way to the next band, ranked, each with where the change is made. */}
      <NaacInsightsSection t={t} insights={insights} role={ctx.role} locale={locale} back={back} canRecompute={p.canEdit} simulatorHref={`/iqac/simulator?cycle=${cycleId}`} />

      {p.criteria.map((c) => (
        <Card key={c.code} data-testid={`criterion-${c.code}`}>
          <CardHeader title={c.code + ". " + c.name} description={[t("iqac.metricWeight", { weight: c.weight }), " · ", t("iqac.criterionScore", { score: c.score.toFixed(2) })].join("")} />
          <CardBody className="space-y-5">
            {c.kis.map((k) => (
              <section key={k.code} className="space-y-3">
                <h3 className="text-sm font-semibold text-fg">
                  {k.code} {k.name} · {t("iqac.metricWeight", { weight: k.weight })} · {t("iqac.criterionScore", { score: k.score.toFixed(2) })}
                </h3>
                {k.metrics.map((m) => (
                  <details key={m.code} id={`metric-${m.code.replace(/\./g, "-")}`} className="rounded-[--radius-md] border border-border p-3" data-testid={`metric-${m.code}`}>
                    <summary className="flex cursor-pointer flex-wrap items-baseline justify-between gap-2 text-sm">
                      <span>
                        <span className="font-mono text-fg-muted">{m.code}</span> {m.text}
                      </span>
                      <span className="flex flex-wrap items-center gap-2">
                        <Badge>{t(m.kind === "QN" ? "iqac.kindQN" : "iqac.kindQL")}</Badge>
                        <Badge tone={m.score === null ? "neutral" : m.score >= 3 ? "ok" : m.score >= 1.5 ? "warn" : "danger"}>{m.score === null ? t("iqac.notScored") : `${m.score.toFixed(2)} / 4`}</Badge>
                      </span>
                    </summary>
                    <div className="mt-3 space-y-3 text-sm">
                      <p>{m.why}</p>
                      <p className="text-fg-muted">
                        {t("iqac.metricWeight", { weight: m.weight })} · {tt("iqac.window." + m.window)}
                        {m.value !== null ? [" · ", t("iqac.valueLabel"), " ", m.value].join("") : ""}
                      </p>
                      {m.inputs.length ? (
                        <div>
                          <p className="font-medium">{t("iqac.inputsTitle")}</p>
                          <ul className="list-disc pl-5">
                            {m.inputs.map((i) => (
                              <li key={i.key}>
                                {i.label}: {i.value ?? "—"} ({tt("iqac.source" + i.source)}){i.reason ? ` — ${i.reason}` : ""}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                      <div>
                        <p className="font-medium">{t("iqac.evidenceTitle")}</p>
                        {m.evidence.length || m.files.length ? (
                          <ul className="list-disc pl-5">
                            {m.evidence.map((e) => (
                              <li key={`${e.type}:${e.id}`}>{e.label}</li>
                            ))}
                            {m.files.map((f) => (
                              <li key={f.fileId}>
                                <a className="text-accent-strong underline" href={`/api/files/${f.fileId}`} target="_blank" rel="noreferrer">
                                  {f.title}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-fg-muted">{t("iqac.noEvidence")}</p>
                        )}
                        {m.note ? <p className="mt-2 whitespace-pre-line">{m.note}</p> : null}
                      </div>
                      {p.canEdit && m.kind === "QL" ? (
                        <form action={scoreMetricAction} className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
                          <input type="hidden" name="back" value={back} />
                          <input type="hidden" name="cycleId" value={cycleId} />
                          <input type="hidden" name="metricCode" value={m.code} />
                          <SelectField name="score" label={t("iqac.scoreField")} defaultValue={String(m.score ?? 2)}>
                            {SCORES.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </SelectField>
                          <SelectField name="evidenceRow" label={t("iqac.evidenceRowField")} defaultValue="">
                            <option value="">{t("iqac.evidenceRowNone")}</option>
                            {rows.map((r) => (
                              <option key={r.v} value={r.v}>
                                {r.l}
                              </option>
                            ))}
                          </SelectField>
                          <TextAreaField name="note" label={t("iqac.noteField")} defaultValue={m.note} className="sm:col-span-2" />
                          <TextField name="file" type="file" label={t("iqac.evidenceFileField")} accept="application/pdf,image/*" />
                          <div className="sm:col-span-2">
                            <Button type="submit">{t("iqac.scoreButton")}</Button>
                          </div>
                        </form>
                      ) : null}
                    </div>
                  </details>
                ))}
              </section>
            ))}
          </CardBody>
        </Card>
      ))}

      <Card>
        <CardHeader id="entered" title={t("iqac.enteredTitle")} description={t("iqac.enteredIntro")} />
        <CardBody>
          <form action={saveInputsAction} className="grid gap-3 sm:grid-cols-2">
            <input type="hidden" name="back" value={back} />
            <input type="hidden" name="cycleId" value={cycleId} />
            <fieldset disabled={!p.canEdit} className="contents">
              {p.entered.map((e) => (
                <TextField key={e.key} name={`in_${e.key}`} type="number" min={0} step="any" label={e.label} defaultValue={e.value ?? ""} />
              ))}
              <TextField name="file" type="file" label={t("iqac.enteredFileField")} accept="application/pdf,image/*" />
              {p.canEdit ? (
                <div className="sm:col-span-2">
                  <Button type="submit">{t("iqac.enteredButton")}</Button>
                </div>
              ) : null}
            </fieldset>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
