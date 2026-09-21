import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createApiClient } from "@edulink/api-client";
import type { RoleCode } from "@edulink/contracts";
import { renderApp, untilRendered } from "../utils";
import { __setApiClient } from "@/lib/api";
import { __setDownloadFetch } from "@/lib/download";
import { __setKeyStore, KEYS, memoryStore } from "@/lib/storage";
import { SessionProvider } from "@/lib/session";

/**
 * The office's screens under test: a session for the role, React Query
 * without retries, and a fake fetch answered by "METHOD /path". An answer
 * may throw to stand in for a dropped connection (status 0).
 */
export type Answer = (req: { url: URL; init: RequestInit }) => Response | Promise<Response>;
export type Answers = Record<string, Answer>;

export function me(role: RoleCode) {
  return {
    user: { id: "u1", name: "ZZ Head", preferredName: null, email: "head@zz.test", avatarKey: null, isMinor: false, locale: "en" },
    active: { schoolId: "s1", role, membershipId: "m1" },
    contexts: [{ schoolId: "s1", schoolName: "ZZ School", role }],
  };
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

export const refused = (error: string, status = 500): Answer => () => json({ error, code: "SERVER" }, status);
export const offline: Answer = () => {
  throw new TypeError("Network request failed");
};

/** An answer held back until the test opens it, so the loading state is there to be seen. */
export function gated(): { answer: Answer; open: (make: () => Response) => void } {
  let make: (() => Response) | null = null;
  let release: () => void = () => {};
  const opened = new Promise<void>((resolve) => {
    release = resolve;
  });
  return {
    answer: () => (make ? make() : opened.then(() => make!())),
    open: (next) => {
      make = next;
      release();
    },
  };
}

/**
 * What a test may change about the harness: `me` replaces the whole /api/v1/me
 * answer, for a person with no school context at all — the server operator or
 * the content team, whose `active` is empty and whose flag sits on `user`.
 */
export type MountOptions = { me?: unknown };

export async function mountStaff(ui: ReactElement, role: RoleCode, answers: Answers, options: MountOptions = {}) {
  __setKeyStore(memoryStore({ [KEYS.token]: "t" }));
  const fetch = jest.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    if (url.pathname !== "/api/v1/me") await untilRendered();
    const method = init?.method ?? "GET";
    const answer = answers[`${method} ${url.pathname}`];
    if (answer) return answer({ url, init: init ?? {} });
    if (url.pathname === "/api/v1/me") return json(options.me ?? me(role));
    return json({ error: "Not found", code: "NOT_FOUND" }, 404);
  });
  __setApiClient(createApiClient({ baseUrl: "http://api.test", getToken: () => "t", fetch: fetch as unknown as typeof globalThis.fetch }));
  __setDownloadFetch(fetch as unknown as typeof globalThis.fetch);
  // No retries so an error shows at once; no gc timers, which would keep the runner alive.
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  const rendered = await renderApp(
    <QueryClientProvider client={client}>
      <SessionProvider>{ui}</SessionProvider>
    </QueryClientProvider>,
  );
  /** Every request made, as "METHOD /path?query" with the parsed JSON body. */
  const calls = () =>
    fetch.mock.calls.map(([input, init]) => {
      const url = new URL(String(input));
      const body = typeof init?.body === "string" ? (JSON.parse(init.body) as unknown) : undefined;
      return { line: `${init?.method ?? "GET"} ${url.pathname}${url.search}`, body };
    });
  return { ...rendered, fetch, calls };
}
