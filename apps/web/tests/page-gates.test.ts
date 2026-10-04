import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";

/**
 * A PAGE GATES WITH THE PAGE GATE (load campaign LOAD-7, 4 October 2026).
 *
 * `requireUser` and `requireRole` redirect; `requireApi*` throw an AccessError
 * for a route handler or server action to answer as JSON. /experts/bookings/{id}
 * called `requireApiUser`, so a signed-out visit — every expired link —
 * answered the expected 307 from the layout while the page's render threw,
 * and the production log carried an error-level AccessError each time; a
 * monitor alerting on error lines would have fired on every one. Nothing else
 * in 862 fetches did it. The rule reads every page and layout's source; the
 * render proves the page now redirects to /login rather than throwing.
 */

const APP = join(process.cwd(), "src", "app");

function files(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...files(path));
    else if (/^(page|layout|template|default|not-found)\.tsx$/.test(name)) out.push(path);
  }
  return out;
}

describe("pages and layouts", () => {
  it("never call an API gate (requireApi*), which throws where a page must redirect", () => {
    const offenders = files(APP)
      .filter((f) => /\brequireApi[A-Za-z]*\s*\(/.test(readFileSync(f, "utf8")))
      .map((f) => relative(process.cwd(), f));
    expect(offenders).toEqual([]);
  });

  it("a signed-out /experts/bookings/{id} redirects to /login rather than throwing an AccessError", async () => {
    __resetCookies();
    __setHeaders({});
    const { default: BookingPage } = await import("@/app/(app)/experts/bookings/[bookingId]/page");
    const thrown = await BookingPage({ params: Promise.resolve({ bookingId: "zz-no-such-booking" }) }).then(
      () => null,
      (e: unknown) => e,
    );
    expect(thrown).not.toBeNull();
    expect((thrown as { name?: string }).name).not.toBe("AccessError");
    expect(String((thrown as { digest?: string }).digest)).toMatch(/^NEXT_REDIRECT;[a-z]+;\/login;307;/);
  });
});
