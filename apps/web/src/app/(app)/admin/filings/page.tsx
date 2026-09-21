import type { Metadata } from "next";
import Link from "next/link";
import { DownloadSimpleIcon, IdentificationCardIcon, ListChecksIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { FILING_KINDS, type FilingKind } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { filingsView } from "@/lib/filings";
import { officeRecords } from "@/lib/pupil-records";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";
import { AskFamiliesButton } from "../records/ask-button";
import { IdentityForm } from "./identity-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("filings.metaTitle") };
}

/** The teacher profile's field → the words for it; joinedOn is the desk's own field, the rest the filing's. */
const STAFF_FIELD_KEY: Record<string, TranslationKey> = {
  gender: "staff.filingGender",
  socialCategory: "staff.filingSocialCategory",
  academicQualification: "staff.filingAcademic",
  professionalQualification: "staff.filingProfessional",
  appointmentType: "staff.filingAppointment",
  joinedOn: "staff.joinedOn",
};

/** The five sheets: the three UDISE+ ones need nothing; the two board ones are cut for a grade. */
const SHEETS: { kind: FilingKind; titleKey: TranslationKey; bodyKey: TranslationKey; byGrade: boolean }[] = [
  { kind: "udise-students", titleKey: "filings.udiseStudents", bodyKey: "filings.udiseStudentsBody", byGrade: false },
  { kind: "udise-enrolment", titleKey: "filings.udiseEnrolment", bodyKey: "filings.udiseEnrolmentBody", byGrade: false },
  { kind: "udise-teachers", titleKey: "filings.udiseTeachers", bodyKey: "filings.udiseTeachersBody", byGrade: false },
  { kind: "cbse-candidates", titleKey: "filings.cbseCandidates", bodyKey: "filings.cbseCandidatesBody", byGrade: true },
  { kind: "msbshse-candidates", titleKey: "filings.msbshseCandidates", bodyKey: "filings.msbshseCandidatesBody", byGrade: true },
];

/**
 * The office's filings page: what the portals know the school as, who is
 * ready to be filed and who is not, and the five sheets as downloads. The
 * principal reads it — the identity disabled, the download buttons gone —
 * because the library refuses them the save and the exports, and a page
 * should not offer what the next click will refuse.
 */
