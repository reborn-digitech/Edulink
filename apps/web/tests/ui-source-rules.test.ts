import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Rules about how a page is WRITTEN that the browser walk of 4 October 2026
 * found broken on pages no gate had opened (college pages, floating actions,
 * 1280 px). Each rule here reads the source, so it holds on a page that no
 * axe run ever visits; the axe gate (e2e/axe.spec.ts) still checks the
 * rendered result where it walks.
 */

const SRC = join(process.cwd(), "src");

function sources(dir = SRC): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...sources(path));
    else if (path.endsWith(".tsx")) out.push(path);
  }
  return out;
}

/** Each JSX opening tag (`<div …>`, `<CardBody …>`) whose attributes mention `needle`, with its file and line. */
function openingTags(needle: RegExp): { file: string; line: number; tag: string }[] {
  const hits: { file: string; line: number; tag: string }[] = [];
  for (const file of sources()) {
    const text = readFileSync(file, "utf8");
    for (const m of text.matchAll(/<([A-Za-z][\w.]*)\b((?:[^<>]|=>|\{[^{}]*\})*)>/g)) {
      if (!needle.test(m[2] ?? "")) continue;
      hits.push({ file: relative(process.cwd(), file), line: text.slice(0, m.index).split("\n").length, tag: m[0] });
    }
  }
  return hits;
}

describe("scrollable regions are reachable by keyboard (B-06)", () => {
  it("every element that scrolls sideways is the TableScroll wrapper, or takes focus and is positioned itself", () => {
    // A list of links or tabs scrolls with its own focusable children, which is what axe asks; a <pre> on the dev mailbox is not a page.
    // `relative`: an sr-only column header is absolutely placed, and without a positioned scroller it escapes the clip and
    // widens the page (/admin/academics, +67 px at 390, and /account/payslips).
    const fine = (tag: string) => (/tabIndex=\{0\}/.test(tag) && /className="[^"]*\brelative\b/.test(tag)) || /^<(ul|nav|pre)\b/.test(tag);
    const bad = openingTags(/overflow-x-auto/)
      .filter((h) => !h.file.endsWith("components/ui/table-scroll.tsx") && !fine(h.tag))
      .map((h) => `${h.file}:${h.line}`);
    expect(bad).toEqual([]);
  });
});

describe("a hidden file input is not an unlabelled control (B-08)", () => {
  it("every sr-only file input is named, or is out of the tab order and hidden behind the button that opens it", () => {
    const bad = openingTags(/type="file"/)
      .filter((h) => /className="[^"]*\bsr-only\b/.test(h.tag))
      .filter((h) => !/aria-label=/.test(h.tag) && !(/tabIndex=\{-1\}/.test(h.tag) && /aria-hidden="true"/.test(h.tag)))
      // …or has an id that a <label htmlFor> in the same file names.
      .filter((h) => {
        const id = /\bid="([^"]+)"/.exec(h.tag)?.[1];
        return !id || !readFileSync(h.file, "utf8").includes(`htmlFor="${id}"`);
      })
      .map((h) => `${h.file}:${h.line}`);
    expect(bad).toEqual([]);
  });
});

describe("design tokens reach the CSS (A3-states-1)", () => {
  it("no utility names a CSS variable in square brackets, which Tailwind 4 prints as a bare value and the browser drops", () => {
    // Tailwind 4 reads a bracketed bare variable (rounded- then [--radius-md]) as the literal value, printing
    // `border-radius: --radius-md;`, so every card, button and field was square and every transition 0 s. The variable
    // form is the bracketed var(): rounded- then [var(--radius-md)]. Tailwind 4's parenthesised shorthand compiles too,
    // but tailwind-merge 2.6 (cn) does not know it, so cn() would keep it beside an override such as rounded-full and let
    // the stylesheet's order decide. Both spellings are refused. (Written apart here: Tailwind scans this file too.)
    const all = (dir: string): string[] =>
      readdirSync(dir).flatMap((name) => {
        const path = join(dir, name);
        return statSync(path).isDirectory() ? all(path) : /\.(tsx?|css)$/.test(path) ? [path] : [];
      });
    const bad: string[] = [];
    for (const file of all(SRC)) {
      const text = readFileSync(file, "utf8");
      for (const m of text.matchAll(/\b[a-z][\w:-]*-(?:\[--[A-Za-z][\w-]*\]|\(--[A-Za-z][\w-]*\))/g)) {
        bad.push(`${relative(process.cwd(), file)}:${text.slice(0, m.index).split("\n").length} ${m[0]}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
