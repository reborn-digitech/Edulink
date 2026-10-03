import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon, BusIcon, ClockIcon, MapPinIcon } from "@phosphor-icons/react/ssr";
import { requireParent } from "@/lib/tenancy";
import { listContexts } from "@/lib/session";
import { familyTransport } from "@/lib/transport";
import { minuteLabel } from "@/lib/transport-geo";
import { db } from "@/lib/db";
import { formatInZone } from "@/lib/dates";
import { getLocale, getT } from "@/lib/i18n/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { BusMap } from "@/components/transport/bus-map";
import { directionLabel, statusLabel, statusTone } from "@/components/transport/labels";
import { ChildSwitcher } from "../child-switcher";
import { FamilyTransportLive, NearAlertsSwitch } from "./live";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("transport.parentTitle"), robots: { index: false, follow: false } };
}

/**
 * A child's bus for the family (3 Oct 2026): the route, the stop and its
 * times, the bus's number; while a trip runs, the bus on the map, how long
 * ago it was last heard from when the feed is stale, the stops it has passed
 * and when it is expected at theirs, as a range; and the guardian's own
 * "tell me when the bus is near" for this child. The BUS — never the child:
 * the page has no location of the child's to show. The guardianship decides
 * which child (familyTransport refuses one not theirs).
 */
export default async function ParentTransportPage({ searchParams }: { searchParams: Promise<{ child?: string }> }) {
  const session = await requireParent();
  const t = await getT();
  const locale = await getLocale();
  const { child: requested } = await searchParams;
  const { children } = await listContexts(session.user.id);
  const selectedId = requested && children.some((c) => c.studentMembershipId === requested) ? requested : children[0]!.studentMembershipId;
  const view = await familyTransport(session, selectedId);
  const school = await db.membership.findUniqueOrThrow({ where: { id: selectedId }, select: { school: { select: { timezone: true } } } });
  const time = (iso: string | null) => (iso ? formatInZone(new Date(iso), school.school.timezone, { hour: "2-digit", minute: "2-digit" }, locale) : "");
  const trip = view.trip;
  const mine = trip?.stops.find((s) => s.mine);
  const bus = trip?.lastPosition ? [{ id: trip.id, lat: trip.lastPosition.lat, lng: trip.lastPosition.lng, label: view.seat?.busRegistration ?? "", stale: trip.staleMinutes !== null }] : [];

  return (
    <div className="space-y-5">
      <FamilyTransportLive />
      <Link href="/parent" className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg">
        <ArrowLeftIcon weight="bold" className="size-4" />
        {t("parent.overview")}
      </Link>
      {children.length > 1 && <ChildSwitcher pupils={children} selectedId={selectedId} basePath="/parent/transport" />}
      <PageHeader title={t("transport.forChild", { name: view.childName })} description={view.schoolName} />

      {!view.moduleOn ? (
        <ModuleOff module="TRANSPORT" t={t} />
      ) : !view.seat ? (
        <EmptyState icon={<BusIcon weight="duotone" className="size-8" />} title={t("transport.noSeat", { name: view.childName })} description={t("transport.noSeatBody")} />
      ) : (
        <>
          <Card data-testid="family-transport-seat">
            <CardHeader
              icon={<BusIcon weight="duotone" className="size-5" />}
              title={view.seat.busRegistration ? t("transport.busNumber", { bus: view.seat.busRegistration }) : view.seat.routeName}
              description={[view.seat.routeName, view.seat.stopName].join(" · ")}
            />
            <CardBody className="space-y-2 text-sm">
              {view.seat.boards && view.seat.morningMinute !== null && <p className="text-fg">{t("transport.pickupAt", { time: minuteLabel(view.seat.morningMinute) })}</p>}
              {view.seat.alights && view.seat.eveningMinute !== null && <p className="text-fg">{t("transport.dropAt", { time: minuteLabel(view.seat.eveningMinute) })}</p>}
              {view.seat.driverName && (
                <p className="text-fg-muted">
                  {t("transport.driverLine", { name: view.seat.driverName })}
                  {view.seat.driverPhone && (
                    <>
                      {" · "}
                      <a className="font-medium text-accent-strong underline" href={`tel:${view.seat.driverPhone}`}>
                        {view.seat.driverPhone}
                      </a>
                    </>
                  )}
                </p>
              )}
              {session.role === "PARENT" && <NearAlertsSwitch childId={view.studentMembershipId} childName={view.childName} on={view.nearAlerts} />}
            </CardBody>
          </Card>

          {!trip ? (
            <EmptyState icon={<ClockIcon weight="duotone" className="size-8" />} title={t("transport.noTripToday")} description={t("transport.noTripTodayBody", { name: view.childName })} />
          ) : (
            <Card data-testid="family-transport-trip">
              <CardHeader
                icon={<MapPinIcon weight="duotone" className="size-5" />}
                title={trip.status === "LIVE" ? t("transport.liveNow") : trip.status === "ENDED" ? t("transport.tripEnded") : t("transport.notStarted")}
                description={directionLabel(t, trip.direction)}
                action={<Badge tone={statusTone(trip.status)}>{statusLabel(t, trip.status)}</Badge>}
              />
              <CardBody className="space-y-3">
                {trip.staleMinutes !== null && <p className="text-sm font-medium text-warn">{t("transport.lastSeenAgo", { minutes: trip.staleMinutes })}</p>}
                {trip.eta && mine && <p className="text-base font-semibold text-fg">{t("transport.etaRange", { stop: mine.name, from: time(trip.eta.earliest), to: time(trip.eta.latest) })}</p>}
                {mine?.passedAt && <p className="text-sm text-fg">{t("transport.passedStop", { stop: mine.name, time: time(mine.passedAt) })}</p>}
                {trip.boardedAt && <p className="text-sm text-fg-muted">{t("transport.boardedAt", { time: time(trip.boardedAt) })}</p>}
                {trip.alightedAt && <p className="text-sm text-fg-muted">{t("transport.alightedAt", { time: time(trip.alightedAt) })}</p>}
                <BusMap testId="family-transport-map" stops={trip.stops.map((s) => ({ id: s.id, lat: s.lat, lng: s.lng, label: s.mine ? [s.name, t("transport.yourStop")].join(" · ") : s.name, mine: s.mine, passed: Boolean(s.passedAt) }))} buses={bus} />
                <ol className="space-y-1 text-sm">
                  {trip.stops.map((s, i) => (
                    <li key={s.id} className="flex flex-wrap justify-between gap-2">
                      <span className={s.mine ? "font-semibold text-fg" : "text-fg"}>
                        {i + 1}. {s.name} <span className="font-normal text-fg-muted tabular-nums">{minuteLabel(s.scheduledMinute)}</span>
                        {s.mine && <Badge tone="accent" className="ml-2">{t("transport.yourStop")}</Badge>}
                      </span>
                      <span className="text-fg-muted">{s.passedAt ? t("transport.passedAt", { time: time(s.passedAt) }) : t("transport.notPassed")}</span>
                    </li>
                  ))}
                </ol>
              </CardBody>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
