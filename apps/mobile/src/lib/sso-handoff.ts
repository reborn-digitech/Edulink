import * as Crypto from "expo-crypto";
import { keyStore, KEYS } from "./storage";

/**
 * PKCE for the SSO hand-off (RFC 7636, S256).
 *
 * The one-time code comes back to the app on a deep link, and a deep link is
 * not private: another app may have registered the same scheme and be handed
 * it. So before the browser opens, the app makes a secret — the verifier —
 * keeps it in the device's key store, and sends only its SHA-256, the
 * challenge. The server fixes the code to that challenge and spends it only
 * for whoever shows the verifier, which has never left this app.
 *
 * expo-crypto is safe to import where the web target renders on the server:
 * it reaches for the platform's crypto inside its functions, not at import.
 * The static export is what proves that, and it is run before a release.
 */
const base64url = (base64: string) => base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function toBase64(bytes: Uint8Array): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]!;
    const b = bytes[i + 1];
    const c = bytes[i + 2];
    out += alphabet[a >> 2]! + alphabet[((a & 3) << 4) | ((b ?? 0) >> 4)]!;
    out += b === undefined ? "=" : alphabet[((b & 15) << 2) | ((c ?? 0) >> 6)]!;
    out += c === undefined ? "=" : alphabet[c & 63]!;
  }
  return out;
}

/** A fresh verifier, kept; its challenge, returned for the start URL. */
export async function beginHandoff(): Promise<string> {
  // Thirty-two random bytes are forty-three characters: the shortest verifier the RFC allows, at full strength.
  const verifier = base64url(toBase64(await Crypto.getRandomBytesAsync(32)));
  await keyStore().set(KEYS.ssoVerifier, verifier);
  return base64url(await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, verifier, { encoding: Crypto.CryptoEncoding.BASE64 }));
}

/** The verifier of the hand-off in flight, once: it is removed as it is read. Null when this app began none. */
export async function takeVerifier(): Promise<string | null> {
  const store = keyStore();
  const verifier = await store.get(KEYS.ssoVerifier);
  if (verifier) await store.remove(KEYS.ssoVerifier);
  return verifier || null;
}

/** Where the system browser is sent: the provider's start, saying it is the app and whose challenge this is. */
export function handoffUrl(apiBase: string, provider: "google" | "microsoft" | "apple", challenge: string): string {
  return `${apiBase}/api/sso/${provider}/start?client=app&challenge=${encodeURIComponent(challenge)}`;
}
