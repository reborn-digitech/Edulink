import Link from "next/link";
import { ArrowLeftIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { requireSuperuser } from "@/lib/tenancy";
import { listRecruiters } from "@/lib/operator-college";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { RecruiterRow } from "./recruiter-row";
import { InviteRecruiterForm } from "./invite-recruiter-form";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("operatorCollege.recruitersTitle"), robots: { index: false, follow: false } };
}

/**
 * Recruiter accounts across every college (4 October 2026). A recruiter
 * belongs to no college, so no college can shut one out of the others; the
 * operator can, from here. An expert is taken off every school's list from
 * the experts queue (/root/experts), which is that account's equivalent.
 */
export default async function RecruitersPage() {
  const t = await getT();
  const session = await requireSuperuser();
  const recruiters = await listRecruiters(session);

  return (
    <div className="space-y-5">
      <Link href="/root/colleges" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("operatorCollege.title")}
      </Link>
      <PageHeader title={t("operatorCollege.recruitersTitle")} description={t("operatorCollege.recruitersIntro")} />
      <p className="rounded-[var(--radius-md)] border border-border bg-surface-muted px-4 py-3 text-sm leading-relaxed text-fg-muted">
        {t("operatorCollege.expertsNote")}{" "}
        <Link href="/root/experts" className="font-medium text-fg hover:underline">
          {t("root.experts")}
        </Link>
      </p>
      <InviteRecruiterForm />
      {recruiters.length === 0 ? (
        <EmptyState icon={<UsersThreeIcon weight="duotone" className="size-8" />} title={t("operatorCollege.recruitersNoneTitle")} description={t("operatorCollege.recruitersNone")} />
      ) : (
        <ul className="space-y-2">
          {recruiters.map((r) => (
            <li key={r.userId}>
              <RecruiterRow recruiter={{ ...r, createdAt: r.createdAt.toISOString(), disabledAt: r.disabledAt?.toISOString() ?? null }} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
