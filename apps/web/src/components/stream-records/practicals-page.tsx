import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { RecordsFlash } from "@/components/stream-records/flash";
import { PracticalsPanel } from "@/components/stream-records/practicals-panel";
import { requireRole } from "@/lib/tenancy";
import { db } from "@/lib/db";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { isCollegeKind } from "@/lib/institution";
import { practicalSheet } from "@/lib/stream-records";
import { AccessError } from "@/lib/access-error";
import { todayKey } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import type { Role } from "@/lib/constants";

type Params = Record<string, string | string[] | undefined>;

/**
 * The practical record's page (5 Oct 2026), drawn the same for the faculty
 * member (/faculty/practicals), the HOD (/hod/practicals) and the office and
 * the head (/admin/stream-records/practicals): only the roles and the address
 * differ. An offering the reader may not see is a page that is not here.
 */
export async function PracticalsPage({ roles, base, searchParams, back }: { roles: Role[]; base: string; searchParams: Promise<Params>; back?: { href: string; labelKey: "streamRecords.title" } }) {
  const ctx = await requireRole(...roles);
  const t = await getT();
  const locale = await getLocale();
  if (!isCollegeKind(await institutionKindOf(ctx.schoolId))) notFound();
  if (!(await isModuleOn(ctx.schoolId, "ACADEMICS"))) return <ModuleOff page module="ACADEMICS" t={t} college />;
  const params = await searchParams;
  const offeringId = typeof params.offeringId === "string" ? params.offeringId : undefined;
  let sheet;
  try {
    sheet = await practicalSheet(ctx, { offeringId });
  } catch (error) {
    if (error instanceof AccessError) notFound();
    throw error;
  }
  const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } });
  return (
    <div className="space-y-6">
      <PageHeader title={t("streamRecords.practicals.title")} description={t("streamRecords.practicals.intro")} back={back ? { href: back.href, label: t(back.labelKey) } : undefined} />
      <RecordsFlash t={t} params={params} />
      <PracticalsPanel sheet={sheet} t={t} locale={locale} base={base} today={todayKey(school.timezone)} />
    </div>
  );
}
