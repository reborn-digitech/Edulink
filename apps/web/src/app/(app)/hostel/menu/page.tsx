import type { Metadata } from "next";
import Link from "next/link";
import { ForkKnifeIcon } from "@phosphor-icons/react/ssr";
import { MESS_MEALS } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { messMenu, messSheet } from "@/lib/hostel";
import { todayKey, isoToDisplayDate } from "@/lib/dates";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MEAL_KEY, WEEKDAY_KEY, WardenFrame, wardenContext } from "@/components/hostel/parts";
import { messAttendanceAction, saveMenuAction } from "../actions";
import { fieldClass } from "@/components/ui/field-class";
import { ActionForm } from "@/components/ui/action-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("hostel.tabMenu"), robots: { index: false, follow: false } };
}

/** Each house's week of meals, Monday to Sunday; a meal left empty is not served. Boarders and families read today's. */
export default async function HostelMenuPage({ searchParams }: { searchParams: Promise<{ meal?: string; ok?: string; error?: string }> }) {
  const { ctx, t, on, canWrite, timeZone } = await wardenContext();
  const { meal: rawMeal, ok, error } = await searchParams;
  if (!on) return <WardenFrame t={t} on={false} current="menu" title={t("hostel.tabMenu")}>{null}</WardenFrame>;
  const menu = await messMenu(ctx);
  const today = todayKey(timeZone);
  const meal = (MESS_MEALS as readonly string[]).includes(rawMeal ?? "") ? (rawMeal as (typeof MESS_MEALS)[number]) : "LUNCH";
  // Who ate: only for a house that keeps mess attendance (its switch on the office's hostel form).
  const sheets = await Promise.all(menu.hostels.map((h) => (h.messAttendance ? messSheet(ctx, h.hostelId, today, meal) : Promise.resolve(null))));
  return (
    <WardenFrame t={t} on current="menu" title={t("hostel.tabMenu")} description={t("hostel.menuIntro")} ok={ok} error={error}>
      {menu.hostels.length === 0 ? <p className="text-sm text-fg-muted">{t("hostel.noHostels")}</p> : null}
      {menu.hostels.map((h, i) => {
        const items = new Map(h.entries.map((e) => [`${e.weekday}-${e.meal}`, e.items]));
        return (
          <Card key={h.hostelId}>
            <CardHeader icon={<ForkKnifeIcon weight="duotone" className="size-5" />} title={h.hostelName} />
            <CardBody>
              <ActionForm action={saveMenuAction} className="space-y-4">
                <input type="hidden" name="back" value="/hostel/menu" />
                <input type="hidden" name="hostelId" value={h.hostelId} />
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <fieldset key={d} disabled={!menu.canEdit} className="grid gap-2 sm:grid-cols-4">
                    <legend className="mb-1 text-sm font-semibold text-fg">{t(WEEKDAY_KEY[d]!)}</legend>
                    {MESS_MEALS.map((m) => (
                      <label key={m} className="text-xs text-fg-muted">
                        {t(MEAL_KEY[m])}
                        <input name={`m-${d}-${m}`} defaultValue={items.get(`${d}-${m}`) ?? ""} maxLength={300} className={fieldClass("mt-1 block")} />
                      </label>
                    ))}
                  </fieldset>
                ))}
                {menu.canEdit ? <Button type="submit">{t("hostel.saveMenu")}</Button> : null}
              </ActionForm>
              {sheets[i] ? (
                <div className="mt-6 space-y-3 border-t border-border pt-4">
                  <h3 className="text-sm font-semibold text-fg">{t("hostel.messTitle", { date: isoToDisplayDate(today) })}</h3>
                  <p className="flex flex-wrap gap-3 text-sm">
                    {MESS_MEALS.map((m) => (
                      <Link key={m} href={`/hostel/menu?meal=${m}`} aria-current={m === meal ? "page" : undefined} className={m === meal ? "font-semibold text-accent-strong" : "text-fg-muted hover:text-fg"}>
                        {t(MEAL_KEY[m])}
                      </Link>
                    ))}
                  </p>
                  <ActionForm action={messAttendanceAction} className="space-y-2">
                    <input type="hidden" name="back" value={`/hostel/menu?meal=${meal}`} />
                    <input type="hidden" name="hostelId" value={h.hostelId} />
                    <input type="hidden" name="dateKey" value={today} />
                    <input type="hidden" name="meal" value={meal} />
                    {sheets[i]!.length === 0 ? <p className="text-sm text-fg-muted">{t("hostel.noBoarders")}</p> : null}
                    <fieldset disabled={!canWrite} className="grid gap-1 sm:grid-cols-2">
                      <legend className="sr-only">{t(MEAL_KEY[meal])}</legend>
                      {sheets[i]!.map((b) => (
                        <label key={b.allotmentId} className="flex min-h-11 items-center gap-2 text-sm text-fg">
                          <input type="hidden" name="allotmentId" value={b.allotmentId} />
                          <input type="checkbox" name="present" value={b.allotmentId} defaultChecked={b.present !== false} className="size-4" />
                          {b.name} <span className="text-fg-muted">· {t("hostel.roomShort", { room: b.roomNumber })}</span>
                        </label>
                      ))}
                    </fieldset>
                    {canWrite && sheets[i]!.length > 0 ? (
                      <Button type="submit" variant="secondary">
                        {t("hostel.saveMess")}
                      </Button>
                    ) : null}
                  </ActionForm>
                </div>
              ) : null}
            </CardBody>
          </Card>
        );
      })}
    </WardenFrame>
  );
}
