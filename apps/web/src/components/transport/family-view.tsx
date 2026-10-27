import type { ReactNode } from "react";
import { BusIcon, ClockIcon, MapPinIcon } from "@phosphor-icons/react/ssr";
import type { FamilyTransport } from "@edulink/contracts";
import type { Translate } from "@/lib/i18n/dictionary";
import { minuteLabel } from "@/lib/transport-geo";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/states";
import { ModuleOff } from "@/components/module-off";
import { BusMap } from "@/components/transport/bus-map";
import { directionLabel, statusLabel, statusTone } from "@/components/transport/labels";

/**
 * A rider's bus as a family reads it (owner-batch-item5, 27 Oct 2026; the cards were the guardian's page's alone from
 * 3 Oct): the seat — the bus's number, the route and stop, the pick-up and drop times, the driver when the school
 * shows them — and today's trip with the bus on the map, how stale the feed is, the arrival range at the stop and the
 * stops passed. The BUS, never the rider: there is no location of the child's to show. The guardian's page
 * (/parent/transport) and the pupil's own (/student/transport) draw the same cards from familyTransport; each says the
 * empty states in its own words, and the guardian's near-stop switch goes in `seatExtra`, which the pupil's leaves out.
 */
export function FamilyTransportCards({
  view,
  t,
  time,
  noSeatTitle,
  noTripBody,
  seatExtra,
}: {
  view: FamilyTransport;
  t: Translate;
  /** An ISO instant as the school's clock reads it. */
  time: (iso: string | null) => string;
  noSeatTitle: string;
  noTripBody: string;
  seatExtra?: ReactNode;
}) {
  // The page above draws its own heading (the child's bus, my bus), so the module's notice is not the page's h1 here.
  if (!view.moduleOn || !view.seat) {
    return !view.moduleOn ? <ModuleOff module="TRANSPORT" t={t} /> : <EmptyState icon={<BusIcon weight="duotone" className="size-8" />} title={noSeatTitle} description={t("transport.noSeatBody")} />;
  }
  const seat = view.seat;
  const trip = view.trip;
  const mine = trip?.stops.find((s) => s.mine);
  const bus = trip?.lastPosition ? [{ id: trip.id, lat: trip.lastPosition.lat, lng: trip.lastPosition.lng, label: seat.busRegistration ?? "", stale: trip.staleMinutes !== null }] : [];
  return (
    <>
      <Card data-testid="family-transport-seat">
        <CardHeader icon={<BusIcon weight="duotone" className="size-5" />} title={seat.busRegistration ? t("transport.busNumber", { bus: seat.busRegistration }) : seat.routeName} description={[seat.routeName, seat.stopName].join(" · ")} />
        <CardBody className="space-y-2 text-sm">
          {seat.boards && seat.morningMinute !== null && <p className="text-fg">{t("transport.pickupAt", { time: minuteLabel(seat.morningMinute) })}</p>}
          {seat.alights && seat.eveningMinute !== null && <p className="text-fg">{t("transport.dropAt", { time: minuteLabel(seat.eveningMinute) })}</p>}
          {seat.driverName && (
            <p className="text-fg-muted">
              {t("transport.driverLine", { name: seat.driverName })}
              {seat.driverPhone && (
                <>
                  {" · "}
                  <a className="font-medium text-accent-strong underline" href={`tel:${seat.driverPhone}`}>
                    {seat.driverPhone}
                  </a>
                </>
              )}
            </p>
          )}
          {seatExtra}
        </CardBody>
      </Card>

      {!trip ? (
        <EmptyState icon={<ClockIcon weight="duotone" className="size-8" />} title={t("transport.noTripToday")} description={noTripBody} />
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
  );
}
