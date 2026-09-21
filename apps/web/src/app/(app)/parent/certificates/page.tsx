import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, CertificateIcon } from "@phosphor-icons/react/ssr";
import { requireParent } from "@/lib/tenancy";
import { listContexts } from "@/lib/session";
import { familyCertificates } from "@/lib/certificates";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { FamilyCertificateList } from "@/components/certificates/family-list";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("certificates.myTitle"), robots: { index: false, follow: false } };
}

/** Every child's certificates on one page: the guardian downloads the PDF from here. */
export default async function ParentCertificatesPage() {
  const session = await requireParent();
  const t = await getT();
  const [{ children }, { items }] = await Promise.all([listContexts(session.user.id), familyCertificates(session)]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link href="/parent" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("parent.overview")}
      </Link>
      <PageHeader title={t("certificates.myTitle")} description={t("certificates.myIntro")} />
      <Card>
        <CardHeader icon={<CertificateIcon weight="duotone" className="size-5" />} title={t("certificates.title")} />
        <CardBody>
          <FamilyCertificateList items={items} showPupil={children.length > 1} from="/parent/certificates" />
        </CardBody>
      </Card>
    </div>
  );
}
