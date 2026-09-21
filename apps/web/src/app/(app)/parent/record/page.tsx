import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, FolderUserIcon } from "@phosphor-icons/react/ssr";
import { requireParent } from "@/lib/tenancy";
import { listContexts } from "@/lib/session";
import { pupilRecordFor } from "@/lib/pupil-records";
import { FILING_FORM_FIELDS, OPTIONAL_RECORD_FIELDS, REQUIRED_RECORD_FIELDS } from "@/lib/certificate-rules";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { PupilRecordForm } from "@/components/pupil-record-form";
import { ChildSwitcher } from "../child-switcher";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/dictionary";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("pupilRecord.metaTitle"), robots: { index: false, follow: false } };
}

/**
 * The guardian's side of the pupil record: the child in the switcher, the
 * form the school's certificates are filled from. Access is the
 * guardianship: `pupilRecordFor` refuses a child who is not theirs.
 */
export default async function ParentRecordPage({ searchParams }: { searchParams: Promise<{ child?: string }> }) {
  const session = await requireParent();
  const t = await getT();
  const { child: requested } = await searchParams;

  const { children } = await listContexts(session.user.id);
  const selectedId = requested && children.some((c) => c.studentMembershipId === requested) ? requested : children[0]!.studentMembershipId;
  const view = await pupilRecordFor(session, selectedId);
  const fieldLabel = (f: string) => t(`pupilRecord.${f}` as TranslationKey);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/parent" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("parent.overview")}
      </Link>

      {children.length > 1 && <ChildSwitcher pupils={children} selectedId={selectedId} basePath="/parent/record" />}

      <PageHeader
        title={t("pupilRecord.title")}
        description={[view.studentName, view.className].filter(Boolean).join(" · ")}
        meta={view.complete ? <Badge tone="ok" size="sm">{t("pupilRecord.complete")}</Badge> : <Badge tone="warn" size="sm">{t("pupilRecord.incomplete", { count: view.missing.length })}</Badge>}
      />

      <Card>
        <CardHeader
          icon={<FolderUserIcon weight="duotone" className="size-5" />}
          title={t("pupilRecord.familyIntro")}
          description={view.missing.length > 0 ? t("pupilRecord.missingList", { fields: view.missing.map(fieldLabel).join(", ") }) : undefined}
        />
        <CardBody>
          <PupilRecordForm key={`${selectedId}-${view.record?.updatedAt ?? "new"}`} view={view} required={[...REQUIRED_RECORD_FIELDS]} optional={[...OPTIONAL_RECORD_FIELDS]} filing={[...FILING_FORM_FIELDS]} />
        </CardBody>
      </Card>
    </div>
  );
}
