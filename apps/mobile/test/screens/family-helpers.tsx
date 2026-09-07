import type { ReactElement, ReactNode } from "react";
import { userEvent } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createApiClient } from "@edulink/api-client";
import { __setApiClient } from "@/lib/api";
import { __setKeyStore, KEYS, memoryStore } from "@/lib/storage";
import { SessionProvider } from "@/lib/session";
import { renderApp } from "../utils";

/**
 * What every family screen test needs: a signed-in PARENT or STUDENT, a
 * fake API answered by path, and the providers the screens read. Native
 * pieces the screens sit on are replaced here: the safe area with its own
 * jest mock, the router with one whose pushes a test can read.
 */
export const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => ({}) }));
jest.mock("react-native-safe-area-context", () => {
  const mock = jest.requireActual("react-native-safe-area-context/jest/mock");
  return mock.default ?? mock;
});

/** Ids in the shape the contracts' cuid regex accepts. Only ZZ data. */
export const ID = {
  child: "czz0000000000000000child1",
  child2: "czz0000000000000000child2",
  slot: "czz00000000000000000slot1",
  booking: "czz000000000000000000bkg1",
  post: "czz000000000000000000post1",
  card: "czz000000000000000000card1",
  work: "czz000000000000000000work1",
};

export const ME_PARENT = {
  user: { id: "u-parent", name: "ZZ Parent", preferredName: null, email: "p@zz.test", avatarKey: null, isMinor: false, locale: "en" },
  active: { schoolId: null, role: "PARENT", membershipId: null },
  contexts: [{ schoolId: null, schoolName: null, role: "PARENT" }],
};
export const ME_STUDENT = {
  user: { id: "u-pupil", name: "ZZ Pupil", preferredName: null, email: null, avatarKey: null, isMinor: true, locale: "en" },
  active: { schoolId: "s1", role: "STUDENT", membershipId: "m-pupil" },
  contexts: [{ schoolId: "s1", schoolName: "ZZ School", role: "STUDENT" }],
};

export function child(id: string, name: string, extra: Record<string, unknown> = {}) {
  return { guardianshipId: `g-${id}`, studentMembershipId: id, studentUserId: `u-${id}`, name, schoolId: "s1", schoolName: "ZZ School", leftAt: null, relation: "mother", ...extra };
}
export const HEADER = { studentMembershipId: ID.child, studentUserId: `u-${ID.child}`, name: "ZZ Asha", avatarKey: null, schoolId: "s1", schoolName: "ZZ School", gradeLevel: "5", leftAt: null };
export const LESSON = { id: "l1", periodId: "p1", periodName: "Period 1", startMinute: 540, endMinute: 585, subject: "ZZ Maths", room: "Room 4", teacherMembershipId: "tm1", teacherName: "ZZ Teacher", coveringMembershipId: null, coveringName: null, uncovered: false };
export const SUMMARY = { counts: { PRESENT: 18, LATE: 1, ABSENT: 1, EXCUSED: 0 }, total: 20, percent: 95, recent: [{ dateKey: "2026-09-04", status: "PRESENT", note: null }] };

export type Answer = (init: RequestInit | undefined, url: URL) => Response | object | Promise<Response | object>;

/** A request that never answers, so a screen stays in its loading state. */
export const pending: Answer = () => new Promise<Response>(() => {});
/** The API's error envelope with a status. */
export const refused =
  (status: number, error = "ZZ refused"): Answer =>
  () =>
    new Response(JSON.stringify({ error, code: "SERVER" }), { status });

export function fakeApi(answers: Record<string, Answer>): jest.Mock {
  const fetch = jest.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    const answer = answers[url.pathname];
    if (!answer) return new Response(JSON.stringify({ error: `No answer for ${url.pathname}`, code: "NOT_FOUND" }), { status: 404 });
    const out = await answer(init, url);
    return out instanceof Response ? out : new Response(JSON.stringify(out), { status: 200 });
  });
  __setApiClient(createApiClient({ baseUrl: "http://api.test", getToken: () => "t", fetch: fetch as unknown as typeof globalThis.fetch }));
  return fetch;
}

/** Render a screen signed in as `me`, with the API answering by path. */
export async function renderFamily(ui: ReactElement, me: object, answers: Record<string, Answer>) {
  mockRouter.push.mockClear();
  __setKeyStore(memoryStore({ [KEYS.token]: "t" }));
  const fetch = fakeApi({ "/api/v1/me": () => me, ...answers });
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const wrap = (node: ReactNode) => (
    <QueryClientProvider client={qc}>
      <SessionProvider>{node}</SessionProvider>
    </QueryClientProvider>
  );
  const result = await renderApp(wrap(ui));
  return { fetch, ...result };
}

/** The calls the fake fetch saw for one path. */
export function calls(fetch: jest.Mock, path: string): { url: URL; init: RequestInit | undefined }[] {
  return fetch.mock.calls.map((c) => ({ url: new URL(String(c[0])), init: c[1] as RequestInit | undefined })).filter((c) => c.url.pathname === path);
}
export function bodyOf(call: { init: RequestInit | undefined }): unknown {
  return JSON.parse(String(call.init?.body));
}

/**
 * A press or a typed value through RNTL's userEvent, which awaits React's
 * commit: with React 19 the state a press sets is not on screen inside a
 * bare fireEvent, so an assertion straight after would read the old screen.
 */
type Pressable = Parameters<ReturnType<typeof userEvent.setup>["press"]>[0];
export async function press(element: Pressable): Promise<void> {
  await userEvent.setup().press(element);
}
export async function type(element: Pressable, text: string): Promise<void> {
  await userEvent.setup().type(element, text);
}
