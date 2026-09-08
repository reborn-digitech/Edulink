import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * "No inline styles for tokens": spacing, radii and type sizes come from
 * @edulink/tokens (th.space[n], th.radius.*, the Text variants), not from a
 * number typed into a style. Layout literals (flexDirection, flex, alignItems)
 * are fine and are not counted. The count is held to a floor the way the web
 * holds its i18n floor: it may fall, never rise, and the offenders are named
 * so a reviewer can see which are worth a token.
 */
const FLOOR = 0;
const SRC = join(__dirname, "..", "..", "src");
const TOKEN_PROPS = /\b(padding(?:Top|Bottom|Left|Right|Horizontal|Vertical)?|margin(?:Top|Bottom|Left|Right|Horizontal|Vertical)?|gap|rowGap|columnGap|borderRadius|fontSize|lineHeight)\s*:\s*(\d+(?:\.\d+)?)\b/g;
/** Hairlines and the two-pixel micro-gap are not tokens; everything else is. */
const ALLOWED = new Set(["0", "1", "2"]);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name: string) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : /\.tsx$/.test(name) ? [p] : [];
  });
}

describe("spacing and type sizes in styles", () => {
  it("come from the tokens, not from numbers typed into a screen (floor held)", () => {
    const offenders: string[] = [];
    for (const file of walk(SRC)) {
      const text = readFileSync(file, "utf8");
      text.split("\n").forEach((line, i) => {
        for (const m of line.matchAll(TOKEN_PROPS)) if (!ALLOWED.has(m[2]!)) offenders.push(`${relative(SRC, file)}:${i + 1} ${m[1]}: ${m[2]}`);
      });
    }
    if (offenders.length) console.log(`styles with typed numbers (${offenders.length}):\n  ${offenders.join("\n  ")}`);
    expect(offenders.length).toBeLessThanOrEqual(FLOOR);
  });
});
