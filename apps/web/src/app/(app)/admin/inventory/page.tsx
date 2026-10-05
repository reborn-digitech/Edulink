import type { Metadata } from "next";
import Link from "next/link";
import { ArchiveIcon, PackageIcon, WarningIcon, WrenchIcon, HandIcon, CoinsIcon } from "@phosphor-icons/react/ssr";
import { formatPaise } from "@edulink/i18n";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { LINK, NUM, TD, TH } from "@/components/module-flash";
import { inventorySummary } from "@/lib/inventory";
import { formatInZone } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";
import { inventoryGate, InventoryTop } from "./shared";
import { TableScroll } from "@/components/ui/table-scroll";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("inventory.title") };
}

/** The stores and the asset register at a glance: what is low, what moved last, who is waiting. */
export default async function InventoryOverview({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { ctx, t, locale, on } = await inventoryGate();
  if (!on) return <ModuleOff page module="INVENTORY" t={t} />;
  const params = await searchParams;
  const s = await inventorySummary(ctx);
  return (
    <div className="space-y-6">
      <InventoryTop t={t} current="overview" params={params} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label={t("inventory.statItems")} value={s.counts.items} icon={<PackageIcon className="size-4" />} />
        <StatTile label={t("inventory.statLow")} value={s.counts.lowStock} tone={s.counts.lowStock ? "warn" : "ok"} icon={<WarningIcon className="size-4" />} />
        <StatTile label={t("inventory.statAssets")} value={s.counts.assets} icon={<ArchiveIcon className="size-4" />} />
        <StatTile label={t("inventory.statRepair")} value={s.counts.inRepair} icon={<WrenchIcon className="size-4" />} />
        <StatTile label={t("inventory.statAsks")} value={s.counts.openRequests} tone={s.counts.openRequests ? "accent" : "neutral"} icon={<HandIcon className="size-4" />} />
        <StatTile label={t("inventory.statBookValue")} value={formatPaise(s.bookValuePaise, locale)} hint={t("inventory.statCost", { cost: formatPaise(s.costPaise, locale) })} icon={<CoinsIcon className="size-4" />} />
      </div>

      <Card>
        <CardHeader icon={<WarningIcon weight="duotone" className="size-5" />} title={t("inventory.lowTitle")} description={t("inventory.lowBody")} action={<Link className={LINK} href="/admin/inventory/items">{t("inventory.tabItems")}</Link>} />
        <CardBody>
          {s.lowStock.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("inventory.lowNone")} description={t("inventory.lowNoneBody")} />
          ) : (
            <ul className="divide-y divide-border">
              {s.lowStock.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="font-medium text-fg">{i.name} <span className="text-fg-muted">· {i.code}</span></span>
                  <span className="tabular-nums text-warn">{t("inventory.stockLine", { onHand: i.onHand, unit: i.unit, level: i.reorderLevel })}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<HandIcon weight="duotone" className="size-5" />} title={t("inventory.asksTitle")} action={<Link className={LINK} href="/admin/inventory/requests">{t("inventory.tabRequests")}</Link>} />
        <CardBody>
          {s.openRequests.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("inventory.asksNone")} description={t("inventory.asksNoneBody")} />
          ) : (
            <ul className="divide-y divide-border">
              {s.openRequests.map((r) => (
                <li key={r.id} className="py-2 text-sm">
                  <span className="font-medium text-fg">{r.requesterName}</span> · {t("inventory.askLine", { quantity: r.quantity, item: r.itemName })}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<PackageIcon weight="duotone" className="size-5" />} title={t("inventory.recentTitle")} action={<Link className={LINK} href="/admin/inventory/movements">{t("inventory.tabMovements")}</Link>} />
        <CardBody>
          {s.recentMovements.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("inventory.movementsNone")} description={t("inventory.movementsNoneBody")} />
          ) : (
            <TableScroll>
              <table className="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className={TH}>{t("inventory.colWhen")}</th>
                    <th scope="col" className={TH}>{t("inventory.colItem")}</th>
                    <th scope="col" className={TH}>{t("inventory.colKind")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("inventory.colChange")}</th>
                    <th scope="col" className={TH}>{t("inventory.colWhere")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {s.recentMovements.map((m) => (
                    <tr key={m.id}>
                      <td className={TD}>{formatInZone(new Date(m.at), "Asia/Kolkata", { day: "numeric", month: "short" }, locale)}</td>
                      <td className={TD}>{m.itemName}</td>
                      <td className={TD}>{t(`inventory.kind${m.kind}`)}</td>
                      <td className={NUM}>{m.delta > 0 ? `+${m.delta}` : m.delta}</td>
                      <td className={TD}>{[m.location, m.toName, m.toRoom, m.toDepartment].filter(Boolean).join(" → ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
        </CardBody>
      </Card>
      {ctx.role === "PRINCIPAL" ? <p className="text-sm text-fg-muted">{t("inventory.headReads")}</p> : null}
    </div>
  );
}
