import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardTextIcon, DownloadSimpleIcon } from "@phosphor-icons/react/ssr";
import { ADMISSION_QUOTAS, ADMISSION_ROUND_KINDS, CAP_SHEET_COLUMNS, COLLEGE_CATEGORIES, isCollegeKind } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { listApplications, listRounds, vacancyReport } from "@/lib/college-admissions";
import { getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { APP_STATUS_KEY, CATEGORY_KEY, Flash, Hidden, NotCollege, QUOTA_KEY, ROUND_KIND_KEY, Table } from "@/components/college-office/parts";
import { createApplicationAction, importAllotmentsAction, saveRoundAction } from "../../accounts/actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("collegeOffice.admissionsTitle") };
}

/**
 * COLLEGE ADMISSIONS (module ADMISSIONS; 4 Oct 2026): the rounds of an
 * intake with their seat matrix, the CET Cell's allotment list pasted into a
 * round, the vacancy report after it, the applications made from the list
 * (or, in a merit round, typed in), and the admission register as the
 * university inspects it. The school's own admissions pages are untouched.
 */
export default async function CollegeAdmissionsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string; round?: string }> }) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const [t, kind] = await Promise.all([getT(), institutionKindOf(ctx.schoolId)]);
  const sp = await searchParams;
  if (!isCollegeKind(kind ?? "SCHOOL")) return <NotCollege t={t} />;
  if (!(await isModuleOn(ctx.schoolId, "ADMISSIONS"))) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("collegeOffice.admissionsTitle")} />
        <ModuleOff module="ADMISSIONS" t={t} college />
      </div>
    );
  }
  const [{ rounds }, programmes] = await Promise.all([listRounds(ctx), db.programme.findMany({ where: { schoolId: ctx.schoolId, archivedAt: null }, orderBy: { code: "asc" }, select: { id: true, code: true, name: true } })]);
  const round = rounds.find((r) => r.id === sp.round) ?? rounds[0] ?? null;
  const [vacancy, apps, allotments] = round
    ? await Promise.all([vacancyReport(ctx, round.id), listApplications(ctx, { roundId: round.id }), db.capAllotment.findMany({ where: { roundId: round.id, schoolId: ctx.schoolId, applications: { none: {} } }, orderBy: { meritNumber: "asc" }, take: 300 })])
    : [null, { items: [] }, []];
  const pname = new Map(programmes.map((p) => [p.id, p.code]));
  const write = ctx.role === "ADMIN";
  const back = `/admin/college-admissions${round ? `?round=${round.id}` : ""}`;
  return (
    <div className="space-y-6">
      <PageHeader title={t("collegeOffice.admissionsTitle")} description={t("collegeOffice.admissionsIntro")} />
      <Flash ok={sp.ok} error={sp.error} />
      <Card>
        <CardHeader icon={<ClipboardTextIcon weight="duotone" className="size-5" />} title={t("collegeOffice.roundsTitle")} />
        <CardBody>
          {rounds.length === 0 ? (
            <EmptyState title={t("collegeOffice.roundsEmpty")} description={t("collegeOffice.roundsEmptyBody")} action={write ? <Button asChild size="sm"><a href="#new-round">{t("collegeOffice.roundNew")}</a></Button> : <Button asChild size="sm" variant="secondary"><Link href="/admin">{t("collegeOffice.goHome")}</Link></Button>} />
          ) : (
            <Table head={[t("collegeOffice.colRound"), t("collegeOffice.colIntake"), t("collegeOffice.colAllotments"), t("collegeOffice.colApplications"), t("collegeOffice.colAdmitted"), ""]} testId="admission-rounds">
              {rounds.map((r) => (
                <tr key={r.id} className={r.id === round?.id ? "bg-accent-soft/40" : undefined}>
                  <td className="py-2 pr-3">
                    <Link className="text-accent-strong hover:underline" href={`/admin/college-admissions?round=${r.id}`}>
                      {r.name}
                    </Link>{" "}
                    <span className="text-xs text-fg-muted">{t(ROUND_KIND_KEY(r.kind))}</span>
                  </td>
                  <td className="py-2 pr-3">{r.intakeYear}</td>
                  <td className="py-2 pr-3 tabular-nums">{r.allotments}</td>
                  <td className="py-2 pr-3 tabular-nums">{r.applications}</td>
                  <td className="py-2 pr-3 tabular-nums">{r.admitted}</td>
                  <td className="py-2">
                    <a className="inline-flex items-center gap-1 text-sm text-accent-strong hover:underline" href={`/admin/college-admissions/register?intakeYear=${r.intakeYear}`} download>
                      <DownloadSimpleIcon className="size-4" aria-hidden />
                      {t("collegeOffice.registerDownload")}
                    </a>
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </CardBody>
      </Card>
      {round && vacancy ? (
        <Card>
          <CardHeader title={t("collegeOffice.vacancyTitle", { round: round.name })} />
          <CardBody>
            <Table head={[t("collegeOffice.colCategory"), t("collegeOffice.colSeats"), t("collegeOffice.colAdmitted"), t("collegeOffice.colVacant")]} testId="vacancy">
              {vacancy.rows.map((v) => (
                <tr key={v.category}>
                  <td className="py-2 pr-3">{t(CATEGORY_KEY(v.category))}</td>
                  <td className="py-2 pr-3 tabular-nums">{v.seats}</td>
                  <td className="py-2 pr-3 tabular-nums">{v.admitted}</td>
                  <td className="py-2 pr-3 tabular-nums">{v.vacant}</td>
                </tr>
              ))}
              <tr className="font-medium">
                <td className="py-2 pr-3">{t("collegeOffice.total")}</td>
                <td className="py-2 pr-3 tabular-nums">{vacancy.totals.seats}</td>
                <td className="py-2 pr-3 tabular-nums">{vacancy.totals.admitted}</td>
                <td className="py-2 pr-3 tabular-nums">{vacancy.totals.vacant}</td>
              </tr>
            </Table>
          </CardBody>
        </Card>
      ) : null}
      {round ? (
        <Card>
          <CardHeader title={t("collegeOffice.applicationsTitle", { round: round.name })} />
          <CardBody className="space-y-5">
            {apps.items.length === 0 ? (
              <p className="text-sm text-fg-muted">{t("collegeOffice.applicationsEmpty")}</p>
            ) : (
              <Table head={["#", t("collegeOffice.colName"), t("collegeOffice.colProgramme"), t("collegeOffice.colCategory"), t("collegeOffice.colQuota"), t("collegeOffice.colStatus")]} testId="college-applications">
                {apps.items.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2 pr-3 tabular-nums">{a.number}</td>
                    <td className="py-2 pr-3">
                      <Link className="text-accent-strong hover:underline" href={`/admin/college-admissions/${a.id}`}>
                        {a.applicantName}
                      </Link>
                    </td>
                    <td className="py-2 pr-3">{pname.get(a.programmeId) ?? "—"}</td>
                    <td className="py-2 pr-3">{t(CATEGORY_KEY(a.category))}</td>
                    <td className="py-2 pr-3">{t(QUOTA_KEY(a.quota))}</td>
                    <td className="py-2 pr-3">
                      <Badge tone={a.status === "ADMITTED" ? "ok" : a.status === "CANCELLED" || a.status === "REFUNDED" ? "danger" : "warn"}>{t(APP_STATUS_KEY(a.status))}</Badge>
                    </td>
                  </tr>
                ))}
              </Table>
            )}
            {write && allotments.length > 0 ? (
              <div>
                <h3 className="mb-2 text-sm font-semibold">{t("collegeOffice.allotmentsWaiting")}</h3>
                <Table head={[t("collegeOffice.colCetId"), t("collegeOffice.colName"), t("collegeOffice.colCategory"), t("collegeOffice.colMerit"), ""]}>
                  {allotments.map((r) => (
                    <tr key={r.id}>
                      <td className="py-2 pr-3">{r.cetApplicationId}</td>
                      <td className="py-2 pr-3">{r.applicantName}</td>
                      <td className="py-2 pr-3">{t(CATEGORY_KEY(r.category))}</td>
                      <td className="py-2 pr-3 tabular-nums">{r.meritNumber ?? "—"}</td>
                      <td className="py-2">
                        <form action={createApplicationAction} className="flex flex-wrap items-end gap-2">
                          <Hidden fields={{ back, roundId: round.id, capAllotmentId: r.id }} />
                          {!r.programmeId ? (
                            <SelectField name="programmeId" required label={t("collegeOffice.colProgramme")}>
                              {programmes.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.code}
                                </option>
                              ))}
                            </SelectField>
                          ) : null}
                          <Button type="submit" size="sm">{t("collegeOffice.makeApplication")}</Button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </Table>
              </div>
            ) : null}
            {write && round.status === "OPEN" ? (
              <div className="grid gap-5 lg:grid-cols-2">
                <form action={importAllotmentsAction} className="space-y-3">
                  <Hidden fields={{ back, roundId: round.id }} />
                  <TextAreaField name="text" required rows={6} label={t("collegeOffice.importLabel")} hint={t("collegeOffice.importHint", { columns: CAP_SHEET_COLUMNS.join(", ") })} />
                  <Button type="submit" variant="secondary">{t("collegeOffice.importButton")}</Button>
                </form>
                {round.kind === "MERIT" || round.kind === "INSTITUTE" ? (
                  <form action={createApplicationAction} className="grid gap-3 sm:grid-cols-2">
                    <Hidden fields={{ back, roundId: round.id }} />
                    <TextField name="applicantName" required minLength={2} label={t("collegeOffice.colName")} />
                    <SelectField name="programmeId" required label={t("collegeOffice.colProgramme")}>
                      {programmes.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.code} · {p.name}
                        </option>
                      ))}
                    </SelectField>
                    <SelectField name="category" required label={t("collegeOffice.colCategory")}>
                      {COLLEGE_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {t(CATEGORY_KEY(c))}
                        </option>
                      ))}
                    </SelectField>
                    <SelectField name="quota" required label={t("collegeOffice.colQuota")}>
                      {ADMISSION_QUOTAS.map((q) => (
                        <option key={q} value={q}>
                          {t(QUOTA_KEY(q))}
                        </option>
                      ))}
                    </SelectField>
                    <TextField name="meritRank" type="number" min={1} label={t("collegeOffice.colMerit")} />
                    <TextField name="birthdateKey" type="date" label={t("collegeOffice.dob")} />
                    <div className="sm:col-span-2">
                      <Button type="submit">{t("collegeOffice.makeApplication")}</Button>
                    </div>
                  </form>
                ) : null}
              </div>
            ) : null}
          </CardBody>
        </Card>
      ) : null}
      {write ? (
        <Card id="new-round">
          <CardHeader title={t("collegeOffice.roundNew")} />
          <CardBody>
            <form action={saveRoundAction} className="grid gap-4 sm:grid-cols-3">
              <Hidden fields={{ back }} />
              <TextField name="name" required minLength={2} label={t("collegeOffice.roundName")} />
              <SelectField name="kind" required label={t("collegeOffice.roundKind")}>
                {ADMISSION_ROUND_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {t(ROUND_KIND_KEY(k))}
                  </option>
                ))}
              </SelectField>
              <TextField name="intakeYear" type="number" min={2000} max={2100} required defaultValue={new Date().getUTCFullYear()} label={t("collegeOffice.colIntake")} />
              <SelectField name="programmeId" label={t("collegeOffice.colProgramme")}>
                <option value="">{t("collegeOffice.everyProgramme")}</option>
                {programmes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} · {p.name}
                  </option>
                ))}
              </SelectField>
              <TextField name="opensOn" type="date" required label={t("collegeOffice.opensOn")} />
              <TextField name="closesOn" type="date" required label={t("collegeOffice.closesOn")} />
              <fieldset className="grid gap-3 sm:col-span-3 sm:grid-cols-5">
                <legend className="mb-1 text-sm font-medium">{t("collegeOffice.seatMatrix")}</legend>
                {COLLEGE_CATEGORIES.map((c) => (
                  <TextField key={c} name={`seat_${c}`} type="number" min={0} max={5000} label={t(CATEGORY_KEY(c))} />
                ))}
              </fieldset>
              <div className="sm:col-span-3">
                <Button type="submit">{t("collegeOffice.roundSave")}</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
