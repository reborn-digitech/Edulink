import { describe, expect, it } from "vitest";
import { translator } from "@/lib/i18n/dictionary";

const t = translator("en");
import { AVATAR_PRESETS, CREATURES, PALETTES, describeAvatar, fallbackKey } from "./avatar";

/**
 * Regression suite for the avatar fallback.
 *
 * The original implementation used a signed `>>` shift, so any seed whose hash
 * exceeded 2^31 produced a negative array index, `undefined`, and a crash on
 * `.id`. It reached production-looking code because the handful of names tried
 * by hand all happened to hash low. These tests sweep enough seeds to make that
 * impossible to miss again.
 */

describe("fallbackKey", () => {
  it("returns a valid preset for a large sweep of names", () => {
    const valid = new Set(AVATAR_PRESETS);
    for (let i = 0; i < 5000; i++) {
      const key = fallbackKey(`student-${i}`);
      expect(valid.has(key), `seed student-${i} produced ${key}`).toBe(true);
    }
  });

  it("handles names that hash into the top half of the uint32 range", () => {
    // Long names are the ones that overflow 2^31 — the exact case that crashed
    // the admin dashboard for "Riverside Primary School".
    const seeds = [
      "Riverside Primary School",
      "Priya Raman",
      "Oakfield Academy Sixth Form College",
      "a".repeat(200),
      "Zzzzzzzzzzzzzzzzzzzzzzzzzzzz",
    ];
    for (const seed of seeds) {
      expect(() => fallbackKey(seed)).not.toThrow();
      expect(AVATAR_PRESETS).toContain(fallbackKey(seed));
    }
  });

  it("is stable — the same name always gets the same avatar", () => {
    expect(fallbackKey("Amara Okafor")).toBe(fallbackKey("Amara Okafor"));
  });

  it("copes with empty and unicode names", () => {
    for (const seed of ["", " ", "李雷", "Chloé", "🙂"]) {
      expect(AVATAR_PRESETS).toContain(fallbackKey(seed));
    }
  });

  it("spreads across the catalogue rather than collapsing onto one avatar", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 500; i++) seen.add(fallbackKey(`name ${i}`));
    // Not a distribution proof, just a guard against a constant-output bug.
    expect(seen.size).toBeGreaterThan(20);
  });
});

describe("catalogue", () => {
  it("offers more than the 50 avatars the spec asks for", () => {
    expect(AVATAR_PRESETS.length).toBe(CREATURES.length * PALETTES.length);
    expect(AVATAR_PRESETS.length).toBeGreaterThanOrEqual(50);
  });

  it("has unique creature and palette ids", () => {
    expect(new Set(CREATURES.map((c) => c.id)).size).toBe(CREATURES.length);
    expect(new Set(PALETTES.map((p) => p.id)).size).toBe(PALETTES.length);
  });

  it("describes every preset in words, for the avatar picker's labels", () => {
    for (const key of AVATAR_PRESETS) {
      const described = describeAvatar(key, t);
      expect(described).not.toBe("Avatar");
      expect(described.length).toBeGreaterThan(3);
      // Composed through the dictionary, so no raw key may leak out.
      expect(described).not.toMatch(/avatar\./);
    }
  });

  it("falls back gracefully for a malformed or unknown key", () => {
    expect(describeAvatar("preset:dragon-neon", t)).toBe("Avatar");
    expect(describeAvatar("upload:abc", t)).toBe("Avatar");
    expect(describeAvatar("", t)).toBe("Avatar");
  });
});
