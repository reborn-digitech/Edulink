/**
 * The driver's trip tracking stops when the person goes (PH-3, campaign
 * 2026-10-04): the native module registers its stop with the session's end,
 * so Sign out or a 401 ends the background location task and its Android
 * notification even after the driver's screen has gone. The device modules
 * are stand-ins; the real task is untested off a device.
 */
import * as Location from "expo-location";
import { startTracking, TRIP_TASK } from "@/lib/trip-location-platform.native";
import { runSessionEnd } from "@/lib/session-end";
const mockStarted = new Set<string>();
jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  hasStartedLocationUpdatesAsync: jest.fn(async (task: string) => mockStarted.has(task)),
  startLocationUpdatesAsync: jest.fn(async (task: string) => void mockStarted.add(task)),
  stopLocationUpdatesAsync: jest.fn(async (task: string) => void mockStarted.delete(task)),
  watchPositionAsync: jest.fn(),
  Accuracy: { High: 4 },
  ActivityType: { AutomotiveNavigation: 2 },
}));
jest.mock("expo-task-manager", () => ({ defineTask: jest.fn() }));
jest.mock("expo-battery", () => ({
  getBatteryLevelAsync: jest.fn(async () => 0.8),
  getPowerStateAsync: jest.fn(async () => ({ lowPowerMode: false })),
  addBatteryLevelListener: jest.fn(() => ({ remove: () => {} })),
}));


it("a running trip's location task stops when the session ends", async () => {
  expect(await startTracking("trip-1", { title: "Trip running", body: "Sending the bus's location" })).toBe("started");
  expect(mockStarted.has(TRIP_TASK)).toBe(true);
  await runSessionEnd();
  expect(Location.stopLocationUpdatesAsync).toHaveBeenCalledWith(TRIP_TASK);
  expect(mockStarted.has(TRIP_TASK)).toBe(false);
});
