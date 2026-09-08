import { __setKeyStore, KEYS, keyStore, memoryStore, webStore } from "@/lib/storage";

describe("the key store", () => {
  afterEach(() => __setKeyStore(null));

  it("on a phone is the secure store, built once", async () => {
    __setKeyStore(null);
    const store = keyStore();
    expect(keyStore()).toBe(store);
    await store.set(KEYS.token, "t1");
    expect(await store.get(KEYS.token)).toBe("t1");
    await store.remove(KEYS.token);
    expect(await store.get(KEYS.token)).toBeNull();
  });

  it("on the web target is localStorage, and survives a storage that throws as a private window does", async () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    const map = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", { value: { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v), removeItem: (k: string) => void map.delete(k) }, configurable: true });
    const store = webStore();
    await store.set(KEYS.locale, "hi");
    expect(await store.get(KEYS.locale)).toBe("hi");
    await store.remove(KEYS.locale);
    expect(await store.get(KEYS.locale)).toBeNull();
    const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => { throw new Error("blocked"); } };
    Object.defineProperty(globalThis, "localStorage", { value: broken, configurable: true });
    try {
      await expect(store.set(KEYS.token, "t")).resolves.toBeUndefined();
      expect(await store.get(KEYS.token)).toBeNull();
      await expect(store.remove(KEYS.token)).resolves.toBeUndefined();
    } finally {
      if (original) Object.defineProperty(globalThis, "localStorage", original);
      else delete (globalThis as { localStorage?: unknown }).localStorage;
    }
  });

  it("is a Map in tests", async () => {
    const store = memoryStore({ [KEYS.token]: "abc" });
    expect(await store.get(KEYS.token)).toBe("abc");
    await store.set("x", "1");
    await store.remove(KEYS.token);
    expect(await store.get(KEYS.token)).toBeNull();
    expect(await store.get("x")).toBe("1");
  });
});
