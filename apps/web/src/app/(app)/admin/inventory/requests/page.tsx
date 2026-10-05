import type { Metadata } from "next";
import { HandIcon } from "@phosphor-icons/react/ssr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { fieldClass } from "@/components/ui/field-class";
import { inventorySetup, listRequests } from "@/lib/inventory";
import { formatInZone } from "@/lib/dates";
import { getT } from "@/lib/i18n/server";
import { inventoryGate, InventoryTop } from "../shared";
import { decideRequestAction } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("inventory.tabRequests") };
}

/** What staff have asked the stores for: the waiting ones first, each fulfilled from a place (issued to the asker) or declined with a reason. */
export default async function InventoryRequests({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { ctx, t, locale, on, canEdit } = await inventoryGate();
  if (!on) return <ModuleOff page module="INVENTORY" t={t} />;
  const params = await searchParams;
  const [{ requests }, setup] = await Promise.all([listRequests(ctx), inventorySetup(ctx)]);
  return (
    <div className="space-y-6">
      <InventoryTop t={t} current="requests" params={params} />
      <Card>
        <CardHeader icon={<HandIcon weight="duotone" className="size-5" />} title={t("inventory.requestsTitle")} description={t("inventory.requestsBody")} />
        <CardBody>
          {requests.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("inventory.asksNone")} description={t("inventory.asksNoneBody")} />
          ) : (
            <ul className="divide-y divide-border">
              {requests.map((r) => (
                <li key={r.id} className="space-y-2 py-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      <span className="font-medium text-fg">{r.requesterName}</span> · {t("inventory.askLine", { quantity: r.quantity, item: r.itemName })}
                    </span>
                    <Badge tone={r.status === "PENDING" ? "accent" : r.status === "FULFILLED" ? "ok" : "neutral"} size="sm">{t(`inventory.request${r.status}`)}</Badge>
                  </div>
                  <p className="text-xs text-fg-muted">
                    {formatInZone(new Date(r.createdAt), "Asia/Kolkata", { day: "numeric", month: "short" }, locale)}
                    {r.note ? ` · ${r.note}` : ""}
                    {r.decisionNote ? ` · ${r.decisionNote}` : ""}
                  </p>
                  {canEdit && r.status === "PENDING" ? (
                    <div className="flex flex-wrap gap-2">
                      <form action={decideRequestAction} className="flex flex-wrap items-end gap-2">
                        <input type="hidden" name="requestId" value={r.id} />
                        <input type="hidden" name="decision" value="FULFIL" />
                        {r.itemCode ? <input aria-label={t("inventory.fieldLocation")} className={fieldClass("w-40")} name="location" list="request-locations" defaultValue={setup.locations[0] ?? ""} required maxLength={60} /> : null}
                        <input aria-label={t("inventory.fieldNote")} className={fieldClass("w-48")} name="note" maxLength={300} placeholder={t("inventory.fieldNote")} />
                        <Button type="submit" size="sm">{t("inventory.fulfil")}</Button>
                      </form>
                      <form action={decideRequestAction} className="flex flex-wrap items-end gap-2">
                        <input type="hidden" name="requestId" value={r.id} />
                        <input type="hidden" name="decision" value="DECLINE" />
                        <input aria-label={t("inventory.declineWhy")} className={fieldClass("w-48")} name="note" maxLength={300} placeholder={t("inventory.declineWhy")} />
                        <Button type="submit" size="sm" variant="secondary">{t("inventory.decline")}</Button>
                      </form>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
          <datalist id="request-locations">
            {setup.locations.map((l) => (
              <option key={l} value={l} />
            ))}
          </datalist>
        </CardBody>
      </Card>
    </div>
  );
}
