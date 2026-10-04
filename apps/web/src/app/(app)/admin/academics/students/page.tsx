import type { Metadata } from "next";
import { IdentificationCardIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { SelectField, TextField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { NUM, TD, TH } from "@/components/module-flash";
import { OfficeTop } from "@/components/academics/parts";
import { academicsStructure, listSeats } from "@/lib/academics";
import { getT } from "@/lib/i18n/server";
import { academicsGate, one, type SearchParams } from "../shared";
import { saveSeatAction } from "../actions";
import { TableScroll } from "@/components/ui/table-scroll";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("academics.tabStudents") };
}

/** Each student's seat: programme, scheme, year and semester, division with roll number, the university's PRN. */
export default async function StudentsPage({ searchParams }: { searchParams: SearchParams }) {
  const { ctx, t, on, college, canEdit } = await academicsGate();
  if (!on) return <ModuleOff module="ACADEMICS" t={t} college={college} />;
  const params = await searchParams;
  const programmeId = one(params.programme);
  const [s, seats] = await Promise.all([academicsStructure(ctx), listSeats(ctx, { programmeId })]);
  const year = new Date().getUTCFullYear();
  return (
    <div className="space-y-6">
      <OfficeTop t={t} current="students" params={params} />
      <Card>
        <CardHeader icon={<IdentificationCardIcon weight="duotone" className="size-5" />} title={t("academics.seatsTitle")} description={t("academics.seatsBody")} />
        <CardBody className="space-y-4">
          {seats.seats.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("academics.seatsNone")} description={t("academics.seatsNoneBody")} />
          ) : (
            <TableScroll>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className={TH}>{t("academics.colStudent")}</th>
                    <th scope="col" className={TH}>{t("academics.fieldProgramme")}</th>
                    <th scope="col" className={TH}>{t("academics.fieldSemester")}</th>
                    <th scope="col" className={TH}>{t("academics.fieldDivision")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("academics.fieldRoll")}</th>
                    <th scope="col" className={TH}>{t("academics.fieldPrn")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {seats.seats.map((x) => (
                    <tr key={x.studentMembershipId}>
                      <td className={TD}>
                        <span className="font-medium text-fg">{x.name}</span> <span className="text-fg-muted">{x.studentCode ?? ""}</span>
                      </td>
                      <td className={TD}>{x.programmeCode}</td>
                      <td className={TD}>{t("academics.semesterYear", { semester: x.semester, year: x.yearOfStudy })}</td>
                      <td className={TD}>{x.divisionName ?? "—"}</td>
                      <td className={NUM}>{x.rollNumber ?? "—"}</td>
                      <td className={TD}>{x.prn ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
          {canEdit && s.programmes.length && s.schemes.length ? (
            <form action={saveSeatAction} className="grid gap-3 sm:grid-cols-3">
              <SelectField label={t("academics.colStudent")} name="studentMembershipId" required>
                {seats.unseated.map((u) => <option key={u.studentMembershipId} value={u.studentMembershipId}>{`${u.name}${u.studentCode ? ` · ${u.studentCode}` : ""}`}</option>)}
                {seats.seats.map((u) => <option key={u.studentMembershipId} value={u.studentMembershipId}>{`${u.name} · ${u.programmeCode}`}</option>)}
              </SelectField>
              <SelectField label={t("academics.fieldProgramme")} name="programmeId" required>
                {s.programmes.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}
              </SelectField>
              <SelectField label={t("academics.fieldScheme")} name="schemeId" required>
                {s.schemes.map((sc) => <option key={sc.id} value={sc.id}>{`${sc.name} · ${s.programmes.find((p) => p.id === sc.programmeId)?.code ?? ""}`}</option>)}
              </SelectField>
              <TextField label={t("academics.fieldEntryYear")} name="entryYear" type="number" min={2000} max={2100} defaultValue={year} />
              <TextField label={t("academics.fieldYearOfStudy")} name="yearOfStudy" type="number" min={1} max={6} defaultValue={1} />
              <TextField label={t("academics.fieldSemester")} name="semester" type="number" min={1} max={12} defaultValue={1} />
              <SelectField label={t("academics.fieldDivision")} name="divisionId" defaultValue="">
                <option value="">{t("academics.none")}</option>
                {s.divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </SelectField>
              <TextField label={t("academics.fieldRoll")} name="rollNumber" type="number" min={1} max={9999} />
              <TextField label={t("academics.fieldPrn")} name="prn" maxLength={20} hint={t("academics.fieldPrnHint")} />
              <div>
                <Button type="submit">{t("academics.saveSeat")}</Button>
              </div>
            </form>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
