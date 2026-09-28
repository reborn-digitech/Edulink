import { createHash } from "node:crypto";
import { __setKeyStore, KEYS, memoryStore } from "@/lib/storage";
import { beginHandoff, handoffUrl, takeVerifier } from "@/lib/sso-handoff";

let mockBytes = new Uint8Array(32);
jest.mock("expo-crypto", () => ({
  CryptoDigestAlgorithm: { SHA256: "SHA-256" },
  CryptoEncoding: { BASE64: "base64" },
  getRandomBytesAsync: async (n: number) => mockBytes.slice(0, n),
  // The real digest, so the challenge asserted is the one a server would compute.
  digestStringAsync: async (_algorithm: string, text: string) => jest.requireActual("node:crypto").createHash("sha256").update(text).digest("base64"),
}));

describe("PKCE for the SSO hand-off", () => {
  it("keeps a 43-character verifier and returns its S256 challenge, both in the URL-safe alphabet with no padding", async () => {
    const store = memoryStore();
    __setKeyStore(store);
    // Bytes chosen to produce +, / and = in plain base64, the three that must not reach a URL.
    mockBytes = Uint8Array.from({ length: 32 }, (_, i) => (i % 2 === 0 ? 0xfb : 0xff));
    const challenge = await beginHandoff();
    const verifier = await store.get(KEYS.ssoVerifier);
    expect(verifier).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(challenge).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(challenge).toBe(createHash("sha256").update(verifier!).digest("base64url"));
    // The verifier is the bytes, not a constant: other bytes, another verifier.
    mockBytes = Uint8Array.from({ length: 32 }, (_, i) => i);
    await beginHandoff();
    expect(await store.get(KEYS.ssoVerifier)).not.toBe(verifier);
    expect(await store.get(KEYS.ssoVerifier)).toBe(Buffer.from(mockBytes).toString("base64url"));
  });

  it("hands the verifier over once", async () => {
    __setKeyStore(memoryStore({ [KEYS.ssoVerifier]: "kept" }));
    expect(await takeVerifier()).toBe("kept");
    expect(await takeVerifier()).toBeNull();
  });

  it("sends the challenge on the start link, and never the verifier", async () => {
    const store = memoryStore();
    __setKeyStore(store);
    const challenge = await beginHandoff();
    const url = handoffUrl("https://relay.example", "google", challenge);
    expect(url).toBe(`https://relay.example/api/sso/google/start?client=app&challenge=${challenge}`);
    expect(url).not.toContain((await store.get(KEYS.ssoVerifier))!);
  });
});
