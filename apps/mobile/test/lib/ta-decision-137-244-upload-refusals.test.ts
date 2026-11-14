/**
 * TA-137 and TA-244 (decided 14 November 2026): the upload door now takes a phone's video of up to 100 MB itself, and
 * with that it refuses in two new ways before reading a byte: 429 while the person's earlier uploads are still on
 * their way or the server is holding all it will, and 413 for a body past the largest file. The phone's code did not
 * change for it; this pins that the picker hands the person the server's own sentence for each, and not the fallback,
 * so "try again shortly" is what they read.
 */
import { createApiClient } from "@edulink/api-client";
import { __setApiClient } from "@/lib/api";
import { pickAndUpload, PickError } from "@/lib/pick-file";

const mockPick = jest.fn();
jest.mock("expo-document-picker", () => ({ getDocumentAsync: (...args: unknown[]) => mockPick(...args) }));

function doorAnswering(status: number, body: Record<string, unknown>, headers: Record<string, string> = {}) {
  const fetch = jest.fn(async () => new Response(JSON.stringify(body), { status, headers }));
  __setApiClient(createApiClient({ baseUrl: "http://api.test", getToken: () => "t", fetch: fetch as unknown as typeof globalThis.fetch }));
  return fetch;
}

afterEach(() => {
  mockPick.mockReset();
  __setApiClient(null);
});

describe("TA-137 / TA-244: the upload door's refusals, as the phone shows them", () => {
  beforeEach(() => {
    mockPick.mockResolvedValue({ canceled: false, assets: [{ uri: "file:///cache/zz-sports-day.mp4", name: "zz-sports-day.mp4", mimeType: "video/mp4", size: 90 * 1024 * 1024 }] });
  });

  it("TA-137: an upload refused while earlier ones are still arriving shows the server's 'try again shortly' sentence", async () => {
    const fetch = doorAnswering(429, { error: "Your earlier uploads are still on their way. Try again shortly.", code: "RATE_LIMITED", retryAfterSeconds: 5 }, { "Retry-After": "5" });
    await expect(pickAndUpload("media", "Could not upload")).rejects.toEqual(new PickError("Your earlier uploads are still on their way. Try again shortly."));
    // Once: the picker does not send the file again by itself.
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("TA-137: an upload refused while the server is holding all it will shows that sentence", async () => {
    doorAnswering(429, { error: "Too many files are being uploaded just now. Try again shortly.", code: "RATE_LIMITED", retryAfterSeconds: 5 }, { "Retry-After": "5" });
    await expect(pickAndUpload("media", "Could not upload")).rejects.toEqual(new PickError("Too many files are being uploaded just now. Try again shortly."));
  });

  it("TA-137: a body past the largest file shows the size sentence the door wrote for the file", async () => {
    doorAnswering(413, { error: "Check the form.", code: "BAD_REQUEST", issues: { file: "That file is too large. The limit is 100 MB." } });
    await expect(pickAndUpload("media", "Could not upload")).rejects.toEqual(new PickError("That file is too large. The limit is 100 MB."));
  });
});
