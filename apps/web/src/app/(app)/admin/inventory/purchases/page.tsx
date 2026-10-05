import type { Metadata } from "next";
import { ReceiptIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { formatPaise } from "@edulink/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { SelectField, TextField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { LINK, NUM, TD } from "@/components/module-flash";
import { inventorySetup, listItems, listPurchases } from "@/lib/inventory";
import { db } from "@/lib/db";
import { formatDateKey, todayKey } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";
import { inventoryGate, InventoryTop } from "../shared";
import { recordPurchaseAction } from "../actions";
import { fieldClass } from "@/components/ui/field-class";
import { TableScroll } from "@/components/ui/table-scroll";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("inventory.tabPurchases") };
}

const LINES = [0, 1, 2, 3, 4, 5];

/**
 * Bills the school paid outside the app (decision 0003: nothing here pays
 * anyone): who, when, the invoice's reference, the lines, the total, and the
 * scanned bill. A line naming an item brings its quantity into stock.
 */
export default async function InventoryPurchases({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { ctx, t, locale, on, canEdit } = await inventoryGate();
  if (!on) return <ModuleOff page module="INVENTORY" t={t} />;
  const params = await searchParams;
  const [{ purchases }, setup, { items }, school] = await Promise.all([listPurchases(ctx), inventorySetup(ctx), listItems(ctx), db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } })]);
  return (
    <div className="space-y-6">
      <InventoryTop t={t} current="purchases" params={params} />
      <Card>
        <CardHeader icon={<ReceiptIcon weight="duotone" className="size-5" />} title={t("inventory.purchasesTitle")} description={t("inventory.purchasesBody")} />
        <CardBody>
          {purchases.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("inventory.purchasesNone")} description={t("inventory.purchasesNoneBody")} />
          ) : (
            <ul className="divide-y divide-border">
              {purchases.map((p) => (
                <li key={p.id} className="py-3 text-sm">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-medium text-fg">{p.vendorName} · {p.invoiceRef}</span>
                    <span className="tabular-nums font-semibold">{formatPaise(p.totalPaise, locale, { always: true })}</span>
                  </div>
                  <p className="text-xs text-fg-muted">
                    {formatDateKey(p.dateKey, { day: "numeric", month: "short", year: "numeric" }, locale)} · {p.location} · {p.byName}
                    {p.billFileId ? (
                      <>
                        {" · "}
                        <a className={LINK} href={`/api/files/${p.billFileId}`} target="_blank" rel="noreferrer">{t("inventory.viewBill")}</a>
                      </>
                    ) : null}
                  </p>
                  <TableScroll className="mt-2">
                    <table className="w-full text-xs">
                      <tbody>
                        {p.lines.map((l, i) => (
                          <tr key={i}>
                            <td className={TD}>{l.description}{l.itemCode ? <span className="text-fg-muted"> · {l.itemCode}</span> : null}</td>
                            <td className={NUM}>{l.quantity} × {formatPaise(l.unitPaise, locale, { always: true })}</td>
                            <td className={NUM}>{formatPaise(l.totalPaise, locale, { always: true })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </TableScroll>
                  {p.note ? <p className="mt-1 text-xs text-fg-muted">{p.note}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {canEdit ? (
        <Card>
          <CardHeader icon={<PlusIcon weight="bold" className="size-5" />} title={t("inventory.purchaseFormTitle")} description={t("inventory.purchaseFormBody")} />
          <CardBody>
            <form action={recordPurchaseAction} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <SelectField label={t("inventory.fieldVendor")} name="vendorId" defaultValue="">
                  <option value="">{t("inventory.vendorTyped")}</option>
                  {setup.vendors.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </SelectField>
                <TextField label={t("inventory.fieldVendorName")} name="vendorName" maxLength={120} hint={t("inventory.fieldVendorNameHint")} />
                <TextField label={t("inventory.fieldBillDate")} name="dateKey" type="date" required defaultValue={todayKey(school.timezone)} />
                <TextField label={t("inventory.fieldInvoiceRef")} name="invoiceRef" required maxLength={60} />
                <TextField label={t("inventory.fieldLocation")} name="location" required maxLength={60} list="purchase-locations" defaultValue={setup.locations[0] ?? ""} hint={t("inventory.fieldPurchaseLocationHint")} />
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-fg">{t("inventory.fieldBill")}</span>
                  <input type="file" name="bill" accept="image/*,application/pdf" className="block w-full text-sm" />
                </label>
              </div>
              <datalist id="purchase-locations">
                {setup.locations.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
              <fieldset className="space-y-2">
                <legend className="text-sm font-semibold text-fg">{t("inventory.linesTitle")}</legend>
                <p className="text-xs text-fg-muted">{t("inventory.linesHint")}</p>
                {LINES.map((i) => (
                  <div key={i} className="grid gap-2 sm:grid-cols-[1fr_2fr_6rem_8rem]">
                    <select aria-label={t("inventory.lineItem", { n: i + 1 })} name={`code${i}`} defaultValue="" className={fieldClass()}>
                      <option value="">{t("inventory.lineNoItem")}</option>
                      {items.map((it) => (
                        <option key={it.id} value={it.code}>{it.name}</option>
                      ))}
                    </select>
                    <input aria-label={t("inventory.lineDescription", { n: i + 1 })} name={`desc${i}`} maxLength={120} className={fieldClass()} placeholder={t("inventory.lineDescriptionPlaceholder")} />
                    <input aria-label={t("inventory.lineQuantity", { n: i + 1 })} name={`qty${i}`} type="number" min={1} className={fieldClass()} placeholder={t("inventory.fieldQuantity")} />
                    <input aria-label={t("inventory.lineUnitPrice", { n: i + 1 })} name={`unit${i}`} inputMode="decimal" className={fieldClass()} placeholder={t("inventory.fieldUnitPrice")} />
                  </div>
                ))}
              </fieldset>
              <TextField label={t("inventory.fieldNote")} name="note" maxLength={300} />
              <Button type="submit">{t("inventory.savePurchase")}</Button>
            </form>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
