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

describe("a table sits in a scroller and a page keeps its heading (A3-states-5, A3-states-9)", () => {
  /**
   * The JSX elements open around each `<table` in a file: a stack built from the opening and closing tags before it
   * (a self-closing tag is skipped, a closing tag pops back to its opener). A TypeScript generic such as `Promise<void>`
   * may sit on the stack as a stray "element"; it can only add ancestors, and no generic is called TableScroll or says
   * overflow-x-auto, so it cannot make a bare table pass.
   */
  function tablesOutsideAScroller(file: string, text: string): string[] {
    const scroller = (tag: string) =>
      /^<TableScroll\b/.test(tag) || (/overflow-x-auto/.test(tag) && /tabIndex=\{0\}/.test(tag) && /className="[^"]*\brelative\b/.test(tag));
    const stack: { name: string; tag: string }[] = [];
    const bad: string[] = [];
    for (const m of text.matchAll(/<(\/?)([A-Za-z][\w.]*)\b((?:[^<>]|=>|\{[^{}]*\})*)>/g)) {
      const [whole, close, name = "", attrs = ""] = m;
      if (close) {
        const at = stack.map((s) => s.name).lastIndexOf(name);
        if (at >= 0) stack.length = at;
        continue;
      }
      if (name === "table" && !stack.some((s) => scroller(s.tag))) bad.push(`${file}:${text.slice(0, m.index).split("\n").length}`);
      if (!attrs.trimEnd().endsWith("/")) stack.push({ name, tag: whole });
    }
    return bad;
  }

  // Pages meant for paper, where a scroller would cut the sheet: the substitution board for the staff room and the fee receipt.
  const PRINT_PAGES = ["src/app/(app)/admin/substitutions/print/page.tsx", "src/app/fees/receipts/[receiptId]/page.tsx"];

  it("every <table> on a screen is inside TableScroll or a scroller the B-06 rule accepts (print pages excepted)", () => {
    // /admin/payroll scrolled the whole page sideways by 108 px at 390 and /admin/alumni/college by 11: a bare table
    // widens the page, and the B-06 rule above only reads wrappers that already say overflow-x-auto. HTML e-mails
    // (src/lib/email.ts) are strings in a .ts file, not pages, and are not read.
    const bad = sources()
      .map((path) => [relative(process.cwd(), path), readFileSync(path, "utf8")] as const)
      .filter(([file, text]) => text.includes("<table") && !PRINT_PAGES.includes(file))
      .flatMap(([file, text]) => tablesOutsideAScroller(file, text));
    expect(bad).toEqual([]);
  });

  it("the print allow-list names files that exist and still hold a table", () => {
    for (const file of PRINT_PAGES) expect(readFileSync(join(process.cwd(), file), "utf8")).toContain("<table");
  });

  it("no page returns an EmptyState as its whole content, so its h1 cannot go missing", () => {
    // 47 routes had no <h1> (the walk of 5 October): the first-run page returned the EmptyState in place of its
    // PageHeader, and the EmptyState's title is an h2. Keep the PageHeader and put the EmptyState under it; where the
    // empty state IS the page (a signed-out invite that no longer works), it says heading="h1".
    // Read per `return` in each file under src/app: the returned JSX (to its closing parenthesis) is refused when the
    // EmptyState is all it opens with — nothing before it but plain <div>/<main>/<section> wrappers and {values} not
    // named like a header — and it carries no PageHeader, no <h1, no ModuleOff page and no heading="h1".
    const close = (text: string, from: number) => {
      let depth = 0;
      for (let i = from; i < text.length; i++) {
        if (text[i] === "(") depth++;
        else if (text[i] === ")" && --depth === 0) return i;
      }
      return text.length;
    };
    const bad: string[] = [];
    for (const path of sources(join(SRC, "app"))) {
      const text = readFileSync(path, "utf8");
      for (const m of text.matchAll(/\breturn\s*(\(|<)/g)) {
        const start = m.index + m[0].length - 1;
        const returned = m[1] === "(" ? text.slice(start, close(text, start)) : text.slice(start, text.indexOf(";", start));
        const at = returned.indexOf("<EmptyState");
        if (at < 0 || /<PageHeader\b|<h1\b|<ModuleOff\b[^>]*\bpage\b|heading="h1"/.test(returned)) continue;
        const before = returned
          .slice(0, at)
          .replace(/^\(/, "")
          .replace(/<(div|main|section)\b(?:[^<>]|=>|\{[^{}]*\})*>/g, "")
          .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
          .replace(/\{(?![^}]*header)[\w.]+\}/gi, "");
        if (before.trim() === "") bad.push(`${relative(process.cwd(), path)}:${text.slice(0, m.index).split("\n").length}`);
      }
    }
    expect(bad).toEqual([]);
  });
});

