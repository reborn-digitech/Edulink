/**
 * @edulink/api-client — how the phone talks to `/api/v1`.
 *
 * Deliberately tiny: a base URL, a way to get the current bearer token, and
 * one `request` that turns any response into the `ApiResult` the contracts
 * package defines. No retries, no cache — the app's query layer owns those,
 * and putting them here would hide them from it. Typed endpoint methods
 * arrive with the endpoints themselves in Phase 3.
 */
import { apiErrorSchema, type ApiResult } from "@edulink/contracts";

export type ApiClientOptions = {
  baseUrl: string;
  /** Returns the bearer token, or null when signed out. May be async (secure storage). */
  getToken: () => Promise<string | null> | string | null;
  /** Language for the `Accept-Language` header so errors come back readable. */
  getLocale?: () => string;
  /** Injectable for tests and for React Native's own fetch. */
  fetch?: typeof fetch;
  /**
   * How long a request may take, answer and body together, before it is given up as a network failure (status 0)
   * (TA-149, 13 Nov 2026): React Native's Android client has no timeout of its own, so a connection that never answered
   * left Save busy for good and held the outbox's flush. An upload (a FormData body) is given UPLOAD_TIMEOUT_MS.
   */
  timeoutMs?: number;
  /**
   * Called when a request that carried a bearer is answered 401 (TA-145, 13 Nov 2026): the session ended on the server,
   * and the app confirms it and signs the person out wherever the 401 was met, not only when /api/v1/me met it.
   */
  onUnauthorized?: () => void;
};

/** The default limit of one request (TA-149). */
export const REQUEST_TIMEOUT_MS = 30_000;
/** The limit of one upload, whose body may take minutes on a slow network (TA-149). */
export const UPLOAD_TIMEOUT_MS = 180_000;

/**
 * One request's own settings. timeoutMs replaces the client's limit for this request alone: a door the server lets run
 * longer than REQUEST_TIMEOUT_MS (the assistant's answer, whose model call alone may take 90 s) passes a limit above
 * the server's own, so the phone does not give up on an answer that is still coming and send the question again.
 */
export type RequestOptions = { timeoutMs?: number };

export type ApiClient = {
  request<T>(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", path: string, body?: unknown, init?: RequestOptions): Promise<ApiResult<T>>;
  get<T>(path: string, init?: RequestOptions): Promise<ApiResult<T>>;
  post<T>(path: string, body?: unknown, init?: RequestOptions): Promise<ApiResult<T>>;
};

export function createApiClient(options: ApiClientOptions): ApiClient {
  const doFetch = options.fetch ?? globalThis.fetch;
  const base = options.baseUrl.replace(/\/+$/, "");

  async function request<T>(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", path: string, body?: unknown, init?: RequestOptions): Promise<ApiResult<T>> {
    const headers: Record<string, string> = { Accept: "application/json" };
    const token = await options.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (options.getLocale) headers["Accept-Language"] = options.getLocale();
    // A FormData body (an upload) goes as it is: fetch writes the multipart
    // boundary into Content-Type itself, and setting it here would break it.
    const multipart = typeof FormData !== "undefined" && body instanceof FormData;
    if (body !== undefined && !multipart) headers["Content-Type"] = "application/json";

    let response: Response;
    let text: string;
    // The answer and its body within one limit (TA-149): past it the request is aborted and answered as a network
    // failure. The race stands even where a fetch ignores the signal.
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const expired = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller?.abort();
        reject(new Error("Request timed out"));
      }, init?.timeoutMs ?? options.timeoutMs ?? (multipart ? UPLOAD_TIMEOUT_MS : REQUEST_TIMEOUT_MS));
    });
    try {
      response = await Promise.race([
        doFetch(`${base}${path.startsWith("/") ? path : `/${path}`}`, {
          method,
          headers,
          body: body === undefined ? undefined : multipart ? (body as FormData) : JSON.stringify(body),
          ...(controller ? { signal: controller.signal } : {}),
        }),
        expired,
      ]);
      // A body cut off part-way is a network failure too, not a throw (TA-149).
      text = await Promise.race([response.text(), expired]);
    } catch (cause) {
      // Offline, DNS, a dropped connection, no answer in time: the caller gets a shape it can show,
      // never an exception it has to remember to catch.
      return { ok: false, status: 0, error: cause instanceof Error ? cause.message : "Network error", code: "SERVER" };
    } finally {
      clearTimeout(timer);
    }

    if (response.status === 401 && token && options.onUnauthorized) {
      try {
        options.onUnauthorized();
      } catch {
        // The caller still gets its answer.
      }
    }

    const json: unknown = text ? safeJson(text) : null;

    if (response.ok) return { ok: true, data: json as T };

    const parsed = apiErrorSchema.safeParse(json);
    if (parsed.success) return { ok: false, status: response.status, ...parsed.data };
    return { ok: false, status: response.status, error: text || response.statusText || "Request failed", code: codeFor(response.status) };
  }

  return {
    request,
    get: (path, init) => request("GET", path, undefined, init),
    post: (path, body, init) => request("POST", path, body, init),
  };
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function codeFor(status: number) {
  if (status === 401) return "UNAUTHORIZED" as const;
  if (status === 403) return "FORBIDDEN" as const;
  if (status === 404) return "NOT_FOUND" as const;
  if (status === 409) return "CONFLICT" as const;
  if (status === 429) return "RATE_LIMITED" as const;
  if (status >= 500) return "SERVER" as const;
  return "BAD_REQUEST" as const;
}
