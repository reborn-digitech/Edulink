import type { Metadata } from "next";
import { ClockCounterClockwiseIcon, FolderUserIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { pupilRecordFor } from "@/lib/pupil-records";
import { familyRecordChanges } from "@/lib/record-changes";
import { FILING_FORM_FIELDS, OPTIONAL_RECORD_FIELDS, REQUIRED_RECORD_FIELDS } from "@/lib/certificate-rules";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { PupilRecordForm } from "@/components/pupil-record-form";
import { RecordChangePanel } from "@/components/record-change-panel";
import { PupilRecordPenChange } from "@/components/pupil-record-pen-change";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("pupilRecord.metaTitle"), robots: { index: false, follow: false } };
}

/** The pupil's own record, read and not written, with what they or their family have asked the office to change. */
export default async function StudentRecordPage() {
  const ctx = await requireRole("STUDENT");
  const t = await getT();
  const [view, changes] = await Promise.all([pupilRecordFor(ctx, ctx.membershipId), familyRecordChanges(ctx, ctx.membershipId)]);
  const fieldLabel = (f: string) => t(`pupilRecord.${f}` as TranslationKey);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title={t("pupilRecord.title")}
        description={[view.studentName, view.className].filter(Boolean).join(" · ")}
        meta={view.complete ? <Badge tone="ok" size="sm">{t("pupilRecord.complete")}</Badge> : <Badge tone="warn" size="sm">{t("pupilRecord.incomplete", { count: view.missing.length })}</Badge>}
        back={{ href: "/student", label: t("nav.today") }}
        // The identity card, a PDF drawn from the record on every read (5 Oct 2026, id-card.ts).
        actions={
          <Button asChild variant="secondary" size="sm">
            <a href="/api/v1/id-cards/pdf" target="_blank" rel="noreferrer">
              {t("collegeDesks.idCardDownload")}
            </a>
          </Button>
        }
      />
      {changes.items.length > 0 && (
        <Card data-testid="record-changes">
          <CardHeader icon={<ClockCounterClockwiseIcon weight="duotone" className="size-5" />} title={t(changes.pending > 0 ? "recordChanges.waitingTitle" : "recordChanges.earlier")} />
          <CardBody>
            <ul className="divide-y divide-border">
              {changes.items.slice(0, 5).map((change) => (
                <li key={change.id} className="py-3 first:pt-0 last:pb-0">
                  <RecordChangePanel change={change} />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}
      <Card>
        <CardHeader
          icon={<FolderUserIcon weight="duotone" className="size-5" />}
          title={t("pupilRecord.studentIntro")}
          description={view.missing.length > 0 ? t("pupilRecord.missingList", { fields: view.missing.map(fieldLabel).join(", ") }) : undefined}
        />
        <CardBody>
          <PupilRecordForm key={`${view.record?.updatedAt ?? "new"}-${view.change?.id ?? "none"}`} view={view} required={[...REQUIRED_RECORD_FIELDS]} optional={[...OPTIONAL_RECORD_FIELDS]} filing={[...FILING_FORM_FIELDS]} />
        </CardBody>
      </Card>
      {/* A correction to the pupil's PEN, read only: the pupil is told where it stands, the guardian decides. */}
      <PupilRecordPenChange view={view} role="STUDENT" />
    </div>
  );
}
