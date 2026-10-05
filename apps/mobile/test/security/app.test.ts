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
      // A web export's loopback never leaves the machine: a release export of
      // the web target may point at it (the CI sweep does).
      process.env.EXPO_PUBLIC_API_URL = "http://localhost:3000";
      const onWeb = () =>
        jest.isolateModules(() => {
          // eslint-disable-next-line @typescript-eslint/no-require-imports -- the instance api.ts will import
          const { Platform } = require("react-native") as typeof import("react-native");
          const os = jest.replaceProperty(Platform, "OS", "web");
          try {
            // eslint-disable-next-line @typescript-eslint/no-require-imports -- a fresh module instance per case
            require("@/lib/api");
          } finally {
            os.restore();
          }
        });
      expect(onWeb).not.toThrow();
      // A phone's loopback is the phone: a store build or an over-the-air
      // update made without EXPO_PUBLIC_API_URL falls back to localhost and
      // must refuse to start rather than reach nothing (the OTA workflow once
      // published exactly that).
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- a fresh module instance per case
      expect(() => jest.isolateModules(() => require("@/lib/api"))).toThrow(/is the phone itself/);
      process.env.EXPO_PUBLIC_API_URL = "http://127.0.0.1:3000";
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- a fresh module instance per case
      expect(() => jest.isolateModules(() => require("@/lib/api"))).toThrow(/is the phone itself/);
      delete process.env.EXPO_PUBLIC_API_URL;
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- a fresh module instance per case
      expect(() => jest.isolateModules(() => require("@/lib/api"))).toThrow(/without EXPO_PUBLIC_API_URL/);
      expect(onWeb).not.toThrow();
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

  it("include the college's and the modules' sensitive screens (A3-S-12, audit of 5 Oct 2026)", () => {
    // A student's ledger and no-dues, the anti-ragging register, the exam squad's malpractice cases,
    // the hostel's boarders, leave and visitors, and the college's alumni additions.
    const body = (file: string, fn: string) => {
      const text = read(file);
      const start = text.indexOf(`export function ${fn}(`);
      expect({ file, fn, found: start >= 0 }).toEqual({ file, fn, found: true });
      const next = text.indexOf("\nexport function ", start + 1);
      return text.slice(start, next < 0 ? undefined : next);
    };
    const screens: [string, string][] = [
      ["src/screens/college-office/lookup.tsx", "AccountsLookupScreen"],
      ["src/screens/college/duties.tsx", "AntiRaggingScreen"],
      ["src/screens/college/duty-desks.tsx", "ExamSquadScreen"],
      ["src/screens/hostel/warden.tsx", "WardenHome"],
      ["src/screens/alumni/college.tsx", "AlumniCollegeScreen"],
    ];
    for (const [file, fn] of screens) {
      expect({ file, imports: /from "@\/lib\/private-screen"/.test(read(file)) }).toEqual({ file, imports: true });
      expect({ file, fn, guarded: /usePrivateScreen\(\)/.test(body(file, fn)) }).toEqual({ file, fn, guarded: true });
    }
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

describe("what the phone keeps out of reach (campaign 2026-10-04)", () => {
  it("turns Android auto-backup off, so the outbox's database is not copied to a cloud backup (PH-9)", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- the config module as Expo reads it
    const config = (require("../../app.config") as { default: { android?: { allowBackup?: boolean } } }).default;
    expect(config.android?.allowBackup).toBe(false);
  });

  it("gives the web target a Content-Security-Policy before any script (PH-8)", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { contentSecurityPolicy, HYDRATE_SCRIPT_HASH } = require("@/lib/csp") as typeof import("@/lib/csp");
    const policy = contentSecurityPolicy("https://api.example/", false);
    const script = policy.split("; ").find((d) => d.startsWith("script-src "))!;
    expect(script).not.toMatch(/unsafe-inline|unsafe-eval|\*/);
    expect(policy).toContain("connect-src 'self' https://api.example;");
    expect(policy).toContain("object-src 'none'");
    // The hash is of the one inline script an export writes: expo-router's hydration flag.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createHash } = require("node:crypto") as typeof import("node:crypto");
    expect(HYDRATE_SCRIPT_HASH).toBe(`sha256-${createHash("sha256").update("globalThis.__EXPO_ROUTER_HYDRATE__=true;").digest("base64")}`);
    expect(contentSecurityPolicy("http://localhost:3000", true)).toContain("connect-src 'self' http://localhost:3000 ws: wss:");
    const html = read("src/app/+html.tsx");
    expect(html.indexOf("Content-Security-Policy")).toBeGreaterThan(-1);
    expect(html.indexOf("Content-Security-Policy")).toBeLessThan(html.indexOf("<ScrollViewStyleReset"));
  });
});

describe("autofill hints the web target renders (B-23, campaign 2026-10-04)", () => {
  // The HTML autocomplete tokens (WHATWG "autofill field names"): react-native-web writes the prop
  // to the input as it is, and a phone-only word such as "postal-address-locality" fails axe's
  // autocomplete-valid there. A phone-only hint goes through Platform.select with the web's token.
  const HTML_TOKENS = new Set(["off", "on", "name", "honorific-prefix", "given-name", "additional-name", "family-name", "honorific-suffix", "nickname", "email", "username", "new-password", "current-password", "one-time-code", "organization-title", "organization", "street-address", "address-line1", "address-line2", "address-line3", "address-level1", "address-level2", "address-level3", "address-level4", "country", "country-name", "postal-code", "language", "bday", "bday-day", "bday-month", "bday-year", "sex", "tel", "tel-country-code", "tel-national", "url", "photo"]);
  it("every literal autoComplete is one the browser knows", () => {
    const bad = sources.flatMap((s) => [...s.text.matchAll(/autoComplete="([^"]+)"/g)].map((m) => ({ file: s.file, value: m[1]! }))).filter((x) => !HTML_TOKENS.has(x.value));
    expect(bad).toEqual([]);
  });
});
