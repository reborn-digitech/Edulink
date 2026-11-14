/**
 * Push to phones and browsers (testing analysis of 13 November 2026, communication).
 *
 * TA-250 (Medium, Performance): the Expo call had no time limit, and every notice waits for it inside the request that
 * caused it, so a push service that took the connection and never answered held register saves and broadcasts open.
 * TA-510 (Low): a rate limit, a refused request, a timeout or a network fault was counted against every device in the
 * batch, so a burst at a peak could retire healthy phones and browsers.
 *
 * One ZZ person of this suite's own with a phone token and a browser subscription, removed afterwards; Expo's endpoint
 * is an injected fetch and Web Push's library is stood in for.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { sendExpoPush } from "@/lib/expo-push";

/** The limit the finding asks for, as Web Push has it (notify.ts PUSH_SEND_TIMEOUT_MS). */
const LIMIT_MS = 10_000;

const sendNotification = vi.fn();
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: () => {},
    sendNotification: (...args: unknown[]) => sendNotification(...args),
  },
}));

const db = new PrismaClient();
const STAMP = Date.now();
let userId = "";
const token = `ExponentPushToken[zz-tacomm-${STAMP}]`;

beforeAll(async () => {
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "BKQNxEMs_lat-ElQkXtmpfQ5AZc9P0Ay8OkMNbMfKViOHOmcnYv2nFYGXf0vaRRz6XXyCvWJHMIFqydxqCHJn_M";
  process.env.VAPID_PRIVATE_KEY = "K-K-Hv9Sd51taFimuH_c9likC2Ks-Y4-c6S6S5Szh9I";
  userId = (await db.user.create({ data: { name: "ZZ TA Comm Push", email: `zz-tacomm-push-${STAMP}@test.invalid`, prefs: "{}" }, select: { id: true } })).id;
});

beforeEach(async () => {
  sendNotification.mockReset();
  await db.deviceToken.deleteMany({ where: { userId } });
  await db.pushSubscription.deleteMany({ where: { userId } });
  await db.deviceToken.create({ data: { userId, expoPushToken: token, platform: "android" } });
});

afterAll(async () => {
  await db.deviceToken.deleteMany({ where: { userId } });
  await db.pushSubscription.deleteMany({ where: { userId } });
  await db.user.deleteMany({ where: { id: userId } });
  await db.$disconnect();
});

const failures = async () => (await db.deviceToken.findUnique({ where: { expoPushToken: token }, select: { failureCount: true } }))?.failureCount ?? null;

describe("TA-250: Expo push has a time limit", () => {
  it(
    "TA-250: a push service that takes the connection and never answers is given up within the limit",
    async () => {
      // Answers only by failing when the caller's signal aborts; with no signal, never.
      const hanging = ((_url: string | URL | Request, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal;
          if (!signal) return;
          signal.addEventListener("abort", () => reject(signal.reason ?? new Error("aborted")));
        })) as typeof fetch;
      const started = Date.now();
      const result = await sendExpoPush(userId, { title: "ZZ", body: "ZZ hang" }, hanging);
      expect(result).toMatchObject({ delivered: 0, failed: 1, retired: 0 });
      expect(Date.now() - started).toBeLessThan(LIMIT_MS + 3_000);
      // A timeout says nothing about the phone (TA-510).
      expect(await failures()).toBe(0);
    },
    LIMIT_MS + 15_000,
  );
});

describe("TA-510: only the device's own errors count against it", () => {
  it("TA-510: Expo answering 429, a refused request, a thrown fetch or MessageRateExceeded leaves the phone's token as it was", async () => {
    const answers: (() => Promise<Response>)[] = [
      async () => new Response("rate limited", { status: 429 }),
      async () => new Response("bad gateway", { status: 502 }),
      async () => {
        throw new TypeError("fetch failed");
      },
      async () => new Response(JSON.stringify({ data: [{ status: "error", details: { error: "MessageRateExceeded" } }] }), { status: 200 }),
    ];
    for (let round = 0; round < 6; round++) {
      for (const answer of answers) {
        const result = await sendExpoPush(userId, { title: "ZZ", body: "ZZ peak" }, (async () => answer()) as typeof fetch);
        expect(result).toMatchObject({ delivered: 0, failed: 1, retired: 0 });
      }
    }
    expect(await failures()).toBe(0);
    // The device's own word still retires it at once.
    const gone = (async () => new Response(JSON.stringify({ data: [{ status: "error", details: { error: "DeviceNotRegistered" } }] }), { status: 200 })) as typeof fetch;
    expect(await sendExpoPush(userId, { title: "ZZ", body: "ZZ gone" }, gone)).toMatchObject({ retired: 1 });
    expect(await failures()).toBeNull();
  });

  it("TA-510: a browser's push service answering 429, 503 or nothing at all eight times keeps the subscription uncounted", async () => {
    // Under a live sign-in (TA-041: a registration is sent to only while its sign-in lives); it goes with the person afterwards.
    const signIn = await db.session.create({ data: { userId, tokenHash: `zz-tacomm-push-${STAMP}`, userAgent: "zz-walk", expiresAt: new Date(Date.now() + 3_600_000) }, select: { id: true } });
    await db.pushSubscription.create({ data: { userId, sessionId: signIn.id, endpoint: `https://fcm.googleapis.com/fcm/send/zz-tacomm-${STAMP}`, p256dh: "p", auth: "a" } });
    const { sendPush } = await import("@/lib/notify");
    const errors = [Object.assign(new Error("Too many"), { statusCode: 429 }), Object.assign(new Error("Unavailable"), { statusCode: 503 }), new Error("socket hang up")];
    for (let i = 0; i < 9; i++) {
      sendNotification.mockRejectedValueOnce(errors[i % errors.length]);
      expect(await sendPush(userId, { title: "t", body: "b", url: "/" })).toEqual({ delivered: 0, failed: 1, retired: 0, skipped: false });
    }
    expect(await db.pushSubscription.findFirst({ where: { userId }, select: { failureCount: true } })).toEqual({ failureCount: 0 });
    // A refusal about the subscription itself still counts.
    sendNotification.mockRejectedValueOnce(Object.assign(new Error("Bad request"), { statusCode: 400 }));
    await sendPush(userId, { title: "t", body: "b", url: "/" });
    expect(await db.pushSubscription.findFirst({ where: { userId }, select: { failureCount: true } })).toEqual({ failureCount: 1 });
  });
});
