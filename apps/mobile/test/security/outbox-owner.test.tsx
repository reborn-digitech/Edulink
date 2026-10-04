/**
 * Whose queued write goes out, and what is left when a session ends
 * (campaign 2026-10-04, phone security layer PH-1, PH-2, PH-3, PH-5, PH-6).
 *
 * The first case is the campaign's reproduction turned round: on the tree
 * it was found on, person A's register queued offline went out under person
 * B's bearer, with no owner header, once A's session had ended by a 401 and
 * B had signed in on the same phone. Here it must not go under B at all, and
 * must go under A, naming A, when A signs in again.
 */
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { Image } from "expo-image";
import * as Notifications from "expo-notifications";
import { createApiClient } from "@edulink/api-client";
import { __setApiClient } from "@/lib/api";
import { __setOutboxStore, countQueued, enqueue, HOLD_DAYS, heldElsewhere, memoryOutbox, setOutboxOwner, type OutboxStore } from "@/lib/outbox";
import { __setReplayFetch, __stopOutboxRunner, flushOutbox } from "@/lib/outbox-runner";
import { __setKeyStore, KEYS, memoryStore } from "@/lib/storage";
import { __resetInstallCheck, SessionProvider, useSession } from "@/lib/session";
import { onSessionEnd, runSessionEnd } from "@/lib/session-end";

type Ctx = { schoolId: string | null; role: string; membershipId: string | null };
const meOf = (id: string, ctx: Ctx = { schoolId: "s1", role: "TEACHER", membershipId: `m-${id}` }) => ({
  user: { id, name: id, preferredName: null, email: `${id}@zz.test`, avatarKey: null, isMinor: false, locale: "en" },
  active: ctx,
  contexts: [
    { schoolId: "s1", schoolName: "ZZ School", role: "TEACHER" },
    { schoolId: "s2", schoolName: "ZZ Other School", role: "TEACHER" },
  ],
});

let store = memoryStore();
let rows: OutboxStore = memoryOutbox();
let meAnswer: () => Response = () => new Response("{}", { status: 404 });
let replayed: { url: string; headers: Record<string, string> }[] = [];
const wrapper = ({ children }: { children: ReactNode }) => <SessionProvider>{children}</SessionProvider>;
const REGISTER = { url: "/api/attendance", method: "POST", body: JSON.stringify({ classId: "c1", dateKey: "2026-10-04", marks: [{ studentId: "p1", status: "ABSENT" }] }), tag: "register:c1:2026-10-04" };
const signedIn = (id: string, ctx?: Ctx) => () => new Response(JSON.stringify(meOf(id, ctx)), { status: 200 });
const ended = () => new Response('{"error":"Not signed in","code":"UNAUTHENTICATED"}', { status: 401 });

beforeEach(() => {
  __stopOutboxRunner();
  setOutboxOwner(null);
  __resetInstallCheck();
  store = memoryStore();
  __setKeyStore(store);
  rows = memoryOutbox();
  __setOutboxStore(rows);
  replayed = [];
  const apiFetch = jest.fn(async (url: string) => {
    const path = new URL(String(url)).pathname;
    if (path === "/api/v1/me") return meAnswer();
    return new Response('{"ok":true}', { status: 200 });
  });
  __setApiClient(createApiClient({ baseUrl: "http://api.test", getToken: () => store.get(KEYS.token), fetch: apiFetch as unknown as typeof fetch }));
  __setReplayFetch((async (url: string, init: RequestInit) => {
    replayed.push({ url: String(url), headers: init.headers as Record<string, string> });
    return new Response("{}", { status: 200 });
  }) as unknown as typeof fetch);
});

async function signInAs(id: string) {
  await store.set(KEYS.token, `token-${id}`);
  meAnswer = signedIn(id);
  const hook = await renderHook(() => useSession(), { wrapper });
  await waitFor(() => expect(hook.result.current.status).toBe("signed-in"));
  return hook;
}

