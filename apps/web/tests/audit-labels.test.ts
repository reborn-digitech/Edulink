import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { actionKey } from "@/lib/safety-labels";
import { en } from "@/lib/i18n/en";

/**
 * Every audit action the app writes has words to describe it.
 *
 * ⚠ WRITTEN BECAUSE SIXTY OF NINETY-THREE DID NOT. `describeAction` fell back to
 * the raw key for anything it did not know, which is the right fallback and
 * meant nothing ever failed — so the Safety Centre quietly answered "who changed
 * this?" with `timetable.slot.set` for two thirds of everything a school does.
 * Found by opening the audit tab and reading it, which is the only way it could
 * have been found: no type, no test and no lint rule connects the string passed
 * to `audit()` with the table that describes it.
 *
 * This is that connection. It reads the actions out of the source rather than
 * from a list somebody has to remember to update — a list would go stale in
 * exactly the way the map did.
 *
 * The scan is a regex over `action: "…"`, which is how every call site writes
 * it. If a caller ever builds the string dynamically this will not see it; that
 * would also make the action unreadable to a human scanning the log, so the
 * right fix then is to stop doing that rather than to loosen this.
 */

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(path));
    else if (/\.tsx?$/.test(entry.name) && !entry.name.endsWith(".test.ts")) out.push(path);
  }
  return out;
}

function actionsWritten(): Set<string> {
  const found = new Set<string>();
  for (const file of [...walk("src/app"), ...walk("src/lib")]) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(/\baction:\s*"([a-z][a-z0-9.]*)"/g)) {
      found.add(match[1]!);
    }
  }
  return found;
}

/** `"audit.classCreate"` → the value, or undefined. */
function lookup(key: string): string | undefined {
  const leaf = key.split(".")[1]!;
  return (en.audit as Record<string, string>)[leaf];
}

describe("the audit log has words for everything it records", () => {
  const written = actionsWritten();

  it("finds the actions in the source at all", () => {
    // A guard on the guard: if the regex ever stops matching, every check below
    // passes vacuously and this file becomes decoration.
    expect(written.size).toBeGreaterThan(80);
    expect(written).toContain("attendance.mark");
  });

  it("⚠ describes every action it writes", () => {
    const undescribed = [...written].filter((action) => actionKey(action) === null).sort();
    expect(
      undescribed,
      `No wording for: ${undescribed.join(", ")}. Add an entry to ACTION_KEYS in ` +
        "safety-labels.ts and the matching key under `audit` in en.ts, hi.ts and mr.ts. " +
        "Without one the Safety Centre shows the raw key to a school admin.",
    ).toEqual([]);
  });

  it("⚠ every key it points at actually resolves", () => {
    // A key with no dictionary entry renders as the key, which looks exactly
    // like having no key at all — so the check above alone is not enough.
    const dangling = [...written]
      .map((action) => actionKey(action))
      .filter((key): key is NonNullable<typeof key> => key !== null)
      .filter((key) => !lookup(key));
    expect(dangling, "keys with no English value").toEqual([]);
  });
});
