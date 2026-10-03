import type { Metadata } from "next";
import Link from "next/link";
import { BedIcon, DoorOpenIcon, UsersIcon, WarningCircleIcon } from "@phosphor-icons/react/ssr";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { hostelOverview, listVisitors } from "@/lib/hostel";
import { db } from "@/lib/db";
import { getLocale, getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, StatTile } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ModuleOff } from "@/components/module-off";
import { LeaveSummary, SLOT_KEY, when } from "@/components/hostel/parts";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("hostel.officeTitle"), robots: { index: false, follow: false } };
}

/**
 * The hostel for the office and the head (module HOSTEL, 3 Oct 2026): beds
 * taken in each house, who is on leave today and who is out now, who was
 * absent at the last roll call, late returns this week and today's visitor
 * book. The day's work is the warden's, on /hostel.
 */
export default async function AdminHostelPage() {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  if (!(await isModuleOn(ctx.schoolId, "HOSTEL"))) {
    return (
      <div className="space-y-5">
        <PageHeader title={t("hostel.officeTitle")} />
        <ModuleOff module="HOSTEL" t={t} />
      </div>
    );
  }
  const timeZone = (await db.school.findUnique({ where: { id: ctx.schoolId }, select: { timezone: true } }))?.timezone ?? "Asia/Kolkata";
  const [o, visitors] = await Promise.all([hostelOverview(ctx), listVisitors(ctx)]);
  return (
    <div className="space-y-5">
      <PageHeader
        title={t("hostel.officeTitle")}
        description={t("hostel.officeIntro")}
        actions={
          <Button asChild variant="secondary">
            <Link href="/hostel">{t("hostel.openWarden")}</Link>
          </Button>
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label={t("hostel.statBoarders")} value={o.hostels.reduce((a, h) => a + h.occupied, 0)} hint={t("hostel.ofBeds", { beds: o.hostels.reduce((a, h) => a + h.beds, 0) })} icon={<BedIcon weight="duotone" className="size-5" />} />
        <StatTile label={t("hostel.statOut")} value={o.outNow} icon={<DoorOpenIcon weight="duotone" className="size-5" />} />
        <StatTile label={t("hostel.statAbsent")} value={o.absentees.length} tone={o.absentees.length ? "danger" : "neutral"} icon={<WarningCircleIcon weight="duotone" className="size-5" />} />
        <StatTile label={t("hostel.statVisitors")} value={o.visitorsToday} icon={<UsersIcon weight="duotone" className="size-5" />} />
      </div>
      <Card>
        <CardHeader icon={<BedIcon weight="duotone" className="size-5" />} title={t("hostel.occupancyTitle")} />
        <CardBody>
          {o.hostels.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("hostel.noHostelsOffice")}</p>
          ) : (
            <ul className="space-y-1 text-sm text-fg">
              {o.hostels.map((h) => (
                <li key={h.id} className="flex justify-between gap-3">
                  <span>{h.name}</span>
                  <span className="tabular-nums">{t("hostel.occupancy", { occupied: h.occupied, beds: h.beds })}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<WarningCircleIcon weight="duotone" className="size-5" />} title={t("hostel.absenteesTitle")} />
        <CardBody>
          {o.absentees.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("hostel.noAbsentees")}</p>
          ) : (
            <ul className="space-y-1 text-sm text-fg">
              {o.absentees.map((a, k) => (
                <li key={`${a.name}-${k}`}>
                  {a.name} · {t("hostel.roomShort", { room: a.roomNumber })} · {a.hostelName} · {t(SLOT_KEY[a.slot])} {a.dateKey}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<DoorOpenIcon weight="duotone" className="size-5" />} title={t("hostel.leaveTodayTitle")} />
        <CardBody>
          {o.leaveToday.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("hostel.noLeaveToday")}</p>
          ) : (
            <ul className="space-y-3">
              {o.leaveToday.map((l) => (
                <li key={l.id}>
                  <LeaveSummary l={l} t={t} timeZone={timeZone} locale={locale} showName />
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
      {o.lateReturns.length > 0 ? (
        <Card>
          <CardHeader icon={<WarningCircleIcon weight="duotone" className="size-5" />} title={t("hostel.lateTitle")} />
          <CardBody>
            <ul className="space-y-3">
              {o.lateReturns.map((l) => (
                <li key={l.id}>
                  <LeaveSummary l={l} t={t} timeZone={timeZone} locale={locale} showName />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      ) : null}
      <Card>
        <CardHeader icon={<UsersIcon weight="duotone" className="size-5" />} title={t("hostel.visitorsTodayTitle")} />
        <CardBody>
          {visitors.items.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("hostel.noVisitors")}</p>
          ) : (
            <ul className="space-y-1 text-sm text-fg">
              {visitors.items.map((v) => (
                <li key={v.id}>
                  {v.name} ({v.relation}) · {v.boarderName} · {when(v.inAt, timeZone, locale)}
                  {v.outAt ? ` – ${when(v.outAt, timeZone, locale)}` : ""}
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
