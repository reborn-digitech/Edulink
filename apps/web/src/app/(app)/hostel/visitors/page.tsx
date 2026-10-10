import type { Metadata } from "next";
import { IdentificationBadgeIcon } from "@phosphor-icons/react/ssr";
import { getT } from "@/lib/i18n/server";
import { listBoarders, listVisitors } from "@/lib/hostel";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WardenFrame, wardenContext, when } from "@/components/hostel/parts";
import { visitorInAction, visitorOutAction } from "../actions";
import { fieldClass } from "@/components/ui/field-class";
import { ActionForm } from "@/components/ui/action-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("hostel.tabVisitors"), robots: { index: false, follow: false } };
}

/** The visitor book: who came to see which boarder, when they came and went, and who let them in. */
export default async function HostelVisitorsPage({ searchParams }: { searchParams: Promise<{ date?: string; ok?: string; error?: string }> }) {
  const { ctx, t, locale, on, canWrite, timeZone } = await wardenContext();
  const { date, ok, error } = await searchParams;
  if (!on) return <WardenFrame t={t} on={false} current="visitors" title={t("hostel.tabVisitors")}>{null}</WardenFrame>;
  const day = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : undefined;
  const [book, boarders] = await Promise.all([listVisitors(ctx, day), canWrite ? listBoarders(ctx) : Promise.resolve({ items: [] })]);
  const back = "/hostel/visitors";
  return (
    <WardenFrame t={t} on current="visitors" title={t("hostel.tabVisitors")} description={t("hostel.visitorsIntro")} ok={ok} error={error}>
      {canWrite && boarders.items.length > 0 ? (
        <Card>
          <CardHeader icon={<IdentificationBadgeIcon weight="duotone" className="size-5" />} title={t("hostel.visitorSignIn")} />
          <CardBody>
            <ActionForm action={visitorInAction} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="back" value={back} />
              <label className="text-sm font-medium text-fg">
                {t("hostel.toSee")}
                <select name="allotmentId" required className={fieldClass("mt-1.5 block")}>
                  {boarders.items.map((b) => (
                    <option key={b.allotmentId} value={b.allotmentId}>
                      {b.name} · {b.hostelName} {b.roomNumber}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-fg">
                {t("hostel.visitorName")}
                <input name="name" required maxLength={80} className={fieldClass("mt-1.5 block")} />
              </label>
              <label className="text-sm font-medium text-fg">
                {t("hostel.relation")}
                <input name="relation" required maxLength={40} className={fieldClass("mt-1.5 block")} />
              </label>
              <label className="text-sm font-medium text-fg">
                {t("hostel.note")}
                <input name="note" maxLength={200} className={fieldClass("mt-1.5 block")} />
              </label>
              <div className="sm:col-span-2">
                <Button type="submit">{t("hostel.signVisitorIn")}</Button>
              </div>
            </ActionForm>
          </CardBody>
        </Card>
      ) : null}
      <form action="/hostel/visitors" method="get" className="flex flex-wrap items-end gap-2">
        <label className="text-sm font-medium text-fg">
          {t("hostel.day")}
          <input type="date" name="date" defaultValue={book.dateKey} className={fieldClass("mt-1.5 block")} />
        </label>
        <Button type="submit" variant="secondary">
          {t("hostel.showDay")}
        </Button>
      </form>
      <Card>
        <CardBody className="p-0">
          {book.items.length === 0 ? (
            <p className="px-5 py-5 text-sm text-fg-muted">{t("hostel.noVisitors")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {book.items.map((v) => (
                <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-fg">
                      {v.name} <span className="font-normal text-fg-muted">({v.relation})</span> · {v.boarderName}
                    </p>
                    <p className="mt-0.5 text-xs text-fg-muted">
                      {v.hostelName} {v.roomNumber} · {t("hostel.inAt", { at: when(v.inAt, timeZone, locale) })}
                      {v.outAt ? ` · ${t("hostel.outAt", { at: when(v.outAt, timeZone, locale) })}` : ""} · {t("hostel.allowedBy", { name: v.allowedByName })}
                      {v.note ? ` · ${v.note}` : ""}
                    </p>
                  </div>
                  {canWrite && !v.outAt ? (
                    <ActionForm action={visitorOutAction}>
                      <input type="hidden" name="visitorId" value={v.id} />
                      <input type="hidden" name="back" value={back} />
                      <Button type="submit" size="sm" variant="secondary">
                        {t("hostel.signVisitorOut")}
                      </Button>
                    </ActionForm>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </WardenFrame>
  );
}
