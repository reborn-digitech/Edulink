/**
 * The arithmetic of the transport module, with no data layer, so the pages,
 * the server and the suite share it: how far apart two points are, when a
 * bus passed each stop (read from its positions), the estimated arrival at a
 * stop as a range, and whether a trip that has not started is missed.
 *
 * Every point here is a STOP's or the BUS's; nothing locates a child.
 */

export type LatLng = { lat: number; lng: number };
export type TimedPoint = LatLng & { at: Date };

const EARTH_M = 6_371_000;
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance in metres (haversine). */
export function distanceM(a: LatLng, b: LatLng): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Within a stop's geofence. A phone's reported accuracy widens the fence by
 * up to 100 m, so a driver standing at the stop with a poor fix is not told
 * they are elsewhere; more than that is not a fix worth trusting.
 */
export function withinFence(point: LatLng & { accuracy?: number | null }, stop: LatLng & { radiusM: number }): boolean {
  const slack = Math.min(Math.max(point.accuracy ?? 0, 0), 100);
  return distanceM(point, stop) <= stop.radiusM + slack;
}

/**
 * When the bus passed each stop, in the trip's order: the first position
 * inside the stop's fence at or after the time the previous stop was passed.
 * A stop the bus has not reached (or went round) is null, and a later stop
 * can still be found passed after it, so one missed fence does not blind the
 * rest of the run.
 */
export function passTimes<S extends LatLng & { id: string; radiusM: number }>(stops: S[], positions: TimedPoint[]): Map<string, Date | null> {
  const sorted = [...positions].sort((a, b) => a.at.getTime() - b.at.getTime());
  const out = new Map<string, Date | null>();
  let since = -Infinity;
  for (const stop of stops) {
    const hit = sorted.find((p) => p.at.getTime() >= since && withinFence(p, stop));
    out.set(stop.id, hit ? hit.at : null);
    if (hit) since = hit.at.getTime();
  }
  return out;
}

/** The instant a minute of a school day falls on: midnight of `dayStart` (the zone's) plus the minutes. */
export function atMinute(dayStart: Date, minute: number): Date {
  return new Date(dayStart.getTime() + minute * 60_000);
}

/** Minutes past the first stop's time after which a trip not started reads as missed (TRIP_MISSED_AFTER_MINUTES in the contract). */
export function isMissed(input: { status: string; scheduledStart: Date | null; now: Date; graceMinutes: number }): boolean {
  if (input.status !== "SCHEDULED" || !input.scheduledStart) return false;
  return input.now.getTime() > input.scheduledStart.getTime() + input.graceMinutes * 60_000;
}

/**
 * The estimated arrival at one stop, as a range: its time today moved by how
 * late (or early) the bus was at the last three stops it passed — the least
 * and the most of those — never before now, and at least four minutes wide,
 * since a bus in traffic is not a timetable. Before any stop is passed the
 * range runs from the stop's time (or now, if later) for ten minutes.
 */
export function etaRange(input: {
  target: Date;
  passed: { scheduled: Date; passedAt: Date }[];
  now: Date;
}): { earliest: Date; latest: Date } {
  const MIN_SPREAD = 4 * 60_000;
  const now = input.now.getTime();
  const recent = input.passed.slice(-3);
  if (recent.length === 0) {
    const earliest = Math.max(now, input.target.getTime());
    return { earliest: new Date(earliest), latest: new Date(earliest + 10 * 60_000) };
  }
  const delays = recent.map((p) => p.passedAt.getTime() - p.scheduled.getTime());
  const lo = Math.min(...delays);
  const hi = Math.max(...delays);
  const earliest = Math.max(now, input.target.getTime() + lo);
  const latest = Math.max(earliest + MIN_SPREAD, input.target.getTime() + hi);
  return { earliest: new Date(earliest), latest: new Date(latest) };
}

/* The map's arithmetic and the time labels live in the contracts package, so the phone draws the same map. */
export { TILE_SIZE, TILE_URL, worldPx, fitZoom, mapView, minuteLabel, parseMinute } from "@edulink/contracts";
