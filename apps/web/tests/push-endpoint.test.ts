import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { isPushServiceEndpoint, pushSubscribeSchema } from "@/lib/validation";
import type { ActiveContext } from "@/lib/session";

/**
 * A push endpoint is a URL the client chooses and the server later POSTs to.
 *
 * That is a server-side request forgery unless the host is pinned, so the
 * subscription route accepts https on a known push service and nothing else
 * — 422 for a loopback address, 422 for an arbitrary https host, 200 for
 * FCM — and the send itself refuses to call anything else even if a row got
 * in by another door, and gives the socket ten seconds rather than forever.
 */

const db = new PrismaClient();
const EMAIL = "zz.pushendpoint@zzpush.test";
let userId: string;
let session: ActiveContext;

const sendNotification = vi.fn();
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: () => {},
    sendNotification: (...args: unknown[]) => sendNotification(...args),
  },
}));
vi.mock("@/lib/session", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/session")>()),
  getSession: async () => session,
}));

const KEYS = { p256dh: "p256dh-key-value", auth: "auth-key-value" };
const FCM = "https://fcm.googleapis.com/fcm/send/zz-push-endpoint-test";

beforeAll(async () => {
  await db.user.deleteMany({ where: { email: EMAIL } });
  userId = (await db.user.create({ data: { email: EMAIL, name: "ZZ Push", prefs: "{}" }, select: { id: true } })).id;
  session = {
    sessionId: "test-session",
    membershipId: null,
    schoolId: null,
    role: null,
    user: {
      id: userId,
      name: "ZZ Push",
      preferredName: null,
      email: EMAIL,
      avatarKey: null,
      isMinor: false,
      isSuperuser: false,
      isAppAdmin: false,
      prefs: {
        theme: "system",
        contrast: "normal",
        font: "default",
        motion: "full",
        locale: "en",
        channels: { push: true, email: false },
        quietHours: null,
      },
    },
  };
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "BKQNxEMs_lat-ElQkXtmpfQ5AZc9P0Ay8OkMNbMfKViOHOmcnYv2nFYGXf0vaRRz6XXyCvWJHMIFqydxqCHJn_M";
  process.env.VAPID_PRIVATE_KEY = "K-K-Hv9Sd51taFimuH_c9likC2Ks-Y4-c6S6S5Szh9I";
});

afterEach(async () => {
  sendNotification.mockReset();
  await db.pushSubscription.deleteMany({ where: { userId } });
});

afterAll(async () => {
  await db.auditLog.deleteMany({ where: { actorUserId: userId, action: "push.subscribe" } });
  await db.user.deleteMany({ where: { email: EMAIL } });
  await db.$disconnect();
});

describe("the allow-list", () => {
  it.each([
    "https://fcm.googleapis.com/fcm/send/abc",
    "https://android.googleapis.com/gcm/send/abc",
    "https://updates.push.services.mozilla.com/wpush/v2/abc",
    "https://a1b2.push.services.mozilla.com/wpush/v2/abc",
    "https://db5p.notify.windows.com/w/?token=abc",
    "https://web.push.apple.com/QAbc",
    "https://region.push.apple.com/QAbc",
  ])("accepts %s", (endpoint) => {
    expect(isPushServiceEndpoint(endpoint)).toBe(true);
  });

  it.each([
    "http://127.0.0.1:3999/",
    "http://fcm.googleapis.com/fcm/send/abc",
    "https://evil.example/",
    "https://evil-push.services.mozilla.com.attacker.example/",
    "https://fcm.googleapis.com@evil.example/",
    "https://notfcm.googleapis.com/",
    "https://localhost/",
    "not a url",
  ])("refuses %s", (endpoint) => {
    expect(isPushServiceEndpoint(endpoint)).toBe(false);
    expect(pushSubscribeSchema.safeParse({ endpoint, keys: KEYS }).success).toBe(false);
  });
});

describe("POST /api/push", () => {
  const post = async (endpoint: string) => {
    const { POST } = await import("@/app/api/push/route");
    return POST(new Request("http://localhost/api/push", { method: "POST", body: JSON.stringify({ endpoint, keys: KEYS }) }));
  };

  it("⚠ is 422 for a loopback address and for an arbitrary https host, and stores nothing", async () => {
    expect((await post("http://127.0.0.1:3999/")).status).toBe(422);
    expect((await post("https://evil.example/")).status).toBe(422);
    expect(await db.pushSubscription.count({ where: { userId } })).toBe(0);
  });

  it("accepts an FCM endpoint", async () => {
    expect((await post(FCM)).status).toBe(200);
    expect(await db.pushSubscription.count({ where: { userId, endpoint: FCM } })).toBe(1);
  });
});

describe("the send", () => {
  it("⚠ gives the push service ten seconds", async () => {
    await db.pushSubscription.create({ data: { userId, endpoint: FCM, p256dh: "p", auth: "a" } });
    sendNotification.mockResolvedValue({ statusCode: 201 });
    const { sendPush, PUSH_SEND_TIMEOUT_MS } = await import("@/lib/notify");
    const result = await sendPush(userId, { title: "t", body: "b", url: "/" });
    expect(result.delivered).toBe(1);
    expect(PUSH_SEND_TIMEOUT_MS).toBe(10_000);
    expect(sendNotification).toHaveBeenCalledTimes(1);
    expect(sendNotification.mock.calls[0]![2]).toMatchObject({ timeout: 10_000 });
  });

  it("⚠ never calls a stored endpoint off the list; it retires the row instead", async () => {
    await db.pushSubscription.create({ data: { userId, endpoint: "https://push.example/left-over", p256dh: "p", auth: "a" } });
    const { sendPush } = await import("@/lib/notify");
    const result = await sendPush(userId, { title: "t", body: "b", url: "/" });
    expect(sendNotification).not.toHaveBeenCalled();
    expect(result).toEqual({ delivered: 0, failed: 0, retired: 1, skipped: false });
    expect(await db.pushSubscription.count({ where: { userId } })).toBe(0);
  });

  it("⚠ in production a loopback endpoint is off the list too; outside it the delivery suite's local server is reachable", async () => {
    const { isSendableEndpoint } = await import("@/lib/notify");
    const env = process.env as Record<string, string | undefined>;
    const was = env.NODE_ENV;
    try {
      env.NODE_ENV = "production";
      expect(isSendableEndpoint("https://127.0.0.1:3999/zz-push")).toBe(false);
      expect(isSendableEndpoint("https://localhost/zz-push")).toBe(false);
      expect(isSendableEndpoint(FCM)).toBe(true);
      env.NODE_ENV = "test";
      expect(isSendableEndpoint("https://127.0.0.1:3999/zz-push")).toBe(true);
      expect(isSendableEndpoint("https://evil.example/")).toBe(false);
      expect(isSendableEndpoint("https://127.0.0.1.attacker.example/")).toBe(false);
    } finally {
      env.NODE_ENV = was;
    }
  });
});
