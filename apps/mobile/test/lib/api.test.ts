import { __setApiClient, api, API_BASE, errorText, setApiLocale } from "@/lib/api";
import { __setKeyStore, KEYS, memoryStore } from "@/lib/storage";

describe("the one API client", () => {
  afterEach(() => {
    __setApiClient(null);
    __setKeyStore(null);
    setApiLocale("en");
  });

  it("has a base with no trailing slash and is built once", () => {
    expect(API_BASE.endsWith("/")).toBe(false);
    __setApiClient(null);
    expect(api()).toBe(api());
  });

  it("sends the stored token and the last-set language on every call", async () => {
    __setKeyStore(memoryStore({ [KEYS.token]: "tok-1" }));
    __setApiClient(null);
    const seen: Record<string, string>[] = [];
    const realFetch = globalThis.fetch;
    globalThis.fetch = (async (_url: string, init?: RequestInit) => {
      seen.push(init?.headers as Record<string, string>);
      return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
    }) as typeof fetch;
    try {
      setApiLocale("mr");
      await api().get("/api/v1/me");
      expect(seen[0]).toMatchObject({ Authorization: "Bearer tok-1", "Accept-Language": "mr" });
    } finally {
      globalThis.fetch = realFetch;
    }
  });

  it("shows the envelope's sentence, or the fallback when it is blank", () => {
    expect(errorText({ ok: false, error: "Not yours." }, "Something went wrong")).toBe("Not yours.");
    expect(errorText({ ok: false, error: "  " }, "Something went wrong")).toBe("Something went wrong");
  });
});
