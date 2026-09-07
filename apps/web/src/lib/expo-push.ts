import "server-only";
import { db } from "./db";

/**
 * Push to phones through Expo's push service, beside Web Push.
 *
 * One HTTPS call per batch of up to 100 tickets; no SDK, the way the SMS
 * transport talks to Twilio. EXPO_ACCESS_TOKEN is optional (it raises the
 * rate ceiling and lets Expo attribute the traffic); without it the service
 * still accepts a well-formed ExponentPushToken.
 *
 * A "DeviceNotRegistered" answer retires the token at once — the app was
 * uninstalled or the token rotated — and any other error counts against it;
 * five in a row retire it too, the same policy Web Push subscriptions have.
 * `fetch` is injectable so the suite can prove all of that without a phone.
 */
export type ExpoPushMessage = { title: string; body: string; data?: Record<string, unknown> };
export type ExpoPushResult = { delivered: number; failed: number; retired: number; skipped: boolean };

const ENDPOINT = "https://exp.host/--/api/v2/push/send";
const MAX_FAILURES = 5;

export async function sendExpoPush(
  userId: string,
  message: ExpoPushMessage,
  fetchImpl: typeof fetch = fetch,
): Promise<ExpoPushResult> {
  const tokens = await db.deviceToken.findMany({ where: { userId }, select: { id: true, expoPushToken: true, failureCount: true } });
  const result: ExpoPushResult = { delivered: 0, failed: 0, retired: 0, skipped: false };
  if (tokens.length === 0) return result;

  const headers: Record<string, string> = { "content-type": "application/json", accept: "application/json" };
  const accessToken = process.env.EXPO_ACCESS_TOKEN?.trim();
  if (accessToken) headers.authorization = `Bearer ${accessToken}`;

  for (let i = 0; i < tokens.length; i += 100) {
    const batch = tokens.slice(i, i + 100);
    let tickets: { status: string; details?: { error?: string } }[] = [];
    try {
      const res = await fetchImpl(ENDPOINT, {
        method: "POST",
        headers,
        body: JSON.stringify(batch.map((t) => ({ to: t.expoPushToken, title: message.title, body: message.body, data: message.data ?? {}, sound: "default" }))),
      });
      const json = (await res.json().catch(() => null)) as { data?: typeof tickets } | null;
      tickets = res.ok && json?.data ? json.data : batch.map(() => ({ status: "error", details: { error: `HTTP ${res.status}` } }));
    } catch (error) {
      tickets = batch.map(() => ({ status: "error", details: { error: error instanceof Error ? error.message : "network" } }));
    }
    await Promise.all(
      batch.map(async (token, j) => {
        const ticket = tickets[j];
        if (ticket?.status === "ok") {
          result.delivered++;
          await db.deviceToken.update({ where: { id: token.id }, data: { failureCount: 0, lastUsedAt: new Date() } }).catch(() => {});
          return;
        }
        result.failed++;
        const dead = ticket?.details?.error === "DeviceNotRegistered" || token.failureCount + 1 >= MAX_FAILURES;
        if (dead) {
          result.retired++;
          await db.deviceToken.delete({ where: { id: token.id } }).catch(() => {});
        } else {
          await db.deviceToken.update({ where: { id: token.id }, data: { failureCount: { increment: 1 } } }).catch(() => {});
        }
      }),
    );
  }
  return result;
}
