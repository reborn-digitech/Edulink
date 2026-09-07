import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireSuperuser } from "@/lib/tenancy";
import { SchoolForm } from "../school-form";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("root.addSchool") };
}

export default async function NewSchoolPage() {
  const t = await getT();
  await requireSuperuser();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/root"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("root.allSchools")}
      </Link>

      <PageHeader title={t("root.addSchool")} description={t("root.newSchoolIntro")} />

      <SchoolForm />
    </div>
  );
}
