import { PageHeader } from "@/components/ui/page-header";
import { TabBar } from "@/components/ui/tabs";
import { ModuleFlash } from "@/components/module-flash";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { getLocale, getT } from "@/lib/i18n/server";
import type { Translate, TranslationKey } from "@/lib/i18n/dictionary";

/**
 * The inventory pages' common top: who may be here (the office and the head
 * — the admin writes, the head reads), whether the school has the module on,
 * the tabs, and what the last form came back with.
 */
export async function inventoryGate() {
  const ctx = await requireRole("ADMIN", "PRINCIPAL", "ACCOUNTS");
  const [t, locale, on] = await Promise.all([getT(), getLocale(), isModuleOn(ctx.schoolId, "INVENTORY")]);
  return { ctx, t, locale, on, canEdit: ctx.role === "ADMIN" };
}

const TABS: { key: string; href: string; labelKey: TranslationKey }[] = [
  { key: "overview", href: "/admin/inventory", labelKey: "inventory.tabOverview" },
  { key: "items", href: "/admin/inventory/items", labelKey: "inventory.tabItems" },
  { key: "movements", href: "/admin/inventory/movements", labelKey: "inventory.tabMovements" },
  { key: "purchases", href: "/admin/inventory/purchases", labelKey: "inventory.tabPurchases" },
  { key: "assets", href: "/admin/inventory/assets", labelKey: "inventory.tabAssets" },
  { key: "requests", href: "/admin/inventory/requests", labelKey: "inventory.tabRequests" },
  { key: "reports", href: "/admin/inventory/reports", labelKey: "inventory.tabReports" },
  { key: "setup", href: "/admin/inventory/setup", labelKey: "inventory.tabSetup" },
];

export function InventoryTop({ t, current, params, description }: { t: Translate; current: string; params: Record<string, string | string[] | undefined>; description?: string }) {
  return (
    <>
      <PageHeader title={t("inventory.title")} description={description ?? t("inventory.intro")} />
      <TabBar ariaLabel={t("inventory.title")} current={current} tabs={TABS.map((tab) => ({ key: tab.key, href: tab.href, label: t(tab.labelKey) }))} />
      <ModuleFlash t={t} params={params} />
    </>
  );
}
