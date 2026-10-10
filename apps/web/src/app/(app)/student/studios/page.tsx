import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PaletteIcon, SealCheckIcon } from "@phosphor-icons/react/ssr";
import { STUDIO_SUBMISSION_STAGES } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { TextAreaField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { RecordsFlash } from "@/components/stream-records/flash";
import { BAND_KEY, STAGE_KEY, STAGE_STATE_KEY, SUBMISSION_STATE_KEY } from "@/components/studio/studio-card";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { studentStudios } from "@/lib/studio";
import { formatDateKey } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { studioSubmissionAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("duties.studio.studentTitle") };
}

const STATE_TONE = { UNSET: "neutral", AHEAD: "info", TODAY: "warn", DONE: "ok" } as const;
const SUB_TONE = { DRAFT: "neutral", SUBMITTED: "ok", LATE: "warn" } as const;

/**
 * A STUDENT'S STUDIOS (R-56, the studio half, 10 Oct 2026): for each course I
 * am registered on that has a studio — the brief, the four stages with their
 * days, my work for the pin-up and the final (a note and a file, saved as a
 * draft or sent; late after the day) and the results of the juries once the
 * chair has signed. lib/studio.ts.
 */
export default async function StudentStudiosPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireRole("STUDENT");
  const t = await getT();
  const locale = await getLocale();
  if (!isCollegeKind(await institutionKindOf(ctx.schoolId))) notFound();
  if (!(await isModuleOn(ctx.schoolId, "ACADEMICS"))) return <ModuleOff page module="ACADEMICS" t={t} college />;
  const params = await searchParams;
  const d = await studentStudios(ctx);
  const day = (k: string | null) => (k ? formatDateKey(k, { dateStyle: "medium" }, locale) : t("duties.studio.stateUNSET"));
  return (
    <div className="space-y-6">
      <PageHeader title={t("duties.studio.studentTitle")} description={t("duties.studio.studentIntro")} />
      <RecordsFlash t={t} params={params} />
      {d.studios.length === 0 ? (
        <EmptyState icon={<PaletteIcon weight="duotone" className="size-6" />} title={t("duties.studio.noStudiosStudent")} description={t(d.offered ? "duties.studio.noStudiosStudentBody" : "duties.studio.notOffered")} />
      ) : (
        d.studios.map((s) => (
          <Card key={s.id} data-studio={s.id}>
            <CardHeader icon={<PaletteIcon weight="duotone" className="size-5" />} title={s.title} description={t("duties.studio.studioLine", { course: `${s.courseCode} ${s.courseName}`, term: s.termName, coordinator: s.coordinatorName })} />
            <CardBody className="space-y-5">
              {s.brief ? <p className="whitespace-pre-line text-sm text-fg">{s.brief}</p> : null}
              <ol className="grid gap-2 sm:grid-cols-4">
                {s.stages.map((st) => (
                  <li key={st.stage} className="rounded-[var(--radius-md)] border border-border p-3" data-stage={st.stage}>
                    <p className="text-sm font-semibold text-fg">{t(STAGE_KEY[st.stage])}</p>
                    <p className="text-sm text-fg-muted">{day(st.on)}</p>
                    <Badge tone={STATE_TONE[st.state]} className="mt-1">{t(STAGE_STATE_KEY[st.state])}</Badge>
                  </li>
                ))}
              </ol>

              {STUDIO_SUBMISSION_STAGES.map((stage) => {
                const st = s.stages.find((x) => x.stage === stage)!;
                const mine = s.submissions.find((x) => x.stage === stage);
                const open = st.on !== null && s.canSubmit;
                return (
                  <section key={stage} className="space-y-3 rounded-[var(--radius-md)] border border-border p-3" data-submission={stage}>
                    <h3 className="text-sm font-semibold text-fg">{t("duties.studio.submitTitle", { stage: t(STAGE_KEY[stage]) })}</h3>
                    <p className="text-sm text-fg-muted">
                      {st.on ? t("duties.studio.dueLine", { day: day(st.on) }) : t("duties.studio.stageNotSet")}
                      {mine ? (
                        <>
                          {" · "}
                          <Badge tone={SUB_TONE[mine.state]}>{t(SUBMISSION_STATE_KEY[mine.state])}</Badge>
                          {mine.submittedAt ? ` · ${t("duties.studio.submittedOn", { when: formatDateKey(mine.submittedAt.slice(0, 10), { dateStyle: "medium" }, locale) })}` : ""}
                        </>
                      ) : null}
                    </p>
                    {mine?.note ? <p className="whitespace-pre-line text-sm text-fg">{mine.note}</p> : null}
                    {mine?.fileId ? (
                      <a className="text-sm font-medium text-accent underline" href={`/api/files/${mine.fileId}`}>
                        {mine.fileName ?? t("duties.studio.fileLink")}
                      </a>
                    ) : null}
                    {open ? (
                      <form action={studioSubmissionAction} encType="multipart/form-data" className="space-y-3">
                        <input type="hidden" name="studioId" value={s.id} />
                        <input type="hidden" name="stage" value={stage} />
                        <TextAreaField name="note" label={t("duties.studio.fieldNote")} maxLength={1000} rows={3} defaultValue={mine?.note ?? ""} />
                        <label className="block text-sm font-medium text-fg">
                          {t("duties.studio.fieldFile")}
                          <input type="file" name="file" className="mt-1 block min-h-11 w-full text-sm text-fg" />
                        </label>
                        <p className="text-sm text-fg-muted">{t("duties.studio.fileHint")}</p>
                        <div className="flex flex-wrap gap-2">
                          <Button type="submit" name="intent" value="submit">{t("duties.studio.submit")}</Button>
                          {!mine || mine.state === "DRAFT" ? (
                            <Button type="submit" name="intent" value="draft" variant="secondary">{t("duties.studio.saveDraft")}</Button>
                          ) : null}
                        </div>
                      </form>
                    ) : st.on ? (
                      <p className="text-sm text-fg-muted">{t("duties.studio.closed")}</p>
                    ) : null}
                  </section>
                );
              })}

              <section className="space-y-2">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-fg">
                  <SealCheckIcon weight="duotone" className="size-4" aria-hidden="true" />
                  {t("duties.studio.resultsTitle")}
                </h3>
                {s.results.length === 0 ? (
                  <p className="text-sm text-fg-muted">{t("duties.studio.noResults")}</p>
                ) : (
                  <ul className="divide-y divide-border text-sm">
                    {s.results.map((r) => (
                      <li key={r.juryId} className="py-1.5">
                        <span className="font-medium text-fg">{day(r.on)}</span>
                        {r.title ? ` · ${r.title}` : ""} · {r.marks === null || !r.band ? t("duties.studio.absent") : t("duties.studio.resultLine", { marks: r.marks, max: s.maxMarks, band: t(BAND_KEY[r.band]) })}
                        {r.remark ? <span className="text-fg-muted"> — {r.remark}</span> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </CardBody>
          </Card>
        ))
      )}
    </div>
  );
}
