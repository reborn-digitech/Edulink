/**
 * TA-041, the testing analysis of 13 November 2026, as decided on 14 November 2026: a browser's notices belong
 * to the sign-in that turned them on.
 *
 * Before, a browser's push registration named only the person. Pressing Sign out, signing that browser out from
 * the phone, or the sign-in running out after its thirty days left the registration live, and the browser went on
 * showing "Aarav was marked absent" to whoever sat at a shared computer. The column that names the sign-in is the
 * migration's (tests/ta-migration-push-session.test.ts); these cases pin the code that uses it:
 *
 *   * turning notices on records the sign-in; ending it here (Sign out) or from another device removes the
 *     registration, and a registration whose sign-in has ended, run out, or that has no link is not sent to and
 *     not deleted;
 *   * the same person's browser links itself again on their next signed-in visit; another person's never does,
 *     and the first person's notices stop reaching a browser that now carries somebody else's sign-in;
 *   * the settings switch answers for this sign-in;
 *   * every one of the ten sign-out forms switches the browser's notices off before it posts;
 *   * one sentence in three languages says so, and decision 0002 names the registration and the fixed 30 days.
 *
 * ZZ people of this suite's own, with no school, made through the owner connection and removed by id.
 */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { createSession, destroySession, revokeSession } from "@/lib/session";
import { SESSION_COOKIE } from "@/lib/constants";
import { en } from "@/lib/i18n/en";
import { hi } from "@/lib/i18n/hi";
import { mr } from "@/lib/i18n/mr";
import { actionKey } from "@/lib/safety-labels";
import * as pushRoute from "@/app/api/push/route";
import { __resetCookies, cookies } from "../tests/stubs/next-headers";

const sendNotification = vi.fn();
vi.mock("web-push", () => ({
  default: {
    setVapidDetails: () => {},
    sendNotification: (...args: unknown[]) => sendNotification(...args),
  },
}));

const db = new PrismaClient();
const STAMP = Date.now();
const KEYS = { p256dh: "zz-p256dh-key-value", auth: "zz-auth-key-value" };
const endpoint = (which: string) => `https://fcm.googleapis.com/fcm/send/zz-ta041-${STAMP}-${which}`;
const ids = { a: "", b: "" };

/** A fresh sign-in for the person, as the login does it: its cookie is left in the jar, so the doors below are asked by that browser. */
async function signIn(userId: string): Promise<{ id: string }> {
  __resetCookies();
  const id = await createSession(userId);
  expect((await cookies()).get(SESSION_COOKIE)?.value).toBeTruthy();
  return { id };
}
const turnOn = (which: string) => pushRoute.POST(new Request("http://localhost/api/push", { method: "POST", body: JSON.stringify({ endpoint: endpoint(which), keys: KEYS }) }));
const relink = (which: string) => pushRoute.PATCH(new Request("http://localhost/api/push", { method: "PATCH", body: JSON.stringify({ endpoint: endpoint(which) }) }));
const ask = (which: string) => pushRoute.GET(new Request(`http://localhost/api/push?endpoint=${encodeURIComponent(endpoint(which))}`));
const row = (which: string) => db.pushSubscription.findUnique({ where: { endpoint: endpoint(which) }, select: { userId: true, sessionId: true } });
const sentTo = () => sendNotification.mock.calls.map((call) => (call[0] as { endpoint: string }).endpoint).sort();
const send = async (userId: string) => (await import("@/lib/notify")).sendPush(userId, { title: "t", body: "b", url: "/" });

beforeAll(async () => {
  const mk = (who: string) => db.user.create({ data: { name: `ZZ TA041 ${who}`, email: `zz-ta041-${who.toLowerCase()}-${STAMP}@test.invalid`, prefs: "{}" }, select: { id: true } });
  ids.a = (await mk("A")).id;
  ids.b = (await mk("B")).id;
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = "BKQNxEMs_lat-ElQkXtmpfQ5AZc9P0Ay8OkMNbMfKViOHOmcnYv2nFYGXf0vaRRz6XXyCvWJHMIFqydxqCHJn_M";
  process.env.VAPID_PRIVATE_KEY = "K-K-Hv9Sd51taFimuH_c9likC2Ks-Y4-c6S6S5Szh9I";
}, 60_000);

afterEach(async () => {
  __resetCookies();
  sendNotification.mockReset();
  vi.unstubAllGlobals();
  await db.pushSubscription.deleteMany({ where: { userId: { in: [ids.a, ids.b] } } });
  await db.session.deleteMany({ where: { userId: { in: [ids.a, ids.b] } } });
});

