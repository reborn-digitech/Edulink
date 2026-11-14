import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { api } from "./api";

/**
 * Push registration: ask the OS, get the Expo push token for this device,
 * register it with POST /api/v1/me/devices. Called after sign-in and on
 * every start while signed in (a token can rotate). Never on the web target,
 * where there is no device. Everything here is best-effort: a person who
 * refuses the permission simply gets no push, and the app says nothing.
 */
export async function registerForPush(): Promise<{ registered: boolean; reason?: string }> {
  if (Platform.OS === "web") return { registered: false, reason: "web" };
  try {
    if (!Device.isDevice) return { registered: false, reason: "simulator" };
    const current = await Notifications.getPermissionsAsync();
    const status = current.granted ? current : await Notifications.requestPermissionsAsync();
    if (!status.granted) return { registered: false, reason: "denied" };
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
    const res = await api().post("/api/v1/me/devices", { expoPushToken: token, platform: Platform.OS === "ios" ? "ios" : "android", device: Device.modelName ?? undefined });
    return res.ok ? { registered: true } : { registered: false, reason: `HTTP ${res.status}` };
  } catch (error) {
    return { registered: false, reason: error instanceof Error ? error.message : "unknown" };
  }
}

/**
 * When a session ends on the server (a 401: expired, revoked from the web),
 * the phone can no longer tell the server to forget its token. It stops
 * receiving remote notices on the device itself instead, so the last
 * person's notices do not keep arriving on a phone nobody is signed in to;
 * the next sign-in's registerForPush registers the device afresh (PH-2,
 * campaign 2026-10-04).
 */
export async function forgetPushOnDevice(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    await Notifications.unregisterForNotificationsAsync();
  } catch {
    /* no registration to undo */
  }
}

/**
 * The notices already delivered to the tray and the app icon's count, gone with the person (TA-348, 13 Nov 2026):
 * on a family's shared phone they stayed for the next person who picked it up. Each on its own, best effort.
 */
export async function clearDeliveredNotices(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.dismissAllNotificationsAsync().catch(() => undefined);
  await Notifications.setBadgeCountAsync(0).catch(() => undefined);
}

/** On sign-out: the device stops receiving this person's notices. */
export async function unregisterPush(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    await api().request("DELETE", "/api/v1/me/devices", { expoPushToken: token });
  } catch {
    /* no token, no device, or offline: the server retires dead tokens itself */
  }
}
