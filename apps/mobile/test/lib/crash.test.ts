import { waitFor } from "@testing-library/react-native";
import { appReportBodySchema } from "@edulink/contracts";
import { __setApiClient } from "@/lib/api";
import { __setKeyStore, KEYS, memoryStore, type KeyStore } from "@/lib/storage";
import { __resetCrashReporter, currentScreenName, describeCrash, installCrashReporter, sendPendingCrash, setCurrentScreen, STACK_LIMIT } from "@/lib/crash";

type Handler = (error: unknown, isFatal?: boolean) => void;
const utils = (globalThis as unknown as { ErrorUtils: { getGlobalHandler(): Handler; setGlobalHandler(h: Handler): void } }).ErrorUtils;
const original = utils.getGlobalHandler();

type Result = { ok: true; data: unknown } | { ok: false; status: number; error: string; code?: string };
function fakeClient(answer: () => Result) {
  const post = jest.fn(async (_path: string, _body: unknown): Promise<Result> => answer());
  __setApiClient({ get: jest.fn(), post, request: jest.fn() } as never);
  return post;
}

let store: KeyStore;
beforeEach(() => {
  store = memoryStore();
  __setKeyStore(store);
});
afterEach(() => {
  __resetCrashReporter();
  utils.setGlobalHandler(original);
  __setApiClient(null);
});

describe("a crash", () => {
  it("is described with the screen that was up, and its stack trimmed to the contract's limit", () => {
    setCurrentScreen("/(app)/marks");
    expect(currentScreenName()).toBe("/(app)/marks");
    const error = new TypeError("Cannot read x");
    error.stack = "TypeError: Cannot read x\n" + "    at frame\n".repeat(2000);
    const at = new Date("2026-09-08T10:00:00.000Z");
    const stored = describeCrash(error, at);
    expect(stored).toMatchObject({ message: "TypeError: Cannot read x", screen: "/(app)/marks", at: "2026-09-08T10:00:00.000Z" });
    expect(stored.stack).toHaveLength(STACK_LIMIT);
    expect(describeCrash("a string was thrown")).toMatchObject({ message: "a string was thrown", stack: undefined });
    expect(describeCrash("").message).toBe("Unknown error");
  });

  it("is stored by the global handler, which still calls the handler that was there before", async () => {
    const previous = jest.fn();
    utils.setGlobalHandler(previous);
    expect(installCrashReporter()).toBe(true);
    expect(installCrashReporter()).toBe(false);
    setCurrentScreen("/(app)/attendance");
    const boom = new Error("boom");
    utils.getGlobalHandler()(boom, true);
    await waitFor(async () => expect(await store.get(KEYS.crash)).not.toBeNull());
    const stored = JSON.parse((await store.get(KEYS.crash))!) as { message: string; screen: string; stack?: string; at: string };
    expect(stored.message).toBe("Error: boom");
    expect(stored.screen).toBe("/(app)/attendance");
    expect(stored.stack).toContain("boom");
    expect(Date.parse(stored.at)).not.toBeNaN();
    await waitFor(() => expect(previous).toHaveBeenCalledWith(boom, true));
  });

  it("the store refusing does not stop the previous handler", async () => {
    __setKeyStore({ ...memoryStore(), set: async () => { throw new Error("full"); } });
    const previous = jest.fn();
    utils.setGlobalHandler(previous);
    installCrashReporter();
    utils.getGlobalHandler()(new Error("x"), false);
    await waitFor(() => expect(previous).toHaveBeenCalled());
  });
});

describe("the pending crash", () => {
  const CRASH = { message: "Error: boom", stack: "Error: boom\n    at frame", screen: "/(app)/marks", at: "2026-09-08T10:00:00.000Z" };

  it("is nothing when there was none", async () => {
    const post = fakeClient(() => ({ ok: true, data: { reportId: "r", reference: "APP-1" } }));
    expect(await sendPendingCrash()).toBe("none");
    expect(post).not.toHaveBeenCalled();
  });

  it("is posted once, as a CRASH with the device attached, and cleared on a 2xx", async () => {
    await store.set(KEYS.crash, JSON.stringify(CRASH));
    const post = fakeClient(() => ({ ok: true, data: { reportId: "r", reference: "APP-1" } }));
    expect(await sendPendingCrash()).toBe("sent");
    expect(post).toHaveBeenCalledTimes(1);
    const [path, body] = post.mock.calls[0]!;
    expect(path).toBe("/api/v1/app/report");
    expect(appReportBodySchema.parse(body)).toEqual({
      kind: "CRASH",
      message: "Error: boom (2026-09-08T10:00:00.000Z)",
      screen: "/(app)/marks",
      stack: "Error: boom\n    at frame",
      device: { platform: "ios", os: "iOS", model: "Test", appVersion: "0.1.0", build: "1" },
    });
    expect(await store.get(KEYS.crash)).toBeNull();
    // A second call in the same start does nothing, whatever storage says.
    await store.set(KEYS.crash, JSON.stringify(CRASH));
    expect(await sendPendingCrash()).toBe("skipped");
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("is kept for the next start when the server refuses", async () => {
    await store.set(KEYS.crash, JSON.stringify(CRASH));
    fakeClient(() => ({ ok: false, status: 500, error: "Down", code: "SERVER" }));
    expect(await sendPendingCrash()).toBe("kept");
    expect(await store.get(KEYS.crash)).toBe(JSON.stringify(CRASH));
  });

  it("is kept when the phone is offline", async () => {
    await store.set(KEYS.crash, JSON.stringify(CRASH));
    fakeClient(() => ({ ok: false, status: 0, error: "Network request failed", code: "SERVER" }));
    expect(await sendPendingCrash()).toBe("kept");
    expect(await store.get(KEYS.crash)).toBe(JSON.stringify(CRASH));
  });

  it("a stored value that is not a crash is dropped, not posted", async () => {
    await store.set(KEYS.crash, "{not json");
    const post = fakeClient(() => ({ ok: true, data: {} }));
    expect(await sendPendingCrash()).toBe("none");
    expect(post).not.toHaveBeenCalled();
    expect(await store.get(KEYS.crash)).toBeNull();
  });
});
