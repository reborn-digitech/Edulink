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
jest.mock("expo-screen-capture", () => ({ usePreventScreenCapture: jest.fn(), preventScreenCaptureAsync: jest.fn(async () => {}), allowScreenCaptureAsync: jest.fn(async () => {}) }));
