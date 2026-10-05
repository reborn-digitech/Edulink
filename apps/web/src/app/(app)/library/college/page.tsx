import type { Metadata } from "next";
import { BookOpenIcon } from "@phosphor-icons/react/ssr";
import { isCollegeKind, LIBRARY_ERESOURCE_KINDS } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { libraryTable, listEResources } from "@/lib/college-campus";
import { getLocale, getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SelectField, TextAreaField, TextField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { Flash, Hidden, NotCollege, Table, money } from "@/components/college-office/parts";
import { eResourceAction, isbnImportAction } from "../../accounts/actions";
import { ActionForm } from "@/components/ui/action-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("collegeOffice.libraryTitle") };
}

/**
 * THE COLLEGE LIBRARY'S DESK EXTRAS (4 Oct 2026; the librarian and the
 * office): e-resources with their opens, a publisher's ISBN list pasted in,
 * and the year's criterion-4 numbers.
 */
export default async function LibraryCollegePage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const ctx = await requireRole("LIBRARIAN", "ADMIN", "PRINCIPAL");
  const [t, locale, kind] = await Promise.all([getT(), getLocale(), institutionKindOf(ctx.schoolId)]);
  const sp = await searchParams;
  if (!isCollegeKind(kind ?? "SCHOOL")) return <NotCollege t={t} />;
  if (!(await isModuleOn(ctx.schoolId, "LIBRARY"))) return <ModuleOff page module="LIBRARY" t={t} college />;
  const [eres, lt] = await Promise.all([listEResources(ctx), libraryTable(ctx.schoolId)]);
  const write = ctx.role !== "PRINCIPAL";
  const back = "/library/college";
  return (
    <div className="space-y-6">
      <PageHeader title={t("collegeOffice.libraryTitle")} description={t("collegeOffice.libraryIntro")} />
      <Flash ok={sp.ok} error={sp.error} />
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label={t("collegeOffice.ltTitles")} value={lt.titles} />
        <StatTile label={t("collegeOffice.ltPeriodicals")} value={lt.periodicals} />
        <StatTile label={t("collegeOffice.ltEResources")} value={lt.eResources} hint={t("collegeOffice.ltOpens", { n: lt.eResourceClicks })} />
        <StatTile label={t("collegeOffice.ltIssues", { year: lt.academicYear })} value={lt.issues} hint={t("collegeOffice.ltPerStudent", { n: lt.issuesPerStudent })} />
        <StatTile label={t("collegeOffice.ltSpend")} value={money(lt.expenditurePaise, locale)} />
      </div>
      <Card>
        <CardHeader icon={<BookOpenIcon weight="duotone" className="size-5" />} title={t("collegeOffice.eResourcesTitle")} />
        <CardBody className="space-y-4">
          <Table head={[t("collegeOffice.eResource"), t("collegeOffice.colKind"), t("collegeOffice.colOpens")]}>
            {eres.items.map((e) => (
              <tr key={e.id}>
                <td className="py-2 pr-3">{e.name}</td>
                <td className="py-2 pr-3">{t(`collegeOffice.ekind${e.kind}`)}</td>
                <td className="py-2 pr-3 tabular-nums">{e.clicks}</td>
              </tr>
            ))}
          </Table>
          {write ? (
            <ActionForm action={eResourceAction} className="grid gap-3 sm:grid-cols-4">
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
            </ActionForm>
          ) : null}
        </CardBody>
      </Card>
      {write ? (
        <Card>
          <CardHeader title={t("collegeOffice.isbnTitle")} description={t("collegeOffice.isbnIntro")} />
          <CardBody>
            <ActionForm action={isbnImportAction} className="space-y-3">
              <Hidden fields={{ back }} />
              <TextAreaField name="text" required rows={6} label={t("collegeOffice.isbnLabel")} hint={t("collegeOffice.isbnHint")} />
              <Button type="submit" variant="secondary">{t("collegeOffice.importButton")}</Button>
            </ActionForm>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
