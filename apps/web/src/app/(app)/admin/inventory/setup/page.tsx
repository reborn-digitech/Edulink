import type { Metadata } from "next";
import { GearIcon, StorefrontIcon, TagIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { TextField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { INPUT, NUM, TD, TH } from "@/components/module-flash";
import { inventorySetup } from "@/lib/inventory";
import { getT } from "@/lib/i18n/server";
import { inventoryGate, InventoryTop } from "../shared";
import { saveCategoryAction, saveVendorAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("inventory.tabSetup") };
}

/** Categories (with the depreciation rate their assets take) and vendors. */
export default async function InventorySetupPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { ctx, t, on, canEdit } = await inventoryGate();
  if (!on) return <ModuleOff module="INVENTORY" t={t} />;
  const params = await searchParams;
  const setup = await inventorySetup(ctx);
  return (
    <div className="space-y-6">
      <InventoryTop t={t} current="setup" params={params} />
      <Card>
        <CardHeader icon={<TagIcon weight="duotone" className="size-5" />} title={t("inventory.categoriesTitle")} description={t("inventory.categoriesBody")} />
        <CardBody className="space-y-4">
          {setup.categories.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("inventory.categoriesNone")} description={t("inventory.categoriesNoneBody")} />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className={TH}>{t("inventory.fieldName")}</th>
                  <th scope="col" className={`${TH} text-right`}>{t("inventory.fieldRate")}</th>
                  <th scope="col" className={`${TH} text-right`}>{t("inventory.colItems")}</th>
                  <th scope="col" className={`${TH} text-right`}>{t("inventory.colAssets")}</th>
                  {canEdit ? <th scope="col" className={TH}><span className="sr-only">{t("common.save")}</span></th> : null}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {setup.categories.map((c) => (
                  <tr key={c.id}>
                    <td className={TD}>
                      {canEdit ? <input form={`cat-${c.id}`} aria-label={t("inventory.fieldName")} className={INPUT} name="name" defaultValue={c.name} maxLength={60} required /> : c.name}
                    </td>
                    <td className={NUM}>
                      {canEdit ? <input form={`cat-${c.id}`} aria-label={t("inventory.fieldRate")} className={`${INPUT} w-24 text-right`} name="ratePercent" inputMode="decimal" defaultValue={c.depreciationRateBp === null ? "" : String(c.depreciationRateBp / 100)} /> : c.depreciationRateBp === null ? t("inventory.rateDefault") : `${c.depreciationRateBp / 100}%`}
                    </td>
                    <td className={NUM}>{c.items}</td>
                    <td className={NUM}>{c.assets}</td>
                    {canEdit ? (
                      <td className={TD}>
                        <form id={`cat-${c.id}`} action={saveCategoryAction}>
                          <input type="hidden" name="id" value={c.id} />
                          <Button type="submit" size="sm" variant="secondary">{t("common.save")}</Button>
                        </form>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {canEdit ? (
            <form action={saveCategoryAction} className="grid gap-3 sm:grid-cols-3">
              <TextField label={t("inventory.newCategory")} name="name" required maxLength={60} />
              <TextField label={t("inventory.fieldRate")} name="ratePercent" inputMode="decimal" hint={t("inventory.fieldRateHint")} />
              <div className="self-end pb-1">
                <Button type="submit">{t("inventory.addCategory")}</Button>
              </div>
            </form>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<StorefrontIcon weight="duotone" className="size-5" />} title={t("inventory.vendorsTitle")} description={t("inventory.vendorsBody")} />
        <CardBody className="space-y-4">
          {setup.vendors.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("inventory.vendorsNone")} description={t("inventory.vendorsNoneBody")} />
          ) : (
            <ul className="divide-y divide-border text-sm">
              {setup.vendors.map((v) => (
                <li key={v.id} className="py-2">
                  <span className="font-medium text-fg">{v.name}</span>
                  <span className="text-fg-muted">{[v.phone, v.gstin, v.address].filter(Boolean).map((x) => ` · ${x}`).join("")}</span>
                </li>
              ))}
            </ul>
          )}
          {canEdit ? (
            <form action={saveVendorAction} className="grid gap-3 sm:grid-cols-2">
              <TextField label={t("inventory.newVendor")} name="name" required maxLength={120} />
              <TextField label={t("inventory.fieldPhone")} name="phone" maxLength={20} />
              <TextField label={t("inventory.fieldGstin")} name="gstin" maxLength={15} />
              <TextField label={t("inventory.fieldAddress")} name="address" maxLength={300} />
              <div>
                <Button type="submit">{t("inventory.addVendor")}</Button>
              </div>
            </form>
          ) : null}
        </CardBody>
      </Card>
      {!canEdit ? (
        <p className="flex items-center gap-2 text-sm text-fg-muted">
          <GearIcon className="size-4" aria-hidden="true" />
          {t("inventory.headReads")}
        </p>
      ) : null}
    </div>
  );
}
