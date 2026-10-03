import type { Metadata } from "next";
import Link from "next/link";
import { ArchiveIcon, DownloadSimpleIcon, PlusIcon, PrinterIcon } from "@phosphor-icons/react/ssr";
import { formatPaise } from "@edulink/i18n";
import { ASSET_CONDITIONS, ASSET_STATUSES, DEPRECIATION_METHODS, type AssetStatus } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { SelectField, TextField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { LINK, NUM, TD, TH } from "@/components/module-flash";
import { inventorySetup, listAssets, listItems } from "@/lib/inventory";
import { getT } from "@/lib/i18n/server";
import { inventoryGate, InventoryTop } from "../shared";
import { createAssetAction } from "../actions";

/** The auditor's file, built by a route handler rather than a page, so a plain link. */
const REGISTER_FILE = "/admin/inventory/export/fixed-assets";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("inventory.tabAssets") };
}

const TONE: Record<AssetStatus, "ok" | "neutral" | "warn" | "danger"> = { IN_USE: "ok", IN_STORE: "neutral", REPAIR: "warn", DISPOSED: "danger" };

/**
 * The asset register: every asset under its tag, who holds it and where it
 * is, and what it is worth today (worked out on read). The tag sheet prints
 * labels with a QR code each; the fixed-asset register is the auditor's file.
 */
