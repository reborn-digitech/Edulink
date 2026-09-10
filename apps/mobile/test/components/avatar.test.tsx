import { screen } from "@testing-library/react-native";
import { en } from "@edulink/i18n/en";
import { translatorFor } from "@edulink/i18n";
import { Avatar, AVATAR_PRESETS, CREATURES, describeAvatar, initials, PALETTES, parseAvatarKey } from "@/components/avatar";
import { renderApp } from "../utils";

const t = translatorFor(en);

describe("avatars", () => {
  it("offers the web's 72 presets, twelve creatures in six palettes, each once", () => {
    expect(CREATURES).toHaveLength(12);
    expect(PALETTES).toHaveLength(6);
    expect(AVATAR_PRESETS).toHaveLength(72);
    expect(new Set(AVATAR_PRESETS).size).toBe(72);
    expect(AVATAR_PRESETS[0]).toBe("preset:fox-sunset");
    expect(AVATAR_PRESETS.every((key) => parseAvatarKey(key) !== null)).toBe(true);
  });

  it("names a preset the way the web does, and anything else plainly", () => {
    expect(describeAvatar("preset:fox-sunset", t)).toBe("Sunset fox");
    expect(describeAvatar("preset:cat-mint", t)).toBe("Mint cat");
    expect(describeAvatar("preset:dragon-sunset", t)).toBe("Avatar");
    expect(describeAvatar(null, t)).toBe("Avatar");
    expect(parseAvatarKey("upload:abc")).toBeNull();
  });

  it("draws a preset as an image named by the person", async () => {
    await renderApp(<Avatar avatarKey="preset:owl-sky" name="ZZ Asha" size={48} />);
    expect(screen.getByRole("image", { name: "ZZ Asha" })).toBeTruthy();
    expect(screen.queryByText("ZA")).toBeNull();
  });

  it("falls back to the initials when there is no preset", async () => {
    await renderApp(<Avatar avatarKey={null} name="ZZ Head Teacher" size={64} />);
    expect(screen.getByRole("image", { name: "ZZ Head Teacher" })).toBeTruthy();
    expect(screen.getByText("ZT")).toBeTruthy();
    expect(initials("asha")).toBe("A");
    expect(initials("  ")).toBe("?");
  });

  it("inside a control that names itself, the drawing is not announced again", async () => {
    await renderApp(<Avatar avatarKey="preset:fox-sunset" name="Sunset fox" decorative />);
    expect(screen.queryByRole("image")).toBeNull();
  });
});
