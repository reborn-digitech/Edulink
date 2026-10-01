import { Platform, Share } from "react-native";
import { copyText } from "@/lib/copy";

describe("copyText", () => {
  afterEach(() => jest.restoreAllMocks());

  it("on a device hands the text to the share sheet and says whether anything was chosen", async () => {
    const share = jest.spyOn(Share, "share").mockResolvedValue({ action: Share.sharedAction });
    expect(await copyText("GEZD", "Two-step sign-in")).toBe(true);
    expect(share).toHaveBeenCalledWith({ message: "GEZD", title: "Two-step sign-in" });
    share.mockResolvedValue({ action: Share.dismissedAction });
    expect(await copyText("GEZD")).toBe(false);
    share.mockRejectedValue(new Error("no sheet"));
    expect(await copyText("GEZD")).toBe(false);
  });

  it("on the web target writes the browser's clipboard, and says no when there is none or it refuses", async () => {
    const os = Platform.OS;
    Object.defineProperty(Platform, "OS", { value: "web", configurable: true });
    const g = globalThis as { navigator?: unknown };
    const had = Object.getOwnPropertyDescriptor(globalThis, "navigator");
    try {
      const writeText = jest.fn(async () => {});
      Object.defineProperty(globalThis, "navigator", { value: { clipboard: { writeText } }, configurable: true });
      expect(await copyText("GEZD")).toBe(true);
      expect(writeText).toHaveBeenCalledWith("GEZD");
      writeText.mockRejectedValue(new Error("denied"));
      expect(await copyText("GEZD")).toBe(false);
      Object.defineProperty(globalThis, "navigator", { value: {}, configurable: true });
      expect(await copyText("GEZD")).toBe(false);
    } finally {
      if (had) Object.defineProperty(globalThis, "navigator", had);
      else delete g.navigator;
      Object.defineProperty(Platform, "OS", { value: os, configurable: true });
    }
  });
});