export default async function InventoryAssets({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { ctx, t, locale, on, canEdit } = await inventoryGate();
  if (!on) return <ModuleOff module="INVENTORY" t={t} />;
  const params = await searchParams;
  const status = typeof params.status === "string" && (ASSET_STATUSES as readonly string[]).includes(params.status) ? (params.status as AssetStatus) : undefined;
  const [register, setup, { items }] = await Promise.all([listAssets(ctx, { status }), inventorySetup(ctx), listItems(ctx)]);
  return (
    <div className="space-y-6">
      <InventoryTop t={t} current="assets" params={params} />
      <Card>
        <CardHeader
          icon={<ArchiveIcon weight="duotone" className="size-5" />}
          title={t("inventory.assetsTitle")}
          description={t("inventory.assetsBody", { cost: formatPaise(register.costPaise, locale), book: formatPaise(register.bookValuePaise, locale) })}
          action={
            canEdit ? (
              <span className="flex flex-wrap gap-2">
                <Button asChild variant="secondary" size="sm" icon={<PrinterIcon weight="bold" />}>
                  <a href="/api/v1/admin/inventory/tag-sheet" target="_blank" rel="noreferrer">{t("inventory.printTags")}</a>
                </Button>
                <Button asChild variant="secondary" size="sm" icon={<DownloadSimpleIcon weight="bold" />}>
                  <a href={REGISTER_FILE}>{t("inventory.exportRegister")}</a>
                </Button>
              </span>
            ) : undefined
          }
        />
        <CardBody className="space-y-3">
          <nav aria-label={t("inventory.filterStatus")} className="flex flex-wrap gap-3 text-sm">
            <Link className={LINK} aria-current={!status ? "page" : undefined} href="/admin/inventory/assets">{t("inventory.allStatuses")}</Link>
            {ASSET_STATUSES.map((s) => (
              <Link key={s} className={LINK} aria-current={status === s ? "page" : undefined} href={`/admin/inventory/assets?status=${s}`}>{t(`inventory.status${s}`)}</Link>
            ))}
          </nav>
          {register.assets.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("inventory.assetsNone")} description={t("inventory.assetsNoneBody")} />
          ) : (
            <div className="overflow-x-auto" tabIndex={0}>
              <table className="w-full min-w-[46rem] text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th scope="col" className={TH}>{t("inventory.colTag")}</th>
                    <th scope="col" className={TH}>{t("inventory.colAsset")}</th>
                    <th scope="col" className={TH}>{t("inventory.colWhere")}</th>
                    <th scope="col" className={TH}>{t("inventory.colCustodian")}</th>
                    <th scope="col" className={TH}>{t("inventory.colStatus")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("inventory.colCost")}</th>
                    <th scope="col" className={`${TH} text-right`}>{t("inventory.colBookValue")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {register.assets.map((a) => (
                    <tr key={a.id}>
                      <td className={`${TD} font-mono text-xs`}>
                        <Link className={LINK} href={`/admin/inventory/assets/${encodeURIComponent(a.tagNumber)}`}>{a.tagNumber}</Link>
                      </td>
                      <th scope="row" className={`${TD} text-left font-medium`}>{a.name}<span className="block text-xs font-normal text-fg-muted">{a.categoryName ?? ""}</span></th>
                      <td className={TD}>{a.location}</td>
                      <td className={TD}>{a.custodianName ?? "—"}</td>
                      <td className={TD}><Badge tone={TONE[a.status]} size="sm">{t(`inventory.status${a.status}`)}</Badge></td>
                      <td className={NUM}>{formatPaise(a.costPaise, locale)}</td>
                      <td className={NUM}>{formatPaise(a.bookValuePaise, locale)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {canEdit ? (
        <Card>
          <CardHeader icon={<PlusIcon weight="bold" className="size-5" />} title={t("inventory.assetFormTitle")} description={t("inventory.assetFormBody")} />
          <CardBody>
            <form action={createAssetAction} className="grid gap-3 sm:grid-cols-3">
              <TextField label={t("inventory.fieldTag")} name="tagNumber" required maxLength={30} hint={t("inventory.fieldTagHint")} />
              <TextField label={t("inventory.fieldName")} name="name" required maxLength={120} className="sm:col-span-2" />
              <SelectField label={t("inventory.fieldCategory")} name="categoryId" defaultValue="">
                <option value="">{t("inventory.noCategory")}</option>
                {setup.categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </SelectField>
              <SelectField label={t("inventory.fieldItemOptional")} name="itemCode" defaultValue="">
                <option value="">{t("inventory.lineNoItem")}</option>
                {items.filter((i) => i.kind === "ASSET").map((i) => (
                  <option key={i.id} value={i.code}>{i.name}</option>
                ))}
              </SelectField>
              <SelectField label={t("inventory.fieldVendor")} name="vendorId" defaultValue="">
                <option value="">{t("inventory.noVendor")}</option>
                {setup.vendors.map((v) => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </SelectField>
              <TextField label={t("inventory.fieldPurchaseDate")} name="purchaseDateKey" type="date" />
              <TextField label={t("inventory.fieldCost")} name="cost" inputMode="decimal" required />
              <TextField label={t("inventory.fieldWarranty")} name="warrantyUntilKey" type="date" />
              <TextField label={t("inventory.fieldLocation")} name="location" required maxLength={60} list="asset-locations" />
              <SelectField label={t("inventory.fieldCustodian")} name="custodianMembershipId" defaultValue="">
                <option value="">{t("inventory.inStore")}</option>
                {setup.staff.map((s) => (
                  <option key={s.membershipId} value={s.membershipId}>{s.name}</option>
                ))}
              </SelectField>
              <SelectField label={t("inventory.fieldCondition")} name="condition" defaultValue="GOOD">
                {ASSET_CONDITIONS.map((c) => (
                  <option key={c} value={c}>{t(`inventory.condition${c}`)}</option>
                ))}
              </SelectField>
              <SelectField label={t("inventory.fieldMethod")} name="method" defaultValue="STRAIGHT_LINE">
                {DEPRECIATION_METHODS.map((m) => (
                  <option key={m} value={m}>{t(`inventory.method${m}`)}</option>
                ))}
              </SelectField>
              <TextField label={t("inventory.fieldRate")} name="ratePercent" inputMode="decimal" hint={t("inventory.fieldRateHint")} />
              <TextField label={t("inventory.fieldNote")} name="note" maxLength={300} className="sm:col-span-2" />
              <datalist id="asset-locations">
                {setup.locations.map((l) => (
                  <option key={l} value={l} />
                ))}
              </datalist>
              <div className="sm:col-span-3">
                <Button type="submit">{t("inventory.saveAsset")}</Button>
              </div>
            </form>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
