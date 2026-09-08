import { act, renderHook, waitFor } from "@testing-library/react-native";
import { AppState, Platform } from "react-native";
import * as Application from "expo-application";
import * as Updates from "expo-updates";
import { __setApiClient } from "@/lib/api";
import { __resetVersionCheck, appBuild, appVersion, checkVersion, checkVersionThrottled, compareVersions, deviceInfo, evaluate, osLabel, useVersionGate, VERSION_CHECK_INTERVAL_MS } from "@/lib/version";

jest.mock("expo-constants", () => ({ __esModule: true, default: { expoConfig: { version: "0.2.0" } } }));

const app = (Application as unknown as { __state: { nativeApplicationVersion: string | null; nativeBuildVersion: string | null } }).__state;
const updates = (Updates as unknown as { __state: { updateId: string | null } }).__state;

const POLICY = { minimum: { ios: "0.1.0", android: "0.1.0" }, latest: { ios: "0.3.0", android: "0.3.1" }, storeUrls: { ios: "https://apps.apple.com/app/id1", android: null }, message: null };

type Result = { ok: true; data: unknown } | { ok: false; status: number; error: string; code?: string };
function fakeClient(answer: () => Result) {
  const get = jest.fn(async (): Promise<Result> => answer());
  __setApiClient({ get, post: jest.fn(), request: jest.fn() } as never);
  return get;
}

describe("the app's version", () => {
  const os = Platform.OS;
  afterEach(() => {
    Platform.OS = os;
    app.nativeApplicationVersion = "0.1.0";
    app.nativeBuildVersion = "1";
    updates.updateId = null;
    __setApiClient(null);
    __resetVersionCheck();
    jest.restoreAllMocks();
  });

  it("is the store's, then the config's, then 0.0.0", () => {
    expect(appVersion()).toBe("0.1.0");
    app.nativeApplicationVersion = null;
    expect(appVersion()).toBe("0.2.0");
  });

  it("names the build, and the OTA update running on top of it", () => {
    expect(appBuild()).toBe("1");
    updates.updateId = "0123456789abcdef-uuid";
    expect(appBuild()).toBe("1+01234567");
    app.nativeBuildVersion = null;
    expect(appBuild()).toBe("01234567");
    updates.updateId = null;
    expect(appBuild()).toBeUndefined();
  });

  it("describes the device the way the report contract spells it", () => {
    expect(deviceInfo()).toEqual({ platform: "ios", os: "iOS", model: "Test", appVersion: "0.1.0", build: "1" });
    Platform.OS = "android";
    expect(deviceInfo().platform).toBe("android");
    expect(osLabel()).toBe("Android");
    Platform.OS = "web";
    expect(deviceInfo().platform).toBe("web");
  });

  it("compares dotted numbers, missing parts as zero", () => {
    expect(compareVersions("1.2.3", "1.2.3")).toBe(0);
    expect(compareVersions("1.2", "1.2.0")).toBe(0);
    expect(compareVersions("1.2", "1.2.1")).toBe(-1);
    expect(compareVersions("1.10", "1.9")).toBe(1);
    expect(compareVersions("2", "1.99.99")).toBe(1);
    expect(compareVersions("0.9.9", "1")).toBe(-1);
    expect(compareVersions("x", "0.0.1")).toBe(-1);
  });

  it("below the store's minimum needs an update; at it, or on the web, is fine", () => {
    expect(evaluate(POLICY, "0.0.9")).toBe("update-required");
    expect(evaluate(POLICY, "0.1.0")).toBe("ok");
    expect(evaluate(POLICY, "0.1.1")).toBe("ok");
    Platform.OS = "android";
    expect(evaluate({ ...POLICY, minimum: { ios: "0.0.1", android: "0.2.0" } }, "0.1.0")).toBe("update-required");
    Platform.OS = "web";
    expect(evaluate(POLICY, "0.0.1")).toBe("ok");
  });

  it("asks the server and reads the answer through the contract", async () => {
    const get = fakeClient(() => ({ ok: true, data: { ...POLICY, minimum: { ios: "0.2.0", android: "0.2.0" } } }));
    expect(await checkVersion()).toEqual({ state: "update-required", policy: { ...POLICY, minimum: { ios: "0.2.0", android: "0.2.0" } } });
    expect(get).toHaveBeenCalledWith("/api/v1/app/version");
    fakeClient(() => ({ ok: true, data: POLICY }));
    expect((await checkVersion()).state).toBe("ok");
  });

  it("never blocks because the check failed: no network, a refusal or a strange shape are unknown", async () => {
    fakeClient(() => ({ ok: false, status: 0, error: "Network request failed", code: "SERVER" }));
    expect(await checkVersion()).toEqual({ state: "unknown", policy: null });
    fakeClient(() => ({ ok: false, status: 503, error: "Down", code: "SERVER" }));
    expect(await checkVersion()).toEqual({ state: "unknown", policy: null });
    fakeClient(() => ({ ok: true, data: { minimum: "1.0" } }));
    expect(await checkVersion()).toEqual({ state: "unknown", policy: null });
  });

  it("asks at most once per six hours, and a failed check does not count as one", async () => {
    let now = 1_700_000_000_000;
    jest.spyOn(Date, "now").mockImplementation(() => now);
    const get = fakeClient(() => ({ ok: true, data: POLICY }));
    await checkVersionThrottled();
    await checkVersionThrottled();
    now += VERSION_CHECK_INTERVAL_MS - 1;
    expect((await checkVersionThrottled()).state).toBe("ok");
    expect(get).toHaveBeenCalledTimes(1);
    now += 2;
    await checkVersionThrottled();
    expect(get).toHaveBeenCalledTimes(2);

    __resetVersionCheck();
    const failing = fakeClient(() => ({ ok: false, status: 0, error: "offline", code: "SERVER" }));
    await checkVersionThrottled();
    await checkVersionThrottled();
    expect(failing).toHaveBeenCalledTimes(2);
  });

  it("the gate checks on start and on each return to the foreground, throttled", async () => {
    let now = 1_700_000_000_000;
    jest.spyOn(Date, "now").mockImplementation(() => now);
    let listener: ((state: string) => void) | null = null;
    const remove = jest.fn();
    (AppState.addEventListener as jest.Mock).mockImplementation((_type: string, fn: (state: string) => void) => {
      listener = fn;
      return { remove };
    });
    const get = fakeClient(() => ({ ok: true, data: { ...POLICY, minimum: { ios: "9.0.0", android: "9.0.0" } } }));
    const { result, unmount } = await renderHook(() => useVersionGate());
    await waitFor(() => expect(result.current.state).toBe("update-required"));
    expect(result.current.policy?.storeUrls.ios).toBe("https://apps.apple.com/app/id1");
    expect(get).toHaveBeenCalledTimes(1);

    await act(async () => listener!("active"));
    expect(get).toHaveBeenCalledTimes(1);
    await act(async () => listener!("background"));
    now += VERSION_CHECK_INTERVAL_MS + 1;
    await act(async () => listener!("active"));
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
    await unmount();
    expect(remove).toHaveBeenCalled();
  });

  it("the web target has no store and never asks", async () => {
    Platform.OS = "web";
    const get = fakeClient(() => ({ ok: true, data: POLICY }));
    const { result } = await renderHook(() => useVersionGate());
    await act(async () => {});
    expect(result.current.state).toBe("unknown");
    expect(get).not.toHaveBeenCalled();
  });
});
