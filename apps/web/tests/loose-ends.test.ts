/**
 * The loose ends of the October build plan (18 Oct 2026): the small things the walk found and put right.
 *
 * 1. The evaluation runs' list said "No scores: the run ended before a set was scored." beside a run still running,
 *    pressed Start on /root/vidura-evals; the sentence is for a run that has ended.
 * 2. The website editor's "Share for review" panel opened from the button's right edge; on a phone the header's
 *    buttons wrap, the button sits near the left, and at 390 px the panel began 189 px off the screen.
 * 3. A reference link searched NPTEL, SWAYAM and YouTube for "Senior Secondary Course ECONOMICS (318)", a NIOS book's
 *    running head the chunker reads as the chapter (7,066 chunks of 144,824); the passage's section is the topic there.
 * 4. The viewport matrix put its actor back to English only after a passing cell, so a failed screenshot left the ZZ
 *    admin and the e2e teacher reading Hindi everywhere (the page sweep then met Hindi on their pages).
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ViduraEvalJob, ViduraEvals } from "@edulink/contracts";

// The app's components use the classic JSX runtime, which reads React from the global scope.
(globalThis as { React?: typeof React }).React = React;
vi.mock("@/components/vidura-ops/actions", () => ({ evalsStateAction: vi.fn(), startEvalAction: vi.fn(), stopEvalAction: vi.fn() }));

const { EvalsCard } = await import("@/components/vidura-ops/evals-card");
const { ToastProvider } = await import("@/components/ui/toast");
const { I18nProvider } = await import("@/lib/i18n/provider");
const { dictionaryAsset } = await import("@/lib/i18n/asset");

const NO_SCORES = "No scores: the run ended before a set was scored.";

function job(state: ViduraEvalJob["state"]): ViduraEvalJob {
  return {
    id: `job-${state}`,
    state,
    request: { sets: ["help"], limit: 30 },
    progress: { phase: "RUNNING", set: "help", setIndex: 1, setsTotal: 1, done: 5, total: 30, passed: 4, casesDone: 5, seconds: 20, contended: false },
    scores: null,
    gate: null,
    startedBy: "ZZ Platform Operator",
    startedServers: [],
    error: null,
    createdAt: "2026-10-18T09:45:00.000Z",
    startedAt: "2026-10-18T09:45:01.000Z",
    finishedAt: null,
    heartbeatAt: "2026-10-18T09:45:20.000Z",
  };
}

function render(state: ViduraEvals): string {
  const node = React.createElement(EvalsCard, { initial: state });
  return renderToStaticMarkup(
    React.createElement(I18nProvider, { locale: "en", href: dictionaryAsset("en").href } as Parameters<typeof I18nProvider>[0], React.createElement(ToastProvider, null, node)),
  ).replace(/&quot;/g, '"');
}

describe("the evaluation runs' list", () => {
  it("says nothing about an ended run beside a run still running", () => {
    const running = job("RUNNING");
    const html = render({ current: running, recent: [running], servers: [], modelBusy: false });
    expect(html).toContain("Stop");
    expect(html).not.toContain(NO_SCORES);
  });

  it("still says a stopped run ended before a set was scored", () => {
    const stopped = { ...job("STOPPED"), finishedAt: "2026-10-18T09:46:00.000Z" };
    const html = render({ current: stopped, recent: [stopped], servers: [], modelBusy: false });
    expect(html).toContain(NO_SCORES);
  });
});

describe("the share-for-review panel", () => {
  it("opens from the button's left edge on a phone and its right edge from sm up", () => {
    const source = readFileSync(join(__dirname, "../src/app/(app)/admin/website/editor/share.tsx"), "utf8");
    const panel = /id=\{`\$\{id\}-share`\} className="([^"]+)"/.exec(source)?.[1] ?? "";
    const classes = panel.split(/\s+/);
    expect(classes).toContain("left-0");
    expect(classes).toContain("sm:left-auto");
    expect(classes).toContain("sm:right-0");
    expect(classes).not.toContain("right-0");
  });
});

describe("a reference link's topic", () => {
  it("passes over a NIOS course's running head for the passage's section", async () => {
    const { topicOf } = await import("@/lib/assistant/references");
    expect(topicOf({ chapter: "Senior Secondary Course ECONOMICS (318)", section: "DEMAND" })).toBe("DEMAND");
    expect(topicOf({ chapter: "SENIOR SECONDARY COURSE NATIONAL INSTITUTE OF OPEN SCHOOLING", section: "Price elasticity" })).toBe("Price elasticity");
    expect(topicOf({ chapter: "Secondary Course 213 - Social Science", section: null })).toBeNull();
    // A real chapter is still the topic, and a Wikipedia title still comes first.
    expect(topicOf({ chapter: "Chapter 3: Life Processes", section: "Nutrition" })).toBe("Life Processes");
    expect(topicOf({ chapter: "Senior Secondary Course ECONOMICS (318)", section: "DEMAND", attributionTitle: "Law of demand" })).toBe("Law of demand");
  });
});

describe("the viewport matrix", () => {
  it("puts its actor back to English in a finally, whatever the cell did", () => {
    const source = readFileSync(join(__dirname, "../e2e/viewport.spec.ts"), "utf8");
    expect(source).toMatch(/\}\s*finally\s*\{\s*await preferLocale\(actor\.email, "en"\);\s*\}/);
  });
});
