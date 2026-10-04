import type { Metadata } from "next";
import { DRIVE_KINDS, PLACEMENT_GENDERS, ROUND_KINDS } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { db } from "@/lib/db";
import { listCompanies, placementColleges, placementSettings } from "@/lib/placement";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { DateTimeField } from "@/components/ui/date-time-field";
import { EmptyState } from "@/components/ui/states";
import { CellFrame, DRIVE_KIND_KEY, GENDER_KEY, ROUND_KIND_KEY, cellContext } from "@/components/placement/parts";
import { openDriveAction } from "../../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("placement.openDrive"), robots: { index: false, follow: false } };
}

const CHECK = "flex items-center gap-2 text-sm";

/**
 * The TPO opens a drive: the company, the package (lakh a year), the rounds
 * in order, the first date, the venue, the eligibility rule (computed against
 * the record later, never typed per student) and, for a pooled drive, the
 * guest colleges from the placement directory.
 */
export default async function NewDrivePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { ctx, t, on, college, canWrite } = await cellContext();
  const { error } = await searchParams;
  const back = { href: "/placement/drives", label: t("placement.tabDrives") };
  if (!on || !canWrite) return <CellFrame t={t} on={on} college={college} current="drives" title={t("placement.openDrive")} back={back}>{<EmptyState title={t("placement.readOnlyTitle")} description={t("placement.readOnlyBody")} />}</CellFrame>;
  const [{ companies }, colleges, settings, programmes] = await Promise.all([listCompanies(ctx), placementColleges(ctx.schoolId), placementSettings(ctx.schoolId), db.programme.findMany({ where: { schoolId: ctx.schoolId, archivedAt: null }, select: { id: true, name: true, code: true }, orderBy: { name: "asc" } })]);
  return (
    <CellFrame t={t} on college={college} current="drives" title={t("placement.openDrive")} description={t("placement.openDriveIntro")} error={error} back={back}>
      {companies.length === 0 ? (
        <EmptyState title={t("placement.needCompanyTitle")} description={t("placement.needCompanyBody")} />
      ) : (
        <form action={openDriveAction} className="space-y-5">
          <Card>
            <CardHeader title={t("placement.driveBasics")} />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <SelectField label={t("placement.fieldCompany")} name="companyId" required>
                {companies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {c.verifiedAt ? "" : ` (${t("placement.unverified")})`}
                  </option>
                ))}
              </SelectField>
              <SelectField label={t("placement.fieldKind")} name="kind" defaultValue="ON_CAMPUS">
                {DRIVE_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {t(DRIVE_KIND_KEY[k]!)}
                  </option>
                ))}
              </SelectField>
              <TextField label={t("placement.fieldTitle")} name="title" required maxLength={160} />
              <TextField label={t("placement.fieldVenues")} name="venues" maxLength={300} />
              <TextField label={t("placement.fieldPackageMin")} name="packageMin" type="number" step="0.1" min="0" required hint={t("placement.fieldPackageHint")} />
              <TextField label={t("placement.fieldPackageMax")} name="packageMax" type="number" step="0.1" min="0" required />
              <TextField label={t("placement.fieldBond")} name="bond" maxLength={300} />
              <DateTimeField label={t("placement.fieldFirstAt")} name="firstAt" defaultTime="10:00" />
              <TextAreaField label={t("placement.fieldJd")} name="jd" maxLength={6000} className="sm:col-span-2" />
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={t("placement.fieldRounds")} description={t("placement.fieldRoundsHint")} />
            <CardBody className="grid gap-3 sm:grid-cols-4">
              {[1, 2, 3, 4].map((n) => (
                <SelectField key={n} label={t("placement.roundN", { round: n })} name="roundKinds" defaultValue="">
                  <option value="">{t("placement.noRound")}</option>
                  {ROUND_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {t(ROUND_KIND_KEY[k]!)}
                    </option>
                  ))}
                </SelectField>
              ))}
            </CardBody>
          </Card>
          <Card>
            <CardHeader title={t("placement.ruleTitle")} description={t("placement.ruleIntro")} />
            <CardBody className="grid gap-4 sm:grid-cols-2">
              <TextField label={t("placement.fieldCgpaMin")} name="cgpaMin" type="number" step="0.01" min="0" max="10" />
              <TextField label={t("placement.fieldBatchYear")} name="batchYear" type="number" min="2000" max="2100" defaultValue={settings.seasonBatchYear} />
              <label className={CHECK}>
                <input type="checkbox" name="noLiveBacklogs" defaultChecked />
                {t("placement.fieldNoBacklogs")}
              </label>
              {programmes.length ? (
                <fieldset className="space-y-1 text-sm">
                  <legend className="font-medium">{t("placement.fieldProgrammes")}</legend>
                  {programmes.map((p) => (
                    <label key={p.id} className={CHECK}>
                      <input type="checkbox" name="programmeIds" value={p.id} />
                      {p.name} ({p.code})
                    </label>
                  ))}
                </fieldset>
              ) : null}
              {settings.allowGenderRule ? (
                <fieldset className="space-y-1 text-sm">
                  <legend className="font-medium">{t("placement.fieldGenders")}</legend>
                  {PLACEMENT_GENDERS.map((g) => (
                    <label key={g} className={CHECK}>
                      <input type="checkbox" name="genders" value={g} />
                      {t(GENDER_KEY[g]!)}
                    </label>
                  ))}
                </fieldset>
              ) : null}
            </CardBody>
          </Card>
          {colleges.length ? (
            <Card>
              <CardHeader title={t("placement.poolTitle")} description={t("placement.poolIntro")} />
              <CardBody className="grid gap-1 sm:grid-cols-2">
                {colleges.map((c) => (
                  <label key={c.id} className={CHECK}>
                    <input type="checkbox" name="poolSchoolIds" value={c.id} />
                    {c.name}
                    {c.city ? ` · ${c.city}` : ""}
                  </label>
                ))}
              </CardBody>
            </Card>
          ) : null}
          <Button type="submit">{t("placement.openDrive")}</Button>
        </form>
      )}
    </CellFrame>
  );
}