afterAll(async () => {
  await db.auditLog.deleteMany({ where: { actorUserId: { in: [ids.a, ids.b] } } });
  await db.user.deleteMany({ where: { id: { in: [ids.a, ids.b] } } });
  await db.$disconnect();
});

describe("TA-041: a browser's notices belong to the sign-in that turned them on", () => {
  it("TA-041: turning notices on records the sign-in, and Sign out removes that browser's registration, so nothing is sent to it", async () => {
    const here = await signIn(ids.a);
    expect((await turnOn("home")).status).toBe(200);
    expect(await row("home")).toEqual({ userId: ids.a, sessionId: here.id });
    // The row and its line on the record are one unit.
    expect(await db.auditLog.count({ where: { actorUserId: ids.a, action: "push.subscribe" } })).toBe(1);
    sendNotification.mockResolvedValue({ statusCode: 201 });
    expect((await send(ids.a)).delivered).toBe(1);

    sendNotification.mockClear();
    await destroySession();
    expect(await row("home")).toBeNull();
    expect(await send(ids.a)).toEqual({ delivered: 0, failed: 0, retired: 0, skipped: false });
    expect(sendNotification).not.toHaveBeenCalled();
  });

  it("TA-041: signing a browser out from another device removes its registration and leaves the other browser's", async () => {
    const library = await signIn(ids.a);
    await turnOn("library");
    const home = await signIn(ids.a);
    await turnOn("home");
    expect(await row("library")).toEqual({ userId: ids.a, sessionId: library.id });

    // From the browser at home, the library's computer is signed out.
    expect(await revokeSession(library.id, ids.a)).toBe(true);
    expect(await row("library")).toBeNull();
    expect(await row("home")).toEqual({ userId: ids.a, sessionId: home.id });
    sendNotification.mockResolvedValue({ statusCode: 201 });
    expect((await send(ids.a)).delivered).toBe(1);
    expect(sentTo()).toEqual([endpoint("home")]);
  });

  it("TA-041: a sign-in that has run out or was ended, and a registration with no link, are not sent to and not deleted", async () => {
    const ranOut = await signIn(ids.a);
    await turnOn("ranout");
    const ended = await signIn(ids.a);
    await turnOn("ended");
    // A registration made before the link existed.
    await db.pushSubscription.create({ data: { userId: ids.a, endpoint: endpoint("old"), ...KEYS } });
    await db.session.update({ where: { id: ranOut.id }, data: { expiresAt: new Date(Date.now() - 60_000) } });
    // Ended by a door that only marks the row (the phone's logout, a merge): no registration is removed there.
    await db.session.update({ where: { id: ended.id }, data: { revokedAt: new Date() } });

    sendNotification.mockResolvedValue({ statusCode: 201 });
    expect(await send(ids.a)).toEqual({ delivered: 0, failed: 0, retired: 0, skipped: false });
    expect(sendNotification).not.toHaveBeenCalled();
    expect(await db.pushSubscription.count({ where: { userId: ids.a } })).toBe(3);
  });

  it("TA-041: the same person's browser links itself to their next sign-in, once, and is sent to again", async () => {
    await db.pushSubscription.create({ data: { userId: ids.a, endpoint: endpoint("old"), ...KEYS } });
    const again = await signIn(ids.a);
    const first = await relink("old");
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ ok: true, linked: true });
    expect(await row("old")).toEqual({ userId: ids.a, sessionId: again.id });
    sendNotification.mockResolvedValue({ statusCode: 201 });
    expect((await send(ids.a)).delivered).toBe(1);

    // The page asks on every load; only the link that changed something is on the record.
    expect(await (await relink("old")).json()).toEqual({ ok: true, linked: true });
    expect(await db.auditLog.count({ where: { actorUserId: ids.a, action: "push.relink" } })).toBe(1);
    // A browser the server holds nothing of is not registered by this door.
    expect(await (await relink("never")).json()).toEqual({ ok: true, linked: false });
    expect(await row("never")).toBeNull();
  });

  it("TA-041: another person signing in on that browser inherits nothing, and the first person's notices stop reaching it", async () => {
    const a = await signIn(ids.a);
    await turnOn("shared");
    expect(await row("shared")).toEqual({ userId: ids.a, sessionId: a.id });

    // B signs in on the same browser without A having pressed Sign out; the page asks to link, as it does on every load.
    const b = await signIn(ids.b);
    const answer = await relink("shared");
    expect(await answer.json()).toEqual({ ok: true, linked: false });
    expect(await row("shared")).toEqual({ userId: ids.a, sessionId: null });
    // On the record once, under the person now signed in, however often the page asks.
    await relink("shared");
    expect(await db.auditLog.count({ where: { actorUserId: ids.b, action: "push.unlink" } })).toBe(1);
    sendNotification.mockResolvedValue({ statusCode: 201 });
    expect((await send(ids.a)).delivered).toBe(0);
    expect((await send(ids.b)).delivered).toBe(0);
    expect(sendNotification).not.toHaveBeenCalled();
    expect(await (await ask("shared")).json()).toMatchObject({ subscribed: false });

    // B turns notices on themselves: the browser is B's from then on.
    expect((await turnOn("shared")).status).toBe(200);
    expect(await row("shared")).toEqual({ userId: ids.b, sessionId: b.id });
    // A, back on that browser, is not handed it either.
    await signIn(ids.a);
    expect(await (await relink("shared")).json()).toEqual({ ok: true, linked: false });
    expect(await row("shared")).toEqual({ userId: ids.b, sessionId: null });
  });

  it("TA-041: the settings switch answers for this sign-in, and counts only the registrations that are sent to", async () => {
    const first = await signIn(ids.a);
    await turnOn("home");
    await db.pushSubscription.create({ data: { userId: ids.a, endpoint: endpoint("old"), ...KEYS } });
    expect(await (await ask("home")).json()).toEqual({ subscribed: true, devices: 1 });

    // A second sign-in of the same person (another browser, or this one after the first ran out): not this sign-in's.
    await signIn(ids.a);
    expect(await (await ask("home")).json()).toEqual({ subscribed: false, devices: 1 });
    await db.session.update({ where: { id: first.id }, data: { expiresAt: new Date(Date.now() - 60_000) } });
    expect(await (await ask("home")).json()).toEqual({ subscribed: false, devices: 0 });
    await relink("home");
    expect(await (await ask("home")).json()).toEqual({ subscribed: true, devices: 1 });
  });
});

