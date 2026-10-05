import type { Metadata } from "next";
import { FACULTY_APPOINTMENTS, FACULTY_DESIGNATIONS, FACULTY_QUALIFICATIONS } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { facultyRecords } from "@/lib/iqac";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckboxField, DateField, SelectField, TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { IqacFlash, keyed } from "@/components/iqac/parts";
import { saveFacultyRecordAction } from "../../iqac/actions";
import { ActionForm } from "@/components/ui/action-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("iqac.facultyRecordsTitle"), robots: { index: false, follow: false } };
}

/**
 * Faculty records (module IQAC, 4 Oct 2026): what NAAC, NIRF and AICTE count
 * about each teacher, beside the school's staff record. The office writes;
 * the principal and the IQAC read. The PAN is typed once and sealed, shown by
 * its last four, and never logged.
 */
export default async function FacultyRecordsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL", "IQAC");
  const t = await getT();
  const tt = keyed(t);
  const { ok, error } = await searchParams;
  const kind = await institutionKindOf(ctx.schoolId);
  if (!(await isModuleOn(ctx.schoolId, "IQAC"))) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("iqac.facultyRecordsTitle")} />
        <ModuleOff module="IQAC" t={t} college={isCollegeKind(kind)} />
      </div>
    );
  }
  const r = await facultyRecords(ctx);
  const back = "/admin/faculty-records";
  return (
    <div className="space-y-5">
      <PageHeader title={t("iqac.facultyRecordsTitle")} description={[t("iqac.facultyRecordsIntro"), " ", t("iqac.ratioLine", { students: r.ratio.students, fullTime: r.ratio.fullTime })].join("")} />
      <IqacFlash ok={ok} error={error} />
      {r.items.length === 0 ? <EmptyState title={t("iqac.noFaculty")} /> : null}
      {r.items.map((p) => (
        <Card key={p.membershipId} data-testid={`faculty-${p.membershipId}`}>
          <CardHeader
            title={p.name}
            description={[(p.designation ? tt("iqac.designation." + p.designation) : p.role), " · ", t("iqac.apiScore", { score: p.apiScore }), " · ", t("iqac.countsLine", { fdps: p.fdps, publications: p.publications }), (p.panLast4 ? ` · ${t("iqac.panOnFile", { last4: p.panLast4 })}` : "")].join("")}
            action={p.complete ? undefined : <Badge tone="warn">{t("iqac.incomplete")}</Badge>}
          />
          {r.canEdit ? (
            <CardBody>
              <ActionForm action={saveFacultyRecordAction} className="grid gap-3 sm:grid-cols-3">
                <input type="hidden" name="back" value={back} />
                <input type="hidden" name="membershipId" value={p.membershipId} />
                <SelectField name="designation" label={t("iqac.designationField")} defaultValue={p.designation ?? "ASSISTANT_PROFESSOR"}>
                  {FACULTY_DESIGNATIONS.map((k) => (
                    <option key={k} value={k}>
                      {tt("iqac.designation." + k)}
                    </option>
                  ))}
                </SelectField>
                <SelectField name="appointment" label={t("iqac.appointmentField")} defaultValue={p.appointment ?? "REGULAR"}>
                  {FACULTY_APPOINTMENTS.map((k) => (
                    <option key={k} value={k}>
                      {tt("iqac.appointment." + k)}
                    </option>
                  ))}
                </SelectField>
                <SelectField name="highestQualification" label={t("iqac.qualificationField")} defaultValue={p.highestQualification ?? "PG"}>
                  {FACULTY_QUALIFICATIONS.map((k) => (
                    <option key={k} value={k}>
                      {tt("iqac.qualification." + k)}
                    </option>
                  ))}
                </SelectField>
                <CheckboxField name="netSetQualified" label={t("iqac.netSetField")} defaultChecked={p.netSetQualified} />
                <TextField name="experienceBeforeYears" type="number" min={0} max={60} step="any" label={t("iqac.experienceBeforeField")} defaultValue={p.experienceBeforeYears} />
                <DateField name="joinedOn" label={t("iqac.joinedOnField")} defaultValue={p.joinedOn ?? ""} />
                <TextField name="apaarFacultyId" maxLength={40} label={t("iqac.apaarField")} defaultValue={p.apaarFacultyId ?? ""} />
                <TextField name="pan" maxLength={10} autoComplete="off" label={t("iqac.panField")} hint={t("iqac.panHint")} />
                <TextField name="apiTeaching" type="number" min={0} max={1000} step="any" label={t("iqac.apiTeaching")} defaultValue={p.apiScoreInputs.teaching} />
                <TextField name="apiResearch" type="number" min={0} max={1000} step="any" label={t("iqac.apiResearch")} defaultValue={p.apiScoreInputs.research} />
                <TextField name="apiService" type="number" min={0} max={1000} step="any" label={t("iqac.apiService")} defaultValue={p.apiScoreInputs.service} />
                <div className="sm:col-span-3">
                  <Button type="submit" size="sm">
                    {t("iqac.saveRecord")}
                  </Button>
                </div>
              </ActionForm>
            </CardBody>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
