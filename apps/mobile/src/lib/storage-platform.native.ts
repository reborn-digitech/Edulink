/**
 * The phone's key store: expo-secure-store. Picked by Metro on iOS and
 * Android only; the web file beside it returns null and storage falls back
 * to localStorage, so the web bundle never references the native module.
 */
import type { KeyStore } from "./storage";

export function platformKeyStore(): KeyStore {
  // Loaded lazily so the web bundle and the test runner never touch the native module.
  const load = () => import("expo-secure-store");
  return {
    async get(key) {
      return (await load()).getItemAsync(key);
    },
    async set(key, value) {
      await (await load()).setItemAsync(key, value);
    },
    async remove(key) {
      await (await load()).deleteItemAsync(key);
    },
  };
}

