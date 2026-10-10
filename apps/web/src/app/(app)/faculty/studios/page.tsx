import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GavelIcon, PaletteIcon } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { SelectField } from "@/components/ui/field";
// A sheet cell's input takes the kit's field look (fieldClass), compacted to the 44 px target (integration, 11 Oct 2026).
import { fieldClass } from "@/components/ui/field-class";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { TableScroll } from "@/components/ui/table-scroll";
import { ModuleOff } from "@/components/module-off";
import { TD, TH } from "@/components/module-flash";
import { RecordsFlash } from "@/components/stream-records/flash";
import { BAND_KEY, externalText, panelText, StudioCard } from "@/components/studio/studio-card";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { facultyStudios } from "@/lib/studio";
import { formatDateKey } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { postJuryInternalAction, saveJuryMarksAction, signJuryAction } from "./actions";


export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("duties.studio.facultyTitle") };
}

/**
 * A TEACHER'S STUDIOS AND JURIES (R-56, the studio half, 10 Oct 2026): the
 * studios I teach, coordinate or sit on a jury for (an HOD: the department's
 * too), and each jury's sheet — marked by a juror on the panel, signed by its
 * chair, and once signed posted into one of the offering's internal
 * components by the offering's teacher or the HOD. lib/studio.ts.
 */
