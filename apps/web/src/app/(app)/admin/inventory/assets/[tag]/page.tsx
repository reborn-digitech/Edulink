import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArchiveIcon, ClockCounterClockwiseIcon } from "@phosphor-icons/react/ssr";
import { formatPaise } from "@edulink/i18n";
import { ASSET_CONDITIONS } from "@edulink/contracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { SelectField, TextField } from "@/components/ui/field";
import { ModuleOff } from "@/components/module-off";
import { ModuleFlash, LINK } from "@/components/module-flash";
import { PageHeader } from "@/components/ui/page-header";
import { AccessError } from "@/lib/access-error";
import { assetDetail, inventorySetup } from "@/lib/inventory";
import { formatDateKey, formatInZone } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";
import { inventoryGate } from "../../shared";
import { assetActionAction } from "../../actions";

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  return { title: `${decodeURIComponent((await params).tag)} · ${(await getT())("inventory.tabAssets")}` };
}

/** One asset: its facts and worth, what happened to it, and (for the admin) what can happen next. */
export default async function AssetPage({ params, searchParams }: { params: Promise<{ tag: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { ctx, t, locale, on, canEdit } = await inventoryGate();
  if (!on) return <ModuleOff module="INVENTORY" t={t} />;
  const tag = decodeURIComponent((await params).tag);
  const sp = await searchParams;
  let detail;
  try {
    detail = await assetDetail(ctx, tag);
  } catch (error) {
    if (error instanceof AccessError) notFound();
    throw error;
  }
  const setup = await inventorySetup(ctx);
  const a = detail.asset;
  const day = (k: string | null) => (k ? formatDateKey(k, { day: "numeric", month: "short", year: "numeric" }, locale) : "—");
  const facts: [string, string][] = [
    [t("inventory.colCategory"), a.categoryName ?? "—"],
    [t("inventory.colWhere"), a.location],
    [t("inventory.colCustodian"), a.custodianName ?? t("inventory.inStore")],
    [t("inventory.fieldCondition"), t(`inventory.condition${a.condition}`)],
    [t("inventory.fieldPurchaseDate"), day(a.purchaseDateKey)],
    [t("inventory.fieldVendor"), a.vendorName ?? "—"],
    [t("inventory.fieldWarranty"), day(a.warrantyUntilKey)],
    [t("inventory.colCost"), formatPaise(a.costPaise, locale, { always: true })],
    [t("inventory.fieldMethod"), `${t(`inventory.method${a.method}`)} · ${(a.rateBp / 100).toFixed(2)}%`],
    [t("inventory.colDepreciation"), formatPaise(a.accumulatedPaise, locale, { always: true })],
    [t("inventory.colBookValue"), formatPaise(a.bookValuePaise, locale, { always: true })],
    [t("inventory.lastAudited"), a.lastAuditedAt ? formatInZone(new Date(a.lastAuditedAt), "Asia/Kolkata", { day: "numeric", month: "short", year: "numeric" }, locale) : "—"],
  ];
  const disposed = a.status === "DISPOSED";
  return (
    <div className="space-y-6">
      <PageHeader title={[a.tagNumber, a.name].join(" · ")} description={<Link className={LINK} href="/admin/inventory/assets">{t("inventory.backToAssets")}</Link>} meta={<Badge tone={disposed ? "danger" : a.status === "REPAIR" ? "warn" : "ok"}>{t(`inventory.status${a.status}`)}</Badge>} />
      <ModuleFlash t={t} params={sp} />
      <Card>
        <CardHeader icon={<ArchiveIcon weight="duotone" className="size-5" />} title={t("inventory.assetFacts")} />
        <CardBody>
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {facts.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-border py-1">
                <dt className="text-fg-muted">{k}</dt>
                <dd className="text-right font-medium text-fg">{v}</dd>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>

      {canEdit && !disposed ? (
        <Card>
          <CardHeader title={t("inventory.assetActionsTitle")} description={t("inventory.assetActionsBody")} />
          <CardBody className="grid gap-4 md:grid-cols-2">
            <form action={assetActionAction} className="space-y-2 rounded-[var(--radius-md)] border border-border p-3">
              <input type="hidden" name="tag" value={a.tagNumber} />
              <input type="hidden" name="action" value="ASSIGN" />
              <SelectField label={t("inventory.fieldCustodian")} name="custodianMembershipId" defaultValue={a.custodianMembershipId ?? ""}>
                <option value="">{t("inventory.inStore")}</option>
                {setup.staff.map((s) => (
                  <option key={s.membershipId} value={s.membershipId}>{s.name}</option>
                ))}
              </SelectField>
              <TextField label={t("inventory.fieldNote")} name="note" maxLength={300} />
              <Button type="submit" size="sm">{t("inventory.actionAssign")}</Button>
            </form>
            <form action={assetActionAction} className="space-y-2 rounded-[var(--radius-md)] border border-border p-3">
              <input type="hidden" name="tag" value={a.tagNumber} />
              <input type="hidden" name="action" value="MOVE" />
              <TextField label={t("inventory.fieldNewLocation")} name="location" required maxLength={60} defaultValue={a.location} />
              <TextField label={t("inventory.fieldNote")} name="note" maxLength={300} />
              <Button type="submit" size="sm">{t("inventory.actionMove")}</Button>
            </form>
            <form action={assetActionAction} className="space-y-2 rounded-[var(--radius-md)] border border-border p-3">
              <input type="hidden" name="tag" value={a.tagNumber} />
              <input type="hidden" name="action" value="AUDIT" />
              <SelectField label={t("inventory.fieldCondition")} name="condition" defaultValue={a.condition}>
                {ASSET_CONDITIONS.map((c) => (
                  <option key={c} value={c}>{t(`inventory.condition${c}`)}</option>
                ))}
              </SelectField>
              <TextField label={t("inventory.fieldNote")} name="note" maxLength={300} />
              <Button type="submit" size="sm" variant="secondary">{t("inventory.actionAudit")}</Button>
            </form>
            <form action={assetActionAction} className="space-y-2 rounded-[var(--radius-md)] border border-border p-3">
              <input type="hidden" name="tag" value={a.tagNumber} />
              <input type="hidden" name="action" value={a.status === "REPAIR" ? "REPAIRED" : "REPAIR"} />
              {a.status === "REPAIR" ? (
                <SelectField label={t("inventory.fieldCondition")} name="condition" defaultValue={a.condition}>
                  {ASSET_CONDITIONS.map((c) => (
                    <option key={c} value={c}>{t(`inventory.condition${c}`)}</option>
                  ))}
                </SelectField>
              ) : null}
              <TextField label={t("inventory.fieldNote")} name="note" maxLength={300} />
              <Button type="submit" size="sm" variant="secondary">{a.status === "REPAIR" ? t("inventory.actionRepaired") : t("inventory.actionRepair")}</Button>
            </form>
            <form action={assetActionAction} className="space-y-2 rounded-[var(--radius-md)] border border-danger/40 p-3 md:col-span-2">
              <input type="hidden" name="tag" value={a.tagNumber} />
              <input type="hidden" name="action" value="DISPOSE" />
              <p className="text-sm text-fg-muted">{t("inventory.disposeBody")}</p>
              <TextField label={t("inventory.fieldDisposeNote")} name="note" required maxLength={300} />
              <Button type="submit" size="sm" variant="danger">{t("inventory.actionDispose")}</Button>
            </form>
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader icon={<ClockCounterClockwiseIcon weight="duotone" className="size-5" />} title={t("inventory.historyTitle")} />
        <CardBody>
          <ol className="divide-y divide-border">
            {detail.events.map((e) => (
              <li key={e.id} className="py-2 text-sm">
                <span className="font-medium text-fg">{t(`inventory.event${e.kind}`)}</span>
                <span className="text-fg-muted"> · {formatInZone(new Date(e.at), "Asia/Kolkata", { day: "numeric", month: "short", year: "numeric" }, locale)} · {e.byName}</span>
                {e.note ? <span className="block text-xs text-fg-muted">{e.note}</span> : null}
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>
    </div>
  );
}
