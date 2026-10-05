import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, MapPinIcon, UsersIcon } from "@phosphor-icons/react/ssr";
import { requireRole, AccessError } from "@/lib/tenancy";
import { isModuleOn } from "@/lib/modules";
import { tripDetail } from "@/lib/transport";
import { minuteLabel } from "@/lib/transport-geo";
import { db } from "@/lib/db";
import { formatInZone } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModuleOff } from "@/components/module-off";
import { BusMap } from "@/components/transport/bus-map";
import { directionLabel, statusLabel, statusTone } from "@/components/transport/labels";
import { TransportLive } from "../../forms";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("transport.metaTitle"), robots: { index: false, follow: false } };
}

/** One trip for the office and the head: the stops in the trip's order with when the bus passed each, the bus's track on the map, and the roster with its ticks. */
export default async function TripPage({ params }: { params: Promise<{ tripId: string }> }) {
  const ctx = await requireRole("ADMIN", "PRINCIPAL");
  const t = await getT();
  const locale = await getLocale();
  if (!(await isModuleOn(ctx.schoolId, "TRANSPORT"))) return <ModuleOff page module="TRANSPORT" t={t} />;
  const { tripId } = await params;
  const trip = await tripDetail(ctx, tripId).catch((error: unknown) => {
    if (error instanceof AccessError && error.code === "NOT_FOUND") return null;
    throw error;
  });
  if (!trip) notFound();
  const school = await db.school.findUniqueOrThrow({ where: { id: ctx.schoolId }, select: { timezone: true } });
  const time = (iso: string | null) => (iso ? formatInZone(new Date(iso), school.timezone, { hour: "2-digit", minute: "2-digit" }, locale) : "");
  const bus = trip.lastPosition && trip.status === "LIVE" ? [{ id: trip.id, lat: trip.lastPosition.lat, lng: trip.lastPosition.lng, label: trip.busRegistration }] : [];
  return (
    <div className="space-y-5">
      <TransportLive />
      <Link href="/admin/transport?tab=today" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("transport.backToToday")}
      </Link>
      <PageHeader
        title={t("transport.tripTitle", { bus: trip.busRegistration, direction: directionLabel(t, trip.direction) })}
        description={[trip.dateKey, trip.routeName, trip.driverName].join(" · ")}
        actions={<Badge tone={statusTone(trip.status)}>{statusLabel(t, trip.status)}</Badge>}
      />
      <p className="text-sm text-fg-muted">
        {trip.scheduledMinute !== null && t("transport.scheduledAt", { time: minuteLabel(trip.scheduledMinute) })}
        {trip.startedAt && <> · {t("transport.startedAtTime", { time: time(trip.startedAt) })}</>}
        {trip.endedAt && <> · {t("transport.endedAtTime", { time: time(trip.endedAt) })}</>}
        {" · "}
        {t("transport.positionsCount", { count: trip.track.length })}
      </p>
      {trip.startReason && <p className="text-sm text-fg-muted">{t("transport.startedAway", { reason: trip.startReason })}</p>}
      {trip.lowBattery && <p className="text-sm font-medium text-warn">{t("transport.lowBattery")}</p>}
      <Card>
        <CardHeader icon={<MapPinIcon weight="duotone" className="size-5" />} title={t("transport.stopsTitle")} />
        <CardBody className="space-y-4">
          <BusMap
            testId="transport-trip-map"
            stops={trip.stops.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, label: s.name, passed: Boolean(s.passedAt) }))}
            track={trip.track.map((p) => ({ lat: p.lat, lng: p.lng }))}
            buses={bus}
          />
          <ol className="space-y-1 text-sm">
            {trip.stops.map((s, i) => (
              <li key={s.id} className="flex flex-wrap justify-between gap-2">
                <span className="font-medium text-fg">
                  {i + 1}. {s.name} <span className="font-normal text-fg-muted tabular-nums">{minuteLabel(s.scheduledMinute)}</span>
                </span>
                <span className="text-fg-muted">{s.passedAt ? t("transport.passedAt", { time: time(s.passedAt) }) : t("transport.notPassed")}</span>
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>
      <Card>
        <CardHeader icon={<UsersIcon weight="duotone" className="size-5" />} title={t("transport.rosterTitle")} description={t("transport.boardedCount", { boarded: trip.boarded, riders: trip.riders })} />
        <CardBody>
          {trip.roster.length === 0 ? (
            <p className="text-sm text-fg-muted">{t("transport.noRiders")}</p>
          ) : (
            <ul className="divide-y divide-border" data-testid="transport-roster">
              {trip.roster.map((r) => (
                <li key={r.allotmentId} className="flex flex-wrap justify-between gap-2 py-2 text-sm">
                  <span className="text-fg">
                    {r.name}
                    {r.className && <span className="text-fg-muted"> · {r.className}</span>}
                    <span className="text-fg-muted"> · {r.stopName}</span>
                  </span>
                  <span className="text-fg-muted">
                    {r.boardedAt ? t("transport.onBoard", { time: time(r.boardedAt) }) : t("transport.notTicked")}
                    {r.alightedAt && <> · {t("transport.offBus", { time: time(r.alightedAt) })}</>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