/* -------------------------------------------------------------------------- */
/* The browser's half                                                          */
/* -------------------------------------------------------------------------- */

type Call = { method: string; body: { endpoint?: string; keys?: unknown } };

/** A browser with (or without) a push subscription, and a server that answers the link as told. */
function browser(opts: { subscribed: boolean; linked?: boolean; owner?: string }) {
  const calls: Call[] = [];
  const unsubscribe = vi.fn(async () => true);
  const subscription = { endpoint: endpoint("browser"), toJSON: () => ({ endpoint: endpoint("browser"), keys: KEYS }), unsubscribe };
  const store = new Map<string, string>(opts.owner ? [["edulink:push-owner", opts.owner]] : []);
  vi.stubGlobal("navigator", { serviceWorker: { getRegistration: async () => ({ pushManager: { getSubscription: async () => (opts.subscribed ? subscription : null) } }) } });
  vi.stubGlobal("localStorage", { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => void store.set(key, value), removeItem: (key: string) => void store.delete(key) });
  vi.stubGlobal("fetch", async (_url: string, init: { method: string; body: string }) => {
    calls.push({ method: init.method, body: JSON.parse(init.body) as Call["body"] });
    return new Response(JSON.stringify(init.method === "PATCH" ? { ok: true, linked: opts.linked ?? false } : { ok: true }), { status: 200 });
  });
  return { calls, unsubscribe, store };
}

