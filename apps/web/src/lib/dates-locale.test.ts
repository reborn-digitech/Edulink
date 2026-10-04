import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { formatDateKey, formatMonthKey } from "./dates";

/**
 * B-15 (4 Oct 2026): a Marathi page read "Wed, 09/09/2026" and "Usage ·
 * 2026-10". The formatter already took the reader's locale; the callers
 * did not pass it, and a page printed a month key raw. These pin the
 * formatter's words in each language and hold every page to passing the
 * locale wherever the date has a word in it.
 */
describe("a date's words follow the reader", () => {
  it("the default shape names the weekday in Marathi and Hindi, with Latin digits", () => {
    const mr = formatDateKey("2026-09-09", undefined, "mr");
    const hi = formatDateKey("2026-09-09", undefined, "hi");
    expect(mr).toMatch(/^बुध/);
    expect(hi).toMatch(/^बुध/);
    for (const s of [mr, hi]) {
      expect(s).not.toMatch(/Wed/);
      expect(s).toContain("09/09/2026");
    }
    expect(formatDateKey("2026-09-09")).toBe("Wed, 09/09/2026");
  });

  it("a month key is a heading in the reader's words, never the raw key", () => {
    expect(formatMonthKey("2026-10")).toBe("October 2026");
    expect(formatMonthKey("2026-10", "mr")).toBe("ऑक्टोबर 2026");
    // ICU's Hindi spelling of October varies by release (त or ट); the shape does not.
    expect(formatMonthKey("2026-10", "hi")).toMatch(/^[\u0900-\u097F]+ 2026$/);
    expect(formatMonthKey("not-a-month")).toBe("not-a-month");
  });
});

/** The arguments of each `name(` call in a source text, split at the top level. */
function calls(src: string, name: string): string[][] {
  const out: string[][] = [];
  const re = new RegExp(`(?<![A-Za-z0-9_])${name}\\(`, "g");
  for (let m = re.exec(src); m; m = re.exec(src)) {
    if (/function\s+$/.test(src.slice(Math.max(0, m.index - 12), m.index))) continue;
    const args: string[] = [];
    let depth = 1;
    let arg = "";
    for (let i = m.index + m[0].length; i < src.length && depth > 0; i++) {
      const c = src[i]!;
      if ("({[".includes(c)) depth++;
      if (")}]".includes(c)) depth--;
      if (depth === 0) break;
      if (depth === 1 && c === ",") {
        args.push(arg.trim());
        arg = "";
      } else arg += c;
    }
    if (arg.trim()) args.push(arg.trim());
    out.push(args);
  }
  return out;
}

describe("every page passes the reader's locale to a date with words in it", () => {
  it("no formatDateKey on a page leaves the weekday to English", () => {
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name)) {
          const src = readFileSync(p, "utf8");
          if (!src.includes("formatDateKey(")) continue;
          for (const args of calls(src, "formatDateKey")) {
            // The default options name the weekday; so does any `weekday:` option, and a month heading (a month name with no day).
            const opts = args[1] ?? "";
            const wordy = args.length === 1 || /weekday/.test(opts) || (/month:\s*"(short|long)"/.test(opts) && !/day:/.test(opts));
            if (wordy && args.length < 3) offenders.push(`${p}: formatDateKey(${args.join(", ")})`);
          }
        }
      }
    };
    walk("src/app");
    walk("src/components");
    expect(offenders).toEqual([]);
  });
});