describe("the outbox's owner (PH-1)", () => {
  it("A's register queued before A's session ended by 401 is not sent under B, and goes under A, named, when A is back", async () => {
    const { result } = await signInAs("A");
    await enqueue(REGISTER);

    meAnswer = ended;
    await act(() => result.current.refresh());
    expect(result.current.status).toBe("signed-out");
    expect(await store.get(KEYS.token)).toBeNull();
    // Held on the phone, not dropped: it is A's work.
    expect(await rows.all()).toHaveLength(1);

    meAnswer = signedIn("B");
    await act(() => result.current.accept({ token: "token-B", expiresAt: new Date(Date.now() + 1e7).toISOString(), sessionId: "sB", context: { schoolId: "s1", role: "TEACHER" } }));
    expect(result.current.me?.user.id).toBe("B");
    expect(await flushOutbox()).toEqual({ sent: 0, failed: 0, remaining: 0 });
    expect(replayed).toHaveLength(0);
    // B's badge does not count A's row either.
    expect(await countQueued()).toBe(0);
    expect(await rows.all()).toHaveLength(1);

    meAnswer = signedIn("A");
    await act(() => result.current.accept({ token: "token-A2", expiresAt: new Date(Date.now() + 1e7).toISOString(), sessionId: "sA2", context: { schoolId: "s1", role: "TEACHER" } }));
    expect(await flushOutbox()).toEqual({ sent: 1, failed: 0, remaining: 0 });
    expect(replayed).toHaveLength(1);
    expect(replayed[0]!.headers).toMatchObject({ Authorization: "Bearer token-A2", "X-Edulink-Replay": "1", "X-Edulink-Owner": "A" });
  });

  it("another person's row is dropped unsent after HOLD_DAYS; a row nobody owns is never sent", async () => {
    setOutboxOwner({ userId: "A", schoolId: "s1", membershipId: "m-A" });
    await enqueue(REGISTER);
    setOutboxOwner(null);
    await enqueue({ ...REGISTER, tag: "nobody" });
    setOutboxOwner({ userId: "B", schoolId: "s1", membershipId: "m-B" });
    await store.set(KEYS.token, "token-B");
    expect(await flushOutbox()).toEqual({ sent: 0, failed: 0, remaining: 0 });
    expect(await rows.all()).toHaveLength(2);
    const { flushQueue } = jest.requireActual<typeof import("@/lib/outbox")>("@/lib/outbox");
    const later = Date.now() + (HOLD_DAYS + 1) * 86_400_000;
    const send = jest.fn(async () => ({ status: 200 }));
    expect(await flushQueue(send, later)).toEqual({ sent: 0, failed: 0, remaining: 0 });
    expect(send).not.toHaveBeenCalled();
    expect(await rows.all()).toHaveLength(0);
  });

  it("Sign out drops the person's own rows and leaves another person's held rows to their hold", async () => {
    setOutboxOwner({ userId: "A", schoolId: "s1", membershipId: "m-A" });
    await enqueue(REGISTER);
    setOutboxOwner(null);
    const { result } = await signInAs("B");
    await enqueue({ ...REGISTER, tag: "B's" });
    expect(await rows.all()).toHaveLength(2);
    await act(() => result.current.signOut());
    const left = await rows.all();
    expect(left.map((r) => r.owner)).toEqual(["A"]);
  });
});

describe("switching school keeps the outbox but sends nothing of another school (PH-6)", () => {
  it("holds school 1's register while at school 2, says so, and sends it on switching back", async () => {
    const { result } = await signInAs("A");
    await enqueue(REGISTER);
    meAnswer = signedIn("A", { schoolId: "s2", role: "TEACHER", membershipId: "m-A2" });
    await act(() => result.current.switchContext({ schoolId: "s2", role: "TEACHER" }));
    expect(result.current.me?.active.schoolId).toBe("s2");
    expect(await flushOutbox()).toEqual({ sent: 0, failed: 0, remaining: 0 });
    expect(replayed).toHaveLength(0);
    expect([...(await heldElsewhere()).entries()]).toEqual([["s1", 1]]);

    meAnswer = signedIn("A");
    await act(() => result.current.switchContext({ schoolId: "s1", role: "TEACHER" }));
    expect((await heldElsewhere()).size).toBe(0);
    expect(await flushOutbox()).toEqual({ sent: 1, failed: 0, remaining: 0 });
    expect(replayed[0]!.headers["X-Edulink-Owner"]).toBe("A");
  });
});