describe("TA-041: what the browser does", () => {
  it("TA-041: Sign out tells the server, unsubscribes the browser and forgets who turned notices on, and never holds the sign-out up", async () => {
    const { switchOffPush } = await import("@/lib/push-client");
    const b = browser({ subscribed: true, owner: ids.a });
    await switchOffPush();
    expect(b.calls).toEqual([{ method: "DELETE", body: { endpoint: endpoint("browser") } }]);
    expect(b.unsubscribe).toHaveBeenCalledTimes(1);
    expect(b.store.has("edulink:push-owner")).toBe(false);

    // A browser that never answers: the sign-out goes ahead after the wait.
    vi.stubGlobal("navigator", { serviceWorker: { getRegistration: () => new Promise(() => {}) } });
    const started = Date.now();
    await switchOffPush(50);
    expect(Date.now() - started).toBeLessThan(2_000);
    // And a browser with no service worker at all has nothing to switch off.
    vi.stubGlobal("navigator", {});
    await expect(switchOffPush()).resolves.toBeUndefined();
  });

  it("TA-041: a signed-in page asks the server to link the browser's subscription, and registers afresh only for the person who turned notices on there", async () => {
    const { relinkPush } = await import("@/lib/push-client");
    // The server holds this person's registration: linked, and the browser remembers whose it is.
    let b = browser({ subscribed: true, linked: true });
    expect(await relinkPush(ids.a)).toBe(true);
    expect(b.calls).toEqual([{ method: "PATCH", body: { endpoint: endpoint("browser") } }]);
    expect(b.store.get("edulink:push-owner")).toBe(ids.a);

    // The server holds nothing (the registration went with its sign-in), and this person turned notices on here: again, by itself.
    b = browser({ subscribed: true, linked: false, owner: ids.a });
    expect(await relinkPush(ids.a)).toBe(true);
    expect(b.calls.map((c) => c.method)).toEqual(["PATCH", "POST"]);
    expect(b.calls[1]!.body).toEqual({ endpoint: endpoint("browser"), keys: KEYS });

    // Somebody else turned them on here, or nobody is remembered: the person turns notices on themselves.
    b = browser({ subscribed: true, linked: false, owner: ids.b });
    expect(await relinkPush(ids.a)).toBe(false);
    expect(b.calls.map((c) => c.method)).toEqual(["PATCH"]);
    b = browser({ subscribed: true, linked: false });
    expect(await relinkPush(ids.a)).toBe(false);
    expect(b.calls.map((c) => c.method)).toEqual(["PATCH"]);

    // No subscription in the browser: nothing is asked.
    b = browser({ subscribed: false, owner: ids.a });
    expect(await relinkPush(ids.a)).toBe(false);
    expect(b.calls).toEqual([]);
  });

  it("TA-041: every one of the ten sign-out forms is the form that switches notices off first, and each signed-in page links the browser", () => {
    const FORMS = [
      "src/app/record/layout.tsx",
      "src/app/join/page.tsx",
      "src/app/join/waiting/page.tsx",
      "src/app/appadmin/layout.tsx",
      "src/app/switch/page.tsx",
      "src/app/root/layout.tsx",
      "src/app/suspended/page.tsx",
      "src/app/account/layout.tsx",
      "src/app/account/page.tsx",
      "src/components/nav/app-shell.tsx",
    ];
    for (const file of FORMS) {
      const source = readFileSync(file, "utf8");
      expect(source, file).toContain("<SignOutForm");
      expect(source, file).not.toMatch(/<form[^>]*\/api\/auth\/logout/);
    }
    const form = readFileSync("src/components/sign-out-form.tsx", "utf8");
    expect(form).toMatch(/action="\/api\/auth\/logout"\s+method="post"/);
    expect(form).toContain("switchOffPush()");
    // The root layout's runtime knows who is signed in on every page; it is where the browser links itself.
    expect(readFileSync("src/components/app-runtime.tsx", "utf8")).toContain("relinkPush(owner)");
    // The switch reads this sign-in's answer and links before it says "on"; it no longer registers whoever is signed in.
    const toggle = readFileSync("src/components/push-toggle.tsx", "utf8");
    expect(toggle).toContain("relinkPush(userId)");
    expect(toggle).toContain('t("push.signOutTurnsOff")');
  });

  it("TA-041: one sentence in three languages says signing out turns notices off on this browser, and the two new audit rows have words", () => {
    const sentence = (dict: unknown) => (dict as { push: Record<string, string | undefined> }).push.signOutTurnsOff ?? "";
    expect(sentence(en)).toMatch(/Signing out turns notifications off on this browser\.$/);
    expect(sentence(hi)).toMatch(/साइन आउट.*ब्राउज़र.*।$/);
    expect(sentence(mr)).toMatch(/साइन आउट.*ब्राउझर.*\.$/);
    for (const action of ["push.relink", "push.unlink"]) {
      const key = actionKey(action);
      expect(key, action).toMatch(/^audit\./);
      for (const dict of [en, hi, mr]) expect((dict as unknown as { audit: Record<string, string | undefined> }).audit[key!.slice("audit.".length)], action).toBeTruthy();
    }
  });

  it("TA-041: decision 0002 names the browser's registration and says a web sign-in lasts a fixed 30 days", () => {
    const decision = readFileSync("../../docs/decisions/0002-minors-data-policy.md", "utf8");
    const rowOf = (n: number) => decision.split("\n").find((line) => line.startsWith(`| ${n} |`)) ?? "";
    expect(rowOf(20)).not.toContain("30 days, sliding when used");
    expect(rowOf(20)).toMatch(/fixed 30 days/);
    expect(rowOf(34)).toContain("`PushSubscription`");
    expect(rowOf(34)).toMatch(/sign-in/);
  });
});
