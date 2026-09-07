import { createApiClient, type ApiClient } from "@edulink/api-client";
import { KEYS, keyStore } from "./storage";

/**
 * One client for the whole app. The base URL comes from the build
 * (EXPO_PUBLIC_API_URL); the token from secure storage on every call, so a
 * sign-out is complete the moment the key is gone. The language header is
 * whatever the i18n provider last set, so refusals come back readable.
 */
let locale = "en";
export function setApiLocale(next: string): void {
  locale = next;
}

export const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/+$/, "");

let client: ApiClient | null = null;
export function api(): ApiClient {
  if (!client) {
    client = createApiClient({
      baseUrl: API_BASE,
      getToken: () => keyStore().get(KEYS.token),
      getLocale: () => locale,
    });
  }
  return client;
}

/** Tests replace the client with one over a fake fetch. */
export function __setApiClient(next: ApiClient | null): void {
  client = next;
}

/** A refusal the screen can show: the envelope's sentence, or a fallback. */
export function errorText(result: { ok: false; error: string }, fallback: string): string {
  return result.error?.trim() ? result.error : fallback;
}
