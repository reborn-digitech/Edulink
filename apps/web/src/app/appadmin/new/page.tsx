import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireAppAdmin } from "@/lib/tenancy";
import { Card, CardBody } from "@/components/ui/card";
import { PlatformCompetitionForm } from "./form";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("appadmin.postCompetition") };
}

export default async function NewPlatformCompetitionPage() {
  const t = await getT();
  await requireAppAdmin();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/appadmin"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("appadmin.competitions")}
      </Link>

      <PageHeader title={t("appadmin.postCompetition")} description={t("appadmin.postIntro")} />

      <Card>
        <CardBody>
          <PlatformCompetitionForm />
        </CardBody>
      </Card>
    </div>
  );
}
