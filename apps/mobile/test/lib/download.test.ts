import { Platform } from "react-native";
import * as Sharing from "expo-sharing";
import { setApiLocale } from "@/lib/api";
import { __setKeyStore, KEYS, memoryStore } from "@/lib/storage";
import { __setDownloadFetch, bytesApi, clearSharedFiles, safeName, shareBytes } from "@/lib/download";

/** The bytes a PDF starts with, "%PDF". */
const PDF = new Uint8Array([0x25, 0x50, 0x44, 0x46]);
type Written = { uri: string; written: Uint8Array | string | null };
const lastWritten = () => (globalThis as { __lastWrittenFile?: Written }).__lastWrittenFile;

function answering(respond: () => Response | Promise<Response>) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetch = jest.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return respond();
  });
  __setDownloadFetch(fetch as unknown as typeof globalThis.fetch);
  return calls;
}

const os = Platform.OS;
beforeEach(() => {
  __setKeyStore(memoryStore({ [KEYS.token]: "zz-token" }));
  setApiLocale("hi");
  (Sharing.shareAsync as jest.Mock).mockReset().mockResolvedValue(undefined);
  delete (globalThis as { __lastWrittenFile?: Written }).__lastWrittenFile;
});
afterEach(() => {
  __setDownloadFetch(null);
  Platform.OS = os;
});

describe("fetching a file the API renders", () => {
  it("carries the bearer token and the language, and answers with the bytes and their type", async () => {
    const calls = answering(() => new Response(PDF, { status: 200, headers: { "content-type": "application/pdf; charset=binary" } }));
    const got = await bytesApi.get("/api/v1/shared/report-cards/c1/pdf", "Could not fetch it");
    expect(got).toEqual({ ok: true, bytes: PDF, mime: "application/pdf" });
    expect(calls[0]!.url).toBe("http://localhost:3000/api/v1/shared/report-cards/c1/pdf");
    expect(calls[0]!.init.method).toBe("GET");
    expect(calls[0]!.init.headers).toMatchObject({ Authorization: "Bearer zz-token", "Accept-Language": "hi" });
  });

  it("signed out, no Authorization header goes; an untyped answer is an octet stream", async () => {
    __setKeyStore(memoryStore({}));
    const calls = answering(() => new Response(PDF, { status: 200 }));
    const got = await bytesApi.get("/api/v1/shared/report-cards/c1/pdf", "Could not fetch it");
    expect(got.ok && got.mime).toBe("application/octet-stream");
    expect(calls[0]!.init.headers).not.toHaveProperty("Authorization");
  });

  it("a refusal is the server's own sentence when it sends one, else the fallback; a dropped connection is its message", async () => {
    answering(() => new Response(JSON.stringify({ error: "ZZ Not your card.", code: "FORBIDDEN" }), { status: 403 }));
    expect(await bytesApi.get("/api/v1/x", "Could not fetch it")).toEqual({ ok: false, error: "ZZ Not your card." });
    answering(() => new Response("<html>gateway</html>", { status: 502 }));
    expect(await bytesApi.get("/api/v1/x", "Could not fetch it")).toEqual({ ok: false, error: "Could not fetch it" });
    answering(() => {
      throw new TypeError("Network request failed");
    });
    expect(await bytesApi.get("/api/v1/x", "Could not fetch it")).toEqual({ ok: false, error: "Network request failed" });
    answering(() => {
      throw new Error("");
    });
    expect(await bytesApi.get("/api/v1/x", "Could not fetch it")).toEqual({ ok: false, error: "Could not fetch it" });
  });
});

