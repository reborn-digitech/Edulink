/* Jest setup for the app: native modules the screens touch are replaced with
 * quiet fakes, so a component test exercises the screen and not the phone. */
import { configure } from "@testing-library/react-native";

// findBy* and waitFor give up after one second by default. A screen renders
// well inside that on an idle machine and outside it on a two-core runner
// with the rest of the battery beside it (CI run 34151980679, and one local
// run under two dev servers); a passing test is not slowed by a longer
// budget, only a failing one waits longer before saying so.
configure({ asyncUtilTimeout: 10_000 });

jest.mock("expo-localization", () => ({ getLocales: () => [{ languageCode: "en" }] }));
jest.mock("expo-secure-store", () => {
  const map = new Map<string, string>();
  return {
    getItemAsync: async (k: string) => map.get(k) ?? null,
    setItemAsync: async (k: string, v: string) => void map.set(k, v),
    deleteItemAsync: async (k: string) => void map.delete(k),
  };
});
jest.mock("expo-haptics", () => ({ impactAsync: async () => {}, notificationAsync: async () => {}, ImpactFeedbackStyle: { Light: "light", Medium: "medium" }, NotificationFeedbackType: { Success: "success", Error: "error" } }));
jest.mock("expo-sqlite", () => ({ openDatabaseAsync: async () => { throw new Error("no sqlite in tests: use memoryOutbox"); } }));
// jest.fn so a test can give one call a different answer; Babel's namespace
// interop copies the function reference, so a spy made on the copy works too.
jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(async () => ({ granted: false })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: false })),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: "ExponentPushToken[test]" })),
  unregisterForNotificationsAsync: jest.fn(async () => {}),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: () => {} })),
}));
// isDevice is a getter over shared state, because the interop copies a plain
// value and a test's assignment would never reach the module under test.
jest.mock("expo-device", () => {
  const state = { isDevice: false, rooted: false };
  return {
    get isDevice() {
      return state.isDevice;
    },
    modelName: "Test",
    isRootedExperimentalAsync: jest.fn(async () => state.rooted),
    __state: state,
  };
});
// The store's version and build, and the OTA update that may be running:
// getters over shared state for the same reason as expo-device above.
jest.mock("expo-application", () => {
  const state = { nativeApplicationVersion: "0.1.0" as string | null, nativeBuildVersion: "1" as string | null };
  return {
    get nativeApplicationVersion() {
      return state.nativeApplicationVersion;
    },
    get nativeBuildVersion() {
      return state.nativeBuildVersion;
    },
    __state: state,
  };
});
jest.mock("expo-updates", () => {
  const state = { updateId: null as string | null, channel: null as string | null, runtimeVersion: "0.1.0" as string | null };
  return {
    get updateId() {
      return state.updateId;
    },
    get channel() {
      return state.channel;
    },
    get runtimeVersion() {
      return state.runtimeVersion;
    },
    __state: state,
  };
});
jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true, status: "granted" })),
  launchCameraAsync: jest.fn(async () => ({ canceled: true, assets: null })),
}));
jest.mock("expo-screen-capture", () => ({ usePreventScreenCapture: jest.fn(), preventScreenCaptureAsync: jest.fn(async () => {}), allowScreenCaptureAsync: jest.fn(async () => {}) }));
// The PDF download writes to the cache and opens the share sheet: both are
// fakes a test can read, for what was written and what was shared.
jest.mock("expo-file-system", () => {
  // A cache directory that remembers what was written, so a test can see a
  // shared file appear and sign-out remove it.
  const cache: Map<string, File> = new Map();
  class File {
    uri: string;
    written: Uint8Array | string | null = null;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = parts.map((p) => (typeof p === "string" ? p : p.uri)).join("/");
    }
    get name() {
      return this.uri.slice(this.uri.lastIndexOf("/") + 1);
    }
    get exists() {
      return cache.has(this.uri);
    }
    write(content: Uint8Array | string) {
      this.written = content;
      cache.set(this.uri, this);
      (globalThis as { __lastWrittenFile?: File }).__lastWrittenFile = this;
    }
    delete() {
      cache.delete(this.uri);
    }
  }
  class Directory {
    uri: string;
    constructor(...parts: (string | { uri: string })[]) {
      this.uri = parts.map((p) => (typeof p === "string" ? p : p.uri)).join("/");
    }
    list() {
      return [...cache.values()].filter((f) => f.uri.startsWith(this.uri + "/"));
    }
  }
  // The app has been launched before on this phone: the install marker
  // (lib/install-platform.native.ts) is there, so a stored token is kept. A
  // test of a fresh install deletes it.
  new File("file:///document", "edulink-installed").write("1");
  (globalThis as { __cacheFiles?: Map<string, File> }).__cacheFiles = cache;
  return { Directory, File, Paths: { cache: { uri: "file:///cache" }, document: { uri: "file:///document" } } };
});
jest.mock("expo-sharing", () => ({ isAvailableAsync: jest.fn(async () => true), shareAsync: jest.fn(async () => {}) }));

// A release bundle carries only the keys scripts/i18n-subset.cjs finds the
// phone can ask for, and a key it misses shows as the key itself on a phone
// and nowhere in these tests, which run on the whole dictionaries. So every
// key a test file asks the translator for is kept, and the file fails if one
// of them is a sentence the release would not have. Keys the dictionary does
// not hold at all are another test's business (test/lib/keys.test.ts).
jest.mock("@edulink/i18n", () => {
  const actual = jest.requireActual("@edulink/i18n");
  const asked = new Set<string>();
  (globalThis as { __askedKeys?: Set<string> }).__askedKeys = asked;
  return {
    ...actual,
    translatorFor: (dictionary: unknown) => {
      const t = actual.translatorFor(dictionary);
      return (key: string, vars?: Record<string, string | number>) => {
        asked.add(key);
        return t(key, vars);
      };
    },
  };
});

afterAll(() => {
  const asked = (globalThis as { __askedKeys?: Set<string> }).__askedKeys;
  if (!asked || asked.size === 0) return;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { usedKeys } = require("../scripts/i18n-subset.cjs") as { usedKeys: () => { used: Set<string>; all: Map<string, string> } };
  const { used, all } = usedKeys();
  const left = [...asked].filter((key) => all.has(key) && !used.has(key)).sort();
  if (left.length > 0) {
    throw new Error(`scripts/i18n-subset.cjs leaves out ${left.length} key(s) this file asked the translator for, and a release would show the key in place of the sentence: ${left.join(", ")}`);
  }
});

// The event stream. A screen that listens (the register, the substitution
// board) opens GET /api/v1/events through expo/fetch, which under jest is this
// machine's own fetch and would reach a dev server on :3000. Here it is a
// stream that never says anything; a test that wants the stream to speak
// injects its own (__setEventsFetch in src/lib/use-events.ts).
jest.mock("expo/fetch", () => ({ fetch: async () => ({ ok: true, status: 200, body: new ReadableStream() }) }));

// Somebody is signed in (the outbox's owner, lib/outbox.ts): a screen test
// renders a screen the way a signed-in person sees it, without the session
// provider that sets the owner in the app, and what it queues is theirs to
// send. The tests of the owner rule itself (test/security/outbox-owner.test.tsx)
// set and clear the owner as the session does.
// Each test starts with an empty outbox in memory (the phone's is SQLite, which jest has not got).
beforeEach(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const outbox = require("@/lib/outbox") as typeof import("@/lib/outbox");
  outbox.__setOutboxStore(outbox.memoryOutbox());
  outbox.setOutboxOwner({ userId: "zz-test-person", schoolId: "s1", membershipId: "m1" });
});
