import { describe, expect, it, vi } from "vitest";
import { createApiClient } from "./index";

function fakeFetch(status: number, body: unknown, statusText = "") {
  return vi.fn(async () => new Response(body === null ? null : JSON.stringify(body), { status, statusText })) as unknown as typeof fetch;
}

describe("@edulink/api-client", () => {
  it("sends the bearer token, the language and a JSON body, and unwraps the data", async () => {
    const fetch = fakeFetch(200, { items: [], nextCursor: null });
    const api = createApiClient({ baseUrl: "https://app.example/", getToken: async () => "tok", getLocale: () => "hi", fetch });
    const result = await api.post<{ items: unknown[] }>("/api/v1/feed", { limit: 10 });
    expect(result).toEqual({ ok: true, data: { items: [], nextCursor: null } });
    const [url, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://app.example/api/v1/feed");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ Authorization: "Bearer tok", "Accept-Language": "hi", "Content-Type": "application/json" });
    expect(init.body).toBe('{"limit":10}');
  });

  it("omits the Authorization header when signed out", async () => {
    const fetch = fakeFetch(200, {});
    const api = createApiClient({ baseUrl: "https://app.example", getToken: () => null, fetch });
    await api.get("/api/v1/health");
    const [, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(init.headers).not.toHaveProperty("Authorization");
  });

  it("passes a readable error envelope through and labels a bare status", async () => {
    const api = createApiClient({ baseUrl: "https://app.example", getToken: () => "t", fetch: fakeFetch(422, { error: "Date is invalid.", issues: { dateKey: "Use yyyy-mm-dd." } }) });
    expect(await api.get("/api/v1/x")).toEqual({ ok: false, status: 422, error: "Date is invalid.", issues: { dateKey: "Use yyyy-mm-dd." } });

    const bare = createApiClient({ baseUrl: "https://app.example", getToken: () => "t", fetch: fakeFetch(401, null, "Unauthorized") });
    expect(await bare.get("/api/v1/x")).toEqual({ ok: false, status: 401, error: "Unauthorized", code: "UNAUTHORIZED" });
  });

  it("turns a dropped connection into a result rather than a throw", async () => {
    const fetch: typeof globalThis.fetch = vi.fn(async () => {
      throw new Error("Network request failed");
    });
    const api = createApiClient({ baseUrl: "https://app.example", getToken: () => "t", fetch });
    expect(await api.get("/api/v1/x")).toEqual({ ok: false, status: 0, error: "Network request failed", code: "SERVER" });
  });
});
