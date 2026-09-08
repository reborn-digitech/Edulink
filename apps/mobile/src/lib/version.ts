import { useEffect, useState } from "react";
import { AppState, Platform } from "react-native";
import * as Application from "expo-application";
import * as Device from "expo-device";
import * as Updates from "expo-updates";
import Constants from "expo-constants";
import type { z } from "zod";
import { appReportBodySchema, appVersionSchema } from "@edulink/contracts";
import { api } from "./api";

/**
 * The kill switch, from the app's side. GET /api/v1/app/version says the
 * oldest version each store may still run; a phone below it sees the
 * update screen and nothing else. The check is made on start and again
 * when the app returns to the foreground, at most once per six hours, and
 * it never blocks anyone because it failed: no network, a refusal, a shape
 * the contract does not know — all of those are "unknown", and the app
 * goes on. Only a policy the server actually sent can stop it.
 */
export type VersionPolicy = z.infer<typeof appVersionSchema>;
export type AppReportBody = z.infer<typeof appReportBodySchema>;
export type VersionState = "ok" | "update-required" | "unknown";
export type VersionCheck = { state: VersionState; policy: VersionPolicy | null };

export const VERSION_CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

/** The version the store knows; the config's in development; "0.0.0" when neither is set. */
export function appVersion(): string {
  return Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? "0.0.0";
}

/**
 * The build number, with the first eight characters of the OTA update id
 * when one is running: the JavaScript that crashed is the update's, not
 * the store build's, and a report without that is ambiguous.
 */
export function appBuild(): string | undefined {
  const native = Application.nativeBuildVersion ?? undefined;
  const update = Updates.updateId ? Updates.updateId.slice(0, 8) : undefined;
  if (native && update) return `${native}+${update}`;
  return native ?? update;
}

/** "ios" | "android" | "web", the way the report contract spells it. */
export function platformName(): AppReportBody["device"]["platform"] {
  if (Platform.OS === "android") return "android";
  if (Platform.OS === "web") return "web";
  return "ios";
}

/** "iOS 17.5", "Android 14", "Web" — for a person to read before it is sent. */
export function osLabel(): string {
  const name = { ios: "iOS", android: "Android", web: "Web" }[platformName()];
  const version = Platform.Version === undefined || Platform.Version === null ? "" : String(Platform.Version);
  return version ? `${name} ${version}` : name;
}

/** What every report attaches about the phone: exactly this, nothing hidden. */
export function deviceInfo(): AppReportBody["device"] {
  return { platform: platformName(), os: osLabel(), model: Device.modelName ?? undefined, appVersion: appVersion(), build: appBuild() };
}

/** Dotted numeric compare: "1.2" < "1.2.1" < "1.10"; a missing part is 0; anything non-numeric counts as 0. */
export function compareVersions(a: string, b: string): -1 | 0 | 1 {
  const pa = a.split(".").map((x) => parseInt(x, 10) || 0);
  const pb = b.split(".").map((x) => parseInt(x, 10) || 0);
  const n = Math.max(pa.length, pb.length);
  for (let i = 0; i < n; i++) {
    const x = pa[i] ?? 0;
    const y = pb[i] ?? 0;
    if (x < y) return -1;
    if (x > y) return 1;
  }
  return 0;
}

/** The store's minimum for this phone, and whether this build is below it. */
export function evaluate(policy: VersionPolicy, current = appVersion()): VersionState {
  const platform = platformName();
  if (platform === "web") return "ok";
  return compareVersions(current, policy.minimum[platform]) < 0 ? "update-required" : "ok";
}

let lastChecked = 0;
let last: VersionCheck = { state: "unknown", policy: null };

/** One fetch of the policy. A failed fetch is "unknown" and is not counted as a check, so the next foreground tries again. */
export async function checkVersion(): Promise<VersionCheck> {
  const res = await api().get("/api/v1/app/version");
  if (!res.ok) return { state: "unknown", policy: null };
  const parsed = appVersionSchema.safeParse(res.data);
  if (!parsed.success) return { state: "unknown", policy: null };
  lastChecked = Date.now();
  last = { state: evaluate(parsed.data), policy: parsed.data };
  return last;
}

/** The last answer when the throttle says so, a fresh one otherwise. */
export async function checkVersionThrottled(now = Date.now()): Promise<VersionCheck> {
  if (lastChecked && now - lastChecked < VERSION_CHECK_INTERVAL_MS) return last;
  return checkVersion();
}

/** Tests start each case from a phone that has never asked. */
export function __resetVersionCheck(): void {
  lastChecked = 0;
  last = { state: "unknown", policy: null };
}

/**
 * On start, and on every return to the foreground (throttled), asks the
 * server; the web target never asks, there is no store to send it to. The
 * state begins "unknown" so the app renders while the answer is on its way.
 */
export function useVersionGate(): VersionCheck {
  const [check, setCheck] = useState<VersionCheck>(last);
  useEffect(() => {
    if (Platform.OS === "web") return;
    let alive = true;
    const run = () => {
      void checkVersionThrottled()
        .then((next) => {
          if (alive) setCheck(next);
        })
        .catch(() => {});
    };
    run();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") run();
    });
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);
  return check;
}
