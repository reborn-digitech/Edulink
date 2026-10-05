import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { APP_SEGMENTS } from "@/lib/role-gate";

/**
 * The loading, empty and module-off states every page shares (audit of
 * 5 October 2026, A3-states-3, -9 and -10). Each rule reads the source, so it
 * holds on pages no walk visits.
 */

const APP = join(process.cwd(), "src", "app");

function pages(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? pages(path) : name.endsWith(".tsx") ? [path] : [];
  });
}

describe("a navigation shows the frame and a skeleton at once (A3-states-3)", () => {
  // Signed-in sections with their own shell: every segment of app/(app), and /account, /root, /appadmin.
  const sections = [...APP_SEGMENTS.map((s) => join("(app)", s)), "account", "root", "appadmin"];

  it("every signed-in section has a loading.tsx that draws the PageSkeleton", () => {
    const missing = sections.filter((s) => {
      const file = join(APP, s, "loading.tsx");
      return !existsSync(file) || !/<PageSkeleton\b/.test(readFileSync(file, "utf8"));
    });
    expect(missing).toEqual([]);
  });
});

describe("a module that is off still gives the page its heading and, for the office, the way to switch it on (A3-states-9, -10)", () => {
  it("a page that answers with ModuleOff alone passes `page`, so the module's name is the page's h1", () => {
    const bad: string[] = [];
    for (const file of [...pages(APP), ...pages(join(process.cwd(), "src", "components"))]) {
      const text = readFileSync(file, "utf8");
      for (const m of text.matchAll(/return\s*\(?\s*<ModuleOff\b([^>]*)>/g)) {
        if (!/\bpage\b/.test(m[1] ?? "")) bad.push(`${relative(process.cwd(), file)}:${text.slice(0, m.index).split("\n").length}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("ModuleOff links the office to Settings, Modules", () => {
    const text = readFileSync(join(process.cwd(), "src", "components", "module-off.tsx"), "utf8");
    expect(text).toContain('href="/admin/settings/modules"');
  });
});

describe("an instant prints the app's way, not the server's locale (A3-journeys-31, A3-states-7)", () => {
  it("no page prints a Date with a bare toLocaleString, toLocaleDateString or toLocaleTimeString", () => {
    // The server printed "5/10/2026, 3:07:17 pm" and the browser "10/5/2026, 3:07:17 PM": US style on the dev box and a
    // hydration error on /expert/profile. formatInZone / formatDate / momentFormatter (lib/school-zone.ts) print dd/mm/yyyy.
    const bad: string[] = [];
    for (const file of [...pages(APP), ...pages(join(process.cwd(), "src", "components"))]) {
      const text = readFileSync(file, "utf8");
      for (const m of text.matchAll(/new Date\([^()]*(?:\([^()]*\))?[^()]*\)\.toLocale(?:Date|Time)?String\(\)/g)) {
        bad.push(`${relative(process.cwd(), file)}:${text.slice(0, m.index).split("\n").length}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
