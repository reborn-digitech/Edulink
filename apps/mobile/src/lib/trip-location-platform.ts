import { POSITION_INTERVAL_SECONDS } from "@edulink/contracts";
import { addFix, fixOf, sendBatch, setBattery } from "./trip-positions";

/**
 * The web target's half of lib/trip-location-platform.native.ts: the
 * browser's geolocation while the page is open, and its battery where the
 * browser tells it. A browser tab is no bus GPS — it stops when the tab
 * sleeps — so the phone app is the driver's tool; this keeps the screens the
 * same on the web target.
 */
export type Here = { lat: number; lng: number; accuracy: number | null };

let watchId: number | null = null;
let activeTrip: string | null = null;

type Geo = Pick<Geolocation, "getCurrentPosition" | "watchPosition" | "clearWatch">;
const geo = (): Geo | null => (typeof navigator !== "undefined" && navigator.geolocation ? navigator.geolocation : null);

export async function locationAllowed(): Promise<boolean> {
  return geo() !== null;
}

export function currentPlace(): Promise<Here | null> {
  const g = geo();
  if (!g) return Promise.resolve(null);
  return new Promise((resolve) => {
    g.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy ?? null }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  });
}

export async function startTracking(tripId: string, _words: { title: string; body: string }): Promise<"started" | "denied"> {
  const g = geo();
  if (!g) return "denied";
  activeTrip = tripId;
  const nav = navigator as Navigator & { getBattery?: () => Promise<{ level: number }> };
  void nav.getBattery?.().then((b) => setBattery(b.level)).catch(() => undefined);
  if (watchId !== null) g.clearWatch(watchId);
  watchId = g.watchPosition(
    (p) => {
      if (activeTrip) void addFix(activeTrip, fixOf({ coords: p.coords, timestamp: p.timestamp }));
    },
    () => undefined,
    { enableHighAccuracy: true, maximumAge: POSITION_INTERVAL_SECONDS * 1000 },
  );
  return "started";
}

export async function stopTracking(): Promise<void> {
  activeTrip = null;
  const g = geo();
  if (g && watchId !== null) g.clearWatch(watchId);
  watchId = null;
  await sendBatch();
}
