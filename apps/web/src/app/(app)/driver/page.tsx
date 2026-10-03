import type { Metadata } from "next";
import { BusIcon, DeviceMobileIcon, MapPinIcon, ShieldCheckIcon } from "@phosphor-icons/react/ssr";
import { getT, getLocale } from "@/lib/i18n/server";
import { requireRole } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { driverToday } from "@/lib/transport";
import { minuteLabel } from "@/lib/transport-geo";
import { db } from "@/lib/db";
import { formatInZone } from "@/lib/dates";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { BusMap } from "@/components/transport/bus-map";
import { directionLabel, statusLabel, statusTone } from "@/components/transport/labels";
import { ConsentButton } from "./consent-button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("modules.transportName") };
}

/**
 * The DRIVER home (3 Oct 2026). Off, it says the school has not switched
 * transport on. On, it is the driver's day on a desk: the location sentence
 * to say yes to once, and today's trips with their stops, the map and the
 * roster. Starting, ticking and ending a trip — and sending the bus's
 * position — is the phone's: a desk has no GPS worth the name.
 */
export default async function Page() {
  const ctx = await requireRole("DRIVER");
  const t = await getT();
  const locale = await getLocale();
  if (!(await isModuleOn(ctx.schoolId, "TRANSPORT"))) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("modules.transportName")} />
        <ModuleOff module="TRANSPORT" t={t} />
      </div>
    );
  }
  const [day, school] = await Promise.all([driverToday(ctx), db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } })]);
  const time = (iso: string | null) => (iso ? formatInZone(new Date(iso), school.timezone, { hour: "2-digit", minute: "2-digit" }, locale) : "");
  return (
    <div className="space-y-5">
      <PageHeader title={t("transport.driverTitle")} description={day.dateKey} />
      {day.consent.needed && (
        <Card data-testid="transport-consent-card">
          <CardHeader icon={<ShieldCheckIcon weight="duotone" className="size-5" />} title={t("transport.consentTitle")} />
          <CardBody className="space-y-3">
            <p className="max-w-prose text-sm leading-relaxed text-fg">{t("transport.consentBody")}</p>
            <ConsentButton />
          </CardBody>
        </Card>
      )}
      <p className="flex items-start gap-2 rounded-[--radius-md] bg-surface-muted p-3 text-sm text-fg-muted">
        <DeviceMobileIcon weight="duotone" className="mt-0.5 size-5 shrink-0" />
        {t("transport.webDriverNote")}
      </p>
      {day.trips.length === 0 ? (
        <EmptyState icon={<BusIcon weight="duotone" className="size-8" />} title={t("transport.noDriverTrips")} description={t("transport.noDriverTripsBody")} />
      ) : (
        day.trips.map((trip) => (
          <Card key={trip.id} data-testid="driver-trip">
            <CardHeader
              icon={<MapPinIcon weight="duotone" className="size-5" />}
              title={t("transport.tripTitle", { bus: trip.busRegistration, direction: directionLabel(t, trip.direction) })}
              description={[trip.routeName, trip.scheduledMinute !== null ? t("transport.scheduledAt", { time: minuteLabel(trip.scheduledMinute) }) : null].filter(Boolean).join(" · ")}
              action={<Badge tone={statusTone(trip.status)}>{statusLabel(t, trip.status)}</Badge>}
            />
            <CardBody className="space-y-4">
              <BusMap stops={trip.stops.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, label: s.name, passed: Boolean(s.passedAt) }))} track={trip.track.map((p) => ({ lat: p.lat, lng: p.lng }))} />
              <ol className="space-y-3">
                {trip.stops.map((s, i) => {
                  const here = trip.roster.filter((r) => r.stopId === s.id);
                  return (
                    <li key={s.id} className="text-sm">
                      <p className="font-medium text-fg">
                        {i + 1}. {s.name} <span className="font-normal text-fg-muted tabular-nums">{minuteLabel(s.scheduledMinute)}</span>
                      </p>
                      {here.length > 0 && (
                        <ul className="mt-1 space-y-0.5 pl-4 text-fg-muted">
                          {here.map((r) => (
                            <li key={r.allotmentId}>
                              {r.name}
                              {r.className && <> · {r.className}</>}
                              {r.boardedAt && <> · {t("transport.onBoard", { time: time(r.boardedAt) })}</>}
                              {r.alightedAt && <> · {t("transport.offBus", { time: time(r.alightedAt) })}</>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ol>
            </CardBody>
          </Card>
        ))
      )}
    </div>
  );
}
