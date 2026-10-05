import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { translator } from "@/lib/i18n/dictionary";
import { PLACEMENT_DEFAULTS } from "@/lib/placement";

/**
 * G4-24 (risks batch, 5 Oct 2026; the owner keeps the rules, the page says them): the placement analytics page
 * prints what its figures mean — placed is an offer made and not declined, the one-offer rule with the college's
 * dream ratio, and drives limited to one gender off by default — in en, hi and mr, with no raw key.
 */
const KEYS = ["risksWeb.placementDefsTitle", "risksWeb.placementDefPlaced", "risksWeb.placementDefOneOffer", "risksWeb.placementDefGenderOff", "risksWeb.placementDefGenderOn"] as const;

describe("the placement analytics page prints its definitions (G4-24)", () => {
  it("each definition reads in English, Hindi and Marathi, never as its key", () => {
    for (const code of ["en", "hi", "mr"] as const) {
      const t = translator(code);
      for (const key of KEYS) {
        const text = t(key, { ratio: PLACEMENT_DEFAULTS.dreamRatio });
        expect(text, `${code} ${key}`).not.toContain("risksWeb.");
        expect(text, `${code} ${key}`).not.toContain("{");
      }
      expect(t("risksWeb.placementDefOneOffer", { ratio: 1.5 })).toContain("1.5");
    }
    const en = translator("en");
    expect(en("risksWeb.placementDefPlaced")).toMatch(/not declined/);
    expect(en("risksWeb.placementDefGenderOff")).toMatch(/default/);
  });

  it("the page shows them, with the college's own ratio and gender setting", () => {
    const page = readFileSync(join(process.cwd(), "src", "app/(app)/placement/analytics/page.tsx"), "utf8");
    expect(page).toContain('data-testid="placement-definitions"');
    expect(page).toContain('t("risksWeb.placementDefPlaced")');
    expect(page).toContain('t("risksWeb.placementDefOneOffer", { ratio: settings.dreamRatio })');
    expect(page).toContain('settings.allowGenderRule ? "risksWeb.placementDefGenderOn" : "risksWeb.placementDefGenderOff"');
  });
});
