import { readFileSync } from "node:fs";
import { createElement, type ReactElement } from "react";
import { describe, expect, it } from "vitest";
import { Slot } from "./slot";

/**
 * Regression suite for `asChild`.
 *
 * `/bulletin` returned 500 for every role in production while dev served it
 * happily. The cause was one line: slot.tsx carried "use client" while its only
 * caller, `Button`, is a server component. That pushed the child element across
 * the RSC boundary, and a serialised child arrives as an unresolved lazy
 * reference rather than an element — which `Children.only` rejects with
 * "expected to receive a single React element child".
 *
 * It only bit when a page rendered enough elements for React to defer one, so
 * most routes stayed green and the failure looked data-dependent. The guard
 * below is deliberately about the directive rather than the symptom: the symptom
 * needs a production build and a streaming boundary to reproduce, and a test
 * that needs those is a test nobody runs.
 */

describe("stays renderable in both trees", () => {
  it("is NOT a client component", () => {
    const source = readFileSync(new URL("./slot.tsx", import.meta.url), "utf8");
    const firstCode = source
      .split("\n")
      .map((line) => line.trim())
      .find((line) => line.length > 0 && !line.startsWith("//"));

    expect(
      firstCode?.startsWith('"use client"') || firstCode?.startsWith("'use client'"),
      'slot.tsx must stay shared: "use client" here sends Button\'s child across ' +
        "the RSC boundary and Children.only throws on the serialised result.",
    ).toBe(false);
  });
});

describe("prop merging", () => {
  it("renders the child's element type, not a wrapper", () => {
    const out = Slot({
      children: createElement("a", { href: "/bulletin/new" }),
    }) as ReactElement<Record<string, unknown>>;

    expect(out.type).toBe("a");
    expect(out.props.href).toBe("/bulletin/new");
  });

  it("merges the parent's className onto the child", () => {
    const out = Slot({
      children: createElement("a", { className: "text-sm" }),
      className: "rounded-md",
    }) as ReactElement<{ className?: string }>;

    // Both survive; hand-written expectation rather than a re-run of cn().
    expect(out.props.className).toContain("rounded-md");
    expect(out.props.className).toContain("text-sm");
  });

  it("passes the parent's other props through to the child", () => {
    const out = Slot({
      children: createElement("a", {}),
      "aria-busy": true,
    }) as ReactElement<Record<string, unknown>>;

    expect(out.props["aria-busy"]).toBe(true);
  });

  it("lets the child win when both set the same prop", () => {
    // The child is the real element, so its own href is authoritative.
    const out = Slot({
      children: createElement("a", { href: "/child" }),
      href: "/parent",
    }) as ReactElement<Record<string, unknown>>;

    expect(out.props.href).toBe("/child");
  });

  it("rejects more than one child rather than silently dropping one", () => {
    expect(() =>
      Slot({ children: [createElement("a", { key: "a" }), createElement("b", { key: "b" })] }),
    ).toThrow();
  });
});
