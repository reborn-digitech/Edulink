import type { Metadata } from "next";
import Link from "next/link";
import { BedIcon, HouseLineIcon, PlusIcon } from "@phosphor-icons/react/ssr";
import { HOSTEL_KINDS, HOSTEL_ROOM_KINDS } from "@edulink/contracts";
import { getT } from "@/lib/i18n/server";
import { hostelsView, pupilsWithoutBed } from "@/lib/hostel";
import { todayKey } from "@/lib/dates";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HOSTEL_KIND_KEY, ROOM_KIND_KEY, WardenFrame, wardenContext } from "@/components/hostel/parts";
import { allotAction, endAllotmentAction, moveBoarderAction, saveHostelAction, saveRoomAction } from "../actions";
import { fieldClass } from "@/components/ui/field-class";
import { ActionForm } from "@/components/ui/action-form";
import { SelectField, TextField } from "@/components/ui/field";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("hostel.tabRooms"), robots: { index: false, follow: false } };
}

/**
 * Houses, rooms and beds: who sleeps where, a free bed for a pupil, a bed
 * given up, a boarder moved to another bed (owner-batch-item9). The office
 * makes the houses and puts a warden in charge; the office and the warden make
 * rooms, allot and move.
 */
export default async function HostelRoomsPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const { ctx, t, on, canWrite, timeZone } = await wardenContext();
  const { ok, error } = await searchParams;
  if (!on) return <WardenFrame t={t} on={false} current="rooms" title={t("hostel.tabRooms")}>{null}</WardenFrame>;
  const [view, pupils] = await Promise.all([hostelsView(ctx), canWrite ? pupilsWithoutBed(ctx) : Promise.resolve([])]);
  const today = todayKey(timeZone);
  const back = "/hostel/rooms";
  const freeBeds = view.hostels.flatMap((h) => h.rooms.flatMap((r) => Array.from({ length: r.beds }, (_, k) => k + 1).filter((bed) => !r.boarders.some((b) => b.bed === bed)).map((bed) => ({ value: `${r.id}:${bed}`, label: t("hostel.bedOption", { hostel: h.name, room: r.number, bed }) }))));
  return (
    <WardenFrame t={t} on current="rooms" title={t("hostel.tabRooms")} description={t("hostel.roomsIntro")} ok={ok} error={error}>
      {canWrite && pupils.length > 0 && freeBeds.length > 0 ? (
        <Card>
          <CardHeader icon={<BedIcon weight="duotone" className="size-5" />} title={t("hostel.allotTitle")} description={t("hostel.allotHint")} />
          <CardBody>
            <ActionForm action={allotAction} className="grid gap-3 sm:grid-cols-3">
              <input type="hidden" name="back" value={back} />
              <label className="text-sm font-medium text-fg">
                {t("hostel.pupil")}
                <select name="membershipId" required className={fieldClass("mt-1.5 block")}>
                  {pupils.map((p) => (
                    <option key={p.membershipId} value={p.membershipId}>
                      {p.name}
                      {p.className ? ` (${p.className})` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-fg">
                {t("hostel.bed")}
                <select name="bed" required className={fieldClass("mt-1.5 block")}>
                  {freeBeds.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-fg">
                {t("hostel.fromDate")}
                <input type="date" name="fromDate" required defaultValue={today} className={fieldClass("mt-1.5 block")} />
              </label>
              <div className="sm:col-span-3">
                <Button type="submit">{t("hostel.allotButton")}</Button>
              </div>
            </ActionForm>
          </CardBody>
        </Card>
      ) : null}

      {view.hostels.map((h) => (
        <Card key={h.id}>
          <CardHeader icon={<HouseLineIcon weight="duotone" className="size-5" />} title={h.name} description={[t(HOSTEL_KIND_KEY[h.kind]), t("hostel.occupancy", { occupied: h.occupied, beds: h.beds }), h.wardenName ? t("hostel.wardenIs", { name: h.wardenName }) : null].filter(Boolean).join(" · ")} />
          <CardBody className="space-y-4">
            {view.canManage ? (
              // owner-batch-item5 (27 Oct 2026): the house's mess charge a month, which the office's mess bill raises; the house's other settings go back as they are.
              <ActionForm action={saveHostelAction} className="flex flex-wrap items-end gap-3" data-testid="hostel-mess-charge">
                <input type="hidden" name="back" value={back} />
                <input type="hidden" name="id" value={h.id} />
                <input type="hidden" name="name" value={h.name} />
                <input type="hidden" name="kind" value={h.kind} />
                <input type="hidden" name="capacity" value={h.capacity} />
                <input type="hidden" name="wardenMembershipId" value={h.wardenMembershipId ?? ""} />
                {h.messAttendance ? <input type="hidden" name="messAttendance" value="on" /> : null}
                <TextField name="mess" inputMode="decimal" required label={t("collegeOffice.messMonthly")} hint={t("schoolCampus.messChargeHint")} defaultValue={(h.messMonthlyPaise / 100).toFixed(2)} />
                <Button type="submit" size="sm" variant="secondary">
                  {t("collegeOffice.save")}
                </Button>
              </ActionForm>
            ) : null}
            {h.rooms.map((r) => (
              <div key={r.id} className="rounded-[var(--radius-md)] border border-border p-3">
                <p className="text-sm font-semibold text-fg">
                  {t("hostel.roomShort", { room: r.number })} <span className="font-normal text-fg-muted">· {t(ROOM_KIND_KEY[r.kind])} · {t("hostel.occupancy", { occupied: r.occupied, beds: r.beds })}</span>
                </p>
                {r.boarders.length > 0 ? (
                  <ul className="mt-2 space-y-1.5">
                    {r.boarders.map((b) => (
                      <li key={b.allotmentId} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span className="text-fg">
                          {t("hostel.bedN", { bed: b.bed })}: {b.name}
                          {b.className ? <span className="text-fg-muted"> ({b.className})</span> : null}
                          {b.onLeave ? <span className="text-warn"> · {t("hostel.rollON_LEAVE")}</span> : null}
                        </span>
                        <span className="flex flex-wrap items-center gap-2">
                          {ctx.role === "WARDEN" ? (
                            <Link href={`/hostel/health/${b.allotmentId}`} className="text-xs font-medium text-accent-strong hover:underline">
                              {t("hostel.healthCard")}
                            </Link>
                          ) : null}
                          {canWrite ? (
                            <ActionForm action={endAllotmentAction} className="flex items-center gap-1.5">
                              <input type="hidden" name="allotmentId" value={b.allotmentId} />
                              <input type="hidden" name="back" value={back} />
                              <label className="sr-only" htmlFor={`to-${b.allotmentId}`}>
                                {t("hostel.toDate")}
                              </label>
                              <input id={`to-${b.allotmentId}`} type="date" name="toDate" required defaultValue={today} className={fieldClass("w-auto")} />
                              <Button type="submit" size="sm" variant="ghost">
                                {t("hostel.endBed")}
                              </Button>
                            </ActionForm>
                          ) : null}
                        </span>
                        {/* owner-batch-item9 (27 Oct 2026): another bed, the old place ending today and the new one starting today. */}
                        {canWrite && freeBeds.length > 0 ? (
                          <details className="basis-full" data-testid="move-boarder">
                            <summary className="inline-flex min-h-11 cursor-pointer items-center text-xs font-medium text-accent-strong hover:underline">
                              {t("schoolForms.moveSummary")}
                              <span className="sr-only">: {b.name}</span>
                            </summary>
                            <ActionForm action={moveBoarderAction} className="mt-1 flex flex-wrap items-end gap-2">
                              <input type="hidden" name="back" value={back} />
                              <input type="hidden" name="allotmentId" value={b.allotmentId} />
                              <SelectField name="bed" required label={t("schoolForms.moveBed")} hint={t("schoolForms.moveHint")} className="min-w-0 flex-1 basis-56">
                                {freeBeds.map((f) => (
                                  <option key={f.value} value={f.value}>
                                    {f.label}
                                  </option>
                                ))}
                              </SelectField>
                              <Button type="submit" size="sm" variant="secondary">
                                {t("schoolForms.moveButton")}
                                <span className="sr-only">: {b.name}</span>
                              </Button>
                            </ActionForm>
                          </details>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
            {canWrite ? (
              <ActionForm action={saveRoomAction} className="grid gap-2 border-t border-border pt-4 sm:grid-cols-5">
                <input type="hidden" name="back" value={back} />
                <input type="hidden" name="hostelId" value={h.id} />
                <label className="text-xs text-fg-muted">
                  {t("hostel.roomNumber")}
                  <input name="number" required maxLength={20} className={fieldClass("mt-1 block")} />
                </label>
                <label className="text-xs text-fg-muted">
                  {t("hostel.floor")}
                  <input name="floor" maxLength={20} className={fieldClass("mt-1 block")} />
                </label>
                <label className="text-xs text-fg-muted">
                  {t("hostel.beds")}
                  <input name="beds" type="number" min={1} max={100} required defaultValue={2} className={fieldClass("mt-1 block")} />
                </label>
                <label className="text-xs text-fg-muted">
                  {t("hostel.roomKind")}
                  <select name="kind" defaultValue="SHARED" className={fieldClass("mt-1 block")}>
                    {HOSTEL_ROOM_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {t(ROOM_KIND_KEY[k])}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-end">
                  <Button type="submit" size="sm" variant="secondary">
                    <PlusIcon weight="bold" className="size-4" aria-hidden />
                    {t("hostel.addRoom")}
                  </Button>
                </div>
              </ActionForm>
            ) : null}
          </CardBody>
        </Card>
      ))}

      {view.canManage ? (
        <Card>
          <CardHeader icon={<HouseLineIcon weight="duotone" className="size-5" />} title={t("hostel.newHostel")} description={t("hostel.newHostelHint")} />
          <CardBody>
            <ActionForm action={saveHostelAction} className="grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="back" value={back} />
              <label className="text-sm font-medium text-fg">
                {t("hostel.hostelName")}
                <input name="name" required maxLength={80} className={fieldClass("mt-1.5 block")} />
              </label>
              <label className="text-sm font-medium text-fg">
                {t("hostel.hostelKind")}
                <select name="kind" required className={fieldClass("mt-1.5 block")}>
                  {HOSTEL_KINDS.map((k) => (
                    <option key={k} value={k}>
                      {t(HOSTEL_KIND_KEY[k])}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-fg">
                {t("hostel.capacity")}
                <input name="capacity" type="number" min={0} max={5000} required defaultValue={0} className={fieldClass("mt-1.5 block")} />
              </label>
              <label className="text-sm font-medium text-fg">
                {t("hostel.wardenInCharge")}
                <select name="wardenMembershipId" className={fieldClass("mt-1.5 block")}>
                  <option value="">{t("hostel.noWarden")}</option>
                  {view.wardens.map((w) => (
                    <option key={w.membershipId} value={w.membershipId}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-fg">
                {t("collegeOffice.messMonthly")}
                <input name="mess" inputMode="decimal" required defaultValue="0" className={fieldClass("mt-1.5 block")} />
              </label>
              <label className="flex min-h-11 items-center gap-2 text-sm text-fg sm:col-span-2">
                <input type="checkbox" name="messAttendance" className="size-4" />
                {t("hostel.messAttendanceOn")}
              </label>
              <div className="sm:col-span-2">
                <Button type="submit">{t("hostel.saveHostel")}</Button>
              </div>
            </ActionForm>
          </CardBody>
        </Card>
      ) : null}
    </WardenFrame>
  );
}
