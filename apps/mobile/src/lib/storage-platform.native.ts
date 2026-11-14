/**
 * The phone's key store: expo-secure-store. Picked by Metro on iOS and
 * Android only; the web file beside it returns null and storage falls back
 * to localStorage, so the web bundle never references the native module.
 */
import * as SecureStore from "expo-secure-store";
import type { KeyStore } from "./storage";

/**
 * Readable once the phone has been unlocked after it started, and never
 * carried to another device by a backup or an iCloud keychain sync: a
 * session token restored onto somebody else's phone is a session on
 * somebody else's phone. Not "only while unlocked" (TA-150, 13 Nov 2026):
 * the token is read on every request, and a driver's phone locked in its
 * holder could not read it, so the bus's positions waited in the outbox
 * until the screen was unlocked.
 */
const OPTIONS = { keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY };

export function platformKeyStore(): KeyStore {
  return {
    async get(key) {
      return SecureStore.getItemAsync(key, OPTIONS);
    },
    async set(key, value) {
      // A write to a key that exists keeps the accessibility it was first
      // stored with (the store updates the value only), so the old item goes
      // first and the new one is stored with today's (TA-150).
      await SecureStore.deleteItemAsync(key, OPTIONS).catch(() => undefined);
      await SecureStore.setItemAsync(key, value, OPTIONS);
    },
    async remove(key) {
      await SecureStore.deleteItemAsync(key, OPTIONS);
    },
  };
}

