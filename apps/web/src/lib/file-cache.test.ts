import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

/**
 * Regression tests for a real leak.
 *
 * `authorizeFileRead` correctly refused a classmate access to another child's
 * submitted homework — and the classmate read it anyway, because the response
 * had been cached in the browser under `private, max-age=3600` from the owner's
 * own earlier request. The browser never asked the server, so the server being
 * right did not matter.
 *
 * The service worker had a worse version of the same bug: `/api/files/...` with
 * `destination === "image"` matched a CacheFirst rule holding entries for 30
 * days in a cache that is per-ORIGIN and survives sign-out.
 *
 * These are asserted against the source text rather than by booting a browser,
 * because the failure is a one-line header/matcher change that no functional
 * test would notice.
 */

const routeSource = readFileSync("src/app/api/files/[fileId]/route.ts", "utf8");
const swSource = readFileSync("src/sw.ts", "utf8");

describe("file response caching", () => {
  it("⚠ never lets an authorised file be stored by the browser", () => {
    // The non-public branch must be no-store. `private, max-age=N` is what
    // caused the leak.
    expect(routeSource).toMatch(/no-store/);
    const nonPublicBranch = routeSource.slice(routeSource.indexOf("function cacheControl"));
    // One exception, kept narrow (the quiz figures, 10 Oct 2026; held at the integration, 11 Oct 2026): a practice
    // question's drawing is the same for every reader, holds nothing personal and changes only as a new fileId, so it
    // alone may be kept a day. Every other non-public kind stays no-store.
    const withoutQuiz = nonPublicBranch.replace(/if \(kind === "quiz"\) return "private, max-age=86400, immutable";/, "");
    expect(withoutQuiz).not.toMatch(/private,\s*max-age=[1-9]/);
    expect(nonPublicBranch.match(/max-age=[1-9]\d*/g)).toEqual(["max-age=86400", "max-age=31536000"]);
  });

  it("still caches the public school logo hard", () => {
    expect(routeSource).toMatch(/public, max-age=31536000, immutable/);
  });

  it("applies the cache header on the 304 path too", () => {
    // A 304 that omits Cache-Control lets the previous (leaky) directive stand.
    const notModified = routeSource.slice(routeSource.indexOf("if-none-match"));
    expect(notModified).toMatch(/cacheControl\(access\.public(, access\.kind)?\)/);
  });
});

describe("service worker caching", () => {
  it("⚠ excludes /api/files/ from caching entirely", () => {
    expect(swSource).toMatch(/url\.pathname\.startsWith\("\/api\/files\/"\)/);
    // And does so with NetworkOnly, not a caching strategy.
    const filesRule = swSource.slice(
      swSource.indexOf('url.pathname.startsWith("/api/files/")'),
    );
    expect(filesRule.slice(0, 200)).toMatch(/NetworkOnly/);
  });

  it("⚠ the image rule no longer swallows /api/files/", () => {
    const imageRule = swSource.slice(swSource.indexOf('request.destination === "image"'));
    expect(imageRule.slice(0, 200)).toMatch(/!url\.pathname\.startsWith\("\/api\/files\/"\)/);
  });

  it("places the files rule BEFORE the generic /api/ and image rules", () => {
    // Serwist takes the first matching rule, so order is the guarantee.
    const filesAt = swSource.indexOf('url.pathname.startsWith("/api/files/")');
    const apiAt = swSource.indexOf('url.pathname.startsWith("/api/") && request.method === "GET"');
    const imageAt = swSource.indexOf('request.destination === "image"');
    expect(filesAt).toBeGreaterThan(-1);
    expect(filesAt).toBeLessThan(apiAt);
    expect(filesAt).toBeLessThan(imageAt);
  });

  it("still refuses to cache any API write", () => {
    expect(swSource).toMatch(/request\.method !== "GET"/);
  });
});
