import type { ReactNode } from "react";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { db } from "@/lib/db";
import { getLocale, getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { TabBar } from "@/components/ui/tabs";
import { ModuleOff } from "@/components/module-off";
import type { Translate } from "@/lib/i18n/dictionary";
import { Flash } from "./parts";

/**
 * The library desk's frame (module LIBRARY, 3 Oct 2026): the librarian, the
 * office and the head on /library and its pages. The librarian's home is
 * /library, so the session's gate already lets that role through every page
 * under it; the office and the head arrive from their own NAV entries.
 * Switched off, every desk page says so and draws nothing else.
 */
export async function deskContext() {
  const ctx = await requireRole("LIBRARIAN", "ADMIN", "PRINCIPAL");
  const [t, locale, on, school] = await Promise.all([getT(), getLocale(), isModuleOn(ctx.schoolId, "LIBRARY"), db.school.findUnique({ where: { id: ctx.schoolId }, select: { timezone: true } })]);
  return { ctx, t, locale, on, canWrite: ctx.role !== "PRINCIPAL", timeZone: school?.timezone ?? "Asia/Kolkata" };
}

const TABS = [
  ["desk", "/library", "library.tabDesk"],
  ["catalogue", "/library/catalogue", "library.tabCatalogue"],
  ["overdue", "/library/overdue", "library.tabOverdue"],
  ["reservations", "/library/reservations", "library.tabReservations"],
  ["fines", "/library/fines", "library.tabFines"],
  ["stocktake", "/library/stocktake", "library.tabStockTake"],
  ["reports", "/library/reports", "library.tabReports"],
] as const;

export function DeskFrame({ t, on, current, title, description, ok, error, children, back }: { t: Translate; on: boolean; current: (typeof TABS)[number][0] | null; title: string; description?: string; ok?: string; error?: string; children: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="space-y-5">
      <PageHeader title={title} description={on ? description : undefined} back={back} />
      {on ? (
        <>
          <TabBar ariaLabel={t("library.deskNav")} current={current ?? ""} tabs={TABS.map(([key, href, label]) => ({ key, href, label: t(label) }))} />
          <Flash ok={ok} error={error} />
          {children}
        </>
      ) : (
        <ModuleOff module="LIBRARY" t={t} />
      )}
    </div>
  );
}
