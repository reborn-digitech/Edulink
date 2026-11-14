/**
 * The session's batch of the testing analysis of 13 November 2026 (mobile-core):
 *
 * TA-145 a session that ended on the server was noticed only by /api/v1/me or an open events stream;
 * TA-147 the outbox compared the school and not the role, so a row queued as TEACHER went out under PRINCIPAL;
 * TA-148 / TA-164 switching school or role kept the other context's cached screens;
 * TA-348 sign-out and a 401 left the pickers' copies and the delivered notices on the phone.
 */
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import * as Notifications from "expo-notifications";
import { Image } from "expo-image";
import { createApiClient } from "@edulink/api-client";
import { __setApiClient, api, sessionEndedOnServer } from "@/lib/api";
import { __setOutboxStore, countQueued, enqueue, heldElsewhere, memoryOutbox, setOutboxOwner, type OutboxStore } from "@/lib/outbox";
import { __setReplayFetch, __stopOutboxRunner, flushOutbox } from "@/lib/outbox-runner";
import { __setKeyStore, KEYS, memoryStore } from "@/lib/storage";
import { __resetInstallCheck, SessionProvider, useSession } from "@/lib/session";
import { connectEvents } from "@/lib/use-events";
import { unwrap } from "@/lib/query";

type Ctx = { schoolId: string | null; role: string; membershipId: string | null };
const meOf = (id: string, ctx: Ctx) => ({
  user: { id, name: id, preferredName: null, email: `${id}@zz.test`, avatarKey: null, isMinor: false, locale: "en" },
  active: ctx,
  contexts: [
    { schoolId: "s1", schoolName: "ZZ School", role: "TEACHER" },
    { schoolId: "s1", schoolName: "ZZ School", role: "PRINCIPAL" },
    { schoolId: "s2", schoolName: "ZZ Other School", role: "TEACHER" },
  ],
});
const TEACHER_S1: Ctx = { schoolId: "s1", role: "TEACHER", membershipId: "m-A-teacher" };
const PRINCIPAL_S1: Ctx = { schoolId: "s1", role: "PRINCIPAL", membershipId: "m-A-principal" };
const TEACHER_S2: Ctx = { schoolId: "s2", role: "TEACHER", membershipId: "m-A-s2" };

let store = memoryStore();
let rows: OutboxStore = memoryOutbox();
let ctxNow: Ctx = TEACHER_S1;
let ended = false;
let apiFetch: jest.Mock;
let replayed: string[] = [];
const REGISTER = { url: "/api/attendance", method: "POST", body: JSON.stringify({ classId: "c1", dateKey: "2026-11-13", marks: [] }), tag: "register:c1:2026-11-13" };
const unauthorized = () => new Response('{"error":"Not signed in","code":"UNAUTHENTICATED"}', { status: 401 });

beforeEach(() => {
  __stopOutboxRunner();
  setOutboxOwner(null);
  __resetInstallCheck();
  store = memoryStore();
  __setKeyStore(store);
  rows = memoryOutbox();
  __setOutboxStore(rows);
  ctxNow = TEACHER_S1;
  ended = false;
  replayed = [];
  apiFetch = jest.fn(async (url: string) => {
    const path = new URL(String(url)).pathname;
    if (ended) return unauthorized();
    if (path === "/api/v1/me") return new Response(JSON.stringify(meOf("A", ctxNow)), { status: 200 });
    if (path === "/api/v1/me/context") return new Response("{}", { status: 200 });
    if (path === "/api/v1/staff/classes") return new Response(JSON.stringify({ school: ctxNow.schoolId }), { status: 200 });
    return new Response('{"ok":true}', { status: 200 });
  });
  // The client the app makes, over the fake fetch: a 401 to the bearer reaches the session (TA-145).
  __setApiClient(createApiClient({ baseUrl: "http://api.test", getToken: () => store.get(KEYS.token), fetch: apiFetch as unknown as typeof fetch, onUnauthorized: sessionEndedOnServer }));
  __setReplayFetch((async (url: string) => {
    replayed.push(String(url));
    return new Response("{}", { status: 200 });
  }) as unknown as typeof fetch);
});

const sessionOnly = ({ children }: { children: ReactNode }) => <SessionProvider>{children}</SessionProvider>;

async function signedIn() {
  await store.set(KEYS.token, "token-A");
  const hook = await renderHook(() => useSession(), { wrapper: sessionOnly });
  await waitFor(() => expect(hook.result.current.status).toBe("signed-in"));
  return hook;
}

