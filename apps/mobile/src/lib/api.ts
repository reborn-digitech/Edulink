import { Platform } from "react-native";
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
/** The language the app last set, for a request that does not go through the client (a PDF download). */
export function apiLocale(): string {
  return locale;
}

export const API_BASE = (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000").replace(/\/+$/, "");

// A release build talks to the API over TLS or not at all: a plain-http base
// in a production bundle is a misconfiguration, and the app refuses to start
// rather than send a session token in the clear. Development and the tests
// (where __DEV__ is true) may point anywhere. A release export of the WEB
// target may point at the loopback, which never leaves the machine — that is
// how the CI sweep exports the web target against its own API. A release for
// a PHONE may not: a phone's loopback is the phone, so a store build or an
// over-the-air update made without EXPO_PUBLIC_API_URL (the fallback above)
// would ship an app that reaches nothing. It refuses to start instead.
const LOOPBACK = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/;
if (!__DEV__ && !API_BASE.startsWith("https://")) {
  if (!LOOPBACK.test(API_BASE)) {
    throw new Error(`EXPO_PUBLIC_API_URL must be https:// in a release build (got ${API_BASE})`);
  }
  if (Platform.OS !== "web") {
    throw new Error(`EXPO_PUBLIC_API_URL must be https:// in a release build for a phone: ${API_BASE} is the phone itself — was the build or update made without EXPO_PUBLIC_API_URL?`);
  }
}

/**
 * The bearer for a request the client cannot make itself (a PDF's bytes).
 * The one door to the token outside the client, so the security test's list
 * of readers stays short.
 */
export function sessionToken(): Promise<string | null> {
  return keyStore().get(KEYS.token);
}

/**
 * What the session does when a request that carried the bearer is answered 401 (TA-145, 13 Nov 2026): it confirms with
 * /api/v1/me and, if the session has ended on the server, leaves the phone as a 401 there always left it. Every client
 * that sends the bearer (this one, the outbox's replay client, the events stream) reports a 401 here.
 */
let unauthorized: (() => void) | null = null;
export function onSessionEndedOnServer(handler: (() => void) | null): void {
  unauthorized = handler;
}
export function sessionEndedOnServer(): void {
  unauthorized?.();
}

let client: ApiClient | null = null;
export function api(): ApiClient {
  if (!client) {
    client = createApiClient({
      baseUrl: API_BASE,
      getToken: () => keyStore().get(KEYS.token),
      getLocale: () => locale,
      onUnauthorized: sessionEndedOnServer,
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
