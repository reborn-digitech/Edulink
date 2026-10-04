import type { Metadata } from "next";
import { isCollegeKind } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { listEResources } from "@/lib/college-campus";
import { getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { NotCollege } from "@/components/college-office/parts";
import { EResourceList } from "@/components/library/eresources";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("collegeOffice.eResourcesTitle"), robots: { index: false, follow: false } };
}

/**
 * A college's e-resources for its members (campaign 2026-10-04, G-3): a
 * student, a faculty member and an HOD open N-LIST, DELNET and the journals
 * here, through the app, so each open counts on the library's criterion-4
 * numbers (libraryTable). The desk's own view, with the counts and the form,
 * is /library/college. FACULTY and HOD reach this page through their NAV
 * entry (module LIBRARY; role-gate.ts); a student also sees the list on
 * /student/library at a college.
 */
export default async function EResourcesPage() {
  const ctx = await requireRole("STUDENT", "FACULTY", "HOD");
  const [t, kind] = await Promise.all([getT(), institutionKindOf(ctx.schoolId)]);
  if (!isCollegeKind(kind ?? "SCHOOL")) return <NotCollege t={t} />;
  if (!(await isModuleOn(ctx.schoolId, "LIBRARY"))) return <ModuleOff module="LIBRARY" t={t} college />;
  const { items } = await listEResources(ctx);
  return (
    <div className="space-y-6">
      <PageHeader title={t("collegeOffice.eResourcesTitle")} description={t("collegeOffice.eResourcesIntro")} />
      <EResourceList items={items} t={t} />
    </div>
  );
}
