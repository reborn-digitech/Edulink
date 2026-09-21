import type { Metadata } from "next";
import { FolderUserIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { pupilRecordFor } from "@/lib/pupil-records";
import { OPTIONAL_RECORD_FIELDS, REQUIRED_RECORD_FIELDS } from "@/lib/certificate-rules";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { PupilRecordForm } from "@/components/pupil-record-form";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("pupilRecord.metaTitle"), robots: { index: false, follow: false } };
}

/** The pupil's own record: the same form the family fills, for the details they know themselves. */
export default async function StudentRecordPage() {
  const ctx = await requireRole("STUDENT");
  const t = await getT();
  const view = await pupilRecordFor(ctx, ctx.membershipId);
  const fieldLabel = (f: string) => t(`pupilRecord.${f}` as TranslationKey);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        title={t("pupilRecord.title")}
        description={[view.studentName, view.className].filter(Boolean).join(" · ")}
        meta={view.complete ? <Badge tone="ok" size="sm">{t("pupilRecord.complete")}</Badge> : <Badge tone="warn" size="sm">{t("pupilRecord.incomplete", { count: view.missing.length })}</Badge>}
        back={{ href: "/student", label: t("nav.today") }}
      />
      <Card>
        <CardHeader
          icon={<FolderUserIcon weight="duotone" className="size-5" />}
          title={t("pupilRecord.studentIntro")}
          description={view.missing.length > 0 ? t("pupilRecord.missingList", { fields: view.missing.map(fieldLabel).join(", ") }) : undefined}
        />
        <CardBody>
          <PupilRecordForm key={view.record?.updatedAt ?? "new"} view={view} required={[...REQUIRED_RECORD_FIELDS]} optional={[...OPTIONAL_RECORD_FIELDS]} />
        </CardBody>
      </Card>
    </div>
  );
}
