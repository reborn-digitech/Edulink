import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, CertificateIcon, EnvelopeOpenIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react/ssr";
import { requireParent } from "@/lib/tenancy";
import { listContexts } from "@/lib/session";
import { familyCertificates } from "@/lib/certificates";
import { familyRequests } from "@/lib/certificate-requests";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { FamilyCertificateList } from "@/components/certificates/family-list";
import { CertificateRequestForm } from "@/components/certificates/request-form";
import { CertificateRequestList } from "@/components/certificates/request-list";
import { ChildSwitcher } from "../child-switcher";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("certificates.myTitle"), robots: { index: false, follow: false } };
}

/**
 * Every child's certificates on one page: the guardian downloads the PDF
 * from here. The ask and its answers are one child's — the one in the
 * switcher, or the only one — because a request names a pupil.
 */
export default async function ParentCertificatesPage({ searchParams }: { searchParams: Promise<{ child?: string }> }) {
  const session = await requireParent();
  const t = await getT();
  const { child: requested } = await searchParams;
  const [{ children }, { items }] = await Promise.all([listContexts(session.user.id), familyCertificates(session)]);
  const selectedId = requested && children.some((c) => c.studentMembershipId === requested) ? requested : children[0]!.studentMembershipId;
  const selected = children.find((c) => c.studentMembershipId === selectedId);
  const requests = await familyRequests(session, selectedId);
  const from = children.length > 1 ? `/parent/certificates?child=${selectedId}` : "/parent/certificates";

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

      {children.length > 1 && <ChildSwitcher pupils={children} selectedId={selectedId} basePath="/parent/certificates" />}

      <Card>
        <CardHeader icon={<PaperPlaneTiltIcon weight="duotone" className="size-5" />} title={t("certificateRequests.askTitle")} description={[selected?.name, t("certificateRequests.askIntro")].filter(Boolean).join(" · ")} />
        <CardBody>
          <CertificateRequestForm key={selectedId} kinds={requests.kinds} childId={selectedId} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<EnvelopeOpenIcon weight="duotone" className="size-5" />} title={t("certificateRequests.mine")} description={selected?.name} />
        <CardBody>
          <CertificateRequestList items={requests.items} from={from} />
        </CardBody>
      </Card>
    </div>
  );
}
