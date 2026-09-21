import type { Metadata } from "next";
import { CertificateIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { familyCertificates } from "@/lib/certificates";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { FamilyCertificateList } from "@/components/certificates/family-list";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("certificates.myTitle"), robots: { index: false, follow: false } };
}

/** The pupil's own certificates, with the PDF to keep. */
export default async function StudentCertificatesPage() {
  const ctx = await requireRole("STUDENT");
  const t = await getT();
  const { items } = await familyCertificates(ctx);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title={t("certificates.myTitle")} description={t("certificates.myIntro")} back={{ href: "/student", label: t("nav.today") }} />
      <Card>
        <CardHeader icon={<CertificateIcon weight="duotone" className="size-5" />} title={t("certificates.title")} />
        <CardBody>
          <FamilyCertificateList items={items} showPupil={false} from="/student/certificates" />
        </CardBody>
      </Card>
    </div>
  );
}
