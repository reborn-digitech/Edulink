import type { ActiveContext } from "@/lib/session";
import { myLibrary, searchCatalogue } from "@/lib/library";
import { isModuleOn } from "@/lib/modules";
import { getLocale, getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { CatalogueSearch, FineList, Flash, LoanList, ReservationList } from "./parts";
import type { ReactNode } from "react";

/**
 * A member's own library (module LIBRARY, 3 Oct 2026) — the pupil's
 * /student/library, the teacher's /teacher/library, and a guardian's
 * /parent/library for the child in the switcher: what they have out and
 * when it is due, what they owe and how it is paid, their place in the
 * queue, and the catalogue to search and reserve from. src/lib/library.ts
 * decides whose library this is; a guardian reaches only their own child's.
 */
export async function MyLibrary({ ctx, schoolId, childId, path, q, ok, error, switcher }: { ctx: ActiveContext; schoolId: string | null; childId?: string; path: string; q: string; ok?: string; error?: string; switcher?: ReactNode }) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  if (!(await isModuleOn(schoolId, "LIBRARY"))) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("modules.libraryName")} />
        {switcher}
        <ModuleOff module="LIBRARY" t={t} />
      </div>
    );
  }
  const [mine, catalogue] = await Promise.all([myLibrary(ctx, childId), searchCatalogue(ctx, { q, childId, limit: 20 })]);
  const params = new URLSearchParams();
  if (childId) params.set("child", childId);
  if (q) params.set("q", q);
  const back = params.toString() ? `${path}?${params}` : path;
  const open = mine.loans.filter((l) => !l.returnedAt);
  const returned = mine.loans.filter((l) => l.returnedAt);
  return (
    <div className="space-y-5">
      <PageHeader title={t("modules.libraryName")} description={childId ? t("library.childIntro", { name: mine.name }) : t("library.mineIntro", { limit: mine.limit })} />
      {switcher}
      <Flash ok={ok} error={error} />
      <LoanList loans={open} t={t} locale={locale} back={back} title={t("library.onLoanTitle")} desk={false} showMember={false} />
      <ReservationList items={mine.reservations} t={t} back={back} title={t("library.reservationsTitle")} desk={false} />
      <FineList fines={mine.fines} t={t} locale={locale} back={back} desk={false} canSettle={false} title={t("library.finesTitle")} />
      <CatalogueSearch items={catalogue.items} q={q} t={t} back={back} action={path} reserveFor={{ childId }} desk={false} />
      {returned.length > 0 ? <LoanList loans={returned} t={t} locale={locale} back={back} title={t("library.returnedTitle")} desk={false} showMember={false} /> : null}
    </div>
  );
}
