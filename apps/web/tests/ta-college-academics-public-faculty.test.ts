/**
 * TA-424 (testing analysis of 13 November 2026, batch college-academics): the public faculty page had no rate
 * limit, though its API twin counts every address against the certificate check's budget (A3-S-8), so a scraper
 * walked college slugs through /public/faculty/<slug> instead of the door, two database reads a request.
 *
 * The page now reads once a request (React's cache, shared with its title) and counts the address in the door's
 * own bucket, "public-faculty", a hundred and twenty a quarter-hour; past it the page says to try again and reads
 * nothing. The library read is stubbed here (no college is needed to count); the limit is the real one, keyed on a
 * documentation address of this run's own, whose one bucket row is removed after.
 */
import { afterAll, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PrismaClient } from "@prisma/client";
import { __resetCookies, __setHeaders } from "./stubs/next-headers";

// Vitest compiles the app's .tsx with the classic JSX runtime (React.createElement), which Next does not.
(globalThis as { React?: typeof React }).React = React;

const reads = vi.hoisted(() => ({ n: 0 }));
vi.mock("@/lib/faculty-profile", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/faculty-profile")>()),
  publicFaculty: async () => {
    reads.n += 1;
    return { collegeName: "ZZ TACP College", profiles: [] };
  },
}));

import PublicFacultyPage from "@/app/public/faculty/[slug]/page";

const db = new PrismaClient();
const STAMP = Date.now();
// A documentation address (RFC 3849) of this run's own, so no other caller's bucket is touched.
const ADDRESS = `2001:db8::${(STAMP % 0xffff).toString(16)}:${Math.floor(STAMP / 0xffff) % 0xffff}`;

afterAll(async () => {
  __resetCookies();
  __setHeaders({});
  await db.rateLimit.deleteMany({ where: { bucket: `public-faculty:${ADDRESS}` } });
  await db.$disconnect();
});

describe("the public faculty page's limit (TA-424)", () => {
  it("TA-424: the 121st request from one address in a quarter-hour is refused, and reads nothing", async () => {
    __resetCookies();
    __setHeaders({ "x-forwarded-for": ADDRESS });
    const render = async () => renderToStaticMarkup(await PublicFacultyPage({ params: Promise.resolve({ slug: `zz-tacp-${STAMP}` }) }));
    for (let i = 0; i < 120; i += 1) expect(await render()).not.toContain('data-testid="faculty-limited"');
    expect(reads.n).toBe(120);
    const refused = await render();
    expect(refused).toContain('data-testid="faculty-limited"');
    expect(reads.n).toBe(120);
  });
});
