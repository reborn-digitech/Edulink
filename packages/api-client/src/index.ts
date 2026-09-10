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
};

export type ApiClient = {
  request<T>(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", path: string, body?: unknown): Promise<ApiResult<T>>;
  get<T>(path: string): Promise<ApiResult<T>>;
  post<T>(path: string, body?: unknown): Promise<ApiResult<T>>;
};

export function createApiClient(options: ApiClientOptions): ApiClient {
  const doFetch = options.fetch ?? globalThis.fetch;
  const base = options.baseUrl.replace(/\/+$/, "");

  async function request<T>(method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", path: string, body?: unknown): Promise<ApiResult<T>> {
    const headers: Record<string, string> = { Accept: "application/json" };
    const token = await options.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    if (options.getLocale) headers["Accept-Language"] = options.getLocale();
    // A FormData body (an upload) goes as it is: fetch writes the multipart
    // boundary into Content-Type itself, and setting it here would break it.
    const multipart = typeof FormData !== "undefined" && body instanceof FormData;
    if (body !== undefined && !multipart) headers["Content-Type"] = "application/json";

    let response: Response;
    try {
      response = await doFetch(`${base}${path.startsWith("/") ? path : `/${path}`}`, {
        method,
        headers,
        body: body === undefined ? undefined : multipart ? (body as FormData) : JSON.stringify(body),
      });
    } catch (cause) {
      // Offline, DNS, a dropped connection: the caller gets a shape it can show,
      // never an exception it has to remember to catch.
      return { ok: false, status: 0, error: cause instanceof Error ? cause.message : "Network error", code: "SERVER" };
    }

    const text = await response.text();
    const json: unknown = text ? safeJson(text) : null;

    if (response.ok) return { ok: true, data: json as T };

    const parsed = apiErrorSchema.safeParse(json);
    if (parsed.success) return { ok: false, status: response.status, ...parsed.data };
    return { ok: false, status: response.status, error: text || response.statusText || "Request failed", code: codeFor(response.status) };
  }

  return {
    request,
    get: (path) => request("GET", path),
    post: (path, body) => request("POST", path, body),
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
