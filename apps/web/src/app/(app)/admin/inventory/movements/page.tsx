import type { Metadata } from "next";
import Link from "next/link";
import { ArrowsLeftRightIcon, ClipboardTextIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { SelectField, TextField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { LINK, NUM, TD, TH } from "@/components/module-flash";
import { inventorySetup, listItems, listMovements } from "@/lib/inventory";
import { formatDateKey, formatInZone } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";
import { inventoryGate, InventoryTop } from "../shared";
import { recordMovementAction, stockTakeAction } from "../actions";
import { TableScroll } from "@/components/ui/table-scroll";
import { fieldClass } from "@/components/ui/field-class";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("inventory.tabMovements") };
}

const MONTH = /^\d{4}-\d{2}$/;
function shift(month: string, by: number): string {
  const [y, m] = month.split("-").map(Number) as [number, number];
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return d.toISOString().slice(0, 7);
}

/**
 * Stock movements by month, the admin's entry form (issue, return, adjust,
 * write off), and the stock-take: choose a place, type what was counted,
 * and each difference is written as an adjustment in one go.
 */
export default async function InventoryMovements({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { ctx, t, locale, on, canEdit } = await inventoryGate();
  if (!on) return <ModuleOff page module="INVENTORY" t={t} />;
  const params = await searchParams;
  const month = typeof params.month === "string" && MONTH.test(params.month) ? params.month : new Date().toISOString().slice(0, 7);
  const location = typeof params.location === "string" ? params.location.slice(0, 60) : "";
  const [{ movements }, setup, { items }] = await Promise.all([listMovements(ctx, { month }), inventorySetup(ctx), listItems(ctx)]);
  const monthLabel = formatDateKey(`${month}-01`, { month: "long", year: "numeric" }, locale);
  return (
    <div className="space-y-6">
      <InventoryTop t={t} current="movements" params={params} />
      <Card>
        <CardHeader
          icon={<ArrowsLeftRightIcon weight="duotone" className="size-5" />}
          title={t("inventory.movementsTitle", { month: monthLabel })}
          action={
            <span className="flex gap-3 text-sm">
              <Link className={LINK} href={`/admin/inventory/movements?month=${shift(month, -1)}`}>{t("inventory.previousMonth")}</Link>
              <Link className={LINK} href={`/admin/inventory/movements?month=${shift(month, 1)}`}>{t("inventory.nextMonth")}</Link>
            </span>
          }
        />
        <CardBody>
          {movements.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("inventory.movementsNone")} description={t("inventory.movementsNoneBody")} />
          ) : (
            <TableScroll>
              <table className="w-full min-w-[44rem] text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className={TH}>{t("inventory.colWhen")}</th>
                    <th scope="col" className={TH}>{t("inventory.colItem")}</th>
                    <th scope="col" className={TH}>{t("inventory.colKind")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("inventory.colChange")}</th>
                    <th scope="col" className={TH}>{t("inventory.colWhere")}</th>
                    <th scope="col" className={TH}>{t("inventory.colBy")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {movements.map((m) => (
                    <tr key={m.id}>
                      <td className={TD}>{formatInZone(new Date(m.at), "Asia/Kolkata", { day: "numeric", month: "short" }, locale)}</td>
                      <td className={TD}>{m.itemName}</td>
                      <td className={TD}>{t(`inventory.kind${m.kind}`)}{m.reference ? <span className="block text-xs text-fg-muted">{m.reference}</span> : null}</td>
                      <td className={NUM}>{m.delta > 0 ? `+${m.delta}` : m.delta} {m.unit}</td>
                      <td className={TD}>{[m.location, m.toName, m.toRoom, m.toDepartment].filter(Boolean).join(" → ")}{m.note ? <span className="block text-xs text-fg-muted">{m.note}</span> : null}</td>
                      <td className={TD}>{m.byName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
        </CardBody>
      </Card>

      {canEdit ? (
        <>
          <Card>
            <CardHeader icon={<PlusIcon weight="bold" className="size-5" />} title={t("inventory.movementFormTitle")} description={t("inventory.movementFormBody")} />
            <CardBody>
              {items.length === 0 ? (
                <EmptyState className="border-0 bg-transparent py-4" title={t("inventory.itemsNone")} description={t("inventory.itemsNoneBody")} />
              ) : (
                <form action={recordMovementAction} className="grid gap-3 sm:grid-cols-3">
                  <SelectField label={t("inventory.fieldItem")} name="itemCode" required defaultValue="">
                    <option value="" disabled>{t("inventory.chooseItem")}</option>
                    {items.map((i) => (
                      <option key={i.id} value={i.code}>{i.name} ({i.code}) · {i.onHand} {i.unit}</option>
                    ))}
                  </SelectField>
                  <SelectField label={t("inventory.fieldKind")} name="kind" defaultValue="ISSUE">
                    {(["ISSUE", "RETURN", "ADJUST", "WRITE_OFF"] as const).map((k) => (
                      <option key={k} value={k}>{t(`inventory.kind${k}`)}</option>
                    ))}
                  </SelectField>
                  <TextField label={t("inventory.fieldQuantity")} name="quantity" type="number" required hint={t("inventory.fieldQuantityHint")} />
                  <TextField label={t("inventory.fieldLocation")} name="location" required maxLength={60} list="inventory-locations" defaultValue={setup.locations[0] ?? ""} />
                  <SelectField label={t("inventory.fieldTo")} name="toMembershipId" defaultValue="">
                    <option value="">{t("inventory.nobody")}</option>
                    {setup.staff.map((s) => (
                      <option key={s.membershipId} value={s.membershipId}>{s.name}</option>
                    ))}
                  </SelectField>
                  <TextField label={t("inventory.fieldRoom")} name="toRoom" maxLength={60} />
                  <TextField label={t("inventory.fieldDepartment")} name="toDepartment" maxLength={60} />
                  <TextField label={t("inventory.fieldReference")} name="reference" maxLength={60} />
                  <TextField label={t("inventory.fieldNote")} name="note" maxLength={300} />
                  <div className="sm:col-span-3">
                    <Button type="submit">{t("inventory.saveMovement")}</Button>
                  </div>
                </form>
              )}
              <datalist id="inventory-locations">
                {setup.locations.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
            </CardBody>
          </Card>

          <Card>
            <CardHeader icon={<ClipboardTextIcon weight="duotone" className="size-5" />} title={t("inventory.stockTakeTitle")} description={t("inventory.stockTakeBody")} />
            <CardBody className="space-y-4">
              <form method="get" action="/admin/inventory/movements" className="flex flex-wrap items-end gap-2">
                <label className="block min-w-48 flex-1 text-sm">
                  <span className="mb-1 block font-medium text-fg">{t("inventory.fieldLocation")}</span>
                  <input className={fieldClass()} name="location" list="inventory-locations" defaultValue={location} maxLength={60} required />
                </label>
                <Button type="submit" variant="secondary" size="sm">{t("inventory.stockTakeStart")}</Button>
              </form>
              {location ? (
                <form action={stockTakeAction} className="space-y-3">
                  <input type="hidden" name="location" value={location} />
                  <TableScroll>
                    <table className="w-full min-w-[30rem] text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th scope="col" className={TH}>{t("inventory.colItem")}</th>
                          <th scope="col" className={`${TH} text-right`}>{t("inventory.colRecorded")}</th>
                          <th scope="col" className={`${TH} text-right`}>{t("inventory.colCounted")}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {items.map((i) => {
                          const recorded = i.stock.find((s) => s.location === location)?.quantity ?? 0;
                          return (
                            <tr key={i.id}>
                              <th scope="row" className={`${TD} text-left font-medium`}>{i.name} <span className="text-xs text-fg-muted">{i.code}</span></th>
                              <td className={NUM}>{recorded} {i.unit}</td>
                              <td className={NUM}>
                                <input aria-label={t("inventory.countedFor", { item: i.name })} className={fieldClass("w-24 text-right")} type="number" min={0} name={`count:${i.code}`} placeholder={String(recorded)} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </TableScroll>
                  <p className="text-xs text-fg-muted">{t("inventory.stockTakeBlank")}</p>
                  <TextField label={t("inventory.fieldNote")} name="note" maxLength={300} />
                  <Button type="submit">{t("inventory.stockTakeSave", { location })}</Button>
                </form>
              ) : null}
            </CardBody>
          </Card>
        </>
      ) : null}
    </div>
  );
}
