import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SealCheckIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { pupilRecordFor } from "@/lib/pupil-records";
import { FILING_FORM_FIELDS, OPTIONAL_RECORD_FIELDS, REQUIRED_RECORD_FIELDS } from "@/lib/certificate-rules";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { PersonLink } from "@/components/person-link";
import { PupilRecordForm } from "@/components/pupil-record-form";
import { PupilRecordPenChange } from "@/components/pupil-record-pen-change";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("pupilRecord.metaTitle") };
}

/** One pupil's record as the office sees and corrects it, with the door to issuing a certificate from it. */
export default async function OfficePupilRecordPage({ params }: { params: Promise<{ membershipId: string }> }) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const { membershipId } = await params;
  let view;
  try {
    view = await pupilRecordFor(ctx, membershipId);
  } catch {
    notFound();
  }
  const fieldLabel = (f: string) => t(`pupilRecord.${f}` as TranslationKey);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title={<PersonLink membershipId={view.studentMembershipId} name={view.studentName} />}
        description={[view.className, view.studentCode].filter(Boolean).join(" · ") || t("pupilRecord.intro")}
        meta={view.complete ? <Badge tone="ok" size="sm">{t("pupilRecord.complete")}</Badge> : <Badge tone="warn" size="sm">{t("pupilRecord.incomplete", { count: view.missing.length })}</Badge>}
        back={{ href: "/admin/records", label: t("pupilRecord.officeTitle") }}
        actions={
          <Button asChild size="sm" icon={<SealCheckIcon weight="bold" />}>
            <Link href={`/admin/certificates/issue?membershipId=${view.studentMembershipId}`}>{t("certificates.issueFor")}</Link>
          </Button>
        }
      />
      <Card>
        <CardHeader
          title={t("pupilRecord.title")}
          description={
            <>
              {view.missing.length > 0 ? t("pupilRecord.missingList", { fields: view.missing.map(fieldLabel).join(", ") }) : t("pupilRecord.intro")}
              {view.missingForFiling.length > 0 && (
                <>
                  <br />
                  <span data-testid="record-missing-filing">{t("filings.missingFilingList", { fields: view.missingForFiling.map(fieldLabel).join(", ") })}</span>
                </>
              )}
            </>
          }
        />
        <CardBody>
          <PupilRecordForm key={view.record?.updatedAt ?? "new"} view={view} required={[...REQUIRED_RECORD_FIELDS]} optional={[...OPTIONAL_RECORD_FIELDS]} filing={[...FILING_FORM_FIELDS]} admin={ctx.role === "ADMIN"} />
        </CardBody>
      </Card>
      {/* The PEN correction: the admin's door to proposing one, or the pending one the head decides here. */}
      <PupilRecordPenChange view={view} role={ctx.role === "ADMIN" ? "ADMIN" : "PRINCIPAL"} />
    </div>
  );
}
