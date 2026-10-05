import type { Metadata } from "next";
import { BooksIcon, GraduationCapIcon, ListChecksIcon, TargetIcon } from "@phosphor-icons/react/ssr";
import { EXIT_AWARDS, PROGRAMME_LEVELS, REGULATORS, COURSE_KINDS, defaultRegulatorFor } from "@edulink/contracts";
import { streamsOf } from "@/lib/streams";
import { tv } from "@/lib/stream-words";
import { streamLabel } from "@/lib/institution";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { INPUT, TD, TH } from "@/components/module-flash";
import { AWARD_KEY, KIND_KEY, LEVEL_KEY, OfficeTop } from "@/components/academics/parts";
import { academicsStructure } from "@/lib/academics";
import { getT } from "@/lib/i18n/server";
import { academicsGate, type SearchParams } from "../shared";
import { saveCourseAction, saveMappingAction, saveOutcomesAction, saveProgrammeAction, saveSchemeAction } from "../actions";
import { TableScroll } from "@/components/ui/table-scroll";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("academics.tabProgrammes") };
}

const DEFAULT_GRADES = "O 10 90\nA+ 9 80\nA 8 70\nB+ 7 60\nB 6 50\nC 5 45\nP 4 40\nF 0 0";

/** Programmes with their outcomes and exits, the university's schemes with grading and passing rules, and the courses of each scheme. */
export default async function ProgrammesPage({ searchParams }: { searchParams: SearchParams }) {
  const { ctx, t, on, college, canEdit } = await academicsGate();
  if (!on) return <ModuleOff module="ACADEMICS" t={t} college={college} />;
  const params = await searchParams;
  const s = await academicsStructure(ctx);
  const dept = new Map(s.departments.map((d) => [d.id, d.name]));
  // The college's streams (5 Oct 2026): a new programme picks one, and its regulator defaults from it.
  const streams = await streamsOf(ctx.schoolId);
  return (
    <div className="space-y-6">
      <OfficeTop t={t} current="programmes" params={params} />
      <Card>
        <CardHeader icon={<GraduationCapIcon weight="duotone" className="size-5" />} title={t("academics.programmesTitle")} description={t("academics.programmesBody")} />
        <CardBody className="space-y-4">
          {s.programmes.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("academics.programmesNone")} description={t("academics.programmesNoneBody")} />
          ) : (
            <ul className="divide-y divide-border text-sm">
              {s.programmes.map((p) => {
                const pos = s.programmeOutcomes.filter((o) => o.programmeId === p.id);
                return (
                  <li key={p.id} className="space-y-2 py-3">
                    <p>
                      <span className="font-semibold text-fg">{p.code}</span> {p.name} <span className="text-fg-muted">· {t(LEVEL_KEY[p.level]!)} · {dept.get(p.departmentId)} · {t("academics.yearsIntake", { years: p.durationYears, intake: p.intake })} · {p.regulator}{p.stream ? ` · ${streamLabel(p.stream, t)}` : ""}</span>{" "}
                      <Badge tone="info">{t("academics.thresholdBadge", { threshold: p.attendanceThreshold })}</Badge>
                    </p>
                    {p.exitPoints.length ? <p className="text-fg-muted">{t("academics.exitsLine", { exits: p.exitPoints.map((e) => t("academics.exitAfter", { year: e.afterYear, award: t(AWARD_KEY[e.award]!), credits: e.credits })).join(" · ") })}</p> : null}
                    {canEdit ? (
                      <form action={saveOutcomesAction} className="space-y-2">
                        <input type="hidden" name="programmeId" value={p.id} />
                        <TextAreaField label={t("academics.fieldPos")} name="outcomes" rows={3} defaultValue={pos.map((o) => `${o.code} | ${o.text}`).join("\n")} hint={t("academics.fieldOutcomesHint")} />
                        <Button type="submit" size="sm" variant="secondary">{t("academics.saveOutcomes")}</Button>
                      </form>
                    ) : pos.length ? (
                      <ul className="list-inside list-disc text-fg-muted">{pos.map((o) => <li key={o.code}>{`${o.code} — ${o.text}`}</li>)}</ul>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
          {canEdit && s.departments.length ? (
            <form action={saveProgrammeAction} className="grid gap-3 sm:grid-cols-3">
              <SelectField label={tv("department", streams, t)} name="departmentId" required>
                {s.departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </SelectField>
              <TextField label={t("academics.fieldCode")} name="code" required maxLength={20} />
              <TextField label={t("academics.fieldName")} name="name" required maxLength={160} />
              <SelectField label={t("academics.fieldLevel")} name="level" defaultValue="UG">
                {PROGRAMME_LEVELS.map((l) => <option key={l} value={l}>{t(LEVEL_KEY[l]!)}</option>)}
              </SelectField>
              <TextField label={t("academics.fieldYears")} name="durationYears" type="number" min={1} max={6} defaultValue={3} />
              <TextField label={t("academics.fieldIntake")} name="intake" type="number" min={0} max={5000} defaultValue={60} />
              {streams.length ? (
                <SelectField label={t("streams.programmeField")} name="stream" defaultValue={streams.length === 1 ? streams[0] : ""} hint={t("streams.programmeFieldHint")}>
                  <option value="">{t("academics.none")}</option>
                  {streams.map((st) => <option key={st} value={st}>{`${streamLabel(st, t)} · ${defaultRegulatorFor(st)}`}</option>)}
                </SelectField>
              ) : null}
              <SelectField label={t("academics.fieldRegulator")} name="regulator" defaultValue={streams.length ? "" : "UGC"}>
                {streams.length ? <option value="">{t("streams.regulatorFromStream")}</option> : null}
                {REGULATORS.map((r) => <option key={r} value={r}>{r}</option>)}
              </SelectField>
              <TextField label={t("academics.fieldThreshold")} name="attendanceThreshold" type="number" min={1} max={100} hint={t("academics.fieldThresholdHint")} />
              {[1, 2, 3, 4].map((y) => (
                <SelectField key={y} label={t("academics.fieldExitAfter", { year: y })} name={`exit${y}`} defaultValue="">
                  <option value="">{t("academics.none")}</option>
                  {EXIT_AWARDS.map((a) => <option key={a} value={a}>{t(AWARD_KEY[a]!)}</option>)}
                </SelectField>
              ))}
              <div className="self-end">
                <Button type="submit">{t("academics.addProgramme")}</Button>
              </div>
            </form>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<ListChecksIcon weight="duotone" className="size-5" />} title={t("academics.schemesTitle")} description={t("academics.schemesBody")} />
        <CardBody className="space-y-4">
          {s.schemes.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("academics.schemesNone")} description={t("academics.schemesNoneBody")} />
          ) : (
            <ul className="divide-y divide-border text-sm">
              {s.schemes.map((sc) => (
                <li key={sc.id} className="py-2">
                  <span className="font-semibold text-fg">{sc.name}</span> <span className="text-fg-muted">· {s.programmes.find((p) => p.id === sc.programmeId)?.code} · {sc.effectiveYear}</span>
                  <p className="text-fg-muted">{t("academics.rulesLine", { pass: sc.passingRules.minPercentPerCourse, atkt: sc.passingRules.atktLimit, total: sc.passingRules.totalCredits, internal: sc.passingRules.internalMax, external: sc.passingRules.externalMax, min: sc.passingRules.minTermCredits, max: sc.passingRules.maxTermCredits })}</p>
                  <p className="text-fg-muted">{sc.gradingTable.map((g) => `${g.grade} ${g.points} (${g.minPercent}%)`).join(" · ")}</p>
                </li>
              ))}
            </ul>
          )}
          {canEdit && s.programmes.length ? (
            <form action={saveSchemeAction} className="grid gap-3 sm:grid-cols-4">
              <SelectField label={t("academics.fieldProgramme")} name="programmeId" required>
                {s.programmes.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}
              </SelectField>
              <TextField label={t("academics.fieldName")} name="name" required maxLength={120} />
              <TextField label={t("academics.fieldEffectiveYear")} name="effectiveYear" type="number" min={2000} max={2100} defaultValue={2024} />
              <TextField label={t("academics.fieldPassPercent")} name="minPercentPerCourse" type="number" min={0} max={100} defaultValue={40} />
              <TextField label={t("academics.fieldAtkt")} name="atktLimit" type="number" min={0} max={20} defaultValue={4} />
              <TextField label={t("academics.fieldTotalCredits")} name="totalCredits" type="number" min={1} max={400} defaultValue={120} />
              <TextField label={t("academics.fieldInternalMax")} name="internalMax" type="number" min={1} max={200} defaultValue={40} />
              <TextField label={t("academics.fieldExternalMax")} name="externalMax" type="number" min={0} max={200} defaultValue={60} />
              <TextField label={t("academics.fieldMinTermCredits")} name="minTermCredits" type="number" min={0} max={60} defaultValue={16} />
              <TextField label={t("academics.fieldMaxTermCredits")} name="maxTermCredits" type="number" min={1} max={60} defaultValue={26} />
              <TextAreaField className="sm:col-span-2" label={t("academics.fieldGrading")} name="gradingTable" rows={8} defaultValue={DEFAULT_GRADES} hint={t("academics.fieldGradingHint")} />
              <div className="self-end">
                <Button type="submit">{t("academics.addScheme")}</Button>
              </div>
            </form>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<BooksIcon weight="duotone" className="size-5" />} title={t("academics.coursesTitle")} description={t("academics.coursesBody")} />
        <CardBody className="space-y-4">
          {s.courses.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("academics.coursesNone")} description={t("academics.coursesNoneBody")} />
          ) : (
            <TableScroll>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className={TH}>{t("academics.fieldCode")}</th>
                    <th scope="col" className={TH}>{t("academics.fieldName")}</th>
                    <th scope="col" className={TH}>{t("academics.fieldSemester")}</th>
                    <th scope="col" className={TH}>{t("academics.fieldCredits")}</th>
                    <th scope="col" className={TH}>{t("academics.fieldKind")}</th>
                    <th scope="col" className={TH}>{t("academics.colOutcomes")}</th>
                    {canEdit ? <th scope="col" className={TH}>{t("academics.colMapping")}</th> : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {s.courses.map((k) => (
                    <tr key={k.id}>
                      <td className={TD}>{k.code}</td>
                      <td className={TD}>{k.name}</td>
                      <td className={TD}>{k.semester}</td>
                      <td className={TD}>{t("academics.creditsLtp", { credits: k.credits, l: k.creditsL, t: k.creditsT, p: k.creditsP })}</td>
                      <td className={TD}>{t(KIND_KEY[k.kind]!)}</td>
                      <td className={TD}>
                        <span className="flex items-center gap-1 text-fg-muted">
                          <TargetIcon className="size-4" aria-hidden />
                          {k.outcomes.map((o) => o.code).join(", ") || "—"}
                        </span>
                      </td>
                      {canEdit ? (
                        <td className={TD}>
                          <form action={saveMappingAction} className="flex items-start gap-2">
                            <input type="hidden" name="courseId" value={k.id} />
                            <textarea aria-label={t("academics.colMapping")} className={`${INPUT} min-w-40`} name="mapping" rows={2} defaultValue={k.mapping.map((x) => `${x.coCode} ${x.poCode} ${x.level}`).join("\n")} />
                            <Button type="submit" size="sm" variant="secondary">{t("common.save")}</Button>
                          </form>
                        </td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
          {canEdit && s.schemes.length ? (
            <form action={saveCourseAction} className="grid gap-3 sm:grid-cols-4">
              <SelectField label={t("academics.fieldScheme")} name="schemeId" required>
                {s.schemes.map((sc) => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
              </SelectField>
              <TextField label={t("academics.fieldCode")} name="code" required maxLength={20} />
              <TextField label={t("academics.fieldName")} name="name" required maxLength={160} />
              <TextField label={t("academics.fieldSemester")} name="semester" type="number" min={1} max={12} defaultValue={1} />
              <TextField label={t("academics.fieldCreditsL")} name="creditsL" type="number" min={0} max={12} defaultValue={3} />
              <TextField label={t("academics.fieldCreditsT")} name="creditsT" type="number" min={0} max={12} defaultValue={0} />
              <TextField label={t("academics.fieldCreditsP")} name="creditsP" type="number" min={0} max={12} defaultValue={1} />
              <SelectField label={t("academics.fieldKind")} name="kind" defaultValue="CORE">
                {COURSE_KINDS.map((k) => <option key={k} value={k}>{t(KIND_KEY[k]!)}</option>)}
              </SelectField>
              <TextAreaField className="sm:col-span-3" label={t("academics.fieldCos")} name="outcomes" rows={3} hint={t("academics.fieldOutcomesHint")} />
              <div className="self-end">
                <Button type="submit">{t("academics.addCourse")}</Button>
              </div>
            </form>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
