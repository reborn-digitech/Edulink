import { PageHeader } from "@/components/ui/page-header";
import { TabBar } from "@/components/ui/tabs";
import { ModuleFlash } from "@/components/module-flash";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { getLocale, getT } from "@/lib/i18n/server";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";

/**
 * The payroll pages' common top. The office runs payroll; the head reads the
 * summary and the runs (their slips only once the admin shares a run), so
 * the head's tabs are the overview alone and every other page asks for the
 * admin.
 */
export async function payrollGate(adminOnly = false) {
  const ctx = adminOnly ? await requireRole("ADMIN") : await requireRole("ADMIN", "PRINCIPAL");
  const [t, locale, on] = await Promise.all([getT(), getLocale(), isModuleOn(ctx.schoolId, "PAYROLL")]);
  return { ctx, t, locale, on, canEdit: ctx.role === "ADMIN" };
}

const TABS: { key: string; href: string; labelKey: TranslationKey; admin: boolean }[] = [
  { key: "overview", href: "/admin/payroll", labelKey: "payroll.tabOverview", admin: false },
  { key: "salaries", href: "/admin/payroll/salaries", labelKey: "payroll.tabSalaries", admin: true },
  { key: "structures", href: "/admin/payroll/structures", labelKey: "payroll.tabStructures", admin: true },
  { key: "advances", href: "/admin/payroll/advances", labelKey: "payroll.tabAdvances", admin: true },
  { key: "settings", href: "/admin/payroll/settings", labelKey: "payroll.tabSettings", admin: true },
];

export function PayrollTop({ t, current, params, admin, title, description }: { t: Translate; current: string; params: Record<string, string | string[] | undefined>; admin: boolean; title?: string; description?: string }) {
  return (
    <>
      <PageHeader title={title ?? t("payroll.title")} description={description ?? t("payroll.intro")} />
      <TabBar ariaLabel={t("payroll.title")} current={current} tabs={TABS.filter((tab) => admin || !tab.admin).map((tab) => ({ key: tab.key, href: tab.href, label: t(tab.labelKey) }))} />
      <ModuleFlash t={t} params={params} />
    </>
  );
}

/** "September 2026" in the reader's language. */
export function monthName(month: string, locale: string, short = false): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  return new Intl.DateTimeFormat(locale === "en" ? "en-IN" : `${locale}-IN`, { month: short ? "short" : "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
}
