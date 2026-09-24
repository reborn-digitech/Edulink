/**
 * The phone's key store: expo-secure-store. Picked by Metro on iOS and
 * Android only; the web file beside it returns null and storage falls back
 * to localStorage, so the web bundle never references the native module.
 */
import * as SecureStore from "expo-secure-store";
import type { KeyStore } from "./storage";

/**
 * Readable only while the device is unlocked, and never carried to another
 * device by a backup or an iCloud keychain sync: a session token restored
 * onto somebody else's phone is a session on somebody else's phone.
 */
const OPTIONS = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };

export function platformKeyStore(): KeyStore {
  return {
    async get(key) {
      return SecureStore.getItemAsync(key, OPTIONS);
    },
    async set(key, value) {
      await SecureStore.setItemAsync(key, value, OPTIONS);
    },
    async remove(key) {
      await SecureStore.deleteItemAsync(key, OPTIONS);
    },
  };
}

