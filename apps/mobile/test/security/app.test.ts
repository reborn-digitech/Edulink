import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * The security layer's code-level checks, the ones a scan on a device
 * would confirm and a reader can confirm here: the session token lives in
 * secure storage and nowhere else, is never logged, and never travels in
 * the clear from a release build; the private screens refuse screenshots;
 * an altered phone is warned. MobSF and certificate pinning wait for a
 * native build (see the Phase 5 report).
 */
const ROOT = join(__dirname, "..", "..");
const SRC = join(ROOT, "src");

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name: string) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : /\.tsx?$/.test(name) ? [p] : [];
  });
}
const sources = walk(SRC).map((f) => ({ file: relative(SRC, f), text: readFileSync(f, "utf8") }));
const read = (f: string) => readFileSync(join(ROOT, f), "utf8");

describe("the session token", () => {
  it("is read and written through the key store only", () => {
    const literal = sources.filter((s) => s.text.includes("edulink.session.token")).map((s) => s.file);
    expect(literal).toEqual(["lib/storage.ts"]);
    // The readers: the API client, the outbox's replay client, the session
    // provider, and the image headers hook — each puts it in an Authorization
    // header. Never in a URL: a query string lands in logs and histories.
    const readers = sources.filter((s) => /KEYS\.token/.test(s.text)).map((s) => s.file).sort();
    expect(readers).toEqual(["lib/api.ts", "lib/outbox-runner.ts", "lib/session.tsx", "screens/family/shared.tsx"]);
    const inUrl = sources.filter((s) => /[?&]token=\$\{|token=\$\{token|`[^`]*\?[^`]*\$\{token\}/.test(s.text)).map((s) => s.file);
    expect(inUrl).toEqual([]);
  });

  it("lives in the secure enclave on a phone", () => {
    const code = read("src/lib/storage-platform.native.ts").replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
    expect(code).toMatch(/from "expo-secure-store"/);
    expect(code).not.toMatch(/AsyncStorage|localStorage/);
  });

  it("is never logged", () => {
    const logs = sources.flatMap((s) => s.text.split("\n").map((line, i) => ({ where: `${s.file}:${i + 1}`, line })).filter((l) => /console\.(log|warn|error|info|debug)\(/.test(l.line) && /token|bearer|password/i.test(l.line)));
    expect(logs).toEqual([]);
  });

  it("does not travel in the clear from a release build", () => {
    const original = (globalThis as { __DEV__?: boolean }).__DEV__;
    const env = process.env.EXPO_PUBLIC_API_URL;
    try {
      (globalThis as { __DEV__?: boolean }).__DEV__ = false;
      process.env.EXPO_PUBLIC_API_URL = "http://api.example";
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- a fresh module instance per case
      expect(() => jest.isolateModules(() => require("@/lib/api"))).toThrow(/https:\/\//);
      process.env.EXPO_PUBLIC_API_URL = "https://api.example";
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- a fresh module instance per case
      expect(() => jest.isolateModules(() => require("@/lib/api"))).not.toThrow();
      // The loopback never leaves the machine: a release export may point at it (the CI sweep does).
      process.env.EXPO_PUBLIC_API_URL = "http://localhost:3000";
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- a fresh module instance per case
      expect(() => jest.isolateModules(() => require("@/lib/api"))).not.toThrow();
      // A LAN address is the network, not the machine.
      process.env.EXPO_PUBLIC_API_URL = "http://192.168.1.10:3000";
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- a fresh module instance per case
      expect(() => jest.isolateModules(() => require("@/lib/api"))).toThrow(/https:\/\//);
    } finally {
      (globalThis as { __DEV__?: boolean }).__DEV__ = original;
      if (env === undefined) delete process.env.EXPO_PUBLIC_API_URL;
      else process.env.EXPO_PUBLIC_API_URL = env;
    }
  });
});

describe("the app's configuration", () => {
  const app = JSON.parse(read("app.json")) as { expo: { android?: { usesCleartextTraffic?: boolean }; ios?: { infoPlist?: Record<string, unknown> }; scheme: string } };
  it("never allows cleartext transport", () => {
    expect(app.expo.android?.usesCleartextTraffic).not.toBe(true);
    const ats = app.expo.ios?.infoPlist?.NSAppTransportSecurity as { NSAllowsArbitraryLoads?: boolean } | undefined;
    expect(ats?.NSAllowsArbitraryLoads).not.toBe(true);
  });
  it("owns its deep-link scheme", () => {
    expect(app.expo.scheme).toBe("edulink");
  });
});

describe("the private screens", () => {
  it("refuse screenshots and screen recording while up", () => {
    // Marks and cards, and since 2026-10-01 every screen that shows a child's
    // record, health, incidents, fees, attendance, or a message thread.
    const guarded = [
      "src/screens/teacher/marks.tsx", "src/screens/family/exams.tsx",
      "src/screens/teacher/register.tsx", "src/screens/teacher/report-cards.tsx", "src/screens/teacher/messages.tsx", "src/screens/teacher/thread.tsx",
      "src/screens/staff/messaging.tsx", "src/screens/staff/attendance.tsx", "src/screens/family/attendance.tsx",
      "src/screens/family/health.tsx", "src/screens/staff/pupil-health.tsx", "src/screens/staff/pupil-record.tsx", "src/screens/family/record.tsx",
      "src/screens/staff/incident.tsx", "src/screens/family/incidents.tsx", "src/screens/staff/incidents.tsx",
      "src/screens/family/student-profile.tsx", "src/screens/staff/person.tsx", "src/screens/staff/staff-record.tsx",
      "src/screens/staff/fee-pupil.tsx", "src/screens/family/fees.tsx", "src/screens/staff/safety.tsx",
    ];
    for (const file of guarded) {
      const text = read(file);
      expect({ file, guarded: /usePrivateScreen\(\)/.test(text) && /from "@\/lib\/private-screen"/.test(text) }).toEqual({ file, guarded: true });
    }
    // The guard is the native module on a phone and a no-op on the web target, where the module throws.
    const native = read("src/lib/private-screen.native.ts");
    expect(native).toMatch(/usePreventScreenCapture\(\)/);
    expect(native).toMatch(/from "expo-screen-capture"/);
    expect(read("src/lib/private-screen.ts")).not.toMatch(/expo-screen-capture/);
  });
});

describe("an altered phone", () => {
  it("is warned, not blocked", () => {
    const layout = read("src/app/_layout.tsx");
    expect(layout).toMatch(/isRootedExperimentalAsync/);
    expect(layout).toMatch(/security\.rootedTitle/);
    expect(layout).not.toMatch(/signOut|router\.replace\("\/\(auth\)"\)[^\n]*rooted/);
  });
});
