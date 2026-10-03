import type { Metadata } from "next";
import Link from "next/link";
import { ArchiveIcon, HandIcon, PackageIcon } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { SelectField, TextField } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { ModuleOff } from "@/components/module-off";
import { ModuleFlash, NUM, TD } from "@/components/module-flash";
import { requireUser } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { myInventory } from "@/lib/inventory";
import { SCHOOL_STAFF_ROLES } from "@/lib/staff-records";
import { getT } from "@/lib/i18n/server";
import { askItemAction, cancelAskAction } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("inventory.myTitle") };
}

/**
 * What the school's stores have issued to me and I still hold, the assets I
 * am the custodian of, and my asks — with a way to ask for more. Any member
 * of staff, under /account because it is the person's own.
 */
export default async function MyItemsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const ctx = await requireUser();
  const t = await getT();
  const params = await searchParams;
  if (!ctx.schoolId || !ctx.role || !(SCHOOL_STAFF_ROLES as readonly string[]).includes(ctx.role)) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("inventory.myTitle")} />
        <EmptyState title={t("inventory.notStaffTitle")} description={t("inventory.notStaffBody")} action={<Button asChild size="sm"><Link href="/account">{t("nav.account")}</Link></Button>} />
      </div>
    );
  }
  if (!(await isModuleOn(ctx.schoolId, "INVENTORY"))) return <ModuleOff module="INVENTORY" t={t} />;
  const mine = await myInventory(ctx);
  return (
    <div className="space-y-6">
      <PageHeader title={t("inventory.myTitle")} description={t("inventory.myIntro")} />
      <ModuleFlash t={t} params={params} />
      <Card>
        <CardHeader icon={<PackageIcon weight="duotone" className="size-5" />} title={t("inventory.myIssued")} />
        <CardBody>
          {mine.issued.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("inventory.myIssuedNone")} description={t("inventory.myIssuedNoneBody")} />
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {mine.issued.map((i) => (
                  <tr key={i.itemCode}>
                    <td className={TD}>{i.itemName}</td>
                    <td className={NUM}>{i.quantity} {i.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<ArchiveIcon weight="duotone" className="size-5" />} title={t("inventory.myAssets")} description={t("inventory.myAssetsBody")} />
        <CardBody>
          {mine.assets.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("inventory.myAssetsNone")} description={t("inventory.myAssetsNoneBody")} />
          ) : (
            <ul className="divide-y divide-border text-sm">
              {mine.assets.map((a) => (
                <li key={a.tagNumber} className="py-2">
                  <span className="font-mono text-xs">{a.tagNumber}</span> · <span className="font-medium">{a.name}</span> · {a.location} · {t(`inventory.condition${a.condition}`)}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<HandIcon weight="duotone" className="size-5" />} title={t("inventory.myAsks")} />
        <CardBody className="space-y-4">
          {mine.requests.length ? (
            <ul className="divide-y divide-border text-sm">
              {mine.requests.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span>
                    {t("inventory.askLine", { quantity: r.quantity, item: r.itemName })}
                    {r.decisionNote ? <span className="block text-xs text-fg-muted">{r.decisionNote}</span> : null}
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge size="sm" tone={r.status === "FULFILLED" ? "ok" : r.status === "PENDING" ? "accent" : "neutral"}>{t(`inventory.request${r.status}`)}</Badge>
                    {r.status === "PENDING" ? (
                      <form action={cancelAskAction}>
                        <input type="hidden" name="requestId" value={r.id} />
                        <Button type="submit" size="sm" variant="ghost">{t("inventory.cancelAsk")}</Button>
                      </form>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <form action={askItemAction} className="grid gap-3 sm:grid-cols-3">
            <SelectField label={t("inventory.fieldItem")} name="itemCode" defaultValue="">
              <option value="">{t("inventory.somethingElse")}</option>
              {mine.items.map((i) => (
                <option key={i.code} value={i.code}>{i.name} ({i.unit})</option>
              ))}
            </SelectField>
            <TextField label={t("inventory.fieldItemText")} name="itemText" maxLength={120} hint={t("inventory.fieldItemTextHint")} />
            <TextField label={t("inventory.fieldQuantity")} name="quantity" type="number" min={1} required defaultValue={1} />
            <TextField label={t("inventory.fieldNote")} name="note" maxLength={300} className="sm:col-span-2" />
            <div className="self-end">
              <Button type="submit">{t("inventory.askSend")}</Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
