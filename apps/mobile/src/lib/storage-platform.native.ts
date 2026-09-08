/**
 * The phone's key store: expo-secure-store. Picked by Metro on iOS and
 * Android only; the web file beside it returns null and storage falls back
 * to localStorage, so the web bundle never references the native module.
 */
import * as SecureStore from "expo-secure-store";
import type { KeyStore } from "./storage";

export function platformKeyStore(): KeyStore {
  return {
    async get(key) {
      return SecureStore.getItemAsync(key);
    },
    async set(key, value) {
      await SecureStore.setItemAsync(key, value);
    },
    async remove(key) {
      await SecureStore.deleteItemAsync(key);
    },
  };
}

