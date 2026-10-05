import type { Metadata } from "next";
import { PackageIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { INVENTORY_ITEM_KINDS } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { SelectField, TextField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { NUM, TD, TH } from "@/components/module-flash";
import { inventorySetup, listItems } from "@/lib/inventory";
import { getT } from "@/lib/i18n/server";
import { inventoryGate, InventoryTop } from "../shared";
import { saveItemAction } from "../actions";
import { TableScroll } from "@/components/ui/table-scroll";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("inventory.tabItems") };
}

/** Every item the stores keep, its stock at each place, and (for the admin) the form that adds or changes one by its code. */
export default async function InventoryItems({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { ctx, t, on, canEdit } = await inventoryGate();
  if (!on) return <ModuleOff page module="INVENTORY" t={t} />;
  const params = await searchParams;
  const [{ items }, setup] = await Promise.all([listItems(ctx, { archived: params.archived === "1" }), inventorySetup(ctx)]);
  return (
    <div className="space-y-6">
      <InventoryTop t={t} current="items" params={params} />
      <Card>
        <CardHeader icon={<PackageIcon weight="duotone" className="size-5" />} title={t("inventory.itemsTitle")} description={t("inventory.itemsBody")} />
        <CardBody>
          {items.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("inventory.itemsNone")} description={t("inventory.itemsNoneBody")} />
          ) : (
            <TableScroll>
              <table className="w-full min-w-[40rem] text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className={TH}>{t("inventory.colCode")}</th>
                    <th scope="col" className={TH}>{t("inventory.colItem")}</th>
                    <th scope="col" className={TH}>{t("inventory.colCategory")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("inventory.colOnHand")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("inventory.colReorder")}</th>
                    <th scope="col" className={TH}>{t("inventory.colWhere")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((i) => (
                    <tr key={i.id}>
                      <td className={`${TD} font-mono text-xs`}>{i.code}</td>
                      <th scope="row" className={`${TD} text-left font-medium text-fg`}>
                        {i.name}
                        {i.low ? <Badge tone="warn" size="sm" className="ml-2">{t("inventory.low")}</Badge> : null}
                        {i.archived ? <Badge tone="neutral" size="sm" className="ml-2">{t("inventory.archived")}</Badge> : null}
                        <span className="block text-xs font-normal text-fg-muted">{t(`inventory.itemKind${i.kind}`)}</span>
                      </th>
                      <td className={TD}>{i.categoryName ?? "—"}</td>
                      <td className={NUM}>{i.onHand} {i.unit}</td>
                      <td className={NUM}>{i.reorderLevel}</td>
                      <td className={TD}>{i.stock.map((s) => `${s.location}: ${s.quantity}`).join(" · ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          )}
        </CardBody>
      </Card>

      {canEdit ? (
        <Card>
          <CardHeader icon={<PlusIcon weight="bold" className="size-5" />} title={t("inventory.itemFormTitle")} description={t("inventory.itemFormBody")} />
          <CardBody>
            <form action={saveItemAction} className="grid gap-3 sm:grid-cols-3">
              <TextField label={t("inventory.fieldCode")} name="code" required maxLength={30} hint={t("inventory.fieldCodeHint")} />
              <TextField label={t("inventory.fieldName")} name="name" required maxLength={120} className="sm:col-span-2" />
              <SelectField label={t("inventory.fieldCategory")} name="categoryId" defaultValue="">
                <option value="">{t("inventory.noCategory")}</option>
                {setup.categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </SelectField>
              <TextField label={t("inventory.fieldUnit")} name="unit" required maxLength={20} placeholder={t("inventory.fieldUnitPlaceholder")} />
              <TextField label={t("inventory.fieldReorder")} name="reorderLevel" type="number" min={0} defaultValue={0} />
              <SelectField label={t("inventory.fieldKind")} name="kind" defaultValue="CONSUMABLE">
                {INVENTORY_ITEM_KINDS.map((k) => (
                  <option key={k} value={k}>{t(`inventory.itemKind${k}`)}</option>
                ))}
              </SelectField>
              <label className="flex items-center gap-2 self-end pb-3 text-sm text-fg">
                <input type="checkbox" name="archived" className="size-4" />
                {t("inventory.fieldArchive")}
              </label>
              <div className="sm:col-span-3">
                <Button type="submit">{t("inventory.saveItem")}</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
