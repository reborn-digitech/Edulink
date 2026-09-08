import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { __setApiClient } from "@/lib/api";
import { registerForPush, unregisterPush } from "@/lib/push";

const device = (Device as unknown as { __state: { isDevice: boolean } }).__state;
const notif = Notifications as unknown as Record<string, jest.Mock>;
const spy = (name: string) => notif[name]!;

function fakeClient() {
  const calls: { method: string; path: string; body: unknown }[] = [];
  type Result = { ok: true; data: unknown } | { ok: false; status: number; error: string; code?: string };
  const client = {
    get: jest.fn(),
    post: jest.fn(async (path: string, body: unknown): Promise<Result> => (calls.push({ method: "POST", path, body }), { ok: true, data: {} })),
    request: jest.fn(async (method: string, path: string, body: unknown): Promise<Result> => (calls.push({ method, path, body }), { ok: true, data: {} })),
  };
  __setApiClient(client as never);
  return { client, calls };
}

describe("push registration", () => {
  const os = Platform.OS;
  afterEach(() => {
    Platform.OS = os;
    device.isDevice = false;
    __setApiClient(null);
    for (const fn of Object.values(notif)) if (jest.isMockFunction(fn)) fn.mockReset();
    notif.getPermissionsAsync!.mockImplementation(async () => ({ granted: false }));
    notif.requestPermissionsAsync!.mockImplementation(async () => ({ granted: false }));
    notif.getExpoPushTokenAsync!.mockImplementation(async () => ({ data: "ExponentPushToken[test]" }));
  });

  it("does nothing on the web target or a simulator, and says why", async () => {
    Platform.OS = "web";
    expect(await registerForPush()).toEqual({ registered: false, reason: "web" });
    await expect(unregisterPush()).resolves.toBeUndefined();
    Platform.OS = "ios";
    device.isDevice = false;
    expect(await registerForPush()).toEqual({ registered: false, reason: "simulator" });
  });

  it("respects a refusal", async () => {
    Platform.OS = "ios";
    device.isDevice = true;
    spy("getPermissionsAsync").mockResolvedValueOnce({ granted: false });
    spy("requestPermissionsAsync").mockResolvedValueOnce({ granted: false });
    const { calls } = fakeClient();
    expect(await registerForPush()).toEqual({ registered: false, reason: "denied" });
    expect(calls).toEqual([]);
  });

  it("registers the Expo token with the platform and the device name, and retires it on sign-out", async () => {
    Platform.OS = "android";
    device.isDevice = true;
    spy("getPermissionsAsync").mockResolvedValueOnce({ granted: true });
    spy("getExpoPushTokenAsync").mockResolvedValue({ data: "ExponentPushToken[abc]" });
    const { calls } = fakeClient();
    expect(await registerForPush()).toEqual({ registered: true });
    expect(calls[0]).toEqual({ method: "POST", path: "/api/v1/me/devices", body: { expoPushToken: "ExponentPushToken[abc]", platform: "android", device: "Test" } });
    await unregisterPush();
    expect(calls[1]).toEqual({ method: "DELETE", path: "/api/v1/me/devices", body: { expoPushToken: "ExponentPushToken[abc]" } });
  });

  it("reports a refused registration and swallows a thrown one", async () => {
    Platform.OS = "ios";
    device.isDevice = true;
    spy("getPermissionsAsync").mockResolvedValue({ granted: true });
    const token = spy("getExpoPushTokenAsync").mockResolvedValue({ data: "ExponentPushToken[abc]" });
    const { client } = fakeClient();
    client.post.mockResolvedValueOnce({ ok: false, status: 429, error: "Too many", code: "RATE_LIMITED" });
    expect(await registerForPush()).toEqual({ registered: false, reason: "HTTP 429" });
    token.mockRejectedValueOnce(new Error("no token"));
    expect(await registerForPush()).toEqual({ registered: false, reason: "no token" });
    token.mockRejectedValueOnce(new Error("no token"));
    await expect(unregisterPush()).resolves.toBeUndefined();
  });
});