export default async function FacultyStudiosPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireRole("FACULTY", "HOD");
  const t = await getT();
  const locale = await getLocale();
  if (!isCollegeKind(await institutionKindOf(ctx.schoolId))) notFound();
  if (!(await isModuleOn(ctx.schoolId, "ACADEMICS"))) return <ModuleOff page module="ACADEMICS" t={t} college />;
  const params = await searchParams;
  const d = await facultyStudios(ctx);
  const day = (k: string) => formatDateKey(k, { dateStyle: "medium" }, locale);
  return (
    <div className="space-y-6">
      <PageHeader title={t("duties.studio.facultyTitle")} description={t("duties.studio.facultyIntro")} />
      <RecordsFlash t={t} params={params} />
      {!d.offered ? <p className="rounded-[var(--radius-md)] border border-border bg-surface-muted px-3 py-2 text-sm text-fg-muted">{t("duties.studio.notOffered")}</p> : null}

      <Card>
        <CardHeader icon={<GavelIcon weight="duotone" className="size-5" />} title={t("duties.studio.myJuriesTitle")} description={t("duties.studio.myJuriesBody")} />
        <CardBody className="space-y-6">
          {d.juries.length === 0 ? <p className="text-sm text-fg-muted">{t("duties.studio.noJuriesMine")}</p> : null}
          {d.juries.map((j) => (
            <section key={j.id} className="space-y-3 rounded-[var(--radius-md)] border border-border p-3" data-jury={j.id}>
              <div className="space-y-1 text-sm">
                <p className="text-fg">
                  <span className="font-semibold">{j.studioTitle}</span> · {j.courseCode} · <span className="font-medium">{day(j.on)}</span>
                  {j.title ? ` · ${j.title}` : ""} <Badge tone={j.signedAt ? "ok" : j.past ? "warn" : "info"}>{t(j.signedAt ? "duties.studio.signedBadge" : j.past ? "duties.studio.past" : "duties.studio.ahead")}</Badge>
                </p>
                <p className="text-fg-muted">{t("duties.studio.panelLine", { names: panelText(j, t) })}</p>
                {j.externalJurors.length ? <p className="text-fg-muted">{t("duties.studio.externalLine", { list: externalText(j, t) })}</p> : null}
                <p className="text-fg-muted">{j.signedAt ? t("duties.studio.signedLine", { name: j.signedByName ?? "" }) : t("duties.studio.unsignedLine", { marked: j.marked, students: j.students })}</p>
              </div>
              {j.canMark ? (
                <form action={saveJuryMarksAction} className="space-y-3">
                  <input type="hidden" name="juryId" value={j.id} />
                  <TableScroll label={t("duties.studio.sheetTitle")}>
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th scope="col" className={TH}>{t("duties.studio.colStudent")}</th>
                          <th scope="col" className={TH}>{t("duties.studio.colMarks", { max: j.maxMarks })}</th>
                          <th scope="col" className={TH}>{t("duties.studio.colBand")}</th>
                          <th scope="col" className={TH}>{t("duties.studio.colRemark")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {j.sheet.map((row) => (
                          <tr key={row.studentMembershipId}>
                            <td className={TD}>
                              <input type="hidden" name="student" value={row.studentMembershipId} />
                              {row.name}
                            </td>
                            <td className={TD}>
                              <input name={`marks_${row.studentMembershipId}`} aria-label={t("duties.studio.cellMarks", { student: row.name, max: j.maxMarks })} type="number" min={0} max={j.maxMarks} step="0.5" defaultValue={row.marks === null ? "" : String(row.marks)} className={fieldClass("w-28 min-h-11 px-2 py-1.5 text-sm")} />
                            </td>
                            <td className={TD}>{row.band ? t(BAND_KEY[row.band]) : "—"}</td>
                            <td className={TD}>
                              <input name={`remark_${row.studentMembershipId}`} aria-label={t("duties.studio.cellRemark", { student: row.name })} maxLength={400} defaultValue={row.remark} className={fieldClass("min-w-48 min-h-11 px-2 py-1.5 text-sm")} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableScroll>
                  <p className="text-sm text-fg-muted">{t("duties.studio.absentHint")}</p>
                  <Button type="submit" variant="secondary">{t("duties.studio.saveMarks")}</Button>
                </form>
              ) : (
                <ul className="divide-y divide-border text-sm">
                  {j.sheet.map((row) => (
                    <li key={row.studentMembershipId} className="flex flex-wrap justify-between gap-2 py-1.5">
                      <span className="text-fg">{row.name}</span>
                      <span className="text-fg-muted">{row.entered ? (row.marks === null ? t("duties.studio.absent") : t("duties.studio.resultLine", { marks: row.marks, max: j.maxMarks, band: row.band ? t(BAND_KEY[row.band]) : "—" })) : t("duties.studio.notEntered")}{row.remark ? ` — ${row.remark}` : ""}</span>
                    </li>
                  ))}
                </ul>
              )}
              {j.canSign ? (
                <form action={signJuryAction} className="flex flex-wrap items-center gap-3">
                  <input type="hidden" name="juryId" value={j.id} />
                  <Button type="submit">{t("duties.studio.sign")}</Button>
                  <span className="text-sm text-fg-muted">{t("duties.studio.signHint")}</span>
                </form>
              ) : null}
              {j.canPost ? (
                j.components.length ? (
                  <form action={postJuryInternalAction} className="flex flex-wrap items-end gap-3">
                    <input type="hidden" name="juryId" value={j.id} />
                    <SelectField name="componentId" label={t("duties.studio.fieldComponent")} required className="w-64">
                      {j.components.map((k) => (
                        <option key={k.id} value={k.id}>{`${k.name} (${k.maxMarks})`}</option>
                      ))}
                    </SelectField>
                    <Button type="submit" variant="secondary">{t("duties.studio.post")}</Button>
                  </form>
                ) : (
                  <p className="text-sm text-fg-muted">{t("duties.studio.noComponents")}</p>
                )
              ) : null}
            </section>
          ))}
        </CardBody>
      </Card>

      {d.studios.length === 0 ? (
        <EmptyState icon={<PaletteIcon weight="duotone" className="size-6" />} title={t("duties.studio.noStudiosMine")} description={t("duties.studio.noStudiosMineBody")} />
      ) : (
        d.studios.map((s) => (
          <StudioCard key={s.id} s={s} t={t} locale={locale}>
            <p className="text-sm text-fg-muted">
              {t("duties.studio.mineLine", {
                roles: [s.mine.teaches ? t("duties.studio.roleTeaches") : null, s.mine.coordinates ? t("duties.studio.roleCoordinates") : null, s.mine.juror ? t("duties.studio.roleJuror") : null, s.mine.heads ? t("duties.studio.roleHeads") : null].filter(Boolean).join(", "),
              })}
            </p>
          </StudioCard>
        ))
      )}
    </div>
  );
}
