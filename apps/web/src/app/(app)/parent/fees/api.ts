import type { z } from "zod";
import type { familyCheckoutSchema, familyPaymentStatusSchema, familyUpiStartSchema } from "@edulink/contracts";

/**
 * The family's two ways to pay call /api/v1/fees/family/* from the browser
 * — the same routes the phone app uses — on the cookie session. Every route
 * answers the contract's shape or `{ error, code }`; this turns the latter
 * into a thrown error whose message is already in the reader's language.
 */
export type Checkout = z.infer<typeof familyCheckoutSchema>;
export type UpiStart = z.infer<typeof familyUpiStartSchema>;
export type PaymentStatus = z.infer<typeof familyPaymentStatusSchema>;

export class FeesApiError extends Error {
  constructor(
    message: string | null,
    readonly status: number,
  ) {
    super(message ?? `HTTP ${status}`);
    this.name = "FeesApiError";
    this.translated = message !== null;
  }
  /** Whether `message` came from the server, in the reader's language, or is a bare status. */
  readonly translated: boolean;
}

export async function feesApi<T>(path: string, init: { method?: "GET" | "POST"; body?: unknown } = {}): Promise<T> {
  const response = await fetch(path, {
    method: init.method ?? "GET",
    credentials: "include",
    headers: { accept: "application/json", ...(init.body !== undefined ? { "content-type": "application/json" } : {}) },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const json = (await response.json().catch(() => null)) as { error?: unknown } | null;
  if (!response.ok) throw new FeesApiError(typeof json?.error === "string" ? json.error : null, response.status);
  return json as T;
}

/** The message to show for any failure: the server's sentence when it gave one, else the caller's fallback. */
export function feesErrorMessage(error: unknown, fallback: string): string {
  return error instanceof FeesApiError && error.translated ? error.message : fallback;
}

export const POLL_EVERY_MS = 2_000;
export const POLL_FOR_MS = 60_000;

/**
 * Asks after one payment every two seconds until it is PAID, FAILED or
 * UNALLOCATED (captured with nothing due, QA-03), or a
 * minute has passed. `signal` stops it when the component goes away.
 */
export async function pollPayment(paymentId: string, signal: AbortSignal, onTick?: (status: PaymentStatus) => void): Promise<PaymentStatus | null> {
  const until = Date.now() + POLL_FOR_MS;
  while (!signal.aborted && Date.now() < until) {
    try {
      const status = await feesApi<PaymentStatus>(`/api/v1/fees/family/payments/${encodeURIComponent(paymentId)}`);
      onTick?.(status);
      if (status.status === "PAID" || status.status === "FAILED" || status.status === "UNALLOCATED") return status;
    } catch {
      // A blip between polls is not a failed payment; the next tick asks again.
    }
    await new Promise<void>((resolve) => {
      const timer = setTimeout(resolve, POLL_EVERY_MS);
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
    });
  }
  return null;
}
