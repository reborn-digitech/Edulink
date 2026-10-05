import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import { HOSTEL_ROLL_SLOTS, HOSTEL_ROLL_STATUSES } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { formatDateKey } from "@/lib/dates";
import { hostelsView, rollCallSheet } from "@/lib/hostel";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { ROLL_STATUS_KEY, SLOT_KEY, WardenFrame, wardenContext, when } from "@/components/hostel/parts";
import { correctRollCallAction, rollCallAction } from "../actions";
import { fieldClass } from "@/components/ui/field-class";
import { ActionForm } from "@/components/ui/action-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("hostel.tabRollCall"), robots: { index: false, follow: false } };
}

/**
 * The roll call for a house and a slot: every boarder with PRESENT ticked,
 * ON LEAVE for one out on approved leave, and ABSENT to mark. Taken once; the
 * form carries an id minted here so a double press is the same call. On the
 * phone it goes through the outbox when there is no network.
 */
export default async function HostelRollCallPage({ searchParams }: { searchParams: Promise<{ hostel?: string; slot?: string; ok?: string; error?: string }> }) {
  const { ctx, t, locale, on, canWrite, timeZone } = await wardenContext();
  const { hostel, slot: rawSlot, ok, error } = await searchParams;
  if (!on) return <WardenFrame t={t} on={false} current="rollcall" title={t("hostel.tabRollCall")}>{null}</WardenFrame>;
  const view = await hostelsView(ctx);
  const hostelId = view.hostels.find((h) => h.id === hostel)?.id ?? view.hostels[0]?.id;
  const slot = rawSlot === "MORNING" ? "MORNING" : "NIGHT";
  const sheet = hostelId ? await rollCallSheet(ctx, hostelId, slot) : null;
  const back = `/hostel/rollcall?hostel=${hostelId ?? ""}&slot=${slot}`;
  return (
    <WardenFrame t={t} on current="rollcall" title={t("hostel.tabRollCall")} description={t("hostel.rollIntro")} ok={ok} error={error}>
      <form action="/hostel/rollcall" method="get" className="flex flex-wrap items-end gap-2">
        <label className="min-w-0 flex-1 basis-48 text-sm font-medium text-fg">
          {t("hostel.whichHostel")}
          <select name="hostel" defaultValue={hostelId} className={fieldClass("mt-1.5 block")}>
            {view.hostels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 basis-40 text-sm font-medium text-fg">
          {t("hostel.whichSlot")}
          <select name="slot" defaultValue={slot} className={fieldClass("mt-1.5 block")}>
            {HOSTEL_ROLL_SLOTS.map((s) => (
              <option key={s} value={s}>
                {t(SLOT_KEY[s])}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="secondary">
          {t("hostel.open")}
        </Button>
      </form>
      {sheet ? (
        <Card>
          <CardHeader title={t("hostel.sheetTitle", { hostel: sheet.hostelName, slot: t(SLOT_KEY[sheet.slot]), date: formatDateKey(sheet.dateKey, { weekday: "short", day: "numeric", month: "numeric", year: "numeric" }, locale) })} description={sheet.taken ? t("hostel.rollTakenAt", { at: when(sheet.taken.at, timeZone, locale), name: sheet.taken.byName }) : t("hostel.rollHint")} />
          <CardBody>
            {sheet.entries.length === 0 ? (
              <p className="text-sm text-fg-muted">{t("hostel.noBoarders")}</p>
            ) : (
              <ActionForm action={rollCallAction} className="space-y-3">
                <input type="hidden" name="back" value={back} />
                <input type="hidden" name="hostelId" value={sheet.hostelId} />
                <input type="hidden" name="dateKey" value={sheet.dateKey} />
                <input type="hidden" name="slot" value={sheet.slot} />
                <input type="hidden" name="clientId" value={`web-${randomUUID()}`} />
                <ul className="divide-y divide-border rounded-[var(--radius-md)] border border-border">
                  {sheet.entries.map((e) => (
                    <li key={e.allotmentId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
                      <input type="hidden" name="allotmentId" value={e.allotmentId} />
                      <span className="min-w-0 text-sm text-fg">
                        <span className="font-medium">{e.name}</span> <span className="text-fg-muted">· {t("hostel.roomBed", { room: e.roomNumber, bed: e.bed })}</span>
                      </span>
                      <fieldset className="flex gap-3" disabled={Boolean(sheet.taken) || !canWrite}>
                        <legend className="sr-only">{e.name}</legend>
                        {HOSTEL_ROLL_STATUSES.map((s) => (
                          <label key={s} className="flex min-h-11 items-center gap-1.5 text-sm text-fg">
                            <input type="radio" name={`status-${e.allotmentId}`} value={s} defaultChecked={e.status === s} className="size-4" />
                            {t(ROLL_STATUS_KEY[s])}
                          </label>
                        ))}
                      </fieldset>
                    </li>
                  ))}
                </ul>
                {!sheet.taken && canWrite ? <Button type="submit">{t("hostel.saveRollCall")}</Button> : null}
              </ActionForm>
            )}
          </CardBody>
        </Card>
      ) : (
        <p className="text-sm text-fg-muted">{t("hostel.noHostels")}</p>
      )}
      {/* The office's correction of a taken call (R-11): the warden's lock stays; a reason and one audit row. */}
      {sheet?.taken && sheet.canCorrect && sheet.rollCallId && sheet.entries.length > 0 ? (
        <Card data-testid="rollcall-correct">
          <CardHeader title={t("risksWeb.rollCallCorrectTitle")} description={t("risksWeb.rollCallCorrectIntro")} />
          <CardBody>
            <ActionForm action={correctRollCallAction} className="space-y-3">
              <input type="hidden" name="back" value={back} />
              <input type="hidden" name="rollCallId" value={sheet.rollCallId} />
              <ul className="divide-y divide-border rounded-[var(--radius-md)] border border-border">
                {sheet.entries.map((e) => (
                  <li key={e.allotmentId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5">
                    <input type="hidden" name="allotmentId" value={e.allotmentId} />
                    <span className="min-w-0 text-sm font-medium text-fg">{e.name}</span>
                    <fieldset className="flex gap-3">
                      <legend className="sr-only">{e.name}</legend>
                      {HOSTEL_ROLL_STATUSES.map((s) => (
                        <label key={s} className="flex min-h-11 items-center gap-1.5 text-sm text-fg">
                          <input type="radio" name={`fix-${e.allotmentId}`} value={s} defaultChecked={e.status === s} className="size-4" />
                          {t(ROLL_STATUS_KEY[s])}
                        </label>
                      ))}
                    </fieldset>
                  </li>
                ))}
              </ul>
              <TextField name="reason" label={t("risksWeb.rollCallCorrectReason")} required minLength={3} maxLength={300} />
              <Button type="submit" variant="secondary">{t("risksWeb.rollCallCorrectButton")}</Button>
            </ActionForm>
          </CardBody>
        </Card>
      ) : null}
    </WardenFrame>
  );
}
