import type { Metadata } from "next";
import { BookOpenIcon, BusIcon, CalendarIcon, HouseLineIcon } from "@phosphor-icons/react/ssr";
import { isCollegeKind, LIBRARY_ERESOURCE_KINDS } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { enabledModules, institutionKindOf } from "@/lib/modules";
import { collegeLibrarySettings, hostelTable, libraryTable, listEResources } from "@/lib/college-campus";
import { getLocale, getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckboxField, SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { Flash, Hidden, NotCollege, Table, money } from "@/components/college-office/parts";
import { calendarImportAction, collegeLibrarySettingsAction, eResourceAction, hostelRulesAction, messBillAction, routeCollegeAction, routeFeesAction } from "../../accounts/actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("collegeOffice.campusTitle") };
}

const hhmm = (minute: number) => `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

/**
 * THE LIBRARY, THE HOSTEL AND THE BUS AT A COLLEGE (4 Oct 2026), the office's
 * settings for each module the college has on: borrowing terms for faculty
 * and students and the book bank; e-resources; each hostel's curfew,
 * night-outs and mess charge, and the month's mess bill; each route as a
 * fixed route or a campus loop with its fee per term, and the term's route
 * fees; the university's calendar pasted in; the criterion 4 and 5 numbers.
 */
export default async function CollegeCampusPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const [t, locale, kind, modules] = await Promise.all([getT(), getLocale(), institutionKindOf(ctx.schoolId), enabledModules(ctx.schoolId)]);
  const sp = await searchParams;
  if (!isCollegeKind(kind ?? "SCHOOL")) return <NotCollege t={t} />;
  const library = modules.includes("LIBRARY");
  const hostel = modules.includes("HOSTEL");
  const transport = modules.includes("TRANSPORT");
  const [terms, eres, lt, hostels, ht, routes] = await Promise.all([
    library ? collegeLibrarySettings(ctx) : null,
    library ? listEResources(ctx) : null,
    library ? libraryTable(ctx.schoolId) : null,
    hostel ? db.hostel.findMany({ where: { schoolId: ctx.schoolId }, orderBy: { name: "asc" }, select: { id: true, name: true, curfewMinute: true, nightOutAllowed: true, messMonthlyPaise: true } }) : [],
    hostel ? hostelTable(ctx.schoolId) : null,
    transport ? db.transportRoute.findMany({ where: { schoolId: ctx.schoolId, active: true }, orderBy: { name: "asc" }, select: { id: true, name: true, kind: true, feePerTermPaise: true } }) : [],
  ]);
  const write = ctx.role === "ADMIN";
  const back = "/admin/college-campus";
  return (
    <div className="space-y-6">
      <PageHeader title={t("collegeOffice.campusTitle")} description={t("collegeOffice.campusIntro")} />
      <Flash ok={sp.ok} error={sp.error} />
      {library && terms && eres && lt ? (
        <Card>
          <CardHeader icon={<BookOpenIcon weight="duotone" className="size-5" />} title={t("collegeOffice.libraryTitle")} />
          <CardBody className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <StatTile label={t("collegeOffice.ltTitles")} value={lt.titles} />
              <StatTile label={t("collegeOffice.ltPeriodicals")} value={lt.periodicals} />
              <StatTile label={t("collegeOffice.ltEResources")} value={lt.eResources} hint={t("collegeOffice.ltOpens", { n: lt.eResourceClicks })} />
              <StatTile label={t("collegeOffice.ltIssues", { year: lt.academicYear })} value={lt.issues} hint={t("collegeOffice.ltPerStudent", { n: lt.issuesPerStudent })} />
              <StatTile label={t("collegeOffice.ltSpend")} value={money(lt.expenditurePaise, locale)} />
            </div>
            <form action={collegeLibrarySettingsAction} className="grid gap-3 sm:grid-cols-5">
              <Hidden fields={{ back }} />
              <fieldset disabled={!write} className="contents">
                <TextField name="facultyLimit" type="number" min={0} max={50} required label={t("collegeOffice.facultyLimit")} defaultValue={terms.facultyLimit} />
                <TextField name="facultyLoanDays" type="number" min={1} max={365} required label={t("collegeOffice.facultyLoanDays")} defaultValue={terms.facultyLoanDays} />
                <TextField name="collegeStudentLimit" type="number" min={0} max={30} required label={t("collegeOffice.studentLimit")} defaultValue={terms.collegeStudentLimit} />
                <TextField name="collegeStudentLoanDays" type="number" min={1} max={180} required label={t("collegeOffice.studentLoanDays")} defaultValue={terms.collegeStudentLoanDays} />
                <TextField name="bookBankExtra" type="number" min={0} max={20} required label={t("collegeOffice.bookBank")} hint={t("collegeOffice.bookBankHint")} defaultValue={terms.bookBankExtra} />
                {write ? (
                  <div className="sm:col-span-5">
                    <Button type="submit" variant="secondary">{t("collegeOffice.save")}</Button>
                  </div>
                ) : null}
              </fieldset>
            </form>
            <Table head={[t("collegeOffice.eResource"), t("collegeOffice.colKind"), t("collegeOffice.colOpens")]} testId="eresources">
              {eres.items.map((e) => (
                <tr key={e.id}>
                  <td className="py-2 pr-3">
                    <a className="text-accent-strong hover:underline" href={e.url} target="_blank" rel="noreferrer">
                      {e.name}
                    </a>
                  </td>
                  <td className="py-2 pr-3">{t(`collegeOffice.ekind${e.kind}`)}</td>
                  <td className="py-2 pr-3 tabular-nums">{e.clicks}</td>
                </tr>
              ))}
            </Table>
            {write ? (
              <form action={eResourceAction} className="grid gap-3 sm:grid-cols-4">
                <Hidden fields={{ back }} />
                <TextField name="name" required minLength={2} label={t("collegeOffice.eResource")} />
                <TextField name="url" type="url" required label={t("collegeOffice.link")} />
                <SelectField name="kind" required label={t("collegeOffice.colKind")}>
                  {LIBRARY_ERESOURCE_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {t(`collegeOffice.ekind${k}`)}
                    </option>
                  ))}
                </SelectField>
                <div className="flex items-end">
                  <Button type="submit" variant="secondary">{t("collegeOffice.add")}</Button>
                </div>
              </form>
            ) : null}
          </CardBody>
        </Card>
      ) : null}
      {hostel && ht ? (
        <Card>
          <CardHeader icon={<HouseLineIcon weight="duotone" className="size-5" />} title={t("collegeOffice.hostelTitle")} />
          <CardBody className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              <StatTile label={t("collegeOffice.htOccupancy")} value={`${ht.occupancyPercent} %`} hint={t("collegeOffice.htBeds", { occupied: ht.occupied, beds: ht.beds })} />
              <StatTile label={t("collegeOffice.htBoarders", { year: ht.academicYear })} value={ht.boarders} />
              <StatTile label={t("collegeOffice.htIncidents")} value={ht.incidents} />
              <StatTile label={t("collegeOffice.htRounds")} value={ht.squadRounds} hint={t("collegeOffice.htFlagged", { n: ht.flaggedRounds })} />
              <StatTile label={t("collegeOffice.htLate")} value={ht.lateReturns} />
            </div>
            {hostels.map((h) => (
              <form key={h.id} action={hostelRulesAction} className="grid gap-3 rounded-[var(--radius-md)] border border-border p-3 sm:grid-cols-4">
                <Hidden fields={{ back, hostelId: h.id }} />
                <p className="font-medium sm:col-span-4">{h.name}</p>
                <fieldset disabled={!write} className="contents">
                  <TextField name="curfew" type="time" required label={t("collegeOffice.curfew")} defaultValue={hhmm(h.curfewMinute)} />
                  <TextField name="mess" inputMode="decimal" required label={t("collegeOffice.messMonthly")} defaultValue={(h.messMonthlyPaise / 100).toFixed(2)} />
                  <CheckboxField name="nightOutAllowed" label={t("collegeOffice.nightOuts")} defaultChecked={h.nightOutAllowed} />
                  {write ? (
                    <div className="flex items-end">
                      <Button type="submit" variant="secondary" size="sm">{t("collegeOffice.save")}</Button>
                    </div>
                  ) : null}
                </fieldset>
              </form>
            ))}
            {write ? (
              <form action={messBillAction} className="flex flex-wrap items-end gap-3">
                <Hidden fields={{ back }} />
                <TextField name="month" type="month" required label={t("collegeOffice.messMonth")} />
                <Button type="submit">{t("collegeOffice.billMess")}</Button>
              </form>
            ) : null}
          </CardBody>
        </Card>
      ) : null}
      {transport ? (
        <Card>
          <CardHeader icon={<BusIcon weight="duotone" className="size-5" />} title={t("collegeOffice.transportTitle")} description={t("collegeOffice.transportIntro")} />
          <CardBody className="space-y-4">
            {routes.map((r) => (
              <form key={r.id} action={routeCollegeAction} className="grid gap-3 rounded-[var(--radius-md)] border border-border p-3 sm:grid-cols-4">
                <Hidden fields={{ back, routeId: r.id }} />
                <p className="font-medium sm:col-span-4">{r.name}</p>
                <fieldset disabled={!write} className="contents">
                  <SelectField name="kind" label={t("collegeOffice.routeKind")} defaultValue={r.kind}>
                    <option value="FIXED">{t("collegeOffice.routeFIXED")}</option>
                    <option value="LOOP">{t("collegeOffice.routeLOOP")}</option>
                  </SelectField>
                  <TextField name="fee" inputMode="decimal" label={t("collegeOffice.routeFee")} defaultValue={(r.feePerTermPaise / 100).toFixed(2)} />
                  {write ? (
                    <div className="flex items-end">
                      <Button type="submit" variant="secondary" size="sm">{t("collegeOffice.save")}</Button>
                    </div>
                  ) : null}
                </fieldset>
              </form>
            ))}
            {write ? (
              <form action={routeFeesAction} className="flex flex-wrap items-end gap-3">
                <Hidden fields={{ back }} />
                <TextField name="termLabel" required label={t("collegeOffice.termLabel")} defaultValue={t("collegeOffice.termOdd")} />
                <TextField name="dueDateKey" type="date" required label={t("collegeOffice.termDue")} />
                <Button type="submit">{t("collegeOffice.raiseRouteFees")}</Button>
              </form>
            ) : null}
          </CardBody>
        </Card>
      ) : null}
      {write ? (
        <Card>
          <CardHeader icon={<CalendarIcon weight="duotone" className="size-5" />} title={t("collegeOffice.calendarTitle")} description={t("collegeOffice.calendarIntro")} />
          <CardBody>
            <form action={calendarImportAction} className="space-y-3">
              <Hidden fields={{ back }} />
              <TextAreaField name="text" required rows={6} label={t("collegeOffice.calendarLabel")} hint={t("collegeOffice.calendarHint")} />
              <Button type="submit" variant="secondary">{t("collegeOffice.importButton")}</Button>
            </form>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
