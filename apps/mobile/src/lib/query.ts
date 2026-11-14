import { AppState, Platform } from "react-native";
import { focusManager, onlineManager, QueryClient } from "@tanstack/react-query";
import * as Network from "expo-network";
import type { FeatureCode, PlanCode } from "@edulink/contracts";

/**
 * Server state lives in React Query. Five minutes fresh: a register or a
 * feed re-fetches on focus, not on every render; a 401 is never retried
 * (the session provider signs the person out instead); a refusal the server
 * meant (any other 4xx but 408 and 429: not found, not yours, invalid) is not
 * retried either, because asking again gets the same answer and the screen
 * sat on its skeleton through the retry's wait (A3-states-14); a network
 * failure or a 5xx gets one retry, because a phone's network flickers.
 */
export function shouldRetry(count: number, error: unknown): boolean {
  if (error instanceof ApiRefused && isFinalRefusal(error.status)) return false;
  // An answer the screen's schema cannot read reads the same way again (TA-359).
  if (isUnreadableAnswer(error)) return false;
  return count < 1;
}

/**
 * The server's answer did not parse with the screen's schema (TA-359, 13 Nov 2026): a zod error thrown in the query
 * function, typically an older build meeting a newer server (a new agenda kind). Its message is zod's JSON issue
 * list, which is no sentence for a person; the screen says the app may need updating instead, and does not retry.
 * Told apart by its shape, so a copy of zod in another package is recognised too.
 */
export function isUnreadableAnswer(error: unknown): boolean {
  return error instanceof Error && error.name === "ZodError" && Array.isArray((error as { issues?: unknown }).issues);
}

let phoneWired = false;
/**
 * React Query's focus and network signals on a phone (TA-164, TA-251, 13 Nov 2026). Its own listeners are the
 * browser's (visibilitychange, online), which a phone never fires, so a screen opened on Monday still showed Monday's
 * answer on Tuesday, and the outbox did not send when the signal came back with the app open. Here the app's return
 * to the front is focus, so a stale query on screen is read again, and expo-network's state is online, so the outbox
 * runner's onlineManager subscription flushes on reconnect. The web target keeps the browser's. Once per launch.
 */
export function wirePhoneSignals(): void {
  if (phoneWired || Platform.OS === "web") return;
  phoneWired = true;
  focusManager.setEventListener((handleFocus) => {
    const sub = AppState.addEventListener("change", (state) => handleFocus(state === "active"));
    return () => sub.remove();
  });
  onlineManager.setEventListener((setOnline) => {
    const sub = Network.addNetworkStateListener((state) => setOnline(state.isConnected !== false && state.isInternetReachable !== false));
    return () => sub.remove();
  });
}

/** A 4xx that asking again cannot change (401 included; 408 and 429 are worth one more try). */
export function isFinalRefusal(status: number): boolean {
  return status >= 400 && status < 500 && status !== 408 && status !== 429;
}

/** Not found, not yours or gone: the screen has nothing to show and a retry cannot help. */
export function isNotFound(error: unknown): boolean {
  return error instanceof ApiRefused && (error.status === 403 || error.status === 404 || error.status === 410);
}

export function makeQueryClient(): QueryClient {
  wirePhoneSignals();
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60_000,
        gcTime: 30 * 60_000,
        retry: shouldRetry,
        refetchOnWindowFocus: true,
        // Try once even when the browser says it is offline (the web target's
        // navigator.onLine; a phone's expo-network state since TA-251): a cached screen
        // shows its data and the one attempt fails fast into the outbox rule.
        networkMode: "offlineFirst",
      },
      // A mutation must always run: the outbox is what handles "offline", and
      // React Query's default of pausing the mutation until the browser is
      // back online would skip the outbox and post directly on reconnect.
      mutations: { networkMode: "always" },
    },
  });
}

/** What a 402 PLAN_REQUIRED names: the plan that opens the door and the feature it belongs to (QA-18). */
export type PlanLockInfo = { plan: PlanCode; feature?: FeatureCode };

/** Thrown by query functions so screens can show the envelope's sentence. */
export class ApiRefused extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    /** With PLAN_REQUIRED: the plan and the feature, so `Failed` draws the plan card in place of an error (QA-18). */
    public readonly planLock?: PlanLockInfo,
  ) {
    super(message);
    this.name = "ApiRefused";
  }
}

/**
 * A door whose feature is on but needs a plan this person does not hold: the plan and feature it names, or null.
 * Asking again cannot change it, so the screen shows what the plan is and how to subscribe (QA-18), as the web's
 * featurePageLock does, rather than a red error with a retry.
 */
export function planLockOf(error: unknown): PlanLockInfo | null {
  return error instanceof ApiRefused && error.code === "PLAN_REQUIRED" && error.planLock ? error.planLock : null;
}

/** Unwraps an ApiResult into data or an ApiRefused, for use inside queryFn/mutationFn. */
export function unwrap<T>(result: { ok: true; data: T } | { ok: false; status: number; error: string; code?: string; plan?: PlanCode; feature?: FeatureCode }): T {
  if (result.ok) return result.data;
  throw new ApiRefused(result.status, result.error, result.code, result.code === "PLAN_REQUIRED" && result.plan ? { plan: result.plan, ...(result.feature ? { feature: result.feature } : {}) } : undefined);
}
