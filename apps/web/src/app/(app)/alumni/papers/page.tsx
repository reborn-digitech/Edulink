import type { Metadata } from "next";
import { CertificateIcon, EnvelopeOpenIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { familyCertificates } from "@/lib/certificates";
import { familyRequests } from "@/lib/certificate-requests";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { FamilyCertificateList } from "@/components/certificates/family-list";
import { CertificateRequestForm } from "@/components/certificates/request-form";
import { CertificateRequestList } from "@/components/certificates/request-list";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("certificateRequests.alumniTitle"), robots: { index: false, follow: false } };
}

/**
 * A FORMER PUPIL'S PAPERS (G-6, 4 Oct 2026): the certificates issued in their
 * stay, and the ask for one again — a copy of the leaving certificate, a
 * bonafide or a no-objection for higher studies, a transcript named in what it
 * is for — through the same request the pupil used, opened to the alumnus. The
 * office may set a fee, a demand on the ledger paid at the office.
 */
export default async function AlumniPapersPage() {
  const ctx = await requireRole("ALUMNUS");
  const t = await getT();
  const [{ items }, requests] = await Promise.all([familyCertificates(ctx), familyRequests(ctx)]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title={t("certificateRequests.alumniTitle")} description={t("certificateRequests.alumniIntro")} back={{ href: "/alumni", label: t("modules.alumniName") }} />
      <Card>
        <CardHeader icon={<CertificateIcon weight="duotone" className="size-5" />} title={t("certificates.title")} />
        <CardBody>
          <FamilyCertificateList items={items} showPupil={false} from="/alumni/papers" pdfOnly />
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<PaperPlaneTiltIcon weight="duotone" className="size-5" />} title={t("certificateRequests.askTitle")} description={t("certificateRequests.askIntro")} />
        <CardBody>
          <CertificateRequestForm kinds={requests.kinds} />
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<EnvelopeOpenIcon weight="duotone" className="size-5" />} title={t("certificateRequests.mine")} />
        <CardBody>
          <CertificateRequestList items={requests.items} from="/alumni/papers" pdfOnly />
        </CardBody>
      </Card>
    </div>
  );
}
