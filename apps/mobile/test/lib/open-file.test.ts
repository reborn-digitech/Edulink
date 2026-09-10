import { createApiClient } from "@edulink/api-client";
import { __setApiClient, API_BASE } from "@/lib/api";
import { openFile } from "@/lib/open-file";

const mockOpen = jest.fn();
jest.mock("expo-web-browser", () => ({ openBrowserAsync: (...args: unknown[]) => mockOpen(...args) }));

function answering(respond: () => Response) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetch = jest.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return respond();
  });
  __setApiClient(createApiClient({ baseUrl: "http://api.test", getToken: () => "t", fetch: fetch as unknown as typeof globalThis.fetch }));
  return calls;
}

afterEach(() => {
  mockOpen.mockReset();
  __setApiClient(null);
});

describe("opening a file outside the app", () => {
  it("asks for a five-minute link and opens it in the browser sheet", async () => {
    const calls = answering(() => new Response(JSON.stringify({ url: "/api/files/zz.pdf?t=123.abc", expiresAt: "2026-09-10T10:05:00.000Z" }), { status: 200 }));
    mockOpen.mockResolvedValue({ type: "opened" });
    await expect(openFile("zz.pdf", "Could not open it")).resolves.toBeNull();
    expect(calls[0]!.url).toBe("http://api.test/api/v1/files/zz.pdf/link");
    expect(calls[0]!.init.method).toBe("POST");
    expect(mockOpen).toHaveBeenCalledWith(`${API_BASE}/api/files/zz.pdf?t=123.abc`);
  });

  it("a file the person may not read is the server's sentence, and nothing opens", async () => {
    answering(() => new Response(JSON.stringify({ error: "ZZ That file is not here.", code: "NOT_FOUND" }), { status: 404 }));
    await expect(openFile("zz.pdf", "Could not open it")).resolves.toBe("ZZ That file is not here.");
    expect(mockOpen).not.toHaveBeenCalled();
  });

  it("a malformed answer or a browser that will not open is the fallback sentence", async () => {
    answering(() => new Response(JSON.stringify({ url: "https://elsewhere.test/x" }), { status: 200 }));
    await expect(openFile("zz.pdf", "Could not open it")).resolves.toBe("Could not open it");
    answering(() => new Response(JSON.stringify({ url: "/api/files/zz.pdf?t=1.a", expiresAt: "2026-09-10T10:05:00.000Z" }), { status: 200 }));
    mockOpen.mockRejectedValue(new Error("no browser"));
    await expect(openFile("zz.pdf", "Could not open it")).resolves.toBe("Could not open it");
  });
});
