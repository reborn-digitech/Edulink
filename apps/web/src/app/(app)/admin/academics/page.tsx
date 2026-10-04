import type { Metadata } from "next";
import { BuildingsIcon, GaugeIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { SelectField, TextField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { INPUT, NUM, TD, TH } from "@/components/module-flash";
import { OfficeTop } from "@/components/academics/parts";
import { academicsStructure } from "@/lib/academics";
import { getT } from "@/lib/i18n/server";
import { academicsGate, type SearchParams } from "./shared";
import { saveDepartmentAction, saveSettingsAction, setFacultyDepartmentAction } from "./actions";
import { TableScroll } from "@/components/ui/table-scroll";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("academics.title") };
}

/** The college's academic set-up: the dials, the departments with their heads, and which department each faculty member is in. */
export default async function AcademicsSetupPage({ searchParams }: { searchParams: SearchParams }) {
  const { ctx, t, on, college, canEdit } = await academicsGate();
  if (!on) return <ModuleOff module="ACADEMICS" t={t} college={college} />;
  const params = await searchParams;
  const s = await academicsStructure(ctx);
  const deptName = new Map(s.departments.map((d) => [d.id, d.name]));
  return (
    <div className="space-y-6">
      <OfficeTop t={t} current="setup" params={params} />
      <Card>
        <CardHeader icon={<GaugeIcon weight="duotone" className="size-5" />} title={t("academics.settingsTitle")} description={t("academics.settingsBody")} />
        <CardBody>
          <form action={saveSettingsAction} className="grid gap-3 sm:grid-cols-4">
            <TextField label={t("academics.fieldLoadMin")} name="loadMinHours" type="number" min={0} max={60} defaultValue={s.settings.loadMinHours} disabled={!canEdit} />
            <TextField label={t("academics.fieldLoadMax")} name="loadMaxHours" type="number" min={1} max={60} defaultValue={s.settings.loadMaxHours} disabled={!canEdit} />
            <TextField label={t("academics.fieldRatio")} name="studentsPerFaculty" type="number" min={1} max={200} defaultValue={s.settings.studentsPerFaculty} disabled={!canEdit} hint={t("academics.fieldRatioHint")} />
            <TextField label={t("academics.fieldMentees")} name="menteesPerMentor" type="number" min={1} max={200} defaultValue={s.settings.menteesPerMentor} disabled={!canEdit} />
            {canEdit ? (
              <div>
                <Button type="submit">{t("common.save")}</Button>
              </div>
            ) : null}
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<BuildingsIcon weight="duotone" className="size-5" />} title={t("academics.departmentsTitle")} description={t("academics.departmentsBody")} />
        <CardBody className="space-y-4">
          {s.departments.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("academics.departmentsNone")} description={t("academics.departmentsNoneBody")} />
          ) : (
            <TableScroll>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className={TH}>{t("academics.fieldCode")}</th>
                    <th scope="col" className={TH}>{t("academics.fieldName")}</th>
                    <th scope="col" className={TH}>{t("academics.fieldHod")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("academics.fieldFloor")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("academics.colFaculty")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("academics.colStudents")}</th>
                    {canEdit ? <th scope="col" className={TH}><span className="sr-only">{t("common.save")}</span></th> : null}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {s.departments.map((d) => (
                    <tr key={d.id}>
                      <td className={TD}>{canEdit ? <input form={`dept-${d.id}`} aria-label={t("academics.fieldCode")} className={`${INPUT} min-w-24`} name="code" defaultValue={d.code} required /> : d.code}</td>
                      <td className={TD}>{canEdit ? <input form={`dept-${d.id}`} aria-label={t("academics.fieldName")} className={`${INPUT} min-w-44`} name="name" defaultValue={d.name} required /> : d.name}</td>
                      <td className={TD}>
                        {canEdit ? (
                          <select form={`dept-${d.id}`} aria-label={t("academics.fieldHod")} className={`${INPUT} min-w-44`} name="hodMembershipId" defaultValue={d.hodMembershipId ?? ""}>
                            <option value="">{t("academics.none")}</option>
                            {s.faculty.map((f) => (
                              <option key={f.membershipId} value={f.membershipId}>{f.name}</option>
                            ))}
                          </select>
                        ) : (d.hodName ?? "—")}
                      </td>
                      <td className={NUM}>{canEdit ? <input form={`dept-${d.id}`} aria-label={t("academics.fieldFloor")} className={`${INPUT} min-w-20 text-right`} name="condoneFloorPercent" type="number" min={0} max={100} defaultValue={d.condoneFloorPercent} /> : `${d.condoneFloorPercent}%`}</td>
                      <td className={NUM}>{d.faculty}</td>
                      <td className={NUM}>{d.students}</td>
                      {canEdit ? (
                        <td className={TD}>
                          <form id={`dept-${d.id}`} action={saveDepartmentAction}>
                            <input type="hidden" name="id" value={d.id} />
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
          {canEdit ? (
            <form action={saveDepartmentAction} className="grid gap-3 sm:grid-cols-4">
              <TextField label={t("academics.fieldCode")} name="code" required maxLength={20} />
              <TextField label={t("academics.fieldName")} name="name" required maxLength={120} />
              <SelectField label={t("academics.fieldHod")} name="hodMembershipId" defaultValue="">
                <option value="">{t("academics.none")}</option>
                {s.faculty.map((f) => (
                  <option key={f.membershipId} value={f.membershipId}>{f.name}</option>
                ))}
              </SelectField>
              <TextField label={t("academics.fieldFloor")} name="condoneFloorPercent" type="number" min={0} max={100} defaultValue={65} hint={t("academics.fieldFloorHint")} />
              <div>
                <Button type="submit">{t("academics.addDepartment")}</Button>
              </div>
            </form>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<UsersThreeIcon weight="duotone" className="size-5" />} title={t("academics.facultyTitle")} description={t("academics.facultyBody")} />
        <CardBody>
          {s.faculty.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("academics.facultyNone")} description={t("academics.facultyNoneBody")} />
          ) : (
            <ul className="divide-y divide-border text-sm">
              {s.faculty.map((f) => (
                <li key={f.membershipId} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>
                    <span className="font-medium text-fg">{f.name}</span> <span className="text-fg-muted">· {t(f.role === "HOD" ? "role.hod" : "role.faculty")}</span>
                  </span>
                  {canEdit ? (
                    <form action={setFacultyDepartmentAction} className="flex items-center gap-2">
                      <input type="hidden" name="membershipId" value={f.membershipId} />
                      <select aria-label={t("academics.fieldDepartment")} className={INPUT} name="departmentId" defaultValue={f.departmentId ?? ""}>
                        <option value="">{t("academics.none")}</option>
                        {s.departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                      <Button type="submit" size="sm" variant="secondary">{t("common.save")}</Button>
                    </form>
                  ) : (
                    <span className="text-fg-muted">{f.departmentId ? deptName.get(f.departmentId) : "—"}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
