import { createApiClient } from "@edulink/api-client";
import { __setApiClient } from "@/lib/api";
import { pickAndUpload, PickError } from "@/lib/pick-file";

const mockPick = jest.fn();
jest.mock("expo-document-picker", () => ({ getDocumentAsync: (...args: unknown[]) => mockPick(...args) }));

function clientAnswering(respond: (init: RequestInit) => Response) {
  const calls: RequestInit[] = [];
  const fetch = jest.fn(async (_url: string, init: RequestInit) => {
    calls.push(init);
    return respond(init);
  });
  __setApiClient(createApiClient({ baseUrl: "http://api.test", getToken: () => "t", fetch: fetch as unknown as typeof globalThis.fetch }));
  return { fetch, calls };
}

afterEach(() => {
  mockPick.mockReset();
  __setApiClient(null);
});

describe("picking and uploading one file", () => {
  it("closing the picker uploads nothing and resolves to null", async () => {
    mockPick.mockResolvedValue({ canceled: true, assets: null });
    const { fetch } = clientAnswering(() => new Response("{}", { status: 201 }));
    await expect(pickAndUpload("image", "Could not upload")).resolves.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("asks the picker for images only, posts the file as multipart, and returns the server's id", async () => {
    mockPick.mockResolvedValue({ canceled: false, assets: [{ uri: "file:///cache/zz.png", name: "zz.png", mimeType: "image/png", size: 10 }] });
    const { calls } = clientAnswering(() => new Response(JSON.stringify({ fileId: "file_1", mime: "image/png", size: 10 }), { status: 201 }));
    await expect(pickAndUpload("image", "Could not upload")).resolves.toEqual({ fileId: "file_1", mime: "image/png", size: 10, name: "zz.png" });
    expect(mockPick).toHaveBeenCalledWith(expect.objectContaining({ type: ["image/*"], multiple: false }));
    expect(calls[0]!.body).toBeInstanceOf(FormData);
    expect((calls[0]!.headers as Record<string, string>)["Content-Type"]).toBeUndefined();
  });

  it("a refusal throws the server's own sentence for the file field", async () => {
    mockPick.mockResolvedValue({ canceled: false, assets: [{ uri: "file:///cache/big.mov", name: "big.mov", mimeType: "video/quicktime", size: 9 }] });
    clientAnswering(() => new Response(JSON.stringify({ error: "Check the form.", code: "BAD_REQUEST", issues: { file: "That file is too big." } }), { status: 422 }));
    await expect(pickAndUpload("media", "Could not upload")).rejects.toEqual(new PickError("That file is too big."));
  });

  it("a dropped connection throws the fallback's words, not a stack trace", async () => {
    mockPick.mockResolvedValue({ canceled: false, assets: [{ uri: "file:///cache/a.pdf", name: "a.pdf", mimeType: "application/pdf", size: 9 }] });
    __setApiClient(createApiClient({ baseUrl: "http://api.test", getToken: () => "t", fetch: (async () => { throw new TypeError(""); }) as unknown as typeof globalThis.fetch }));
    await expect(pickAndUpload("document", "Could not upload")).rejects.toEqual(new PickError("Could not upload"));
  });
});
