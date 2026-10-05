import type { Metadata } from "next";
import { ChartBarIcon, DownloadSimpleIcon } from "@phosphor-icons/react/ssr";
import { formatPaise } from "@edulink/i18n";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { LINK, NUM, TD, TH } from "@/components/module-flash";
import { inventoryReports } from "@/lib/inventory";
import { formatDateKey } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";
import { inventoryGate, InventoryTop } from "../shared";
import { TableScroll } from "@/components/ui/table-scroll";

/** The two downloads, built by a route handler rather than a page, so a plain link. */
const FILES = { stock: "/admin/inventory/export/stock", assets: "/admin/inventory/export/fixed-assets" };

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("inventory.tabReports") };
}

/** Stock on hand, what was used month by month, and the assets by place and by custodian, with the files for the records. */
export default async function InventoryReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { ctx, t, locale, on, canEdit } = await inventoryGate();
  if (!on) return <ModuleOff page module="INVENTORY" t={t} />;
  const params = await searchParams;
  const r = await inventoryReports(ctx);
  const month = (m: string) => formatDateKey(`${m}-01`, { month: "short", year: "numeric" }, locale);
  return (
    <div className="space-y-6">
      <InventoryTop t={t} current="reports" params={params} />
      {canEdit ? (
        <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <DownloadSimpleIcon weight="bold" className="size-4 text-fg-muted" aria-hidden="true" />
          <a className={LINK} href={FILES.stock}>{t("inventory.exportStock")}</a>
          <a className={LINK} href={`${FILES.stock}?format=xlsx`}>{t("inventory.exportStockXlsx")}</a>
          <a className={LINK} href={FILES.assets}>{t("inventory.exportRegister")}</a>
          <a className={LINK} href={`${FILES.assets}?format=xlsx`}>{t("inventory.exportRegisterXlsx")}</a>
        </p>
      ) : null}
      <Card>
        <CardHeader icon={<ChartBarIcon weight="duotone" className="size-5" />} title={t("inventory.reportStock")} description={t("inventory.asOf", { date: formatDateKey(r.asOf, { day: "numeric", month: "long", year: "numeric" }, locale) })} />
        <CardBody>
          {r.stockOnHand.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("inventory.itemsNone")} description={t("inventory.itemsNoneBody")} />
          ) : (
            <TableScroll>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className={TH}>{t("inventory.colItem")}</th>
                    <th scope="col" className={TH}>{t("inventory.colWhere")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("inventory.colOnHand")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {r.stockOnHand.map((s) => (
                    <tr key={`${s.itemCode}|${s.location}`}>
                      <td className={TD}>{s.itemName}</td>
                      <td className={TD}>{s.location}</td>
                      <td className={NUM}>{s.quantity} {s.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader title={t("inventory.reportConsumption")} description={t("inventory.reportConsumptionBody")} />
        <CardBody>
          {r.consumption.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("inventory.movementsNone")} description={t("inventory.movementsNoneBody")} />
          ) : (
            <TableScroll>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className={TH}>{t("inventory.colMonth")}</th>
                    <th scope="col" className={TH}>{t("inventory.colItem")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("inventory.colIssued")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("inventory.colWrittenOff")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {r.consumption.map((c) => (
                    <tr key={`${c.month}|${c.itemCode}`}>
                      <td className={TD}>{month(c.month)}</td>
                      <td className={TD}>{c.itemName}</td>
                      <td className={NUM}>{c.issued} {c.unit}</td>
                      <td className={NUM}>{c.writtenOff}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
        </CardBody>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title={t("inventory.reportByLocation")} />
          <CardBody>
            <TableScroll>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className={TH}>{t("inventory.colWhere")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("inventory.colCount")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("inventory.colBookValue")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {r.assetsByLocation.map((l) => (
                    <tr key={l.location}>
                      <td className={TD}>{l.location}</td>
                      <td className={NUM}>{l.count}</td>
                      <td className={NUM}>{formatPaise(l.bookValuePaise, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title={t("inventory.reportByCustodian")} />
          <CardBody>
            <TableScroll>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className={TH}>{t("inventory.colCustodian")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("inventory.colCount")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("inventory.colBookValue")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {r.assetsByCustodian.map((c) => (
                    <tr key={c.membershipId ?? "store"}>
                      <td className={TD}>{c.name ?? t("inventory.inStore")}</td>
                      <td className={NUM}>{c.count}</td>
                      <td className={NUM}>{formatPaise(c.bookValuePaise, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
