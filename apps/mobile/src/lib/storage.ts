import { platformKeyStore } from "./storage-platform";

/**
 * Where the session token lives: the secure enclave on a phone, the browser's
 * localStorage on the web target (which is a development convenience, not a
 * deployment). Everything else the app remembers goes through the same door
 * so a test can replace the whole thing with a Map.
 */
export type KeyStore = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
};

export function memoryStore(initial: Record<string, string> = {}): KeyStore {
  const map = new Map(Object.entries(initial));
  return {
    async get(key) {
      return map.get(key) ?? null;
    },
    async set(key, value) {
      map.set(key, value);
    },
    async remove(key) {
      map.delete(key);
    },
  };
}

/** The web target's store, exported so a test can reach it on a runner that resolves the native twin. */
export function webStore(): KeyStore {
  return {
    async get(key) {
      try {
        return globalThis.localStorage?.getItem(key) ?? null;
      } catch {
        return null;
      }
    },
    async set(key, value) {
      try {
        globalThis.localStorage?.setItem(key, value);
      } catch {
        /* private mode */
      }
    },
    async remove(key) {
      try {
        globalThis.localStorage?.removeItem(key);
      } catch {
        /* ignore */
      }
    },
  };
}

let current: KeyStore | null = null;

export function keyStore(): KeyStore {
  if (!current) current = platformKeyStore() ?? webStore();
  return current;
}

/** Tests swap the store; nothing else should. */
export function __setKeyStore(store: KeyStore | null): void {
  current = store;
}

export const KEYS = {
  token: "edulink.session.token",
  session: "edulink.session.meta",
  locale: "edulink.locale",
  lock: "edulink.lock",
} as const;
