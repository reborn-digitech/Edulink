/**
 * QA-60 (QA campaign of 24 October 2026): the expert's profile failed hydration on every load. The calendar card drew
 * the feed's address relative on the server and absolute in the browser in the same first render, so React threw
 * the tree away. The first render is now the same with and without a window (the server's, relative); the browser
 * makes it absolute on its next render, after hydration.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToString } from "react-dom/server";
import { translator } from "@/lib/i18n/dictionary";

(globalThis as { React?: typeof React }).React = React;
// The words and the toast are the providers' business, not this test's: English, and a toast that does nothing.
vi.mock("@/lib/i18n", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/lib/i18n")>()), useT: () => translator("en") }));
vi.mock("@/components/ui/toast", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/components/ui/toast")>()), useToast: () => ({ toast() {} }) }));
const { CalendarCard } = await import("@/app/(app)/expert/profile/calendar-card");
const FEED = "/api/v1/expert/calendar.ics?token=zz-feed-token";

const draw = () => renderToString(React.createElement(CalendarCard, { initialUrl: FEED }));
const feedIn = (html: string) => /data-testid="calendar-url"[^>]*>([^<]*)</.exec(html)?.[1] ?? null;

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

describe("the expert's calendar card hydrates (QA-60)", () => {
  it("draws the same first render on the server and in a browser: the address as the server gave it", () => {
    const server = draw();
    (globalThis as { window?: unknown }).window = { location: { origin: "http://localhost:3000" } };
    const browserFirst = draw();
    expect(feedIn(server)).toBe(FEED.replace(/&/g, "&amp;"));
    expect(feedIn(browserFirst)).toBe(feedIn(server));
  });
});
