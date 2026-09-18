import { Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { createApiClient } from "@edulink/api-client";
import { __setApiClient } from "@/lib/api";
import { openAppSettings, PickError, takePhotoAndUpload } from "@/lib/camera";

const permission = ImagePicker.requestCameraPermissionsAsync as jest.Mock;
const camera = ImagePicker.launchCameraAsync as jest.Mock;

function clientAnswering(respond: (init: RequestInit) => Response) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetch = jest.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return respond(init);
  });
  __setApiClient(createApiClient({ baseUrl: "http://api.test", getToken: () => "t", fetch: fetch as unknown as typeof globalThis.fetch }));
  return { fetch, calls };
}

afterEach(() => {
  permission.mockReset();
  camera.mockReset();
  __setApiClient(null);
});

describe("photographing work for a hand-in", () => {
  it("asks for the camera alone, and a refusal is reported as denied with nothing uploaded", async () => {
    permission.mockResolvedValue({ granted: false, status: "denied" });
    const { fetch } = clientAnswering(() => new Response("{}", { status: 201 }));
    await expect(takePhotoAndUpload("Could not upload")).resolves.toEqual({ denied: true });
    expect(camera).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("backing out of the camera uploads nothing and resolves to null", async () => {
    permission.mockResolvedValue({ granted: true, status: "granted" });
    camera.mockResolvedValue({ canceled: true, assets: null });
    const { fetch } = clientAnswering(() => new Response("{}", { status: 201 }));
    await expect(takePhotoAndUpload("Could not upload")).resolves.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("a photo taken is re-encoded as an image without EXIF and posted as multipart to /api/v1/uploads", async () => {
    permission.mockResolvedValue({ granted: true, status: "granted" });
    camera.mockResolvedValue({ canceled: false, assets: [{ uri: "file:///cache/IMG_1.jpg", fileName: "IMG_1.jpg", mimeType: "image/jpeg", width: 3000, height: 4000 }] });
    const { calls } = clientAnswering(() => new Response(JSON.stringify({ fileId: "file_9", mime: "image/jpeg", size: 88 }), { status: 201 }));
    await expect(takePhotoAndUpload("Could not upload")).resolves.toEqual({ picked: { fileId: "file_9", mime: "image/jpeg", size: 88, name: "IMG_1.jpg" } });
    expect(camera).toHaveBeenCalledWith(expect.objectContaining({ mediaTypes: ["images"], exif: false, quality: 0.7 }));
    expect(calls[0]!.url).toBe("http://api.test/api/v1/uploads");
    expect(calls[0]!.init.body).toBeInstanceOf(FormData);
  });

  it("a photo the camera did not name is given one, and the server's refusal is the error", async () => {
    permission.mockResolvedValue({ granted: true, status: "granted" });
    camera.mockResolvedValue({ canceled: false, assets: [{ uri: "file:///cache/x.jpg", fileName: null, mimeType: null }] });
    clientAnswering(() => new Response(JSON.stringify({ error: "Check the form.", code: "BAD_REQUEST", issues: { file: "That picture is too big." } }), { status: 422 }));
    await expect(takePhotoAndUpload("Could not upload")).rejects.toEqual(new PickError("That picture is too big."));
  });

  it("opens the phone's settings for a refused permission and swallows a platform that cannot", async () => {
    const open = jest.spyOn(Linking, "openSettings").mockRejectedValue(new Error("no settings"));
    openAppSettings();
    expect(open).toHaveBeenCalled();
    open.mockRestore();
  });
});
