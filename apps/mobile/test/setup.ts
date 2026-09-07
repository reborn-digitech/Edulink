/* Jest setup for the app: native modules the screens touch are replaced with
 * quiet fakes, so a component test exercises the screen and not the phone. */

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
jest.mock("expo-notifications", () => ({
  getPermissionsAsync: async () => ({ granted: false }),
  requestPermissionsAsync: async () => ({ granted: false }),
  getExpoPushTokenAsync: async () => ({ data: "ExponentPushToken[test]" }),
  addNotificationResponseReceivedListener: () => ({ remove: () => {} }),
}));
jest.mock("expo-device", () => ({ isDevice: false, modelName: "Test" }));
