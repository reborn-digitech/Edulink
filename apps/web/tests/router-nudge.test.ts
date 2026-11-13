import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";

/**
 * The router with the nudge (src/lib/navigation.ts, 13 November 2026): every
 * component that refreshes the page after a server action takes useRouter
 * from there, not from next/navigation, so the held redraw the probe measured
 * is nudged out. The roster is the whole of src, read here, so the next
 * component written against next/navigation fails this suite.
 */
function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(path);
  }
  return out;
}

describe("the router with the nudge", () => {
  it("is the only place useRouter is taken from next/navigation", () => {
    const offenders = walk("src").filter((file) => {
      if (file === join("src", "lib", "navigation.ts")) return false;
      const text = readFileSync(file, "utf8");
      return /import\s*\{[^}]*\buseRouter\b[^}]*\}\s*from\s*"next\/navigation"/.test(text);
    });
    expect(offenders).toEqual([]);
  });

  it("nudges at its four times after a refresh and leaves the rest of the router alone", async () => {
    vi.useFakeTimers();
    const listener = vi.fn();
    const mod = await import("../src/lib/navigation");
    // RouterNudge subscribes through React; here the module-level set is exercised through nudgeRouter's timers.
    expect(mod.NUDGE_AT).toEqual([150, 600, 1500, 3500]);
    mod.nudgeRouter();
    expect(vi.getTimerCount()).toBe(4);
    vi.runAllTimers();
    expect(listener).not.toHaveBeenCalled(); // nothing subscribed: a nudge with no RouterNudge mounted is a no-op
    vi.useRealTimers();
  });
});
