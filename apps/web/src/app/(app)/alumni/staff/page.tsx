import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { alumniHome, alumniStaff } from "@/lib/alumni";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { StaffList } from "../staff-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("alumni.staffTitle") };
}

/** Every member of staff a former pupil may write to, their former teachers first; `?q=` on the name. */
export default async function AlumniStaffPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const ctx = await requireRole("ALUMNUS");
  const t = await getT();
  if (!(await isModuleOn(ctx.schoolId, "ALUMNI"))) return <ModuleOff module="ALUMNI" t={t} />;
  const { q } = await searchParams;
  const [{ schoolId, people }, home] = await Promise.all([alumniStaff(ctx, q?.slice(0, 80) ?? ""), alumniHome(ctx)]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link href="/alumni" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("modules.alumniName")}
      </Link>
      <PageHeader title={t("alumni.staffTitle")} description={t("alumni.staffIntro")} />
      {home.muted && <p role="status" className="rounded-[--radius-md] border border-warn/40 bg-warn-soft px-4 py-3 text-sm font-medium text-warn">{t("alumni.mutedBanner")}</p>}
      <form className="flex gap-2" role="search">
        <label htmlFor="alumni-staff-q" className="sr-only">
          {t("alumni.staffSearch")}
        </label>
        <input
          id="alumni-staff-q"
          name="q"
          defaultValue={q ?? ""}
          placeholder={t("alumni.staffSearch")}
          className="h-11 w-full rounded-[--radius-md] border border-border bg-surface px-3.5 text-[0.9375rem] text-fg"
        />
      </form>
      {people.length === 0 ? (
        <EmptyState icon={<UsersThreeIcon weight="duotone" className="size-8" />} title={t("alumni.staffEmpty")} />
      ) : (
        <StaffList people={people} schoolId={schoolId} t={t} disabled={home.muted} />
      )}
    </div>
  );
}
