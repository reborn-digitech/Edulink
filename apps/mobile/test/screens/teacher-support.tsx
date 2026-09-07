import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { createApiClient } from "@edulink/api-client";
import { __setApiClient } from "@/lib/api";
import { __setOutboxStore, memoryOutbox } from "@/lib/outbox";
import { __setKeyStore, KEYS, memoryStore } from "@/lib/storage";
import { __setReplayFetch, __stopOutboxRunner } from "@/lib/outbox-runner";
import { renderApp } from "../utils";

/**
 * The teacher screens' test bench: a fake API keyed by pathname (the handler
 * sees the whole request, so a test can assert the query string and the
 * body), an in-memory outbox, and React Query without retries so an error
 * shows at once.
 */
/* A cold worker's first render transforms the whole tree; give it room when the files run in parallel. */
jest.setTimeout(20_000);

export type Answer = (url: URL, init: RequestInit | undefined) => Response | Promise<Response>;

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

export function refusal(error: string, status: number): Response {
  return json({ error }, status);
}

export function offline(): Response {
  throw new TypeError("Network request failed");
}

export function fakeApi(answers: Record<string, Answer>): jest.Mock {
  const fetch: jest.Mock = jest.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    const answer = answers[url.pathname];
    if (!answer) return json({ error: `No answer for ${url.pathname}` }, 404);
    return answer(url, init);
  });
  // The token sits in storage, as on a phone: the session provider and the replay client both read it there.
  __setKeyStore(memoryStore({ [KEYS.token]: "t" }));
  __setApiClient(createApiClient({ baseUrl: "http://api.test", getToken: () => "t", fetch: fetch as unknown as typeof globalThis.fetch }));
  __setReplayFetch(fetch as unknown as typeof globalThis.fetch);
  return fetch;
}

/** The calls the fake fetch saw for one path, newest last, each with its parsed body. */
export function callsTo(fetch: jest.Mock, path: string): { url: URL; method: string; body: unknown; headers: Record<string, string> }[] {
  return fetch.mock.calls
    .filter((c) => new URL(String(c[0])).pathname === path)
    .map((c) => {
      const init = (c[1] ?? {}) as RequestInit;
      return { url: new URL(String(c[0])), method: init.method ?? "GET", body: init.body ? JSON.parse(String(init.body)) : undefined, headers: (init.headers ?? {}) as Record<string, string> };
    });
}

/** Render is async in this testing library; no retries, and no gc timers to keep the runner alive. */
export function renderTeacher(ui: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  return renderApp(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

/** Events are async in this testing library; these keep every test awaiting them. */
type Instance = Parameters<typeof fireEvent.press>[0];
export function tap(element: Instance): Promise<void> {
  return fireEvent.press(element);
}
export function typeInto(element: Instance, text: string): Promise<void> {
  return fireEvent.changeText(element, text);
}

/** Fresh outbox and runner per test. */
export function resetOutbox(): void {
  __stopOutboxRunner();
  __setOutboxStore(memoryOutbox());
}

/** Ids the contracts accept: cuid-shaped, ZZ-flavoured. */
export const ID = {
  class1: "czz00000000000000000c1",
  class2: "czz00000000000000000c2",
  pupil1: "czz00000000000000000p1",
  pupil2: "czz00000000000000000p2",
  slot1: "czz00000000000000000s1",
  series1: "czz0000000000000000se1",
  room1: "czz00000000000000000r1",
  thread1: "czz00000000000000000t1",
  staff1: "czz0000000000000000st1",
};

export const ME = {
  user: { id: "u1", name: "ZZ Teacher", preferredName: null, email: "t@zz.test", avatarKey: null, isMinor: false, locale: "en" },
  active: { schoolId: "s1", role: "TEACHER", membershipId: "m1" },
  contexts: [{ schoolId: "s1", schoolName: "ZZ School", role: "TEACHER" }],
};
