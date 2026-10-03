import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as Battery from "expo-battery";
import { POSITION_INTERVAL_SECONDS } from "@edulink/contracts";
import { addFix, fixOf, sendBatch, setBattery } from "./trip-positions";

/**
 * The phone as the bus's GPS during a trip (transport, 3 Oct 2026) — and
 * ONLY during a trip: tracking starts when the driver presses Start trip
 * and stops at End trip (or when the screen finds no trip of theirs live).
 *
 * Android: location updates under a foreground service, whose notification
 * ("Trip running — sending the bus's location…") is on screen for as long as
 * it runs, so a phone in a pocket with the screen off keeps sending. iOS:
 * "while using the app" permission only — never "always" — with the blue
 * location indicator showing while the trip runs in the background
 * (UIBackgroundModes location, app.json's expo-location plugin). If the
 * background task cannot start, a foreground watch takes its place: the
 * positions then stop while the app is not on screen, and the office sees
 * the feed go stale.
 *
 * The task is defined at the top of this module, as TaskManager asks: the
 * driver's home imports it, and the home route is the first the app loads.
 *
 * Untested on a real device (no simulator here): the suite mocks this module.
 */
export const TRIP_TASK = "shalaghar-trip-location";

let activeTrip: string | null = null;
let watch: Location.LocationSubscription | null = null;
let batteryWatch: { remove: () => void } | null = null;

TaskManager.defineTask<{ locations?: Location.LocationObject[] }>(TRIP_TASK, async ({ data, error }) => {
  if (error || !activeTrip || !data?.locations) return;
  for (const location of data.locations) await addFix(activeTrip, fixOf(location));
});

export type Here = { lat: number; lng: number; accuracy: number | null };

/** "While using the app", asked for once; false when the driver said no. */
export async function locationAllowed(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

/** Where the phone is now, for the start's geofence; null without permission or a fix. */
export async function currentPlace(): Promise<Here | null> {
  if (!(await locationAllowed())) return null;
  try {
    const l = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    return { lat: l.coords.latitude, lng: l.coords.longitude, accuracy: l.coords.accuracy ?? null };
  } catch {
    return null;
  }
}

async function watchBattery(): Promise<void> {
  try {
    const [level, power] = await Promise.all([Battery.getBatteryLevelAsync(), Battery.getPowerStateAsync()]);
    setBattery(level, power.lowPowerMode);
    batteryWatch?.remove();
    batteryWatch = Battery.addBatteryLevelListener(({ batteryLevel }) => setBattery(batteryLevel));
  } catch {
    // No battery reading on this device: the trip simply carries none.
  }
}

/** Start sending the bus's position for this trip. The words are the Android notification's. */
export async function startTracking(tripId: string, words: { title: string; body: string }): Promise<"started" | "denied"> {
  if (!(await locationAllowed())) return "denied";
  activeTrip = tripId;
  await watchBattery();
  const every = POSITION_INTERVAL_SECONDS * 1000;
  try {
    if (await Location.hasStartedLocationUpdatesAsync(TRIP_TASK)) return "started";
    await Location.startLocationUpdatesAsync(TRIP_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: every,
      distanceInterval: 0,
      pausesUpdatesAutomatically: false,
      activityType: Location.ActivityType.AutomotiveNavigation,
      showsBackgroundLocationIndicator: true,
      foregroundService: { notificationTitle: words.title, notificationBody: words.body, killServiceOnDestroy: true },
    });
  } catch {
    watch?.remove();
    watch = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, timeInterval: every, distanceInterval: 0 }, (l) => {
      if (activeTrip) void addFix(activeTrip, fixOf(l));
    });
  }
  return "started";
}

/** Stop at once: the service and its notification go, and what was gathered is sent. */
export async function stopTracking(): Promise<void> {
  activeTrip = null;
  watch?.remove();
  watch = null;
  batteryWatch?.remove();
  batteryWatch = null;
  try {
    if (await Location.hasStartedLocationUpdatesAsync(TRIP_TASK)) await Location.stopLocationUpdatesAsync(TRIP_TASK);
  } catch {
    // Not started: nothing to stop.
  }
  await sendBatch();
}