describe("one look for every text box, select and text area, and one radius spelling (A3-states-11)", () => {
  const code = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name);
      return statSync(path).isDirectory() ? code(path) : /\.tsx?$/.test(path) && !/\.test\.tsx?$/.test(path) ? [path] : [];
    });
  const at = (file: string, text: string, index: number | undefined) =>
    `${relative(process.cwd(), file)}:${text.slice(0, index).split("\n").length}`;

  /**
   * Each raw <input>, <select> and <textarea> opening tag in a file, read to its closing `>` with braces balanced, so a
   * tag whose onChange builds an object (`setX({ ...x })`) is read whole. The openingTags() helper above reads one level
   * of braces only and missed about ninety controls on forms like that.
   */
  function controls(text: string): { index: number; tag: string }[] {
    const out: { index: number; tag: string }[] = [];
    for (const m of text.matchAll(/<(?:input|select|textarea)\b/g)) {
      let i = m.index + m[0].length;
      for (let depth = 0; i < text.length; i++) {
        const c = text[i];
        if (c === "{") depth++;
        else if (c === "}") depth--;
        else if (c === ">" && depth === 0 && text[i - 1] !== "=") break;
      }
      out.push({ index: m.index, tag: text.slice(m.index, i + 1) });
    }
    return out;
  }

  // Not a field box: the command palette's search line is borderless inside the palette's own frame, and the join
  // code is a display-size entry (text-3xl, centred, green when found) that a student copies from the board.
  const NOT_A_FIELD = [
    "src/components/nav/command-palette.tsx",
    "src/app/join/student/flow.tsx",
    "src/app/join/student/existing-flow.tsx",
  ];

  it("no file keeps its own control class constant (the INPUT and inputClass families)", () => {
    // module-flash's INPUT (38 px), hostel's and the exam cell's exported inputClass and local copies in six pages were
    // five looks for one control. Comments are skipped (a doc comment may say INPUT in capitals).
    const bad: string[] = [];
    for (const file of code(SRC)) {
      const text = readFileSync(file, "utf8");
      for (const m of text.matchAll(/\b(?:INPUT|inputClass)\b/g)) {
        const line = text.slice(text.lastIndexOf("\n", m.index) + 1, text.indexOf("\n", m.index));
        if (/^\s*(\*|\/\/|\/\*)/.test(line)) continue;
        bad.push(`${at(file, text, m.index)} ${m[0]}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("every raw text box, select and text area with a class outside the kit takes it from fieldClass()", () => {
    // 100 controls measured 37–38 px at 390 (under the 44 px floor) because each page wrote its own class list.
    const bad: string[] = [];
    for (const file of sources()) {
      const rel = relative(process.cwd(), file);
      if (rel.startsWith("src/components/ui/") || NOT_A_FIELD.includes(rel)) continue;
      const text = readFileSync(file, "utf8");
      for (const { index, tag } of controls(text)) {
        if (/type="(?:checkbox|radio|hidden|file|range|color)"/.test(tag) || !/\bclassName=/.test(tag)) continue;
        if (!/\bclassName=\{fieldClass\(/.test(tag)) bad.push(at(file, text, index));
      }
    }
    expect(bad).toEqual([]);
  });

  it("the not-a-field list names files that still hold such a control", () => {
    for (const file of NOT_A_FIELD) expect(controls(readFileSync(join(process.cwd(), file), "utf8")).length).toBeGreaterThan(0);
  });

  it("no radius utility in the t-shirt spelling; the token form rounded-[var(--radius-…)] is the one spelling", () => {
    // Built from parts: Tailwind scans this file, and the literal class names here would put them back in the CSS.
    const sizes = ["sm", "md", "lg", "xl", "2xl", "3xl"].join("|");
    const shirt = new RegExp(`\\b${"round"}${"ed"}(?:-[tblrxyse]{1,2})?-(?:${sizes})\\b(?![\\w-])`, "g");
    const bad: string[] = [];
    for (const file of code(SRC)) {
      const text = readFileSync(file, "utf8");
      for (const m of text.matchAll(shirt)) bad.push(`${at(file, text, m.index)} ${m[0]}`);
    }
    expect(bad).toEqual([]);
  });
});

describe("pattern attributes (A3-journeys-28)", () => {
  it("every pattern= in src compiles under the v flag browsers use, so no client check is silently off", () => {
    // The terms page's \d{4}[–-]\d{2} threw "Invalid character in character class" in the
    // console and the academic-year check never ran: under /v a bare "-" in a class is an error.
    const found: string[] = [];
    const bad: string[] = [];
    for (const file of sources()) {
      const text = readFileSync(file, "utf8");
      for (const m of text.matchAll(/\bpattern=(?:"([^"]*)"|\{"((?:[^"\\]|\\.)*)"\})/g)) {
        const pattern = m[1] ?? (JSON.parse(`"${m[2]}"`) as string);
        found.push(pattern);
        try {
          new RegExp(`^(?:${pattern})$`, "v");
        } catch (error) {
          bad.push(`${relative(process.cwd(), file)}: ${pattern} (${(error as Error).message})`);
        }
      }
    }
    expect(found.length).toBeGreaterThan(0);
    expect(bad).toEqual([]);
  });

  it("the academic year's pattern still takes 2026-27 and 2026–27 and nothing else", () => {
    const text = readFileSync(join(SRC, "app/(app)/admin/academics/terms/page.tsx"), "utf8");
    const patterns = [...text.matchAll(/name="academicYear"[^>]*\bpattern="([^"]*)"/g)].map((m) => m[1]!);
    expect(patterns.length).toBe(2);
    for (const p of patterns) {
      const re = new RegExp(`^(?:${p})$`, "v");
      expect([re.test("2026-27"), re.test("2026–27"), re.test("2026/27"), re.test("26-27")]).toEqual([true, true, false, false]);
    }
  });
});
