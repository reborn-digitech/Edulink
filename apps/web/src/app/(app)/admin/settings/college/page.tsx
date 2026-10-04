import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CertificateIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { collegeProfile } from "@/lib/college-profile";
import { isCollegeKind } from "@/lib/institution";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CollegeProfileForm } from "./profile-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("college.profileTitle") };
}

/**
 * A college's regulator references (4 Oct 2026): the affiliating university,
 * AISHE code, AICTE and UGC approvals, NAAC grade and its expiry, NIRF
 * category. The office writes; the head reads; a school has none and is
 * sent back to its settings.
 */
export default async function CollegeProfilePage() {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const profile = await collegeProfile(ctx);
  if (!isCollegeKind(profile.kind)) redirect("/admin/settings");
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <PageHeader title={t("college.profileTitle")} description={t("college.profileIntro")} />
      <Card>
        <CardHeader icon={<CertificateIcon weight="duotone" className="size-5" />} title={t("college.profileCardTitle")} />
        <CardBody>
          <CollegeProfileForm profile={profile} canWrite={ctx.role === "ADMIN"} />
        </CardBody>
      </Card>
    </div>
  );
}