export default async function FilingsPage() {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const canEdit = ctx.role === "ADMIN";
  const [view, records] = await Promise.all([filingsView(ctx), officeRecords(ctx, false)]);
  const filingIds = records.rows.filter((r) => r.missingForFiling.length > 0).map((r) => r.studentMembershipId);
  const pupilMissing = Object.entries(view.pupils.missing).sort((a, b) => b[1] - a[1]);
  const staffMissing = Object.entries(view.staff.missing).sort((a, b) => b[1] - a[1]);
  const sheets = SHEETS.filter((s) => (FILING_KINDS as readonly string[]).includes(s.kind));

  return (
    <div className="space-y-6">
      <PageHeader title={t("filings.title")} description={t("filings.intro")} meta={view.academicYearName ? <span className="text-sm text-fg-muted">{t("filings.year", { name: view.academicYearName })}</span> : undefined} />

      {/* ---- identity ---- */}
      <Card>
        <CardHeader icon={<IdentificationCardIcon weight="duotone" className="size-5" />} title={t("filings.identityTitle")} description={t("filings.identityIntro")} />
        <CardBody>
          <IdentityForm key={JSON.stringify(view.identity)} identity={view.identity} missing={view.identityMissing} canEdit={canEdit} />
        </CardBody>
      </Card>

      {/* ---- readiness ---- */}
      <Card>
        <CardHeader
          icon={<ListChecksIcon weight="duotone" className="size-5" />}
          title={t("filings.readinessTitle")}
          action={
            <span className="flex flex-wrap items-center gap-2">
              <Button asChild variant="secondary" size="sm">
                <Link href="/admin/records?missing=filing">{t("filings.openRecords")}</Link>
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href="/admin/people?role=TEACHER">{t("filings.openStaff")}</Link>
              </Button>
              <AskFamiliesButton membershipIds={filingIds} label={t("filings.askFamilies")} disabled={filingIds.length === 0} />
            </span>
          }
        />
        <CardBody className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <StatTile label={t("filings.pupilsReady", { ready: view.pupils.ready, total: view.pupils.total })} value={`${view.pupils.ready}/${view.pupils.total}`} tone={view.pupils.total > 0 && view.pupils.ready === view.pupils.total ? "ok" : "warn"} icon={<UsersThreeIcon weight="duotone" className="size-5" />} />
            <StatTile label={t("filings.staffReady", { ready: view.staff.ready, total: view.staff.total })} value={`${view.staff.ready}/${view.staff.total}`} tone={view.staff.total > 0 && view.staff.ready === view.staff.total ? "ok" : "warn"} icon={<UsersThreeIcon weight="duotone" className="size-5" />} />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-fg">{t("filings.pupilsMissing")}</h3>
              {pupilMissing.length === 0 ? (
                <p className="mt-1 text-sm text-fg-muted">—</p>
              ) : (
                <ul className="mt-1 divide-y divide-border text-sm" data-testid="filings-pupils-missing">
                  {pupilMissing.map(([field, count]) => (
                    <li key={field} className="flex items-center justify-between gap-3 py-1.5">
                      <span className="text-fg">{t(`pupilRecord.${field}` as TranslationKey)}</span>
                      <span className="tabular-nums font-semibold text-fg">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-xs text-fg-muted">{t("filings.withoutLocalName", { count: view.pupils.withoutLocalName })}</p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-fg">{t("filings.staffMissing")}</h3>
              {staffMissing.length === 0 ? (
                <p className="mt-1 text-sm text-fg-muted">—</p>
              ) : (
                <ul className="mt-1 divide-y divide-border text-sm" data-testid="filings-staff-missing">
                  {staffMissing.map(([field, count]) => (
                    <li key={field} className="flex items-center justify-between gap-3 py-1.5">
                      <span className="text-fg">{t(STAFF_FIELD_KEY[field] ?? (`staff.${field}` as TranslationKey))}</span>
                      <span className="tabular-nums font-semibold text-fg">{count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* ---- the sheets ---- */}
      <Card>
        <CardHeader icon={<DownloadSimpleIcon weight="duotone" className="size-5" />} title={t("filings.sheetsTitle")} description={t("filings.sheetsIntro")} />
        <CardBody className="space-y-2">
          {!canEdit && <p className="text-sm text-fg-muted">{t("filings.downloadsAdminOnly")}</p>}
          <ul className="divide-y divide-border" data-testid="filings-sheets">
            {sheets.map((sheet) => (
              <li key={sheet.kind} className="flex flex-wrap items-end justify-between gap-3 py-4">
                <div className="min-w-0 flex-1 basis-64">
                  <p className="font-semibold text-fg">{t(sheet.titleKey)}</p>
                  <p className="mt-0.5 text-sm text-fg-muted">{t(sheet.bodyKey)}</p>
                </div>
                {canEdit && (
                  sheet.byGrade && view.grades.length === 0 ? (
                    <p className="text-sm text-fg-muted">{t("filings.noGrades")}</p>
                  ) : (
                    <form action={`/admin/filings/export/${sheet.kind}`} method="get" className="flex flex-wrap items-end gap-2" data-testid={`filings-export-${sheet.kind}`}>
                      {sheet.byGrade && (
                        <label className="block text-sm">
                          <span className="mb-1 block font-medium text-fg">{t("filings.grade")}</span>
                          <select name="grade" required className="rounded-lg border border-border bg-surface px-3 py-2 text-fg">
                            {view.grades.map((g) => (
                              <option key={g.gradeLevel} value={g.gradeLevel}>
                                {g.gradeLevel} · {g.pupils}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                      <Button type="submit" variant="secondary" size="sm" icon={<DownloadSimpleIcon weight="bold" />}>
                        {t("filings.downloadCsv")}
                      </Button>
                      <Button type="submit" name="format" value="xlsx" variant="secondary" size="sm" icon={<DownloadSimpleIcon weight="bold" />}>
                        {t("filings.downloadXlsx")}
                      </Button>
                    </form>
                  )
                )}
              </li>
            ))}
          </ul>
          {canEdit && view.grades.length === 0 && (
            <EmptyState className="border-0 bg-transparent py-4" title={t("filings.noGrades")} description={t("filings.noGradesBody")} />
          )}
          <p className="text-xs text-fg-muted">{t("filings.codesNote")}</p>
        </CardBody>
      </Card>
    </div>
  );
}