describe("a session that ends on the server leaves the phone as Sign out does (PH-2, PH-3)", () => {
  it("a 401 forgets the crash, the session, shared files, the image cache and the device's push; preferences stay; trip tracking stops", async () => {
    const { result } = await signInAs("A");
    await store.set(KEYS.crash, JSON.stringify({ message: "boom" }));
    await store.set(KEYS.session, JSON.stringify({ sessionId: "sA" }));
    await store.set(KEYS.locale, "mr");
    const shared = (globalThis as { __cacheFiles?: Map<string, unknown> }).__cacheFiles!;
    const { File } = jest.requireMock<{ File: new (...p: string[]) => { write(s: string): void } }>("expo-file-system");
    new File("file:///cache", "relay-shared-report-card.pdf").write("%PDF");
    expect(shared.has("file:///cache/relay-shared-report-card.pdf")).toBe(true);
    const disk = jest.spyOn(Image, "clearDiskCache").mockResolvedValue(true);
    const memory = jest.spyOn(Image, "clearMemoryCache").mockResolvedValue(true);
    const unregister = jest.spyOn(Notifications, "unregisterForNotificationsAsync");
    const tracking = jest.fn();
    const stop = onSessionEnd(tracking);

    meAnswer = ended;
    await act(() => result.current.refresh());
    stop();
    expect(result.current.status).toBe("signed-out");
    expect(await store.get(KEYS.token)).toBeNull();
    expect(await store.get(KEYS.crash)).toBeNull();
    expect(await store.get(KEYS.session)).toBeNull();
    expect(await store.get(KEYS.locale)).toBe("mr");
    expect(shared.has("file:///cache/relay-shared-report-card.pdf")).toBe(false);
    expect(disk).toHaveBeenCalled();
    expect(memory).toHaveBeenCalled();
    expect(unregister).toHaveBeenCalled();
    expect(tracking).toHaveBeenCalledTimes(1);
  });

  it("Sign out stops what runs for the person and removes the token even when the outbox's database throws", async () => {
    const { result } = await signInAs("A");
    const broken: OutboxStore = {
      all: async () => {
        throw new Error("SQLITE_IOERR");
      },
      put: async () => {},
      remove: async () => {},
    };
    __setOutboxStore(broken);
    const tracking = jest.fn();
    const stop = onSessionEnd(tracking);
    await act(() => result.current.signOut());
    stop();
    expect(result.current.status).toBe("signed-out");
    expect(await store.get(KEYS.token)).toBeNull();
    expect(tracking).toHaveBeenCalledTimes(1);
  });

  it("a handler that throws does not stop the others", async () => {
    const after = jest.fn();
    const a = onSessionEnd(() => {
      throw new Error("no");
    });
    const b = onSessionEnd(after);
    await runSessionEnd();
    a();
    b();
    expect(after).toHaveBeenCalledTimes(1);
  });
});

describe("a fresh install forgets what the keychain kept (PH-5)", () => {
  it("the first launch after an install starts signed out; the next launch keeps the token", async () => {
    const files = (globalThis as { __cacheFiles?: Map<string, unknown> }).__cacheFiles!;
    const marker = "file:///document/edulink-installed";
    const kept = files.get(marker);
    files.delete(marker);
    try {
      await store.set(KEYS.token, "token-last-person");
      await store.set(KEYS.theme, "dark");
      meAnswer = signedIn("Last");
      const first = await renderHook(() => useSession(), { wrapper });
      await waitFor(() => expect(first.result.current.status).toBe("signed-out"));
      expect(await store.get(KEYS.token)).toBeNull();
      expect(await store.get(KEYS.theme)).toBe("dark");
      expect(files.has(marker)).toBe(true);
      first.unmount();

      __resetInstallCheck();
      await store.set(KEYS.token, "token-now");
      const second = await renderHook(() => useSession(), { wrapper });
      await waitFor(() => expect(second.result.current.status).toBe("signed-in"));
      expect(await store.get(KEYS.token)).toBe("token-now");
    } finally {
      if (kept) files.set(marker, kept);
    }
  });
});
