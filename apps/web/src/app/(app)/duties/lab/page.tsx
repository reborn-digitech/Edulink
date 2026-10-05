import type { Metadata } from "next";
import Link from "next/link";
import { FlaskIcon, HammerIcon, SealCheckIcon, UsersThreeIcon } from "@phosphor-icons/react/ssr";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { SelectField, TextField } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { TableScroll } from "@/components/ui/table-scroll";
import { ModuleOff } from "@/components/module-off";
import { LINK, NUM, TD, TH } from "@/components/module-flash";
import { RecordsFlash } from "@/components/stream-records/flash";
import { dutyPageContext } from "@/components/stream-records/duty-page";
import { labDesk } from "@/lib/duty-desks";
import { formatDateKey } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { labBreakageAction } from "../actions";
import { signPracticalsAction } from "@/app/(app)/admin/stream-records/actions";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("duties.lab.title") };
}

/**
 * THE LAB IN-CHARGE'S DESK (5 Oct 2026): the college's labs with the stock and
 * the assets kept in each (while the college keeps its stores in the app), the
 * batch rosters, the practical record waiting to be signed — signed here by a
 * member holding the duty — and the breakage log, written off the lab's stock.
 * The office and the head read it; lib/duty-desks.ts reads it.
 */
export default async function LabDeskPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { ctx, moduleOn } = await dutyPageContext("LAB_INCHARGE", "ACADEMICS");
  const t = await getT();
  const locale = await getLocale();
  if (!moduleOn) return <ModuleOff module="ACADEMICS" t={t} college />;
  const params = await searchParams;
  const d = await labDesk(ctx);
  const holder = ctx.role === "FACULTY" || ctx.role === "HOD";
  const canBreak = d.inventoryOn && (holder || ctx.role === "ADMIN") && d.labs.length > 0;
  return (
    <div className="space-y-6">
      <PageHeader title={t("duties.lab.title")} description={t("duties.lab.intro")} />
      <RecordsFlash t={t} params={params} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={t("duties.lab.statLabs")} value={d.labs.length} />
        <StatTile label={t("duties.lab.statBatches")} value={d.divisions.reduce((a, x) => a + x.batches.length, 0)} />
        <StatTile label={t("duties.lab.statToSign")} value={d.toSign.length} tone={d.toSign.length ? "warn" : "ok"} />
        <StatTile label={t("duties.lab.statBreakages")} value={d.breakages.length} />
      </div>

      <Card>
        <CardHeader icon={<FlaskIcon weight="duotone" className="size-5" />} title={t("duties.lab.labsTitle")} description={t(d.inventoryOn ? "duties.lab.labsBody" : "duties.lab.labsNoStores")} />
        <CardBody>
          {d.labs.length === 0 ? (
            <EmptyState className="border-0 bg-transparent py-4" title={t("duties.lab.noLabs")} description={t("duties.lab.noLabsBody")} />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {d.labs.map((lab) => (
                <section key={lab.roomId} className="rounded-[--radius-md] border border-border p-3" data-lab={lab.roomId}>
                  <h3 className="text-sm font-semibold text-fg">{lab.name} <span className="font-normal text-fg-muted">· {t("duties.lab.seats", { count: lab.capacity })}</span></h3>
                  {d.inventoryOn ? (
                    <>
                      {lab.stock.length === 0 && lab.assets.length === 0 ? <p className="mt-1 text-sm text-fg-muted">{t("duties.lab.nothingKept")}</p> : null}
                      {lab.stock.length > 0 ? (
                        <ul className="mt-1 text-sm text-fg">
                          {lab.stock.map((s) => (
                            <li key={s.itemCode}>{t("duties.lab.stockLine", { name: s.itemName, code: s.itemCode, quantity: s.quantity, unit: s.unit })}</li>
                          ))}
                        </ul>
                      ) : null}
                      {lab.assets.length > 0 ? (
                        <ul className="mt-1 text-sm text-fg-muted">
                          {lab.assets.map((a) => (
                            <li key={a.tagNumber}>{t("duties.lab.assetLine", { tag: a.tagNumber, name: a.name })}</li>
                          ))}
                        </ul>
                      ) : null}
                    </>
                  ) : null}
                </section>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<UsersThreeIcon weight="duotone" className="size-5" />} title={t("duties.lab.batchesTitle")} description={t("duties.lab.batchesBody")} />
        <CardBody>
          {d.divisions.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("duties.lab.noBatches")}</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {d.divisions.map((div) => (
                <li key={div.divisionId}>
                  <p className="font-semibold text-fg">{div.name}</p>
                  <ul className="text-fg">
                    {div.batches.map((b) => (
                      <li key={b.id}>{t("duties.lab.batchLine", { name: b.name, names: b.members.map((m) => m.name).join(", ") || "—" })}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<SealCheckIcon weight="duotone" className="size-5" />} title={t("duties.lab.signTitle")} description={t("duties.lab.signBody")} />
        <CardBody>
          {d.toSign.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("duties.lab.nothingToSign")}</p>
          ) : holder ? (
            <form action={signPracticalsAction} className="space-y-3">
              <input type="hidden" name="back" value="/duties/lab" />
              <ul className="divide-y divide-border text-sm">
                {d.toSign.map((r) => (
                  <li key={r.id}>
                    <label className="flex min-h-11 items-center gap-2 py-1.5">
                      <input type="checkbox" name="record" value={r.id} defaultChecked className="size-4 accent-[--accent]" />
                      <span>{t("duties.lab.signLine", { course: r.courseCode, n: r.experimentNo, title: r.title, student: r.studentName, day: formatDateKey(r.performedOn, { dateStyle: "medium" }, locale) })}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <Button type="submit" variant="secondary">{t("streamRecords.practicals.sign")}</Button>
            </form>
          ) : (
            <ul className="divide-y divide-border text-sm">
              {d.toSign.map((r) => (
                <li key={r.id} className="py-1.5">{t("duties.lab.signLine", { course: r.courseCode, n: r.experimentNo, title: r.title, student: r.studentName, day: formatDateKey(r.performedOn, { dateStyle: "medium" }, locale) })}</li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-sm">
            <Link className={LINK} href={holder ? (ctx.role === "HOD" ? "/hod/practicals" : "/faculty/practicals") : "/admin/stream-records/practicals"}>{t("duties.lab.openRecord")}</Link>
          </p>
        </CardBody>
      </Card>

      <Card>
        <CardHeader icon={<HammerIcon weight="duotone" className="size-5" />} title={t("duties.lab.breakageTitle")} description={t(d.inventoryOn ? "duties.lab.breakageBody" : "duties.lab.breakageNoStores")} />
        <CardBody className="space-y-4">
          {d.breakages.length > 0 ? (
            <TableScroll label={t("duties.lab.breakageTitle")}>
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className={TH}>{t("duties.lab.colWhen")}</th>
                    <th className={TH}>{t("duties.lab.colItem")}</th>
                    <th className={TH}>{t("duties.lab.colLab")}</th>
                    <th className={`${TH} text-right`}>{t("duties.lab.colQuantity")}</th>
                    <th className={TH}>{t("duties.lab.colNote")}</th>
                  </tr>
                </thead>
                <tbody>
                  {d.breakages.map((b) => (
                    <tr key={b.id}>
                      <td className={TD}>{formatDateKey(b.at.slice(0, 10), { dateStyle: "medium" }, locale)}</td>
                      <td className={TD}>{`${b.itemName} (${b.itemCode})`}</td>
                      <td className={TD}>{b.location}</td>
                      <td className={NUM}>{b.quantity}</td>
                      <td className={TD}>{b.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableScroll>
          ) : d.inventoryOn ? (
            <p className="text-sm text-fg-muted">{t("duties.lab.noBreakages")}</p>
          ) : null}
          {canBreak ? (
            <form action={labBreakageAction} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SelectField name="roomId" label={t("duties.lab.fieldLab")} required>
                {d.labs.map((lab) => (
                  <option key={lab.roomId} value={lab.roomId}>{lab.name}</option>
                ))}
              </SelectField>
              <TextField name="itemCode" label={t("duties.lab.fieldItem")} required maxLength={40} list="lab-items" />
              <datalist id="lab-items">
                {[...new Map(d.labs.flatMap((lab) => lab.stock.map((s) => [s.itemCode, s.itemName] as const))).entries()].map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </datalist>
              <TextField name="quantity" type="number" min={1} label={t("duties.lab.fieldQuantity")} required defaultValue="1" />
              <TextField name="note" label={t("duties.lab.fieldNote")} required minLength={3} maxLength={400} />
              <div className="sm:col-span-2 lg:col-span-4">
                <Button type="submit" variant="secondary">{t("duties.lab.writeOff")}</Button>
              </div>
            </form>
          ) : null}
        </CardBody>
      </Card>
    </div>
  );
}
