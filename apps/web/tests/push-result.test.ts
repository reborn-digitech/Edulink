import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";

/**
 * What a push send REPORTS.
 *
 * ⚠ THIS EXISTS BECAUSE THE TOOL LIED. `npm run push:test` used to say "sent
 * to N devices" by counting the subscriptions still present after a send —
 * but only 404/410 retires a subscription, so a send that reached nothing at
 * all left every row in place and was reported as success. A tool whose whole
 * purpose is to stop a deployment believing it sends notifications when it
 * does not must not itself say "sent" for a failure, so the counts now come
 * from the send rather than from the table.
 */

const db = new PrismaClient();
const EMAIL = "zz.pushresult@zz.test";
let userId: string;

const sendNotification = vi.fn();
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: () => {},
    sendNotification: (...args: unknown[]) => sendNotification(...args),
  },
}));

beforeEach(async () => {
  sendNotification.mockReset();
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "BKQNxEMs_lat-ElQkXtmpfQ5AZc9P0Ay8OkMNbMfKViOHOmcnYv2nFYGXf0vaRRz6XXyCvWJHMIFqydxqCHJn_M";
  process.env.VAPID_PRIVATE_KEY = "K-K-Hv9Sd51taFimuH_c9likC2Ks-Y4-c6S6S5Szh9I";
  const user = await db.user.upsert({
    where: { email: EMAIL },
    create: { email: EMAIL, name: "ZZ Push Result", prefs: "{}" },
    update: {},
    select: { id: true },
  });
  userId = user.id;
  await db.pushSubscription.deleteMany({ where: { userId } });
});

afterEach(async () => {
  await db.pushSubscription.deleteMany({ where: { userId } });
  await db.user.deleteMany({ where: { email: EMAIL } });
});

async function addEndpoint(suffix: string) {
  // An allow-listed host: the send retires any stored endpoint off the push
  // services list before trying it (tests/push-endpoint.test.ts). And under a
  // live sign-in: a registration is sent to only while the sign-in that turned
  // notices on lives (TA-041). The sign-in goes with the person afterwards.
  const signIn = await db.session.create({ data: { userId, tokenHash: `zz-push-result-${suffix}-${Date.now()}`, userAgent: "zz-walk", expiresAt: new Date(Date.now() + 3_600_000) }, select: { id: true } });
  await db.pushSubscription.create({
    data: { userId, sessionId: signIn.id, endpoint: `https://fcm.googleapis.com/fcm/send/${suffix}`, p256dh: "p" + suffix, auth: "a" + suffix },
  });
}

describe("sendPush reports what happened", () => {
  it("counts a delivered endpoint", async () => {
    await addEndpoint("ok");
    sendNotification.mockResolvedValue({ statusCode: 201 });
    const { sendPush } = await import("@/lib/notify");
    expect(await sendPush(userId, { title: "t", body: "b", url: "/" })).toEqual({
      delivered: 1, failed: 0, retired: 0, skipped: false,
    });
  });

  it("⚠ a transient failure is NOT success — the subscription survives but nothing was delivered", async () => {
    await addEndpoint("down");
    sendNotification.mockRejectedValue(Object.assign(new Error("read ECONNRESET"), {}));
    const { sendPush } = await import("@/lib/notify");
    const result = await sendPush(userId, { title: "t", body: "b", url: "/" });
    expect(result).toEqual({ delivered: 0, failed: 1, retired: 0, skipped: false });
    // The row is deliberately kept for a later try — which is exactly why
    // counting rows afterwards reported a total failure as a success.
    expect(await db.pushSubscription.count({ where: { userId } })).toBe(1);
  });

  it("a 410 retires the endpoint and is reported as retired, not failed", async () => {
    await addEndpoint("gone");
    sendNotification.mockRejectedValue(Object.assign(new Error("gone"), { statusCode: 410 }));
    const { sendPush } = await import("@/lib/notify");
    expect(await sendPush(userId, { title: "t", body: "b", url: "/" })).toEqual({
      delivered: 0, failed: 0, retired: 1, skipped: false,
    });
    expect(await db.pushSubscription.count({ where: { userId } })).toBe(0);
  });

  it("⚠ says it skipped when VAPID is unusable, rather than reporting zero of nothing", async () => {
    await addEndpoint("unused");
    delete process.env.VAPID_PRIVATE_KEY;
    vi.resetModules();
    const { sendPush } = await import("@/lib/notify");
    const result = await sendPush(userId, { title: "t", body: "b", url: "/" });
    expect(result.skipped).toBe(true);
    expect(sendNotification).not.toHaveBeenCalled();
  });
});
