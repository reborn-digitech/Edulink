import { describe, expect, it } from "vitest";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * ⚠ EVERY NOTIFICATION DESTINATION MUST BE A ROUTE THAT EXISTS.
 *
 * Six URLs in `mentoring.ts` pointed at `/parent/mentoring/…`,
 * `/expert/mentoring/…` and `/student/margdarshak/…`. None of those directories
 * have ever existed, so every mentoring notification this app has sent — in the
 * app and by push — led to a 404, and nearly 7,400 stored rows carried one.
 *
 * NOTHING EXISTING COULD HAVE CAUGHT IT, which is why this file is shaped the
 * way it is. Unit tests exercise functions, and the function was fine: it stored
 * exactly the string it was given. `npm run sweep` follows the NAVIGATION, and a
 * URL that lives only inside a notification is one the navigation never
 * mentions. The gap was between a string and the filesystem, so this test is
 * between a string and the filesystem too.
 *
 * IT READS SOURCE RATHER THAN CALLING ANYTHING, deliberately. Provoking all six
 * notifications needs an expert, a pupil, a guardian, a school, consent and a
 * posted message — six fixtures to check six string literals, and a setup that
 * elaborate is one that gets deleted the first time it breaks. Reading the
 * literals finds a wrong one written tomorrow just as well.
 */

const APP_DIR = join(process.cwd(), "src", "app");

/** Every `url:` literal any library hands to `notify` / `notifyGuardians`. */
function notificationUrls(file: string): string[] {
  const source = readFileSync(join(process.cwd(), file), "utf8");
  return [...source.matchAll(/url:\s*[`"']([^`"']+)[`"']/g)]
    .map((m) => m[1]!)
    .filter((url) => url.startsWith("/"));
}

/**
 * Does a URL correspond to a real App Router page?
 *
 * Walks the directory tree the way Next.js does: a literal segment must match a
 * directory, `${…}` matches a `[param]`, and route groups like `(app)` are
 * transparent — they organise files and do not appear in URLs, which is the part
 * a naive path check gets wrong.
 */
function routeExists(url: string): boolean {
  const path = url.split("?")[0]!.split("#")[0]!;
  const segments = path.split("/").filter(Boolean);

  function walk(dir: string, rest: string[]): boolean {
    if (!existsSync(dir)) return false;
    if (rest.length === 0) {
      return existsSync(join(dir, "page.tsx")) || existsSync(join(dir, "route.ts"));
    }
    const [head, ...tail] = rest;
    const entries = readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory());

    for (const entry of entries) {
      const name = entry.name;
      // A route group is not part of the URL: descend without consuming.
      if (name.startsWith("(") && name.endsWith(")")) {
        if (walk(join(dir, name), rest)) return true;
        continue;
      }
      // An interpolation can only be a dynamic segment; a literal must match by
      // name, or fall through to one.
      const isParam = name.startsWith("[");
      const matches = head!.includes("${") ? isParam : name === head || isParam;
      if (matches && walk(join(dir, name), tail)) return true;
    }
    return false;
  }

  return walk(APP_DIR, segments);
}

/* -------------------------------------------------------------------------- */

describe("the route matcher itself", () => {
  // ⚠ A CHECK THAT CANNOT FAIL PROVES NOTHING. If `routeExists` returned true
  // for everything, every assertion below would pass while the bug stood. These
  // pin both answers before anything relies on it.
  it("finds real routes, including through a route group", () => {
    expect(routeExists("/mentoring")).toBe(true);
    // Lives at src/app/(app)/mentoring/[threadId] — the group is not in the URL.
    expect(routeExists("/mentoring/${threadId}")).toBe(true);
    expect(routeExists("/parent/attendance")).toBe(true);
    expect(routeExists("/verify")).toBe(true);
    // A route handler, not a page.
    expect(routeExists("/magic")).toBe(true);
  });

  it("⚠ refuses the three that did not exist", () => {
    // The actual bug, pinned. These must never pass again.
    expect(routeExists("/parent/mentoring/${threadId}")).toBe(false);
    expect(routeExists("/expert/mentoring/${threadId}")).toBe(false);
    expect(routeExists("/student/margdarshak/${threadId}")).toBe(false);
  });

  it("refuses a directory with no page in it", () => {
    expect(routeExists("/nonsense")).toBe(false);
    expect(routeExists("/parent/attendance/deeper")).toBe(false);
  });
});

describe("every notification destination", () => {
  /**
   * ⚠ DERIVED FROM THE FILESYSTEM, NOT LISTED BY HAND, and the first draft did
   * list them by hand. That draft named `grades.ts` and `posts.ts`, which are
   * called `grading.ts` and `bulletin.ts`, and missed six senders entirely —
   * then hid both mistakes behind a `.filter(existsSync)` so the suite went
   * green while covering two-thirds of what it claimed.
   *
   * A hand-written list of "everywhere that does X" is the same shape of bug as
   * the one this file exists to catch: a string somebody has to remember to keep
   * in step with the code. So it asks the code.
   */
  const SENDERS = readdirSync(join(process.cwd(), "src", "lib"))
    .filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts"))
    .map((name) => `src/lib/${name}`)
    .filter((file) => {
      const source = readFileSync(join(process.cwd(), file), "utf8");
      return /\bnotify(Guardians)?\(/.test(source);
    })
    // notify.ts is the sender itself; its `/notifications` default is not a
    // destination somebody chose.
    .filter((file) => !file.endsWith("notify.ts"));

  it("⚠ found the senders at all", () => {
    // A derived list that derived nothing would pass every assertion below for
    // the worst possible reason.
    expect(SENDERS.length).toBeGreaterThanOrEqual(10);
    expect(SENDERS).toContain("src/lib/mentoring.ts");
  });

  for (const file of SENDERS) {
    it(`in ${file} resolves to a real route`, () => {
      const urls = notificationUrls(file);
      const dead = urls.filter((url) => !routeExists(url));
      expect(dead, `${file} links to ${dead.join(", ")}`).toEqual([]);
    });
  }

  it("⚠ mentoring emits six thread links, and every one is /mentoring/…", () => {
    // The COUNT matters as much as the shape: a regex that matched nothing would
    // satisfy "none of them are dead" perfectly.
    const threadLinks = notificationUrls("src/lib/mentoring.ts").filter((u) => u.includes("${"));
    expect(threadLinks).toHaveLength(6);
    for (const url of threadLinks) {
      expect(url.startsWith("/mentoring/${")).toBe(true);
    }
  });
});