describe("handing the file to the share sheet", () => {
  it("on the phone writes the bytes to the cache under a safe name and opens the sheet on that file", async () => {
    Platform.OS = "ios";
    answering(() => new Response(PDF, { status: 200, headers: { "content-type": "application/pdf" } }));
    const got = await bytesApi.get("/api/v1/shared/report-cards/c1/pdf", "Could not share it");
    if (!got.ok) throw new Error(got.error);
    await expect(shareBytes(got, "Term 1: ZZ/Asha.pdf", "Could not share it")).resolves.toBeNull();
    const file = lastWritten();
    expect(file?.uri).toBe("file:///cache/relay-shared-Term 1 ZZ Asha.pdf");
    expect(file?.written).toEqual(PDF);
    expect(Sharing.shareAsync).toHaveBeenCalledWith("file:///cache/relay-shared-Term 1 ZZ Asha.pdf", { mimeType: "application/pdf", UTI: "com.adobe.pdf", dialogTitle: "Term 1: ZZ/Asha.pdf" });
  });

  it("what was shared stays in the cache until sign-out removes it, and only the app's own files go", async () => {
    Platform.OS = "ios";
    const cache = (globalThis as { __cacheFiles?: Map<string, unknown> }).__cacheFiles!;
    cache.clear();
    answering(() => new Response(PDF, { status: 200, headers: { "content-type": "application/pdf" } }));
    const got = await bytesApi.get("/api/v1/shared/report-cards/c1/pdf", "Could not share it");
    if (!got.ok) throw new Error(got.error);
    await shareBytes(got, "Term 1.pdf", "Could not share it");
    await shareBytes(got, "Term 2.pdf", "Could not share it");
    // Something else in the cache directory is not ours to remove.
    const { File, Paths } = jest.requireMock("expo-file-system") as { File: new (...p: unknown[]) => { write(c: string): void }; Paths: { cache: { uri: string } } };
    new File(Paths.cache, "image-cache.bin").write("x");
    expect(cache.size).toBe(3);
    expect(await clearSharedFiles()).toBe(2);
    expect([...cache.keys()]).toEqual(["file:///cache/image-cache.bin"]);
    Platform.OS = "web";
    expect(await clearSharedFiles()).toBe(0);
  });

  it("a sheet that will not open is the fallback, and a file that is not a PDF carries no UTI", async () => {
    Platform.OS = "android";
    (Sharing.shareAsync as jest.Mock).mockRejectedValue(new Error("no sheet"));
    await expect(shareBytes({ bytes: PDF, mime: "application/zip" }, "cards.zip", "Could not share it")).resolves.toBe("Could not share it");
    expect(Sharing.shareAsync).toHaveBeenCalledWith("file:///cache/relay-shared-cards.zip", { mimeType: "application/zip", UTI: undefined, dialogTitle: "cards.zip" });
  });

  it("on the web target a blob link saves the file the way a browser does", async () => {
    Platform.OS = "web";
    const clicked: { href: string; download: string }[] = [];
    const anchor = { href: "", download: "", click: () => clicked.push({ href: anchor.href, download: anchor.download }), remove: jest.fn() };
    const doc = { createElement: jest.fn(() => anchor), body: { appendChild: jest.fn() } };
    const g = globalThis as { document?: unknown; URL: typeof URL };
    const hadDocument = "document" in g;
    const previous = g.document;
    g.document = doc;
    const create = jest.spyOn(g.URL, "createObjectURL").mockReturnValue("blob:zz");
    const revoke = jest.spyOn(g.URL, "revokeObjectURL").mockImplementation(() => {});
    try {
      await expect(shareBytes({ bytes: PDF, mime: "application/pdf" }, "Term 1.pdf", "Could not share it")).resolves.toBeNull();
      expect(clicked).toEqual([{ href: "blob:zz", download: "Term 1.pdf" }]);
      expect(doc.body.appendChild).toHaveBeenCalledWith(anchor);
      expect(anchor.remove).toHaveBeenCalled();
      expect(revoke).toHaveBeenCalledWith("blob:zz");
      expect(Sharing.shareAsync).not.toHaveBeenCalled();
    } finally {
      create.mockRestore();
      revoke.mockRestore();
      if (hadDocument) g.document = previous;
      else delete g.document;
    }
  });

  it("a title becomes a file name without separators or control characters, and never an empty one", () => {
    expect(safeName('Term 1: "ZZ" <A/B> | C?*')).toBe("Term 1 ZZ A B C");
    expect(safeName("a\tb\nc")).toBe("a b c");
    expect(safeName("  ")).toBe("file");
  });
});
