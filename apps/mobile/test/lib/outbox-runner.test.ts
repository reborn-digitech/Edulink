import { AppState } from "react-native";
import { createApiClient } from "@edulink/api-client";
import { __setApiClient } from "@/lib/api";
import { __setOutboxStore, enqueue, listQueued, memoryOutbox } from "@/lib/outbox";
import { __setReplayFetch, __stopOutboxRunner, flushOutbox, sendQueued, startOutboxRunner } from "@/lib/outbox-runner";
import { __setKeyStore, KEYS, memoryStore } from "@/lib/storage";

/** The reconnect runner: the replay header, the bearer token from storage, and a flush when the app comes back. */
function bench(status = 200) {
  const fetch: jest.Mock = jest.fn(async () => new Response(status === 200 ? '{"ok":true}' : '{"error":"ZZ no"}', { status }));
  __setKeyStore(memoryStore({ [KEYS.token]: "tok-zz" }));
  __setApiClient(createApiClient({ baseUrl: "http://api.test", getToken: () => "tok-zz", fetch: fetch as unknown as typeof globalThis.fetch }));
  __setReplayFetch(fetch as unknown as typeof globalThis.fetch);
  return fetch;
}

beforeEach(() => {
  __stopOutboxRunner();
  __setOutboxStore(memoryOutbox());
});

describe("the outbox runner", () => {
  it("replays a queued item as it was queued, with the replay header and the bearer token", async () => {
    const fetch = bench();
    const body = { classId: "c1", dateKey: "2026-09-07", marks: [] };
    await enqueue({ url: "/api/attendance", method: "POST", body: JSON.stringify(body), tag: "attendance:c1" });
    const [item] = await listQueued();
    expect(await sendQueued(item!)).toEqual({ status: 200 });
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(new URL(url).pathname).toBe("/api/attendance");
    expect(init.method).toBe("POST");
    expect(init.headers).toMatchObject({ "X-Edulink-Replay": "1", Authorization: "Bearer tok-zz", "Content-Type": "application/json" });
    expect(JSON.parse(String(init.body))).toEqual(body);
  });

  it("a network failure keeps the item; a refusal drops it", async () => {
    const fetch = bench();
    fetch.mockImplementation(async () => {
      throw new TypeError("Network request failed");
    });
    await enqueue({ url: "/api/v1/marks", method: "POST", body: "{}", tag: "marks" });
    expect(await flushOutbox()).toEqual({ sent: 0, failed: 1, remaining: 1 });
    bench(422);
    expect(await flushOutbox()).toEqual({ sent: 0, failed: 1, remaining: 0 });
  });

  it("flushes on start and again when the app returns to the foreground, wiring the listener once", async () => {
    const fetch = bench();
    await enqueue({ url: "/api/v1/messages", method: "POST", body: "{}", tag: "messages" });
    const listen = jest.spyOn(AppState, "addEventListener");
    startOutboxRunner();
    startOutboxRunner();
    expect(listen).toHaveBeenCalledTimes(1);
    await new Promise((r) => setTimeout(r, 0));
    expect(await listQueued()).toHaveLength(0);
    await enqueue({ url: "/api/v1/messages", method: "POST", body: "{}", tag: "messages" });
    const onChange = listen.mock.calls[0]![1] as (state: string) => void;
    onChange("background");
    expect(await listQueued()).toHaveLength(1);
    onChange("active");
    await new Promise((r) => setTimeout(r, 0));
    expect(await listQueued()).toHaveLength(0);
    expect(fetch).toHaveBeenCalledTimes(2);
    listen.mockRestore();
  });
});