describe("a session ended on the server is noticed wherever a 401 meets it (TA-145)", () => {
  it("TA-145: a 401 on a screen's door signs the person out, the token goes and their queued rows are held", async () => {
    const { result } = await signedIn();
    await enqueue(REGISTER);
    ended = true;
    // A screen asks its door, not /api/v1/me.
    const answer = await api().get("/api/v1/staff/classes");
    expect(answer.ok).toBe(false);
    await waitFor(() => expect(result.current.status).toBe("signed-out"));
    expect(await store.get(KEYS.token)).toBeNull();
    // Held for the same person, as a 401 on /me always held them.
    expect(await rows.all()).toHaveLength(1);
  });

  it("TA-145: the events stream answered 401 on reopening hands the person to the sign-out path instead of retrying for good", async () => {
    await store.set(KEYS.token, "token-A");
    const onSessionEnded = jest.fn();
    const timers: (() => void)[] = [];
    const stop = connectEvents({
      types: ["attendance.updated"],
      onEvent: () => {},
      onSessionEnded,
      fetch: (async () => new Response("", { status: 401 })) as never,
      setTimer: (fn) => timers.push(fn),
      clearTimer: () => {},
    });
    await waitFor(() => expect(onSessionEnded).toHaveBeenCalledTimes(1));
    expect(timers).toHaveLength(0);
    stop();
  });
});

describe("the outbox's owner is the membership, not only the school (TA-147)", () => {
  it("TA-147: a register queued as TEACHER is held while the same person is PRINCIPAL at the same school, and goes on switching back", async () => {
    const { result } = await signedIn();
    await enqueue(REGISTER);
    ctxNow = PRINCIPAL_S1;
    await act(() => result.current.switchContext({ schoolId: "s1", role: "PRINCIPAL" }));
    expect(result.current.me?.active.membershipId).toBe("m-A-principal");
    expect(await flushOutbox()).toEqual({ sent: 0, failed: 0, remaining: 0 });
    expect(replayed).toHaveLength(0);
    expect(await countQueued()).toBe(0);
    expect([...(await heldElsewhere()).entries()]).toEqual([["s1", 1]]);
    ctxNow = TEACHER_S1;
    await act(() => result.current.switchContext({ schoolId: "s1", role: "TEACHER" }));
    expect(await flushOutbox()).toEqual({ sent: 1, failed: 0, remaining: 0 });
    expect(replayed).toHaveLength(1);
  });
});

describe("switching school or role leaves nothing of the last context on screen (TA-148, TA-164)", () => {
  it("TA-148: the classes door is asked again under the new school and the last school's answer is gone", async () => {
    // No timer outlives the test (harness-open-handles.test.ts).
    const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity, retry: false }, mutations: { gcTime: Infinity } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>
        <SessionProvider>{children}</SessionProvider>
      </QueryClientProvider>
    );
    await store.set(KEYS.token, "token-A");
    const hook = await renderHook(
      () => ({
        session: useSession(),
        classes: useQuery({ queryKey: ["staff", "classes"], queryFn: async () => unwrap(await api().get<{ school: string }>("/api/v1/staff/classes")) }),
      }),
      { wrapper },
    );
    await waitFor(() => expect(hook.result.current.classes.data).toEqual({ school: "s1" }));
    const asked = () => apiFetch.mock.calls.filter(([u]) => new URL(String(u)).pathname === "/api/v1/staff/classes").length;
    const before = asked();
    ctxNow = TEACHER_S2;
    await act(() => hook.result.current.session.switchContext({ schoolId: "s2", role: "TEACHER" }));
    await waitFor(() => expect(hook.result.current.classes.data).toEqual({ school: "s2" }));
    expect(asked()).toBe(before + 1);
    client.clear();
  });
});

describe("a session's end takes the pickers' copies and the delivered notices too (TA-348)", () => {
  const cache = () => (globalThis as { __cacheFiles?: Map<string, unknown> }).__cacheFiles!;
  const writeFile = (...parts: string[]) => {
    const { File } = jest.requireMock<{ File: new (...p: string[]) => { write(s: string): void } }>("expo-file-system");
    new File(...parts).write("bytes");
  };

  it("TA-348: a 401 removes what the document picker and the camera copied, dismisses the tray and clears the badge", async () => {
    const { result } = await signedIn();
    writeFile("file:///cache/DocumentPicker", "medical-certificate.pdf");
    writeFile("file:///cache/ImagePicker", "homework.jpg");
    jest.spyOn(Image, "clearDiskCache").mockResolvedValue(true);
    jest.spyOn(Image, "clearMemoryCache").mockResolvedValue(true);
    const dismiss = jest.spyOn(Notifications, "dismissAllNotificationsAsync");
    const badge = jest.spyOn(Notifications, "setBadgeCountAsync");
    ended = true;
    await act(() => result.current.refresh());
    expect(result.current.status).toBe("signed-out");
    expect(cache().has("file:///cache/DocumentPicker/medical-certificate.pdf")).toBe(false);
    expect(cache().has("file:///cache/ImagePicker/homework.jpg")).toBe(false);
    expect(dismiss).toHaveBeenCalled();
    expect(badge).toHaveBeenCalledWith(0);
  });

  it("TA-348: Sign out does the same", async () => {
    const { result } = await signedIn();
    writeFile("file:///cache/DocumentPicker", "leave-note.pdf");
    jest.spyOn(Image, "clearDiskCache").mockResolvedValue(true);
    jest.spyOn(Image, "clearMemoryCache").mockResolvedValue(true);
    const dismiss = jest.spyOn(Notifications, "dismissAllNotificationsAsync");
    await act(() => result.current.signOut());
    expect(cache().has("file:///cache/DocumentPicker/leave-note.pdf")).toBe(false);
    expect(dismiss).toHaveBeenCalled();
  });
});
