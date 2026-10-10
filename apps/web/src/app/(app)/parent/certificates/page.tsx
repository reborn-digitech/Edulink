import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, CertificateIcon, EnvelopeOpenIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react/ssr";
import { requireParent } from "@/lib/tenancy";
import { familyChildren, pickChild, childAccess } from "@/lib/family-child";
import { NotSharedState } from "@/components/family/not-shared";
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
  // The children with what each lets the guardian see, opening on one the guardian may read (DS-1, 10 Oct 2026).
  const [children, { items }] = await Promise.all([familyChildren(session.user.id), familyCertificates(session)]);
  const chosen = pickChild(children, requested) ?? children[0]!;
  const selectedId = chosen.studentMembershipId;
  const selected = chosen;
  // An adult's papers are their own to ask for (campaign S-2): the page says so instead of vanishing.
  const access = await childAccess(session.user.id, selectedId);
  if (access.refused) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <Link href="/parent" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
          <ArrowLeftIcon weight="bold" className="size-4" />
          {t("parent.overview")}
        </Link>
        <PageHeader title={t("certificates.myTitle")} description={t("certificates.myIntro")} />
        {items.length > 0 ? (
          <Card>
            <CardHeader icon={<CertificateIcon weight="duotone" className="size-5" />} title={t("certificates.title")} />
            <CardBody>
              <FamilyCertificateList items={items} showPupil={children.length > 1} from="/parent/certificates" />
            </CardBody>
          </Card>
        ) : null}
        {children.length > 1 && <ChildSwitcher pupils={children} selectedId={selectedId} basePath="/parent/certificates" />}
        <NotSharedState name={chosen.name} own />
      </div>
    );
  }
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
