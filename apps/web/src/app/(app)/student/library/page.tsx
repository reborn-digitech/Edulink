import type { Metadata } from "next";
import { isCollegeKind } from "@edulink/contracts";
import { requireRole } from "@/lib/tenancy";
import { getT } from "@/lib/i18n/server";
import { institutionKindOf, isModuleOn } from "@/lib/modules";
import { listEResources } from "@/lib/college-campus";
import { MyLibrary } from "@/components/library/mine";
import { EResourceList } from "@/components/library/eresources";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("modules.libraryName"), robots: { index: false, follow: false } };
}

/**
 * The pupil's own library: their loans, dues and queue, and the catalogue. At
 * a college (and at a school that keeps some, owner-batch-item5) the e-resources follow, each opened through the app so the open
 * is counted (campaign 2026-10-04, G-3; the list alone is /library/e-resources).
 */
export default async function StudentLibraryPage({ searchParams }: { searchParams: Promise<{ q?: string; ok?: string; error?: string }> }) {
  const ctx = await requireRole("STUDENT");
  const { q = "", ok, error } = await searchParams;
  const [t, kind, on] = await Promise.all([getT(), institutionKindOf(ctx.schoolId), isModuleOn(ctx.schoolId, "LIBRARY")]);
  // A school's library may keep e-resources too since owner-batch-item5: shown there once it has any; a college always shows the list.
  const eres = on ? await listEResources(ctx) : null;
  const showEres = eres !== null && (isCollegeKind(kind ?? "SCHOOL") || eres.items.length > 0);
  return (
    <div className="space-y-5">
      <MyLibrary ctx={ctx} schoolId={ctx.schoolId} path="/student/library" q={q} ok={ok} error={error} />
      {eres && showEres ? <EResourceList items={eres.items} t={t} /> : null}
    </div>
  );
}
